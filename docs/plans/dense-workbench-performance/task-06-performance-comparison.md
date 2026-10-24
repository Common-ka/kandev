---
id: "06-performance-comparison"
title: "Matched comparison and regression evidence"
status: in_progress
wave: 6
depends_on:
  - "05-workbench-lifecycle"
plan: "plan.md"
requirements:
  - REQ-PLATFORM-POSTGRES-DOMAIN-STORE-PARITY-007
  - REQ-PLUGINS-PROMPT-HISTORY-HOST-006
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-004
  - REQ-UI-PERSISTENT-STATUS-MOTION-006
  - REQ-PLATFORM-WEB-ASSET-DELIVERY-001
acceptance_criteria:
  - AC-PLATFORM-POSTGRES-DOMAIN-STORE-PARITY-007.1
  - AC-PLATFORM-POSTGRES-DOMAIN-STORE-PARITY-007.4
  - AC-PLUGINS-PROMPT-HISTORY-HOST-006.9
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.1
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.3
  - AC-UI-PERSISTENT-STATUS-MOTION-006.1
  - AC-PLATFORM-WEB-ASSET-DELIVERY-001.1
system_design:
  - ../../specs/platform/system-design/postgres-domain-store-parity.md
  - ../../specs/plugins/system-design/conversation-source-reconciliation.md
  - ../../specs/ui/system-design/session-refresh-efficiency.md
  - ../../specs/ui/system-design/persistent-status-motion.md
  - ../../specs/platform/system-design/web-asset-delivery.md
---

# Task 06: Matched comparison and regression evidence

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

## Dockview measurement harness

Session-specific stream targeting now passes its two-chat browser regression,
with a real shared environment, retained hidden tab, ordered updates, and draft.
The Threads-only lookup fails first; the new optional surface passes without
changing the default Threads behavior or deadline. Three progress tests, strict
lint, and a small original-baseline/final Threads comparison pass. Full dense
Dockview timing remains open. See [evidence](evidence/dockview-stream-targets.json).

## Final session-tab comparison (1x)

Six alternating pairs compare the original baseline with production `72085e06b49`.
All 12 runs pass in 13 minutes: 480 measured switches and 200 separate retention
switches. The workspace has 1,000 tasks; the selected task has two real sessions
in one shared environment, with 1,000 primary and 100 sibling messages. Every
measured switch verifies its expected task, session, and nonempty environment.

Renderer CPU falls in all six pairs, by a median paired 2.45%. Main-thread CPU
falls 1.63%, with one 1.09% regression. Driver p50/p95 fall 2.68%/2.13%, with
one/two regressing pairs. Browser-event p50 falls 0.97%, with three better and
three worse pairs; p95 falls 2.25%, with five better and one 2.36% worse pair.
Header, transcript, and composer reach the same sampled frame in all switches.
These are modest gains, and the 20% warm-p95 target remains unmet.

Frame-gap p95 improves about 12.45% in two pairs, is nearly equal in the others,
and has only a 0.09% median paired reduction. Its arm medians are 125.05 and
116.7 ms; their ratio is not the median paired change. Maximum frame gap is
neutral by median paired change, with two approximately 6.64% regressing pairs.

Both versions retain two session editors and three Dockview group content
containers after 100 extra switches. Post-GC used heap rises 2.18 MB on baseline
and 2.04 MB on candidate. API panel and subscription owners are not counted in
this loop; no leak conclusion follows. The separate draft regression remains
part of the correctness evidence.

[Complete evidence](evidence/final-session-tabs-six-pair-1x.json) preserves all
pairs, identities, retention, and host observations. All three required switching
scenarios now have final-build six-pair evidence at 1x. Final Threads/Dockview
streaming, visibility, 4x stress, and individual owner retention remain open.
No M2 Air, field INP, or battery claim follows.

## Final incompatible-layout comparison (1x)

Six alternating pairs on the same original baseline and final production build
pass in 24.3 minutes: 480 measured switches and 200 retention switches. The
fixture has 1,000 tasks, with 1,000 messages, 630 files, and 73 changed files per
selected task. Every measured switch verifies its task/session identity and the
expected two- or three-column arrangement. Different terminal inventories force
both versions to restore the layout; the separate correctness test covers equal
inventories with different arrangements.

