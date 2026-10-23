import { createHash, randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { dwell } from "./causal-waits";
import type { ApiClient } from "./api-client";
import type { SeedData } from "../fixtures/test-base";

export const DENSE_WORKLOAD = {
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

async function seedHistory(api: ApiClient, sessionId: string, title: string, count: number) {
  let messageId = "";
  let content = "";
  const hash = createHash("sha256");
  for (let index = 0; index < count; index++) {
    content = denseMessage(index, title);
    hash.update(content);
    const message = await api.seedSessionMessage(sessionId, { type: "message", content });
    messageId = message.messageId;
  }
  const stored = await api.listSessionMessages(sessionId);
  expect(stored.messages).toHaveLength(count);
  const storedHash = createHash("sha256");
  for (const message of stored.messages) storedHash.update(message.content);
  expect(storedHash.digest("hex")).toBe(hash.digest("hex"));
  return { messageId, content };
}

export async function seedDenseWorkbench(api: ApiClient, seed: SeedData) {
  const threads: DenseThread[] = [];
  const manifest: Array<{ title: string; messages: number; siblings: number }> = [];
  for (let index = 0; index < DENSE_WORKLOAD.tasks; index++) {
    const title = `Dense task ${String(index).padStart(4, "0")}`;
    const { task_id: taskId } = await api.seedTask(seed.workspaceId, title, {
      workflow_id: seed.workflowId,
      workflow_step_id: seed.startStepId,
      state: index < DENSE_WORKLOAD.columns ? "IN_PROGRESS" : "BACKLOG",
    });
    if (index >= DENSE_WORKLOAD.columns) continue;
    const { session_id: sessionId } = await api.seedTaskSession(taskId, {
      state: "WAITING_FOR_INPUT",
      agentProfileId: seed.agentProfileId,
      repositoryId: seed.repositoryId,
      sessionId: randomUUID(),
    });
    await api.setPrimarySession(sessionId);
    const history = await seedHistory(api, sessionId, title, DENSE_WORKLOAD.messages);
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
