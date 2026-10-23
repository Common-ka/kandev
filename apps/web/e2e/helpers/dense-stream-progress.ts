import type { Page } from "@playwright/test";
import type { ApiClient } from "./api-client";
import type { DenseThread } from "./dense-workbench-fixture";

export function summarizeStreamTicks(contents: string[]) {
  const ticks = contents.flatMap((content) =>
    Array.from(content.matchAll(/Dense canonical tick (\d+)/g), (match) => Number(match[1])),
  );
  return {
    count: ticks.length,
    uniqueCount: new Set(ticks).size,
    lastTick: ticks.length ? Math.max(...ticks) : null,
  };
}

async function browserProgress(page: Page, threads: DenseThread[]) {
  try {
    const rows = await page.evaluate((items) => {
      return items.map(({ taskId, sessionId }) => {
        const tile = document.querySelector(`[data-testid="thread-column-${taskId}"]`);
        const contents = Array.from(tile?.querySelectorAll("[data-agent-message-body]") ?? [])
          .map((node) => node.textContent ?? "")
          .filter((content) => content.includes("Dense canonical warmup"));
        return { sessionId, mounted: Boolean(tile), at: Date.now(), contents };
      });
    }, threads);
    return rows.map(({ contents, ...row }) => ({ ...row, ...summarizeStreamTicks(contents) }));
  } catch (error) {
    return { error: String(error) };
  }
}

async function storedProgress(api: ApiClient, sessionId: string) {
  try {
    const history = await api.listSessionMessages(sessionId);
    const contents = history.messages
      .filter(
        (message) =>
          message.author_type === "agent" && message.content.includes("Dense canonical warmup"),
      )
      .map((message) => message.content);
    return { sessionId, at: Date.now(), ...summarizeStreamTicks(contents) };
  } catch (error) {
    return { sessionId, at: Date.now(), error: String(error) };
  }
}

export async function inspectDenseStreamProgress(
  page: Page,
  api: ApiClient,
  threads: DenseThread[],
) {
  const [browser, stored] = await Promise.all([
    browserProgress(page, threads),
    Promise.all(threads.map((thread) => storedProgress(api, thread.sessionId))),
  ]);
  return { browser, stored };
}
