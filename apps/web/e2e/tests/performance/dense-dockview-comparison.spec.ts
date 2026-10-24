import { DENSE_VISIBILITY_PROBE } from "../../helpers/dense-visible";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { test, expect } from "../../fixtures/test-base";
import { seedDenseDockviewFixture } from "../../helpers/dense-dockview-fixture";
import { denseDockviewPluginIdentity } from "../../helpers/dense-dockview-plugin";
import { runDenseDockviewSample } from "../../helpers/dense-dockview-sample";
import { hashAssetTree, sha256File, snapshotDatabase } from "../../helpers/dense-snapshot";
import { profileMachine } from "../task/task-navigation-profile-helpers";

function dockviewMeasurementKind() {
  if (process.env.KANDEV_DENSE_DOCKVIEW_PROFILE === "1") return "cpu-attribution";
  return process.env.KANDEV_DENSE_TASKS ? "harness-rehearsal" : "reference-workload";
}

function verifyDockviewProfile(
  output: string,
  sample: string,
  measurementKind: string,
  result: Awaited<ReturnType<typeof runDenseDockviewSample>>,
) {
  if (process.env.KANDEV_DENSE_DOCKVIEW_PROFILE !== "1") return;
  expect(measurementKind).toBe("cpu-attribution");
  let sawAssetFrame = false;
  for (const run of result.runs) {
    const profile = JSON.parse(
      fs.readFileSync(`${output}.${sample}.${run.scenario}.cpuprofile`, "utf8"),
    );
    expect(profile.samples.length).toBeGreaterThan(0);
    expect(profile.timeDeltas).toHaveLength(profile.samples.length);
    expect((profile.endTime - profile.startTime) / 1000).toBeGreaterThanOrEqual(run.elapsedMs);
    sawAssetFrame ||= profile.nodes.some((node: { callFrame: { url: string } }) =>
      node.callFrame.url.includes("/assets/"),
    );
  }
  expect(sawAssetFrame).toBe(true);
}

test.skip(
  process.env.KANDEV_DENSE_DOCKVIEW_COMPARE !== "1",
  "opt-in matched dense Dockview benchmark",
);

