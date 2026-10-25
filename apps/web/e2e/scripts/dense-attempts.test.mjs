import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DENSE_ATTEMPT_PROTOCOL,
  createDenseAttempts,
  recordDenseAttempt,
  runDenseAttempts,
} from "../helpers/dense-attempts.ts";
import { summarizeReport } from "./summarize-dense-performance.mjs";

const BASELINE_FIRST = "baseline-1x-0";

function report(pairs = 2, rates = [1]) {
  return {
    attemptProtocol: DENSE_ATTEMPT_PROTOCOL,
    comparisonPlan: { pairs, rates, candidateFirst: false },
    attempts: createDenseAttempts({ pairs, rates }),
    samples: [],
    error: undefined,
  };
}

const identity = ({ arm, pair, cpuRate, sample }) => ({ arm, pair, cpuRate, sample });

test("plans every pair and CPU rate in alternating order", () => {
  const attempts = createDenseAttempts({ pairs: 2, rates: [1, 4] });
  assert.deepEqual(
    attempts.map((value) => value.sample),
    [
      BASELINE_FIRST,
      "candidate-1x-0",
      "candidate-1x-1",
      "baseline-1x-1",
      "baseline-4x-0",
      "candidate-4x-0",
      "candidate-4x-1",
      "baseline-4x-1",
    ],
  );
  assert.ok(attempts.every((value) => value.status === "pending"));
  assert.deepEqual(
    createDenseAttempts({ pairs: 2, rates: [1], candidateFirst: true }).map((value) => value.arm),
    ["candidate", "baseline", "baseline", "candidate"],
  );
});

test("rejects invalid counts and duplicate CPU rates before starting samples", () => {
  for (const pairs of [0, -1, 1.5, NaN])
    assert.throws(() => createDenseAttempts({ pairs, rates: [1] }), /pair/i);
  for (const rates of [[], [0], [NaN], [1, 1]])
    assert.throws(() => createDenseAttempts({ pairs: 1, rates }), /CPU/i);
});

test("records successful samples once in their planned order", async () => {
  const value = report();
  const called = [];
  await runDenseAttempts(
    value.attempts,
    async (attempt) => {
      called.push(attempt.sample);
      return identity(attempt);
    },
    (outcome) => recordDenseAttempt(value, outcome),
  );
  assert.deepEqual(
    value.samples.map((sample) => sample.sample),
    called,
  );
  assert.deepEqual(
    value.attempts.map((attempt) => attempt.status),
    Array(4).fill("passed"),
  );
  assert.equal(value.error, undefined);
});

test("continues after failed samples and preserves a failed result after all attempts", async () => {
  const value = report();
  const called = [];
  await assert.rejects(
    runDenseAttempts(
      value.attempts,
      async (attempt) => {
        called.push(attempt.sample);
        if (attempt.arm === "baseline") throw new Error(`broken ${attempt.sample}`);
        assert.ok(value.error, "the prior failure must be persisted before the next sample starts");
        return identity(attempt);
      },
      (outcome) => recordDenseAttempt(value, outcome),
    ),
    (error) => error instanceof AggregateError && error.errors.length === 2,
  );
  assert.deepEqual(called, [BASELINE_FIRST, "candidate-1x-0", "candidate-1x-1", "baseline-1x-1"]);
  assert.deepEqual(
    value.attempts.map((attempt) => attempt.status),
    ["failed", "passed", "passed", "failed"],
  );
  assert.deepEqual(
    value.samples.map((sample) => sample.arm),
    ["candidate", "candidate"],
  );
  assert.match(value.attempts[0].error, /broken baseline-1x-0/);
  assert.match(value.attempts[3].error, /broken baseline-1x-1/);
  assert.ok(value.error);
});

test("awaits evidence persistence and stops immediately if that write fails", async () => {
  const value = report();
  const failure = new Error("report storage unavailable");
  const called = [];
  await assert.rejects(
    runDenseAttempts(
      value.attempts,
      async (attempt) => {
        called.push(attempt.sample);
        return identity(attempt);
      },
      async () => {
        throw failure;
      },
    ),
    (error) => error === failure,
  );
  assert.deepEqual(called, [BASELINE_FIRST]);
});

