import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { test, expect, type SeedData } from "../../fixtures/test-base";
import type { BackendContext } from "../../fixtures/backend";
import type { ApiClient } from "../../helpers/api-client";
import { withNativeBrowser } from "../../helpers/native-browser";
import {
  installFixturePlugin,
  uninstallFixturePlugin,
  PLUGIN_ID,
} from "../../helpers/plugin-fixture";
import { waitForSessionDone } from "../../helpers/session";
import { readTranscriptScrollState } from "../../helpers/transcript-scroll";
import { attachGatewayTrafficCapture, type GatewayTrafficFrame } from "../../helpers/ws-traffic";
import {
  expectCompositorPulse,
  expectCompositorMotionPaused,
} from "../../helpers/animation-assertions";
import { dwell } from "../../helpers/causal-waits";
import { SessionPage } from "../../pages/session-page";

type NativeVisibilityWindow = Window & {
  nativeVisibilityEvents?: Array<{ state: string; hidden: boolean }>;
};
const DRAFT = "Keep this draft across a real document hide and restore";

async function createNativeHistory(api: ApiClient, seed: SeedData) {
  const task = await api.createTaskWithAgent(
    seed.workspaceId,
    "Native document lifecycle",
    seed.agentProfileId,
    {
      description: "/e2e:simple-message",
      workflow_id: seed.workflowId,
      workflow_step_id: seed.startStepId,
      repository_ids: [seed.repositoryId],
    },
  );
  if (!task.session_id) throw new Error("Native lifecycle fixture needs a session");
  await waitForSessionDone(api, task.id, task.session_id, "initial native visibility turn settled");
  for (let index = 0; index < 40; index++) {
    await api.seedSessionMessage(task.session_id, {
      type: "message",
      content: `Native history ${index}. ${"Retain the reader's position. ".repeat(12)}`,
      authorType: "agent",
    });
  }
  return { ...task, session_id: task.session_id };
}

function nativeStreamFiles(backend: BackendContext) {
  const prefix = path.join(backend.tmpDir, `native-visibility-${randomUUID()}`);
  const release = `${prefix}-release`;
  const finish = `${prefix}-finish`;
  const script = [
    'e2e:message("Native visibility warmup\\n")',
    `e2e:await_file(${JSON.stringify(release)})`,
    ...Array.from(
      { length: 12 },
      (_, index) => `e2e:message("Native hidden tick ${index}\\n")\ne2e:delay(200)`,
    ),
    `e2e:await_file(${JSON.stringify(finish)})`,
  ].join("\n");
  return { release, finish, script };
}

async function prepareNativePage(page: Page, backend: BackendContext, taskId: string) {
  await page.addInitScript((port) => {
    localStorage.setItem("kandev.onboarding.completed", "true");
    window.__KANDEV_API_PORT = port;
    window.__KANDEV_E2E_EXPOSE_STORE__ = true;
  }, String(backend.port));
  await page.goto(new URL(`/t/${taskId}`, backend.frontendUrl).href);
  const session = new SessionPage(page);
  await session.waitForLoad();
  await session.waitForChatIdle();
  return session;
}

async function openNativePlugin(page: Page, session: SessionPage, sessionId: string) {
  await session.addPanelButton().click();
  await session.addPanelPluginItem(PLUGIN_ID, "prompt-history-plugin").click();
  await page.evaluate(
    ({ pluginId, id }) => {
      const api = (window as Window & { __dockviewApi__: import("dockview-react").DockviewApi })
        .__dockviewApi__;
      const plugin = api.getPanel(`plugin:${pluginId}:prompt-history-plugin`)!;
      const chat = api.getPanel(`session:${id}`)!;
      plugin.api.moveTo({ group: chat.group, position: "right" });
      chat.api.setActive();
    },
    { pluginId: PLUGIN_ID, id: sessionId },
  );
  await expect(page.getByTestId("fixture-prompt-history-panel")).toBeVisible();
  const row = page.getByTestId("fixture-prompt-history-row").first();
  const expandedId = await row.getAttribute("data-message-id");
  expect(expandedId).toBeTruthy();
  await row.getByRole("button").first().click();
  await expect(row.getByTestId("fixture-prompt-history-detail")).toBeVisible();
  return expandedId!;
}

function historyReads(frames: readonly GatewayTrafficFrame[], sessionId: string) {
  return frames.filter(
    (frame) =>
      frame.direction === "sent" &&
      frame.action === "message.list" &&
      frame.sessionId === sessionId,
  ).length;
}

async function installVisibilityRecorder(page: Page) {
  await page.evaluate(() => {
    const target = window as NativeVisibilityWindow;
    target.nativeVisibilityEvents = [];
    document.addEventListener("visibilitychange", () =>
      target.nativeVisibilityEvents!.push({
        state: document.visibilityState,
        hidden: document.hidden,
      }),
    );
  });
  return page.evaluate(() => performance.timeOrigin);
}

test.afterEach(async ({ apiClient }) => uninstallFixturePlugin(apiClient));

