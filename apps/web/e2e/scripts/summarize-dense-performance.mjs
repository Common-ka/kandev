import { validateDenseFileFixture } from "./dense-file-summary.mjs";
import fs from "node:fs";
import { validateDenseAttempts } from "./dense-attempt-summary.mjs";
import { interactionPrefix } from "./dense-interaction-summary.mjs";
import { pathToFileURL } from "node:url";
import { dockviewMetadata, dockviewRecords } from "./dense-dockview-summary.mjs";

const DEFAULT_NAVIGATION_SCENARIO = "task-switch";

const LEGACY_VISIBILITY_PROBE = "locator-assertion";

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

function sampleBusyHeaderPrefix(report, sample) {
  const count = report.extraBusyHeaders ?? 0;
  if (!Number.isInteger(count) || count < 0 || (sample.extraBusyHeaders ?? 0) !== count)
    throw new Error("Samples must use the report's extra busy-header count");
  return count > 0 ? `busy-${count}-` : "";
}

function checkVisibilityProbe(report, sample) {
  const probe = report.finalVisibilityProbe ?? LEGACY_VISIBILITY_PROBE;
  if (
    !["boolean-poll", LEGACY_VISIBILITY_PROBE].includes(probe) ||
    (sample.finalVisibilityProbe ?? LEGACY_VISIBILITY_PROBE) !== probe
  )
    throw new Error("Samples must use the report's final visibility probe");
}

function navigationIdentity(report, sample) {
  const scenario = report.navigationScenario ?? DEFAULT_NAVIGATION_SCENARIO;
  const readiness = report.navigationReadiness ?? "driver";
  if (
    ![DEFAULT_NAVIGATION_SCENARIO, "incompatible-layout", "session-tabs"].includes(scenario) ||
    (sample.navigationScenario ?? DEFAULT_NAVIGATION_SCENARIO) !== scenario
  )
    throw new Error("Samples must use the report's navigation scenario");
  if (
    !["driver", "pointerdown-raf-v1"].includes(readiness) ||
    (sample.navigationReadiness ?? "driver") !== readiness
  )
    throw new Error("Samples must use the report's navigation readiness probe");
  return { scenario, readiness };
}

function browserReadinessMetrics(selections, readiness) {
  if (readiness === "driver") {
    if (selections.some((selection) => selection.browserEventReadiness))
      throw new Error("Driver readiness cannot include browser-event measurements");
    return {};
  }
  const spans = selections.map((selection) => {
    const value = selection.browserEventReadiness;
    if (
      !value ||
      value.version !== readiness ||
      value.trusted !== true ||
      !value.taskId ||
      !value.sessionId ||
      !Number.isFinite(value.eventAt) ||
      value.eventAt <= 0 ||
      ![value.headerMs, value.transcriptMs, value.composerMs].every(
        (duration) => Number.isFinite(duration) && duration >= 0,
      )
    )
      throw new Error("Invalid or incomplete browser-event readiness measurement");
    return value;
  });
  const measures = {
    Header: (span) => span.headerMs,
    Transcript: (span) => span.transcriptMs,
    Composer: (span) => span.composerMs,
    AllReady: (span) => Math.max(span.headerMs, span.transcriptMs, span.composerMs),
  };
  return Object.fromEntries(
    Object.entries(measures).flatMap(([name, valueOf]) => {
      const values = spans.map(valueOf);
      return [
        [`event${name}P50Ms`, median(values)],
        [`event${name}P95Ms`, percentile(values, 0.95)],
      ];
    }),
  );
}

function validateNavigationLayouts(sample, scenario) {
  if (scenario !== "incompatible-layout") return;
  const layouts = sample.selections.map((selection, index) => {
    const layout = selection.layout;
    if (
      !layout ||
      layout.rootColumns !== 2 + (index % 2) ||
      layout.orientation !== "HORIZONTAL" ||
      !layout.sessionId ||
      (selection.browserEventReadiness &&
        layout.sessionId !== selection.browserEventReadiness.sessionId)
    )
      throw new Error("Invalid or incomplete incompatible-layout restoration measurement");
    return layout.rootColumns;
  });
  if (new Set(layouts).size !== 2)
    throw new Error("Incompatible-layout samples must restore both layouts");
}

function validateNavigationSessions(sample, scenario) {
  if (scenario !== "session-tabs") return;
  const first = sample.selections[0]?.session ?? {};
  const sessionIds = new Set();
  for (const selection of sample.selections) {
    const session = selection.session;
    const event = selection.browserEventReadiness;
    if (
      !session?.environmentId ||
      !session.taskId ||
      !session.sessionId ||
      session.environmentId !== first.environmentId ||
      session.taskId !== first.taskId ||
      (event && (event.sessionId !== session.sessionId || event.taskId !== session.taskId))
    )
      throw new Error("Invalid or incomplete shared-environment session measurement");
    sessionIds.add(session.sessionId);
  }
  if (sessionIds.size !== 2)
    throw new Error("Session-tab samples must select two different sessions");
}

