import { expect, type Page } from "@playwright/test";
import type { ApiClient } from "../../helpers/api-client";
import type { SeedData } from "../../fixtures/test-base";
import { expectReducedStatusMotion } from "../../helpers/animation-assertions";
import { SessionPage } from "../../pages/session-page";

export async function verifyReducedMotionFallback(page: Page, api: ApiClient, seed: SeedData) {
  await page.addInitScript(() => {
    Object.defineProperty(Element.prototype, "animate", { configurable: true, value: undefined });
  });
  const task = await api.createTaskWithAgent(
    seed.workspaceId,
    "Reduced motion fallback",
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
  await session.waitForChatIdle({ timeout: 30_000 });
  await session.sendMessageViaButton("/slow 8s");
  const cubes = session.activeChat().locator(".spinner-grid-cube:visible");
  await expect.poll(() => cubes.count()).toBeGreaterThan(0);
  await expect
    .poll(() =>
      cubes.evaluateAll((elements) =>
        elements.every((element) =>
          element
            .getAnimations()
            .some(
              (animation) =>
                animation.constructor.name === "CSSAnimation" && animation.playState === "running",
            ),
        ),
      ),
    )
    .toBe(true);
  await expectReducedStatusMotion(page);
  await expect
    .poll(() =>
      cubes.evaluateAll((elements) =>
        elements.every((element) =>
          element.getAnimations().some((animation) => animation.playState === "running"),
        ),
      ),
    )
    .toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await session.waitForChatIdle({ timeout: 30_000 });
  await expect(session.activeChat().getByTestId("chat-input-glow")).toHaveCount(0);
}
