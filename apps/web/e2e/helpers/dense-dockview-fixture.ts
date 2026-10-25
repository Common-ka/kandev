import { expect } from "@playwright/test";
import type { ApiClient } from "./api-client";
import type { SeedData } from "../fixtures/test-base";
import type { BackendContext } from "../fixtures/backend";
import { DENSE_WORKLOAD, seedDenseWorkbench, type DenseThread } from "./dense-workbench-fixture";
import { seedDenseEnvironmentFiles } from "./dense-environment-files";

async function siblingStream(api: ApiClient, first: DenseThread, sessionId: string, index: number) {
  const { messages } = await api.listSessionMessages(sessionId);
  const count = index === 0 ? DENSE_WORKLOAD.messages : Math.min(100, DENSE_WORKLOAD.messages);
  expect(messages).toHaveLength(count);
  const last = messages[messages.length - 1];
  return {
    ...first,
    sessionId,
    messageId: last.id,
    title: `${first.title} sibling ${index}`,
    content: last.content,
    siblings: [first.sessionId, ...first.siblings.filter((id) => id !== sessionId)],
  };
}

export async function seedDenseDockviewFixture(
  api: ApiClient,
  seed: SeedData,
  backend: BackendContext,
) {
  if (DENSE_WORKLOAD.columns < 6 || DENSE_WORKLOAD.tasks < DENSE_WORKLOAD.columns)
    throw new Error("Dense Dockview requires at least six eligible tasks");
  const fixture = await seedDenseWorkbench(api, seed, true, {
    prepareFirstSiblings: true,
    firstSiblingMessages: DENSE_WORKLOAD.messages,
  });
  const { total: taskCount } = await api.listTasks(seed.workspaceId);
  expect(taskCount).toBe(DENSE_WORKLOAD.tasks);
  const first = fixture.threads[0];
  const { sessions } = await api.listTaskSessions(first.taskId);
  const environmentId = sessions.find(
    (session) => session.id === first.sessionId,
  )?.task_environment_id;
  expect(environmentId).toBeTruthy();
  expect(sessions).toHaveLength(3);
  for (const sessionId of first.siblings)
    expect(sessions.find((session) => session.id === sessionId)?.task_environment_id).toBe(
      environmentId,
    );
  const siblings = [];
  for (const [index, sessionId] of first.siblings.entries())
    siblings.push(await siblingStream(api, first, sessionId, index));
  const producers = [first, ...siblings, ...fixture.threads.slice(1, 4)];
  expect(producers).toHaveLength(6);
  expect(new Set(producers.map((thread) => thread.sessionId)).size).toBe(6);
  const files = await seedDenseEnvironmentFiles(api, backend, first);
  await api.wsRequest("task.plan.create", {
    task_id: first.taskId,
    title: "Dense workbench fixture plan",
    content:
      "## Dense workbench fixture\n\n" +
      Array.from({ length: 20 }, (_, i) => `- [ ] Verify deterministic step ${i + 1}.`).join("\n"),
    created_by: "user",
  });
  return {
    ...fixture,
    dockview: {
      taskId: first.taskId,
      taskCount,
      seededMessages: fixture.manifest.reduce(
        (sum, row) =>
          sum + row.messages + row.siblingMessages.reduce((count, value) => count + value, 0),
        0,
      ),
      environmentId: environmentId!,
      visibleSessionIds: [first.sessionId, siblings[0].sessionId],
      hiddenSessionId: siblings[1].sessionId,
      visibleHistoryMessages: DENSE_WORKLOAD.messages,
      hiddenHistoryMessages: Math.min(100, DENSE_WORKLOAD.messages),
      producers,
      files,
    },
  };
}

export type DenseDockviewFixture = Awaited<ReturnType<typeof seedDenseDockviewFixture>>;
