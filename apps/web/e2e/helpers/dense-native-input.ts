import type { Page } from "@playwright/test";

export type NativeInputEvent = {
  [key: string]: unknown;
  kind: string;
  at: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  defaultPrevented?: boolean;
};

export type NativeInputGesture = {
  wheel: Record<string, unknown>;
  before: NativeInputEvent[];
  events: NativeInputEvent[];
  tail: NativeInputEvent[];
  omittedEvents: number;
};

export type DenseNativeInput = {
  protocol: string;
  taskId: string;
  gestures: NativeInputGesture[];
  droppedGestures: number;
  disposed: boolean;
};

type InputObserverWindow = Window & {
  __KANDEV_DENSE_NATIVE_INPUT__?: { read: () => DenseNativeInput; dispose: () => void };
};

export const DENSE_NATIVE_INPUT_ATTRIBUTION =
  process.env.KANDEV_DENSE_NATIVE_INPUT_ATTRIBUTION === "1";

export async function installDenseNativeInputObserver(page: Page, taskId: string, enabled = true) {
  if (!enabled) return false;
  await page.evaluate((taskId) => {
    const win = window as InputObserverWindow;
    if (win.__KANDEV_DENSE_NATIVE_INPUT__) throw new Error("Native input observer already exists");
    const testId = `thread-column-${taskId}`;
    const selector = `[data-testid="${testId}"]`;
    const tile = document.querySelector(selector);
    const element = tile?.querySelector<HTMLElement>(".chat-message-list");
    if (!tile || !element) throw new Error("Native input observer target is missing");
    const expectedSessionId =
      tile.querySelector('[data-testid="session-chat"]')?.getAttribute("data-session-id") ?? null;
    const state: DenseNativeInput = {
      protocol: "native-input-v1",
      taskId,
      gestures: [],
      droppedGestures: 0,
      disposed: false,
    };
    const before: NativeInputEvent[] = [];
    const pendingFrames = new Set<number>();
    let active: NativeInputGesture | null = null;
    const snapshot = (kind: string): NativeInputEvent => {
      const liveTile =
        tile.isConnected && tile.getAttribute("data-testid") === testId
          ? tile
          : document.querySelector(selector);
      return {
        kind,
        at: performance.now(),
        observedAt: Date.now(),
        devicePixelRatio: window.devicePixelRatio,
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        clientWidth: element.clientWidth,
        connected: element.isConnected,
        liveTileSameNode: liveTile === tile,
        liveTranscriptSameNode: liveTile?.querySelector(".chat-message-list") === element,
        expectedSessionId,
        sessionId:
          liveTile
            ?.querySelector('[data-testid="session-chat"]')
            ?.getAttribute("data-session-id") ?? null,
        composer:
          liveTile?.querySelector(".thread-composer-disclosure")?.getAttribute("data-state") ??
          null,
      };
    };
    const append = (observation: NativeInputEvent, owner = active) => {
      before.push(observation);
      if (before.length > 16) before.shift();
      if (!owner || observation.at - Number(owner.wheel.at) > 6_000) return;
      if (owner.events.length < 64) owner.events.push(observation);
      else {
        owner.tail.push(observation);
        if (owner.tail.length > 16) {
          owner.tail.shift();
          owner.omittedEvents++;
        }
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (state.gestures.length >= 4) {
        active = null;
        state.droppedGestures++;
        return;
      }
      const path = event.composedPath();
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      const gesture: NativeInputGesture = {
        wheel: {
          ...snapshot("wheel"),
          timeStamp: event.timeStamp,
          eventAgeMs: performance.now() - event.timeStamp,
          isTrusted: event.isTrusted,
          deltaX: event.deltaX,
          deltaY: event.deltaY,
          deltaMode: event.deltaMode,
          ctrlKey: event.ctrlKey,
          clientX: event.clientX,
          clientY: event.clientY,
          targetWithinTranscript: path.includes(element),
          targetWithinTile: path.includes(tile),
          pathLength: path.length,
          path: path.slice(0, 12).map((node) =>
            node instanceof Element
              ? {
                  tag: node.tagName,
                  testId: node.getAttribute("data-testid"),
                  className:
                    typeof node.className === "string" ? node.className.slice(0, 180) : null,
                }
              : { tag: node === document ? "DOCUMENT" : "WINDOW" },
          ),
          transcriptBounds: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          },
          overflowAnchor: style.overflowAnchor,
          scrollBehavior: style.scrollBehavior,
        },
        before: [...before],
        events: [],
        tail: [],
        omittedEvents: 0,
      };
      state.gestures.push(gesture);
      active = gesture;
      const frame = requestAnimationFrame(() => {
        pendingFrames.delete(frame);
        if (!state.disposed)
          append(
            {
              ...snapshot("after-dispatch"),
              observationTiming: "first animation-frame callback after wheel dispatch",
              defaultPrevented: event.defaultPrevented,
              sameActiveGesture: active === gesture,
            },
            gesture,
          );
      });
      pendingFrames.add(frame);
    };
    const onScroll = (event: Event) => {
      if (event.target === element) append(snapshot(event.type));
    };
    const observer = new ResizeObserver(() => append(snapshot("resize")));
    observer.observe(element);
    document.addEventListener("wheel", onWheel, { passive: true, capture: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("scrollend", onScroll, { passive: true, capture: true });
    win.__KANDEV_DENSE_NATIVE_INPUT__ = {
      read: () => state,
      dispose: () => {
        state.disposed = true;
        active = null;
        for (const frame of pendingFrames) cancelAnimationFrame(frame);
        pendingFrames.clear();
        observer.disconnect();
        document.removeEventListener("wheel", onWheel, true);
        document.removeEventListener("scroll", onScroll, true);
        document.removeEventListener("scrollend", onScroll, true);
      },
    };
  }, taskId);
  return true;
}

export async function readDenseNativeInputObserver(page: Page): Promise<DenseNativeInput> {
  return page.evaluate(() => {
    const observer = (window as InputObserverWindow).__KANDEV_DENSE_NATIVE_INPUT__;
    if (!observer) throw new Error("Native input observer is not installed");
    return observer.read();
  });
}

export async function disposeDenseNativeInputObserver(page: Page) {
  await page.evaluate(() =>
    (window as InputObserverWindow).__KANDEV_DENSE_NATIVE_INPUT__?.dispose(),
  );
}

export async function captureDenseNativeInputObserver(
  page: Page,
  installed: boolean,
  checkpoint?: (evidence: Record<string, unknown>) => void,
) {
  if (!installed) return;
  const nativeInput = await readDenseNativeInputObserver(page).catch((error) => ({
    captureError: String(error),
  }));
  try {
    checkpoint?.({ nativeInput });
  } catch {
    // Diagnostic I/O must not replace the sample's original outcome.
  }
}
