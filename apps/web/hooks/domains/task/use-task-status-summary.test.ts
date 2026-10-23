import { describe, expect, it } from "vitest";
import {
  collectTaskStatusSummaryCandidates,
  createTaskStatusSummarySelector,
  type TaskStatusSummaryState,
} from "./use-task-status-summary";
import type { TaskStatusSummary } from "@/lib/types/task-status-summary";

const summary = (revision: number) => ({
  revision,
  updated_at: `2026-08-20T00:00:0${revision}Z`,
});

describe("task status summary subscription", () => {
  it("skips task-list scans for unrelated store publications", () => {
    let taskReads = 0;
    const current = summary(4);
    const state = {
      taskOverview: { byId: {} },
      kanban: {
        tasks: Array.from({ length: 1_000 }, (_, index) => ({
          get id() {
            taskReads++;
            return `task-${index}`;
          },
          statusSummary: current,
        })),
      },
      kanbanMulti: { snapshots: {} },
      sidebarArchivedTasks: { itemsByWorkspaceId: {} },
    };
    const select = createTaskStatusSummarySelector("task-1");
    expect(select(state)).toBe(current);
    const initialReads = taskReads;
    for (let index = 0; index < 300; index++) expect(select({ ...state })).toBe(current);
    expect(taskReads).toBe(initialReads);
  });

  it("refreshes each status source and isolates task identity", () => {
    const select = createTaskStatusSummarySelector("task-1");
    const other = createTaskStatusSummarySelector("task-2");
    let state: TaskStatusSummaryState = {
      taskOverview: { byId: {} },
      kanban: { tasks: [] },
      kanbanMulti: { snapshots: {} },
      sidebarArchivedTasks: { itemsByWorkspaceId: {} },
    };
    expect(select(state)).toBeUndefined();
    const task = (revision: number) => ({ id: "task-1", statusSummary: summary(revision) });
    state = { ...state, taskOverview: { byId: { "task-1": task(1) } } };
    expect(select(state)?.revision).toBe(1);
    state = { ...state, kanban: { tasks: [task(2)] } };
    expect(select(state)?.revision).toBe(2);
    state = { ...state, kanbanMulti: { snapshots: { flow: { tasks: [task(3)] } } } };
    expect(select(state)?.revision).toBe(3);
    state = { ...state, sidebarArchivedTasks: { itemsByWorkspaceId: { space: [task(4)] } } };
    expect(select(state)?.revision).toBe(4);
    expect(other(state)).toBeUndefined();
    expect(createTaskStatusSummarySelector(null)(state)).toBeNull();
  });
});

describe("collectTaskStatusSummaryCandidates", () => {
  it("finds a queued task held only in the shared task store", () => {
    const queuedSummary: TaskStatusSummary = {
      ...summary(5),
      launch_queue: {
        reason: "session_capacity",
        queued_at: "2026-08-20T00:00:05Z",
        retrying: true,
      },
    };
    const state = {
      taskOverview: {
        byId: {
          "task-1": { id: "task-1", statusSummary: queuedSummary },
          other: { id: "other", statusSummary: summary(6) },
        },
      },
      kanban: { tasks: [] },
      kanbanMulti: { snapshots: {} },
      sidebarArchivedTasks: { itemsByWorkspaceId: {} },
    };

    expect(collectTaskStatusSummaryCandidates(state, "task-1")).toEqual([queuedSummary]);
  });

  it("collects the task from live kanban, snapshots, and archived lists", () => {
    const liveSummary = summary(4);
    const candidates = collectTaskStatusSummaryCandidates(
      {
        taskOverview: { byId: {} },
        kanban: {
          tasks: [{ id: "other", statusSummary: summary(1) }],
        },
        kanbanMulti: {
          snapshots: {
            workflow: { tasks: [{ id: "task-1", statusSummary: liveSummary }] },
          },
        },
        sidebarArchivedTasks: {
          itemsByWorkspaceId: {
            workspace: [{ id: "task-1", statusSummary: summary(3) }],
          },
        },
      },
      "task-1",
    );

    expect(candidates).toEqual([liveSummary, expect.objectContaining({ revision: 3 })]);
  });
});
