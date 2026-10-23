# Dense workbench performance results

Status: the six-pair unthrottled grid comparison is complete. Rendering follow-up
and the remaining stress/scenario matrix are in progress. The branch is
`feature/evaluate-live-thread-bc0`; the frozen baseline is
`595df36ed5c1cf02fd90cb972b623ad6edc53df8`.

## Measurement correction

Earlier reports called CDP `TaskDuration` CPU time. With the default `timeTicks`
clock, it measures elapsed time spent in main-thread tasks. The task-time values
below are unchanged; their labels are corrected. `mainThreadMs` and
`mainThreadMsPerSecond` retain their existing JSON names with this definition.
The raw reports also captured `ThreadTime` and `ProcessTime`. The summary now
reports these separately as `mainThreadCpuMs` and `rendererCpuMs`. Renderer CPU
excludes separate browser, GPU, and backend processes. These definitions follow
the [Chromium 149 implementation](https://chromium.googlesource.com/chromium/src/+/refs/tags/149.0.7827.55/third_party/blink/renderer/core/inspector/inspector_performance_agent.cc).

For the six-pair original-baseline grid comparison, median paired main-thread
CPU reductions were 0.54% at normal idle, 2.88% during streaming, and 41.93%
at reduced-motion idle. Renderer CPU reductions were 3.00%, 1.28%, and 33.77%,
respectively. These small normal-motion changes do not resolve the measured
frame-gap regression. Both committed evidence files now include the CPU
counters, with every previous paired value and its provenance preserved.

## Completed grid reference: six alternating pairs

Candidate `1207817a957afab0e25aaee5b794c5c3e54ec5b2` completed all twelve
samples against the original baseline, with no source patch or untracked source
files. Both versions used the same immutable database snapshot: 1,000 tasks,
30 eligible columns, three sessions per column, and 36,000 stored messages.
Each sample displayed six chats with 100 loaded messages each and scheduled
1,800 canonical updates. All samples passed the final visible-marker and stored
tick-count checks. These are Linux Chromium results, not M2 Air measurements.

The table gives per-arm medians and ranges. Percentage changes are the median
of the six paired changes, not the percentage difference between the medians.

| Metric | Baseline median (range) | Candidate median (range) | Median paired result |
| --- | --- | --- | --- |
| Cold JS/CSS encoded bytes | 18,607,703 (constant) | 4,164,838 (constant) | 77.62% lower |
| Cold chat readiness, ms | 18,203 (15,589–24,408) | 16,432 (14,290–26,650) | 7.31% lower; mixed |
| Streaming history requests | 792 (652–826) | 72.5 (72–76) | 90.85% fewer |
| Streaming decoded history bytes | 145,658,902 (119,682,683–151,882,268) | 13,355,280 (12,374,478–14,005,129) | 90.83% lower |
| Normal idle main-thread task time, ms | 15,543 (15,290–18,466) | 15,497 (14,844–16,436) | 0.58% lower; mixed |
| Streaming main-thread task time, ms | 61,989 (61,551–63,699) | 61,900 (60,295–84,271) | 0.05% higher; no gain |
| Streaming frame-gap p95, ms | 83.4 (83.3–100.1) | 141.7 (116.7–183.3) | 59.93% higher; regression |
| Reduced-motion idle main-thread task time, ms | 15,885 (14,592–17,299) | 8,747 (7,780–9,917) | 42.93% lower |

The candidate had zero reset notifications during every streaming window;
baseline had 1,572–1,738 per window. Baseline streaming had 59 HTTP 503 errors
across two samples and ten post-window verification retries. Candidate had
zero HTTP errors and zero verification retries in all scenarios. All six pairs,
including the affected baseline samples and the candidate's 85.5-second
stream-to-final-content sample, remain in the results.

Rendering remains unresolved. Frame-gap p95 regressed in every pair, including
the four pairs without HTTP errors. Streaming main-thread task time per second increased
from about 954 to 986 ms per second. Long-task duration was lower in five pairs
but much higher in the slower candidate sample. The candidate applied more
incremental store updates; that observation does not establish the cause of
the regression. No overall responsiveness or warm-switch gain is claimed.

The host used an Intel i7-11700T, 16 logical CPUs, about 32 GiB RAM, Linux
6.18.49, and Chromium 149.0.7827.55. One measured browser ran at a time, with
production assets and no concurrent owned builds or tests. Network namespaces
isolated ports; CPU resources remained shared. The run passed in 1.1 hours,
including fixture setup, which is outside the timed windows.

[Machine-readable results and provenance](evidence/reference-grid-1x.json)
include every paired value, build hashes, fixture identity, and error counts.
Raw artifacts are retained under
`.kandev/diagnostics/dense-workbench-performance/`: `matched-dense-1792789660205.json`,
its backend log, `reference-six-pair-grid-1x-summary.json`, and
`reference-six-pair-grid-1x-host-load.jsonl`. Runner log:
`/tmp/kandev-run.e2e.7RtV7dhF.log`.

## Four-times slowdown: setup failure

The first full-density 4x attempt (`matched-dense-1792798953962.json`) failed
before any timed sample completed. The original baseline did not display one
required warmup message within 60 seconds. Its screenshot shows two of six
conversations unavailable; the other four displayed warmup content. The
screenshot timestamp is 2026-10-23 23:44:13 UTC. A backend table-probe deadline
was logged at 23:44:39 UTC, after that screenshot. That later failure does not
establish the cause of the cold-load errors. The run took 21.2 minutes, including
about 18.8 minutes of fixture setup. It produced no paired performance result.

The failure screenshot and context are retained in `reference-grid-4x-failure/`;
the raw report, backend log, launch receipt, and host-load log remain in the
same diagnostic directory as the completed reference. Both builds and the
36,000-message fixture retain recorded hashes. The harness now captures cold-failure browser state, loaded message counts,
history error details, and traffic before teardown. Two diagnostic unit tests
and direct Chromium checks passed, including details in a closed disclosure
and a closed-page diagnostic failure. The existing warmup and final-stream
correctness gates remain unchanged. The next run starts with the candidate.

## Kept Threads reduced-motion correction

The Threads working-status SVGs now stop rotating when reduced motion is
requested. Their existing normal-motion path, size, color, and label remain
unchanged. Initial and runtime preference changes and task settlement passed
fresh desktop and phone browser tests; typecheck and scoped lint passed.

Two alternating pairs against the retained candidate used 1,000 tasks, six
visible chats, 120 seeded primary messages per chat, and 1,800 ordered updates
per sample. Reduced-motion idle main-thread task time fell from 8,968 to 5,271 ms and
from 9,245 to 5,986 ms: 41.2% and 35.3% lower, with a 38.2% median paired
reduction. Running animations fell from six to zero. All four samples passed
ordered-update verification with no HTTP or verification errors.

The separate CPU counters support the reduced-motion result: main-thread CPU
fell 40.17% and 34.48% (37.33% median paired reduction), and renderer CPU fell
40.36% and 35.74% (38.05% median paired reduction). Normal-idle renderer CPU was
essentially neutral (0.25% median paired reduction); streaming CPU was mixed.

Normal idle main-thread task time was 4.8% and 1.3% lower in this round. Streaming main-thread task time was 8.3%
higher in one pair and 4.1% lower in the other. No normal-idle or streaming
speed gain is claimed for this reduced-motion-only change. These two pairs
compare with the retained candidate, not the original baseline or an M2 Air.
See [all paired metrics and provenance](evidence/threads-reduced-motion-1x.json)
and [work order 03](task-03-motion-eligibility.md#narrow-reduced-motion-candidate).

## Rejected Threads spinner wrapper

Attribution identified the six remaining reduced-motion animations as Threads
working-status SVGs. A shared `CompositorSpin` migration passed four desktop
and nine phone checks, but two alternating dense pairs showed 12.0% and 3.1%
more normal-idle main-thread task time. Reduced-motion idle improved by 24.8% and
21.3%; streaming task time improved by 2.0% and 4.3%, with essentially unchanged
frame-gap p95. All four samples verified 1,800 ordered updates without HTTP or
verification errors. The wrapper was removed. The narrower reduced-motion CSS
correction above was retained after its separate comparison.

Raw report: `matched-dense-1792795466229.json`. See
[work order 03](task-03-motion-eligibility.md#threads-header-follow-up) for
attribution, hashes, checks, and the rejected patch.

## Rejected containment follow-up

The later CSS containment experiment was rejected and removed. In two matched
pairs against the retained build, normal idle work fell 6.28–10.89% and
reduced-motion idle work fell 11.39–11.73%, but streaming main-thread task time
increased 3.00–3.37%. Streaming frame-gap p95 was unchanged in one pair and rose
from 83.4 to 150 ms in the other. All four samples verified the exact ordered
1,800-update sequence with zero errors. Desktop and phone correctness passed,
but those checks do not justify a performance tradeoff. Raw evidence:
`matched-dense-1792793604258.json`; paired summary:
`containment-two-pair-summary.json`. Both are in the diagnostic directory.

## Implemented and pushed

| Commit        | Change                                                       | User-visible effect                                                             |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `de1c61bfa5b` | Preserve conversation receipts through JSON transport        | Fewer unnecessary history resets when the receipt is complete                   |
| `e7180040058` | Respect reduced motion in persistent indicators              | The same status remains visible; animation stops when reduced motion is enabled |
| `4fbc42edcfa` | Precompress assets and defer Monaco imports                  | Smaller cold downloads; editor resources load on first use                      |
| `7196cdf7d95` | Carry committed canonical stream receipts into notifications | Streamed content can update incrementally without reset-and-reload              |
| `51272eb39d5` | Defer hidden file-tree touch action hooks | Controls and actions stay unchanged; hidden hooks no longer mount |
| `4544d15b977` | Cache status scans, coalesce edge geometry, and stabilize history actions | Removes repeated work while preserving scroll controls and session ownership |
| `bf3b89bf22e` | Read required table metadata through the existing reader pool | Preserves health checks while avoiding a demonstrated writer-queue dependency |
| `12bf1c266f3` | Preserve the Markdown element-tree boundary | Keeps unchanged paragraphs and code blocks mounted during text motion |
| `36695134b36` | Read the live selection range without a second layout flush | Preserves synchronous text-selection behavior; improves the measured focused-composer workload |

Default layout, colors, spacing, and controls are preserved. The file-tree change mounts touch-action hooks only while touch actions are visible. It preserves desktop context menus and native phone actions.

## Completed measurements

A short real canonical-stream comparison delivered 20 updates in each arm and verified final content. It is a transport regression experiment, not the full dense CPU benchmark.

| Observation                            | Baseline | Candidate |
| -------------------------------------- | -------: | --------: |
| Conversation notifications             |       21 |        21 |
| Reset notifications                    |       20 |         0 |
| History requests                       |       23 |         1 |
| Decoded history traffic, bytes         |  249,518 |    10,754 |
| Decoded total WebSocket traffic, bytes |  277,234 |    83,264 |

Artifacts: `.kandev/diagnostics/dense-workbench-performance/baseline-canonical-stream-1792748856792.json` and `canonical-stream-1792749213198.json`. The remaining history read is not removed. Read reasons were not instrumented, so these counts do not establish a precise classification of every read.

The build produced 552 gzip siblings. Their combined original size was 62,080,399 bytes; compressed size was 15,810,996 bytes. All decompressed bytes matched the originals. These are build totals, not page transfer measurements. Browser checks confirmed that desktop task entry did not request Monaco before opening an editor. Phone code views retained their native viewer.

## Dense runs and exclusions

The reference fixture contains 1,000 tasks, 30 eligible Threads columns, and 36,000 stored messages. Grid timing uses six visible conversations. The workload streams 1,800 scheduled updates over 60 seconds. Storage counts do not imply that all history is mounted: a separate long-history mode loads the oldest seeded message before timing.

The first full reference attempt, `matched-dense-1792753924108.json`, failed during baseline stored-history verification with HTTP 503 `persistence_unavailable`. Its backend log reported a required-table probe deadline and a waiting writer queue. All final visible stream markers had passed before verification failed. No complete sample or pair was saved, so this attempt supplies no timing comparison. Subsequent harness changes save cold and per-window checkpoints and retain the backend process log on failure. Transient HTTP 503 errors during post-measurement verification are recorded and retried for at most 60 seconds; they are not removed from the evidence.

Earlier small harness rehearsals used reduced workloads or overlapped database checks. They establish harness behavior only. Their timings are excluded from performance conclusions. The first rehearsal that reused a runtime home between arms failed with a delivery-history gap; subsequent arms use separate homes and identical database snapshots.

The task-navigation reference workload has 1,000 tasks, two switching tasks, 630 seeded files per worktree, and 73 changed files (72 modified files plus the task-specific marker). It measures 40 alternating switches after five warm-up switches. Retention checks run separately after timing.

The first full-size navigation pair passed (`matched-navigation-1792756856181.json`). It is an exploratory pair, not the six-pair reference series. Across 40 switches, median driver-to-DOM readiness was 1,003 ms baseline and 1,010 ms candidate; p95 was 1,178 ms and 1,121 ms. Main-thread time was 40,356 ms and 40,484 ms. These results do not establish a task-switch speed gain. Both arms retained one mounted editor and three mounted panels after the separate 100-switch check. The complete profile and per-switch samples remain in the raw artifacts.

The restarted grid run (`matched-dense-1792758363053.json`) completed one full
pair without HTTP verification errors. Both arms loaded 100 messages per visible
chat and verified every scheduled stream tick. Encoded JS/CSS bytes fell from
18,607,703 to 4,164,645. Streaming history requests fell from 834 to 78; decoded
history bytes fell from 152,760,977 to 14,011,779. Reset notifications fell from
1,730 to zero. Normal idle main-thread task time was essentially unchanged. Reduced-motion idle
main-thread task time fell from 17,130 to 10,226 ms over 60 seconds.

Streaming rendering did not improve: main-thread task time was 62,845 ms baseline
and 64,003 ms candidate; frame-gap p95 increased from 83.3 to 150 ms. A partial
candidate repeat also showed a high p95 (133.4 ms). Cold readiness was 16,125 ms
and 16,840 ms; smaller downloads did not produce a readiness gain on this local
host. The remaining repetitions were deliberately interrupted to investigate
the rendering regression. `grid-retry-interruption.json` records the interruption;
`grid-first-pair-summary.json` retains the completed pair. The partial next sample
is excluded from paired comparisons. These are exploratory results.

Source inspection found that canonical upserts are projected through the
`session.message.added` action, including updates to an existing agent row.
That path bypassed the frame scheduler. A regression test reproduced 600
immediate store writes for 600 upserts. An experiment scheduled existing agent
rows while keeping new rows and user prompts immediate. Although 226 focused
tests passed, the timed comparison regressed. The experiment was removed;
see "Batching mechanism rehearsal" below.

### Completed navigation reference series

The unthrottled six-pair series completed on candidate `39c0b5de256` against the
original frozen baseline. `matched-navigation-1792778736500.json` contains all
12 samples; `navigation-isolated-six-pair-1x-summary.json` contains paired results.
Median paired changes were **7.54% slower switch p50, 10.25% slower switch p95,
and 9.17% more main-thread task time**. This series establishes no switching gain.
Both versions retained one editor and three Dockview panels after the separate
100-switch check. Both issued about 22 file-tree reads per switch.

The preceding attempt stopped after one pair because backend restart could not
bind port 18107. Its partial results remain in `matched-navigation-1792777809096.json`
and are excluded from the completed series. Subsequent runs use a separate
Linux user/network namespace with loopback enabled to isolate fixture ports.
CPU resources remain shared; network isolation does not remove host-load variation.

## Correctness and remaining work

Completed checks include receipt transport and transaction tests, SQLite/PostgreSQL receipt parity, desktop and phone canonical streaming, plugin recovery, reduced-motion checks, compression negotiation and decompression, lazy editor loading, and desktop/phone draft plus file-context preservation. See the individual work-order Results sections for exact commands and logs.

The SQLite suite was completed as a composite audit: 1,617 registered top-level tests passed and 318 were explicitly skipped. One pre-existing cancellation fixture started its timeout before schema setup and failed under load. Moving the timeout after setup matched its companion fixture; three focused reruns passed. The interrupted original run and the original failed batch are retained as such. Coverage and outcomes are recorded in `sqlite-suite-complete.json`.

The six-pair grid series and retained-build desktop/phone correctness pass are
complete. The latter includes 22 phone checks, desktop navigation/layout and
recovery checks, repeated causal motion checks, and list viewport checks; see
[work order 06](task-06-performance-comparison.md). Still pending: 4x stress,
rendering-regression follow-up, and the broader list/split/hidden-tab/layout
timing matrix from [benchmark.md](benchmark.md). The long-history baseline did
not finish loading within its setup limit, so it supplies no timing comparison.
The focused-composer selection gain below is a separate two-pair comparison,
not evidence that all composer or task-switch costs are resolved.

## Reproduction commands

Use two checkouts on the same machine. Keep the baseline at the recorded SHA.
Install locked dependencies from each checkout's `apps/` directory. In each
checkout, build the guarded E2E artifacts before timing; listing the existing
navigation profile test builds without running a measurement:

```bash
pnpm --dir apps install --frozen-lockfile
pnpm --dir apps/web e2e:run --host --project chromium e2e/tests/task/task-navigation-profile.spec.ts --list
```

From the candidate checkout, point `KANDEV_DENSE_BASELINE_ROOT` to the absolute
baseline checkout path. Run these commands sequentially. They default to six
alternating pairs at 1x and 4x browser CPU settings, with disposable databases
and separate runtime homes. Do not run other owned builds or tests during them.

```bash
KANDEV_DENSE_COMPARE=1 pnpm --dir apps/web e2e:run --host --no-build --project chromium e2e/tests/performance/dense-workbench-comparison.spec.ts
KANDEV_DENSE_NAVIGATION=1 pnpm --dir apps/web e2e:run --host --no-build --project chromium e2e/tests/performance/dense-navigation-comparison.spec.ts
```

A separate long-history grid run uses `KANDEV_DENSE_HISTORY=all` with the first
command. Small rehearsal overrides (`KANDEV_DENSE_TASKS`, `KANDEV_DENSE_MESSAGES`,
`KANDEV_DENSE_WINDOW_MS`, or navigation equivalents) change the workload and must
not be presented as reference results. The local Nix host also needs the
recorded Chromium library wrapper; this is host setup, not a product change.

Summarize a completed raw report with:

```bash
node apps/web/e2e/scripts/summarize-dense-performance.mjs INPUT.json OUTPUT.json
```

The summarizer rejects errors and incomplete pairs. Keep failed raw reports and
their backend logs alongside successful reports. Direct MacBook testing must
build both revisions on that Mac; the recorded Linux executables cannot supply
an M2 comparison.

### Plugin verification correction

The old plugin-recovery test assumed that one pagination click always produced
four rows. The frozen pre-batching build reproduced a five-row result in one
of three runs. Recovery can retain a live row before the page completes, so the
fixed test checks complete pagination and all five exact seeded IDs without
duplicates. Three candidate repeats passed. Diagnostic runs also exposed a
race in the test's button-presence check; the check is now atomic. A temporary
DOM-node identity assertion was removed because the plugin renders a different
DOM state while loading. One diagnostic repeat reached the Retry UI; this is
retained as an intermittent observation and is not claimed fixed by batching.

## Artifact provenance

Grid comparisons use the frozen core repair build. Its tracked patch and untracked
source contents are retained in `matched-dense-1792753924108.json`, based on
`4fbc42edcfadd93cff35181067e98b0765f728cc`. The subsequent canonical commit changes
the helper's import to the runtime facade alias and adjusts test setup. Navigation
uses the separate frontend build that also contains the file-tree hook change.
Exact binary and asset-tree hashes are in each report; see
`frozen-candidate-provenance.json`. Working-tree revision fields describe the
harness checkout and do not imply that frozen binaries were rebuilt.

## Measurement limits

The host is Linux on an Intel Core i7-11700T with 32 GiB RAM and Chromium 149. The host is shared. Owned builds and tests stop during timed samples, but unrelated host activity cannot be controlled. Host load is recorded separately. Four-times browser CPU slowdown is a stress setting, not an M2 Air simulation.

Driver selection-to-DOM readiness and two animation-frame callbacks are upper-bound interaction observations, not field INP or measured screen presentation. Decoded WebSocket bytes are not compressed network transfer. Heap observations alone do not prove a leak. No MacBook battery or hardware-specific speed claim is made.

### Fresh batching browser checks

The fresh production build passed desktop draft/context navigation, canonical
streaming, and core missed-notification recovery. Phone draft/context navigation
and canonical streaming also passed. The existing phone PR-feedback navigation
test timed out once while the backend logged persistence probe deadlines and
HTTP 503 responses. It passed unchanged on an isolated retry (17 seconds). The
first failure remains unresolved intermittent evidence; the retry does not prove
its cause. Logs: `/tmp/kandev-run.e2e.LdNxLE2b.log` (four passed, one failed) and
`/tmp/kandev-run.e2e.GYA7M9Wi.log` (one passed).

### Batching mechanism rehearsal

`matched-dense-1792760612169.json` completed both arms with 1,000 tasks, six
visible chats, 120 primary messages per chat, and 60-second windows. It compares
the frozen pre-batching core candidate with the new batching candidate. Both arms
verified all 1,800 scheduled ticks with no post-measurement HTTP errors.
Message-store publications fell from 1,501 to 659. Streaming main-thread task time
was 61,370 ms before and 62,085 ms after; frame-gap p95 was 133.4 and 166.6 ms.
History reads were 73 in each arm. Total observed long-task time increased from
2,400 to 45,177 ms. This single pair does not establish a responsiveness gain.
The batching change was removed after separate CPU attribution. Its patch is
retained as `rejected-batching.patch`; it is not part of the next candidate. `batching-first-pair-summary.json` retains the comparison.

### Attributed rendering work

`matched-dense-1792761236903.json` and its two CPU profiles are attribution
artifacts, excluded from timing comparisons. Both profiles identify repeated
task-status list scans (`collectTaskStatusSummaryCandidates`) and synchronous
prompt-edge geometry reads (`useTranscriptEdgeTracking`). The next candidate
caches status selection by its four immutable source references and schedules
edge geometry once per frame. It does not include the rejected batching change.
The status regression reproduced 301,000 task reads for 300 unrelated updates
before caching, versus 1,000 afterward. Each status source and task isolation
remain covered. The geometry regression reproduced synchronous measurement
before the repair and verifies frame coalescing plus cancellation on unmount.
All 197 related transcript/status tests passed; the broader status group passed
31 tests. Frontend type checking and scoped lint passed. All 12 desktop and four phone browser checks passed against the fresh build.
Logs: `/tmp/kandev-run.e2e.G4bA2mdM.log` and
`/tmp/kandev-run.e2e.ZISXP4QX.log`. The timing-only A/B comparison is in progress.

The status/geometry rehearsal completed (`matched-dense-1792762925234.json`):
streaming main-thread task time fell from 62,721 to 61,225 ms (2.4%), and frame-gap p95
fell from 149.9 to 133.4 ms. Normal idle main-thread task time was 15,911 versus 16,330 ms;
reduced-motion idle was 10,764 versus 10,714 ms. Both arms verified final content.
These single-pair changes remain below the rendering target and do not establish
repeatable gains. `status-geometry-first-pair-summary.json` retains all metrics.

Source tracing also found that `useInitialPlacementLatches` returned a new
object on every transcript render. It changed the navigation callback passed
to all historical message rows. A memoized history-action test reproduced
20 unnecessary renders for 20 updates to another message. Memoizing the
placement state removes those renders and still changes ownership on session
switch. The related suite passed 198 tests, and the complete native-scroll
file passed 98 tests after the test harness cleanup. Fresh desktop (11 tests) and phone (3 tests) browser verification passed.
The timing comparison against the frozen status/geometry build follows below.

The callback-only rehearsal (`matched-dense-1792763973626.json`) completed, but
both arms had streaming HTTP failures: 24 control and 42 candidate. Candidate
post-measurement verification retried nine HTTP 503 reads before final content
passed. Frame-gap p95 was 149.9 versus 100 ms; main-thread task time was 66,931 versus
61,171 ms, with about 985 versus 987 ms in main-thread tasks per elapsed second. This is
overload evidence, not a clean responsiveness gain. The source fixes and
regressions were committed and pushed as `4544d15b977`; performance acceptance
remains open. Normal hooks passed, and pending harness files were restored with
exact hash verification after the push.

### Availability probe investigation

The retained logs identify table-probe deadlines during streaming. Metadata
queries used the single SQLite writer. A factory-created WAL fixture reproduces
the timeout with the writer held. The repair uses the existing reader
for table metadata while retaining writer and reader pings, deadline, maintenance
admission, missing-table checks, and unhealthy/recovery behavior. Two older
fixtures were corrected from separate in-memory databases to one factory-created
SQLite file. Required-store and database tests pass; required-store race tests
and scoped Go lint pass. Documentation catalog and specification lint pass.
The pre-health candidate is frozen at
`/tmp/kandev-dense-render-before-health-5936a872`, with the executable hash matched
to the callback rehearsal. Fresh desktop (3 tests) and phone (4 tests) checks
passed. The matched health rehearsal also passed, with all 1,800 updates verified
in each arm and no HTTP or verification errors. Streaming main-thread task time was 60,390 versus
60,354 ms, and frame-gap p95 was 116.7 ms in both arms. This neutral result does
not establish a reduction in intermittent 503 errors, since the control had none.
Raw: `matched-dense-1792765209649.json`; summary: `health-first-pair-summary.json`.
The repair was committed and pushed as `bf3b89bf22e`, with normal hooks passing.


### Markdown content stability

The static and animated Markdown paths previously changed the React component
boundary. An append and its later span compaction remounted unchanged code
blocks and paragraphs. A stable child now preserves those nodes. A second
regression prevents parsing twice during the parent motion state adjustment.
All 168 related unit tests, typecheck, scoped lint, seven fresh desktop checks,
and six phone checks pass. No default appearance or motion duration changes.

Two alternating rehearsal pairs (1,000 tasks, six visible chats, 120 primary
messages per column) completed all 1,800 updates per sample. Stream main-thread task time was
60,374 versus 61,077 ms and 60,265 versus 60,232 ms: effectively unchanged.
Frame-gap p95 was 133.3 versus 116.5 ms and 116.7 versus 100.1 ms. This is a
modest frame-gap reduction across two pairs, not the six-pair reference result
or a measured M2 improvement. Raw: `matched-dense-1792770884505.json`; summary:
`markdown-stable-child-two-pair-summary.json`, under the diagnostic directory.
The earlier inline-render attempt is retained as an unsuccessful experiment
in `matched-dense-1792769340783.json`; it repeated parsing during render retry.


### Rejected row-lookup experiments and long-history limit

Two alternatives to transcript-row enumeration were tested: a scoped attribute
query, then an indexed ID query for generated IDs. Neither gave a clear,
repeatable rendering gain across two alternating pairs. Attribute-query stream
task time was 60,999→61,230 ms and 60,389→60,889 ms. Indexed-ID task time was
61,162→60,373 ms and 62,774→61,588 ms, but frame-gap p95 changed direction
between pairs (100.1→116.6 ms, then 150.0→133.3 ms). All samples verified all
updates without HTTP failures. Both production experiments are removed; exact
patches and raw records remain under the diagnostic directory.

The long-history stress arm did not produce a timed A/B sample. Baseline setup
continued loading but reached only 861–901 messages per chat after 361 seconds,
short of the required 1,000. This is an unresolved setup/performance limit, not
a candidate speed result. Smaller one-chat and six-chat probes loaded all 300
seeded messages in both builds. Their one-second stream windows are diagnostic
only. The harness now retains per-chat loading counts, pagination metadata,
and loading time separately from timed streaming.

Raw records: `matched-dense-1792775033729.json` (attribute queries),
`matched-dense-1792776438660.json` (indexed IDs), and
`matched-dense-1792774416275.json` (long-history setup failure).


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
