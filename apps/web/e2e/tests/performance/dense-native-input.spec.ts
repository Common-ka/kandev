import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import {
  installDenseNativeInputObserver,
  readDenseNativeInputObserver,
  disposeDenseNativeInputObserver,
  captureDenseNativeInputObserver,
} from "../../helpers/dense-native-input";

test.afterEach(async ({ page }, info) => {
  const nativeInput = await readDenseNativeInputObserver(page).catch((error) => ({
    captureError: String(error),
  }));
  const filename = info.outputPath("native-input-ledger.json");
  fs.writeFileSync(filename, JSON.stringify(nativeInput, null, 2));
  await info.attach("native-input-ledger", {
    path: filename,
    contentType: "application/json",
  });
});

async function fixture(page: Page, enabled = true) {
  await page.setContent(`
    <style>
      body { display:flex; gap:20px; }
      .chat-message-list, #foreign { width:320px; height:240px; overflow:auto; overflow-anchor:none; scroll-behavior:auto; }
      .content { height:6000px; }
    </style>
    <div data-testid="thread-column-observed">
      <div data-testid="session-chat" data-session-id="observed-session">
        <div class="chat-message-list"><div class="content">Observed transcript</div></div>
      </div>
      <div class="thread-composer-disclosure" data-state="open"></div>
    </div>
    <div id="foreign"><div class="content">Other scroll area</div></div>`);
  await page.locator(".chat-message-list").evaluate((element) => (element.scrollTop = 600));
  await page.locator("#foreign").evaluate((element) => (element.scrollTop = 600));
  await installDenseNativeInputObserver(page, "observed", enabled);
}

async function oneGesture(page: Page) {
  await expect.poll(async () => (await readDenseNativeInputObserver(page)).gestures.length).toBe(1);
  return (await readDenseNativeInputObserver(page)).gestures[0];
}

test("records the trusted wheel target and the actual native scroll response", async ({ page }) => {
  await fixture(page);
  await page.locator(".chat-message-list").hover();
  await page.mouse.wheel(0, -160);
  await expect
    .poll(() => page.locator(".chat-message-list").evaluate((el) => el.scrollTop))
    .toBeLessThan(600);
  const gesture = await oneGesture(page);
  expect(gesture.wheel).toMatchObject({
    isTrusted: true,
    deltaY: -160,
    targetWithinTranscript: true,
    targetWithinTile: true,
    sessionId: "observed-session",
    connected: true,
    liveTranscriptSameNode: true,
  });
  await expect
    .poll(async () =>
      (await oneGesture(page)).events.some(
        (event) => event.kind === "scroll" && event.scrollTop < 600,
      ),
    )
    .toBe(true);
});

test("retains a native wheel that misses the intended transcript", async ({ page }) => {
  await fixture(page);
  await page.locator("#foreign").hover();
  await page.mouse.wheel(0, -160);
  await expect
    .poll(() => page.locator("#foreign").evaluate((el) => el.scrollTop))
    .toBeLessThan(600);
  const gesture = await oneGesture(page);
  expect(gesture.wheel).toMatchObject({
    isTrusted: true,
    targetWithinTranscript: false,
    targetWithinTile: false,
  });
  expect(await page.locator(".chat-message-list").evaluate((el) => el.scrollTop)).toBe(600);
});

test("records prevention after propagation without causing a scroll", async ({ page }) => {
  await fixture(page);
  const transcript = page.locator(".chat-message-list");
  await transcript.evaluate((element) =>
    element.addEventListener("wheel", (event) => event.preventDefault(), { passive: false }),
  );
  await transcript.hover();
  await page.mouse.wheel(0, -160);
  await expect
    .poll(async () =>
      (await oneGesture(page)).events.some(
        (event) => event.kind === "after-dispatch" && event.defaultPrevented === true,
      ),
    )
    .toBe(true);
  expect(await transcript.evaluate((el) => el.scrollTop)).toBe(600);
});

test("keeps a synthetic wheel distinct from a trusted native wheel", async ({ page }) => {
  await fixture(page);
  await page
    .locator(".chat-message-list")
    .evaluate((element) =>
      element.dispatchEvent(
        new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -160 }),
      ),
    );
  expect((await oneGesture(page)).wheel).toMatchObject({
    isTrusted: false,
    deltaY: -160,
    targetWithinTranscript: true,
  });
  expect(await page.locator(".chat-message-list").evaluate((el) => el.scrollTop)).toBe(600);
});

