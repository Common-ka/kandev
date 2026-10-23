---
id: "05-workbench-lifecycle"
title: "Dockview and editor lifecycle"
status: in_progress
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

2026-10-23: The matched navigation harness now checks the actual 630-file
inventory. The previous profile seeded those files, then reset the repository
to an older commit that discarded them. The harness now passes the seeded
commit into the task setup. Warm tree readiness checks a task-specific visible
file; it no longer requires a network read for a correctly cached folder.

A small paired rehearsal passed after isolating runtime homes and starting
prepared sessions separately for each arm. Its timings are excluded from gains.
The associated CPU profiles are attribution evidence only: database checks
were running concurrently. In the candidate profile, minified `RAt` in
`index-Z2Kg8zz8.js` maps to `FileTreeNodeTouchActions`. It calls
`useTranslation`, the delete-action context hook, and a ref before returning
null for desktop rows. Its translation-hook work appears in the switch trace
although the touch controls are hidden.

A focused regression proves that hidden touch actions do not mount their
consumers, including responsive activation and deactivation. It fails before
the fix and passes after separating the visible component. The existing
visibility condition and rendered controls stay unchanged. All 38 related
unit tests pass, as do frontend type checking and the candidate production
build. Desktop and phone browser checks pass against the separate candidate
asset build: file actions remain usable, and A-B-A navigation preserves the
draft and selected file context. The browser tests verify phone target size
and absence of horizontal overflow. The first full-size matched pair passed
with 1,000 tasks and 1,000 messages per switching task. Median switch readiness
was 1,003 ms baseline and 1,010 ms candidate; p95 was 1,178 ms and 1,121 ms.
Main-thread time across 40 switches was 40,356 ms and 40,484 ms. This single pair
shows no clear speed gain. Both arms retained one editor and three panels after
100 additional switches. The six-pair comparison remains pending.

The earlier visible chat-composer construction attribution remains unresolved;
this file-tree repair does not close that separate investigation.

### Canonical streaming publication follow-up

The first dense grid pair removed reset-driven reads but increased streaming
frame-gap p95 from 83.3 to 150 ms. Inspection found that canonical upserts for
existing agent messages take the synchronous add-message path. A new regression
reproduces 600 immediate store writes for 600 upserts across two sessions.
The fix reuses the existing frame scheduler for these existing agent rows.
New rows and user-prompt upserts retain immediate ordering barriers.

The two new tests fail before the change and pass afterward. The focused
message/turn/client suite passes 72 tests; the related session-store and agent
handler suite passes 154 tests. Type checking passes. Fresh desktop browser
checks pass for canonical streaming, core gap recovery, and navigation drafts.
The plugin paging check observed all five seeded prompts where its assertion
expected four. The frozen pre-batching build reproduced that count failure in
one of three runs. The test now pages to completion and checks all five exact
IDs, including uniqueness. An initial DOM identity assertion was removed:
the fixture replaces its rendered DOM while showing its loading state, which
is not proof of a React remount. One diagnostic repeat also reached the plugin
Retry state; that occurrence is retained and is not claimed fixed. The corrected
pagination test passed three consecutive candidate runs. The new batching
change still has no measured rendering-performance claim.

The completed batching rehearsal did not establish a rendering gain: publications
fell from 1,501 to 659, but CPU was 61,370 versus 62,085 ms and frame-gap p95 was
133.4 versus 166.6 ms. The batching production change was removed. Its exact
patch and both profiles remain in the ignored diagnostics directory.

Separate CPU attribution identified status candidate scans and prompt-edge
geometry. The next candidate caches status selectors by immutable source
references and coalesces edge measurements in a cancellable animation frame.
The status test reproduces 301,000 reads before caching and 1,000 afterward for
300 unrelated publications, while checking each status source and task identity.
The geometry test fails before deferral and passes after frame coalescing and
unmount cancellation. The related transcript/status run passed 197 tests; the
broader status run passed 31 tests. Typecheck and scoped lint pass. A fresh
production build passed 12 desktop browser checks, including all last-prompt
scroll cases, live status updates, and A-B-A draft/context preservation. Four phone checks also pass, including native prompt navigation, live status,
and draft/context preservation. The new A/B measurement is running.

The status/geometry pair passed final-content verification but showed only modest
changes: streaming CPU 62,721 to 61,225 ms and frame-gap p95 149.9 to 133.4 ms.
It is exploratory and remains below the rendering target. Further tracing found
that `useInitialPlacementLatches` returned a new object on every transcript
render. It changed every historical message's navigation callback. A memoized
history-action regression reproduced 20 unnecessary renders for 20 streaming
updates. Memoizing the placement result removes them while session changes
still refresh ownership. The combined unit run passed 198 tests; the native
scroll file passed 98 tests after harness cleanup. Typecheck and scoped lint
passed. The fresh desktop browser run passed all 11 affected scroll and
navigation checks. Phone and matched timing checks are in progress.

The callback candidate passed all 11 desktop and three phone browser checks,
plus the final typecheck and scoped lint. Its paired rehearsal is retained as
overload evidence (`matched-dense-1792763973626.json`): both arms completed the
stream and final stored-content checks, but streaming HTTP failures numbered
24 in the control and 42 in the candidate, followed by nine candidate history
verification retries. Frame-gap p95 was 149.9 versus 100 ms, while main-thread
use stayed near one full core. These timings do not establish a clean gain.
The three source repairs have direct regression evidence for removed scans,
coalesced geometry reads, and stable historical actions. They preserve tested
behavior, but the dense responsiveness acceptance target remains unresolved.
