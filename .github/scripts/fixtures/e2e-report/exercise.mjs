// Run only inside the disposable report-image smoke container.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const web = path.join(root, "apps/web");
const e2e = path.join(web, "e2e");
const input = "/result/input";
const blobs = path.join(e2e, "blob-reports");
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: web,
    encoding: "utf8",
    env: process.env,
    ...options,
  });
  if (result.error) throw result.error;
  return result;
};
const pass = (command, args, options) => {
  const result = run(command, args, options);
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`,
  );
  return result;
};
const json = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

fs.mkdirSync(input, { recursive: true });
if (fs.existsSync("/input")) {
  fs.cpSync("/input", input, { recursive: true });
} else {
  fs.mkdirSync(`${input}/blobs`, { recursive: true });
  for (const project of ["chromium", "containers"]) {
    const fixtures = path.join(web, `.report-fixtures-${project}`);
    fs.mkdirSync(`${fixtures}/tests`, { recursive: true });
    fs.writeFileSync(
      `${fixtures}/tests/outcomes.spec.ts`,
      `
      import { test, expect } from '@playwright/test';
      test('passes', async ({}, info) => {
        await info.attach('evidence', { body: Buffer.from('report attachment'), contentType: 'text/plain' });
      });
      test('retries', async ({}, info) => {
        await info.attach('retry evidence', { body: Buffer.from('retry attachment'), contentType: 'text/plain' });
        expect(info.retry).toBeGreaterThan(0);
      });
      test('fails', () => { expect(1).toBe(2); });
      test('skips', () => { test.skip(); });
    `,
    );
    fs.writeFileSync(
      `${fixtures}/config.ts`,
      `
      import { defineConfig } from '@playwright/test';
      export default defineConfig({ testDir: './tests', workers: 1, retries: 1,
        projects: [{ name: '${project}' }], reporter: [['blob', { outputDir: './blobs' }]] });
    `,
    );
    const result = run("pnpm", [
      "exec",
      "playwright",
      "test",
      "-c",
      `${fixtures}/config.ts`,
    ]);
    assert.equal(
      result.status,
      1,
      `fixture must include final failures: ${result.stdout} ${result.stderr}`,
    );
    const zip = fs
      .readdirSync(`${fixtures}/blobs`)
      .find((name) => name.endsWith(".zip"));
    assert.ok(zip, result.stdout + result.stderr);
    fs.copyFileSync(
      `${fixtures}/blobs/${zip}`,
      `${input}/blobs/${project}.zip`,
    );
  }
}
fs.rmSync(blobs, { recursive: true, force: true });
fs.cpSync(`${input}/blobs`, blobs, { recursive: true });
fs.mkdirSync(`${input}/manifests`, { recursive: true });
const source = [
  "--branch",
  "report-smoke",
  "--sha",
  "fixture",
  "--run-id",
  "1",
];
const timingArgs = [
  "exec",
  "tsx",
  "e2e/scripts/e2e-timings.ts",
  "--input",
  blobs,
  "--output",
  "e2e/timing-profile.json",
  "--web-root",
  web,
  ...source,
];
if (fs.existsSync(`${input}/timing-profile.json`))
  timingArgs.push("--previous", `${input}/timing-profile.json`);
pass("pnpm", timingArgs);
pass("pnpm", [
  "exec",
  "tsx",
  "e2e/scripts/retry-summary.ts",
  "--input",
  blobs,
  "--output",
  "e2e/retry-summary.json",
  "--manifest-dir",
  `${input}/manifests`,
  "--attachment-output",
  "e2e/retry-artifacts",
  "--artifact-name",
  "e2e-timing-diagnostics",
  "--artifact-url",
  "https://example.invalid/artifacts",
]);
pass(
  "npx",
  [
    "playwright",
    "merge-reports",
    "--config",
    "e2e/playwright.config.ts",
    "--reporter=html,json",
    blobs,
  ],
  {
    env: {
      ...process.env,
      PLAYWRIGHT_JSON_OUTPUT_FILE: "e2e/merged-report.json",
      PLAYWRIGHT_HTML_OPEN: "never",
    },
  },
);
const flakeArgs = [
  "exec",
  "tsx",
  "e2e/scripts/flake-report.ts",
  "--summary",
  "e2e/retry-summary.json",
  "--output",
  "e2e/flake-history.json",
  "--playwright-json",
  "e2e/merged-report.json",
  ...source,
];
if (fs.existsSync(`${input}/flake-history.json`))
  flakeArgs.push("--history", `${input}/flake-history.json`);
pass("pnpm", flakeArgs);
assert.ok(fs.statSync(path.join(web, "playwright-report/index.html")).size > 0);
const summary = json(`${e2e}/retry-summary.json`);
if (process.env.REPORT_SELF_TEST === "true" && !fs.existsSync("/input")) {
  assert.equal(summary.tests.length, 8);
  assert.equal(summary.counts.passedAfterRetry, 2);
  assert.equal(summary.counts.failed, 2);
  assert.equal(summary.counts.skipped, 2);
}

// Extract and execute the production gate; no second implementation of its verdict.
const workflow = fs
  .readFileSync(path.join(root, ".github/workflows/e2e-tests.yml"), "utf8")
  .split("  e2e-report:\n")[1];
const step = workflow.split("      - name: ").at(-1);
const script = step
  .split("        run: |\n")[1]
  .split("\n")
  .map((line) => line.replace(/^          /, ""))
  .join("\n");
const env = {
  ...process.env,
  CHANGES_RESULT: "success",
  REPORT_RESULT: "success",
  RUN_REQUIRED: "true",
  RUNNER_PLAN: "{}",
  GITHUB_STEP_SUMMARY: "/tmp/report-summary",
  SKIP_REASON: "irrelevant-paths",
};
for (const match of step.matchAll(/^          (\w+_RESULT):/gm))
  env[match[1]] = "success";
const gate = (overrides) =>
  run("bash", ["-c", script], { cwd: root, env: { ...env, ...overrides } })
    .status;
assert.equal(gate({}), 0);
for (const key of Object.keys(env).filter((key) => key.endsWith("_RESULT"))) {
  for (const value of ["failure", "cancelled", ""])
    assert.notEqual(gate({ [key]: value }), 0, `${key}=${value}`);
}
const skipped = Object.fromEntries(
  Object.keys(env)
    .filter(
      (key) =>
        key.endsWith("_RESULT") &&
        !["CHANGES_RESULT", "REPORT_RESULT"].includes(key),
    )
    .map((key) => [key, "skipped"]),
);
assert.equal(gate({ ...skipped, RUN_REQUIRED: "false" }), 0);
fs.renameSync(`${e2e}/merged-report.json`, `${e2e}/merged-report.saved`);
assert.notEqual(gate({}), 0);
fs.renameSync(`${e2e}/merged-report.saved`, `${e2e}/merged-report.json`);

const malformed = path.join(web, ".malformed-blobs");
fs.mkdirSync(malformed);
fs.writeFileSync(`${malformed}/report.zip`, "invalid zip");
assert.notEqual(
  run("npx", [
    "playwright",
    "merge-reports",
    "--config",
    "e2e/playwright.config.ts",
    "--reporter=json",
    malformed,
  ]).status,
  0,
);

const normalize = (value) => {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !["generatedAt", "recordedAt"].includes(key))
        .map(([key, item]) => [key, normalize(item)]),
    );
  return value;
};
const attachments = {};
const scan = (directory) => {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) scan(file);
    else
      attachments[path.relative(e2e, file)] = createHash("sha256")
        .update(fs.readFileSync(file))
        .digest("hex");
  }
};
scan(`${e2e}/retry-artifacts`);
const semantic = normalize({
  summary,
  timing: json(`${e2e}/timing-profile.json`),
  merged: json(`${e2e}/merged-report.json`),
  history: json(`${e2e}/flake-history.json`),
  attachments,
});
fs.writeFileSync("/result/semantic.json", JSON.stringify(semantic, null, 2));
console.log(
  `Report replay and gate checks passed (${summary.tests.length} test identities).`,
);
