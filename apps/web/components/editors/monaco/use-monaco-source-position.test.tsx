import { act, renderHook } from "@testing-library/react";
import type { editor } from "monaco-editor";
import { describe, expect, it, vi } from "vitest";
import type { SourcePositionHandle } from "../source-position";
import { useMonacoSourcePosition } from "./use-monaco-source-position";

function fakeEditor() {
  const model = {
    getOffsetAt: ({ lineNumber, column }: { lineNumber: number; column: number }) =>
      (lineNumber === 2 ? 4 : 0) + column - 1,
    getPositionAt: (offset: number) =>
      offset >= 4 ? { lineNumber: 2, column: offset - 3 } : { lineNumber: 1, column: offset + 1 },
    getValue: () => "one\ntwo",
  };
  const getModel = vi.fn(() => model);
  const listeners = new Set<() => void>();
  const instance = {
    getModel,
    getSelection: () => ({
      selectionStartLineNumber: 2,
      selectionStartColumn: 3,
      positionLineNumber: 1,
      positionColumn: 2,
    }),
    setSelection: vi.fn(),
    revealRangeInCenterIfOutsideViewport: vi.fn(),
    revealLineInCenter: vi.fn(),
    focus: vi.fn(),
    onDidChangeModel: (listener: () => void) => {
      listeners.add(listener);
      return { dispose: () => listeners.delete(listener) };
    },
  } as unknown as editor.IStandaloneCodeEditor;
  return { instance, getModel, changeModel: () => listeners.forEach((listener) => listener()) };
}

describe("Monaco source position handoff (AC-UI-MARKDOWN-FILE-EDITING-002.4)", () => {
  it("captures native reversed selection and restores source CRLF offsets", () => {
    const { instance } = fakeEditor();
    const callback = vi.fn();
    renderHook(() =>
      useMonacoSourcePosition({
        editor: instance,
        content: "one\r\ntwo",
        onSourcePositionHandle: callback,
      }),
    );
    const handle = callback.mock.lastCall![0] as SourcePositionHandle;
    expect(handle.capture()).toEqual({ selection: { anchor: 7, active: 1 }, nearestLine: 1 });
    handle.restore({ selection: { anchor: 7, active: 1 }, nearestLine: 1 });
    expect(instance.setSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        selectionStartLineNumber: 2,
        selectionStartColumn: 3,
        positionLineNumber: 1,
        positionColumn: 2,
      }),
    );
    expect(instance.revealRangeInCenterIfOutsideViewport).toHaveBeenCalled();
  });

  it("waits for a model and rejects a stale hidden or disposed handle", () => {
    const fake = fakeEditor();
    const model = fake.getModel();
    fake.getModel.mockReturnValue(null as unknown as typeof model);
    const callback = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ active }) =>
        useMonacoSourcePosition({
          editor: fake.instance,
          content: "one\ntwo",
          isActive: active,
          onSourcePositionHandle: callback,
        }),
      { initialProps: { active: true } },
    );
    expect(callback).not.toHaveBeenCalled();
    fake.getModel.mockReturnValue(model);
    act(fake.changeModel);
    const handle = callback.mock.lastCall![0] as SourcePositionHandle;
    handle.restore({ nearestLine: 2 });
    expect(fake.instance.revealLineInCenter).toHaveBeenCalledWith(2);
    rerender({ active: false });
    vi.mocked(fake.instance.setSelection).mockClear();
    handle.restore({ selection: { anchor: 0, active: 0 }, nearestLine: 1 });
    expect(fake.instance.setSelection).not.toHaveBeenCalled();
    unmount();
  });
});
