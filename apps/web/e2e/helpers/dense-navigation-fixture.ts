import type { Page } from "@playwright/test";
import type { ApiClient } from "./api-client";
import type { SeedData } from "../fixtures/test-base";
import type { BackendContext } from "../fixtures/backend";
import type { NavigationScenario } from "./navigation-layout";
import { prepareNavigationSibling } from "./navigation-session-tabs";
import { exposeNavigationStore } from "../tests/task/task-navigation-helpers";
import { seedProfile, prepareProfileTask } from "../tests/task/task-navigation-profile-helpers";

export async function prepareDenseNavigationItems(
  page: Page,
  api: ApiClient,
  seed: SeedData,
  backend: BackendContext,
  scenario: NavigationScenario,
) {
  const tasks = await seedProfile(api, seed, backend, {
    backgroundTasks: Number(process.env.KANDEV_DENSE_NAV_TASKS ?? 1000) - 2,
    prepareOnly: true,
  });
  await exposeNavigationStore(page);
  const items = [];
  const selectedTasks = scenario === "session-tabs" ? tasks.slice(0, 1) : tasks;
  for (let i = 0; i < selectedTasks.length; i++)
    items.push(
      await prepareProfileTask(page, api, selectedTasks[i], backend, {
        first: i === 0,
        historyCount: Number(process.env.KANDEV_DENSE_NAV_MESSAGES ?? 1000),
      }),
    );
  if (scenario === "session-tabs")
    items.push(
      await prepareNavigationSibling(
        api,
        seed,
        items[0],
        Number(process.env.KANDEV_DENSE_NAV_SIBLING_MESSAGES ?? 100),
      ),
    );
  return items;
}
