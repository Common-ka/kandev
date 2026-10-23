---
id: "05-workbench-lifecycle"
title: "Dockview and editor lifecycle"
status: pending
wave: 5
depends_on: 
  - "04-asset-delivery"
plan: "plan.md"
requirements:
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-003
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-004
  - REQ-PLATFORM-VIEWPORT-SESSION-DELIVERY-001
acceptance_criteria:
  - AC-UI-SESSION-REFRESH-EFFICIENCY-003.3
  - AC-UI-SESSION-REFRESH-EFFICIENCY-003.4
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.1
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.2
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.3
  - AC-PLATFORM-VIEWPORT-SESSION-DELIVERY-001.1
system_design:
  - ../../specs/ui/system-design/session-refresh-efficiency.md
  - ../../specs/platform/system-design/viewport-bounded-session-delivery.md
---

# Task 05: Dockview and editor lifecycle

## Summary

Attribute and reduce repeated work during dense Dockview and task switching. Continue the existing session-efficiency Task 05 investigation, with no speculative layout or editor rewrite.

## In scope

- Profile editor construction duration, React commits, hidden effects, subscriptions, and Dockview fast versus `fromJSON` paths using separate attribution runs.
- Add a behavioral regression for each demonstrated unnecessary mount, effect, read, or unrelated row publication, then repair its current owner.
- Keep intentionally mounted disclosure editors and plugin state. Gate demonstrated hidden work with existing visibility; do not change domain-data freshness.
- Cover same/different environment, compatible/incompatible layouts, pinned tabs, split panes, A-B-A, delayed reads, drafts/attachments, and scrolling. Retain viewport activation rather than activating all 30 columns.
- Update companion Task 05 with actual evidence. If no attributable defect reproduces, leave it unresolved and record that outcome.

## Out of scope

Live instance mutations, unrelated refactors, new task/session creation, deployment,
and changes outside this package's contracts. No delegation is authorized.

## Acceptance conditions

1. Each lifecycle change has an attributed baseline and a regression that proves obsolete/hidden work is removed without invalidating current state.
2. Task selection, draft restoration, editor readiness, saved layouts, split visibility, and late-response isolation pass desktop and phone tests.
3. Repeated switches release obsolete owners; measured unchanged rows stay stable. No performance or memory claim rests only on mount counts.

## Verification commands

Run the listed commands sequentially. New test files are implementation outputs;
they must exist before these commands count as verification. Use the guarded
E2E runner with fresh known artifacts. Capture RED/GREEN evidence for changed
logic and apply scoped lint to touched files.

```bash
cd apps/web
pnpm exec vitest run lib/state/dockview-env-switch.test.ts lib/state/dockview-env-switch-pinned.test.ts lib/state/dockview-env-switch-active-views.test.ts
pnpm e2e:run --project chromium tests/task/task-switch-efficiency.spec.ts tests/performance/dense-workbench-correctness.spec.ts
pnpm e2e:run --project mobile-chrome tests/task/mobile-task-switch-efficiency.spec.ts tests/performance/mobile-dense-workbench-correctness.spec.ts
KANDEV_DENSE_PROFILE=1 pnpm e2e:run --project chromium tests/performance/dense-workbench-profile.spec.ts
pnpm run typecheck
```

## Likely files

- `apps/web/lib/state/dockview-env-switch.ts` and related tests
- `apps/web/components/task/dockview-panel-content.tsx`
- Shared TaskChatPanel and the attributed composer disclosure/effect owner
- Existing Threads viewport activation hooks and regression tests
- Existing task-switch E2Es and new dense correctness/profile tests
- `docs/plans/session-refresh-efficiency/task-05-task-switch-render-lifecycle.md` results

## Dependencies and parallelism

Requires `04-asset-delivery`. Sequential execution only.

## Inputs

Read the requirements and designs referenced in frontmatter, the
[plan](plan.md), and the [benchmark protocol](benchmark.md). Preserve existing
companion-plan ownership and historical results described by the plan.

## Risks

Fast-switching an incompatible layout or unmounting a retained composer can lose user state. Reuse existing scoped read and draft owners. Editor creation across a genuine owner change can be necessary.

## Results

Pending. No implementation or performance result is claimed.

