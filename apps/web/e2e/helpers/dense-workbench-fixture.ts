import { createHash, randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { dwell } from "./causal-waits";
import type { ApiClient } from "./api-client";
import type { SeedData } from "../fixtures/test-base";

const layout = process.env.KANDEV_DENSE_LAYOUT ?? "grid";
if (layout !== "grid" && layout !== "columns") throw new Error("Unknown dense layout");

export const DENSE_WORKLOAD = {
  layout,
  tasks: Number(process.env.KANDEV_DENSE_TASKS ?? 1_000),
  columns: Number(process.env.KANDEV_DENSE_COLUMNS ?? 30),
  messages: Number(process.env.KANDEV_DENSE_MESSAGES ?? 1_000),
  durationMs: Number(process.env.KANDEV_DENSE_WINDOW_MS ?? 60_000),
};

export type DenseThread = {
  taskId: string;
  sessionId: string;
  messageId: string;
  title: string;
  content: string;
  siblings: string[];
};

export function denseMessage(index: number, title: string) {
  const marker = `${title} message ${String(index).padStart(4, "0")}`;
  return (
    `${marker}\n\n${"Deterministic performance fixture content. ".repeat(20)}\n\n` +
    (index % 3 === 0
      ? "```typescript\nexport const ready = true;\n```"
      : "Measured conversation text.")
  );
}

async function seedHistory(
  api: ApiClient,
  sessionId: string,
  title: string,
  count: number,
  mixed = false,
) {
  let messageId = "";
  let content = "";
  const hash = createHash("sha256");
  for (let index = 0; index < count; index++) {
    content = denseMessage(index, title);
    hash.update(content);
    const type = mixed && index % 10 === 2 ? "tool_execute" : "message";
    const message = await api.seedSessionMessage(sessionId, {
      type,
      content,
      ...(mixed
        ? {
            authorType: index % 20 === 0 ? ("user" as const) : ("agent" as const),
            newTurn: index % 20 === 0,
            turnStartedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
            turnCompletedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index + 1)).toISOString(),
            turnMetadata: { model: "dense-fixture", duration_ms: 1000 },
            ...(type === "tool_execute"
              ? {
                  metadata: {
                    tool_call_id: `${title}-${index}`,
                    status: "complete",
                    normalized: {
                      shell_exec: {
                        command: "cat fixture.ts",
                        output: { stdout: content, exit_code: 0 },
                      },
                    },
                  },
                }
              : {}),
          }
        : {}),
    });
    messageId = message.messageId;
  }
  const stored = await api.listSessionMessages(sessionId);
  expect(stored.messages).toHaveLength(count);
  const storedHash = createHash("sha256");
  for (const message of stored.messages) storedHash.update(message.content);
  expect(storedHash.digest("hex")).toBe(hash.digest("hex"));
  return { messageId, content };
}

function backgroundTaskState(index: number) {
  return index % 2 === 0 ? "TODO" : "COMPLETED";
}

export async function seedDenseWorkbench(api: ApiClient, seed: SeedData, canonical = false) {
  const threads: DenseThread[] = [];
  const manifest: Array<{ title: string; messages: number; siblings: number }> = [];
  for (let index = 0; index < DENSE_WORKLOAD.tasks; index++) {
    const title = `Dense task ${String(index).padStart(4, "0")}`;
    let taskId: string;
    let sessionId: string;
    if (canonical && index < Math.min(6, DENSE_WORKLOAD.columns)) {
      const task = await api.createTask(seed.workspaceId, title, {
        agent_profile_id: seed.agentProfileId,
        workflow_id: seed.workflowId,
        workflow_step_id: seed.startStepId,
        repository_ids: [seed.repositoryId],
      });
      const prepared = await api.launchSession({
        task_id: task.id,
        agent_profile_id: seed.agentProfileId,
        executor_profile_id: seed.worktreeExecutorProfileId,
        workflow_step_id: seed.startStepId,
        prompt: "",
        intent: "prepare",
        launch_workspace: true,
      });
      taskId = task.id;
      sessionId = prepared.session_id;
      await expect
        .poll(async () => (await api.getTaskEnvironment(taskId))?.status, { timeout: 60_000 })
        .toBe("ready");
    } else {
      ({ task_id: taskId } = await api.seedTask(seed.workspaceId, title, {
        workflow_id: seed.workflowId,
        workflow_step_id: seed.startStepId,
        state: index < DENSE_WORKLOAD.columns ? "IN_PROGRESS" : backgroundTaskState(index),
      }));
      if (index >= DENSE_WORKLOAD.columns) continue;
      ({ session_id: sessionId } = await api.seedTaskSession(taskId, {
        state: "WAITING_FOR_INPUT",
        agentProfileId: seed.agentProfileId,
        repositoryId: seed.repositoryId,
        sessionId: randomUUID(),
      }));
    }
    await api.setPrimarySession(sessionId);
    const history = await seedHistory(api, sessionId, title, DENSE_WORKLOAD.messages, canonical);
    const siblings = [];
    for (let sibling = 0; sibling < 2; sibling++) {
      const { session_id: siblingId } = await api.seedTaskSession(taskId, {
        sessionId: randomUUID(),
        state: "WAITING_FOR_INPUT",
        agentProfileId: seed.agentProfileId,
        repositoryId: seed.repositoryId,
      });
      await seedHistory(
        api,
        siblingId,
        `${title} sibling ${sibling}`,
        Math.min(100, DENSE_WORKLOAD.messages),
        canonical,
      );
      siblings.push(siblingId);
    }
    threads.push({ taskId, sessionId, title, ...history, siblings });
    manifest.push({ title, messages: DENSE_WORKLOAD.messages, siblings: 2 });
  }
  return { threads, manifest, workload: DENSE_WORKLOAD };
}

export async function streamDenseUpdates(api: ApiClient, threads: DenseThread[], start: number) {
  let updates = 0;
  for (let tick = 0; tick < DENSE_WORKLOAD.durationMs / 200; tick++) {
    await dwell(
      Math.max(0, start + tick * 200 - performance.now()),
      "clock-separation",
      "fixed five-Hz producer schedule for the dense benchmark",
    );
    for (const thread of threads) {
      await api.updateSessionMessage(
        thread.messageId,
        `${thread.content}\nDense live tick ${tick}`,
      );
      updates++;
    }
  }
  await dwell(
    Math.max(0, start + DENSE_WORKLOAD.durationMs - performance.now()),
    "clock-separation",
    "complete the fixed streaming observation window",
  );
  return updates;
}
