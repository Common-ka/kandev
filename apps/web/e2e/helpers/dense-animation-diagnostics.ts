import type { Page } from "@playwright/test";
import { inspectDenseCompositing } from "./dense-compositing-diagnostics";

/** Collect attribution after the observation windows, while the agents remain active. */
export async function inspectDenseAnimations(page: Page) {
  if (process.env.KANDEV_DENSE_ANIMATION_DIAGNOSTICS !== "1") return;
  const snapshot = await page.evaluate(() => ({
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    visibilityState: document.visibilityState,
    animations: document.getAnimations().map((animation) => {
      const effect = animation.effect instanceof KeyframeEffect ? animation.effect : null;
      const timing = effect?.getTiming();
      const ancestors = [];
      let element = effect?.target ?? null;
      for (let depth = 0; element && depth < 5; depth++, element = element.parentElement)
        ancestors.push({
          tag: element.tagName,
          class: element.getAttribute("class"),
          testId: element.getAttribute("data-testid"),
        });
      return {
        name: animation instanceof CSSAnimation ? animation.animationName : null,
        playState: animation.playState,
        duration: timing?.duration,
        iterations: String(timing?.iterations),
        properties: [...new Set(effect?.getKeyframes().flatMap(Object.keys) ?? [])],
        ancestors,
      };
    }),
  }));
  try {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const normalMotionCompositing = await inspectDenseCompositing(
      page,
      '[data-testid="thread-status-working"]',
    );
    return { ...snapshot, normalMotionCompositing };
  } finally {
    await page.emulateMedia({ reducedMotion: snapshot.reducedMotion ? "reduce" : "no-preference" });
  }
}
