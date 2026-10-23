import { test } from "node:test";
import assert from "node:assert/strict";
import {
  inspectDenseStreamProgress,
  summarizeStreamTicks,
} from "../helpers/dense-stream-progress.ts";

test("distinguishes missing ticks from duplicate delivery", () => {
  assert.deepEqual(
    summarizeStreamTicks([
      "Dense canonical tick 0\nDense canonical tick 1\n",
      "Dense canonical tick 1\nDense canonical tick 3\n",
    ]),
    { count: 4, uniqueCount: 3, lastTick: 3 },
  );
});

test("keeps an empty or warmup-only stream distinct from tick zero", () => {
  assert.deepEqual(summarizeStreamTicks(["Dense canonical warmup"]), {
    count: 0,
    uniqueCount: 0,
    lastTick: null,
  });
  assert.deepEqual(summarizeStreamTicks(["Dense canonical tick 0\n"]), {
    count: 1,
    uniqueCount: 1,
    lastTick: 0,
  });
});

test("excludes the scripted user prompt and records failed reads as unavailable", async () => {
  const page = {
    evaluate: async () => [{ sessionId: "one", mounted: true, contents: [] }],
  };
  const api = {
    listSessionMessages: async (sessionId) => {
      if (sessionId === "two") throw new Error("read failed (503)");
      return {
        messages: [
          { author_type: "user", content: "Dense canonical warmup Dense canonical tick 299" },
          { author_type: "agent", content: "Dense canonical warmup Dense canonical tick 3" },
        ],
      };
    },
  };
  const result = await inspectDenseStreamProgress(page, api, [
    { taskId: "task-one", sessionId: "one" },
    { taskId: "task-two", sessionId: "two" },
  ]);
  assert.equal(result.stored[0].lastTick, 3);
  assert.equal(result.stored[0].count, 1);
  assert.match(result.stored[1].error, /503/);
  assert.equal(result.stored[1].count, undefined);
});
