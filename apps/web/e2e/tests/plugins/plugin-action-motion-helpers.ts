import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import type { ApiClient } from "../../helpers/api-client";
import type { SeedData } from "../../fixtures/test-base";
import { installFixturePlugin } from "../../helpers/plugin-fixture";
import { SessionPage } from "../../pages/session-page";

async function expectLoadingMotion(indicators: Locator, running: boolean) {
  await expect(indicators).toHaveCount(2);
  await expect
    .poll(() =>
      indicators.evaluateAll((elements) =>
        elements.map((element) =>
          element.getAnimations().some((animation) => animation.playState === "running"),
        ),
      ),
    )
    .toEqual([running, running]);
  for (const indicator of await indicators.all()) await expect(indicator).toBeVisible();
}

export async function verifyPluginActionMotion(
  page: Page,
  api: ApiClient,
  seed: SeedData,
  info: TestInfo,
) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await installFixturePlugin(page);
  const task = await api.createTaskWithAgent(
    seed.workspaceId,
    "Plugin action reduced motion",
    seed.agentProfileId,
    {
      description: "/e2e:simple-message",
      workflow_id: seed.workflowId,
      workflow_step_id: seed.startStepId,
      repository_ids: [seed.repositoryId],
    },
  );
  await page.goto(`/t/${task.id}`);
  const session = new SessionPage(page);
  await session.waitForLoad();
  await session.composerReady();
  const chat = session.activeChat();
  const actions = chat.locator('[data-slot="surface-action"][data-testid^="e2e-"]');
  const indicators = actions.locator('svg[role="status"]');
  await expectLoadingMotion(indicators, true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expectLoadingMotion(indicators, false);
  for (const action of await actions.all()) {
    await expect(action).toHaveAttribute("aria-busy", "true");
    await expect(action).toBeEnabled();
  }
  const stop = chat.getByTestId("e2e-busy-stop-action");
  await expect(stop).toHaveAccessibleName("Fixture busy stop action");
  if (info.project.use.isMobile) await stop.tap();
  else await stop.click();
  await expect(chat.getByTestId("e2e-composer-action")).toHaveAttribute(
    "data-status",
    "busy-stop-activated",
  );
  await expectLoadingMotion(indicators, false);
  const capture = info.outputPath("plugin-busy-actions-reduced-motion.png");
  await page.screenshot({ path: capture });
  await info.attach("plugin busy actions with reduced motion", {
    path: capture,
    contentType: "image/png",
  });

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expectLoadingMotion(indicators, true);
}
