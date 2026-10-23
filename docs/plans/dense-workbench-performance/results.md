# Dense workbench performance results

Status: measurement in progress. This report distinguishes completed repairs from pending dense timing evidence. The branch is `feature/evaluate-live-thread-bc0`; the frozen baseline is `595df36ed5c1cf02fd90cb972b623ad6edc53df8`.

## Implemented and pushed

| Commit        | Change                                                       | User-visible effect                                                             |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `de1c61bfa5b` | Preserve conversation receipts through JSON transport        | Fewer unnecessary history resets when the receipt is complete                   |
| `e7180040058` | Respect reduced motion in persistent indicators              | The same status remains visible; animation stops when reduced motion is enabled |
| `4fbc42edcfa` | Precompress assets and defer Monaco imports                  | Smaller cold downloads; editor resources load on first use                      |
| `7196cdf7d95` | Carry committed canonical stream receipts into notifications | Streamed content can update incrementally without reset-and-reload              |
| `51272eb39d5` | Defer hidden file-tree touch action hooks | Controls and actions stay unchanged; hidden hooks no longer mount |
| `4544d15b977` | Cache status scans, coalesce edge geometry, and stabilize history actions | Removes repeated work while preserving scroll controls and session ownership |

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
1,730 to zero. Normal idle CPU was essentially unchanged. Reduced-motion idle
main-thread time fell from 17,130 to 10,226 ms over 60 seconds.

Streaming rendering did not improve: main-thread time was 62,845 ms baseline
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
and 9.17% more main-thread time**. This series establishes no switching gain.
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

Still pending: complete paired dense results, final fresh-build browser checks, long-history stress, and the broader list/split/hidden-tab/layout scenario matrix from [benchmark.md](benchmark.md). The existing visible-composer attribution work remains open. A file-tree hook change does not prove that composer work is resolved.

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
Message-store publications fell from 1,501 to 659. Streaming main-thread time
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
streaming main-thread time fell from 62,721 to 61,225 ms (2.4%), and frame-gap p95
fell from 149.9 to 133.4 ms. Normal idle CPU was 15,911 versus 16,330 ms;
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
passed. Frame-gap p95 was 149.9 versus 100 ms; main-thread time was 66,931 versus
61,171 ms, with about 985 versus 987 ms of CPU per elapsed second. This is
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
in each arm and no HTTP or verification errors. Streaming CPU was 60,390 versus
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
messages per column) completed all 1,800 updates per sample. Stream CPU was
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
CPU was 60,999→61,230 ms and 60,389→60,889 ms. Indexed-ID CPU was
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
