import { test, expect } from "@playwright/test";
import {
  beginDenseWindow,
  endDenseWindow,
  denseStreamObservations,
} from "../../helpers/dense-measurement";
import { denseViewportTaskIds } from "../../helpers/dense-viewport";

test("limits columns measurements to the board viewport", async ({ page }) => {
  await page.setContent(`
    <style>body { margin: 0 } section { flex: 0 0 400px; height: 200px }</style>
    <main data-testid="threads-board" style="display:flex;width:600px;height:300px;overflow:auto">
      <section data-thread-column-id="one"></section>
      <section data-thread-column-id="two"></section>
      <section data-thread-column-id="three"></section>
    </main>
  `);
  const ids = ["one", "two", "three"];
  expect(await denseViewportTaskIds(page, ids)).toEqual(["one", "two"]);
  await page.getByTestId("threads-board").evaluate((board) => {
    board.scrollLeft = 400;
  });
  expect(await denseViewportTaskIds(page, ids)).toEqual(["two", "three"]);
});

test("records visible stream progress during the measured window", async ({ page }) => {
  test.setTimeout(30_000);
  await page.setContent(
    '<section data-testid="thread-column-one"><div data-agent-message-body>Dense canonical warmup Dense canonical tick 1</div></section>',
  );
  await page.evaluate(() => {
    (window as Window & { __KANDEV_E2E_STORE__?: unknown }).__KANDEV_E2E_STORE__ = {
      subscribe: () => () => undefined,
    };
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable", { timeDomain: "timeTicks" });
  const before = await beginDenseWindow(page, cdp, ["one"]);
  await expect
    .poll(async () => (await denseStreamObservations(page)).length, { timeout: 8_000 })
    .toBe(1);
  await page.locator("[data-agent-message-body]").evaluate((body) => {
    body.textContent = "Dense canonical warmup Dense canonical tick 5";
  });
  await expect
    .poll(async () => (await denseStreamObservations(page)).length, { timeout: 8_000 })
    .toBe(2);
  const after = await endDenseWindow(page, cdp, before);
  expect(after.browser.streamProgress.map((sample) => sample.rows)).toEqual([
    [{ taskId: "one", connected: true, lastTick: 1 }],
    [{ taskId: "one", connected: true, lastTick: 5 }],
  ]);
  await expect(beginDenseWindow(page, cdp, ["missing"])).rejects.toThrow(
    "Missing dense stream body",
  );
});
