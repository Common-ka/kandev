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

## Full-reference grid checkpoint

The corrected full-reference run finishes all 12 planned attempts: five pass
and seven fail. Only pair zero completes both arms. Its five complete samples
verify 9,000 ordered updates. The current native-wheel fix remains insufficient
under full load. The report, original failures, and host data remain intact;
summary validation rejects the series. The final matrix and regression
attribution remain open. See
[the complete failure evidence](evidence/reference-files-grid-failed.json).
The unchanged-input diagnostic update passes its Node/browser regressions and
all three callers within their stated scope; the initial combined navigation
setup failure remains retained ([evidence](evidence/failure-diagnostics.json)).

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

### Dockview timed caller validated

The new paired caller passes small core and full-plugin runs on the original
baseline and final retained assets. Both arms deliver all 60 scheduled updates
in order with no verification errors. A meaningful RED check found that an
unopened hidden tab did not have a document chat root or editor. The caller now
opens that session, waits for warmup, writes a draft, and hides it before timing.
Both builds retain the hidden chat and preserve its draft through streaming and
reveal. Loaded history and actual API panel visibility are recorded.

Plugin installation and layout setup stay outside timing. Plugin HTTP
conversation reads are separate from core WebSocket traffic. In the short
plugin rehearsal, streaming generated 20 such HTTP requests on the baseline
and zero on the candidate. This is a traffic observation, not a repeated speed
result. The 29 summary/progress tests and scoped strict lint pass. The summary
rejects mismatched panes, visible session IDs, and plugin hashes.
See [the caller evidence](evidence/dockview-timed-caller.json).
Six full-reference pairs per core/plugin series remain pending.

The first full-reference Dockview attempt stopped after 17.5 minutes of setup:
the fixture compared the task-list page length (50) with the full workspace
count (1,000). It produced no measured samples. The fixture now checks the
response's authoritative `total`; a 61-task browser check passes in 23.8 seconds
and scoped strict lint passes. Production code and assets are unchanged.
The failure, captures, and correction are preserved in
[the task-count evidence](evidence/dockview-task-total.json). The full comparison
still needs to run.

## Final Dockview core comparison (1x)

Six alternating pairs compare the original baseline with production
`f5c8fb8f6ab`. All 12 samples pass in 59.7 minutes. The disposable workspace
contains 1,000 tasks and 36,900 stored messages. Two chats are visible, a third
chat remains mounted behind a tab with a draft, and Files, Changes, and Plan
are visible. Each visible chat starts with 100 loaded messages from a
1,000-message stored history. Seven API panels and four document editors remain
present in every streaming sample.

Streaming history requests fall 96.24%, decoded history bytes fall 96.24%, and
full-history resets fall to zero in every pair. All 21,600 scheduled updates
pass exact-order durable verification. The hidden chat catches up to all 300
updates and preserves its draft in every sample. Five baseline HTTP 503
responses occur in the last streaming sample; the candidate has none. The
backend log records a persistence table-probe deadline. The passing content
checks do not erase these HTTP failures.

Streaming renderer CPU falls 11.43% and main-thread CPU falls 9.35% by median
paired change. Both improve in five pairs and regress in the last. Main-thread
task time falls 6.90%, below the 20% target. Reduced-motion idle main-thread CPU
falls 80.96% in every pair. Normal-idle main-thread CPU falls 10.70% by median
paired change, with a 16.32% regression in the last pair.

Streaming frame-gap p95 improves in four pairs, is equal in one, and increases
from 50 to 83.4 ms in the last pair. That result exceeds the baseline range of
33.4 to 50 ms. Candidate long-task counts are zero in the first four streaming
samples, then seven and 48; the corresponding baseline counts are two and
eight. These regressions remain open. Shared-host load rose late, but the
observed correlation does not establish a cause. Panel/editor counts remain
stable and candidate style time is lower in all streaming pairs. A separate
attribution run is required before claiming a cause or a uniform frame gain.

[Complete evidence](evidence/final-dockview-core-six-pair-1x.json) preserves all
pairs, errors, build and harness identities, loaded-history checks, and host
observations. Setup is outside timing. No cold-entry, MacBook Air M2, field INP,
battery, or leak claim follows. The full-plugin series remains separate and
pending.

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

## Final Dockview plugin comparison (1x)

Six alternating pairs compare the original baseline with production
`f5c8fb8f6ab`, using the same complete E2E plugin archive. All 12 samples pass
in about one hour. The workspace contains 1,000 tasks and 36,900 stored messages;
nine API panels, six visible panes, and four document editors remain present.
All 21,600 scheduled updates pass ordered durable verification. Every retained
hidden chat catches up to 300 ticks and preserves its draft.

Core streaming history requests fall 95.58% and decoded history bytes fall
95.57% by median paired change, with improvements in every pair. Full-history
resets fall to zero. Plugin conversation HTTP requests during streaming fall
from 364–596 per baseline sample to zero in every candidate sample. Initial
plugin loading and scheduled core backfill remain separate from these counts.

