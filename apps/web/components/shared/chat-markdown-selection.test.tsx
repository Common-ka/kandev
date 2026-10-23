import { cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useChatMarkdownMotion } from "./chat-markdown-motion";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.getSelection()?.removeAllRanges();
});

function appendText() {
  const view = renderHook(({ content }) => useChatMarkdownMotion(content, true), {
    initialProps: { content: "existing" },
  });
  view.rerender({ content: "existing appended" });
  return view.result.current;
}

it.each([false, true])("reads the current range when collapsed=%s", (collapsed) => {
  const { container } = render(<p>Selected text</p>);
  const range = document.createRange();
  range.selectNodeContents(container.firstChild!);
  if (collapsed) range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  const collapsedRead = vi.spyOn(selection, "isCollapsed", "get");

  expect(appendText()).toHaveLength(collapsed ? 1 : 0);
  expect(collapsedRead).not.toHaveBeenCalled();
});

it("reveals appended text when the selection has no range", () => {
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  const collapsedRead = vi.spyOn(selection, "isCollapsed", "get");
  expect(appendText()).toHaveLength(1);
  expect(collapsedRead).not.toHaveBeenCalled();
});

it.each([false, true])("preserves the browser's multiple-range result: %s", (collapsed) => {
  const collapsedRead = vi.fn(() => collapsed);
  const getRangeAt = vi.fn();
  vi.spyOn(window, "getSelection").mockReturnValue({
    rangeCount: 2,
    getRangeAt,
    get isCollapsed() {
      return collapsedRead();
    },
  } as unknown as Selection);
  expect(appendText()).toHaveLength(collapsed ? 1 : 0);
  expect(collapsedRead).toHaveBeenCalled();
  expect(getRangeAt).not.toHaveBeenCalled();
});
