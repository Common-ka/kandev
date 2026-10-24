import type { Page } from "@playwright/test";

export function captureDockviewPluginTraffic(page: Page) {
  const requests: Array<{ at: number; path: string; method: string }> = [];
  const responses: Array<{ at: number; path: string; status: number }> = [];
  const conversationPath = (url: string) => {
    const path = new URL(url).pathname;
    return /^\/api\/plugins\/[^/]+\/conversation\//.test(path) ? path : null;
  };
  page.on("request", (request) => {
    const path = conversationPath(request.url());
    if (path) requests.push({ at: Date.now(), path, method: request.method() });
  });
  page.on("response", (response) => {
    const path = conversationPath(response.url());
    if (path) responses.push({ at: Date.now(), path, status: response.status() });
  });
  return {
    reset() {
      requests.length = 0;
      responses.length = 0;
    },
    snapshot() {
      return { requests: [...requests], responses: [...responses] };
    },
  };
}

export function inspectDockviewHistory(page: Page, sessionIds: string[]) {
  return page.evaluate((ids) => {
    const state = (
      window as Window & {
        __KANDEV_E2E_STORE__?: {
          getState: () => { messages: { bySession: Record<string, unknown[]> } };
        };
      }
    ).__KANDEV_E2E_STORE__!.getState();
    return ids.map((sessionId) => {
      const root = document.querySelector(
        `[data-testid="session-chat"][data-session-id="${sessionId}"]`,
      );
      return {
        sessionId,
        loadedMessages: state.messages.bySession[sessionId]?.length ?? 0,
        mounted: Boolean(root),
        detailActive: root?.getAttribute("data-detail-active") === "true",
        renderedAgentBodies: root?.querySelectorAll("[data-agent-message-body]").length ?? 0,
        chatEditors: root?.querySelectorAll(".tiptap").length ?? 0,
      };
    });
  }, sessionIds);
}
