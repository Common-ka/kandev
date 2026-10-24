import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeReport } from "./summarize-dense-performance.mjs";

const MODE = "scripted-scroll-v1";
const actions = ["scroll-up", "return-bottom", "leave-tile", "hover-tile"];
function sample(arm, interactionMode = MODE) {
  return {
    arm,
    pair: 0,
    cpuRate: 1,
    interactionMode,
    cold: { resources: [], readyMs: 100, documentMs: 50, visibleTaskIds: ["task-a"] },
    runs: [
      {
        scenario: "streaming",
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
        interactions: actions.map((action, index) => ({
          action,
          taskId: "task-a",
          scheduledMs: 200 * (index + 1),
          startedMs: 200 * (index + 1),
          finishedMs: 200 * (index + 1) + 10,
        })),
      },
    ],
  };
}

test("keeps scripted streaming separate from quiet measurements", () => {
  const result = summarizeReport({
    interactionMode: MODE,
    samples: [sample("baseline"), sample("candidate")],
  });
  assert.equal(result.interactionMode, MODE);
  assert.ok(result.comparisons.some((row) => row.group === "1x/scripted-scroll-v1-streaming"));
  assert.ok(result.comparisons.some((row) => row.group === "1x/cold"));
});

test("rejects mixed or unknown interaction modes", () => {
  for (const mode of ["quiet", "unknown"]) {
    assert.throws(
      () =>
        summarizeReport({
          interactionMode: MODE,
          samples: [sample("baseline"), sample("candidate", mode)],
        }),
      /interaction/,
    );
  }
});

test("rejects missing, reordered, offscreen, and invalid action witnesses", () => {
  const mutations = [
    (value) => value.runs[0].interactions.pop(),
    (value) => value.runs[0].interactions.reverse(),
    (value) => {
      value.runs[0].interactions[0].taskId = "offscreen";
    },
    (value) => {
      value.runs[0].interactions[0].finishedMs = NaN;
    },
    (value) => {
      value.runs[0].interactions[0].finishedMs = -1;
    },
  ];
  for (const mutate of mutations) {
    const candidate = sample("candidate");
    mutate(candidate);
    assert.throws(
      () => summarizeReport({ interactionMode: MODE, samples: [sample("baseline"), candidate] }),
      /interaction/,
    );
  }
});

test("retains late action evidence without inventing on-time execution", () => {
  const baseline = sample("baseline");
  const candidate = sample("candidate");
  for (const value of [baseline, candidate]) value.runs[0].interactions[3].finishedMs = 2000;
  assert.equal(
    summarizeReport({ interactionMode: MODE, samples: [baseline, candidate] }).sampleCount,
    2,
  );
});

test("labels later idle windows after scripted inputs and rejects quiet input witnesses", () => {
  const samples = [sample("baseline"), sample("candidate")];
  for (const value of samples)
    value.runs.push({ ...value.runs[0], scenario: "reduced-motion-idle", interactions: [] });
  const result = summarizeReport({ interactionMode: MODE, samples });
  assert.ok(
    result.comparisons.some((row) => row.group === "1x/scripted-scroll-v1-reduced-motion-idle"),
  );
  assert.throws(
    () =>
      summarizeReport({
        interactionMode: "quiet",
        samples: [sample("baseline", "quiet"), sample("candidate", "quiet")],
      }),
    /interaction/,
  );
});
