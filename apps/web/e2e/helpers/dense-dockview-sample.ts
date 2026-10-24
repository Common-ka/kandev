import fs from "node:fs";
import { expect, type Browser, type CDPSession, type Page } from "@playwright/test";
import type { BackendContext } from "../fixtures/backend";
import type { SeedData } from "../fixtures/test-base";
import type { ApiClient } from "./api-client";
import type { DenseDockviewFixture } from "./dense-dockview-fixture";
import { prepareDenseDockviewLayout, inspectDenseDockviewLayout } from "./dense-dockview-layout";
import { installDenseDockviewPlugin, mountDenseDockviewPlugin } from "./dense-dockview-plugin";
import {
  captureDockviewPluginTraffic,
  inspectDockviewHistory,
} from "./dense-dockview-observations";
import { prepareDenseStream } from "./dense-canonical-stream";
import { inspectDenseBrowserProgress } from "./dense-stream-progress";
import { beginDenseWindow, captureDenseTraffic, endDenseWindow } from "./dense-measurement";
import { DENSE_WORKLOAD } from "./dense-workbench-fixture";
import { DENSE_VISIBILITY_PROBE } from "./dense-visible";
import { dwell } from "./causal-waits";
import { SessionPage } from "../pages/session-page";

type Stream = Awaited<ReturnType<typeof prepareDenseStream>>;
type Checkpoint = (evidence: Record<string, unknown>) => void;
const HIDDEN_DRAFT = "Keep this hidden Dockview draft while streams update";

async function startDockviewProfile(cdp: CDPSession, profilePath?: string) {
  if (!profilePath) return;
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.start");
}

async function saveDockviewProfile(cdp: CDPSession, profilePath?: string) {
  if (!profilePath) return;
  const { profile } = await cdp.send("Profiler.stop");
  fs.writeFileSync(profilePath, JSON.stringify(profile));
}

async function inspectDockviewProfileAnimations(page: Page, profilePath?: string) {
  if (!profilePath) return;
  return page.evaluate(() => ({
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    visibilityState: document.visibilityState,
    animations: document.getAnimations().map((animation) => {
      const effect = animation.effect instanceof KeyframeEffect ? animation.effect : null;
      const ancestors = [];
      let element = effect?.target ?? null;
      for (let depth = 0; element && depth < 7; depth++, element = element.parentElement)
        ancestors.push({
          tag: element.tagName,
          className: element.getAttribute("class"),
          testId: element.getAttribute("data-testid"),
        });
      return {
        name: animation instanceof CSSAnimation ? animation.animationName : null,
        playState: animation.playState,
        iterations: String(effect?.getTiming().iterations),
        ancestors,
      };
    }),
  }));
}

async function waitForDockviewStream(
  page: Page,
  stream: Stream,
  sessionIds: string[],
  checkpoint?: Checkpoint,
) {
  try {
    await stream.waitForVisible(page, sessionIds, "dockview");
  } catch (error) {
    checkpoint?.({ streamFailure: await stream.inspect(page, "dockview") });
    throw error;
  }
}

async function prepareDockviewSample(page: Page, fixture: DenseDockviewFixture, stream: Stream) {
  const plugin =
    process.env.KANDEV_DENSE_DOCKVIEW_PLUGIN === "1"
      ? await installDenseDockviewPlugin(page)
      : null;
  await page.goto(`/t/${fixture.dockview.taskId}`);
  const session = new SessionPage(page);
  await session.waitForLoad();
  await prepareDenseDockviewLayout(page, fixture);
  const hiddenId = fixture.dockview.hiddenSessionId;
  await page.getByTestId(`session-tab-${hiddenId}`).click();
  const hiddenChat = page.locator(`[data-testid="session-chat"][data-session-id="${hiddenId}"]`);
  await expect(
    hiddenChat.locator("[data-agent-message-body]").filter({ hasText: stream.warmup }),
  ).toBeVisible();
  await hiddenChat.locator(".tiptap").fill(HIDDEN_DRAFT);
  await page.getByTestId(`session-tab-${fixture.dockview.visibleSessionIds[0]}`).click();
  await expect(hiddenChat).toBeHidden();
  if (plugin) {
    await mountDenseDockviewPlugin(page, fixture.dockview.visibleSessionIds);
    await expect(page.getByTestId("fixture-prompt-history-row")).toHaveCount(2);
  }
  for (const id of fixture.dockview.visibleSessionIds) {
    await expect(
      page
        .locator(`[data-testid="session-chat"][data-session-id="${id}"]`)
        .locator("[data-agent-message-body]")
        .filter({ hasText: stream.warmup }),
    ).toBeVisible();
  }
  await expect(session.fileTreeNode("navigation-available")).toBeVisible();
  await expect(page.getByTestId("plan-panel")).toContainText("Verify deterministic step 1.");
  return plugin;
}