Streaming renderer CPU falls 12.62% and main-thread CPU falls 8.29% by median
paired change. Each improves in five pairs and regresses in one. Main-thread
task time falls 5.94%, below the 20% target. Frame-gap p95 improves in five pairs
and is effectively equal in one, with a 49.70% median paired reduction. Maximum
frame gap still regresses in one pair, from 116.7 to 150 ms.

Idle results are mixed. Normal-idle main-thread CPU falls 4.16% by median paired
change, but rises 21.21% and 27.22% in two pairs. Reduced-motion idle main-thread
CPU falls 12.35%, with two roughly 7% regressions. Its maximum frame gaps worsen
in five pairs, despite mostly neutral or better p95 values. Four animations
remain running in every candidate reduced-motion sample; the core-only build
had zero. Their source and CPU contribution still need attribution. The full
plugin adds a hidden review pane as well as its visible conversation pane.

The baseline records 260 HTTP 409 conversation consistency conflicts and 797
HTTP 503 availability failures. Its final content checks pass after seven
post-window verification retries in two samples. The candidate records no HTTP
errors or verification retries. Backend logs show baseline persistence
`table_probe` deadlines. All affected samples remain included. A passing content
check does not erase these availability failures, and 409 conflicts are counted
separately from 503 failures.

[Complete evidence](evidence/final-dockview-plugin-six-pair-1x.json) preserves
all pairs, HTTP failures, retries, plugin request counts, build identities,
and host observations. Shared-host load rose as high as 14.89; this does not
establish the cause of any regression. No cold-entry, M2 Air, INP, battery, or
leak claim follows. The core and full-plugin results remain separate.

## Dockview attribution harness validated

The optional profiler passes a meaningful browser RED/GREEN, nine summary tests,
strict lint, and the unchanged default caller on both frozen builds. All three
windows produce validated profiles; profiled reports are excluded from speed
comparisons. Candidate reduced-motion diagnostics identify four shared host
Spinner instances on plugin composer buttons. The repair and its CPU effect
remain pending. See [evidence](evidence/dockview-cpu-attribution-harness.json).

## Shared Spinner reduced-motion comparison

The isolated follow-up compares the previous candidate with one shared CSS
motion rule. All six alternating pairs pass, with 21,600 ordered updates,
retained hidden drafts, four editors, nine API panels, and no HTTP failures.
Reduced-motion main CPU falls 79.82% and renderer CPU falls 69.65%, with lower
CPU in every pair. Four running rotations become zero. Normal CPU is mixed,
including a 40.17% first-pair main-CPU regression; p95 frame gaps are neutral
by median paired change, while several maximum gaps worsen. These results
remain included. See [complete evidence](evidence/plugin-spinner-motion-six-pair-1x.json).
Native application visibility checks and the remaining package matrix are
separate gates. No original-baseline or M2 result is inferred from this series.

## Native visibility correctness verified

The missing visibility events came from Playwright's default focus emulation.
The new correctness-only helper uses an owned external Chromium default context
with `noDefaults: true`; both headed and headless capability probes emit real
events. Core and plugin application cases now pass with unchanged document
identity, twelve ordered updates each, retained draft and scroll, paused owned
motion, foreground refresh, and plugin expansion state. Initial timeouts and
the collapsed-row assertion failure are preserved, without labeling them product
regressions. See [evidence](evidence/native-document-visibility.json). Paired timing
configuration is unchanged; the final combined correctness gate remains open.

## Final scripted grid attempt stopped

The full reference run against the final retained candidate stops in control
pair 4 after 50.8 minutes. The preceding four pairs pass 14,400 ordered updates.
The control's return-bottom action remains 423 px from the bottom at the
unchanged five-second assertion. All completed pairs also show worse candidate
streaming frame-gap p95. The raw report retains the failure and the summary
rejects it. See [evidence](evidence/final-scripted-grid-failed-attempt.json).
A separate quiet CPU attribution run is preparing the same dense workload.
The six-pair final grid gate and the interaction failure remain open.

## Current grid CPU attribution

The full-reference quiet profiling run passes both arms with all 1,800 ordered
updates per arm. The current profile samples about 4.24 seconds in synchronous
selection checks, mainly during content updates, and substantial React rendering
and context propagation. Profiles cover the measured windows, with no sampled
ARIA inspection functions. This separate attribution run is excluded from speed
summaries. It does not resolve the scripted return-bottom failure.

The separate stream-quiet cleanup experiment passes correctness but is rejected
after two full-reference pairs. All 7,200 ordered updates pass with no HTTP
failures or verification retries. Streaming CPU is essentially unchanged, with
mixed frame results. The two source/test changes were removed and retained
assets remain `9f2b7a96`. See [the attribution evidence](evidence/current-grid-render-cpu-attribution.json)
and [the rejected experiment](evidence/rejected-stream-quiet-cleanup-1x.json).

## Context stability experiment disposition

