import { test, expect } from "../../fixtures/test-base";
import { routeNavigationResponses } from "../../helpers/navigation-response-hold";
import { exposeNavigationStore } from "../task/task-navigation-helpers";
import {
  measureSelection,
  prepareProfileTask,
  seedProfile,
} from "../task/task-navigation-profile-helpers";

test("records native task selection to the destination header, transcript, and composer", async ({
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
  }
  const gate = await routeNavigationResponses(page);
  let previousEventAt = 0;
  for (const item of items) {
    const result = await measureSelection(page, gate, item, { browserReadiness: true });
    expect(result).toMatchObject({
      browserEventReadiness: {
        version: "pointerdown-raf-v1",
        trusted: true,
        taskId: item.task.id,
        sessionId: item.task.session_id,
        eventAt: expect.any(Number),
        headerMs: expect.any(Number),
        transcriptMs: expect.any(Number),
        composerMs: expect.any(Number),
      },
    });
    const timing = result.browserEventReadiness!;
    expect(timing.eventAt).toBeGreaterThan(previousEventAt);
    previousEventAt = timing.eventAt;
    for (const duration of [timing.headerMs, timing.transcriptMs, timing.composerMs]) {
      expect(Number.isFinite(duration)).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThanOrEqual(result.paintOpportunityMs);
    }
  }
});
