import path from "node:path";
import type { Page } from "@playwright/test";
import type { StoreApi } from "zustand";
import type { AppState } from "../../../lib/state/store";
import { test, expect } from "../../fixtures/test-base";
import { GitHelper, makeGitEnv } from "../../helpers/git-helper";
import { SessionPage } from "../../pages/session-page";
import { exposeNavigationStore } from "../task/task-navigation-helpers";
import { prepareProfileTask, seedProfile } from "../task/task-navigation-profile-helpers";

const SCROLL_OWNER = "changes-panel-scroll-owner";

async function readAnchor(page: Page, key?: string) {
  return page.getByTestId(SCROLL_OWNER).evaluate((element, requestedKey) => {
    const viewport = element.getBoundingClientRect();
    const rows = Array.from(element.querySelectorAll<HTMLElement>("[data-changes-timeline-row]"));
    const row = rows.find((candidate) => {
      if (requestedKey) return candidate.dataset.changesRowKey === requestedKey;
      const rect = candidate.getBoundingClientRect();
      return rect.height > 0 && rect.bottom > viewport.top + 1 && rect.top < viewport.bottom;
    });
    return row
      ? { key: row.dataset.changesRowKey!, offset: row.getBoundingClientRect().top - viewport.top }
      : null;
  }, key);
}

async function waitForChangedFile(page: Page, sessionId: string, file: string) {
  await expect
    .poll(
      () =>
        page.evaluate(
          ({ sessionId, file }) => {
            const state = (
              window as Window & { __KANDEV_E2E_STORE__: StoreApi<AppState> }
            ).__KANDEV_E2E_STORE__.getState();
            const environmentId = state.environmentIdBySessionId[sessionId] ?? sessionId;
            return Object.values(state.gitStatus.byEnvironmentRepo[environmentId] ?? {}).some(
              (repository) => Boolean(repository.files?.[file]),
            );
          },
          { sessionId, file },
        ),
      { timeout: 30_000 },
    )
    .toBe(true);
}

async function expectAnchor(page: Page, anchor: { key: string; offset: number }) {
  await expect
    .poll(async () => {
      const current = await readAnchor(page, anchor.key);
      return current ? Math.abs(current.offset - anchor.offset) : Infinity;
    })
    .toBeLessThanOrEqual(2);
}

async function positionChangesWithChat(page: Page, sessionId: string, split: boolean) {
  await page.evaluate(
    ({ sessionId, split }) => {
      const api = (
        window as Window & {
          __dockviewApi__: import("dockview-react").DockviewApi;
        }
      ).__dockviewApi__;
      const chat = api.getPanel(`session:${sessionId}`);
      const changes = api.getPanel("changes");
      if (!chat || !changes) throw new Error("Changes lifecycle panels are unavailable");
      changes.api.moveTo({ group: chat.group, position: split ? "right" : "center" });
      changes.api.setActive();
    },
    { sessionId, split },
  );
}

test("retains the Changes row through hidden updates and visible unfocused updates", async ({
  testPage: page,
  apiClient: api,
  seedData: seed,
  backend,
}) => {
  test.setTimeout(120_000);
  await exposeNavigationStore(page);
  const tasks = await seedProfile(api, seed, backend, { backgroundTasks: 8 });
  const item = await prepareProfileTask(page, api, tasks[0], backend, {
    first: true,
    historyCount: 10,
  });
  const environment = await api.getTaskEnvironment(item.task.id);
  const repoPath = environment?.repos?.[0]?.worktree_path ?? environment?.worktree_path;
  if (!repoPath?.startsWith(`${backend.tmpDir}${path.sep}`))
    throw new Error("Changes lifecycle fixture must use its owned worktree");
  const git = new GitHelper(repoPath, makeGitEnv(backend.tmpDir));
  const session = new SessionPage(page);
  await positionChangesWithChat(page, item.task.session_id!, false);
  await session.clickTab("Changes");
  const scroll = page.getByTestId(SCROLL_OWNER);
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollHeight - element.clientHeight))
    .toBeGreaterThan(500);
  await scroll.evaluate((element) => {
    element.scrollTop = 400;
  });
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(200);
  let previousAnchor = "";
  await expect
    .poll(async () => {
      const current = await readAnchor(page);
      const serialized = JSON.stringify(current);
      const settled = current !== null && serialized === previousAnchor;
      previousAnchor = serialized;
      return settled;
    })
    .toBe(true);
  const anchor = (await readAnchor(page))!;
  expect(anchor).toBeTruthy();
  await session.clickSessionChatTab();
  await expect(scroll).not.toBeVisible();
  const hiddenFile = "navigation-available/0000-hidden-addition.ts";
  git.createFile(hiddenFile, "export const hiddenAddition = true;\n");
  await waitForChangedFile(page, item.task.session_id!, hiddenFile);
  await expect(scroll).not.toBeVisible();
  await page.setViewportSize({ width: 1100, height: 900 });

  await session.clickTab("Changes");
  await expect(scroll).toBeVisible();
  await expectAnchor(page, anchor);

  await positionChangesWithChat(page, item.task.session_id!, true);
  await expectAnchor(page, anchor);
  const editor = page.getByTestId("chat-input-area").locator(".tiptap");
  await editor.click();
  await expect(editor).toBeFocused();
  await expect(scroll).toBeVisible();
  const visibleFile = "navigation-available/0001-visible-addition.ts";
  git.createFile(visibleFile, "export const visibleAddition = true;\n");
  await waitForChangedFile(page, item.task.session_id!, visibleFile);
  await expectAnchor(page, anchor);
  await expect(editor).toBeFocused();
});
