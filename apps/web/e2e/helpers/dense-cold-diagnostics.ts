import type { Page } from "@playwright/test";
import type { DenseThread } from "./dense-workbench-fixture";

export async function inspectDenseColdFailure(page: Page, threads: DenseThread[]) {
  const requestedAt = Date.now();
  try {
    const observation = await page.evaluate((items) => {
      const observedAt = Date.now();
      const win = window as Window & {
        __KANDEV_E2E_EXPOSE_STORE__?: boolean;
        __KANDEV_E2E_STORE__?: {
          getState: () => { messages: { bySession: Record<string, unknown[]> } };
        };
      };
      const state = win.__KANDEV_E2E_STORE__?.getState();
      const board = document.querySelector('[data-testid="threads-board"]');
      const rect = board?.getBoundingClientRect();
      const navigation = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const rows = items.map(({ taskId, sessionId }) => {
        const tile = document.querySelector(`[data-testid="thread-column-${taskId}"]`);
        const historyStatus = ["unavailable", "retrying", "loading"].find((status) =>
          tile?.querySelector(`[data-testid="session-history-${status}"]`),
        );
        return {
          taskId,
          sessionId,
          mounted: Boolean(tile),
          loadedMessages: state?.messages.bySession[sessionId]?.length ?? null,
          historyStatus: historyStatus ?? null,
          errorDetail:
            tile?.querySelector('[data-testid="session-history-details"] p')?.textContent ?? null,
          warmupMounted: Array.from(tile?.querySelectorAll("[data-agent-message-body]") ?? []).some(
            (node) => node.textContent?.includes("Dense canonical warmup"),
          ),
        };
      });
      return {
        observedAt,
        pageState: {
          url: location.href,
          title: document.title,
          readyState: document.readyState,
          visibilityState: document.visibilityState,
          boardPresent: Boolean(board),
          boardRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
          storeRequested: win.__KANDEV_E2E_EXPOSE_STORE__ === true,
          storeExposed: Boolean(win.__KANDEV_E2E_STORE__),
          navigationTiming: navigation
            ? {
                responseStart: navigation.responseStart,
                responseEnd: navigation.responseEnd,
                domInteractive: navigation.domInteractive,
                domContentLoadedEventEnd: navigation.domContentLoadedEventEnd,
                loadEventEnd: navigation.loadEventEnd,
                duration: navigation.duration,
              }
            : null,
        },
        rows,
      };
    }, threads);
    return { at: requestedAt, requestedAt, ...observation, receivedAt: Date.now() };
  } catch (error) {
    return { at: requestedAt, requestedAt, receivedAt: Date.now(), error: String(error) };
  }
}
