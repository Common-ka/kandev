import fs from "node:fs";
import { expect, type Browser, type BrowserContext } from "@playwright/test";
import type { BackendContext } from "../fixtures/backend";
import { routeNavigationResponses } from "./navigation-response-hold";
import { beginDenseWindow, endDenseWindow } from "./dense-measurement";
import { selectNavigationTask, saveExpandedPaths } from "../tests/task/task-navigation-helpers";
import {
  PROFILE_FOLDERS,
  measureSelection,
  type prepareProfileTask,
} from "../tests/task/task-navigation-profile-helpers";
import type { ApiClient } from "./api-client";
import type { SeedData } from "../fixtures/test-base";
import { waitForSessionDone } from "./session";
import { BROWSER_READINESS_VERSION } from "./navigation-browser-readiness";
import { SessionPage } from "../pages/session-page";

export async function runDenseNavigationSample(options: {
  browser: Browser;
  backend: BackendContext;
  api: ApiClient;
  seed: SeedData;
  items: Awaited<ReturnType<typeof prepareProfileTask>>[];
  storageState: Awaited<ReturnType<BrowserContext["storageState"]>>;
  sessionStorageState: Record<string, string>;
  cpuRate: number;
  pair: number;
  sample: string;
  profileFile: string;
  profileTimedSwitches?: boolean;
  navigationReadiness: "driver" | typeof BROWSER_READINESS_VERSION;
}) {
  const {
    browser,
    backend,
    items,
    storageState,
    sessionStorageState,
    cpuRate,
    pair,
    sample,
    profileFile,
    profileTimedSwitches,
    navigationReadiness,
  } = options;
  const selectionOptions = { browserReadiness: navigationReadiness === BROWSER_READINESS_VERSION };
  for (const item of items) {
    await options.api.launchSession({
      task_id: item.task.id,
      session_id: item.task.session_id!,
      agent_profile_id: options.seed.agentProfileId,
      executor_profile_id: options.seed.worktreeExecutorProfileId,
      workflow_step_id: options.seed.startStepId,
      prompt: "/e2e:simple-message",
      intent: "start_created",
    });
    await waitForSessionDone(
      options.api,
      item.task.id,
      item.task.session_id!,
      "Navigation sample agents settled",
      60_000,
    );
  }
  const context = await browser.newContext({
    baseURL: backend.frontendUrl,
    viewport: { width: 1470, height: 956 },
    deviceScaleFactor: 2,
    locale: "en-US",
    storageState,
  });
  try {
    const page = await context.newPage();
    await page.addInitScript(
      ({ port, sessionStorageState }) => {
        window.__KANDEV_API_PORT = port;
        window.__KANDEV_E2E_EXPOSE_STORE__ = true;
        for (const [key, value] of Object.entries(sessionStorageState))
          sessionStorage.setItem(key, value);
      },
      { port: String(backend.port), sessionStorageState },
    );
    const gate = await routeNavigationResponses(page);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable", { timeDomain: "timeTicks" });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
    await page.goto(`/t/${items[0].task.id}`);
    await new SessionPage(page).waitForLoad();
    for (const item of items) {
      await selectNavigationTask(page, item.task.title);
      const session = new SessionPage(page);
      await session.clickTab("Files");
      await expect(session.fileTreeNode("navigation-available")).toBeVisible();
      await saveExpandedPaths(page, item.task.session_id!, PROFILE_FOLDERS);
      await page.reload();
      await session.waitForLoad();
      await session.clickTab("Files");
      await expect(session.fileTreeNode(item.marker)).toBeVisible();
    }
    for (let i = 0; i < 5; i++)
      await measureSelection(page, gate, items[(i + 1) % 2], selectionOptions);
    if (profileTimedSwitches) {
      await cdp.send("Profiler.enable");
      await cdp.send("Profiler.start");
    }
    const before = await beginDenseWindow(page, cdp);
    const selections = [];
    const switchCount = Number(process.env.KANDEV_DENSE_NAV_SWITCHES ?? 40);
    for (let i = 0; i < switchCount; i++)
      selections.push(await measureSelection(page, gate, items[i % 2], selectionOptions));
    const measured = await endDenseWindow(page, cdp, before);
    if (profileTimedSwitches) {
      const profile = await cdp.send("Profiler.stop");
      fs.writeFileSync(profileFile, JSON.stringify(profile.profile));
    }
    // Retained-owner measurements remain outside the timed profile.
    await cdp.send("HeapProfiler.collectGarbage");
    const heapBefore = await cdp.send("Runtime.getHeapUsage");
    const ownersBefore = await page.evaluate(() => ({
      editors: document.querySelectorAll(".tiptap").length,
      panels: document.querySelectorAll(".dv-content-container").length,
    }));
    let retention;
    if (pair === 0 && cpuRate === 1 && !process.env.KANDEV_DENSE_NAV_SWITCHES) {
      for (let i = 0; i < 100; i++)
        await measureSelection(page, gate, items[i % 2], selectionOptions);
      await cdp.send("HeapProfiler.collectGarbage");
      retention = {
        switches: 100,
        heapBefore,
        heapAfter: await cdp.send("Runtime.getHeapUsage"),
        ownersBefore,
        ownersAfter: await page.evaluate(() => ({
          editors: document.querySelectorAll(".tiptap").length,
          panels: document.querySelectorAll(".dv-content-container").length,
        })),
      };
    }
    if (!profileTimedSwitches) {
      await cdp.send("Profiler.enable");
      await cdp.send("Profiler.start");
      for (const item of items) await selectNavigationTask(page, item.task.title);
      const profile = await cdp.send("Profiler.stop");
      fs.writeFileSync(profileFile, JSON.stringify(profile.profile));
    }
    return {
      cpuRate,
      sample,
      navigationScenario: "task-switch",
      navigationReadiness,
      browser: browser.version(),
      selections,
      measured,
      retention,
      profileFile,
      profileWindow: profileTimedSwitches ? "timed-switches" : "post-timing-selection",
    };
  } finally {
    await context.close();
  }
}
