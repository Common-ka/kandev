"use client";

import { useMemo } from "react";
import { useOptionalAppStore } from "@/components/state-provider";
import { selectTaskStatusSummary } from "@/lib/task-status-summary";
import type { TaskStatusSummary } from "@/lib/types/task-status-summary";

type StatusSummaryTask = {
  id: string;
  statusSummary?: TaskStatusSummary | null;
};

export type TaskStatusSummaryState = {
  taskOverview: { byId: Record<string, StatusSummaryTask> };
  kanban: { tasks: StatusSummaryTask[] };
  kanbanMulti: { snapshots: Record<string, { tasks: StatusSummaryTask[] }> };
  sidebarArchivedTasks: {
    itemsByWorkspaceId: Record<string, StatusSummaryTask[]>;
  };
};

export function collectTaskStatusSummaryCandidates(
  state: TaskStatusSummaryState,
  taskId: string,
): Array<TaskStatusSummary | null | undefined> {
  const candidates: Array<TaskStatusSummary | null | undefined> = [];
  const addCandidate = (candidate: StatusSummaryTask) => {
    if (candidate.id === taskId) candidates.push(candidate.statusSummary);
  };
  const canonical = state.taskOverview.byId[taskId];
  if (canonical) addCandidate(canonical);
  state.kanban.tasks.forEach(addCandidate);
  Object.values(state.kanbanMulti.snapshots).forEach((snapshot) =>
    snapshot.tasks.forEach(addCandidate),
  );
  Object.values(state.sidebarArchivedTasks.itemsByWorkspaceId).forEach((items) =>
    items.forEach(addCandidate),
  );
  return candidates;
}

export function createTaskStatusSummarySelector(taskId: string | null | undefined) {
  let previous: unknown[] | undefined;
  let selected: TaskStatusSummary | null | undefined;
  return (state: TaskStatusSummaryState) => {
    if (!taskId) return null;
    // Retain only status sources. Message publications do not invalidate them.
    const sources = [
      state.taskOverview.byId[taskId],
      state.kanban.tasks,
      state.kanbanMulti.snapshots,
      state.sidebarArchivedTasks.itemsByWorkspaceId,
    ];
    if (!previous || sources.some((source, index) => source !== previous?.[index])) {
      selected = selectTaskStatusSummary(
        undefined,
        collectTaskStatusSummaryCandidates(state, taskId),
      );
      previous = sources;
    }
    return selected;
  };
}

export function useTaskStatusSummary(
  taskId: string | null | undefined,
  detail: TaskStatusSummary | null | undefined,
): TaskStatusSummary | null | undefined {
  const select = useMemo(() => createTaskStatusSummarySelector(taskId), [taskId]);
  const live = useOptionalAppStore(select, null);

  return useMemo(() => selectTaskStatusSummary(detail, [live]), [detail, live]);
}
