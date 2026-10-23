import type { Page } from "@playwright/test";
import type { DenseThread } from "./dense-workbench-fixture";

export async function inspectDenseColdFailure(page: Page, threads: DenseThread[]) {
  const at = Date.now();
  try {
    const rows = await page.evaluate((items) => {
      const state = (
        window as Window & {
          __KANDEV_E2E_STORE__?: {
            getState: () => { messages: { bySession: Record<string, unknown[]> } };
          };
        }
      ).__KANDEV_E2E_STORE__?.getState();
      return items.map(({ taskId, sessionId }) => {
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
    }, threads);
    return { at, rows };
  } catch (error) {
    return { at, error: String(error) };
  }
}