Main-thread CPU falls 1.37%, renderer CPU 1.23%, style time 2.85%, and long-task
count 3.39% by median paired change. Only long-task count improves in every
pair. Driver p50/p95 fall 1.79%/1.42%, each with two regressing pairs.
Browser-event p50/p95 fall about 0.50%; p95 improves in three pairs, regresses
in two, and is equal in one. The 20% warm-p95 target remains unmet.

Frame-gap p95 is essentially unchanged by median. Pair 1 increases from 150 to
166.6 ms (11.07%), one approximately 16.6 ms frame interval. It remains within
the baseline series range of 116.7–183.3 ms; the other pairs differ by at most
0.1 ms. The cause is unconfirmed, and no frame-smoothness gain is claimed.
Maximum frame-gap arm medians are 341.7 and 341.75 ms.

Both versions retain one editor and three Dockview group content containers
after 100 extra switches. Post-GC used heap rises 18.85 MB on baseline and
18.16 MB on candidate. Individual panel and subscription owners were not
counted; this single loop does not establish a leak or bounded ownership.

[Complete evidence](evidence/final-incompatible-layout-six-pair-1x.json) preserves
all pairs, layout/readiness checks, exact build and fixture identities, retention,
and host observations. Same-environment session tabs, final Threads/Dockview
streaming, visibility, and stress remain open. No M2 Air or field INP claim follows.

## Final compatible-task comparison (1x)

Six alternating pairs compare the original frozen baseline with production
commit `72085e06b49`. All 12 runs passed in 21.1 minutes: 480 measured task
switches and 200 separate retention switches, with 1,000 workspace tasks and
1,000 messages, 630 files, and 73 changed files per selected task. The harness
uses five actual warmup switches and records trusted browser-event readiness
separately from driver timing.

Main-thread CPU falls 2.77%, renderer CPU 2.44%, style recalculation time 10.82%,
and long-task count 12.08% by median paired change. Each is lower in all six
pairs. Driver p50 falls 2.44% in all six; driver p95 falls 2.97% by median paired
change, with five improvements and one 0.06% regression. These percentages are
medians of paired changes, not ratios of the two arm medians.

Browser-event header, transcript, and composer readiness reach the same sampled
frame. Their p50 arm medians are essentially equal at 276.1 ms. Median paired
p50/p95 reductions are 0.79%/1.32%, each with one regressing pair. This does not
establish a substantial native-readiness gain. Frame-gap p95 is lower in five
pairs and effectively equal in one. Maximum frame gap is neutral by median;
one pair increases from 300 to 333.3 ms, within the baseline series range of
300 to 366.7 ms.

Both arms retain one editor and three Dockview group content containers after 100 extra switches. Post-GC
used heap rises about 3.17 MB on baseline and 3.31 MB on candidate. These single
checks do not prove or exclude a leak; subscription owner counts were not
sampled in this loop. The 20% warm-switch p95 target is not met. Session tabs,
incompatible layouts, Dockview idle/streaming, final Threads comparisons, and
stress remain separate open work. No M2 Air, battery, or field INP claim follows.

[Complete evidence](evidence/final-task-switch-six-pair-1x.json) retains every
pair, raw-report and fixture hashes, measured harness hashes, build identities,
retention observations, and host monitoring. Navigation summary metadata now
omits unrelated grid/stream defaults. All numeric comparisons are unchanged;
23 summary regressions and strict lint pass.

## Busy-header harness validation

The optional columns variant seeds extra non-producer session states through
the existing backend test API. It does not create additional live executions
or change canonical producer count. Three helper regressions and three summary
regressions failed first, then passed. All 17 selected summary tests and three
helper tests pass. Strict scoped lint passes. A duplicate legacy probe string
was extracted into a constant while checking the touched summary file.