function navigationMetrics(report, sample) {
  const { scenario, readiness } = navigationIdentity(report, sample);
  validateNavigationLayouts(sample, scenario);
  validateNavigationSessions(sample, scenario);
  return {
    scenario: readiness === "driver" ? scenario : `${readiness}-${scenario}`,
    values: {
      ...windowMetrics(sample.measured),
      selectionP50Ms: median(sample.selections.map((selection) => selection.paintOpportunityMs)),
      selectionP95Ms: percentile(
        sample.selections.map((selection) => selection.paintOpportunityMs),
        0.95,
      ),
      requests: sample.selections.reduce(
        (sum, selection) => sum + Object.values(selection.counts).reduce((a, b) => a + b, 0),
        0,
      ),
      ...browserReadinessMetrics(sample.selections, readiness),
    },
  };
}

function measurementMetadata(report) {
  if (report.workbenchSurface === "dockview") return dockviewMetadata(report);
  if (report.samples.every((sample) => sample.cold))
    return {
      finalVisibilityProbe: report.finalVisibilityProbe ?? LEGACY_VISIBILITY_PROBE,
      layout: report.layout ?? "grid",
      extraBusyHeaders: report.extraBusyHeaders ?? 0,
      interactionMode: report.interactionMode ?? "quiet",
      throttleAfterLoad: Boolean(report.throttleAfterLoad),
    };
  return {
    navigationScenario: report.navigationScenario ?? DEFAULT_NAVIGATION_SCENARIO,
    navigationReadiness: report.navigationReadiness ?? "driver",
  };
}

function measurementNotes(report) {
  const common = [
    "mainThreadMs and mainThreadMsPerSecond use TaskDuration with timeTicks: elapsed time in main-thread tasks, not thread CPU time. Script, style, and layout durations use the same elapsed-time domain.",
    "mainThreadCpuMs uses ThreadTime (renderer main-thread CPU). rendererCpuMs uses ProcessTime (renderer-process CPU); it excludes separate browser, GPU, and backend processes.",
    "Positive reduction means a lower candidate value. Counts such as mounted editors are observations, not optimization scores.",
    "Frame gaps and driver DOM readiness are not INP. Linux CPU throttling is not an M2 Air simulation.",
  ];
  if (report.workbenchSurface === "dockview")
    return [
      ...common,
      "Dockview setup is outside the measured windows and is not a cold-entry result. Core and full E2E plugin workloads remain separate; the plugin archive hash must match in both arms.",
      "Streaming duration includes the wait for final visible content. Fixed-deadline traffic and visible-session progress are retained in the raw report.",
    ];
  if (!report.samples.every((sample) => sample.cold))
    return [
      ...common,
      "Browser-event readiness uses trusted pointerdown timestamps and frame-sampled DOM/owner state without geometry reads. It is separate from driver-clock readiness and is not screen presentation or INP.",
    ];
  return [
    ...common,
    "Extra busy headers are backend-seeded status rows, not additional live executions. The six canonical stream producers remain unchanged. Busy-header variants must not be pooled with the default workload.",
    ...(report.throttleAfterLoad
      ? [
          "Warm stress loads at 1x before applying the recorded CPU rate. It is not a throttled cold-load measurement.",
        ]
      : []),
    "Final-content probe versions must not be pooled. Locator-assertion retries can collect page-wide ARIA snapshots; boolean polling retains the same visibility gate without those snapshots.",
    "Scripted input variants have a separate mode and window prefix. Their later idle windows can retain composer state changed by those inputs. Action timestamps preserve late execution; they do not imply that all inputs completed on schedule.",
    "Streaming duration includes the wait for final visible content. Fixed-deadline traffic is retained in the raw report.",
    "History decoded bytes include captured requests and responses. They are not compressed network transfer.",
  ];
}

export function summarizeReport(report) {
  if (
    ["cpu-attribution", "animation-attribution", "read-attribution", "owner-retention"].includes(
      report.measurementKind,
    )
  )
    throw new Error("Diagnostic attribution runs are excluded from timing comparisons");
  if (report.error) throw new Error(`input report contains an error: ${report.error}`);
  validateDenseAttempts(report);
  validateDenseFileFixture(report);
  const records = [];
  for (const sample of report.samples) {
    checkVisibilityProbe(report, sample);
    const throttling = sampleThrottling(report, sample);
    if (report.workbenchSurface === "dockview") {
      records.push(...dockviewRecords(report, sample, windowMetrics, throttling.windowPrefix));
      continue;
    }
    const layoutPrefix =
      sampleLayoutPrefix(report, sample) + sampleBusyHeaderPrefix(report, sample);
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
          scenario: `${layoutPrefix}${throttling.windowPrefix}${sample.historyMode === "all" ? "long-history-" : ""}${interactionPrefix(report, sample, run)}${run.scenario}`,
          values: windowMetrics(run),
        });
    } else {
      records.push({ ...identity, ...navigationMetrics(report, sample) });
    }
  }
  const groups = Map.groupBy(records, (record) => `${record.cpuRate}x/${record.scenario}`);
  const comparisons = [];
  for (const [group, rows] of groups)
    for (const metric of Object.keys(rows[0].values))
      comparisons.push({ group, metric, ...summarizePairs(rows, (row) => row.values[metric]) });
  return {
    measurementKind: report.measurementKind,
    ...(report.fixtureProtocol ? { fixtureProtocol: report.fixtureProtocol } : {}),
    ...(report.attemptProtocol
      ? { attemptProtocol: report.attemptProtocol, comparisonPlan: report.comparisonPlan }
      : {}),
    ...measurementMetadata(report),
    machine: report.machine,
    builds: report.builds,
    sampleCount: report.samples.length,
    comparisons,
    notes: measurementNotes(report),
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
