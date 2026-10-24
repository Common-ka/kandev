import { test, expect } from "@playwright/test";
import { inspectDenseCompositing } from "../../helpers/dense-compositing-diagnostics";

test("attributes compositor layers to the actual animation targets", async ({ page }) => {
  await page.setContent(`
    <style>
      @keyframes spin { to { transform: rotate(360deg) } }
      .target { width: 14px; height: 14px; animation: spin 1s linear infinite }
      div.target { background: blue }
    </style>
    <div class="target"></div>
    <svg class="target" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 1-10 10" /></svg>
  `);
  const result = await inspectDenseCompositing(page, ".target");
  expect(result.targets.map((target) => target.tag.toLowerCase())).toEqual(["div", "svg"]);
  expect(result.targets[0].layers.flatMap((layer) => layer.reasons)).toContain(
    "Has an active accelerated transform animation or transition.",
  );
});
