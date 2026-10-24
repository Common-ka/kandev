import { expect, type Page } from "@playwright/test";
import { installFixturePlugin, PACKAGE_PATH, PLUGIN_ID } from "./plugin-fixture";
import { sha256File } from "./dense-snapshot";
import { SessionPage } from "../pages/session-page";
import { inspectDenseDockviewLayout } from "./dense-dockview-layout";

const PANEL_KEY = "prompt-history-plugin";
export const DENSE_DOCKVIEW_PLUGIN_PANEL = `plugin:${PLUGIN_ID}:${PANEL_KEY}`;

export async function installDenseDockviewPlugin(page: Page) {
  const bundleSha256 = sha256File(PACKAGE_PATH);
  await installFixturePlugin(page);
  return {
    id: PLUGIN_ID,
    panelId: DENSE_DOCKVIEW_PLUGIN_PANEL,
    bundleSha256,
    scope: "Full in-repo E2E plugin, including navigation, toolbar, and review contributions",
  };
}

export async function mountDenseDockviewPlugin(page: Page, visibleSessionIds: string[]) {
  const session = new SessionPage(page);
  await session.addPanelButton().click();
  await session.addPanelPluginItem(PLUGIN_ID, PANEL_KEY).click();
  await page.evaluate(
    ({ panelId, firstId }) => {
      const api = (window as Window & { __dockviewApi__: import("dockview-react").DockviewApi })
        .__dockviewApi__;
      const plugin = api.getPanel(panelId);
      const plan = api.getPanel("plan");
      const first = api.getPanel(`session:${firstId}`);
      if (!plugin || !plan || !first) throw new Error("Dense plugin layout panels are missing");
      plugin.api.moveTo({ group: plan.group, position: "bottom" });
      plugin.api.setActive();
      first.api.setActive();
    },
    { panelId: DENSE_DOCKVIEW_PLUGIN_PANEL, firstId: visibleSessionIds[0] },
  );
  await expect(page.getByTestId("fixture-prompt-history-panel")).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(async () => (await inspectDenseDockviewLayout(page)).detailSessionIds)
    .toEqual([...visibleSessionIds].sort());
  const state = await inspectDenseDockviewLayout(page);
  expect(state.panels.find((panel) => panel.id === "pr-detail")).toMatchObject({
    component: "pr-detail",
    visible: false,
  });
  expect(
    state.panels
      .filter((panel) => panel.visible)
      .map((panel) => panel.id)
      .sort(),
  ).toEqual(
    [
      ...visibleSessionIds.map((id) => `session:${id}`),
      "files",
      "changes",
      "plan",
      DENSE_DOCKVIEW_PLUGIN_PANEL,
    ].sort(),
  );
  return state;
}
