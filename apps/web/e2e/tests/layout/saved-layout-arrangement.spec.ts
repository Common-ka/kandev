import { test, expect } from "../../fixtures/test-base";
import { persistNavigationLayout } from "../../helpers/navigation-layout";
import { routeNavigationResponses } from "../../helpers/navigation-response-hold";
import { exposeNavigationStore } from "../task/task-navigation-helpers";
import {
  seedProfile,
  prepareProfileTask,
  measureSelection,
} from "../task/task-navigation-profile-helpers";

test("restores different task arrangements with identical panels and preserves both drafts", async ({
  testPage: page,
  apiClient: api,
  seedData: seed,
  backend,
}) => {
  test.setTimeout(120_000);
  await exposeNavigationStore(page);
  const tasks = await seedProfile(api, seed, backend, { backgroundTasks: 0 });
  const items = [];
  for (let index = 0; index < tasks.length; index++) {
    const item = await prepareProfileTask(page, api, tasks[index], backend, {
      first: index === 0,
      historyCount: 10,
    });
    items.push(item);
    await page.locator(".tiptap:visible").fill(`Retain ${item.task.title} draft`);
    await persistNavigationLayout(page, item.task.session_id!, 2);
  }
  const environments = await Promise.all(tasks.map((task) => api.getTaskEnvironment(task.id)));
  expect(environments[0]?.id).toBeTruthy();
  expect(environments[1]?.id).not.toBe(environments[0]?.id);
  await page.evaluate((sessionId) => {
    const api = (window as Window & { __dockviewApi__: import("dockview-react").DockviewApi })
      .__dockviewApi__;
    const files = api.getPanel("files");
    const chat = api.getPanel(`session:${sessionId}`);
    if (!files || !chat) throw new Error("Arrangement fixture panels are missing");
    files.api.moveTo({ group: chat.group, position: "left" });
    files.api.setActive();
  }, items[1].task.session_id!);
  await persistNavigationLayout(page, items[1].task.session_id!, 3);
  const gate = await routeNavigationResponses(page);
  for (const [iteration, index] of [0, 1, 0, 1].entries()) {
    const item = items[index];
    await measureSelection(page, gate, item, {
      expectedLayoutColumns: 2 + index,
      browserReadiness: true,
    });
    await expect(page.locator(".tiptap:visible")).toHaveText(`Retain ${item.task.title} draft`);
    const arrangement = await page.evaluate(() => {
      const api = (window as Window & { __dockviewApi__: import("dockview-react").DockviewApi })
        .__dockviewApi__;
      return {
        filesGroup: api.getPanel("files")?.group.id,
        changesGroup: api.getPanel("changes")?.group.id,
        terminal: Boolean(api.getPanel("terminal-default")),
      };
    });
    expect(arrangement.terminal).toBe(true);
    expect(arrangement.filesGroup === arrangement.changesGroup).toBe(index === 0);
    if (iteration < 2) {
      const capture = test.info().outputPath(`restored-${2 + index}-columns.png`);
      await page.screenshot({ path: capture });
      await test
        .info()
        .attach(`restored-${2 + index}-columns`, { path: capture, contentType: "image/png" });
    }
  }
});
