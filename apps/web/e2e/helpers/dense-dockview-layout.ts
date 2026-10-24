import { expect, type Page } from "@playwright/test";
import type { DenseDockviewFixture } from "./dense-dockview-fixture";
import { SessionPage } from "../pages/session-page";

export function inspectDenseDockviewLayout(page: Page) {
  return page.evaluate(() => {
    const api = (window as Window & { __dockviewApi__?: import("dockview-react").DockviewApi })
      .__dockviewApi__;
    if (!api) throw new Error("Dense Dockview API is unavailable");
    return {
      groups: api.groups.length,
      panels: api.panels.map((panel) => ({
        id: panel.id,
        component: panel.api.component,
        visible: panel.api.isVisible,
      })),
      detailSessionIds: Array.from(
        document.querySelectorAll('[data-testid="session-chat"][data-detail-active="true"]'),
      )
        .map((element) => element.getAttribute("data-session-id"))
        .sort(),
      layout: api.toJSON(),
    };
  });
}

export async function prepareDenseDockviewLayout(page: Page, fixture: DenseDockviewFixture) {
  const { visibleSessionIds, hiddenSessionId } = fixture.dockview;
  for (const sessionId of [...visibleSessionIds, hiddenSessionId])
    await expect(page.getByTestId(`session-tab-${sessionId}`)).toBeVisible({ timeout: 30_000 });
  const hasPlan = (await inspectDenseDockviewLayout(page)).panels.some(
    (panel) => panel.id === "plan",
  );
  if (!hasPlan) {
    await new SessionPage(page).addPanelButton().click();
    await page.getByRole("menuitem", { name: "Plan", exact: true }).click();
  }
  await page.evaluate(([firstId, secondId]) => {
    const api = (window as Window & { __dockviewApi__: import("dockview-react").DockviewApi })
      .__dockviewApi__;
    const first = api.getPanel(`session:${firstId}`);
    const second = api.getPanel(`session:${secondId}`);
    const files = api.getPanel("files");
    const changes = api.getPanel("changes");
    const plan = api.getPanel("plan");
    const terminal = api.getPanel("terminal-default");
    if (!first || !second || !files || !changes || !plan || !terminal)
      throw new Error("Dense Dockview structural panels are missing");
    second.api.moveTo({ group: first.group, position: "right" });
    changes.api.moveTo({ group: files.group, position: "bottom" });
    plan.api.moveTo({ group: terminal.group, position: "center" });
    for (const panel of [first, second, files, changes, plan]) panel.api.setActive();
    first.api.setActive();
  }, visibleSessionIds);
  await expect
    .poll(async () => (await inspectDenseDockviewLayout(page)).detailSessionIds)
    .toEqual([...visibleSessionIds].sort());
  const state = await inspectDenseDockviewLayout(page);
  const visible = state.panels
    .filter((panel) => panel.visible)
    .map((panel) => panel.id)
    .sort();
  expect(visible).toEqual(
    [...visibleSessionIds.map((id) => `session:${id}`), "files", "changes", "plan"].sort(),
  );
  expect(state.panels.find((panel) => panel.id === `session:${hiddenSessionId}`)?.visible).toBe(
    false,
  );
  expect(state.panels.find((panel) => panel.id === "terminal-default")?.visible).toBe(false);
  return state;
}
