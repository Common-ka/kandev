import { test, expect } from "../../fixtures/test-base";
import { SessionPage } from "../../pages/session-page";

async function apiAvailable(page: import("@playwright/test").Page) {
  return page.evaluate(() =>
    Boolean((window as Window & { __dockviewApi__?: unknown }).__dockviewApi__),
  );
}

test("releases the departed Dockview API without losing drafts on return or responsive changes", async ({
  testPage: page,
  apiClient: api,
  seedData: seed,
}, info) => {
  test.setTimeout(120_000);
  const task = await api.createTask(seed.workspaceId, "Dockview owner release", {
    workflow_id: seed.workflowId,
    workflow_step_id: seed.startStepId,
  });
  const { session_id: sessionId } = await api.seedTaskSession(task.id, {
    sessionId: `owner-release-${task.id}`,
    state: "WAITING_FOR_INPUT",
    agentProfileId: seed.agentProfileId,
  });
  await api.seedSessionMessage(sessionId, {
    type: "message",
    content: "Dockview owner release history",
    authorType: "agent",
  });
  await page.goto(`/t/${task.id}?sessionId=${sessionId}`);
  const session = new SessionPage(page);
  await session.waitForLoad();
  await expect(session.activeChat()).toContainText("Dockview owner release history");
  await expect.poll(() => apiAvailable(page)).toBe(true);
  const origin = await page.evaluate(() => performance.timeOrigin);
  const draft = "Keep this draft after leaving the task and changing the viewport";
  await session.activeChat().locator(".tiptap").fill(draft);
  await page.getByTestId("sidebar-settings-gear").click();
  await expect(page).toHaveURL(/\/settings(?:\/|$)/);
  await expect(page.getByTestId("dockview-task-layout")).toHaveCount(0);
  await expect.poll(() => apiAvailable(page)).toBe(false);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  await page.goBack();
  await session.waitForLoad();
  await expect.poll(() => apiAvailable(page)).toBe(true);
  await expect(session.activeChat().locator(".tiptap")).toHaveText(draft);
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("mobile-task-layout")).toBeVisible();
  await expect.poll(() => apiAvailable(page)).toBe(false);
  await expect(session.activeChat().locator(".tiptap")).toHaveText(draft);
  const phoneCapture = info.outputPath("owner-release-phone.png");
  await page.screenshot({ path: phoneCapture });
  await info.attach("owner-release-phone", { path: phoneCapture, contentType: "image/png" });
  await page.setViewportSize(viewport);
  await expect(page.getByTestId("dockview-task-layout")).toBeVisible();
  await expect.poll(() => apiAvailable(page)).toBe(true);
  await expect(session.activeChat().locator(".tiptap")).toHaveText(draft);
  const desktopCapture = info.outputPath("owner-release-desktop.png");
  await page.screenshot({ path: desktopCapture });
  await info.attach("owner-release-desktop", { path: desktopCapture, contentType: "image/png" });
});
