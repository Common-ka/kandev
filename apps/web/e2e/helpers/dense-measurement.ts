import { type CDPSession, type Page } from "@playwright/test";
import { attachGatewayTrafficCapture, summarizeGatewayTraffic } from "./ws-traffic";

type DenseStreamObservation = {
  at: number;
  elapsedMs: number;
  rows: Array<{ taskId: string; connected: boolean; lastTick: number | null }>;
};

export function denseStreamObservations(page: Page) {
  return page.evaluate(
    () =>
      (
        window as Window & {
          __denseWindow?: { streamProgress: DenseStreamObservation[] };
        }
      ).__denseWindow?.streamProgress ?? [],
  );
}

export function captureDenseTraffic(page: Page) {
  const traffic = attachGatewayTrafficCapture(page);
  const httpFailures: Array<{ at: number; path: string; status: number }> = [];
  page.on("response", (response) => {
    if (response.status() >= 400)
      httpFailures.push({
        at: Date.now(),
        path: new URL(response.url()).pathname,
        status: response.status(),
      });
  });
  const changes: Array<{
    sessionId: string;
    reset: boolean;
    revision?: string;
    operations: number;
  }> = [];
  const reads: Array<{
    at: number;
    action: string;
    sessionId?: string;
    cursor?: string;
    limit?: number;
  }> = [];
  page.on("websocket", (socket) => {
    if (!socket.url().endsWith("/ws")) return;
    socket.on("framereceived", ({ payload }) => {
      const frame = JSON.parse(payload.toString());
      if (frame.action === "session.conversation.changed")
        changes.push({
          sessionId: frame.payload.session_id,
          reset: frame.payload.reset === true,
          revision: frame.payload.revision,
          operations: frame.payload.operations?.length ?? 0,
        });
    });
    socket.on("framesent", ({ payload }) => {
      const frame = JSON.parse(payload.toString());
      if (frame.action === "message.list" || frame.action?.includes("conversation.read"))
        reads.push({
          at: Date.now(),
          action: frame.action,
          sessionId: frame.payload.session_id,
          cursor: frame.payload.cursor,
          limit: frame.payload.limit,
        });
    });
  });
  return {
    reset() {
      traffic.frames.length = 0;
      httpFailures.length = 0;
      changes.length = 0;
      reads.length = 0;
    },
    snapshot() {
      return {
        traffic: summarizeGatewayTraffic(traffic.frames),
        httpFailures: [...httpFailures],
        changes: [...changes],
        reads: [...reads],
      };
    },
    frames: traffic.frames,
  };
}

export async function beginDenseWindow(page: Page, cdp: CDPSession, streamTaskIds: string[] = []) {
  await page.evaluate((taskIds) => {
    const targets = taskIds.map((taskId) => {
      const tile = document.querySelector(`[data-testid="thread-column-${taskId}"]`);
      const body = Array.from(tile?.querySelectorAll("[data-agent-message-body]") ?? []).find(
        (element) => element.textContent?.includes("Dense canonical warmup"),
      );
      if (!body) throw new Error(`Missing dense stream body for ${taskId}`);
      return { taskId, body };
    });
    const started = performance.now();
    let lastProgressAt = started;
    const state = {
      frames: [] as number[],
      longTasks: [] as number[],
      last: performance.now(),
      stop: false,
      raf: 0,
      observer: null as PerformanceObserver | null,
      messageCommits: 0,
      streamProgress: [] as DenseStreamObservation[],
      unsubscribe: null as (() => void) | null,
    };
    const store = (
      window as Window & {
        __KANDEV_E2E_STORE__?: {
          subscribe: (
            listener: (
              next: { messages: { bySession: unknown } },
              previous: { messages: { bySession: unknown } },
            ) => void,
          ) => () => void;
        };
      }
    ).__KANDEV_E2E_STORE__;
    if (!store) throw new Error("Dense measurement requires the exposed application store");
    state.unsubscribe = store.subscribe((next, previous) => {
      if (next.messages.bySession !== previous.messages.bySession) state.messageCommits++;
    });
    const frame = (now: number) => {
      state.frames.push(now - state.last);
      state.last = now;
      if (targets.length && now - lastProgressAt >= 5_000) {
        lastProgressAt = now;
        const marker = "Dense canonical tick ";
        state.streamProgress.push({
          at: Date.now(),
          elapsedMs: now - started,
          rows: targets.map(({ taskId, body }) => {
            const content = body.textContent ?? "";
            const index = content.lastIndexOf(marker);
            return {
              taskId,
              connected: body.isConnected,
              lastTick:
                index < 0 ? null : Number.parseInt(content.slice(index + marker.length), 10),
            };
          }),
        });
      }
      if (!state.stop) state.raf = requestAnimationFrame(frame);
    };
    state.observer = new PerformanceObserver((list) => {
      for (const item of list.getEntries()) state.longTasks.push(item.duration);
    });
    state.observer.observe({ type: "longtask" });
    state.raf = requestAnimationFrame(frame);
    (window as Window & { __denseWindow?: typeof state }).__denseWindow = state;
  }, streamTaskIds);
  return { metrics: await cdp.send("Performance.getMetrics"), started: performance.now() };
}

export async function endDenseWindow(
  page: Page,
  cdp: CDPSession,
  before: Awaited<ReturnType<typeof beginDenseWindow>>,
) {
  const after = await cdp.send("Performance.getMetrics");
  const browser = await page.evaluate(() => {
    const state = (
      window as Window & {
        __denseWindow?: {
          frames: number[];
          longTasks: number[];
          stop: boolean;
          raf: number;
          observer: PerformanceObserver | null;
          messageCommits: number;
          streamProgress: DenseStreamObservation[];
          unsubscribe: (() => void) | null;
        };
      }
    ).__denseWindow!;
    state.stop = true;
    cancelAnimationFrame(state.raf);
    state.observer?.disconnect();
    state.unsubscribe?.();
    const animations: Record<string, number> = {};
    for (const animation of document.getAnimations())
      animations[animation.playState] = (animations[animation.playState] ?? 0) + 1;
    return {
      messageCommits: state.messageCommits,
      streamProgress: state.streamProgress,
      frameGapsMs: state.frames,
      longTasksMs: state.longTasks,
      domNodes: document.querySelectorAll("*").length,
      editors: document.querySelectorAll(".tiptap").length,
      animations,
    };
  });
  const metrics: Record<string, number> = {};
  for (const item of after.metrics) {
    const start = before.metrics.metrics.find((m) => m.name === item.name)?.value ?? 0;
    metrics[item.name] = item.value - start;
  }
  return { elapsedMs: performance.now() - before.started, metrics, browser };
}

export async function denseResources(page: Page) {
  return page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => {
      const resource = entry as PerformanceResourceTiming;
      return {
        path: new URL(resource.name).pathname,
        encodedBytes: resource.encodedBodySize,
        decodedBytes: resource.decodedBodySize,
        transferBytes: resource.transferSize,
      };
    }),
  );
}
