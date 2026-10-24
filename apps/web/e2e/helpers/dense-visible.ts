import { expect, type Locator } from "@playwright/test";

export const DENSE_VISIBILITY_PROBE = "boolean-poll";

/** Boolean polling avoids full-page ARIA snapshots from failed locator assertions. */
export async function waitForDenseVisible(locator: Locator, timeout = 30_000) {
  await expect
    .poll(() => locator.isVisible(), { timeout, intervals: [100, 250, 500, 1000] })
    .toBe(true);
}
