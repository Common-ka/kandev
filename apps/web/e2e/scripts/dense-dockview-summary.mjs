function pluginIdentity(plugin) {
  if (plugin == null) return null;
  if (!plugin.id || !plugin.panelId || !/^[a-f0-9]{64}$/.test(plugin.bundleSha256 ?? ""))
    throw new Error("Invalid Dockview plugin identity");
  return [plugin.id, plugin.panelId, plugin.bundleSha256].join(":");
}

export function dockviewMetadata(report) {
  if (!report.samples?.length) throw new Error("Dockview report has no samples");
  pluginIdentity(report.plugin);
  return {
    workbenchSurface: "dockview",
    plugin: report.plugin ?? null,
    finalVisibilityProbe: report.finalVisibilityProbe,
    throttleAfterLoad: Boolean(report.throttleAfterLoad),
  };
}

function fixtureSessions(fixture) {
  const sessions = fixture?.visibleSessionIds;
  if (
    !Array.isArray(sessions) ||
    sessions.length !== 2 ||
    new Set(sessions).size !== 2 ||
    !fixture.hiddenSessionId ||
    sessions.includes(fixture.hiddenSessionId)
  )
    throw new Error("Invalid Dockview fixture session identities");
  return sessions;
}

function validateLayout(layout, fixture, plugin) {
  const sessions = fixtureSessions(fixture);
  const visibleIds = [...sessions.map((id) => `session:${id}`), "files", "changes", "plan"];
  if (plugin) visibleIds.push(plugin.panelId);
  const allIds = [...visibleIds, `session:${fixture.hiddenSessionId}`, "terminal-default"];
  if (plugin) allIds.push("pr-detail");
  const equal = (left, right) =>
    JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
  if (
    !Array.isArray(layout?.panels) ||
    !Array.isArray(layout.detailSessionIds) ||
    layout.panels.some((panel) => typeof panel.visible !== "boolean") ||
    !equal(
      layout.panels.map((panel) => panel.id),
      allIds,
    ) ||
    !equal(
      layout.panels.filter((panel) => panel.visible).map((panel) => panel.id),
      visibleIds,
    ) ||
    !equal(layout.detailSessionIds, sessions)
  )
    throw new Error("Incomplete or mismatched Dockview layout witness");
}

export function dockviewRecords(report, sample, windowMetrics, windowPrefix) {
  if (sample.workbenchSurface !== "dockview") throw new Error("Mixed Dockview surfaces");
  if (pluginIdentity(report.plugin) !== pluginIdentity(sample.plugin))
    throw new Error("Samples must use the same Dockview plugin bundle");
  if (!Array.isArray(sample.runs) || !sample.runs.length)
    throw new Error("Dockview sample has no measured windows");
  return sample.runs.map((run) => {
    if (!["idle", "streaming", "reduced-motion-idle"].includes(run.scenario))
      throw new Error("Unknown Dockview window scenario");
    validateLayout(run.layoutBefore, report.fixture?.dockview, report.plugin);
    validateLayout(run.layoutAfter, report.fixture?.dockview, report.plugin);
    return {
      arm: sample.arm,
      pair: sample.pair,
      cpuRate: sample.cpuRate,
      scenario: `dockview-${report.plugin ? "plugin" : "core"}-${windowPrefix}${run.scenario}`,
      values: windowMetrics(run),
    };
  });
}
