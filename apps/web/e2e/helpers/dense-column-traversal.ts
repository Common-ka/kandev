import { expect, type Page } from "@playwright/test";
import type { DenseThread } from "./dense-workbench-fixture";

/** Runs after measured windows; column positions come from the pinned rendered deck. */
export async function verifyDenseColumnTraversal(
  page: Page,
  threads: DenseThread[],
  layout: string,
) {
  if (layout !== "columns") return;
  const ids = await page
    .getByTestId("threads-board")
    .locator("[data-thread-column-id]")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-thread-column-id")!),
    );
  expect(new Set(ids)).toEqual(new Set(threads.map((thread) => thread.taskId)));
  const positions = [...new Set([0, Math.floor((ids.length - 1) / 2), ids.length - 1, 0])];
  const visits = [...positions, 0];
  const observations = [];
  for (const position of visits) {
    const thread = threads.find((item) => item.taskId === ids[position])!;
    const column = page.getByTestId(`thread-column-${thread.taskId}`);
    await column.evaluate((element) =>
      element.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" }),
    );
    const chat = column.getByTestId("session-chat");
    await expect(chat).toHaveAttribute("data-session-id", thread.sessionId);
    await expect(chat).toHaveAttribute("data-detail-active", "true");
    await expect(
      column
        .locator("[data-agent-message-body]")
        .filter({
          hasText: new RegExp(`${thread.title} message|Dense canonical warmup`),
        })
        .last(),
    ).toBeVisible({ timeout: 30_000 });
    const loadedMessages = await page.evaluate((sessionId) => {
      const store = (
        window as Window & {
          __KANDEV_E2E_STORE__?: {
            getState: () => { messages: { bySession: Record<string, unknown[]> } };
          };
        }
      ).__KANDEV_E2E_STORE__!;
      return store.getState().messages.bySession[sessionId]?.length ?? 0;
    }, thread.sessionId);
    expect(loadedMessages).toBeGreaterThan(0);
    observations.push({
      position,
      taskId: thread.taskId,
      sessionId: thread.sessionId,
      loadedMessages,
    });
  }
  return { columnCount: ids.length, order: ids, visits: observations };
}
