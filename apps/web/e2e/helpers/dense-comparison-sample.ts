import fs from "node:fs";
import { expect, type Browser, type CDPSession, type Page } from "@playwright/test";
import type { BackendContext } from "../fixtures/backend";
import type { SeedData } from "../fixtures/test-base";
import type { ApiClient } from "./api-client";
import { DENSE_WORKLOAD, type DenseThread } from "./dense-workbench-fixture";
import { loadDenseHistory } from "./dense-history";
import { prepareDenseStream } from "./dense-canonical-stream";
import {
  beginDenseWindow,
  captureDenseTraffic,
  denseResources,
  endDenseWindow,
} from "./dense-measurement";
import { dwell } from "./causal-waits";

async function startDenseProfile(cdp: CDPSession, profilePath?: string) {
  if (!profilePath) return;
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.start");
}

async function saveDenseProfile(cdp: CDPSession, profilePath?: string) {
  if (!profilePath) return;
  const profile = await cdp.send("Profiler.stop");
  fs.writeFileSync(profilePath, JSON.stringify(profile.profile));
}

function denseScenarios(historyMode: string, profilePath?: string) {
  return historyMode === "all" || profilePath
    ? (["streaming"] as const)
    : (["idle", "streaming", "reduced-motion-idle"] as const);
}

export async function runDenseSample(options: {
  browser: Browser;
  backend: BackendContext;
  api: ApiClient;
  seed: SeedData;
  threads: DenseThread[];
  sample: string;
  cpuRate: number;
  profilePath?: string;
  checkpoint?: (evidence: Record<string, unknown>) => void;
}) {
  const { browser, backend, api, seed, threads, sample, cpuRate } = options;
  const stream = await prepareDenseStream(api, seed, backend, threads, sample);
  const context = await browser.newContext({
    baseURL: backend.frontendUrl,
    viewport: { width: 1470, height: 956 },
    deviceScaleFactor: 2,
    locale: "en-US",
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.addInitScript((port) => {
    localStorage.setItem("kandev.onboarding.completed", "true");
    window.__KANDEV_API_PORT = port;
    window.__KANDEV_E2E_EXPOSE_STORE__ = true;
    performance.setResourceTimingBufferSize(10_000);
  }, String(backend.port));
  const traffic = captureDenseTraffic(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
  try {
    const coldStart = performance.now();
    const response = await page.goto(`/threads?workspace=${seed.workspaceId}`);
    const documentMs = performance.now() - coldStart;
    await expect(page.getByTestId("threads-board")).toBeVisible();
    for (const thread of threads)
      await expect(
        page
          .getByTestId(`thread-column-${thread.taskId}`)
          .locator("[data-agent-message-body]")
          .filter({ hasText: stream.warmup }),
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
    const cold = {
      documentMs,
      readyMs,
      contentEncoding: response?.headers()["content-encoding"],
      resources: await denseResources(page),
      delivery: traffic.snapshot(),
    };
    options.checkpoint?.({ cold });
    const historyMode = process.env.KANDEV_DENSE_HISTORY === "all" ? "all" : "newest-window";
    let historyLoadMs = 0;
    if (historyMode === "all") {
      const historyStart = performance.now();
      await loadDenseHistory(page, threads, (historyLoading) =>
        options.checkpoint?.({
          historyLoading,
          historyLoadingElapsedMs: performance.now() - historyStart,
        }),
      );
      historyLoadMs = performance.now() - historyStart;
      for (const thread of threads)
        await expect(
          page
            .getByTestId(`thread-column-${thread.taskId}`)
            .locator("[data-agent-message-body]")
            .filter({ hasText: stream.warmup }),
        ).toBeVisible();
    }
    const initialLoadedHistory = await loadedDenseHistory(page, threads);
    options.checkpoint?.({ historyMode, historyLoadMs, initialLoadedHistory });
    const runs = [];
    const scenarios = denseScenarios(historyMode, options.profilePath);
    for (const scenario of scenarios) {
      if (scenario === "reduced-motion-idle") await page.emulateMedia({ reducedMotion: "reduce" });
      traffic.reset();
      await startDenseProfile(cdp, options.profilePath);
      const before = await beginDenseWindow(page, cdp);
      if (scenario === "streaming") stream.release();
      await dwell(
        DENSE_WORKLOAD.durationMs,
        "clock-separation",
        `fixed ${scenario} performance observation window`,
      );
      const deadline = {
        elapsedMs: performance.now() - before.started,
        metrics: await cdp.send("Performance.getMetrics"),
        delivery: traffic.snapshot(),
      };
      if (scenario === "streaming") await stream.waitForVisible(page);
      const measured = await endDenseWindow(page, cdp, before);
      await saveDenseProfile(cdp, options.profilePath);
      const delivery = traffic.snapshot();
      runs.push({ scenario, deadline, ...measured, delivery });
      options.checkpoint?.({ cold, runs, historyMode, initialLoadedHistory });
      if (scenario === "streaming") {
        try {
          await stream.verify();
        } finally {
          options.checkpoint?.({
            cold,
            runs,
            historyMode,
            initialLoadedHistory,
            verificationErrors: stream.verificationErrors,
          });
        }
      }
    }
    const history = await loadedDenseHistory(page, threads);
    return {
      sample,
      historyMode,
      historyLoadMs,
      initialLoadedHistory,
      cpuRate,
      browser: browser.version(),
      viewport: { width: 1470, height: 956, scale: 2 },
      scheduledUpdates: stream.scheduledUpdates,
      verificationErrors: stream.verificationErrors,
      cold,
      runs,
      loadedHistory: history,
    };
  } finally {
    await context.close();
    await stream.finish();
  }
}

async function loadedDenseHistory(page: Page, threads: DenseThread[]) {
  return page.evaluate(
    (ids) => {
      const state = (
        window as Window & {
          __KANDEV_E2E_STORE__?: {
            getState: () => { messages: { bySession: Record<string, unknown[]> } };
          };
        }
      ).__KANDEV_E2E_STORE__!.getState();
      return ids.map((id) => ({
        sessionId: id,
        messages: state.messages.bySession[id]?.length ?? 0,
      }));
    },
    threads.map((thread) => thread.sessionId),
  );
}
