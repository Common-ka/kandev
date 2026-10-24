import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeReport } from "./summarize-dense-performance.mjs";

function warmSample(arm) {
  return {
    arm,
    pair: 0,
    cpuRate: 4,
    coldCpuRate: 1,
    throttleAfterLoad: true,
    cold: { resources: [], readyMs: 100, documentMs: 50 },
    runs: [
      {
        scenario: "streaming",
        elapsedMs: 1000,
        metrics: {
          TaskDuration: 1,
          ThreadTime: 0.5,
          ProcessTime: 1,
          ScriptDuration: 0.2,
          RecalcStyleDuration: 0.1,
          LayoutDuration: 0.1,
          RecalcStyleCount: 1,
          LayoutCount: 1,
        },
        browser: { frameGapsMs: [16], longTasksMs: [], domNodes: 1, editors: 1, animations: {} },
      },
    ],
  };
}

test("labels unthrottled loading separately from warm throttled streaming", () => {
  const result = summarizeReport({
    throttleAfterLoad: true,
    samples: [warmSample("baseline"), warmSample("candidate")],
  });
  assert.deepEqual(
    [...new Set(result.comparisons.map((row) => row.group))],
    ["1x/cold-before-4x", "4x/warm-streaming"],
  );
  assert.equal(result.throttleAfterLoad, true);
});

test("rejects comparisons that mix cold and warm throttling", () => {
  const candidate = { ...warmSample("candidate"), throttleAfterLoad: false };
  assert.throws(
    () =>
      summarizeReport({
        throttleAfterLoad: true,
        samples: [warmSample("baseline"), candidate],
      }),
    /throttling mode/,
  );
});

test("requires the warm-load phase to record an unthrottled CPU rate", () => {
  assert.throws(
    () =>
      summarizeReport({
        throttleAfterLoad: true,
        samples: [warmSample("baseline"), { ...warmSample("candidate"), coldCpuRate: 4 }],
      }),
    /cold CPU rate/,
  );
});
