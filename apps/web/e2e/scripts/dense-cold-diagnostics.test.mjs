import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { Window } from "happy-dom";
import { inspectDenseColdFailure } from "../helpers/dense-cold-diagnostics.ts";

test("captures unloaded and failed conversations without copying message bodies", async () => {
  const window = new Window();
  try {
    window.document.body.innerHTML = `
      <section data-testid="thread-column-one">
        <div data-testid="session-history-unavailable">
          <details data-testid="session-history-details"><p>Request timed out</p></details>
        </div>
      </section>
      <section data-testid="thread-column-two">
        <div data-agent-message-body>Dense canonical warmup private body</div>
      </section>`;
    window.__KANDEV_E2E_STORE__ = {
      getState: () => ({ messages: { bySession: { s1: [], s2: [{ content: "private body" }] } } }),
    };
    const page = {
      evaluate: (fn, args) =>
        vm.runInNewContext(`(${fn.toString()})(args)`, { window, document: window.document, args }),
    };
    const result = await inspectDenseColdFailure(page, [
      { taskId: "one", sessionId: "s1" },
      { taskId: "two", sessionId: "s2" },
      { taskId: "missing", sessionId: "s3" },
    ]);
    assert.equal(result.rows[0].historyStatus, "unavailable");
    assert.equal(result.rows[0].errorDetail, "Request timed out");
    assert.equal(result.rows[0].loadedMessages, 0);
    assert.equal(result.rows[1].loadedMessages, 1);
    assert.equal(result.rows[1].warmupMounted, true);
    assert.equal(result.rows[2].mounted, false);
    assert.equal(result.rows[2].loadedMessages, null);
    assert.ok(!JSON.stringify(result).includes("private body"));
    delete window.__KANDEV_E2E_STORE__;
    const unavailable = await inspectDenseColdFailure(page, [{ taskId: "one", sessionId: "s1" }]);
    assert.equal(unavailable.rows[0].loadedMessages, null);
  } finally {
    await window.happyDOM.close();
  }
});

test("retains a browser diagnostic failure instead of replacing the benchmark error", async () => {
  const page = {
    evaluate: async () => {
      throw new Error("Page closed");
    },
  };
  const result = await inspectDenseColdFailure(page, []);
  assert.match(result.error, /Page closed/);
  assert.equal(result.rows, undefined);
  assert.equal(typeof result.at, "number");
});
