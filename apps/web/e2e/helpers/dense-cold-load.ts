import { expect, type Page, type Request } from "@playwright/test";
import type { DenseThread } from "./dense-workbench-fixture";
import { captureDenseTraffic, denseResources } from "./dense-measurement";
import { inspectDenseColdFailure } from "./dense-cold-diagnostics";
import { captureDenseFailureImage } from "./dense-evidence";
import { denseViewportTaskIds } from "./dense-viewport";

type ColdOptions = {
  page: Page;
  workspaceId: string;
  threads: DenseThread[];
  warmup: string;
  layout?: "grid" | "columns";
  totalColumns?: number;
  traffic: ReturnType<typeof captureDenseTraffic>;
  checkpoint?: (evidence: Record<string, unknown>) => void;
  failureArtifactPrefix?: string;
};

type ColdNavigation = {
  startedAt: number;
  documentMs: number | null;
  responseStatus: number | null;
};

function captureColdErrors(page: Page) {
  const pageErrors: Array<{ name: string; message: string; stack?: string }> = [];
  const requestFailures: Array<{ path: string; method: string; error: string | null }> = [];
  const onError = (error: Error) =>
    pageErrors.push({ name: error.name, message: error.message, stack: error.stack });
  const onRequest = (request: Request) =>
    requestFailures.push({
      path: new URL(request.url()).pathname,
      method: request.method(),
      error: request.failure()?.errorText ?? null,
    });
  page.on("pageerror", onError);
  page.on("requestfailed", onRequest);
  return {
    snapshot: () => ({ pageErrors: [...pageErrors], requestFailures: [...requestFailures] }),
    dispose() {
      page.off("pageerror", onError);
      page.off("requestfailed", onRequest);
    },
  };
}

async function measureDenseCold(
  options: ColdOptions,
  navigation: ColdNavigation,
  coldStart: number,
) {
  const { page, workspaceId, threads, warmup, traffic, layout = "grid" } = options;
  const response = await page.goto(`/threads?workspace=${workspaceId}`);
  const documentMs = performance.now() - coldStart;
  navigation.documentMs = documentMs;
  navigation.responseStatus = response?.status() ?? null;
  await expect(page.getByTestId("threads-board")).toBeVisible();
  const expectedColumns =
    layout === "columns" ? (options.totalColumns ?? threads.length) : threads.length;
  const columns = page.getByTestId("threads-board").locator("[data-thread-column-id]");
  await expect(columns).toHaveCount(expectedColumns);
  const taskIds = threads.map((thread) => thread.taskId);
  const visibleTaskIds = layout === "columns" ? await denseViewportTaskIds(page, taskIds) : taskIds;
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
}

export async function loadDenseCold(options: ColdOptions) {
  const { page, threads, traffic, checkpoint, failureArtifactPrefix } = options;
  const errors = captureColdErrors(page);
  const navigation: ColdNavigation = {
    startedAt: Date.now(),
    documentMs: null,
    responseStatus: null,
  };
  const coldStart = performance.now();
  try {
    return await measureDenseCold(options, navigation, coldStart);
  } catch (error) {
    const failureElapsedMs = performance.now() - coldStart;
    const observation = await inspectDenseColdFailure(page, threads);
    const image = await captureDenseFailureImage(
      page,
      failureArtifactPrefix ? `${failureArtifactPrefix}.cold.png` : undefined,
    );
    checkpoint?.({
      coldFailure: {
        ...observation,
        error: String(error),
        navigation: { ...navigation, failureElapsedMs },
        ...errors.snapshot(),
        image,
        delivery: traffic.snapshot(),
      },
    });
    throw error;
  } finally {
    errors.dispose();
  }
}
