import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { verifyDenseColumnTraversal } from "../../helpers/dense-column-traversal";

const threads = Array.from({ length: 4 }, (_, index) => ({
  taskId: `column-task-${index}`,
  sessionId: `column-session-${index}`,
  messageId: `column-message-${index}`,
  title: `Column ${index}`,
  content: "Column diagnostic fixture",
  siblings: [],
}));

async function fixture(page: Page, missingOnReturn: boolean | null) {
  await page.setContent(`
    <style>
      [data-testid="threads-board"] { display:flex; width:400px; overflow-x:auto; }
      [data-thread-column-id] { flex:0 0 300px; height:240px; }
    </style>
    <div data-testid="threads-board">${threads
      .map(
        (thread) => `
      <div data-testid="thread-column-${thread.taskId}" data-thread-column-id="${thread.taskId}">
        <div data-testid="session-chat" data-session-id="${thread.sessionId}" data-detail-active="true">
          <div data-agent-message-body>${thread.title} message</div>
        </div>
      </div>`,
      )
      .join("")}</div>`);
  await page.evaluate(
    ({ items, missingOnReturn }) => {
      Object.assign(window, {
        __KANDEV_E2E_STORE__: {
          getState: () => ({
            messages: {
              bySession: Object.fromEntries(
                items.map((item) => [item.sessionId, [{ id: item.messageId }]]),
              ),
            },
          }),
        },
      });
      const board = document.querySelector<HTMLElement>('[data-testid="threads-board"]')!;
      const removeFirstChat = () =>
        board.firstElementChild!.querySelector('[data-testid="session-chat"]')?.remove();
      if (missingOnReturn) {
        board.addEventListener("scroll", () => {
          if (board.scrollLeft > 500) removeFirstChat();
        });
      } else if (missingOnReturn !== null) removeFirstChat();
    },
    { items: threads, missingOnReturn },
  );
}

for (const missingOnReturn of [false, true]) {
  test(`retains the failed column visit ${missingOnReturn ? "after traversing the deck" : "on first entry"}`, async ({
    page,
  }, info) => {
    await fixture(page, missingOnReturn);
    const checkpoints: Array<Record<string, unknown>> = [];
    const prefix = info.outputPath("column-failure");
    await expect(
      verifyDenseColumnTraversal(page, threads, "columns", {
        failureArtifactPrefix: prefix,
        checkpoint: (value) => {
          checkpoints.push(value);
          fs.writeFileSync(
            info.outputPath("column-traversal-failure.json"),
            JSON.stringify(value, null, 2),
          );
        },
      }),
    ).rejects.toThrow(/toHaveAttribute/);
    expect(checkpoints).toHaveLength(1);
    const failure = checkpoints[0].columnTraversalFailure as Record<string, unknown>;
    expect(failure).toMatchObject({
      observationTiming: "after the failed assertion; not its predicate sample",
      failedVisit: {
        index: missingOnReturn ? 3 : 0,
        position: 0,
        taskId: threads[0].taskId,
        sessionId: threads[0].sessionId,
        stage: "session-id",
      },
      requestedAt: expect.any(Number),
      observedAt: expect.any(Number),
      receivedAt: expect.any(Number),
      pageState: { boardPresent: true, boardRect: { width: 400 } },
      target: { columnPresent: true, chats: [], loadedMessages: 1 },
      image: { path: `${prefix}.columns.png` },
    });
    expect(failure.observedAt).toBeGreaterThanOrEqual(failure.failedAt as number);
    expect(failure.visits).toHaveLength(missingOnReturn ? 3 : 0);
    if (missingOnReturn)
      expect(
        (failure.visits as Array<{ position: number }>).map((visit) => visit.position),
      ).toEqual([0, 1, 3]);
    expect(fs.readFileSync(`${prefix}.columns.png`).subarray(0, 4).toString("hex")).toBe(
      "89504e47",
    );
  });
}

test("keeps the original column assertion if failure checkpoint writing fails", async ({
  page,
}) => {
  await fixture(page, false);
  let checkpointCalled = false;
  await expect(
    verifyDenseColumnTraversal(page, threads, "columns", {
      checkpoint: () => {
        checkpointCalled = true;
        throw new Error("Column checkpoint write failed");
      },
    }),
  ).rejects.toThrow(/toHaveAttribute/);
  expect(checkpointCalled).toBe(true);
});

test("preserves native traversal order and loaded history on a healthy deck", async ({ page }) => {
  await fixture(page, null);
  const checkpoints: Array<Record<string, unknown>> = [];
  const result = await verifyDenseColumnTraversal(page, threads, "columns", {
    checkpoint: (value) => checkpoints.push(value),
  });
  expect(result?.columnCount).toBe(4);
  expect(result?.visits.map((visit) => visit.position)).toEqual([0, 1, 3, 0]);
  expect(result?.visits.every((visit) => visit.loadedMessages === 1)).toBe(true);
  expect(checkpoints).toEqual([]);
});
