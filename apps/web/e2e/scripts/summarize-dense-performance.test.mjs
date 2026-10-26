import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizePairs, summarizeReport } from "./summarize-dense-performance.mjs";

test("keeps task elapsed time separate from thread and renderer CPU time", () => {
  const samples = ["baseline", "candidate"].map((arm, index) => ({
    arm,
    pair: 0,
    cpuRate: 1,
    selections: [{ paintOpportunityMs: 100, counts: {} }],
    measured: {
      elapsedMs: 10_000,
      metrics: {
        TaskDuration: index ? 5 : 8,
        ThreadTime: index ? 3 : 4,
        ProcessTime: index ? 9 : 10,
        ScriptDuration: 1,
        RecalcStyleDuration: 1,
        LayoutDuration: 1,
        RecalcStyleCount: 1,
        LayoutCount: 1,
      },
      browser: { frameGapsMs: [], longTasksMs: [], domNodes: 1, editors: 1, animations: {} },
    },
  }));
  const report = summarizeReport({ samples });
  const metric = (name) => report.comparisons.find((entry) => entry.metric === name);
  assert.equal(metric("mainThreadMs").baseline.median, 8_000);
  assert.equal(metric("mainThreadMs").medianPairedPercentReduction, 37.5);
  assert.equal(metric("mainThreadCpuMs")?.baseline.median, 4_000);
  assert.equal(metric("mainThreadCpuMs")?.medianPairedPercentReduction, 25);
  assert.equal(metric("rendererCpuMs")?.baseline.median, 10_000);
  assert.equal(metric("rendererCpuMs")?.medianPairedPercentReduction, 10);
  delete samples[0].measured.metrics.ThreadTime;
  assert.throws(() => summarizeReport({ samples }), /finite/);
});

test("rejects CPU attribution runs as timing comparisons", () => {
  assert.throws(
    () => summarizeReport({ measurementKind: "cpu-attribution", samples: [] }),
    /attribution/,
  );
});

test("rejects animation attribution runs as timing comparisons", () => {
  assert.throws(
    () => summarizeReport({ measurementKind: "animation-attribution", samples: [] }),
    /attribution/,
  );
});

test("rejects explicit read-cause diagnostics as timing comparisons", () => {
  assert.throws(
    () => summarizeReport({ measurementKind: "read-attribution", samples: [] }),
    /attribution/,
  );
});

test("rejects native input diagnostics as timing comparisons", () => {
  assert.throws(
    () => summarizeReport({ measurementKind: "native-input-attribution", samples: [] }),
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
