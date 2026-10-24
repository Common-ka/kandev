import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeReport } from "./summarize-dense-performance.mjs";

const sample = (arm, finalVisibilityProbe) => ({
  arm,
  pair: 0,
  cpuRate: 1,
  finalVisibilityProbe,
  cold: { resources: [], readyMs: 100, documentMs: 50 },
  runs: [],
});

test("records the final-content probe used by both arms", () => {
  const mode = "boolean-poll";
  const result = summarizeReport({
    finalVisibilityProbe: mode,
    samples: [sample("baseline", mode), sample("candidate", mode)],
  });
  assert.equal(result.finalVisibilityProbe, mode);
});

test("keeps the legacy final-content probe explicit", () => {
  assert.equal(
    summarizeReport({ samples: [sample("baseline"), sample("candidate")] }).finalVisibilityProbe,
    "locator-assertion",
  );
});

test("rejects mixed final-content probes", () => {
  assert.throws(
    () =>
      summarizeReport({
        finalVisibilityProbe: "boolean-poll",
        samples: [sample("baseline", "boolean-poll"), sample("candidate", "locator-assertion")],
      }),
    /visibility probe/,
  );
});
