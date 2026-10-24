import { test, expect } from "../../fixtures/test-base";
import { prepareDenseStream } from "../../helpers/dense-canonical-stream";
import { DENSE_WORKLOAD, type DenseThread } from "../../helpers/dense-workbench-fixture";
import { prepareNavigationSibling } from "../../helpers/navigation-session-tabs";
import { exposeNavigationStore } from "../task/task-navigation-helpers";
import { prepareProfileTask, seedProfile } from "../task/task-navigation-profile-helpers";
import { setJourneyChatSplit } from "../task/journey-boot-loading-helpers";

test("observes canonical streams in two Dockview chats with a retained hidden sibling", async ({
  testPage: page,
  apiClient: api,
  seedData: seed,
  backend,
}) => {
  test.setTimeout(180_000);
  await exposeNavigationStore(page);
  const tasks = await seedProfile(api, seed, backend, {
    backgroundTasks: 0,
    prepareOnly: true,
  });
  const first = await prepareProfileTask(page, api, tasks[0], backend, {
    first: true,
    historyCount: 10,
  });
  const { sessions } = await api.listTaskSessions(first.task.id);
  const profileId = sessions.find(
    (session) => session.id === first.task.session_id,
  )?.agent_profile_id;
  expect(profileId).toBeTruthy();
  const streamSeed = { ...seed, agentProfileId: profileId! };
  const second = await prepareNavigationSibling(api, streamSeed, first, 10);
  const hidden = await prepareNavigationSibling(api, streamSeed, first, 10);
  expect(hidden.taskEnvironmentId).toBe(second.taskEnvironmentId);
  const threads: DenseThread[] = [first, second].map((item) => ({
    taskId: item.task.id,
    sessionId: item.task.session_id!,
    messageId: "",
    title: item.task.title,
    content: "",
    siblings: [hidden.task.session_id!],
  }));
  const stream = await prepareDenseStream(api, streamSeed, backend, threads, "dockview-regression");
  try {
    await page.reload();
    for (const item of [first, second, hidden])
      await expect(page.getByTestId(`session-tab-${item.task.session_id}`)).toBeVisible();
    await setJourneyChatSplit(page, first.task.session_id!, second.task.session_id!, true);
    await expect(
      page.locator('[data-testid="session-chat"][data-detail-active="true"]'),
    ).toHaveCount(2);
    const chat = (sessionId: string) =>
      page.locator(`[data-testid="session-chat"][data-session-id="${sessionId}"]`);
    await expect(chat(hidden.task.session_id!)).toBeHidden();
    const editor = chat(first.task.session_id!).locator(".tiptap");
    await editor.fill("Keep this draft while both sessions stream");
    for (const thread of threads)
      await expect(chat(thread.sessionId).getByText(stream.warmup, { exact: true })).toBeVisible();
    stream.release();
    await stream.waitForVisible(page, undefined, "dockview");
    await stream.assertVisible(page, undefined, "dockview");
    await stream.verify();
    const progress = await stream.inspect(page, "dockview");
    expect(progress.browser).toEqual(
      threads.map((thread) => ({
        sessionId: thread.sessionId,
        mounted: true,
        at: expect.any(Number),
        count: Math.ceil(DENSE_WORKLOAD.durationMs / 200),
        uniqueCount: Math.ceil(DENSE_WORKLOAD.durationMs / 200),
        lastTick: Math.ceil(DENSE_WORKLOAD.durationMs / 200) - 1,
      })),
    );
    expect(stream.scheduledUpdates).toBe(2 * Math.ceil(DENSE_WORKLOAD.durationMs / 200));
    await expect(editor).toHaveText("Keep this draft while both sessions stream");
    await expect(chat(hidden.task.session_id!)).toBeHidden();
    await test.info().attach("dockview-stream-fixture.json", {
      body: JSON.stringify({
        taskId: first.task.id,
        environmentId: second.taskEnvironmentId,
        visibleSessionIds: threads.map((thread) => thread.sessionId),
        hiddenSessionId: hidden.task.session_id,
        scheduledUpdates: stream.scheduledUpdates,
        verificationErrors: stream.verificationErrors,
        progress,
        draftPreserved: true,
      }),
      contentType: "application/json",
    });
  } finally {
    await stream.finish();
  }
});
