export const DENSE_THREADS_FILE_PROTOCOL = "threads-files-v1";

const fields = [
  "taskId",
  "sessionId",
  "environmentId",
  "profileFiles",
  "changedFiles",
  "stateSha256",
];

function validState(state, thread, environments) {
  const identity = [state?.taskId, state?.sessionId, state?.environmentId];
  return (
    thread &&
    identity.every((value) => typeof value === "string" && value.length > 0) &&
    state.taskId === thread.taskId &&
    state.sessionId === thread.sessionId &&
    !environments.has(state.environmentId) &&
    state.profileFiles === 630 &&
    state.changedFiles === 73 &&
    /^[a-f0-9]{64}$/.test(state.stateSha256 ?? "")
  );
}

function validFiles(report) {
  const fixture = report.fixture;
  const columns = fixture?.workload?.columns;
  const count = Math.min(6, columns);
  const files = fixture?.files;
  if (
    !Number.isInteger(fixture?.taskCount) ||
    fixture.taskCount !== fixture.workload.tasks ||
    fixture.taskCount < columns ||
    !Number.isInteger(columns) ||
    columns < 1 ||
    !Array.isArray(files) ||
    files.length !== count
  )
    throw new Error("Missing prepared-environment file fixture");
  const environments = new Set();
  for (const [index, state] of files.entries()) {
    if (!validState(state, fixture.threads?.[index], environments))
      throw new Error("Invalid prepared-environment file fixture");
    environments.add(state.environmentId);
  }
  return files;
}

export function validateDenseFileFixture(report) {
  if (report.fixtureProtocol === undefined) {
    if (report.fixture?.files !== undefined || report.samples?.some((sample) => sample.fileState))
      throw new Error("Missing file fixture protocol");
    return;
  }
  if (report.fixtureProtocol !== DENSE_THREADS_FILE_PROTOCOL)
    throw new Error("Unknown file fixture protocol");
  const files = validFiles(report);
  for (const sample of report.samples) {
    if (!Array.isArray(sample.fileState) || sample.fileState.length !== files.length)
      throw new Error("Missing per-arm file fixture verification");
    for (const [index, expected] of files.entries())
      if (fields.some((field) => sample.fileState[index]?.[field] !== expected[field]))
        throw new Error("Changed per-arm file fixture");
  }
}
