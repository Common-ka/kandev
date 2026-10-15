import type { StoreApi } from "zustand";
import { fetchTask } from "@/lib/api";
import { toKanbanTask } from "@/lib/kanban/map-task";
import type { AppState } from "./store";

export async function fetchTaskForNavigation(
  store: StoreApi<AppState>,
  taskId: string,
  signal: AbortSignal,
  scopeIsCurrent: () => boolean,
) {
  const readId = store.getState().beginTaskOverviewRead();
  try {
    const task = await fetchTask(taskId, { cache: "no-store", init: { signal } });
    if (!signal.aborted && scopeIsCurrent() && store.getState().tasks.activeTaskId === taskId) {
      store.getState().retainTaskOverviews("detail", [toKanbanTask(task)], readId);
    }
    return task;
  } finally {
    store.getState().finishTaskOverviewRead(readId);
  }
}
