import { test } from "node:test";
import assert from "node:assert/strict";
import { createGatewayScopeLedger } from "../helpers/gateway-scope-ledger.ts";

const LEGACY_SUBSCRIBE = "session.subscribe";
const LEGACY_UNSUBSCRIBE = "session.unsubscribe";
const SOURCE_SUBSCRIBE = "session.conversation.subscribe";

const request = (id, action, payload) => ({ id, type: "request", action, payload });
const response = (id, payload = { success: true }) => ({ id, type: "response", payload });

function accept(ledger, socket, id, action, payload) {
  ledger.send(socket, request(id, action, payload));
  ledger.receive(socket, response(id));
}

test("counts legacy, core, and plugin channels separately without retaining tokens", () => {
  const ledger = createGatewayScopeLedger();
  const socket = ledger.open();
  accept(ledger, socket, "legacy", LEGACY_SUBSCRIBE, { session_id: "s1" });
  accept(ledger, socket, "core", SOURCE_SUBSCRIBE, {
    session_id: "s1",
    consumer_kind: "core",
    scope_id: "core-scope",
  });
  accept(ledger, socket, "plugin", SOURCE_SUBSCRIBE, {
    session_id: "s1",
    consumer_kind: "plugin",
    scope_id: "plugin-scope",
    plugin_id: "fixture",
    binding_token: "private-binding",
    resume_token: "private-resume",
  });
  accept(ledger, socket, "task", "task.subscribe", { task_id: "t1" });
  const snapshot = ledger.snapshot();
  assert.equal(snapshot.scopes.length, 4);
  assert.equal(snapshot.pendingRequests, 0);
  assert.deepEqual(snapshot.scopes.map((scope) => scope.kind).sort(), [
    "session",
    "session.conversation",
    "session.conversation",
    "task",
  ]);
  assert.equal(snapshot.scopes.filter((scope) => scope.sessionId === "s1").length, 3);
  assert.doesNotMatch(
    JSON.stringify(snapshot),
    /private-binding|private-resume|binding_token|resume_token/,
  );
});

test("requires acknowledgements and preserves active scopes after a failed release", () => {
  const ledger = createGatewayScopeLedger();
  const socket = ledger.open();
  ledger.send(socket, request("open", LEGACY_SUBSCRIBE, { session_id: "s1" }));
  assert.equal(ledger.snapshot().scopes.length, 0);
  assert.equal(ledger.snapshot().pendingRequests, 1);
  ledger.receive(socket, response("open"));
  ledger.send(socket, request("fail", LEGACY_UNSUBSCRIBE, { session_id: "s1" }));
  ledger.receive(socket, { id: "fail", type: "error", payload: { message: "refused" } });
  assert.equal(ledger.snapshot().scopes.length, 1);
  accept(ledger, socket, "close", LEGACY_UNSUBSCRIBE, { session_id: "s1" });
  assert.equal(ledger.snapshot().scopes.length, 0);
  ledger.send(
    socket,
    request("bad", SOURCE_SUBSCRIBE, {
      session_id: "s2",
      consumer_kind: "core",
      scope_id: "bad-scope",
    }),
  );
  ledger.receive(socket, response("bad", { success: false }));
  assert.equal(ledger.snapshot().scopes.length, 0);
  assert.equal(ledger.snapshot().failedRequests, 2);
});

test("late acknowledgements cannot restore a released scope or closed connection", () => {
  const ledger = createGatewayScopeLedger();
  const socket = ledger.open();
  ledger.send(socket, request("open", LEGACY_SUBSCRIBE, { session_id: "s1" }));
  ledger.send(socket, request("close", LEGACY_UNSUBSCRIBE, { session_id: "s1" }));
  ledger.receive(socket, response("close"));
  ledger.receive(socket, response("open"));
  assert.equal(ledger.snapshot().scopes.length, 0);
  accept(ledger, socket, "again", LEGACY_SUBSCRIBE, { session_id: "s1" });
  ledger.send(socket, request("pending", LEGACY_SUBSCRIBE, { session_id: "s2" }));
  ledger.close(socket);
  ledger.receive(socket, response("pending"));
  assert.equal(ledger.snapshot().scopes.length, 0);
  assert.equal(ledger.snapshot().pendingRequests, 0);
  assert.equal(ledger.snapshot().openConnections, 0);
  const next = ledger.open();
  accept(ledger, next, "again", LEGACY_SUBSCRIBE, { session_id: "s1" });
  assert.equal(ledger.snapshot().scopes.length, 1);
  assert.equal(ledger.snapshot().scopes[0].socket, next);
});

test("retries replace the same scope and ordered legacy wires remain distinct", () => {
  const ledger = createGatewayScopeLedger();
  const socket = ledger.open();
  const core = { session_id: "s1", consumer_kind: "core", wire_id: "wire-1" };
  accept(ledger, socket, "legacy", LEGACY_SUBSCRIBE, { session_id: "s1" });
  accept(ledger, socket, "core", LEGACY_SUBSCRIBE, core);
  accept(ledger, socket, "retry", LEGACY_SUBSCRIBE, core);
  assert.equal(ledger.snapshot().scopes.length, 2);
  accept(ledger, socket, "release", LEGACY_UNSUBSCRIBE, core);
  assert.equal(ledger.snapshot().scopes.length, 1);
  assert.equal(ledger.snapshot().scopes[0].consumerKind, null);
});

test("does not count a response without explicit success as an acknowledged scope", () => {
  const ledger = createGatewayScopeLedger();
  const socket = ledger.open();
  ledger.send(
    socket,
    request("incomplete", SOURCE_SUBSCRIBE, {
      session_id: "s1",
      consumer_kind: "core",
      scope_id: "scope",
    }),
  );
  ledger.receive(socket, response("incomplete", {}));
  assert.equal(ledger.snapshot().scopes.length, 0);
  assert.equal(ledger.snapshot().failedRequests, 1);
});
