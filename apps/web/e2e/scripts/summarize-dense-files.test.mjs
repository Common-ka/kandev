import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeReport } from "./summarize-dense-performance.mjs";

const PROTOCOL = "threads-files-v1";
function fixtureReport() {
  const threads = [0, 1].map((i) => ({ taskId: `task-${i}`, sessionId: `session-${i}` }));
  const files = threads.map((thread, i) => ({
    ...thread,
    environmentId: `environment-${i}`,
    profileFiles: 630,
    changedFiles: 73,
    stateSha256: String(i).repeat(64),
  }));
  return {
    fixtureProtocol: PROTOCOL,
    fixture: { workload: { columns: 2, tasks: 2 }, taskCount: 2, threads, files },
    samples: ["baseline", "candidate"].map((arm) => ({
      arm,
      pair: 0,
      cpuRate: 1,
      fileState: structuredClone(files),
      cold: { resources: [], readyMs: 100, documentMs: 50 },
      runs: [],
    })),
  };
}

test("retains the validated reference file protocol in the summary", () => {
  const result = summarizeReport(fixtureReport());
  assert.equal(result.fixtureProtocol, PROTOCOL);
});

test("rejects missing or incomplete prepared-environment file witnesses", () => {
  for (const change of [
    (r) => delete r.fixture.files,
    (r) => delete r.fixture.taskCount,
    (r) => (r.fixture.taskCount = 1),
    (r) => r.fixture.files.pop(),
    (r) => (r.fixture.files[0].profileFiles = 0),
    (r) => (r.fixture.files[0].changedFiles = 72),
    (r) => (r.fixture.files[0].stateSha256 = "bad"),
    (r) => (r.fixture.files[0].taskId = "another-task"),
    (r) => (r.fixture.files[0].sessionId = "another-session"),
    (r) => (r.fixture.files[1].environmentId = r.fixture.files[0].environmentId),
  ]) {
    const value = fixtureReport();
    change(value);
    assert.throws(() => summarizeReport(value), /file fixture/i);
  }
});

test("rejects unverified or changed per-arm file state", () => {
  for (const change of [
    (r) => delete r.samples[0].fileState,
    (r) => r.samples[1].fileState.pop(),
    (r) => (r.samples[0].fileState[0].stateSha256 = "f".repeat(64)),
    (r) => (r.samples[1].fileState[0].environmentId = "another-environment"),
    (r) => (r.samples[1].fileState[0].changedFiles = 74),
  ]) {
    const value = fixtureReport();
    change(value);
    assert.throws(() => summarizeReport(value), /file fixture/i);
  }
});

test("rejects unknown and missing file fixture protocol metadata", () => {
  const unknown = fixtureReport();
  unknown.fixtureProtocol = "future-version";
  assert.throws(() => summarizeReport(unknown), /file fixture/i);
  const missing = fixtureReport();
  delete missing.fixtureProtocol;
  assert.throws(() => summarizeReport(missing), /file fixture/i);
});

test("keeps historical reports readable without claiming the new fixture protocol", () => {
  const legacy = fixtureReport();
  delete legacy.fixtureProtocol;
  delete legacy.fixture.files;
  for (const sample of legacy.samples) delete sample.fileState;
  const result = summarizeReport(legacy);
  assert.equal(result.fixtureProtocol, undefined);
});

test("rejects malformed identities even when fixture and sample fields agree", () => {
  for (const field of ["taskId", "sessionId", "environmentId"]) {
    const value = fixtureReport();
    value.fixture.files[0][field] = "";
    if (field !== "environmentId") value.fixture.threads[0][field] = "";
    for (const sample of value.samples) sample.fileState[0][field] = "";
    assert.throws(() => summarizeReport(value), /file fixture/i);
  }
  const value = fixtureReport();
  value.fixture.workload.columns = "2";
  assert.throws(() => summarizeReport(value), /file fixture/i);
});
