import { expect, type Page } from "@playwright/test";
import type { DenseThread } from "./dense-workbench-fixture";
import {
  captureDenseColumnFailure,
  type DenseColumnDiagnosticOptions,
  type DenseColumnProgress,
} from "./dense-column-diagnostics";

/** Runs after measured windows; column positions come from the pinned rendered deck. */
export async function verifyDenseColumnTraversal(
  page: Page,
  threads: DenseThread[],
  layout: string,
  options: DenseColumnDiagnosticOptions = {},
) {
  if (layout !== "columns") return;
  const progress: DenseColumnProgress = { order: [], visits: [], failedVisit: null };
  try {
    return await traverseColumns(page, threads, progress);
  } catch (error) {
    await captureDenseColumnFailure(page, progress, error, options);
    throw error;
  }
}

async function traverseColumns(page: Page, threads: DenseThread[], progress: DenseColumnProgress) {
  const ids = await page
    .getByTestId("threads-board")
    .locator("[data-thread-column-id]")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-thread-column-id")!),
    );
  progress.order = ids;
  expect(new Set(ids)).toEqual(new Set(threads.map((thread) => thread.taskId)));
  const positions = [...new Set([0, Math.floor((ids.length - 1) / 2), ids.length - 1, 0])];
  const visits = [...positions, 0];
  const observations = progress.visits;
  for (const [index, position] of visits.entries()) {
    const thread = threads.find((item) => item.taskId === ids[position])!;
    progress.failedVisit = {
      index,
      position,
      taskId: thread.taskId,
      sessionId: thread.sessionId,
      stage: "scroll",
    };
    const column = page.getByTestId(`thread-column-${thread.taskId}`);
    await column.evaluate((element) =>
      element.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" }),
    );
    const chat = column.getByTestId("session-chat");
    progress.failedVisit.stage = "session-id";
    await expect(chat).toHaveAttribute("data-session-id", thread.sessionId);
    progress.failedVisit.stage = "detail-active";
    await expect(chat).toHaveAttribute("data-detail-active", "true");
    progress.failedVisit.stage = "content";
    await expect(
      column
        .locator("[data-agent-message-body]")
        .filter({
          hasText: new RegExp(`${thread.title} message|Dense canonical warmup`),
        })
        .last(),
    ).toBeVisible({ timeout: 30_000 });
    progress.failedVisit.stage = "loaded-messages";
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
