import type { Page } from "@playwright/test";
import { createGatewayScopeLedger } from "./gateway-scope-ledger";

/** Observe acknowledgements without exposing application-private owner maps. */
export function captureGatewayScopes(page: Page) {
  const ledger = createGatewayScopeLedger();
  let parseErrors = 0;
  const decode = (payload: string | Buffer) => {
    try {
      return JSON.parse(payload.toString()) as unknown;
    } catch {
      parseErrors++;
      return null;
    }
  };
  page.on("websocket", (socket) => {
    if (!socket.url().endsWith("/ws")) return;
    const connection = ledger.open();
    socket.on("framesent", ({ payload }) => ledger.send(connection, decode(payload)));
    socket.on("framereceived", ({ payload }) => ledger.receive(connection, decode(payload)));
    socket.on("close", () => ledger.close(connection));
  });
  return { snapshot: () => ({ ...ledger.snapshot(), parseErrors }) };
}

export function inspectNavigationOwners(page: Page) {
  return page.evaluate(() => {
    const api = (
      window as Window & {
        __dockviewApi__?: import("dockview-react").DockviewApi | null;
      }
    ).__dockviewApi__;
    return {
      documentTimeOrigin: performance.timeOrigin,
      dockviewAvailable: Boolean(api),
      panels:
        api?.panels
          .map((panel) => ({
            id: panel.id,
            component: panel.api.component,
            visible: panel.api.isVisible,
          }))
          .sort((a, b) => a.id.localeCompare(b.id)) ?? [],
      documentEditors: document.querySelectorAll(".tiptap").length,
      chatRoots: Array.from(document.querySelectorAll('[data-testid="session-chat"]'))
        .map((root) => ({
          sessionId: root.getAttribute("data-session-id"),
          detailActive: root.getAttribute("data-detail-active") === "true",
          editors: root.querySelectorAll(".tiptap").length,
        }))
        .sort((a, b) => (a.sessionId ?? "").localeCompare(b.sessionId ?? "")),
    };
  });
}
