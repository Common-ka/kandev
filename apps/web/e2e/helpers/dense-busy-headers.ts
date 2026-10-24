import type { Page } from "@playwright/test";
import type { ApiClient } from "./api-client";
import type { DenseThread } from "./dense-workbench-fixture";

export function parseDenseExtraBusyHeaders(
  value: string | undefined,
  layout: string,
  columns: number,
): number {
  const count = Number(value ?? 0);
  if (!Number.isInteger(count) || count < 0 || count > Math.max(0, columns - 6))
    throw new Error("Extra busy headers must be an integer within the non-producer column count");
  if (count > 0 && layout !== "columns")
    throw new Error("Extra busy headers require the columns layout");
  return count;
}

export async function seedDenseBusyHeaders(
  api: Pick<ApiClient, "seedTaskSession">,
  threads: Pick<DenseThread, "taskId" | "sessionId">[],
): Promise<void> {
  for (const thread of threads) {
    const seeded = await api.seedTaskSession(thread.taskId, {
      sessionId: thread.sessionId,
      state: "RUNNING",
    });
    if (seeded.session_id !== thread.sessionId)
      throw new Error("Busy-header seeding changed the session identity");
  }
}

export async function inspectDenseBusyHeaderMotion(page: Page) {
  return page.evaluate(() => {
    const icons = Array.from(
      document.querySelectorAll(
        '[data-testid="thread-status-working"], [data-testid="thread-status-starting"]',
      ),
    );
    const result = { targets: icons.length, running: 0, paused: 0 };
    for (const icon of icons) {
      for (const animation of icon.getAnimations()) {
        if (animation.playState === "running") result.running++;
        if (animation.playState === "paused") result.paused++;
      }
    }
    return result;
  });
}
