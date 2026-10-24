import type { Page } from "@playwright/test";

export const BROWSER_READINESS_VERSION = "pointerdown-raf-v1";

export type BrowserEventReadiness = {
  version: "pointerdown-raf-v1";
  trusted: boolean;
  taskId: string;
  sessionId: string;
  eventAt: number;
  headerMs: number;
  transcriptMs: number;
  composerMs: number;
};

type ReadinessProbe = {
  result?: BrowserEventReadiness;
  cancel: () => void;
};

type ProbeWindow = Window & {
  __denseNavigationReadiness?: ReadinessProbe;
  __dockviewApi__?: import("dockview-react").DockviewApi;
};

export async function armNavigationReadiness(
  page: Page,
  destination: {
    taskId: string;
    sessionId: string;
    title: string;
    transcriptMarker: string;
    sessionTab?: boolean;
  },
) {
  await page.evaluate((destination) => {
    const win = window as ProbeWindow;
    win.__denseNavigationReadiness?.cancel();
    let frame = 0;
    const probe: ReadinessProbe = {
      cancel: () => {
        cancelAnimationFrame(frame);
        document.removeEventListener("pointerdown", onPointerDown, true);
      },
    };
    function destinationChat() {
      if (!win.__dockviewApi__?.getPanel(`session:${destination.sessionId}`)?.api.isVisible)
        return null;
      return document.querySelector(
        `[data-testid="session-chat"][data-session-id="${destination.sessionId}"]`,
      );
    }
    function matchesDestination(target: EventTarget | null) {
      if (!(target instanceof Element)) return false;
      if (destination.sessionTab)
        return Boolean(target.closest(`[data-testid="session-tab-${destination.sessionId}"]`));
      return (
        target.closest("[data-task-row-id]")?.getAttribute("data-task-row-id") ===
        destination.taskId
      );
    }
    function onPointerDown(event: PointerEvent) {
      if (!matchesDestination(event.target)) return;
      document.removeEventListener("pointerdown", onPointerDown, true);
      const eventAt = event.timeStamp;
      let headerMs: number | undefined;
      let transcriptMs: number | undefined;
      let composerMs: number | undefined;
      const sample = () => {
        const elapsed = performance.now() - eventAt;
        const header = document.querySelector('[data-testid="task-topbar-title"]');
        if (headerMs === undefined && header?.textContent?.trim() === destination.title)
          headerMs = elapsed;
        const chat = destinationChat();
        if (chat) {
          if (
            transcriptMs === undefined &&
            Array.from(chat.querySelectorAll("[data-agent-message-body]")).some((message) =>
              message.textContent?.includes(destination.transcriptMarker),
            )
          )
            transcriptMs = elapsed;
          if (composerMs === undefined && chat.querySelector('.tiptap[contenteditable="true"]'))
            composerMs = elapsed;
        }
        if (headerMs !== undefined && transcriptMs !== undefined && composerMs !== undefined) {
          probe.result = {
            version: "pointerdown-raf-v1",
            trusted: event.isTrusted,
            taskId: destination.taskId,
            sessionId: destination.sessionId,
            eventAt,
            headerMs,
            transcriptMs,
            composerMs,
          };
        } else frame = requestAnimationFrame(sample);
      };
      frame = requestAnimationFrame(sample);
    }
    win.__denseNavigationReadiness = probe;
    document.addEventListener("pointerdown", onPointerDown, true);
  }, destination);
  return {
    async finish(): Promise<BrowserEventReadiness> {
      await page.waitForFunction(
        () => Boolean((window as ProbeWindow).__denseNavigationReadiness?.result),
        undefined,
        { timeout: 30_000 },
      );
      return page.evaluate(() => (window as ProbeWindow).__denseNavigationReadiness!.result!);
    },
    async dispose() {
      await page.evaluate(() => {
        const win = window as ProbeWindow;
        win.__denseNavigationReadiness?.cancel();
        delete win.__denseNavigationReadiness;
      });
    },
  };
}
