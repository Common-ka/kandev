import fs from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";
import type { BackendContext } from "../fixtures/backend";
import type { SeedData } from "../fixtures/test-base";
import type { ApiClient } from "./api-client";
import { DENSE_WORKLOAD, type DenseThread } from "./dense-workbench-fixture";
import { waitForAgentMessage, waitForSessionDone } from "./session";
import { inspectDenseStreamProgress } from "./dense-stream-progress";

export async function prepareDenseStream(
  api: ApiClient,
  seed: SeedData,
  backend: BackendContext,
  threads: DenseThread[],
  sample: string,
) {
  const release = path.join(backend.tmpDir, `${sample}-release`);
  const finish = path.join(backend.tmpDir, `${sample}-finish`);
  const updatesPerSession = Math.ceil(DENSE_WORKLOAD.durationMs / 200);
  const warmup = "Dense canonical warmup";
  const lastMarker = `Dense canonical tick ${updatesPerSession - 1}`;
  const script = [
    `e2e:message(${JSON.stringify(`${warmup}\n`)})`,
    `e2e:await_file(${JSON.stringify(release)})`,
    ...Array.from(
      { length: updatesPerSession },
      (_, i) => `e2e:message(${JSON.stringify(`Dense canonical tick ${i}\n`)})\ne2e:delay(200)`,
    ),
    `e2e:await_file(${JSON.stringify(finish)})`,
  ].join("\n");
  for (const thread of threads) {
    await api.launchSession(
      {
        task_id: thread.taskId,
        session_id: thread.sessionId,
        agent_profile_id: seed.agentProfileId,
        prompt: script,
        intent: "start_created",
      },
      60_000,
    );
    await waitForAgentMessage(api, thread.sessionId, warmup);
  }
  const verificationErrors: Array<{ sessionId: string; at: number; message: string }> = [];
  return {
    verificationErrors,
    warmup,
    lastMarker,
    scheduledUpdates: updatesPerSession * threads.length,
    release: () => fs.writeFileSync(release, "start"),
    inspect: (page: Page) => inspectDenseStreamProgress(page, api, threads),
    async waitForVisible(page: Page) {
      for (const thread of threads) {
        await expect(
          page
            .getByTestId(`thread-column-${thread.taskId}`)
            .locator("[data-agent-message-body]")
            .filter({ hasText: lastMarker }),
        ).toBeVisible({ timeout: 30_000 });
      }
    },
    async verify() {
      for (const thread of threads) {
        let history: Awaited<ReturnType<ApiClient["listSessionMessages"]>> | undefined;
        await expect
          .poll(
            async () => {
              try {
                history = await api.listSessionMessages(thread.sessionId);
                return true;
              } catch (error) {
                const message = String(error);
                verificationErrors.push({ sessionId: thread.sessionId, at: Date.now(), message });
                if (!message.includes("(503)")) throw error;
                return false;
              }
            },
            {
              timeout: 60_000,
              intervals: [1_000],
              message: "read committed stream after measurement",
            },
          )
          .toBe(true);
        const final = history!.messages.find(
          (message) => message.author_type === "agent" && message.content.includes(lastMarker),
        );
        expect(final?.metadata?.durable_delivery).toBe(true);
        expect(final?.content.match(/Dense canonical tick /g)).toHaveLength(updatesPerSession);
      }
      return { verificationErrors };
    },
    async finish() {
      fs.writeFileSync(release, "start");
      fs.writeFileSync(finish, "finish");
      for (const thread of threads)
        await waitForSessionDone(
          api,
          thread.taskId,
          thread.sessionId,
          "dense canonical stream settled",
          90_000,
        );
    },
  };
}
