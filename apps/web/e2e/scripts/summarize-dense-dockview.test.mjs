import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeReport } from "./summarize-dense-performance.mjs";

function reportWithPlugin(plugin = null) {
  const visibleIds = ["session:a", "session:b", "files", "changes", "plan"];
  if (plugin) visibleIds.push(plugin.panelId);
  const hiddenIds = ["session:c", "terminal-default", ...(plugin ? ["pr-detail"] : [])];
  const layout = {
    detailSessionIds: ["a", "b"],
    panels: [
      ...visibleIds.map((id) => ({ id, visible: true })),
      ...hiddenIds.map((id) => ({ id, visible: false })),
    ],
  };
  return {
    workbenchSurface: "dockview",
    finalVisibilityProbe: "boolean-poll",
    plugin,
    fixture: { dockview: { visibleSessionIds: ["a", "b"], hiddenSessionId: "c" } },
    samples: ["baseline", "candidate"].map((arm) => ({
      arm,
      pair: 0,
      cpuRate: 1,
      workbenchSurface: "dockview",
      plugin,
      finalVisibilityProbe: "boolean-poll",
      runs: [
        {
          scenario: "streaming",
          elapsedMs: 1000,
          layoutBefore: layout,
          layoutAfter: layout,
          metrics: {
            TaskDuration: 1,
            ThreadTime: 0.4,
            ProcessTime: 0.8,
            ScriptDuration: 0.2,
            RecalcStyleDuration: 0.1,
            LayoutDuration: 0.1,
            RecalcStyleCount: 1,
            LayoutCount: 1,
          },
          browser: {
            frameGapsMs: [16],
            longTasksMs: [],
            domNodes: 100,
            editors: 4,
            animations: {},
          },
        },
      ],
    })),
  };
}

test("labels Dockview windows without inventing cold-entry or navigation metrics", () => {
  const result = summarizeReport(reportWithPlugin());
  assert.deepEqual(
    [...new Set(result.comparisons.map((row) => row.group))],
    ["1x/dockview-core-streaming"],
  );
  assert.equal(result.workbenchSurface, "dockview");
  assert.equal(result.navigationScenario, undefined);
  assert.equal(result.layout, undefined);
  assert.equal(
    result.comparisons.find((row) => row.metric === "mainThreadCpuMs").baseline.median,
    400,
  );
});

test("keeps the exact plugin bundle separate from the core workload", () => {
  const plugin = { id: "fixture", panelId: "plugin:fixture:history", bundleSha256: "a".repeat(64) };
  const report = reportWithPlugin(plugin);
  const result = summarizeReport(report);
  assert.equal(result.plugin.bundleSha256, plugin.bundleSha256);
  assert.equal(result.comparisons[0].group, "1x/dockview-plugin-streaming");
  report.samples[1].plugin = { ...plugin, bundleSha256: "b".repeat(64) };
  assert.throws(() => summarizeReport(report), /plugin/);
});

test("rejects missing panes, wrong visible sessions, and incomplete layout witnesses", () => {
  for (const mutate of [
    (layout) => {
      layout.panels = layout.panels.filter((panel) => panel.id !== "changes");
    },
    (layout) => {
      layout.detailSessionIds = ["a", "c"];
    },
    (layout) => {
      layout.panels.find((panel) => panel.id === "session:c").visible = true;
    },
  ]) {
    const report = structuredClone(reportWithPlugin());
    mutate(report.samples[1].runs[0].layoutAfter);
    assert.throws(() => summarizeReport(report), /Dockview/);
  }
  const report = reportWithPlugin();
  delete report.samples[1].runs[0].layoutAfter;
  assert.throws(() => summarizeReport(report), /Dockview/);
});
