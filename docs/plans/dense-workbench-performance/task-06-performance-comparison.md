---
id: "06-performance-comparison"
title: "Matched comparison and regression evidence"
status: pending
wave: 6
depends_on: 
  - "05-workbench-lifecycle"
plan: "plan.md"
requirements:
  - REQ-PLUGINS-PROMPT-HISTORY-HOST-006
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-004
  - REQ-UI-PERSISTENT-STATUS-MOTION-006
  - REQ-PLATFORM-WEB-ASSET-DELIVERY-001
acceptance_criteria:
  - AC-PLUGINS-PROMPT-HISTORY-HOST-006.9
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.1
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.3
  - AC-UI-PERSISTENT-STATUS-MOTION-006.1
  - AC-PLATFORM-WEB-ASSET-DELIVERY-001.1
system_design:
  - ../../specs/plugins/system-design/conversation-source-reconciliation.md
  - ../../specs/ui/system-design/session-refresh-efficiency.md
  - ../../specs/ui/system-design/persistent-status-motion.md
  - ../../specs/platform/system-design/web-asset-delivery.md
---

# Task 06: Matched comparison and regression evidence

## Summary

Run the matched baseline/candidate comparison and publish reproducible evidence. Keep neutral results, regressions, and unresolved bottlenecks visible.

## In scope

- Execute every primary scenario and the six paired runs from benchmark.md using the same test harness and immutable built artifacts.
- Separate cold transfer, idle/streaming CPU, warm-switch latency, reduced-motion effects, and retention checks. Run 4x stress separately from unthrottled runs.
- Re-run targeted correctness after the final candidate changes. Inspect desktop/phone states and motion against UI-01 and current layouts.
- Save run manifests, JSON metrics, attribution traces, fixture checks, and a concise results.md with links. Show measured comparison through Kandev rich output.
- Update statuses and companion records only from actual evidence; assess public-doc impact with docs-maintainer before delivery.

## Out of scope

Live instance mutations, unrelated refactors, new task/session creation, deployment,
and changes outside this package's contracts. No delegation is authorized.

## Acceptance conditions

1. A/B results use the same dense workload, include all samples and reasons for invalid runs, and report medians/ranges plus paired changes with correct units.
2. Correctness gates pass and any missed target or unexplained regression remains explicit. No M2, INP, battery, or leak claim is inferred from unrelated metrics.
3. The final report distinguishes implemented repairs, measured gains, no-change outcomes, unresolved work, and reproduction commands. All required package evidence is linked.

## Verification commands

Run the listed commands sequentially. New test files are implementation outputs;
they must exist before these commands count as verification. Use the guarded
E2E runner with fresh known artifacts. Capture RED/GREEN evidence for changed
logic and apply scoped lint to touched files.

```bash
cd apps/web
KANDEV_DENSE_PROFILE=1 pnpm e2e:run --project chromium tests/performance/dense-workbench-profile.spec.ts
pnpm e2e:run --project chromium tests/performance/dense-workbench-correctness.spec.ts tests/plugins/conversation-recovery.spec.ts tests/task/task-switch-efficiency.spec.ts tests/chat/persistent-animation-motion.spec.ts
pnpm e2e:run --project mobile-chrome tests/performance/mobile-dense-workbench-correctness.spec.ts tests/task/mobile-task-switch-efficiency.spec.ts tests/chat/mobile-persistent-animation-motion.spec.ts
pnpm run typecheck
cd ../..
python3 scripts/list-docs.py validate
python3 scripts/lint-spec-files.py --all
git diff --check
```

## Likely files

- Benchmark harness and fixture files from work order 01
- `docs/plans/dense-workbench-performance/results.md` (new after measurements)
- Raw diagnostic artifacts under `.kandev/diagnostics/dense-workbench-performance/`
- This plan, all work-order Results sections, and affected companion records

## Dependencies and parallelism

Requires `05-workbench-lifecycle`. Sequential execution only.

## Inputs

Read the requirements and designs referenced in frontmatter, the
[plan](plan.md), and the [benchmark protocol](benchmark.md). Preserve existing
companion-plan ownership and historical results described by the plan.

## Risks

A faster run with missing updates or fewer panels is not an optimization. Avoid concurrent benchmark processes, changed seeds, and profile startup in timing samples.

## Results

Pending. No implementation or performance result is claimed.

