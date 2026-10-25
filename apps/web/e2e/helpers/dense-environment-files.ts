import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { expect } from "@playwright/test";
import type { ApiClient } from "./api-client";
import type { BackendContext } from "../fixtures/backend";
import type { DenseThread } from "./dense-workbench-fixture";
import { GitHelper, makeGitEnv } from "./git-helper";
import {
  PROFILE_FOLDERS,
  seedProfileFiles,
  modifyProfileFiles,
} from "../tests/task/task-navigation-profile-helpers";

async function denseRepository(api: ApiClient, backend: BackendContext, thread: DenseThread) {
  const environment = await api.getTaskEnvironment(thread.taskId);
  const repoPath =
    environment?.repos?.[0]?.worktree_path ??
    environment?.worktree_path ??
    environment?.workspace_path;
  if (!repoPath?.startsWith(`${backend.tmpDir}${path.sep}`))
    throw new Error("Dense file fixture requires its disposable worktree");
  expect(environment?.id).toBeTruthy();
  return {
    repoPath,
    environmentId: environment!.id,
    git: new GitHelper(repoPath, makeGitEnv(backend.tmpDir)),
  };
}

function readFileState(
  repository: Awaited<ReturnType<typeof denseRepository>>,
  thread: DenseThread,
) {
  const { repoPath, environmentId, git } = repository;
  const tracked = git.exec("git ls-files -z").split("\0").filter(Boolean);
  const profileFiles = tracked.filter((name) =>
    PROFILE_FOLDERS.some((folder) => name.startsWith(`${folder}/entry-`)),
  ).length;
  const changedFiles = git
    .exec("git --no-optional-locks status --porcelain")
    .trim()
    .split("\n")
    .filter(Boolean).length;
  expect(profileFiles).toBe(630);
  expect(changedFiles).toBe(73);
  const files = git
    .exec("git ls-files --cached --others --exclude-standard -z")
    .split("\0")
    .filter(Boolean)
    .sort();
  const hash = createHash("sha256");
  for (const name of files) {
    const value = createHash("sha256")
      .update(fs.readFileSync(path.join(repoPath, name)))
      .digest("hex");
    hash.update(`${name}\0${value}\n`);
  }
  return {
    taskId: thread.taskId,
    sessionId: thread.sessionId,
    environmentId,
    repoPath,
    profileFiles,
    changedFiles,
    stateSha256: hash.digest("hex"),
  };
}

export async function seedDenseEnvironmentFiles(
  api: ApiClient,
  backend: BackendContext,
  thread: DenseThread,
) {
  const repository = await denseRepository(api, backend, thread);
  seedProfileFiles(repository.git);
  const marker = modifyProfileFiles(repository.git, thread.title);
  return { ...readFileState(repository, thread), marker };
}

export async function observeDenseEnvironmentFiles(
  api: ApiClient,
  backend: BackendContext,
  thread: DenseThread,
) {
  return readFileState(await denseRepository(api, backend, thread), thread);
}
