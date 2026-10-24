import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDenseExtraBusyHeaders, seedDenseBusyHeaders } from "./dense-busy-headers";

test("keeps the default workload and bounds extra busy headers to column shells", () => {
  assert.equal(parseDenseExtraBusyHeaders(undefined, "grid", 30), 0);
  assert.equal(parseDenseExtraBusyHeaders("24", "columns", 30), 24);
  for (const value of ["-1", "1.5", "invalid", "25"])
    assert.throws(() => parseDenseExtraBusyHeaders(value, "columns", 30), /busy headers/);
  assert.throws(() => parseDenseExtraBusyHeaders("1", "grid", 30), /columns/);
});

test("seeds only the supplied header sessions through the existing backend API", async () => {
  const calls: unknown[] = [];
  const api = {
    async seedTaskSession(taskId: string, options: { sessionId?: string; state: string }) {
      calls.push({ taskId, ...options });
      return { session_id: options.sessionId! };
    },
  };
  await seedDenseBusyHeaders(api, []);
  assert.deepEqual(calls, []);
  await seedDenseBusyHeaders(api, [
    { taskId: "task-7", sessionId: "session-7" },
    { taskId: "task-8", sessionId: "session-8" },
  ]);
  assert.deepEqual(calls, [
    { taskId: "task-7", sessionId: "session-7", state: "RUNNING" },
    { taskId: "task-8", sessionId: "session-8", state: "RUNNING" },
  ]);
});

test("rejects a seed operation that changes a header session's identity", async () => {
  const api = {
    async seedTaskSession() {
      return { session_id: "different" };
    },
  };
  await assert.rejects(
    seedDenseBusyHeaders(api, [{ taskId: "task-7", sessionId: "session-7" }]),
    /identity/,
  );
});
