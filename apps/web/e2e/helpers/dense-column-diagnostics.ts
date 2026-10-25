import type { Page } from "@playwright/test";
import type { AppState } from "../../lib/state/store";
import { captureDenseFailureImage } from "./dense-evidence";

export type DenseColumnVisit = {
  position: number;
  taskId: string;
  sessionId: string;
  loadedMessages: number;
};

export type DenseColumnProgress = {
  order: string[];
  visits: DenseColumnVisit[];
  failedVisit: {
    index: number;
    position: number;
    taskId: string;
    sessionId: string;
    stage: "scroll" | "session-id" | "detail-active" | "content" | "loaded-messages";
  } | null;
};

export type DenseColumnDiagnosticOptions = {
  checkpoint?: (evidence: Record<string, unknown>) => void;
  failureArtifactPrefix?: string;
};

async function inspectColumnFailure(page: Page, progress: DenseColumnProgress) {
  const requestedAt = Date.now();
  try {
    const observation = await page.evaluate(
      ({ taskId, sessionId }) => {
        function rect(element: Element | null) {
          const bounds = element?.getBoundingClientRect();
          return bounds
            ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
            : null;
        }
        function sessionState(state: AppState | undefined, id: string | undefined) {
          if (!state || !id) return {};
          return {
            loadedMessages: state.messages.bySession[id]?.length ?? null,
            sessionState: state.taskSessions?.items[id]?.state ?? null,
            activeTurnId: state.turns?.activeBySession[id] ?? null,
          };
        }
        const target = window as Window & {
          __KANDEV_E2E_STORE__?: { getState: () => AppState };
          __DENSE_OWNER_SNAPSHOT__?: () => unknown;
        };
        const board = document.querySelector<HTMLElement>('[data-testid="threads-board"]');
        const column = taskId
          ? document.querySelector(`[data-testid="thread-column-${taskId}"]`)
          : null;
        const columns = Array.from(board?.querySelectorAll("[data-thread-column-id]") ?? []);
        return {
          observedAt: Date.now(),
          pageState: {
            visibilityState: document.visibilityState,
            boardPresent: Boolean(board),
            boardRect: rect(board),
            boardScrollLeft: board?.scrollLeft ?? null,
            boardScrollWidth: board?.scrollWidth ?? null,
            viewport: { width: innerWidth, height: innerHeight },
          },
          target: {
            columnPresent: Boolean(column),
            rect: rect(column),
            ...sessionState(target.__KANDEV_E2E_STORE__?.getState(), sessionId),
            chats: Array.from(column?.querySelectorAll('[data-testid="session-chat"]') ?? [])
              .slice(0, 8)
              .map((chat) => ({
                sessionId: chat.getAttribute("data-session-id"),
                detailActive: chat.getAttribute("data-detail-active"),
                rect: rect(chat),
              })),
          },
          columnCount: columns.length,
          columns: columns.slice(0, 64).map((element) => ({
            taskId: element.getAttribute("data-thread-column-id"),
            rect: rect(element),
          })),
          privateLogicalOwners: target.__DENSE_OWNER_SNAPSHOT__?.() ?? null,
        };
      },
      { taskId: progress.failedVisit?.taskId, sessionId: progress.failedVisit?.sessionId },
    );
    return { requestedAt, ...observation, receivedAt: Date.now() };
  } catch (error) {
    return { requestedAt, receivedAt: Date.now(), observationError: String(error) };
  }
}

export async function captureDenseColumnFailure(
  page: Page,
  progress: DenseColumnProgress,
  error: unknown,
  options: DenseColumnDiagnosticOptions,
) {
  const failedAt = Date.now();
  try {
    const observation = await inspectColumnFailure(page, progress);
    const image = await captureDenseFailureImage(
      page,
      options.failureArtifactPrefix ? `${options.failureArtifactPrefix}.columns.png` : undefined,
    );
    options.checkpoint?.({
      columnTraversalFailure: {
        failedAt,
        error: String(error),
        observationTiming: "after the failed assertion; not its predicate sample",
        ...progress,
        ...observation,
        image,
      },
    });
  } catch {
    // Diagnostic failures must preserve the original traversal error.
  }
}
