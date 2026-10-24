const MODE = "scripted-scroll-v1";
const ACTIONS = ["scroll-up", "return-bottom", "leave-tile", "hover-tile"];

export function interactionPrefix(report, sample, run) {
  const mode = report.interactionMode ?? "quiet";
  if (!["quiet", MODE].includes(mode) || (sample.interactionMode ?? "quiet") !== mode)
    throw new Error("Samples must use the report's interaction mode");
  const observations = run.interactions ?? [];
  if (mode === "quiet" || run.scenario !== "streaming") {
    if (observations.length) throw new Error("Unexpected interaction observations");
    return mode === "quiet" ? "" : `${MODE}-`;
  }
  if (observations.length !== ACTIONS.length)
    throw new Error("Incomplete interaction observations");
  let previous = 0;
  for (const [index, entry] of observations.entries()) {
    validateObservation(entry, index, observations[0].taskId, sample.cold.visibleTaskIds, previous);
    previous = entry.finishedMs;
  }
  return `${MODE}-`;
}

function validateObservation(entry, index, taskId, visibleTaskIds, previous) {
  if (
    entry.action !== ACTIONS[index] ||
    !visibleTaskIds.includes(entry.taskId) ||
    entry.taskId !== taskId ||
    ![entry.scheduledMs, entry.startedMs, entry.finishedMs].every(Number.isFinite) ||
    entry.scheduledMs < 0 ||
    entry.startedMs < previous ||
    entry.finishedMs < entry.startedMs
  )
    throw new Error("Invalid interaction observations");
}
