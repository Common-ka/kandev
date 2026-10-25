import path from "node:path";
import { test, expect } from "../../fixtures/test-base";
import {
  seedDenseThreadsFixture,
  verifyDenseThreadsFiles,
} from "../../helpers/dense-threads-fixture";
import { GitHelper, makeGitEnv } from "../../helpers/git-helper";
import { PROFILE_FOLDERS } from "../task/task-navigation-profile-helpers";

test.skip(process.env.KANDEV_DENSE_COMPARE !== "1", "opt-in dense Threads fixture check");

test("seeds the reference file state in every prepared Threads environment", async ({
  testPage,
  apiClient,
  seedData,
  backend,
}) => {
  test.setTimeout(180_000);
  await testPage.close();
  const fixture = await seedDenseThreadsFixture(apiClient, seedData, backend);
  expect(fixture.taskCount).toBe((await apiClient.listTasks(seedData.workspaceId)).total);
  const prepared = fixture.threads.slice(0, 6);
  expect(prepared.length).toBeGreaterThan(0);
  for (const thread of prepared) {
    const environment = await apiClient.getTaskEnvironment(thread.taskId);
    const repoPath = environment?.repos?.[0]?.worktree_path;
    expect(repoPath?.startsWith(`${backend.tmpDir}${path.sep}`)).toBe(true);
    const git = new GitHelper(repoPath!, makeGitEnv(backend.tmpDir));
    const profileFiles = git
      .exec("git ls-files")
      .trim()
      .split("\n")
      .filter((name) => PROFILE_FOLDERS.some((folder) => name.startsWith(`${folder}/entry-`)));
    expect(profileFiles).toHaveLength(630);
    expect(git.exec("git status --porcelain").trim().split("\n")).toHaveLength(73);
  }
  expect(fixture.files).toHaveLength(prepared.length);
  expect(await verifyDenseThreadsFiles(apiClient, backend, fixture)).toEqual(fixture.files);
});