test("compares frozen builds on identical dense Dockview snapshots", async ({
  browser,
  testPage,
  apiClient: api,
  seedData: seed,
  backend,
}, info) => {
  test.setTimeout(14_400_000);
  const baselineRoot = process.env.KANDEV_DENSE_BASELINE_ROOT;
  if (!baselineRoot) throw new Error("KANDEV_DENSE_BASELINE_ROOT must name the frozen checkout");
  const candidateRoot = path.resolve(process.cwd(), "../..");
  const arms = {
    baseline: {
      binary: path.join(baselineRoot, "apps/backend/bin/kandev"),
      assets: path.join(baselineRoot, "apps/web/dist"),
    },
    candidate: {
      binary: path.join(candidateRoot, "apps/backend/bin/kandev"),
      assets:
        process.env.KANDEV_DENSE_CANDIDATE_ASSETS ?? path.join(candidateRoot, "apps/web/dist"),
    },
  };
  const builds = Object.fromEntries(
    Object.entries(arms).map(([arm, build]) => [
      arm,
      {
        ...build,
        binarySha256: sha256File(build.binary),
        assetsSha256: hashAssetTree(build.assets),
      },
    ]),
  );
  const sourceFiles = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    encoding: "utf8",
    cwd: candidateRoot,
  })
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((name) => ({
      path: name,
      sha256: sha256File(path.join(candidateRoot, name)),
      content: fs.readFileSync(path.join(candidateRoot, name), "utf8"),
    }));
  const lockfileSha256 = sha256File(path.join(candidateRoot, "apps/pnpm-lock.yaml"));
  expect(lockfileSha256).toBe(sha256File(path.join(baselineRoot, "apps/pnpm-lock.yaml")));
  const fixture = await seedDenseDockviewFixture(api, seed, backend);
  await testPage.close();
  const snapshot = path.join(backend.tmpDir, "dense-base.db");
  snapshotDatabase(path.join(backend.tmpDir, "kandev.db"), snapshot);
  const directory = path.join(candidateRoot, ".kandev/diagnostics/dense-workbench-performance");
  fs.mkdirSync(directory, { recursive: true });
  const output = path.join(directory, `matched-dockview-${Date.now()}.json`);
  const measurementKind = dockviewMeasurementKind();
  const report = {
    machine: profileMachine(),
    sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      cwd: candidateRoot,
    }).trim(),
    sourceFiles,
    lockfileSha256,
    measurementKind,
    finalVisibilityProbe: DENSE_VISIBILITY_PROBE,
    workbenchSurface: "dockview",
    plugin: process.env.KANDEV_DENSE_DOCKVIEW_PLUGIN === "1" ? denseDockviewPluginIdentity() : null,
    throttleAfterLoad: process.env.KANDEV_DENSE_THROTTLE_AFTER_LOAD === "1",
    candidateFirst: process.env.KANDEV_DENSE_CANDIDATE_FIRST === "1",
    builds,
    fixture,
    databaseSha256: sha256File(snapshot),
    sourcePatch: execFileSync("git", ["diff", "HEAD"], { encoding: "utf8", cwd: candidateRoot }),
    samples: [] as unknown[],
    checkpoints: {} as Record<string, Record<string, unknown>>,
    error: undefined as string | undefined,
  };
  const save = () => fs.writeFileSync(output, JSON.stringify(report, null, 2));
  save();
  const readyFile = process.env.KANDEV_DENSE_READY_FILE;
  if (readyFile)
    await expect
      .poll(() => fs.existsSync(readyFile), {
        timeout: 3_600_000,
        intervals: [1_000],
        message: "await completion of owned build and verification jobs before timing",
      })
      .toBe(true);
  const pairs = Number(process.env.KANDEV_DENSE_PAIRS ?? 6);
  const rates = (process.env.KANDEV_DENSE_CPU_RATES ?? "1,4").split(",").map(Number);
  try {
    for (const cpuRate of rates)
      for (let pair = 0; pair < pairs; pair++) {
        const baselineFirst = (pair % 2 === 0) !== report.candidateFirst;
        const order = baselineFirst
          ? (["baseline", "candidate"] as const)
          : (["candidate", "baseline"] as const);
        for (const arm of order) {
          const sample = `${arm}-${cpuRate}x-${pair}`;
          const database = path.join(backend.tmpDir, `${sample}.db`);
          fs.copyFileSync(snapshot, database);
          expect(sha256File(database)).toBe(report.databaseSha256);
          await backend.restart(
            {
              KANDEV_DATABASE_PATH: database,
              KANDEV_HOME_DIR: path.join(backend.tmpDir, `${sample}-home`),
              KANDEV_WEB_DIST_DIR: arms[arm].assets,
              KANDEV_LOG_LEVEL: "warn",
            },
            arms[arm].binary,
          );
          const result = await runDenseDockviewSample({
            browser,
            backend,
            api,
            seed,
            fixture,
            sample,
            cpuRate,
            profilePrefix:
              process.env.KANDEV_DENSE_DOCKVIEW_PROFILE === "1" ? `${output}.${sample}` : undefined,
            checkpoint: (evidence) => {
              report.checkpoints[sample] = { ...report.checkpoints[sample], ...evidence };
              save();
            },
          });
          verifyDockviewProfile(output, sample, measurementKind, result);
          report.samples.push({ arm, pair, ...result });
          save();
        }
      }
  } catch (error) {
    report.error = String(error);
    save();
    throw error;
  } finally {
    const backendLog = path.join(backend.tmpDir, "backend-process.log");
    if (fs.existsSync(backendLog)) fs.copyFileSync(backendLog, `${output}.backend.log`);
    await info.attach("matched-dockview-comparison", {
      path: output,
      contentType: "application/json",
    });
  }
});
