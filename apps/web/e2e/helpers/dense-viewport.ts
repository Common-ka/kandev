import { expect, type Page } from "@playwright/test";

export async function denseViewportTaskIds(page: Page, taskIds: string[]) {
  return page.getByTestId("threads-board").evaluate((board, ids) => {
    const bounds = board.getBoundingClientRect();
    return Array.from(board.querySelectorAll<HTMLElement>("[data-thread-column-id]"))
      .filter((column) => {
        const box = column.getBoundingClientRect();
        return (
          Math.min(box.right, bounds.right, innerWidth) > Math.max(box.left, bounds.left, 0) &&
          Math.min(box.bottom, bounds.bottom, innerHeight) > Math.max(box.top, bounds.top, 0)
        );
      })
      .map((column) => column.dataset.threadColumnId!)
      .filter((id) => ids.includes(id));
  }, taskIds);
}

export async function verifyDenseOffscreenCatchup(
  page: Page,
  taskIds: string[],
  tickCount: number,
) {
  const results = [];
  for (const taskId of taskIds) {
    const column = page.getByTestId(`thread-column-${taskId}`);
    await column.evaluate((element) => {
      element.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
    });
    const body = column
      .locator("[data-agent-message-body]")
      .filter({ hasText: `Dense canonical tick ${tickCount - 1}` });
    await expect(body).toBeVisible({ timeout: 30_000 });
    const ticks = Array.from(
      (await body.textContent())!.matchAll(/Dense canonical tick (\d+)/g),
      (match) => Number(match[1]),
    );
    expect(ticks).toEqual(Array.from({ length: tickCount }, (_, index) => index));
    results.push({ taskId, ticks: ticks.length, at: Date.now() });
  }
  return results;
}
