import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizePairs, summarizeReport } from "./summarize-dense-performance.mjs";

test("rejects CPU attribution runs as timing comparisons", () => {
  assert.throws(
    () => summarizeReport({ measurementKind: "cpu-attribution", samples: [] }),
    /attribution/,
  );
});

test("matches pair identity before computing changes and retains regressions", () => {
  const rows = [
    { arm: "candidate", pair: 1, cpuRate: 1, value: 240 },
    { arm: "baseline", pair: 0, cpuRate: 1, value: 100 },
    { arm: "baseline", pair: 1, cpuRate: 1, value: 200 },
    { arm: "candidate", pair: 0, cpuRate: 1, value: 50 },
  ];
  const result = summarizePairs(rows, (row) => row.value);
  assert.deepEqual(result.pairedPercentReduction, [50, -20]);
  assert.equal(result.baseline.median, 150);
  assert.equal(result.candidate.median, 145);
  assert.equal(result.medianPairedPercentReduction, 15);
});

test("reports absolute changes for zero baselines without inventing percentages", () => {
  const result = summarizePairs(
    [
      { arm: "baseline", pair: 0, value: 0 },
      { arm: "candidate", pair: 0, value: 2 },
    ],
    (row) => row.value,
  );
  assert.deepEqual(result.pairedPercentReduction, [null]);
  assert.deepEqual(result.pairedAbsoluteReduction, [-2]);
  assert.equal(result.medianPairedPercentReduction, null);
});

test("rejects missing, duplicate, and non-finite samples", () => {
  const baseline = { arm: "baseline", pair: 0, value: 1 };
  const candidate = { arm: "candidate", pair: 0, value: 2 };
  assert.throws(() => summarizePairs([baseline], (row) => row.value), /unpaired/);
  assert.throws(
    () => summarizePairs([baseline, baseline, candidate], (row) => row.value),
    /duplicate/,
  );
  assert.throws(
    () => summarizePairs([baseline, { ...candidate, value: NaN }], (row) => row.value),
    /finite/,
  );
});
