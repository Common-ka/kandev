import { expect, type Locator, type Page } from "@playwright/test";
import { dwell } from "./causal-waits";

export const DENSE_INTERACTION_MODE =
  process.env.KANDEV_DENSE_INTERACTIONS === "1" ? "scripted-scroll-v1" : "quiet";

async function transcriptState(tile: Locator) {
  return tile.evaluate((element) => {
    const transcript = element.querySelector<HTMLElement>(".chat-message-list")!;
    return {
      scrollTop: transcript.scrollTop,
      scrollHeight: transcript.scrollHeight,
      clientHeight: transcript.clientHeight,
      composer: element.querySelector(".thread-composer-disclosure")?.getAttribute("data-state"),
      sessionId: element
        .querySelector('[data-testid="session-chat"]')
        ?.getAttribute("data-session-id"),
    };
  });
}

async function applyInteraction(page: Page, tile: Locator, action: string) {
  const transcript = tile.locator(".chat-message-list");
  const region = tile.locator(".thread-composer-disclosure");
  if (action === "leave-tile") {
    await page.mouse.move(0, 0);
    await expect.poll(() => region.getAttribute("data-state")).toBe("closed");
    return;
  }
  await transcript.hover();
  await expect.poll(() => region.getAttribute("data-state")).toBe("open");
  // Disclosure changes transcript bounds; target its final native hit area.
  await transcript.hover();
  if (action === "scroll-up") {
    const before = await transcriptState(tile);
    expect(before.scrollTop).toBeGreaterThan(0);
    await page.mouse.wheel(0, -160);
    await expect
      .poll(async () => (await transcriptState(tile)).scrollTop)
      .toBeLessThan(before.scrollTop);
  } else if (action === "return-bottom") {
    await page.mouse.wheel(0, 1_000_000);
    await expect
      .poll(async () => {
        const state = await transcriptState(tile);
        return state.scrollHeight - state.scrollTop - state.clientHeight;
      })
      .toBeLessThanOrEqual(3);
  }
}

export async function runDenseInteractions(options: {
  page: Page;
  taskId: string;
  started: number;
  durationMs: number;
  checkpoint?: (evidence: Record<string, unknown>) => void;
}) {
  const { page, taskId, started, durationMs, checkpoint } = options;
  const tile = page.getByTestId(`thread-column-${taskId}`);
  const actions = ["scroll-up", "return-bottom", "leave-tile", "hover-tile"];
  const observations = [];
  for (const [index, action] of actions.entries()) {
    const scheduledMs = (durationMs * (index + 1)) / 5;
    await dwell(
      Math.max(0, started + scheduledMs - performance.now()),
      "clock-separation",
      "fixed scripted transcript and tile interaction schedule",
    );
    const startedMs = performance.now() - started;
    const before = await transcriptState(tile);
    try {
      await applyInteraction(page, tile, action);
    } catch (error) {
      checkpoint?.({
        interactionFailure: {
          action,
          taskId,
          scheduledMs,
          startedMs,
          observations,
          state: await transcriptState(tile),
          error: String(error),
        },
      });
      throw error;
    }
    observations.push({
      action,
      taskId,
      scheduledMs,
      startedMs,
      finishedMs: performance.now() - started,
      before,
      after: await transcriptState(tile),
    });
  }
  return observations;
}
