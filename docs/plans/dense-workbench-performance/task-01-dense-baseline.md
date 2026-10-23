---
id: "01-dense-baseline"
title: "Dense fixture and baseline"
status: pending
wave: 1
depends_on: []
plan: "plan.md"
requirements:
  - REQ-PLUGINS-PROMPT-HISTORY-HOST-006
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-004
  - REQ-PLATFORM-VIEWPORT-SESSION-DELIVERY-001
acceptance_criteria:
  - AC-PLUGINS-PROMPT-HISTORY-HOST-006.9
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.1
  - AC-PLATFORM-VIEWPORT-SESSION-DELIVERY-001.1
system_design:
  - ../../specs/plugins/system-design/conversation-source-reconciliation.md
  - ../../specs/ui/system-design/session-refresh-efficiency.md
  - ../../specs/platform/system-design/viewport-bounded-session-delivery.md
---

# Task 01: Dense fixture and baseline

## Summary

Build the reproducible benchmark harness and capture the unchanged source baseline before product edits. Use the exact workload and comparison rules in [benchmark.md](benchmark.md).

## In scope

- Extend the existing navigation-profile fixture and diagnostic attachments with dense Threads, Dockview, steady streaming, and switch scenarios.
- Seed disposable instances through test APIs and real writer/publication paths. Prove fixture equivalence and record artifact hashes.
- Add gated benchmark files and a deterministic test-only stream control if current fixtures cannot exercise the real producer. Profile normal/reset publications and editor import initiators.
- Record the baseline and unresolved attribution. Keep production behavior unchanged.

## Out of scope

Live instance mutations, unrelated refactors, new task/session creation, deployment,
and changes outside this package's contracts. No delegation is authorized.

## Acceptance conditions

1. Both baseline checkouts can run the same harness with matching fixture counts/content and update sequence; no live data or service is used.
2. Baseline artifacts include all primary scenarios, source/build/harness identity, request reasons, correctness markers, and measurement limits.
3. A targeted regression reproduces any proposed production repair before it is implemented; an absent defect remains explicitly unconfirmed.

## Verification commands

Run the listed commands sequentially. New test files are implementation outputs;
they must exist before these commands count as verification. Use the guarded
E2E runner with fresh known artifacts. Capture RED/GREEN evidence for changed
logic and apply scoped lint to touched files.

```bash
cd apps/web
KANDEV_DENSE_PROFILE=1 pnpm e2e:run --project chromium tests/performance/dense-workbench-profile.spec.ts
KANDEV_NAVIGATION_PROFILE=1 pnpm e2e:run --project chromium tests/task/task-navigation-profile.spec.ts
pnpm run typecheck
```

## Likely files

- `apps/web/e2e/tests/performance/dense-workbench-profile.spec.ts` (new)
- `apps/web/e2e/helpers/dense-workbench-fixture.ts` (new)
- `apps/web/e2e/tests/task/task-navigation-profile*.ts`
- `apps/web/e2e/fixtures/` and existing test API helpers; backend test harness only if needed
- This package's baseline evidence and run manifest

## Dependencies and parallelism

No implementation dependency. Freeze the baseline before production edits. Sequential execution only.

## Inputs

Read the requirements and designs referenced in frontmatter, the
[plan](plan.md), and the [benchmark protocol](benchmark.md). Preserve existing
companion-plan ownership and historical results described by the plan.

## Risks

Seeding only frontend state can bypass the receipt bug. Changed stream rates or visible panel counts invalidate an A/B claim.

## Results

Pending. No implementation or performance result is claimed.