for (const plugin of [false, true]) {
  test(`restores ${plugin ? "plugin and native" : "native"} content, draft and scroll after real document hiding`, async ({
    testPage,
    apiClient: api,
    seedData: seed,
    backend,
  }, info) => {
    test.setTimeout(120_000);
    if (plugin) await installFixturePlugin(testPage);
    await testPage.close();
    const task = await createNativeHistory(api, seed);
    const stream = nativeStreamFiles(backend);
    const evidence: Record<string, unknown> = {
      plugin,
      mode: "CDP default context with noDefaults",
    };
    const checkpoint = (stage: string) => {
      evidence.stage = stage;
      fs.writeFileSync(
        info.outputPath("native-document-progress.json"),
        JSON.stringify(evidence, null, 2),
      );
    };
    try {
      await withNativeBrowser(async (context, version) => {
        const page = context.pages()[0];
        const capture = attachGatewayTrafficCapture(page);
        const session = await prepareNativePage(page, backend, task.id);
        checkpoint("native page ready");
        const expandedPluginMessageId = plugin
          ? await openNativePlugin(page, session, task.session_id)
          : null;
        await session.sendMessageViaButton(stream.script);
        const chat = session.activeChat();
        await expect(
          chat.locator("[data-agent-message-body]").filter({ hasText: "Native visibility warmup" }),
        ).toBeVisible();
        const glow = chat.getByTestId("chat-input-glow");
        await expectCompositorPulse(glow);
        await chat.locator(".tiptap").fill(DRAFT);
        const transcript = chat.locator(".chat-message-list");
        await transcript.hover();
        await page.mouse.wheel(0, -650);
        await expect
          .poll(async () => {
            const state = await readTranscriptScrollState(transcript);
            return state.scrollHeight - state.clientHeight - state.scrollTop;
          })
          .toBeGreaterThan(200);
        const scrollBefore = await readTranscriptScrollState(transcript);
        const timeOrigin = await installVisibilityRecorder(page);
        Object.assign(evidence, { version, timeOrigin, scrollBefore });
        checkpoint("stream ready");
        const other = await context.newPage();
        await other.goto("data:text/html,<title>Background the Kandev tab</title>");
        await other.bringToFront();
        await expect.poll(() => page.evaluate(() => document.visibilityState)).toBe("hidden");
        await expectCompositorMotionPaused(glow);
        checkpoint("document hidden and motion paused");
        const readsBeforeHiddenUpdates = historyReads(capture.frames, task.session_id);
        fs.writeFileSync(stream.release, "start");
        const prompt = "Prompt received while the document was natively hidden";
        const hiddenPrompt = await api.seedSessionMessage(task.session_id, {
          type: "message",
          content: prompt,
          authorType: "user",
          newTurn: false,
        });
        await expect
          .poll(async () =>
            (await api.listSessionMessages(task.session_id)).messages.some(
              (message) =>
                message.author_type === "agent" &&
                message.content.includes("Native hidden tick 11"),
            ),
          )
          .toBe(true);
        const hiddenReadBaseline = historyReads(capture.frames, task.session_id);
        checkpoint("hidden updates committed");
        await dwell(
          12_000,
          "negative-assertion",
          "hidden running backfill has no interval-tick absence event",
        );
        const hiddenReadCount = historyReads(capture.frames, task.session_id);
        expect(hiddenReadCount).toBe(hiddenReadBaseline);
        await page.bringToFront();
        await expect.poll(() => page.evaluate(() => document.visibilityState)).toBe("visible");
        checkpoint("document restored");
        await expectCompositorPulse(glow);
        await expect(chat.locator(".tiptap")).toHaveText(DRAFT);
        await expect(chat.locator(`#msg-${hiddenPrompt.messageId}`)).toHaveCount(1);
        await expect(
          chat.locator("[data-agent-message-body]").filter({ hasText: "Native hidden tick 11" }),
        ).toHaveCount(1);
        if (plugin) {
          await expect(
            page
              .getByTestId("fixture-prompt-history-panel")
              .locator(`[data-message-id="${expandedPluginMessageId}"]`)
              .getByTestId("fixture-prompt-history-detail"),
          ).toBeVisible();
          const row = page
            .getByTestId("fixture-prompt-history-panel")
            .locator(`[data-message-id="${hiddenPrompt.messageId}"]`);
          await expect(row).toBeVisible();
          await row.getByRole("button").first().click();
          await expect(row.getByTestId("fixture-prompt-history-detail")).toContainText(prompt);
        }
        const scrollAfter = await readTranscriptScrollState(transcript);
        expect(Math.abs(scrollAfter.scrollTop - scrollBefore.scrollTop)).toBeLessThanOrEqual(2);
        expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
        const events = await page.evaluate(
          () => (window as NativeVisibilityWindow).nativeVisibilityEvents,
        );
        expect(events).toEqual([
          { state: "hidden", hidden: true },
          { state: "visible", hidden: false },
        ]);
        const history = await api.listSessionMessages(task.session_id);
        const content = history.messages.find(
          (message) =>
            message.author_type === "agent" && message.content.includes("Native hidden tick 11"),
        )!.content;
        expect(
          Array.from(content.matchAll(/Native hidden tick (\d+)/g), (match) => Number(match[1])),
        ).toEqual(Array.from({ length: 12 }, (_, i) => i));
        Object.assign(evidence, {
          version,
          events,
          scrollBefore,
          scrollAfter,
          timeOrigin,
          readsBeforeHiddenUpdates,
          hiddenReadBaseline,
          hiddenReadCount,
          restoredReadCount: historyReads(capture.frames, task.session_id),
          draftPreserved: true,
          orderedTicks: 12,
          expandedPluginPromptPreserved: plugin ? true : undefined,
        });
        checkpoint("lifecycle verified");
      });
    } catch (error) {
      evidence.bodyFailure = error instanceof Error ? error.stack : String(error);
      checkpoint("failed");
      throw error;
    } finally {
      fs.writeFileSync(stream.release, "start");
      fs.writeFileSync(stream.finish, "finish");
      try {
        await waitForSessionDone(api, task.id, task.session_id, "native visibility stream settled");
      } finally {
        const output = info.outputPath("native-document-lifecycle.json");
        fs.writeFileSync(output, JSON.stringify(evidence, null, 2));
        await info.attach("native document lifecycle", {
          path: output,
          contentType: "application/json",
        });
      }
    }
  });
}
