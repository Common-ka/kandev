import { expect, type Page } from "@playwright/test";
import { snapshotPersistedLayouts } from "./dockview-persistence";

export type NavigationScenario = "task-switch" | "incompatible-layout" | "session-tabs";

export function readNavigationScenario(
  value = process.env.KANDEV_DENSE_NAV_SCENARIO,
): NavigationScenario {
  if (value === undefined || value === "task-switch") return "task-switch";
  if (value === "incompatible-layout" || value === "session-tabs") return value;
  throw new Error(`Unsupported navigation scenario: ${value}`);
}

export async function persistNavigationLayout(page: Page, sessionId: string, columns: number) {
  await waitForNavigationLayout(page, sessionId, columns);
  await page.evaluate(() => {
    (window as Window & { __persistDockviewLayout__: () => void }).__persistDockviewLayout__();
  });
  await expect.poll(() => snapshotPersistedLayouts(page)).toContain(sessionId);
}

export async function prepareThreeColumnLayout(page: Page, sessionId: string) {
  const groupId = await page.evaluate((id) => {
    const api = (window as Window & { __dockviewApi__: import("dockview-react").DockviewApi })
      .__dockviewApi__;
    const files = api.getPanel("files");
    const chat = api.getPanel(`session:${id}`);
    if (!files || !chat) throw new Error("Layout fixture panels are missing");
    files.api.moveTo({ group: chat.group, position: "left" });
    files.api.setActive();
    const terminal = api.getPanel("terminal-default");
    if (!terminal) throw new Error("Layout fixture terminal is missing");
    api.removePanel(terminal);
    const root = api.toJSON().grid.root;
    if (root.type !== "branch" || root.data.length !== 3)
      throw new Error("Layout fixture did not create three root columns");
    return files.group.id;
  }, sessionId);
  await persistNavigationLayout(page, sessionId, 3);
  await expect.poll(() => snapshotPersistedLayouts(page)).toContain(`"id":"${groupId}"`);
}

export async function waitForNavigationLayout(page: Page, sessionId: string, columns?: number) {
  if (columns === undefined) return undefined;
  const result = await page.waitForFunction(
    ({ sessionId, columns }) => {
      const api = (window as Window & { __dockviewApi__?: import("dockview-react").DockviewApi })
        .__dockviewApi__;
      if (!api?.getPanel(`session:${sessionId}`)?.api.isVisible) return false;
      const grid = api.toJSON().grid;
      if (grid.root.type !== "branch" || grid.root.data.length !== columns) return false;
      return { rootColumns: grid.root.data.length, orientation: grid.orientation, sessionId };
    },
    { sessionId, columns },
    { timeout: 30_000 },
  );
  try {
    return await result.jsonValue();
  } finally {
    await result.dispose();
  }
}
