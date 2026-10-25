import { DENSE_WORKLOAD, seedDenseWorkbench } from "./dense-workbench-fixture";
import type { ApiClient } from "./api-client";
import type { SeedData } from "../fixtures/test-base";
import type { BackendContext } from "../fixtures/backend";
import { seedDenseEnvironmentFiles, observeDenseEnvironmentFiles } from "./dense-environment-files";
import { expect } from "@playwright/test";
import { seedThreadPresentation } from "../tests/task/threads-presentation-helpers";

export async function seedDenseThreadsFixture(
  api: ApiClient,
  seed: SeedData,
  backend: BackendContext,
) {
  if (DENSE_WORKLOAD.layout === "columns" && process.env.KANDEV_DENSE_HISTORY === "all")
    throw new Error("Columns timing requires viewport-bounded history");
  const fixture = await seedDenseWorkbench(api, seed, true);
  const { total: taskCount } = await api.listTasks(seed.workspaceId);
  expect(taskCount).toBe(DENSE_WORKLOAD.tasks);
  const files = [];
  for (const thread of fixture.threads.slice(0, 6)) {
    const { marker: _marker, ...state } = await seedDenseEnvironmentFiles(api, backend, thread);
    files.push(state);
  }
  await seedThreadPresentation(api, {
    layout: DENSE_WORKLOAD.layout,
    maxChats: DENSE_WORKLOAD.layout === "columns" ? null : 6,
    autoHideComposer: true,
  });
  return { ...fixture, taskCount, files };
}

export async function verifyDenseThreadsFiles(
  api: ApiClient,
  backend: BackendContext,
  fixture: Awaited<ReturnType<typeof seedDenseThreadsFixture>>,
) {
  const files = [];
  for (const thread of fixture.threads.slice(0, 6))
    files.push(await observeDenseEnvironmentFiles(api, backend, thread));
  expect(files).toEqual(fixture.files);
  return files;
}
