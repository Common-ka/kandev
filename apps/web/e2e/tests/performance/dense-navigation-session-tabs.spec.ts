import { test, expect } from "../../fixtures/test-base";
import { routeNavigationResponses } from "../../helpers/navigation-response-hold";
import {
  prepareNavigationSibling,
  startNavigationSession,
  assertSingleVisibleNavigationSession,
} from "../../helpers/navigation-session-tabs";
import { exposeNavigationStore } from "../task/task-navigation-helpers";
import {
  measureSelection,
  prepareProfileTask,
  seedProfile,
} from "../task/task-navigation-profile-helpers";

test("measures trusted sibling-tab selections in one real task environment", async ({
  testPage: page,
  apiClient: api,
  seedData: seed,
  backend,
}) => {
  test.setTimeout(120_000);
  await exposeNavigationStore(page);
  const tasks = await seedProfile(api, seed, backend, { backgroundTasks: 8 });
  const first = await prepareProfileTask(page, api, tasks[0], backend, {
    first: true,
    historyCount: 10,
  });
  const sibling = await prepareNavigationSibling(api, seed, first, 10);
  await startNavigationSession(api, seed, sibling);
  await page.reload();
  const items = [first, sibling];
  const gate = await routeNavigationResponses(page);
  await page.getByTestId(`session-tab-${first.task.session_id}`).click();
  const firstEditor = page.locator(
    `[data-testid="session-chat"][data-session-id="${first.task.session_id}"] .tiptap`,
  );
  await firstEditor.fill("Keep the first session draft");
  let lastEventAt = 0;
  for (const index of [1, 0, 1, 0]) {
    const item = items[index];
    const result = await measureSelection(page, gate, item, {
      browserReadiness: true,
      sessionTab: true,
    });
    expect(result.browserEventReadiness).toMatchObject({
      trusted: true,
      taskId: first.task.id,
      sessionId: item.task.session_id,
    });
    expect(result.browserEventReadiness!.eventAt).toBeGreaterThan(lastEventAt);
    lastEventAt = result.browserEventReadiness!.eventAt;
    await assertSingleVisibleNavigationSession(page, item.task.session_id!);
  }
  await expect(firstEditor).toHaveText("Keep the first session draft");
});
