import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createContext } from "react";
const customSpanFixture = vi.hoisted(() => ({ enabled: false, parses: 0 }));

import { MemoizedMarkdown } from "./memoized-markdown";
vi.mock("@/components/shared/markdown-components", () => ({
  MarkdownFileLinkContext: createContext({}),
  MarkdownTaskContext: createContext(null),
  markdownComponents: {},
  rehypePlugins: [],
  remarkPlugins: [
    () => (tree: { children: { data?: object }[] }) => {
      customSpanFixture.parses++;
      if (customSpanFixture.enabled) tree.children[0].data = { hName: "span" };
    },
  ],
}));
const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
const motionSelector = "[data-chat-text-motion]";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  customSpanFixture.enabled = false;
  customSpanFixture.parses = 0;
  if (originalAnimate) Object.defineProperty(Element.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(Element.prototype, "animate");
});

// @covers AC-UI-CHAT-MOTION-001.1, AC-UI-CHAT-MOTION-001.4
describe("chat Markdown reveals", () => {
  it("parses an appended snapshot once while updating its motion state", () => {
    const view = render(<MemoizedMarkdown content="Single parse baseline" animateText />);
    customSpanFixture.parses = 0;
    view.rerender(<MemoizedMarkdown content="Single parse baseline appended" animateText />);
    expect(customSpanFixture.parses).toBe(1);
  });

  it("keeps existing Markdown nodes mounted through reveal and compaction", () => {
    vi.useFakeTimers();
    const content = "```typescript\nconst stable = true;\n```\n\nExisting text";
    const view = render(<MemoizedMarkdown content={content} animateText />);
    const code = view.container.querySelector("code");
    const paragraph = view.container.querySelector("p");
    expect(code).not.toBeNull();
    expect(paragraph).not.toBeNull();

    view.rerender(<MemoizedMarkdown content={`${content} and new text`} animateText />);
    expect(view.container.querySelector("code")).toBe(code);
    expect(view.container.querySelector("p")).toBe(paragraph);
    expect(view.container.querySelector(motionSelector)).not.toBeNull();

    act(() => vi.advanceTimersByTime(160));
    expect(view.container.querySelector(motionSelector)).toBeNull();
    expect(view.container.querySelector("code")).toBe(code);
    expect(view.container.querySelector("p")).toBe(paragraph);
    expect(paragraph?.textContent).toBe("Existing text and new text");
  });

  it("reveals only new prose while preserving formatting, selection text and code", () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }));
    Object.defineProperty(Element.prototype, "animate", { value: animate, configurable: true });
    const view = render(<MemoizedMarkdown content="Hello" animateText />);
    expect(animate).not.toHaveBeenCalled();
    view.rerender(<MemoizedMarkdown content="Hello **world** `code`" animateText />);
    expect(view.container.textContent).toBe("Hello world code");
    expect(view.container.querySelector("strong")?.textContent).toBe("world");
    expect(view.container.querySelector("code [data-chat-text-motion]")).toBeNull();
    expect(view.container.querySelectorAll(motionSelector).length).toBeGreaterThan(0);
    expect(animate).toHaveBeenCalled();
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(view.container);
    selection.addRange(range);
    expect(selection.toString()).toBe("Hello world code");
    selection.removeAllRanges();
  });
  it("cancels active effects on disable and does not replay on enable or rewrite", () => {
    const cancel = vi.fn();
    const handles: { cancel: () => void; effect: unknown }[] = [];
    const animate = vi.fn(() => {
      const handle = { cancel, effect: {} as unknown };
      handles.push(handle);
      return handle;
    });
    Object.defineProperty(Element.prototype, "animate", { value: animate, configurable: true });
    const view = render(<MemoizedMarkdown content="old" animateText />);
    view.rerender(<MemoizedMarkdown content="old new" animateText />);
    expect(animate).toHaveBeenCalled();
    view.rerender(<MemoizedMarkdown content="old new" animateText={false} />);
    expect(cancel).toHaveBeenCalled();
    expect(handles.every((handle) => handle.effect === null)).toBe(true);
    animate.mockClear();
    view.rerender(<MemoizedMarkdown content="old new" animateText />);
    view.rerender(<MemoizedMarkdown content="replacement" animateText />);
    expect(animate).not.toHaveBeenCalled();
    expect(view.container.textContent).toBe("replacement");
  });
  it("compacts finished ranges after a burst and leaves no timers on unmount", () => {
    vi.useFakeTimers();
    const view = render(<MemoizedMarkdown content="a" animateText />);
    for (let i = 1; i < 40; i++)
      view.rerender(<MemoizedMarkdown content={"a".repeat(i + 1)} animateText />);
    expect(view.container.querySelectorAll(motionSelector).length).toBeLessThanOrEqual(1);
    act(() => vi.advanceTimersByTime(160));
    expect(view.container.querySelectorAll(motionSelector)).toHaveLength(0);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});

it("retains the selected text while a reveal finishes and more text arrives", () => {
  vi.useFakeTimers();
  const view = render(<MemoizedMarkdown content="old" animateText />);
  view.rerender(<MemoizedMarkdown content="old selected" animateText />);
  const span = view.container.querySelector(motionSelector)!;
  const selection = window.getSelection()!;
  const range = document.createRange();
  range.selectNodeContents(span);
  selection.addRange(range);
  act(() => vi.advanceTimersByTime(160));
  expect(view.container.contains(span)).toBe(true);
  view.rerender(<MemoizedMarkdown content="old selected tail" animateText />);
  expect(view.container.contains(span)).toBe(true);
  expect(selection.toString()).toBe(" selected");
  act(() => {
    selection.removeAllRanges();
    document.dispatchEvent(new Event("selectionchange"));
  });
  expect(view.container.querySelector(motionSelector)).toBeNull();
  view.unmount();
  vi.useRealTimers();
});

it("preserves the caller's renderer for unmarked spans during text motion", () => {
  customSpanFixture.enabled = true;
  const components = {
    span: ({ children }: { children?: import("react").ReactNode }) => (
      <span data-custom-span>{children}</span>
    ),
  };
  const view = render(<MemoizedMarkdown content="old" components={components} animateText />);
  expect(view.container.querySelector("[data-custom-span]")?.textContent).toBe("old");
  view.rerender(<MemoizedMarkdown content="old new" components={components} animateText />);
  expect(view.container.querySelector("[data-custom-span]")?.textContent).toBe("old new");
  expect(view.container.querySelector("[data-custom-span] [data-chat-text-motion]")).not.toBeNull();
});
