import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { test, expect } from "../../fixtures/test-base";
import { hashAssetTree, sha256File, snapshotDatabase } from "../../helpers/dense-snapshot";
import { readNavigationScenario } from "../../helpers/navigation-layout";
import { BROWSER_READINESS_VERSION } from "../../helpers/navigation-browser-readiness";
import { runDenseNavigationSample } from "../../helpers/dense-navigation-sample";
import { prepareDenseNavigationItems } from "../../helpers/dense-navigation-fixture";
import { profileMachine } from "../task/task-navigation-profile-helpers";

test.skip(process.env.KANDEV_DENSE_NAVIGATION !== "1", "opt-in matched navigation benchmark");

function navigationMeasurementKind(profileTimedSwitches: boolean) {
  if (profileTimedSwitches) return "cpu-attribution";
  return process.env.KANDEV_DENSE_NAV_TASKS ? "harness-rehearsal" : "reference-workload";
}

test("compares dense task switches and retained Dockview owners", async ({
  browser,
  testPage,
  apiClient: api,
  seedData: seed,
  backend,
}, info) => {
  test.setTimeout(7_200_000);
  const navigationScenario = readNavigationScenario();
  const baseline = process.env.KANDEV_DENSE_BASELINE_ROOT;
  if (!baseline) throw new Error("KANDEV_DENSE_BASELINE_ROOT must name the frozen checkout");
  const candidate = path.resolve(process.cwd(), "../..");
  const builds = Object.fromEntries(
    Object.entries({ baseline, candidate }).map(([arm, root]) => {
      const binary = path.join(root, "apps/backend/bin/kandev");
      const assets =
        arm === "candidate" && process.env.KANDEV_DENSE_CANDIDATE_ASSETS
          ? process.env.KANDEV_DENSE_CANDIDATE_ASSETS
          : path.join(root, "apps/web/dist");
      return [
        arm,
        { binary, assets, binarySha256: sha256File(binary), assetsSha256: hashAssetTree(assets) },
      ];
    }),
  );
  const items = await prepareDenseNavigationItems(testPage, api, seed, backend, navigationScenario);
  const storageState = await testPage.context().storageState();
  const sessionStorageState = await testPage.evaluate(() =>
    Object.fromEntries(Object.entries(sessionStorage)),
  );
  await testPage.close();
  const snapshot = path.join(backend.tmpDir, "navigation-base.db");
  snapshotDatabase(path.join(backend.tmpDir, "kandev.db"), snapshot);
  const directory = path.join(candidate, ".kandev/diagnostics/dense-workbench-performance");
  fs.mkdirSync(directory, { recursive: true });
  const output = path.join(directory, `matched-navigation-${Date.now()}.json`);
  const profileTimedSwitches = process.env.KANDEV_DENSE_NAV_PROFILE === "1";
  const navigationReadiness =
    process.env.KANDEV_DENSE_NAV_READINESS === "1" ? BROWSER_READINESS_VERSION : "driver";
  const report = {
    measurementKind: navigationMeasurementKind(profileTimedSwitches),
    navigationScenario,
    navigationReadiness,
    profileWindow: profileTimedSwitches ? "timed-switches" : "post-timing-selection",
    machine: profileMachine(),
    sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      cwd: candidate,
    }).trim(),
    sourcePatch: execFileSync("git", ["diff", "HEAD"], { encoding: "utf8", cwd: candidate }),
    builds,
    items,
    databaseSha256: sha256File(snapshot),
    samples: [] as unknown[],
    error: undefined as string | undefined,
    timingDefinition:
      "Driver selection start to destination file marker and two requestAnimationFrame callbacks. This is a DOM readiness upper bound, not INP or screen presentation.",
  };
  const save = () => fs.writeFileSync(output, JSON.stringify(report, null, 2));
  save();
  try {
    const pairs = Number(process.env.KANDEV_DENSE_PAIRS ?? 6);
    const rates = (process.env.KANDEV_DENSE_CPU_RATES ?? "1,4").split(",").map(Number);
    for (const cpuRate of rates)
      for (let pair = 0; pair < pairs; pair++) {
        const order = pair % 2 === 0 ? ["baseline", "candidate"] : ["candidate", "baseline"];
        for (const arm of order) {
          const sample = `${arm}-${cpuRate}x-${pair}`;
          const database = path.join(backend.tmpDir, `${sample}.db`);
          fs.copyFileSync(snapshot, database);
          expect(sha256File(database)).toBe(report.databaseSha256);
          await backend.restart(
            {
              KANDEV_DATABASE_PATH: database,
              KANDEV_HOME_DIR: path.join(backend.tmpDir, `${sample}-home`),
              KANDEV_WEB_DIST_DIR: builds[arm].assets,
              KANDEV_LOG_LEVEL: "warn",
            },
            builds[arm].binary,
          );
          const result = await runDenseNavigationSample({
            browser,
            backend,
            api,
            seed,
            items,
            storageState,
            sessionStorageState,
            cpuRate,
            pair,
            sample,
            profileTimedSwitches,
            navigationReadiness,
            navigationScenario,
            profileFile: path.join(
              directory,
              `${path.basename(output, ".json")}-${sample}.cpuprofile`,
            ),
          });
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
    await info.attach("matched-navigation-comparison", {
      path: output,
      contentType: "application/json",
    });
  }
});
