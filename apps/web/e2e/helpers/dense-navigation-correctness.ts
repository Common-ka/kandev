import { expect, type Page, type TestInfo } from "@playwright/test";
import type { BackendContext } from "../fixtures/backend";
import type { SeedData } from "../fixtures/test-base";
import type { ApiClient } from "./api-client";
import { SessionPage } from "../pages/session-page";
import {
  ROOT_FILE,
  seedNavigationTasks,
  selectNavigationTask,
  showNavigationFiles,
} from "../tests/task/task-navigation-helpers";

export async function verifyDenseNavigation(options: {
  page: Page;
  api: ApiClient;
  seed: SeedData;
  backend: BackendContext;
  mobile: boolean;
  info: TestInfo;
}) {
  const { page, api, seed, backend, mobile, info } = options;
  if (process.env.KANDEV_DENSE_CANDIDATE_ASSETS)
    await backend.restart({ KANDEV_WEB_DIST_DIR: process.env.KANDEV_DENSE_CANDIDATE_ASSETS });
  const [a, b] = await seedNavigationTasks(api, seed, backend);
  await page.goto(`/t/${a.id}`);
  const session = new SessionPage(page);
  await session.waitForLoad();
  await session.waitForChatIdle();
  await showNavigationFiles(page, mobile);
  await session.fileTree.waitForFileTreeNode(ROOT_FILE);
  if (mobile) {
    const trigger = session.fileTreeNodeActions(ROOT_FILE);
    const box = await trigger.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await trigger.tap();
    await expect(session.fileTreeTouchMenu()).toBeVisible();
    await page.getByTestId("file-tree-touch-add-to-chat").tap();
    await page.getByRole("button", { name: "Chat", exact: true }).tap();
  } else {
    await expect(session.fileTreeNodeActions(ROOT_FILE)).toHaveCount(0);
    await session.fileTreeNode(ROOT_FILE).click({ button: "right" });
    await session.fileTreeAddToChatContextMenuItem().click();
    await session.clickSessionChatTab();
  }
  await expect(session.chatContextFile(ROOT_FILE)).toHaveCount(1);
  await session.fillMessage("Retain this navigation draft");
  for (const task of [b, a]) {
    await selectNavigationTask(page, task.title, mobile);
    await session.waitForLoad();
    await expect(
      session.activeChat().locator('.tiptap.ProseMirror[contenteditable="true"]:visible'),
    ).toBeEditable();
  }
  await expect(session.activeChat().locator(".tiptap.ProseMirror:visible")).toHaveText(
    "Retain this navigation draft",
  );
  await expect(session.chatContextFile(ROOT_FILE)).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await info.attach("navigation-draft-and-context", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}
