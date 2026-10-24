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

## Retained-build navigation remeasurement

Six alternating pairs with the current retained build passed all 480 timed
switches. Switch-readiness p50/p95 were essentially neutral (0.08%/0.32% slower
across paired changes), while main-thread/renderer CPU were 2.48%/2.30% higher
and increased in five pairs. Both versions retained one editor and three panels
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
[results](results.md#final-visibility-probe-overhead). Corrected dense profiling
and final comparisons are still pending; no product gain follows from this
harness repair.

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
