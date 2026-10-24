import { test, expect } from "../../fixtures/test-base";
import { routeNavigationResponses } from "../../helpers/navigation-response-hold";
import { persistNavigationLayout, prepareThreeColumnLayout } from "../../helpers/navigation-layout";
import { exposeNavigationStore } from "../task/task-navigation-helpers";
import {
  measureSelection,
  prepareProfileTask,
  seedProfile,
} from "../task/task-navigation-profile-helpers";

test("measures restoration between two-column and three-column task layouts", async ({
  testPage: page,
  apiClient: api,
  seedData: seed,
  backend,
}) => {
  test.setTimeout(120_000);
  await exposeNavigationStore(page);
  const tasks = await seedProfile(api, seed, backend, { backgroundTasks: 8 });
  const items = [];
  for (let index = 0; index < tasks.length; index++) {
    items.push(
      await prepareProfileTask(page, api, tasks[index], backend, {
        first: index === 0,
        historyCount: 10,
      }),
    );
    await persistNavigationLayout(page, tasks[index].session_id!, 2);
  }
  const environments = await Promise.all(tasks.map((task) => api.getTaskEnvironment(task.id)));
  expect(environments[0]?.id).toBeTruthy();
  expect(environments[1]?.id).not.toBe(environments[0]?.id);
  await prepareThreeColumnLayout(page, items[1].task.session_id!);
  const gate = await routeNavigationResponses(page);
  for (const index of [0, 1, 0, 1]) {
    const expectedLayoutColumns = index === 0 ? 2 : 3;
    const result = await measureSelection(page, gate, items[index], {
      browserReadiness: true,
      expectedLayoutColumns,
    });
    expect(result).toMatchObject({
      layout: { rootColumns: expectedLayoutColumns, orientation: "HORIZONTAL" },
      browserEventReadiness: { trusted: true, sessionId: items[index].task.session_id },
    });
  }
});