async function revealHiddenStream(page: Page, fixture: DenseDockviewFixture, stream: Stream) {
  const sessionId = fixture.dockview.hiddenSessionId;
  await page.getByTestId(`session-tab-${sessionId}`).click();
  await stream.waitForVisible(page, [sessionId], "dockview");
  await stream.assertVisible(page, [sessionId], "dockview");
  await expect(
    page.locator(`[data-testid="session-chat"][data-session-id="${sessionId}"] .tiptap`),
  ).toHaveText(HIDDEN_DRAFT);
  const progress = await inspectDenseBrowserProgress(
    page,
    fixture.dockview.producers.filter((thread) => thread.sessionId === sessionId),
    "dockview",
  );
  expect(progress).toEqual([
    {
      sessionId,
      mounted: true,
      at: expect.any(Number),
      count: stream.scheduledUpdates / 6,
      uniqueCount: stream.scheduledUpdates / 6,
      lastTick: stream.scheduledUpdates / 6 - 1,
    },
  ]);
  return {
    sessionId,
    progress,
    draftPreserved: true,
    layout: await inspectDenseDockviewLayout(page),
  };
}

export async function runDenseDockviewSample(options: {
  browser: Browser;
  backend: BackendContext;
  api: ApiClient;
  seed: SeedData;
  fixture: DenseDockviewFixture;
  sample: string;
  cpuRate: number;
  profilePrefix?: string;
  checkpoint?: Checkpoint;
}) {
  const { browser, backend, api, seed, fixture, sample, cpuRate, checkpoint } = options;
  const stream = await prepareDenseStream(api, seed, backend, fixture.dockview.producers, sample);
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
  }, String(backend.port));
  const traffic = captureDenseTraffic(page);
  const pluginTraffic = captureDockviewPluginTraffic(page);
  const cdp = await context.newCDPSession(page);
  const throttleAfterLoad = process.env.KANDEV_DENSE_THROTTLE_AFTER_LOAD === "1";
  const coldCpuRate = throttleAfterLoad ? 1 : cpuRate;
  await cdp.send("Performance.enable", { timeDomain: "timeTicks" });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: coldCpuRate });
  try {
    const setupStarted = performance.now();
    const plugin = await prepareDockviewSample(page, fixture, stream);
    const setup = {
      elapsedMs: performance.now() - setupStarted,
      delivery: traffic.snapshot(),
      pluginTraffic: pluginTraffic.snapshot(),
      layout: await inspectDenseDockviewLayout(page),
      history: await inspectDockviewHistory(
        page,
        fixture.dockview.producers.map((t) => t.sessionId),
      ),
    };
    checkpoint?.({ setup, plugin });
    expect(
      setup.history.find((row) => row.sessionId === fixture.dockview.hiddenSessionId),
    ).toMatchObject({ mounted: true, detailActive: false, chatEditors: 1 });
    if (throttleAfterLoad) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
    const runs = [];
    for (const scenario of ["idle", "streaming", "reduced-motion-idle"] as const) {
      if (scenario === "reduced-motion-idle") await page.emulateMedia({ reducedMotion: "reduce" });
      const layoutBefore = await inspectDenseDockviewLayout(page);
      traffic.reset();
      pluginTraffic.reset();
      const profilePath = options.profilePrefix
        ? `${options.profilePrefix}.${scenario}.cpuprofile`
        : undefined;
      await startDockviewProfile(cdp, profilePath);
      const before = await beginDenseWindow(page, cdp);
      if (scenario === "streaming") stream.release();
      await dwell(
        DENSE_WORKLOAD.durationMs,
        "clock-separation",
        `fixed Dockview ${scenario} observation window`,
      );
      const deadline = {
        elapsedMs: performance.now() - before.started,
        metrics: await cdp.send("Performance.getMetrics"),
        delivery: traffic.snapshot(),
        pluginTraffic: pluginTraffic.snapshot(),
        streamProgress: await inspectDenseBrowserProgress(
          page,
          fixture.dockview.producers,
          "dockview",
        ),
      };
      checkpoint?.({ observing: scenario, deadline });
      if (scenario === "streaming")
        await waitForDockviewStream(page, stream, fixture.dockview.visibleSessionIds, checkpoint);
      const measured = await endDenseWindow(page, cdp, before);
      await saveDockviewProfile(cdp, profilePath);
      const delivery = traffic.snapshot();
      const pluginDelivery = pluginTraffic.snapshot();
      const layoutAfter = await inspectDenseDockviewLayout(page);
      runs.push({
        scenario,
        deadline,
        ...measured,
        delivery,
        pluginTraffic: pluginDelivery,
        layoutBefore,
        layoutAfter,
        animationDiagnostics: await inspectDockviewProfileAnimations(page, options.profilePrefix),
      });
      checkpoint?.({ runs });
      if (scenario === "streaming") {
        try {
          await stream.verify();
        } finally {
          checkpoint?.({ verificationErrors: stream.verificationErrors });
        }
      }
    }
    await stream.assertVisible(page, fixture.dockview.visibleSessionIds, "dockview");
    const hiddenCatchup = await revealHiddenStream(page, fixture, stream);
    return {
      sample,
      profilePrefix: options.profilePrefix,
      workbenchSurface: "dockview",
      finalVisibilityProbe: DENSE_VISIBILITY_PROBE,
      plugin,
      cpuRate,
      coldCpuRate,
      throttleAfterLoad,
      browser: browser.version(),
      viewport: { width: 1470, height: 956, scale: 2 },
      setup,
      runs,
      hiddenCatchup,
      scheduledUpdates: stream.scheduledUpdates,
      verificationErrors: stream.verificationErrors,
    };
  } finally {
    await context.close();
    await stream.finish();
  }
}
