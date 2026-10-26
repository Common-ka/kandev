import fs from "node:fs";
import type { AppState } from "@/lib/state/store";
import { test, expect } from "../../fixtures/test-base";
import { waitForSessionDone } from "../../helpers/session";
import { SessionPage } from "../../pages/session-page";

test("queued follow scroll keeps the reader's position through later growth", async ({
  testPage,
  apiClient,
  seedData,
}, info) => {
  await testPage.emulateMedia({ reducedMotion: "no-preference" });
  const task = await apiClient.createTaskWithAgent(
    seedData.workspaceId,
    "Queued follow scroll",
    seedData.agentProfileId,
    {
      description: "/e2e:simple-message",
      workflow_id: seedData.workflowId,
      workflow_step_id: seedData.startStepId,
      repository_ids: [seedData.repositoryId],
    },
  );
  if (!task.session_id) throw new Error("Scroll regression needs a session");
  await waitForSessionDone(apiClient, task.id, task.session_id, "scroll seed should finish");
  await apiClient.seedAgentMessages(task.session_id, 40, "UPWARD-INTENT-HISTORY");
  await testPage.goto(`/t/${task.id}`);
  const session = new SessionPage(testPage);
  await session.waitForLoad();
  await session.waitForChatIdle();
  const scroller = session.activeChat().locator(".chat-message-list");
  await expect
    .poll(() => scroller.evaluate((el) => el.scrollHeight - el.clientHeight))
    .toBeGreaterThan(400);
  await expect
    .poll(() => scroller.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop))
    .toBeLessThan(3);

  const reading = await scroller.evaluate(async (element, sessionId) => {
    const el = element as HTMLElement;
    const store = (window as Window & { __KANDEV_E2E_STORE__?: { getState(): AppState } })
      .__KANDEV_E2E_STORE__;
    if (!store) throw new Error("Scroll regression needs the E2E store");
    const state = store.getState();
    const message = state.messages.bySession[sessionId].find(
      (item) => item.content === "UPWARD-INTENT-HISTORY 40",
    );
    if (!message) throw new Error("Missing regression history message");
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const grow = (label: string) => {
      const current = store
        .getState()
        .messages.bySession[sessionId].find((item) => item.id === message.id)!;
      state.updateMessage({
        ...current,
        content: `${current.content}\n\n${label} one\n\n${label} two`,
        updated_at: new Date().toISOString(),
      });
    };
    const before = { top: el.scrollTop, height: el.scrollHeight };
    // Replay the observed order. Real wheel and touch behavior has separate coverage.
    el.dispatchEvent(new WheelEvent("wheel", { deltaY: -160 }));
    el.dispatchEvent(new Event("scroll"));
    grow("BEFORE-NATIVE-MOVEMENT");
    await frame();
    await frame();
    el.scrollTop = before.top - 160;
    el.dispatchEvent(new Event("scroll"));
    const heldTop = el.scrollTop;
    const heldHeight = el.scrollHeight;
    grow("AFTER-NATIVE-MOVEMENT");
    const samples: number[] = [];
    for (let index = 0; index < 24; index++) {
      await frame();
      samples.push(el.scrollTop);
    }
    return {
      before,
      heldTop,
      heldHeight,
      samples,
      final: { top: el.scrollTop, height: el.scrollHeight },
    };
  }, task.session_id);
  const evidencePath = info.outputPath("queued-upward-reading.json");
  fs.writeFileSync(evidencePath, JSON.stringify(reading, null, 2));
  await info.attach("queued-upward-reading.json", { path: evidencePath });
  expect(reading.heldTop).toBeLessThan(reading.before.top - 100);
  expect(reading.final.height).toBeGreaterThan(reading.heldHeight);
  expect(Math.max(...reading.samples.map((top) => Math.abs(top - reading.heldTop)))).toBeLessThan(
    3,
  );
});
