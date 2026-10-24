type Scope = {
  socket: number;
  kind: "task" | "session" | "session.conversation";
  taskId: string | null;
  sessionId: string | null;
  consumerKind: string | null;
  pluginId: string | null;
  scopeId: string | null;
  wireId: string | null;
};

type Operation = { scope: Scope; key: string; sequence: number; subscribe: boolean };
type WireMessage = { id?: unknown; type?: unknown; action?: unknown; payload?: unknown };
type LedgerEvent = { at: number; socket: number; event: string; scope?: Scope };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function field(value: unknown) {
  return typeof value === "string" && value.length ? value : null;
}

function scopeRequest(socket: number, message: WireMessage) {
  const action = field(message.action);
  const match = action?.match(/^(task|session|session\.conversation)\.(subscribe|unsubscribe)$/);
  if (!match) return null;
  const payload = record(message.payload);
  const scope: Scope = {
    socket,
    kind: match[1] as Scope["kind"],
    taskId: field(payload.task_id),
    sessionId: field(payload.session_id),
    consumerKind: field(payload.consumer_kind),
    pluginId: field(payload.plugin_id),
    scopeId: field(payload.scope_id),
    wireId: field(payload.wire_id),
  };
  if (scope.kind === "task" ? !scope.taskId : !scope.sessionId) return null;
  return { scope, key: JSON.stringify(scope), subscribe: match[2] === "subscribe" };
}

/** Counts acknowledged wire scopes, not private frontend subscription references. */
export function createGatewayScopeLedger() {
  let nextSocket = 0;
  let sequence = 0;
  let failedRequests = 0;
  const sockets = new Set<number>();
  const pending = new Map<string, Operation>();
  const active = new Map<string, Scope>();
  const applied = new Map<string, number>();
  const events: LedgerEvent[] = [];
  const log = (socket: number, event: string, scope?: Scope) =>
    events.push({ at: Date.now(), socket, event, ...(scope ? { scope } : {}) });

  return {
    open() {
      const socket = ++nextSocket;
      sockets.add(socket);
      log(socket, "opened");
      return socket;
    },
    send(socket: number, input: unknown) {
      if (!sockets.has(socket)) return;
      const message = record(input) as WireMessage;
      const id = field(message.id);
      if (!id || message.type !== "request") return;
      const operation = scopeRequest(socket, message);
      if (!operation) return;
      pending.set(`${socket}:${id}`, { ...operation, sequence: ++sequence });
      log(socket, operation.subscribe ? "subscribe-sent" : "unsubscribe-sent", operation.scope);
    },
    receive(socket: number, input: unknown) {
      if (!sockets.has(socket)) return;
      const message = record(input) as WireMessage;
      if (message.type !== "response" && message.type !== "error") return;
      const requestKey = `${socket}:${field(message.id)}`;
      const operation = pending.get(requestKey);
      if (!operation) return;
      pending.delete(requestKey);
      const payload = record(message.payload);
      if (message.type === "error" || payload.success !== true) {
        failedRequests++;
        log(socket, "failed", operation.scope);
        return;
      }
      if (operation.sequence < (applied.get(operation.key) ?? 0)) {
        log(socket, "stale-acknowledgement", operation.scope);
        return;
      }
      applied.set(operation.key, operation.sequence);
      if (operation.subscribe) active.set(operation.key, operation.scope);
      else active.delete(operation.key);
      log(socket, operation.subscribe ? "subscribed" : "unsubscribed", operation.scope);
    },
    close(socket: number) {
      if (!sockets.delete(socket)) return;
      for (const [key, operation] of pending)
        if (operation.scope.socket === socket) pending.delete(key);
      for (const [key, scope] of active) if (scope.socket === socket) active.delete(key);
      log(socket, "closed");
    },
    snapshot() {
      return {
        openConnections: sockets.size,
        totalConnections: nextSocket,
        pendingRequests: pending.size,
        failedRequests,
        scopes: [...active.values()].map((scope) => ({ ...scope })),
        events: events.map((event) => ({
          ...event,
          ...(event.scope ? { scope: { ...event.scope } } : {}),
        })),
      };
    },
  };
}
