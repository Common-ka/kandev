import { captureGatewayScopes } from "./capture-gateway-scopes";
import type { OwnerCheckpoint } from "./navigation-owner-retention";
import {
  measureNavigationRetention,
  navigationProfileMetadata,
} from "./dense-navigation-retention";
import fs from "node:fs";
import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type CDPSession,
} from "@playwright/test";
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
import {
  startNavigationSession,
  waitForNavigationSession,
  assertSingleVisibleNavigationSession,
} from "./navigation-session-tabs";
import { BROWSER_READINESS_VERSION } from "./navigation-browser-readiness";
import {
  persistNavigationLayout,
  prepareThreeColumnLayout,
  type NavigationScenario,
} from "./navigation-layout";
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
  ownerRetention?: boolean;
  ownerCheckpoint?: OwnerCheckpoint;
  ownerApiReleaseRequired?: boolean;
  navigationScenario: NavigationScenario;
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
    navigationScenario,
    ownerRetention,
  } = options;
  const selectionOptions = (index: number) => ({
    browserReadiness: navigationReadiness === BROWSER_READINESS_VERSION,
    sessionTab: navigationScenario === "session-tabs",
    expectedLayoutColumns: navigationScenario === "incompatible-layout" ? 2 + index : undefined,
  });
  for (const item of items) await startNavigationSession(options.api, options.seed, item);
  const context = await browser.newContext({
    baseURL: backend.frontendUrl,
    viewport: { width: 1470, height: 956 },
    deviceScaleFactor: 2,
    locale: "en-US",
    storageState,
  });
  try {
    const page = await context.newPage();
    const scopeCapture = ownerRetention ? captureGatewayScopes(page) : undefined;
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
    await preloadNavigationFiles(page, items, navigationScenario);
    if (navigationScenario === "incompatible-layout")
      await prepareThreeColumnLayout(page, items[1].task.session_id!);
    await activateNavigationItem(page, items[0], navigationScenario);
    for (let i = 0; i < 5; i++)
      await measureSelection(page, gate, items[(i + 1) % 2], selectionOptions((i + 1) % 2));
    if (profileTimedSwitches) {
      await cdp.send("Profiler.enable");
      await cdp.send("Profiler.start");
    }
    const before = await beginDenseWindow(page, cdp);
    const selections = [];
    const switchCount = Number(process.env.KANDEV_DENSE_NAV_SWITCHES ?? 40);
    for (let i = 0; i < switchCount; i++)
      selections.push(await measureSelection(page, gate, items[i % 2], selectionOptions(i % 2)));
    const measured = await endDenseWindow(page, cdp, before);
    await verifyFinalNavigationSession(page, items[(switchCount - 1) % 2], navigationScenario);
    if (profileTimedSwitches) {
      const profile = await cdp.send("Profiler.stop");
      fs.writeFileSync(profileFile, JSON.stringify(profile.profile));
    }
    const { retention, ownership } = await measureNavigationRetention({
      page,
      cdp,
      pair,
      cpuRate,
      capture: scopeCapture,
      checkpoint: options.ownerCheckpoint,
      requireApiRelease: options.ownerApiReleaseRequired,
      select: (index) => measureSelection(page, gate, items[index], selectionOptions(index)),
    });
    const profile = navigationProfileMetadata(profileFile, profileTimedSwitches, ownerRetention);
    if (profile.profileWindow === "post-timing-selection")
      await profileNavigationSelections(page, cdp, items, navigationScenario, profileFile);
    return {
      cpuRate,
      sample,
      navigationScenario,
      navigationReadiness,
      browser: browser.version(),
      selections,
      measured,
      retention,
      ownership,
      ...profile,
    };
  } finally {
    await context.close();
  }
}

async function preloadNavigationFiles(
  page: Page,
  items: Awaited<ReturnType<typeof prepareProfileTask>>[],
  scenario: NavigationScenario,
) {
  for (const item of items) {
    await activateNavigationItem(page, item, scenario);
    const session = new SessionPage(page);
    await session.clickTab("Files");
    await expect(session.fileTreeNode("navigation-available")).toBeVisible();
    await saveExpandedPaths(page, item.task.session_id!, PROFILE_FOLDERS);
    await page.reload();
    await session.waitForLoad();
    if (scenario === "session-tabs") {
      await page.getByTestId(`session-tab-${item.task.session_id}`).click();
      await waitForNavigationSession(page, item);
    }
    await session.clickTab("Files");
    await expect(session.fileTreeNode(item.marker)).toBeVisible();
    if (scenario === "incompatible-layout")
      await persistNavigationLayout(page, item.task.session_id!, 2);
  }
}

async function profileNavigationSelections(
  page: Page,
  cdp: CDPSession,
  items: Awaited<ReturnType<typeof prepareProfileTask>>[],
  scenario: NavigationScenario,
  profileFile: string,
) {
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.start");
  for (const item of items) {
    await activateNavigationItem(page, item, scenario);
  }
  const profile = await cdp.send("Profiler.stop");
  fs.writeFileSync(profileFile, JSON.stringify(profile.profile));
}

async function verifyFinalNavigationSession(
  page: Page,
  item: Awaited<ReturnType<typeof prepareProfileTask>>,
  scenario: NavigationScenario,
) {
  if (scenario === "session-tabs")
    await assertSingleVisibleNavigationSession(page, item.task.session_id!);
}

async function activateNavigationItem(
  page: Page,
  item: Awaited<ReturnType<typeof prepareProfileTask>>,
  scenario: NavigationScenario,
) {
  if (scenario === "session-tabs")
    await page.getByTestId(`session-tab-${item.task.session_id}`).click();
  else await selectNavigationTask(page, item.task.title);
}
