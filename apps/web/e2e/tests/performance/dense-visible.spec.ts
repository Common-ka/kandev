import { test, expect } from "@playwright/test";
import { waitForDenseVisible } from "../../helpers/dense-visible";

test("does not accept hidden or missing stream content", async ({ page }) => {
  await page.setContent('<div data-agent-message-body style="visibility:hidden">Final tick</div>');
  const message = page.locator("[data-agent-message-body]");
  await expect(waitForDenseVisible(message, 100)).rejects.toThrow();
  await expect(waitForDenseVisible(page.locator("[data-missing]"), 100)).rejects.toThrow();
  await message.evaluate((element) => {
    (element as HTMLElement).style.visibility = "visible";
  });
  await waitForDenseVisible(message, 1000);
  await message.evaluate((element) => {
    (element as HTMLElement).style.display = "none";
  });
  await expect(waitForDenseVisible(message, 100)).rejects.toThrow();
});
