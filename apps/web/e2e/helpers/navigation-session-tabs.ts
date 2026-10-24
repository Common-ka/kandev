import { expect, type Page } from "@playwright/test";
import type { SeedData } from "../fixtures/test-base";
import type { ApiClient } from "./api-client";
import { waitForSessionDone } from "./session";
import type { prepareProfileTask } from "../tests/task/task-navigation-profile-helpers";

export type NavigationProfileItem = Awaited<ReturnType<typeof prepareProfileTask>>;

export async function prepareNavigationSibling(
  api: ApiClient,
  seed: SeedData,
  first: NavigationProfileItem,
  historyCount = 100,
) {
  const sibling = await api.launchSession({
    task_id: first.task.id,
    agent_profile_id: seed.agentProfileId,
    executor_profile_id: seed.worktreeExecutorProfileId,
    workflow_step_id: seed.startStepId,
    intent: "prepare",
    launch_workspace: true,
    prompt: "",
  });
  const { sessions } = await api.listTaskSessions(first.task.id);
  const firstEnvironment = sessions.find(
    (session) => session.id === first.task.session_id,
  )?.task_environment_id;
  const siblingEnvironment = sessions.find(
    (session) => session.id === sibling.session_id,
  )?.task_environment_id;
  expect(firstEnvironment).toBeTruthy();
  expect(siblingEnvironment).toBe(firstEnvironment);
  await api.seedAgentMessages(
    sibling.session_id,
    historyCount,
    `Profile conversation ${first.task.title}`,
  );
  return {
    ...first,
    task: { ...first.task, session_id: sibling.session_id },
    messageCount: (await api.listSessionMessages(sibling.session_id)).messages.length,
    taskEnvironmentId: siblingEnvironment!,
  };
}

export async function startNavigationSession(
  api: ApiClient,
  seed: SeedData,
  item: NavigationProfileItem,
) {
  await api.launchSession({
    task_id: item.task.id,
    session_id: item.task.session_id!,
    agent_profile_id: seed.agentProfileId,
    executor_profile_id: seed.worktreeExecutorProfileId,
    workflow_step_id: seed.startStepId,
    prompt: "/e2e:simple-message",
    intent: "start_created",
  });
  await waitForSessionDone(
    api,
    item.task.id,
    item.task.session_id!,
    "Navigation sample agents settled",
    60_000,
  );
}

export async function assertSingleVisibleNavigationSession(page: Page, sessionId: string) {
  await expect
    .poll(() =>
      page
        .locator('[data-testid="session-chat"][data-detail-active="true"]')
        .evaluateAll((panels) => panels.map((panel) => panel.getAttribute("data-session-id"))),
    )
    .toEqual([sessionId]);
}

export async function waitForNavigationSession(page: Page, item: NavigationProfileItem) {
  const handle = await page.waitForFunction(
    ({ taskId, sessionId, marker }) => {
      const win = window as Window & {
        __KANDEV_E2E_STORE__?: import("zustand").StoreApi<import("../../lib/state/store").AppState>;
        __dockviewApi__?: import("dockview-react").DockviewApi;
      };
      const state = win.__KANDEV_E2E_STORE__?.getState();
      const environmentId = state?.environmentIdBySessionId[sessionId];
      if (
        !environmentId ||
        state?.tasks.activeTaskId !== taskId ||
        state.tasks.activeSessionId !== sessionId
      )
        return false;
      if (!win.__dockviewApi__?.getPanel(`session:${sessionId}`)?.api.isVisible) return false;
      const chat = document.querySelector(
        `[data-testid="session-chat"][data-session-id="${sessionId}"]`,
      );
      if (!chat?.querySelector('.tiptap[contenteditable="true"]')) return false;
      if (
        !Array.from(chat.querySelectorAll("[data-agent-message-body]")).some((body) =>
          body.textContent?.includes(marker),
        )
      )
        return false;
      return { taskId, sessionId, environmentId };
    },
    {
      taskId: item.task.id,
      sessionId: item.task.session_id!,
      marker: `Profile conversation ${item.task.title}`,
    },
    { timeout: 30_000 },
  );
  try {
    return await handle.jsonValue();
  } finally {
    await handle.dispose();
  }
}
