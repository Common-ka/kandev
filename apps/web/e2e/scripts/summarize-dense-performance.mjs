import fs from "node:fs";
import { pathToFileURL } from "node:url";

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function distribution(values) {
  return { median: median(values), min: Math.min(...values), max: Math.max(...values), values };
}

export function summarizePairs(rows, valueOf) {
  const pairs = new Map();
  for (const row of rows) {
    if (row.arm !== "baseline" && row.arm !== "candidate") throw new Error("unknown arm");
    const key = row.pair;
    const pair = pairs.get(key) ?? {};
    if (row.arm in pair) throw new Error(`duplicate ${row.arm} for pair ${key}`);
    const value = valueOf(row);
    if (!Number.isFinite(value))
      throw new Error(`expected finite metric for ${row.arm} pair ${key}`);
    pair[row.arm] = value;
    pairs.set(key, pair);
  }
  if (!pairs.size) throw new Error("no samples");
  const ordered = [...pairs]
    .sort(([a], [b]) => a - b)
    .map(([key, pair]) => {
      if (!("baseline" in pair) || !("candidate" in pair))
        throw new Error(`unpaired sample ${key}`);
      return pair;
    });
  const differences = ordered.map((pair) => pair.baseline - pair.candidate);
  const percentages = ordered.map((pair, i) =>
    pair.baseline === 0 ? null : (100 * differences[i]) / pair.baseline,
  );
  return {
    pairs: ordered.length,
    baseline: distribution(ordered.map((pair) => pair.baseline)),
    candidate: distribution(ordered.map((pair) => pair.candidate)),
    pairedAbsoluteReduction: differences,
    pairedPercentReduction: percentages,
    medianPairedPercentReduction: median(percentages.filter((value) => value !== null)),
  };
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)];
}

function windowMetrics(run) {
  const byAction = run.delivery?.traffic.byAction ?? {};
  return {
    elapsedMs: run.elapsedMs,
    mainThreadMs: 1000 * run.metrics.TaskDuration,
    mainThreadMsPerSecond: (1_000_000 * run.metrics.TaskDuration) / run.elapsedMs,
    mainThreadCpuMs: 1000 * run.metrics.ThreadTime,
    rendererCpuMs: 1000 * run.metrics.ProcessTime,
    scriptMs: 1000 * run.metrics.ScriptDuration,
    styleMs: 1000 * run.metrics.RecalcStyleDuration,
    layoutMs: 1000 * run.metrics.LayoutDuration,
    styleRecalculations: run.metrics.RecalcStyleCount,
    layouts: run.metrics.LayoutCount,
    frameGapP95Ms: percentile(run.browser.frameGapsMs, 0.95),
    frameGapMaxMs: Math.max(0, ...run.browser.frameGapsMs),
    longTasks: run.browser.longTasksMs.length,
    longTaskMs: run.browser.longTasksMs.reduce((a, b) => a + b, 0),
    domNodes: run.browser.domNodes,
    mountedEditors: run.browser.editors,
    runningAnimations: run.browser.animations.running ?? 0,
    ...(run.delivery
      ? {
          historyRequests: byAction["message.list"]?.sent ?? 0,
          historyDecodedBytes: byAction["message.list"]?.bytes ?? 0,
          websocketDecodedBytes: run.delivery.traffic.byteCount,
          resets: run.delivery.changes.filter((change) => change.reset).length,
          changedNotifications: run.delivery.changes.length,
        }
      : {}),
  };
}

function sampleThrottling(report, sample) {
  if (Boolean(sample.throttleAfterLoad) !== Boolean(report.throttleAfterLoad))
    throw new Error("Samples must use the report's throttling mode");
  if (sample.throttleAfterLoad && sample.coldCpuRate !== 1)
    throw new Error("Warm stress requires a cold CPU rate of 1");
  return {
    coldCpuRate: sample.coldCpuRate ?? sample.cpuRate,
    coldScenario: sample.throttleAfterLoad ? `cold-before-${sample.cpuRate}x` : "cold",
    windowPrefix: sample.throttleAfterLoad ? "warm-" : "",
  };
}

function sampleLayoutPrefix(report, sample) {
  const layout = sample.layout ?? "grid";
  if (layout !== (report.layout ?? "grid") || !["grid", "columns"].includes(layout))
    throw new Error("Samples must use the report's layout");
  return layout === "columns" ? "columns-" : "";
}

