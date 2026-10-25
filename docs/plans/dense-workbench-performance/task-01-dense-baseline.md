---
id: "01-dense-baseline"
title: "Dense fixture and baseline"
status: in_progress
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

## Dense Dockview fixture validation

The fixture now prepares real siblings in one environment and gives both visible
chats the full selected-history count. It verifies the workspace task count,
per-session seeded counts/hashes, 630 files, 73 changes, and six selected canonical
producers. Core layout checks pass with five visible panes and seven actual
panel objects. The full E2E plugin variant passes on candidate and original
baseline with six visible panes and nine panels, including its hidden review
tab. Captures are preserved and the candidate views were inspected.

The initial missing-environment and short-selected-history failures are retained.
The plugin's additional review tab is recorded explicitly. Strict lint, the
existing navigation regression, and a final small default Threads comparison
on both builds pass. No production code or assets change. Full paired Dockview
idle/streaming measurement remains open. See
[complete fixture evidence](evidence/dockview-dense-fixture.json).

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

2026-10-23: A gated dense fixture now seeds exact task/session/message counts,
checks message content hashes, and records idle/streaming CDP and WS metrics.
The small smoke fixture (10 tasks, two columns, ten messages per session,
two-second windows) passed Chromium. The full pilot also passed: 1,000 tasks,
30 eligible primary sessions, 60 sibling sessions, and 36,000 messages.
Frontend type checking passed with an 8 GiB Node heap; the default 4 GiB
heap ran out of memory. The pilot artifact is stored locally at
`.kandev/diagnostics/dense-workbench-performance/baseline-memory-1792747326488.json`.
These initial runs validate the harness; they are not the final paired timing
series. The final series must exclude concurrent build and validation work.

The baseline production assets and binary were copied before product edits
into `/tmp/kandev-dense-baseline-595df36`, a detached checkout of the frozen
baseline with locked dependencies installed. The backend SHA-256 is
`1f6f55de2c497a8ee8a8ac6e019125134cd15aa4aa595076f3614ef90df21716`.

The host requires Nix Chromium library paths and clearing inherited
`KANDEV_INTERNAL_CONFIG_FILE`, `KANDEV_INTERNAL_CONFIG_HOME_FILE`, and
`KANDEV_INTERNAL_AGENTCTL_STARTUP_CONFIG` for isolated E2E runs. The first
fixture startup failed before browser measurement because it inherited the
host bind address. That attempt is excluded. Existing navigation profiling
also exposed a fixture assertion that requires every cached folder to issue
a fresh request; this must be corrected to verify visible restored state
before using its timings. No application regression is inferred from it.

The baseline was subsequently rebuilt in its frozen checkout for the real
canonical-stream reproduction. Its current backend SHA-256 is
`79862387cc00751d9462fd4f2f5b844ad7126f3e45d5e990a7c14577d31499de`.
The earlier hash above identifies the copied pilot binary, not this rebuild.
The source, lockfile, and per-asset hash manifest are recorded in
`.kandev/diagnostics/dense-workbench-performance/frozen-baseline-build.json`.

2026-10-23: The full canonical fixture is prepared and verified: 1,000 tasks,
30 primary histories of 1,000 messages, and 60 sibling histories of 100
messages (36,000 stored messages in total). Both arms restore the same SQLite
backup, whose SHA-256 is `e225377880726596e70c21ee85475b8537790f3fdf7e7e8d6f6cde89f661ff2e`.
The benchmark uses separate runtime homes as well as separate database copies,
so retained agent journals cannot contaminate the next sample. The raw manifest
is `.kandev/diagnostics/dense-workbench-performance/matched-dense-1792753924108.json`.
The timed comparison waits for owned verification jobs to finish.

### Scripted inputs and full-column traversal validated

The opt-in `scripted-scroll-v1` caller passes paired grid and eight-column
rehearsals on the original baseline and retained candidate. Both builds verify
all scheduled updates, scroll away and return to the bottom, and close/reopen
the composer. The column run visits first/middle/last/first, including a
non-producer column, and verifies session identity and visible content. The
unchanged quiet caller also passes both arms. All 32 selected summary checks
pass. These short windows validate the harness; recorded late actions prevent
an on-time or speed claim.

The first grid rehearsal failed its upward-scroll assertion. Composer
disclosure changes transcript bounds; retargeting the pointer after disclosure
passes the same assertion on both builds. The failed report and screenshot
remain preserved. Global pnpm11 then failed before the first columns launch;
the repository-pinned pnpm9.15.9 runs the guarded check successfully.

Native visibility probing found that this headless Chromium session stays
visible when another tab is selected or the window is minimized. The bounded
hidden wait times out and no visibility event fires. This is a local environment
limitation, not a passing hide/restore test. Synthetic visibility tests remain
separate. See [the harness evidence](evidence/scripted-threads-harness.json).

## Complete attempt recording

The shared comparison runner now saves every planned sample and continues after
an isolated sample failure. Failed outcomes remain recorded immediately and the
final test remains failed. Failed evidence writes abort. The summary validates
the full plan independently of the top-level error. Meaningful RED/GREEN checks,
47 Node tests, strict lint, controlled failure behavior, and the three caller
rehearsals are preserved in [evidence](evidence/dense-attempt-continuation.json).
No input, timeout, workload, or speed claim changes.
