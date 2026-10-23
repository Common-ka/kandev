import { expect, type Page } from "@playwright/test";
import { DENSE_WORKLOAD, type DenseThread } from "./dense-workbench-fixture";

/** Load through the UI's pagination sentinel, then restore the live edge. */
export async function loadDenseHistory(page: Page, threads: DenseThread[]) {
  const columns = threads.map((thread) => page.getByTestId(`thread-column-${thread.taskId}`));
  await expect
    .poll(
      async () => {
        const loaded = await page.evaluate(
          (expected) => {
            const store = (
              window as Window & {
                __KANDEV_E2E_STORE__?: {
                  getState: () => {
                    messages: { bySession: Record<string, Array<{ content: string }>> };
                  };
                };
              }
            ).__KANDEV_E2E_STORE__!;
            const messages = store.getState().messages.bySession;
            return expected.map(({ sessionId, title }) => ({
              sessionId,
              count: messages[sessionId]?.length ?? 0,
              oldestPresent:
                messages[sessionId]?.some((message) =>
                  message.content.startsWith(`${title} message 0000\n`),
                ) ?? false,
            }));
          },
          threads.map(({ sessionId, title }) => ({ sessionId, title })),
        );
        for (let i = 0; i < columns.length; i++) {
          if (loaded[i].oldestPresent) continue;
          await columns[i].locator(".chat-message-list").evaluate((element) => {
            element.scrollTop = 0;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
        return loaded.every(
          (entry) => entry.oldestPresent && entry.count >= DENSE_WORKLOAD.messages,
        );
      },
      {
        timeout: 180_000,
        intervals: [100, 250, 500],
        message: "all visible chats contain their oldest seeded message",
      },
    )
    .toBe(true);
  for (const column of columns)
    await column.locator(".chat-message-list").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
}
