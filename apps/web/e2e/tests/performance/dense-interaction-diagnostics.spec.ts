import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { runDenseInteractions } from "../../helpers/dense-interactions";

async function fixture(page: import("@playwright/test").Page, opens: boolean) {
  await page.setContent(`
    <style>
      #tile { margin:100px; width:400px; height:300px; }
      .chat-message-list { height:180px; overflow:auto; }
      .history { height:2000px; }
    </style>
    <div id="tile" data-testid="thread-column-fixture-task">
      <div data-testid="session-chat" data-session-id="fixture-session">
        <div class="chat-message-list"><div class="history">Fixture history</div></div>
      </div>
      <div class="thread-composer-disclosure" data-state="closed">Fixture composer</div>
    </div>`);
  await page.evaluate((opens) => {
    const tile = document.querySelector("#tile")!;
    const disclosure = tile.querySelector(".thread-composer-disclosure")!;
    if (opens)
      tile.addEventListener("mouseenter", () => disclosure.setAttribute("data-state", "open"));
    tile.addEventListener("mouseleave", () => disclosure.setAttribute("data-state", "closed"));
    const transcript = tile.querySelector<HTMLElement>(".chat-message-list")!;
    transcript.scrollTop = transcript.scrollHeight;
  }, opens);
}

test("records each native interaction step without changing the action sequence", async ({
  page,
}) => {
  await fixture(page, true);
  const observations = await runDenseInteractions({
    page,
    taskId: "fixture-task",
    started: performance.now(),
    durationMs: 1000,
  });
  expect(observations.map((entry) => entry.action)).toEqual([
    "scroll-up",
    "return-bottom",
    "leave-tile",
    "hover-tile",
  ]);
  for (const observation of observations) {
    expect(observation).toHaveProperty("steps");
    for (const step of observation.steps) {
      expect(step.finishedMs).toBeGreaterThanOrEqual(step.startedMs);
      expect(step.name).toBeTruthy();
    }
  }
  expect(observations[0].steps.map((step) => step.name)).toContain("wheel-up");
});

test("retains the failing step and image when composer disclosure fails", async ({
  page,
}, info) => {
  await fixture(page, false);
  const prefix = info.outputPath("interaction-failure");
  const checkpoints: Array<Record<string, unknown>> = [];
  await expect(
    runDenseInteractions({
      page,
      taskId: "fixture-task",
      started: performance.now(),
      durationMs: 1000,
      failureArtifactPrefix: prefix,
      checkpoint: (value) => checkpoints.push(value),
    }),
  ).rejects.toThrow();
  expect(checkpoints).toHaveLength(1);
  expect(checkpoints[0]).toMatchObject({
    interactionFailure: {
      action: "scroll-up",
      steps: expect.arrayContaining([
        expect.objectContaining({ name: "wait-composer-open", error: expect.any(String) }),
      ]),
      image: { path: `${prefix}.interaction.png` },
    },
  });
  expect(fs.existsSync(`${prefix}.interaction.png`)).toBe(true);
});