test("bounds event retention and reports omitted middle events", async ({ page }) => {
  await fixture(page);
  const transcript = page.locator(".chat-message-list");
  await transcript.hover();
  await page.mouse.wheel(0, -160);
  await oneGesture(page);
  await transcript.evaluate(async (element) => {
    for (let frame = 0; frame < 180; frame++) {
      element.scrollTop = 500 + (frame % 2);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  });
  const gesture = await oneGesture(page);
  expect(gesture.events).toHaveLength(64);
  expect(gesture.tail).toHaveLength(16);
  expect(gesture.omittedEvents).toBeGreaterThan(0);
  expect(gesture.events.at(-1)!.at).toBeLessThan(gesture.tail[0].at);
});

test("bounds gesture retention and counts additional native gestures", async ({ page }) => {
  await fixture(page);
  await page.locator(".chat-message-list").hover();
  for (let gesture = 0; gesture < 7; gesture++) await page.mouse.wheel(0, -10);
  await expect.poll(async () => (await readDenseNativeInputObserver(page)).droppedGestures).toBe(3);
  expect((await readDenseNativeInputObserver(page)).gestures).toHaveLength(4);
});

test("removes passive observers without changing native scrolling", async ({ page }) => {
  await fixture(page);
  await disposeDenseNativeInputObserver(page);
  await page.locator(".chat-message-list").hover();
  await page.mouse.wheel(0, -160);
  await expect
    .poll(() => page.locator(".chat-message-list").evaluate((el) => el.scrollTop))
    .toBeLessThan(600);
  expect(await readDenseNativeInputObserver(page)).toMatchObject({ disposed: true, gestures: [] });
});

test("leaves the observer absent when diagnostics are disabled", async ({ page }) => {
  await fixture(page, false);
  await expect(readDenseNativeInputObserver(page)).rejects.toThrow("not installed");
  await page.locator(".chat-message-list").hover();
  await page.mouse.wheel(0, -160);
  await expect
    .poll(() => page.locator(".chat-message-list").evaluate((el) => el.scrollTop))
    .toBeLessThan(600);
});

test("keeps the original input error when diagnostic checkpoint writing fails", async ({
  page,
}) => {
  await fixture(page);
  const failingSample = async () => {
    try {
      throw new Error("Original native input failure");
    } finally {
      await captureDenseNativeInputObserver(page, true, () => {
        throw new Error("Diagnostic checkpoint write failed");
      });
    }
  };
  await expect(failingSample()).rejects.toThrow("Original native input failure");
});

test("records a missing collector as an error instead of an empty event count", async ({
  page,
}) => {
  const checkpoints: Array<Record<string, unknown>> = [];
  await captureDenseNativeInputObserver(page, true, (evidence) => checkpoints.push(evidence));
  expect(checkpoints).toEqual([
    { nativeInput: { captureError: expect.stringContaining("not installed") } },
  ]);
});

test("distinguishes the original transcript from a replacement with the same task ID", async ({
  page,
}) => {
  await fixture(page);
  await page.getByTestId("thread-column-observed").evaluate((element) => {
    element.outerHTML = `<div data-testid="thread-column-observed">
      <div data-testid="session-chat" data-session-id="replacement-session">
        <div class="chat-message-list"><div class="content">Replacement transcript</div></div>
      </div>
      <div class="thread-composer-disclosure" data-state="open"></div>
    </div>`;
  });
  const transcript = page.locator(".chat-message-list");
  await transcript.evaluate((element) => (element.scrollTop = 600));
  await transcript.hover();
  await page.mouse.wheel(0, -160);
  await expect.poll(() => transcript.evaluate((element) => element.scrollTop)).toBeLessThan(600);
  expect((await oneGesture(page)).wheel).toMatchObject({
    isTrusted: true,
    connected: false,
    liveTranscriptSameNode: false,
    liveTileSameNode: false,
    expectedSessionId: "observed-session",
    sessionId: "replacement-session",
  });
});

test.describe("2x display", () => {
  test.use({ deviceScaleFactor: 2 });
  test("records the delivered event delta in a 2x display context", async ({ page }) => {
    await fixture(page);
    await page.evaluate(() => {
      const win = window as Window & { actualWheelDelta?: number };
      document.addEventListener(
        "wheel",
        (event) => {
          win.actualWheelDelta = event.deltaY;
        },
        { capture: true, passive: true, once: true },
      );
    });
    await page.locator(".chat-message-list").hover();
    await page.mouse.wheel(0, -160);
    const gesture = await oneGesture(page);
    const actualDelta = await page.evaluate(
      () => (window as Window & { actualWheelDelta?: number }).actualWheelDelta,
    );
    expect(typeof actualDelta).toBe("number");
    expect(gesture.wheel).toMatchObject({
      isTrusted: true,
      deltaY: actualDelta,
      devicePixelRatio: 2,
    });
  });
});
