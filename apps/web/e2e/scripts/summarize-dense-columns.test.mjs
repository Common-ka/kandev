import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeReport } from "./summarize-dense-performance.mjs";

function columnSample(arm) {
  return {
    arm,
    pair: 0,
    cpuRate: 1,
    layout: "columns",
    cold: { resources: [], readyMs: 100, documentMs: 50 },
    runs: [],
  };
}

test("labels columns separately from the six-chat grid", () => {
  const result = summarizeReport({
    layout: "columns",
    samples: [columnSample("baseline"), columnSample("candidate")],
  });
  assert.deepEqual([...new Set(result.comparisons.map((row) => row.group))], ["1x/columns-cold"]);
  assert.equal(result.layout, "columns");
});

test("rejects pairs with different layouts", () => {
  assert.throws(
    () =>
      summarizeReport({
        layout: "columns",
        samples: [columnSample("baseline"), { ...columnSample("candidate"), layout: "grid" }],
      }),
    /layout/,
  );
});
