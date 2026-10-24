import fs from "node:fs";
import path from "node:path";
import { test, expect } from "../../fixtures/test-base";
import { DENSE_WORKLOAD } from "../../helpers/dense-workbench-fixture";
import { seedDenseDockviewFixture } from "../../helpers/dense-dockview-fixture";
import { prepareDenseDockviewLayout } from "../../helpers/dense-dockview-layout";
import { exposeNavigationStore } from "../task/task-navigation-helpers";
import { SessionPage } from "../../pages/session-page";
import { hashAssetTree, sha256File } from "../../helpers/dense-snapshot";
import {
  installDenseDockviewPlugin,
  mountDenseDockviewPlugin,
} from "../../helpers/dense-dockview-plugin";

test.skip(process.env.KANDEV_DENSE_DOCKVIEW_FIXTURE !== "1", "opt-in dense Dockview fixture check");

test("keeps the dense history manifest while preparing real Dockview sibling sessions", async ({
  apiClient: api,
  seedData: seed,
  testPage: page,
  backend,
}) => {
  test.setTimeout(180_000);
  const baselineRoot = process.env.KANDEV_DENSE_BASELINE_ROOT;
  const buildRoot = baselineRoot ?? path.resolve(process.cwd(), "../..");
  const binary = path.join(buildRoot, "apps/backend/bin/kandev");
  const assets = path.join(buildRoot, "apps/web/dist");
  if (baselineRoot) await backend.restart({ KANDEV_WEB_DIST_DIR: assets }, binary);
  const build = { binarySha256: sha256File(binary), assetsSha256: hashAssetTree(assets) };
  await page.setViewportSize({ width: 1470, height: 956 });
  const fixture = await seedDenseDockviewFixture(api, seed, backend);
  expect(fixture.threads).toHaveLength(DENSE_WORKLOAD.columns);
  expect(fixture.manifest).toHaveLength(DENSE_WORKLOAD.columns);
  const first = fixture.threads[0];
  const { sessions } = await api.listTaskSessions(first.taskId);
  const primary = sessions.find((session) => session.id === first.sessionId);
  expect(primary?.task_environment_id).toBeTruthy();
  expect(sessions).toHaveLength(3);
  for (const [index, sessionId] of first.siblings.entries()) {
    expect(sessions.find((session) => session.id === sessionId)?.task_environment_id).toBe(
      primary!.task_environment_id,
    );
    expect((await api.listSessionMessages(sessionId)).messages).toHaveLength(
      index === 0 ? DENSE_WORKLOAD.messages : Math.min(100, DENSE_WORKLOAD.messages),
    );
  }
  expect((await api.listSessionMessages(first.sessionId)).messages).toHaveLength(
    DENSE_WORKLOAD.messages,
  );
  await exposeNavigationStore(page);
  const plugin =
    process.env.KANDEV_DENSE_DOCKVIEW_PLUGIN === "1"
      ? await installDenseDockviewPlugin(page)
      : undefined;
  await page.goto(`/t/${first.taskId}`);
  const session = new SessionPage(page);
  await session.waitForLoad();
  let layout = await prepareDenseDockviewLayout(page, fixture);
  if (plugin) {
    layout = await mountDenseDockviewPlugin(page, fixture.dockview.visibleSessionIds);
    await expect(page.getByTestId("fixture-prompt-history-row")).toHaveCount(
      Math.min(2, Math.ceil(DENSE_WORKLOAD.messages / 20)),
    );
  }
  await expect(session.fileTreeNode("navigation-available")).toBeVisible();
  await expect(page.getByTestId("plan-panel")).toContainText("Verify deterministic step 1.");
  expect(layout.groups).toBe(plugin ? 6 : 5);
  expect(layout.panels).toHaveLength(plugin ? 9 : 7);
  expect(fixture.dockview.producers).toHaveLength(6);
  const evidence = test.info().outputPath("dense-dockview-layout.json");
  fs.writeFileSync(
    evidence,
    JSON.stringify({ dockview: fixture.dockview, layout, plugin, build }, null, 2),
  );
  await test.info().attach("dense-dockview-layout.json", {
    path: evidence,
    contentType: "application/json",
  });
  const capture = test.info().outputPath("dense-dockview-layout.png");
  await page.screenshot({ path: capture });
  await test.info().attach("dense-dockview-layout.png", {
    path: capture,
    contentType: "image/png",
  });
});
