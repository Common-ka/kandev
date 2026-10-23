import { expect, type Page } from "@playwright/test";
import type { DenseThread } from "./dense-workbench-fixture";
import { captureDenseTraffic, denseResources } from "./dense-measurement";
import { inspectDenseColdFailure } from "./dense-cold-diagnostics";

export async function loadDenseCold(options: {
  page: Page;
  workspaceId: string;
  threads: DenseThread[];
  warmup: string;
  traffic: ReturnType<typeof captureDenseTraffic>;
  checkpoint?: (evidence: Record<string, unknown>) => void;
}) {
  const { page, workspaceId, threads, warmup, traffic, checkpoint } = options;
  try {
    const coldStart = performance.now();
    const response = await page.goto(`/threads?workspace=${workspaceId}`);
    const documentMs = performance.now() - coldStart;
    await expect(page.getByTestId("threads-board")).toBeVisible();
    for (const thread of threads)
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
      .toBeGreaterThanOrEqual(threads.length);
    return {
      documentMs,
      readyMs,
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
