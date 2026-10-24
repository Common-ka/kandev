import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeReport } from "./summarize-dense-performance.mjs";

function sample(arm, extraBusyHeaders = 24) {
  return {
    arm,
    pair: 0,
    cpuRate: 1,
    layout: "columns",
    extraBusyHeaders,
    cold: { resources: [], readyMs: 100, documentMs: 50 },
    runs: [],
  };
}

test("labels the extra-busy-header fixture separately and preserves its count", () => {
  const result = summarizeReport({
    layout: "columns",
    extraBusyHeaders: 24,
    samples: [sample("baseline"), sample("candidate")],
  });
  assert.deepEqual(
    [...new Set(result.comparisons.map((row) => row.group))],
    ["1x/columns-busy-24-cold"],
  );
  assert.equal(result.extraBusyHeaders, 24);
});

test("rejects samples with different extra-busy-header counts", () => {
  assert.throws(
    () =>
      summarizeReport({
        layout: "columns",
        extraBusyHeaders: 24,
        samples: [sample("baseline"), sample("candidate", 0)],
      }),
    /busy.header/,
  );
});

test("rejects invalid busy-header counts", () => {
  for (const count of [-1, 1.5, "24"])
    assert.throws(
      () =>
        summarizeReport({
          layout: "columns",
          extraBusyHeaders: count,
          samples: [sample("baseline", count), sample("candidate", count)],
        }),
      /busy.header/,
    );
});