The recovery/editor context candidate passes 113 unit and twenty desktop/phone
browser checks and removes the targeted live context updates. Its uninstrumented
comparison is interrupted after one complete pair. Streaming CPU and p95 are
essentially unchanged in that pair. Both production changes and both tests are
removed; retained assets remain `9f2b7a96`. All fourteen identified surviving
disposable processes are stopped. The raw attempt remains incomplete. See
[attribution](evidence/context-stability-attribution.json) and
[interrupted comparison](evidence/interrupted-context-stability-1x.json).

The next work is the remaining final matrix, starting with the full-reference
columns comparison. No further optimization prototype is pending.

## Final columns attempt stopped

The full 1,000-task, 30-column, 36,000-message scripted run stops after 21.7
minutes in the first control stream. Its return-bottom wheel action is 507 px
from the bottom at the unchanged five-second assertion; the last checkpoint
records 549 px. This repeats the earlier grid control failure. No complete
sample or pair, candidate timing, ordered-content success, or offscreen/deck
verification is credited. The raw failure remains intact and the summary
rejects it. See [evidence](evidence/final-scripted-columns-failed-attempt.json).
The retained-build combined desktop suite is running. A focused scroll
reproduction is needed before another dense scripted timing attempt.

## Final targeted correctness passed

All 33 desktop checks pass in 7.8 minutes and all 17 phone checks pass in
4.7 minutes on the retained `9f2b...` build. The sequential guarded suites
cover recovery, canonical delivery, native hide/restore, drafts/navigation,
layouts/owner release, hidden Changes state, editor loading, and motion/input
behavior. Selected desktop and phone captures were inspected. See
[complete evidence](evidence/final-targeted-correctness.json). Dense timing,
scroll diagnosis, 4x stress, and dense retention remain open.

## Focused scroll-input attribution

The one-off diagnostic passes both builds with 1,000 tasks, 30 columns, and
120 primary messages. Both wheel sequences pass, so the full-reference failure
is not reproduced. All observed wheel events are trusted and target the transcript;
3,600 ordered updates and final bottom position pass. The candidate button check
runs after its stream finishes, which limits live-follow evidence. Source, all
events, late actions, and the limits are retained in
[the evidence](evidence/scroll-follow-attribution.json). No speed claim follows.
A separately versioned explicit-follow script remains to be validated.

## All planned attempts remain observable

The first failure no longer prevents the other version or later pairs from
running. The shared runner saves every outcome, preserves the first error while
later samples run, and fails the final test after any sample failure. Evidence
write failures abort immediately. The summary independently rejects unfinished
or failed attempt plans. All original wheel actions and thresholds remain.
[Evidence](evidence/dense-attempt-continuation.json) includes controlled faults,
three healthy callers, 47 Node checks, and strict lint. The scripted candidate
21px failure remains preserved and has separate repair evidence.


### Native wheel follow after streamed growth

A downward wheel can reach the bottom observed at input, then arrive above a
new bottom after streamed content grows. The existing scroll owner now records
that reachable edge during its existing input window and resumes following when
the native scroll reaches it. Partial, reversed, expired, hidden, disabled, and
explicit reader positions remain covered. Motion and visual styling are unchanged.

The new build passes 228 related unit checks and all 50 targeted browser checks
(33 desktop and 17 phone). The original scripted one-column candidate returns
to zero pixels from the bottom; its frozen baseline fails at 21 pixels. The
eight-column rehearsal passes both arms. These short checks establish correctness,
not a speed gain. Full dense comparisons remain open. See
[the build and check evidence](evidence/native-wheel-bottom-follow.json).


### Verified Threads reference file state

A read-only audit exposes a fixture omission: six prepared Threads repositories
each contain only the default tracked file. The six-pair attempt is deliberately
interrupted after its first completed pair; raw data and ten pending attempts
remain retained, and summary validation rejects it
([gap evidence](evidence/threads-reference-file-gap.json)).

The shared file helper now seeds 630 profile files and 73 changes in each
prepared Threads producer environment. The fixture records actual task count
and verifies file content hashes before and after each sample, outside timing.
The new `threads-files-v1` summary contract rejects missing or changed witnesses
while preserving historical report reads. The real RED/GREEN regression,
53 Node checks, strict lint, and final default-grid, scripted eight-column,
and full-plugin Dockview callers pass
([fixture evidence](evidence/threads-reference-file-fixture.json)).

Production assets, original wheel actions, history density, update schedule,
and correctness bounds remain unchanged. These checks verify the harness. The
full final reference, stress, all-history, and ownership matrix remains open.

## Corrected reference columns remain incomplete

All twelve attempts execute on the final `820fcd57` assets with the corrected
reference file state. Ten pass, verifying 18,000 ordered updates; the final
control fails native return-bottom and the final candidate fails column
traversal after its three windows. Five complete pairs do not pass summary
validation. The two failures and the earlier premeasurement gate timeout are
retained separately. Runtime identities still match their frozen manifests.
See [column evidence](evidence/reference-files-columns-failed.json) and
[gate evidence](evidence/columns-start-gate-timeout.json). Attribution, the full
remaining matrix, and completion gates stay open.