function checkVisibilityProbe(report, sample) {
  const probe = report.finalVisibilityProbe ?? "locator-assertion";
  if (
    !["boolean-poll", "locator-assertion"].includes(probe) ||
    (sample.finalVisibilityProbe ?? "locator-assertion") !== probe
  )
    throw new Error("Samples must use the report's final visibility probe");
}

export function summarizeReport(report) {
  if (["cpu-attribution", "animation-attribution"].includes(report.measurementKind))
    throw new Error("Diagnostic attribution runs are excluded from timing comparisons");
  if (report.error) throw new Error(`input report contains an error: ${report.error}`);
  const records = [];
  for (const sample of report.samples) {
    checkVisibilityProbe(report, sample);
    const throttling = sampleThrottling(report, sample);
    const layoutPrefix = sampleLayoutPrefix(report, sample);
    const identity = { arm: sample.arm, pair: sample.pair, cpuRate: sample.cpuRate };
    if (sample.cold) {
      const assets = sample.cold.resources.filter((resource) => /\.(js|css)$/.test(resource.path));
      records.push({
        ...identity,
        cpuRate: throttling.coldCpuRate,
        scenario: `${layoutPrefix}${throttling.coldScenario}`,
        values: {
          readyMs: sample.cold.readyMs,
          documentMs: sample.cold.documentMs,
          assetEncodedBytes: assets.reduce((sum, asset) => sum + asset.encodedBytes, 0),
          assetDecodedBytes: assets.reduce((sum, asset) => sum + asset.decodedBytes, 0),
        },
      });
      for (const run of sample.runs)
        records.push({
          ...identity,
          scenario: `${layoutPrefix}${throttling.windowPrefix}${sample.historyMode === "all" ? "long-history-" : ""}${run.scenario}`,
          values: windowMetrics(run),
        });
    } else {
      records.push({
        ...identity,
        scenario: "task-switch",
        values: {
          ...windowMetrics(sample.measured),
          selectionP50Ms: median(
            sample.selections.map((selection) => selection.paintOpportunityMs),
          ),
          selectionP95Ms: percentile(
            sample.selections.map((selection) => selection.paintOpportunityMs),
            0.95,
          ),
          requests: sample.selections.reduce(
            (sum, selection) => sum + Object.values(selection.counts).reduce((a, b) => a + b, 0),
            0,
          ),
        },
      });
    }
  }
  const groups = Map.groupBy(records, (record) => `${record.cpuRate}x/${record.scenario}`);
  const comparisons = [];
  for (const [group, rows] of groups)
    for (const metric of Object.keys(rows[0].values))
      comparisons.push({ group, metric, ...summarizePairs(rows, (row) => row.values[metric]) });
  return {
    measurementKind: report.measurementKind,
    finalVisibilityProbe: report.finalVisibilityProbe ?? "locator-assertion",
    layout: report.layout ?? "grid",
    throttleAfterLoad: Boolean(report.throttleAfterLoad),
    machine: report.machine,
    builds: report.builds,
    sampleCount: report.samples.length,
    comparisons,
    notes: [
      ...(report.throttleAfterLoad
        ? [
            "Warm stress loads at 1x before applying the recorded CPU rate. It is not a throttled cold-load measurement.",
          ]
        : []),
      "mainThreadMs and mainThreadMsPerSecond use TaskDuration with timeTicks: elapsed time in main-thread tasks, not thread CPU time. Script, style, and layout durations use the same elapsed-time domain.",
      "mainThreadCpuMs uses ThreadTime (renderer main-thread CPU). rendererCpuMs uses ProcessTime (renderer-process CPU); it excludes separate browser, GPU, and backend processes.",
      "Positive reduction means a lower candidate value. Counts such as mounted editors are observations, not optimization scores.",
      "Final-content probe versions must not be pooled. Locator-assertion retries can collect page-wide ARIA snapshots; boolean polling retains the same visibility gate without those snapshots.",
      "Streaming duration includes the wait for final visible content. Fixed-deadline traffic is retained in the raw report.",
      "Frame gaps and driver DOM readiness are not INP. Linux CPU throttling is not an M2 Air simulation.",
      "History decoded bytes include captured requests and responses. They are not compressed network transfer.",
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output)
    throw new Error("Usage: node summarize-dense-performance.mjs INPUT.json OUTPUT.json");
  fs.writeFileSync(
    output,
    JSON.stringify(summarizeReport(JSON.parse(fs.readFileSync(input, "utf8"))), null, 2),
  );
}
