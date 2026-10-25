import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { inspectDenseColdFailure } from "../../helpers/dense-cold-diagnostics";
import { loadDenseCold } from "../../helpers/dense-cold-load";
import { captureDenseTraffic } from "../../helpers/dense-measurement";

const thread = {
  taskId: "fixture-task",
  sessionId: "fixture-session",
  messageId: "fixture-message",
  title: "Diagnostic fixture",
  content: "Fixture message",
  siblings: [],
};

test.use({ baseURL: "http://cold-diagnostic.invalid" });

test("records browser observation time and document state after a cold failure", async ({
  page,
}) => {
  await page.setContent(
    '<title>Cold diagnostic fixture</title><div data-testid="threads-board"><div data-testid="thread-column-fixture-task"></div></div>',
  );
  await page.evaluate(() => {
    Object.assign(window, {
      __KANDEV_E2E_EXPOSE_STORE__: true,
      __KANDEV_E2E_STORE__: {
        getState: () => ({ messages: { bySession: { "fixture-session": [{ id: "message" }] } } }),
      },
    });
  });
  const value = await inspectDenseColdFailure(page, [thread]);
  expect(value).toMatchObject({
    requestedAt: expect.any(Number),
    observedAt: expect.any(Number),
    receivedAt: expect.any(Number),
    pageState: {
      title: "Cold diagnostic fixture",
      readyState: "complete",
      boardPresent: true,
      storeRequested: true,
      storeExposed: true,
      boardRect: { width: expect.any(Number), height: expect.any(Number) },
    },
    rows: [{ mounted: true, loadedMessages: 1 }],
  });
});

test("retains navigation, browser errors and an image without replacing the cold error", async ({
  page,
}, info) => {
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).pathname === "/broken.js") return route.abort("failed");
    return route.fulfill({
      status: 200,
      contentType: "text/html",
      body: '<title>Cold startup error fixture</title><main>Cold startup fixture</main><script src="/broken.js"></script><script>throw new Error("Cold startup fixture error")</script>',
    });
  });
  const prefix = info.outputPath("cold-failure");
  const checkpoints: Array<Record<string, unknown>> = [];
  await expect(
    loadDenseCold({
      page,
      workspaceId: "fixture-workspace",
      threads: [thread],
      warmup: "Fixture warmup",
      traffic: captureDenseTraffic(page),
      failureArtifactPrefix: prefix,
      checkpoint: (value) => checkpoints.push(value),
    }),
  ).rejects.toThrow(/threads-board/);
  expect(checkpoints).toHaveLength(1);
  const saved = checkpoints[0].coldFailure as Record<string, unknown>;
  expect(saved).toMatchObject({
    navigation: { responseStatus: 200, documentMs: expect.any(Number) },
    pageState: { title: "Cold startup error fixture", boardPresent: false, storeExposed: false },
    pageErrors: [expect.objectContaining({ message: "Cold startup fixture error" })],
    requestFailures: [expect.objectContaining({ path: "/broken.js", method: "GET" })],
    image: { path: `${prefix}.cold.png` },
  });
  expect(fs.existsSync(`${prefix}.cold.png`)).toBe(true);
  expect(fs.readFileSync(`${prefix}.cold.png`).subarray(0, 4).toString("hex")).toBe("89504e47");
});