test("does not start a second sample while the first record is still pending", async () => {
  const value = report(1);
  const called = [];
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const running = runDenseAttempts(
    value.attempts,
    async (attempt) => {
      called.push(attempt.sample);
      return identity(attempt);
    },
    async (outcome) => {
      if (outcome.arm === "baseline") await pending;
      recordDenseAttempt(value, outcome);
    },
  );
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(called, [BASELINE_FIRST]);
  release();
  await running;
  assert.equal(called.length, 2);
});

test("rejects mismatched samples and duplicate outcomes without changing the report", () => {
  const value = report(1);
  const attempt = identity(value.attempts[0]);
  const mismatched = { ...attempt, status: "passed", result: { ...attempt, arm: "candidate" } };
  assert.throws(() => recordDenseAttempt(value, mismatched), /identity/i);
  assert.equal(value.samples.length, 0);
  const outcome = { ...attempt, status: "passed", result: attempt };
  recordDenseAttempt(value, outcome);
  assert.throws(() => recordDenseAttempt(value, outcome), /already|pending/i);
  assert.equal(value.samples.length, 1);
});

function measuredSample(attempt) {
  return {
    ...identity(attempt),
    cold: { resources: [], readyMs: 100, documentMs: 50 },
    runs: [
      {
        scenario: "idle",
        elapsedMs: 1000,
        metrics: {
          TaskDuration: 1,
          ThreadTime: 1,
          ProcessTime: 1,
          ScriptDuration: 1,
          RecalcStyleDuration: 1,
          LayoutDuration: 1,
          RecalcStyleCount: 1,
          LayoutCount: 1,
        },
        browser: { frameGapsMs: [], longTasksMs: [], domNodes: 1, editors: 1, animations: {} },
      },
    ],
  };
}

function completedReport() {
  const value = report(1);
  for (const attempt of [...value.attempts])
    recordDenseAttempt(value, {
      ...identity(attempt),
      status: "passed",
      result: measuredSample(attempt),
    });
  return value;
}

test("summarizes a complete successful attempt plan", () => {
  const result = summarizeReport(completedReport());
  assert.equal(result.sampleCount, 2);
  assert.equal(result.attemptProtocol, DENSE_ATTEMPT_PROTOCOL);
  assert.deepEqual(result.comparisonPlan, { pairs: 1, rates: [1], candidateFirst: false });
});

test("rejects failed or unfinished attempts even without a top-level error", () => {
  for (const status of ["pending", "failed"]) {
    const value = completedReport();
    value.error = undefined;
    value.attempts[0].status = status;
    value.attempts[0].error = "retained failure";
    assert.throws(() => summarizeReport(value), /attempt/i);
  }
  const value = completedReport();
  value.attempts.push(...createDenseAttempts({ pairs: 1, rates: [4] }));
  assert.throws(() => summarizeReport(value), /attempt/i);
});

test("rejects missing, unknown, duplicate and mismatched attempt metadata", () => {
  const changes = [
    (value) => {
      delete value.attempts;
    },
    (value) => {
      delete value.comparisonPlan;
    },
    (value) => {
      value.comparisonPlan.pairs = 2;
    },
    (value) => {
      value.comparisonPlan.candidateFirst = true;
    },
    (value) => {
      value.attemptProtocol = "unknown";
    },
    (value) => {
      value.attempts[1] = { ...value.attempts[0] };
    },
    (value) => {
      value.attempts[0].cpuRate = 4;
    },
    (value) => {
      value.samples[0].sample = "different";
    },
    (value) => {
      delete value.attemptProtocol;
    },
    (value) => {
      delete value.attemptProtocol;
      delete value.attempts;
    },
    (value) => {
      value.candidateFirst = true;
    },
  ];
  for (const change of changes) {
    const value = completedReport();
    change(value);
    assert.throws(() => summarizeReport(value), /attempt/i);
  }
});
