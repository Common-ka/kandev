import { expect, type Page } from "@playwright/test";
import type { DenseThread } from "./dense-workbench-fixture";
import { captureDenseTraffic, denseResources } from "./dense-measurement";
import { inspectDenseColdFailure } from "./dense-cold-diagnostics";
import { denseViewportTaskIds } from "./dense-viewport";

export async function loadDenseCold(options: {
  page: Page;
  workspaceId: string;
  threads: DenseThread[];
  warmup: string;
  layout?: "grid" | "columns";
  totalColumns?: number;
  traffic: ReturnType<typeof captureDenseTraffic>;
  checkpoint?: (evidence: Record<string, unknown>) => void;
}) {
  const { page, workspaceId, threads, warmup, traffic, checkpoint, layout = "grid" } = options;
  try {
    const coldStart = performance.now();
    const response = await page.goto(`/threads?workspace=${workspaceId}`);
    const documentMs = performance.now() - coldStart;
    await expect(page.getByTestId("threads-board")).toBeVisible();
    const expectedColumns =
      layout === "columns" ? (options.totalColumns ?? threads.length) : threads.length;
    const columns = page.getByTestId("threads-board").locator("[data-thread-column-id]");
    await expect(columns).toHaveCount(expectedColumns);
    const taskIds = threads.map((thread) => thread.taskId);
    const visibleTaskIds =
      layout === "columns" ? await denseViewportTaskIds(page, taskIds) : taskIds;
    expect(visibleTaskIds.length).toBeGreaterThan(0);
    for (const thread of threads.filter((thread) => visibleTaskIds.includes(thread.taskId)))
      await expect(
        page
          .getByTestId(`thread-column-${thread.taskId}`)
          .locator("[data-agent-message-body]")
          .filter({ hasText: warmup }),
      ).toBeVisible({ timeout: 60_000 });
    const readyMs = performance.now() - coldStart;
    await expect
      .poll(
        () =>
          traffic.frames.filter(
            (f) => f.direction === "received" && f.action === "session.conversation.subscribe",
          ).length,
      )
      .toBeGreaterThanOrEqual(visibleTaskIds.length);
    return {
      documentMs,
      readyMs,
      visibleTaskIds,
      displayedColumns: await columns.count(),
      contentEncoding: response?.headers()["content-encoding"],
      resources: await denseResources(page),
      delivery: traffic.snapshot(),
    };
  } catch (error) {
    checkpoint?.({
      coldFailure: {
        ...(await inspectDenseColdFailure(page, threads)),
        delivery: traffic.snapshot(),
      },
    });
    throw error;
  }
}
