import fs from "node:fs";
import path from "node:path";
import { test, expect } from "../../fixtures/test-base";
import { dwell } from "../../helpers/causal-waits";
import {
  seedDenseWorkbench,
  DENSE_WORKLOAD,
  streamDenseUpdates,
} from "../../helpers/dense-workbench-fixture";
import { attachGatewayTrafficCapture, summarizeGatewayTraffic } from "../../helpers/ws-traffic";
import {
  captureThreadSettings,
  seedThreadPresentation,
} from "../task/threads-presentation-helpers";
import { profileMachine } from "../task/task-navigation-profile-helpers";

test.skip(process.env.KANDEV_DENSE_PROFILE !== "1", "opt-in dense workbench measurement");

test("profiles dense Threads with a fixed update schedule", async ({
  testPage: page,
  apiClient: api,
  seedData,
}, info) => {
  test.setTimeout(1_800_000);
  await page.setViewportSize({ width: 1470, height: 956 });
  const settings = await captureThreadSettings(api);
  try {
    const fixture = await seedDenseWorkbench(api, seedData);
    await seedThreadPresentation(api, { layout: "grid", maxChats: 6, autoHideComposer: true });
    const traffic = attachGatewayTrafficCapture(page);
    const changes: Array<{ reset: boolean; operations: number }> = [];
    page.on("websocket", (socket) => {
      if (!socket.url().endsWith("/ws")) return;
      socket.on("framereceived", ({ payload }) => {
        const frame = JSON.parse(payload.toString());
        if (frame.action === "session.conversation.changed")
          changes.push({
            reset: frame.payload.reset === true,
            operations: frame.payload.operations?.length ?? 0,
          });
      });
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    await page.goto(`/threads?workspace=${seedData.workspaceId}`);
    await expect(page.getByTestId("threads-board")).toBeVisible();
    const visible = fixture.threads.slice(0, Math.min(6, fixture.threads.length));
    for (const thread of visible) {
      const column = page.getByTestId(`thread-column-${thread.taskId}`);
      await expect(column).toBeVisible();
      await expect(column).toContainText(thread.content.split("\n")[0]);
    }
    const resources = await page.evaluate(() =>
      performance.getEntriesByType("resource").map((entry) => {
        const item = entry as PerformanceResourceTiming;
        return {
          name: new URL(item.name).pathname,
          encodedBytes: item.encodedBodySize,
          decodedBytes: item.decodedBodySize,
          transferBytes: item.transferSize,
        };
      }),
    );
    const runs = [];
    for (const streaming of [false, true]) {
      traffic.frames.length = 0;
      changes.length = 0;
      const before = await cdp.send("Performance.getMetrics");
      const start = performance.now();
      let updates = 0;
      if (streaming) {
        updates = await streamDenseUpdates(api, visible, start);
        for (const thread of visible)
          await expect(page.getByTestId(`thread-column-${thread.taskId}`)).toContainText(
            `Dense live tick ${Math.ceil(DENSE_WORKLOAD.durationMs / 200) - 1}`,
          );
      } else
        await dwell(
          DENSE_WORKLOAD.durationMs,
          "clock-separation",
          "measure a fixed settled idle window",
        );
      const after = await cdp.send("Performance.getMetrics");
      runs.push({
        streaming,
        elapsedMs: performance.now() - start,
        updates,
        before,
        after,
        traffic: summarizeGatewayTraffic(traffic.frames),
        resets: changes.filter((item) => item.reset).length,
        operations: changes.reduce((sum, item) => sum + item.operations, 0),
      });
    }
    const report = {
      machine: profileMachine(),
      browser: page.context().browser()!.version(),
      fixture,
      resources,
      runs,
    };
    const dir = path.resolve(
      process.cwd(),
      "../../.kandev/diagnostics/dense-workbench-performance",
    );
    fs.mkdirSync(dir, { recursive: true });
    const output = path.join(
      dir,
      `${process.env.KANDEV_DENSE_ARM ?? "baseline"}-${Date.now()}.json`,
    );
    fs.writeFileSync(output, JSON.stringify(report, null, 2));
    await info.attach("dense-workbench-profile", { path: output, contentType: "application/json" });
    await cdp.detach();
  } finally {
    await api.saveUserSettings(settings);
  }
});
