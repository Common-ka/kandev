---
id: "05-workbench-lifecycle"
title: "Dockview and editor lifecycle"
status: in_progress
wave: 5
depends_on:
  - "04-asset-delivery"
plan: "plan.md"
requirements:
  - REQ-UI-CHAT-MOTION-001
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-003
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-004
  - REQ-PLATFORM-VIEWPORT-SESSION-DELIVERY-001
acceptance_criteria:
  - AC-UI-CHAT-MOTION-001.4
  - AC-UI-SESSION-REFRESH-EFFICIENCY-003.3
  - AC-UI-SESSION-REFRESH-EFFICIENCY-003.4
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.1
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.2
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.3
  - AC-PLATFORM-VIEWPORT-SESSION-DELIVERY-001.1
system_design:
  - ../../specs/ui/system-design/chat-motion.md
  - ../../specs/ui/system-design/session-refresh-efficiency.md
  - ../../specs/platform/system-design/viewport-bounded-session-delivery.md
---

# Task 05: Dockview and editor lifecycle

The completed six-pair grid reference confirms a streaming frame-gap regression
despite reduced history traffic. A bounded CSS containment experiment tested
the existing fixed-size native transcript wrapper against the frozen retained
build. It preserved the tested desktop and phone behavior but regressed
streaming measurements, so the production change was removed. The CSS
containment specification establishes layout and paint boundaries, including
new positioning and stacking contexts; those compatibility effects require
browser checks ([W3C CSS Containment](https://www.w3.org/TR/css-contain-2/)).

The benchmark's stored-content assertion now checks the exact ordered tick
sequence, rather than only its count and final marker. The same harness checks
both versions. Earlier recorded runs retain their original validation scope.

The containment candidate passes typecheck, scoped lint, the production E2E
asset build, and 112 component tests in four files. Fresh desktop checks passed
all 28 scrolling, selection, prompt navigation, Markdown wrapping/table resizing,
and canonical stream cases (`/tmp/kandev-run.e2e.YwYwOtm7.log`, 5.5 minutes).
Two additional Threads layout cases passed (`containment-layout-logs/`, 1 minute).
All 23 phone checks passed (`containment-mobile-logs/`, 4.3 minutes), including
touch scroll state, unloaded prompts, text motion/selection, table wrapping,
canonical delivery, native Threads controls, session picking, and saved views.
The desktop and phone captures were inspected; the grid and native phone
composition remain intact. Captures and the named log directories are under
the task's diagnostic directory.

The two alternating matched pairs completed in 16.1 minutes. Both arms used the
same backend binary, 1,000 tasks, six chats with 120 seeded primary messages and
100 loaded messages each, and 1,800 updates per sample. All four samples passed
the exact ordered-update check with zero HTTP or verification errors. Normal
idle main-thread task time fell 10.89% and 6.28%; reduced-motion idle fell 11.39% and
11.73%. Streaming main-thread task time increased 3.00% and 3.37%. Frame-gap p95 was
133.3 → 133.4 ms in pair 1 and 83.4 → 150 ms in pair 2. The experiment was
removed because the idle gain came with worse streaming results.

Evidence under the diagnostic directory: `matched-dense-1792793604258.json`,
`containment-two-pair-summary.json`, `containment-two-pair-host-load.jsonl`,
`rejected-transcript-containment.patch`, and
`containment-benchmark-logs/kandev-run.e2e.qMzO7hcR.log`. The ordered-update
assertion remains as benchmark validation; no containment production code remains.

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
fell from 1,501 to 659, but main-thread task time was 61,370 versus 62,085 ms and frame-gap p95 was
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
changes: streaming main-thread task time 62,721 to 61,225 ms and frame-gap p95 149.9 to 133.4 ms.
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


### Duplicate snapshot publication

The full-size reference restart used 1,000 tasks and 36,000 messages. Its first
pair verified all 1,800 updates in both arms, with zero HTTP or verification
errors. Baseline streaming main-thread task time was 61,644 ms versus 60,332 ms in the candidate,
but frame-gap p95 increased from 83.3 to 116.7 ms. Transcript publications were
818 versus 1,719. The series was deliberately interrupted during the next
candidate sample to investigate the repeated regression. Preserve
`reference-render-interruption.json` with `matched-dense-1792767336930.json`;
only the first complete pair is included in `reference-render-first-pair-summary.json`.
This is exploratory evidence, not the planned six-pair acceptance result.

Source inspection found that all three message actions republished identical
JSON snapshots. A regression reproduced 100 transcript publications for 100
identical replays through each action. Updating existing Immer drafts directly
and retaining equal metadata references removes these publications. A second
regression alternates canonical and legacy delivery order across two sessions:
40 changed snapshots publish 40 times. Content and nested metadata changes are
still accepted even when their timestamps match. The complete session slice,
message/turn handlers, and transport-client suite passed 493 tests.
Browser correctness and the matched timing comparison remain pending.


The duplicate-snapshot experiment is rejected for this task. Its first matched
pair had neutral main-thread task time (61,010 versus 61,005 ms); publications were 1,839 versus
1,719 and frame-gap p95 was 133.3 versus 116.7 ms. Both arms verified all updates.
Inspection of `shouldSuppressCoreConversationNotification` confirms that V2
already suppresses legacy message events for canonical sessions. Thus the
hypothesized duplicate delivery does not explain this workload. The second
pair was interrupted, recorded in `idempotency-interruption.json`. The patch
and tests are retained in `rejected-idempotency.patch` but removed from the
working source. Raw: `matched-dense-1792768444864.json`.

### Markdown rendering boundary

Static Markdown returned the library's element tree directly, while animated
Markdown mounted a `ReactMarkdown` component around that tree. Starting an
append reveal and later compacting its spans changed that boundary and remounted
unchanged content. A real-renderer regression fails on the old implementation:
an unchanged code block loses its DOM identity when prose is appended.
The first repair returned both synchronous trees inside the parent render.
Its two matched pairs did not show a repeatable timing gain. Stream main-thread task time was
61,073 versus 61,944 ms in pair one and 60,267 versus 64,559 ms in pair two.
Frame-gap p95 was 116.7 versus 83.4 ms, then 116.7 versus 149.9 ms. All four
samples verified all updates without HTTP errors. Retain
`matched-dense-1792769340783.json` as an unsuccessful timing experiment.

A second regression found that the inline repair parsed an appended snapshot
twice while the parent's motion hook adjusted its state during render. Both
rendering modes now use one stable child component. Parsing occurs after the
parent's render settles. The regression confirms one parse per append, and
unchanged code blocks and paragraphs retain identity through reveal and
compaction. All 168 related Markdown tests pass, including formatting,
selection, custom renderers, math, cache bounds, and animation cleanup.
Scoped lint, typecheck, and specification validation pass. The fresh production
build passed seven desktop and six phone browser checks.

The stable-child repair completed two alternating matched pairs on 1,000 tasks,
six columns, 120 primary messages per column, and 1,800 updates per sample.
Streaming main-thread task time was 60,374 versus 61,077 ms, then 60,265 versus
60,232 ms. Frame-gap p95 was 133.3 versus 116.5 ms, then 116.7 versus 100.1 ms.
All four samples verified all updates with no stored-content verification
errors. Main-thread task time is effectively unchanged; the two frame-gap reductions are modest
exploratory evidence, below the package's 20% rendering target. The repair is
retained for proven content identity preservation without duplicate parsing.
Raw: `matched-dense-1792770884505.json`; summary:
`markdown-stable-child-two-pair-summary.json`; host load:
`markdown-stable-child-host-load.jsonl`. Remaining CPU attribution and the full
reference series remain open.


### Scoped transcript row lookup

A separate CPU attribution run (`matched-dense-1792772023381.json`, excluded
from timing comparisons) identified `findMessageRow` and its row enumeration
in the streaming path. The helper collected every matching transcript row
and then read each ID until it found the requested row. A dense regression
reproduced 1,000 unrelated ID reads for one lookup.

The first experiment used an exact attribute query for normal generated IDs
within the supplied scroll container. IDs outside the simple generated alphabet retain the old
exact-string path, including quotes and backslashes; duplicate IDs in other
panels cannot satisfy the lookup. The dense regression now records zero
unrelated ID reads. All 105 native-scroll and panel-restoration tests pass,
as do typecheck and scoped lint. The fresh production build passed 11 desktop
prompt-navigation and panel-switch checks and three phone prompt/draft checks.
Matched timing remains pending.

The first long-history attempt timed out during baseline setup before any
measurement (`matched-dense-1792773117724.json`). It is excluded from timing.
A diagnostic retry failed to bind its backend port (`matched-dense-1792773555858.json`),
so later runs use an explicit separate port offset. With setup progress
instrumentation, both versions reached all 300 seeded messages in a one-chat
probe (`matched-dense-1792773665497.json`) and in all six chats
(`matched-dense-1792773918217.json`). Their one-second windows are diagnostic
only and cannot support performance claims. The larger setup bound is now six
minutes; loaded counts, pagination state, and elapsed setup time are retained.
The 60-second timed stream and oldest-message correctness gate are unchanged.
The 1,000-message retry also failed in baseline setup before timing
(`matched-dense-1792774416275.json`). After 361 seconds, five chats had 901
loaded messages and one had 861; none had reached the oldest seeded message.
The counts advanced throughout, so this records slow long-history setup,
not a complete A/B result or a proven pagination failure. No candidate sample
ran. The limit will not be raised again for this experiment. Retain the host
load record and failed run, and continue the lookup comparison on the existing
newest-window workload. Full long-history performance remains unresolved.


The attribute-query experiment completed two matched newest-window pairs
(`matched-dense-1792775033729.json`). Stream main-thread task time was 60,999 versus 61,230 ms
and 60,389 versus 60,889 ms. Frame-gap p95 was 133.3 versus 116.7 ms, then
116.7 versus 116.6 ms. All updates verified with zero HTTP or verification
errors. This does not establish a repeatable task-time or frame-gap gain; retain
`row-lookup-attribute.patch` and `row-lookup-attribute-two-pair-summary.json`.

Inspection of Chromium 149's `SelectorQuery::ExecuteWithId` confirms a distinct
indexed ID path, including a scoped check for duplicate IDs. The second experiment
used that path for generated alphanumeric, underscore, and hyphen IDs. Other
IDs retain exact-string matching. The regression checks that the helper does
not collect all transcript rows, and covers ordinary duplicate IDs plus
selector punctuation. All 106 related unit tests pass. Fresh browser checks
and matched timing remain pending. Source reference:
https://chromium.googlesource.com/chromium/src/+/refs/tags/149.0.7827.55/third_party/blink/renderer/core/css/selector_query.cc


The indexed-ID experiment is also rejected. Its two pairs completed all
updates with zero HTTP or stored-content errors (`matched-dense-1792776438660.json`).
Stream main-thread task time was 61,162 versus 60,373 ms and 62,774 versus 61,588 ms, only
1.3–1.9% lower. Frame-gap p95 increased from 100.1 to 116.6 ms in the first
pair, then decreased from 150.0 to 133.3 ms in the reversed pair. Median frame
gaps were unchanged at 50 ms in pair one and 100 versus 66.6 ms in pair two.
This mixed result does not justify a second production lookup path. The code
and tests are restored to HEAD; retain `rejected-row-id-lookup.patch` and
`row-id-two-pair-summary.json`. The indexed version had passed 106 units,
typecheck, scoped lint, 11 fresh desktop and three phone checks before timing.
Only the harness progress diagnostics and this experiment record remain.


### File-tree identity experiment

The six-pair unthrottled navigation reference (`matched-navigation-1792778736500.json`)
completed, but candidate switch p95 regressed by a median paired 10.25%.
Both arms issue about 22 file-tree reads per switch. Source inspection found
that unchanged folder responses replace the tree and its state snapshot.
The candidate preserves unchanged node identities and skips identical snapshots,
while still applying each progressive folder response and ownership guard.

The initial regression reproduced 22 cache writes for 22 identity updates.
Unchanged-tree and sibling-identity checks also failed before implementation.
A follow-up test exposed stale optional file metadata when a symlink becomes a
regular file. The experiment now retains the original authoritative file
replacement semantics and reuses files only when every own field matches.
All 95 focused tests pass, including freshness and progressive restoration.
The first timing attempt was interrupted to fix this candidate issue after
one baseline sample. `tree-identity-first-attempt-interruption.json` records
its exclusion; no gain is inferred from that incomplete comparison.


The corrected tree-identity experiment is rejected. Both alternating pairs
regressed (`matched-navigation-1792782036354.json`): driver-to-file-marker
p50 was 974 versus 1,162 ms and 1,008 versus 1,080 ms; p95 was 1,160 versus
2,724 ms and 1,146 versus 2,974 ms. Main-thread time rose from 40,999 to
53,420 ms and from 41,324 to 50,417 ms. These are 40-switch runs with the
same 1,000-task workload; the separate 100-switch retention loop was omitted.
All 95 unit tests, typecheck, lint, six fresh desktop checks, and two phone
checks had passed. The production and test changes are restored to HEAD;
`rejected-tree-identity.patch` preserves the experiment. The increased timings
are retained, not attributed to an established cause. The summary is
`tree-identity-navigation-two-pair-summary.json`; the log is
`/tmp/kandev-run.e2e.2vm17ekT.log` (9.2 minutes).


### Synchronous selection-range experiment

The separate streaming CPU profile attributed several seconds to the text
motion selection guard. Chromium 149's `DOMSelection::isCollapsed` always calls
`UpdateStyleAndLayout`, even when a cached document range exists. The candidate
reads the current single range's `collapsed` property and retains the browser's
`isCollapsed` result for multiple ranges. Empty selections still require the
browser's `rangeCount` check; this is not a claim that every selection read is
free of layout. No asynchronous selection cache is introduced.

Source: [Chromium 149 DOMSelection](https://chromium.googlesource.com/chromium/src/+/refs/tags/149.0.7827.55/third_party/blink/renderer/core/editing/dom_selection.cc).
The three single/empty-range regression cases failed first; all 26 focused
Markdown and motion tests pass after the change. The desktop/phone shared
browser check now selects text and updates the message in the same script,
then checks selected text and static appended content. The timing harness
records selection range count and focused-element kind before each window,
outside timing, to distinguish cached-range and empty-selection workloads.
Browser checks and matched timing are pending.


The unfocused one-second diagnostic completed in both arms
(`matched-dense-1792782969406.json`, log `/tmp/kandev-run.e2e.bqmfah9R.log`).
Every window began with `rangeCount: 0` and BODY focus. These windows establish
selection state only; their timings are not performance evidence. The next
comparison uses `KANDEV_DENSE_FOCUS_COMPOSER=1`: hover and click the first
visible tile's native composer, then verify focus after every measured window.
The other five composers retain their normal auto-hide behavior. Both arms use
the same focused-composer workload, and the report records this mode explicitly.
The production candidate passed three fresh desktop and three phone checks,
including synchronous selection preservation during an append (logs
`/tmp/kandev-run.e2e.JYIqwnEC.log` and `/tmp/kandev-run.e2e.gipJzfRf.log`).


The first focused-composer timing attempt failed in the baseline before a
complete sample (`matched-dense-1792783361998.json`, log
`/tmp/kandev-run.e2e.vxW1rAdk.log`, 4.9 minutes). The first idle window confirmed
one range in the focused editable DIV. The final streaming marker did not
appear within the unchanged 30-second post-window visibility bound. The failure
screenshot shows all six tiles still mounted and near ticks 286–289 of 299.
The fixture had removed its database before inspection, so stored progress is
unknown; this is not proof of lost delivery. No candidate sample ran.
The copied browser artifacts are in `selection-focused-failure/`.

The harness now saves each fixed-window deadline before waiting for the final
marker. On a failed stream gate, it records browser and API tick counts before
cleanup. Agent-message filtering excludes the scripted user prompt; failed API
reads remain errors, never zero counts. The workload and timeout are unchanged.


The focused retry also failed in the baseline before a complete sample
(`matched-dense-1792784039112.json`, log `/tmp/kandev-run.e2e.Z9pdjVJe.log`).
The failure snapshot recorded all 300 unique ticks in storage for all six
sessions. Five visible chats showed all 300 ticks; one showed 299. These reads
occurred after the visibility timeout, so they do not establish when storage
finished. No candidate sample ran. The next attempt reverses the alternating
order with `KANDEV_DENSE_CANDIDATE_FIRST=1`, recorded in the report. The workload
and visibility bound remain unchanged.


### Focused-composer selection check: retained

The candidate uses the current single selection range's `collapsed` value
instead of `Selection.isCollapsed`. It keeps synchronous selection checks and
the browser's multiple-range behavior. Chromium 149 forces style/layout work
in `Selection.isCollapsed` even when a cached range exists. The passive-grid
diagnostic had no range, so this change is not credited with improving that
workload. The matched experiment focuses the first of six native composers in
both builds; the other five retain normal auto-hide behavior.

Two alternating pairs completed with 1,000 tasks, six chats, 120 seeded messages
per chat, and 1,800 scheduled updates per sample. Every sample verified all
stored updates and had zero HTTP or verification errors. Control/candidate
streaming main-thread work was 81,076/60,718 ms and 79,053/59,742 ms: a 24.77%
median paired reduction. Observation through the final visible update fell
from 82,115/80,934 ms to 61,817/61,341 ms (24.46% median paired reduction).
Frame-gap p95 fell from 183.3/166.6 ms to 133.4/133.4 ms (23.58%).
Normal idle work was neutral across pairs; reduced-motion idle main-thread
work increased by 3.46%. Cold-ready results were mixed. These are Linux
Chromium results with a focused composer, not M2, INP, or battery measurements.

Two earlier baseline attempts exceeded the unchanged final-marker timeout and
are retained as failures, not included in the completed-pair percentage.
The second failure snapshot showed all 300 ticks stored in each chat; five
chats displayed 300 and one displayed 299 after timeout. It does not establish
when storage finished. The completed run started with the candidate and
reversed order for the second pair; this order is recorded in the manifest.

Raw: `matched-dense-1792784736352.json`; summary:
`selection-focused-two-pair-summary.json`; host observations:
`selection-candidate-first-host-load.jsonl`, all under the diagnostic directory.
Log: `/tmp/kandev-run.e2e.CcqON1o6.log` (16.9 minutes). The frozen control is
`/tmp/kandev-dense-before-tree-identity-5936a872` (retained production code).
The selection change passed 26 focused unit checks and three fresh desktop
plus three phone checks. The browser regression selects text and appends a
message in the same script, then verifies the selected text and static tail.
The diagnostic helper has three tests for duplicate ticks, empty streams,
scripted user prompts, and failed reads; the summary helper has four tests.


### Composer subscription experiment

A healthy recovery provider published a new context object on every transcript
update. The native submit callback also depended on the entire panel state,
and the mounted input container rerendered for unchanged parent props. Three
regressions first failed: 20 unrelated updates produced 20 extra recovery
consumer renders, replaced the submit callback, and rendered the input
container 20 extra times. The candidate shallowly stabilizes the recovery
value and an explicit immutable submission snapshot, then uses React's
standard memo wrapper around the mounted input container. It preserves
changed callbacks and state; no custom prop comparator or asynchronous latest
state reference is used. Existing input ownership remains intact.

The seven-file unit set passed 72 tests, including the real-provider delayed
submission/context tests, outgoing transforms, recovery ownership, pending
recovery, callback changes, failed/loading recovery, and disable/session-owner
changes. RED/GREEN logs: `/tmp/kandev-composer-stability-red.log` and
`/tmp/kandev-composer-stability-green.log`. The new callback case moved into the
existing smaller outgoing-handler test file to keep the large input-area test
within its lint limit; the two affected files then passed 33 tests. Typecheck
and scoped lint pass. Browser checks and matched timing are pending.


Fresh browser checks passed: nine desktop checks
(`/tmp/kandev-run.e2e.z2YR8XV8.log`) and six phone checks
(`/tmp/kandev-run.e2e.yt01S40O.log`). They cover native/plugin submission,
draft retention through collapse, failure recovery and phone A-B-A navigation,
model/attachment/cancellation controls, and canonical streaming. A separate
six-test outgoing-handler run passed the added delayed-acknowledgement case:
cleanup remains attached to the submitted session after switching tasks.
Final typecheck and scoped lint pass. The next two-pair comparison uses the
normal unfocused grid against `/tmp/kandev-dense-before-composer-5936a872`,
which includes the retained selection improvement. It isolates the composer
experiment from that earlier change.


### Composer subscription experiment: rejected

The three targeted render/callback regressions and browser correctness checks
passed, but the browser timing gain did not repeat. With the same 1,000 tasks,
six chats, 120 seeded messages per chat, and 1,800 verified updates, streaming
main-thread work was 62,169 to 60,294 ms in pair 1 and 62,168 to 63,570 ms in
pair 2. Frame-gap p95 was 150.0 to 133.4 ms, then 133.4 to 150.1 ms. Normal
idle work increased in both pairs: 17,073 to 17,676 ms and 15,619 to 23,575 ms.
The second candidate idle window also increased frame-gap p95 to 33.3 ms.
All four samples had zero HTTP and stored-content verification errors.
The increased timings have no established cause; they are not dismissed as
host variation. This experiment is removed from production and test files.

Raw: `matched-dense-1792786343231.json`; summary:
`composer-stability-two-pair-summary.json`; host observations:
`composer-stability-host-load.jsonl`; rejected source/tests:
`rejected-composer-stability.patch`, all in the diagnostic directory.
Log: `/tmp/kandev-run.e2e.4mOH5oEZ.log` (16.4 minutes). The frozen retained
control is `/tmp/kandev-dense-before-composer-5936a872`. Its selection fix
remains in the branch. The candidate's passing unit and browser checks are
recorded above as experiment evidence, not evidence of a retained speed gain.