The busy eight-column caller passed both arms in 1.1 minutes; both retained
eight icons and verified all 30 ordered updates. The candidate paused four
offscreen icons. The default one-column caller passed both arms in 30.3 seconds
and verified all five ordered updates per arm. These are harness smokes, not
CPU results. [Evidence](evidence/busy-header-harness-smokes.json) records both
workloads and build hashes. The later six-pair busy-header comparison passes all 12 samples and confirms
the normal-idle CPU gain. A separate default two-pair check is essentially
neutral for streaming. See [retained results](results.md#owned-threads-status-visibility-retained);
the remaining package matrix stays open.

## Timed navigation profile validation

The opt-in navigation CPU profile now covers the measured switch window,
including destination-file readiness, rather than only post-timing selections.
The summary rejects its `cpu-attribution` reports. The final full-caller smoke
passed both arms in 1.2 minutes (`matched-navigation-1792815118498.json`,
`timed-navigation-profile-final-smoke-logs/kandev-run.e2e.nQpZ0VbZ.log`). Each
profile contains its two-switch measured window. Strict scoped lint and all
nine selected summary tests pass. The preceding smoke also passed; two lint
complexity warnings were resolved before the final smoke. This is diagnostic
harness validation, not a product speed result.

## Retained-build navigation remeasurement

Six alternating pairs with the current retained build passed all 480 timed
switches. Switch-readiness p50/p95 were essentially neutral (0.08%/0.32% slower
across paired changes), while main-thread/renderer CPU were 2.48%/2.30% higher
and increased in five pairs. Both versions retained one editor and three Dockview group content containers
after the separate 100-switch checks. No navigation-speed or leak claim follows.
The first preparation attempt failed before timing; the unchanged retry passed.
See [results](results.md#current-retained-build-navigation-comparison) and
[paired evidence](evidence/current-navigation-1x.json). Remaining scenario and
stress work stays open.

## Final-content measurement correction

Fresh current-build profiles identify full-page Playwright ARIA snapshots after
the stream deadline. The corrected timed gate preserves visibility and timeout
semantics through boolean polling; full locator assertions run after timing.
The browser regression, 14 report tests, scoped lint, and full-caller smokes
pass. Probe-version metadata prevents pooling old and corrected series. See
[results](results.md#final-visibility-probe-overhead). Corrected dense profiling confirms zero sampled ARIA assertion stacks. The
owned-status comparisons use the corrected probe. Final original-baseline
comparisons remain pending; no product gain follows from the harness repair.

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
# Set KANDEV_DENSE_BASELINE_ROOT to the immutable baseline checkout first.
KANDEV_DENSE_COMPARE=1 pnpm e2e:run --project chromium e2e/tests/performance/dense-workbench-comparison.spec.ts
KANDEV_DENSE_NAVIGATION=1 pnpm e2e:run --project chromium e2e/tests/performance/dense-navigation-comparison.spec.ts
node --test e2e/scripts/summarize-dense-performance.test.mjs
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

The short canonical-stream transport comparison is complete; see [results.md](results.md).
Dense reference timing remains in progress. The first full grid run failed in baseline
post-stream stored-history verification with HTTP 503. No complete pair was saved;
its timings are excluded. The harness now checkpoints completed observation windows
and preserves backend logs. Verification retries only transient HTTP 503 responses,
after timing, and records each error. Runtime health thresholds are unchanged.
The dense navigation reference comparison is running separately.

### Measured availability follow-up

Repeated dense runs report `table_probe` deadlines while the single SQLite
writer is occupied. The health implementation currently reads table metadata
through the writer for each required table. Investigate using the existing
reader pool for those read-only schema checks. Preserve both initial writer
and reader pings, the two-second deadline, missing-table failure, maintenance
admission, startup strictness, and the existing unhealthy/recovery behavior.
PostgreSQL shares the same pool for readers and writers. Add a factory-created
SQLite regression with the writer held, plus missing-table and writer-failure
checks. Run the required-store and DB tests, race checks, scoped Go lint, and
fresh browser streaming checks before comparing dense availability again.
This is a bounded repair of a measured test and page disruption; it does not
permit masking health failures or extending timeouts to make a benchmark pass.


### Health repair validation

The table probe now uses the reader pool. The regression failed before the
change when a writer transaction was held, then passed with the reader probe.
The missing-table check still fails, and a blocked writer still fails its
initial ping and recovers after release. Existing contention tests now use
factory-created reader and writer connections to the same SQLite file.

Required-store and DB tests passed, required-store race checks passed, and
scoped Go lint reported zero issues. Fresh desktop canonical streaming,
conversation gap recovery, and plugin pagination checks passed (3 tests).
Fresh phone canonical streaming and task navigation checks passed (4 tests).

A matched rehearsal used 1,000 tasks, six columns, 120 primary messages per
column, and 1,800 scheduled canonical updates. Both arms verified all updates
with zero HTTP or verification errors. Streaming main-thread task time was 60,390 ms before
and 60,354 ms after; frame-gap p95 was 116.7 ms in both. This is neutral main-thread task time
evidence. Since neither arm reproduced the intermittent availability failure,
it does not establish an availability improvement rate. Raw evidence:
`.kandev/diagnostics/dense-workbench-performance/matched-dense-1792765209649.json`;
summary: `health-first-pair-summary.json` in the same directory.


### Retained-build correctness pass

The rebuilt retained version passed 20 of 21 desktop checks in
`/tmp/kandev-run.e2e.OYHUJQBr.log`: chat motion/selection, native busy motion,
saved split layouts and active-session ownership, canonical stream delivery,
core/plugin gap recovery and paging, sessionless panel cleanup, Files
restoration/retry, shared optional reads, task navigation, and grid viewport
bounds. The CSS fallback motion check failed while its slow agent turn was
still running. Its screenshot showed the busy status at four seconds of an
eight-second turn; the final assertion had started too early after a UI idle
placeholder wait.

The motion checks now await the initial session's completion, observe the same
session generating after submit, and await that session's completion before
asserting removal of the busy glow. No production code, timeout, or animation
assertion changed. Both desktop motion cases passed three repetitions (six
checks, `/tmp/kandev-run.e2e.kCANCo2j.log`, 2.1 minutes). Typecheck and scoped
lint pass. Failure artifacts remain in `final-desktop-motion-failure/` under
the diagnostic directory. The broader phone pass completed all 22 checks
(`/tmp/kandev-run.e2e.npscGzkq.log`, 4.3 minutes), including motion and text
selection, canonical delivery, managed plugin conversations, Files retry,
task-switch enrichment, short-phone required questions, A-B-A drafts, touch
controls, native session selection, and saved-view drawers.

The navigation request-count follow-up found that the roughly 22 tree reads
match one root read plus the fixture's expanded directories. The restore
loader bounds concurrency and already shares equivalent pending paths within
its owner. These counts alone do not establish redundant reads. No folder
freshness check is removed on that evidence.

### Completed six-pair grid reference

The original baseline and retained candidate `1207817a957` completed twelve
samples with the full 1,000-task, 30-column, 36,000-message fixture. Six chats
loaded 100 messages each and each streaming window scheduled 1,800 canonical
updates. Every sample passed final visible-marker and stored tick-count checks.
The candidate had no HTTP errors or verification retries. Two baseline samples
had 59 streaming HTTP 503 errors and ten post-window verification retries in
total; all samples remain included.

Median paired reductions were 77.62% for cold encoded JS/CSS bytes, 90.85% for
streaming history requests, 90.83% for decoded history bytes, and 42.93% for
reduced-motion idle main-thread task time. Normal idle was mixed and streaming main-thread task time
was neutral. Streaming frame-gap p95 regressed in every pair, with a median
paired increase of 59.93%. One candidate sample took 85.5 seconds through final
visible content and remains included. These results do not establish overall
responsiveness or a task-switch gain.

The guarded runner passed in 1.1 hours, including untimed fixture preparation:
`/tmp/kandev-run.e2e.7RtV7dhF.log`. Raw report:
`matched-dense-1792789660205.json` under the diagnostic directory. The committed
[paired results](evidence/reference-grid-1x.json) include all values, hashes,
fixture counts, and per-sample errors. [results.md](results.md) records medians,
ranges, interpretation, and the remaining work. No owned builds or tests ran
during measurement. Network isolation prevented port conflicts; CPU resources
remained shared. The 4x stress and broader timing matrix remain open.
