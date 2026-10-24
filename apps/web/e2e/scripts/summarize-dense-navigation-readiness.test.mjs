import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeReport } from "./summarize-dense-performance.mjs";

const SESSION_TABS = "session-tabs";

function navigationSample(arm, navigationScenario = "task-switch") {
  return {
    arm,
    pair: 0,
    cpuRate: 1,
    navigationScenario,
    navigationReadiness: "pointerdown-raf-v1",
    selections: [
      {
        paintOpportunityMs: 100,
        counts: {},
        browserEventReadiness: {
          version: "pointerdown-raf-v1",
          trusted: true,
          taskId: "task-a",
          sessionId: "session-a",
          eventAt: 1000,
          headerMs: 10,
          transcriptMs: 30,
          composerMs: 20,
        },
      },
    ],
    measured: {
      elapsedMs: 100,
      metrics: {
        TaskDuration: 0.05,
        ThreadTime: 0.04,
        ProcessTime: 0.06,
        ScriptDuration: 0.01,
        RecalcStyleDuration: 0.01,
        LayoutDuration: 0.01,
        RecalcStyleCount: 1,
        LayoutCount: 1,
      },
      browser: { frameGapsMs: [], longTasksMs: [], domNodes: 1, editors: 1, animations: {} },
    },
  };
}

function navigationReport(navigationScenario = "task-switch") {
  const samples = [
    navigationSample("baseline", navigationScenario),
    navigationSample("candidate", navigationScenario),
  ];
  if (navigationScenario === "incompatible-layout") {
    for (const sample of samples) {
      sample.selections.push(structuredClone(sample.selections[0]));
      sample.selections.forEach((selection, index) => {
        selection.browserEventReadiness.sessionId = `session-${index}`;
        selection.layout = {
          rootColumns: 2 + index,
          orientation: "HORIZONTAL",
          sessionId: `session-${index}`,
        };
      });
    }
  }
  if (navigationScenario === SESSION_TABS) {
    for (const sample of samples) {
      sample.selections.push(structuredClone(sample.selections[0]));
      sample.selections.forEach((selection, index) => {
        selection.browserEventReadiness.sessionId = `session-${index}`;
        selection.session = {
          taskId: "task-a",
          sessionId: `session-${index}`,
          environmentId: "shared-env",
        };
      });
    }
  }
  return {
    navigationScenario,
    navigationReadiness: "pointerdown-raf-v1",
    samples,
  };
}

test("keeps native browser readiness separate from driver-clock readiness", () => {
  const result = summarizeReport(navigationReport());
  const metric = (name) => result.comparisons.find((row) => row.metric === name);
  assert.equal(metric("selectionP50Ms").baseline.median, 100);
  assert.equal(metric("eventHeaderP50Ms")?.baseline.median, 10);
  assert.equal(metric("eventTranscriptP95Ms")?.baseline.median, 30);
  assert.equal(metric("eventComposerP50Ms")?.baseline.median, 20);
  assert.equal(metric("eventAllReadyP95Ms")?.baseline.median, 30);
  assert.deepEqual(
    [...new Set(result.comparisons.map((row) => row.group))],
    ["1x/pointerdown-raf-v1-task-switch"],
  );
});

test("separates incompatible layout and same-environment session switches", () => {
  for (const scenario of ["incompatible-layout", SESSION_TABS]) {
    const result = summarizeReport(navigationReport(scenario));
    assert.equal(result.navigationScenario, scenario);
    assert.ok(result.comparisons.every((row) => row.group.endsWith(scenario)));
  }
  const mixed = navigationReport();
  mixed.samples[1].navigationScenario = SESSION_TABS;
  assert.throws(() => summarizeReport(mixed), /navigation scenario/);
});

test("rejects mixed, incomplete, untrusted, and invalid browser readiness", () => {
  for (const mutate of [
    (sample) => {
      sample.navigationReadiness = "driver";
    },
    (sample) => {
      delete sample.selections[0].browserEventReadiness;
    },
    (sample) => {
      sample.selections[0].browserEventReadiness.trusted = false;
    },
    (sample) => {
      sample.selections[0].browserEventReadiness.transcriptMs = -1;
    },
    (sample) => {
      sample.selections[0].browserEventReadiness.headerMs = NaN;
    },
  ]) {
    const report = navigationReport();
    mutate(report.samples[1]);
    assert.throws(() => summarizeReport(report), /readiness/);
  }
});

test("rejects missing, unchanged, or wrongly owned incompatible layouts", () => {
  for (const mutate of [
    (selection) => {
      delete selection.layout;
    },
    (selection) => {
      selection.layout.rootColumns = 3;
    },
    (selection) => {
      selection.layout.orientation = "VERTICAL";
    },
    (selection) => {
      selection.layout.sessionId = "wrong-session";
    },
  ]) {
    const report = navigationReport("incompatible-layout");
    mutate(report.samples[1].selections[0]);
    assert.throws(() => summarizeReport(report), /layout/);
  }
});

test("rejects session-tab samples without two sessions in one real environment", () => {
  for (const mutate of [
    (selection) => {
      delete selection.session;
    },
    (selection) => {
      selection.session.environmentId = "";
    },
    (selection) => {
      selection.session.environmentId = "different-env";
    },
    (selection) => {
      selection.session.taskId = "different-task";
    },
    (selection) => {
      selection.session.sessionId = "session-1";
    },
  ]) {
    const report = navigationReport(SESSION_TABS);
    mutate(report.samples[1].selections[0]);
    assert.throws(() => summarizeReport(report), /session/);
  }
});
