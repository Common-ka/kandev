import { expect, type Locator, type Page } from "@playwright/test";
import { dwell } from "./causal-waits";
import { captureDenseFailureImage } from "./dense-evidence";

export const DENSE_INTERACTION_MODE =
  process.env.KANDEV_DENSE_INTERACTIONS === "1" ? "scripted-scroll-v1" : "quiet";

async function transcriptState(tile: Locator) {
  return tile.evaluate((element) => {
    const transcript = element.querySelector<HTMLElement>(".chat-message-list")!;
    return {
      observedAt: Date.now(),
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

type InteractionStep = {
  name: string;
  startedMs: number;
  finishedMs?: number;
  error?: string;
  value?: unknown;
};

function interactionRecorder(started: number) {
  const steps: InteractionStep[] = [];
  return {
    steps,
    async run<T>(name: string, action: () => Promise<T>): Promise<T> {
      const step: InteractionStep = { name, startedMs: performance.now() - started };
      steps.push(step);
      try {
        const value = await action();
        if (value !== undefined) step.value = value;
        return value;
      } catch (error) {
        step.error = String(error);
        throw error;
      } finally {
        step.finishedMs = performance.now() - started;
      }
    },
  };
}

async function applyInteraction(
  page: Page,
  tile: Locator,
  action: string,
  recorder: ReturnType<typeof interactionRecorder>,
) {
  const transcript = tile.locator(".chat-message-list");
  const region = tile.locator(".thread-composer-disclosure");
  if (action === "leave-tile") {
    await recorder.run("move-outside-tile", () => page.mouse.move(0, 0));
    await recorder.run("wait-composer-closed", () =>
      expect.poll(() => region.getAttribute("data-state")).toBe("closed"),
    );
    return;
  }
  await recorder.run("hover-before-disclosure", () => transcript.hover());
  await recorder.run("wait-composer-open", () =>
    expect.poll(() => region.getAttribute("data-state")).toBe("open"),
  );
  // Disclosure changes transcript bounds; target its final native hit area.
  await recorder.run("hover-after-disclosure", () => transcript.hover());
  if (action === "scroll-up") {
    const before = await recorder.run("read-scroll-position", async () => {
      const state = await transcriptState(tile);
      expect(state.scrollTop).toBeGreaterThan(0);
      return state;
    });
    await recorder.run("wheel-up", () => page.mouse.wheel(0, -160));
    await recorder.run("wait-scroll-up", () =>
      expect
        .poll(async () => (await transcriptState(tile)).scrollTop)
        .toBeLessThan(before.scrollTop),
    );
  } else if (action === "return-bottom") {
    await recorder.run("wheel-bottom", () => page.mouse.wheel(0, 1_000_000));
    await recorder.run("wait-bottom", () =>
      expect
        .poll(async () => {
          const state = await transcriptState(tile);
          return state.scrollHeight - state.scrollTop - state.clientHeight;
        })
        .toBeLessThanOrEqual(3),
    );
  }
}

async function interactionFailure(
  page: Page,
  tile: Locator,
  filename: string | undefined,
  detail: Record<string, unknown>,
) {
  let state;
  try {
    state = await transcriptState(tile);
  } catch (error) {
    state = { inspectionError: String(error) };
  }
  const image = await captureDenseFailureImage(page, filename);
  return { ...detail, state, image, capturedAt: Date.now() };
}

export async function runDenseInteractions(options: {
  page: Page;
  taskId: string;
  started: number;
  durationMs: number;
  checkpoint?: (evidence: Record<string, unknown>) => void;
  failureArtifactPrefix?: string;
}) {
  const { page, taskId, started, durationMs, checkpoint, failureArtifactPrefix } = options;
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
    const recorder = interactionRecorder(started);
    try {
      const before = await recorder.run("read-before", () => transcriptState(tile));
      await applyInteraction(page, tile, action, recorder);
      const finishedMs = performance.now() - started;
      const after = await recorder.run("read-after", () => transcriptState(tile));
      observations.push({
        action,
        taskId,
        scheduledMs,
        startedMs,
        finishedMs,
        before,
        after,
        steps: recorder.steps,
      });
    } catch (error) {
      if (checkpoint)
        checkpoint({
          interactionFailure: await interactionFailure(
            page,
            tile,
            failureArtifactPrefix ? `${failureArtifactPrefix}.interaction.png` : undefined,
            {
              action,
              taskId,
              scheduledMs,
              startedMs,
              observations,
              steps: recorder.steps,
              error: String(error),
            },
          ),
        });
      throw error;
    }
  }
  return observations;
}
