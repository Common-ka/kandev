# Dense workbench A/B benchmark protocol

## Status and reproducibility

This protocol is being executed. The six-pair unthrottled grid and navigation
series are complete. Results, exclusions, and remaining scenarios are recorded
in [results.md](results.md). The 4x stress series remains pending.
Owner: [work order 01](task-01-dense-baseline.md) builds the harness and captures
the baseline; [work order 06](task-06-performance-comparison.md) runs the final
comparison. Do not use the changing live deployment as the control.

Freeze baseline source `595df36ed5c1cf02fd90cb972b623ad6edc53df8` and candidate
source plus its exact patch. Record SHA-256 for the patch, backend executable,
asset tree manifest, lockfile, and benchmark harness. Apply the same test-only
harness to both revisions. Report instrumentation patches separately. Use two
isolated checkouts and disposable data directories. Install locked dependencies
once per checkout, then build both before timed runs. Never share mutable
databases between running servers or reuse the user's data.

Record OS, CPU, RAM, browser version, viewport, device scale, power mode if
available, profile values, plugins, build mode, locale, and network conditions.
Both arms use the same managed E2E profile with production Vite assets served
by Go. Use mock agents and providers; inject updates through the real task
service and event publication path. Do not inject fabricated WS deltas that
bypass the suspected receipt producer. If the fixture cannot exercise that
path, the conversation result is invalid until the fixture is corrected.

## Deterministic fixture

Use a seed manifest with deterministic titles, content, ordering, and logical
IDs. Map generated database IDs into a recorded manifest; normalize only those
IDs and timestamps when checking fixture equivalence. Assert actual counts
before each run. Do not copy a SQLite file while its server is running.

| Dimension | Reference workload |
| --- | --- |
| Tasks | 1,000 in one workspace; 30 eligible for Threads; remaining tasks span idle/completed states |
| Sessions | Three per eligible task; one selected per column |
| History | 1,000 messages per selected session, 100 per sibling; deterministic mixture of text, code blocks, tool groups, and turn metadata |
| Content size | Approximately 1 KiB text per message; identical fixture bytes in both arms |
| File state | 630 files in 21 folders and 72 changed files for each of two switching tasks, reusing navigation-profile helpers |
| Streams | Six selected sessions, five updates per second each; 60 seconds = 1,800 scheduled updates; update existing agent messages and complete turns at fixed sequence positions |
| Grid | 1470 by 956 CSS pixels, scale 2; record and hold six visible tiles with the same layout configuration |
| List | 30 columns, same viewport; scroll a fixed sequence through first/middle/last columns |
| Dockview | Two visible chat split panes, retained hidden tabs, plan/files/changes panels; same-layout and different-layout environment pairs |
| Plugins | Core-only arm, plus a fixed in-repo conversation fixture plugin arm; record exact bundle hash |

Measure actual emitted and received update counts, revision coverage, and final
visible marker. If the producer falls behind, retain that run as overload
evidence; do not silently slow one arm or omit dropped updates. The standard
comparison requires the same delivered workload and correct final state.
No real provider credentials, live agent processes, or personal conversations.

## Scenarios

1. **Cold entry:** Fresh browser context, empty cache, Threads grid entry.
   Capture resource transfer, decoded sizes, script evaluation, and time to
   all visible task identities and final seeded transcript markers. Report
   document load separately; it is not chat readiness.
2. **Warm idle:** Hydrate, confirm subscription readiness, then observe a
   60-second no-input/no-stream window. Run grid, list, and Dockview separately.
3. **Warm streaming:** Apply the fixed stream for 60 seconds. Include a scripted
   transcript scroll and tile hover sequence, then confirm final content.
   Keep the initial loaded window identical. Add a separate long-history stress
   arm that causally loads all 1,000 seeded messages in each visible chat before
   timing; confirm loaded counts so dense storage is not mistaken for dense DOM.
4. **Switching:** After five warm-up switches, perform 40 alternating selections
   per run. Separate same-environment tabs, different tasks with compatible
   layout, and incompatible-layout restoration. Include A-B-A with drafts,
   scroll, selected sessions, and one delayed old response.
5. **Visibility and motion:** Repeat fixed work with normal and reduced motion,
   with expanded/collapsed composers, offscreen columns, hidden Dockview tabs,
   and document hide/restore. Use actual browser visibility behavior; record
   browser limitations instead of equating CSS hiding with document hiding.
6. **Recovery correctness:** Drop a relevant notification, deliver the next
   revision, reconnect, and return from suspension. Assert bounded repair and
   final messages/turns without reload. Keep this arm separate from steady-load
   timing. Verify no loss of optimistic input, draft, or scroll state.

Phone correctness uses the existing mobile-chrome composition and touch
navigation. It does not render six compressed desktop panes. Phone checks
cover native Threads selection, task navigation, composer disclosure, reduced
motion, and stream recovery with no horizontal overflow.

## Timing and instrumentation

Use existing `task-navigation-profile.spec.ts` and helpers as the starting
point. Add a gated `dense-workbench-profile.spec.ts` and narrowly scoped seed
helper. Record artifacts through the existing diagnostic attachment pattern.
Use `KANDEV_DENSE_PROFILE=1` only as a test opt-in, not a runtime feature flag.

Collect CDP metrics before and after each observation window. Record main-thread
TaskDuration, script duration, style/layout duration and counts, long tasks
over 50 ms, frame-gap p50/p95/max, mounted nodes, and running/paused animation
counts. Do not sum nested trace event durations as independent CPU cost.
Use separate attribution runs for CPU profiles, React mounts, and stack capture;
do not include profiler startup or its overhead in timed results.

Set the CDP performance time domain explicitly to `timeTicks`. `TaskDuration`,
`ScriptDuration`, `RecalcStyleDuration`, and `LayoutDuration` then measure elapsed
time, not CPU time. Report `TaskDuration` as main-thread task time. Report
`ThreadTime` separately as renderer main-thread CPU time and `ProcessTime` as
renderer-process CPU time. The latter excludes separate browser, GPU, and backend
processes. Preserve all three counters in raw evidence. Existing summary fields
`mainThreadMs` and `mainThreadMsPerSecond` refer to task time; `mainThreadCpuMs`
and `rendererCpuMs` refer to CPU time. Missing CPU counters must fail summary
validation rather than silently substitute task time or zero.

Record each `message.list` and conversation-source read with scope, limit,
cursor presence, and reason: initial, pagination, scheduled backfill, turn
settle, foreground, or revision recovery. Temporary reason instrumentation
must be identical in both arms and must not record message content. Count
decoded UTF-8 response bytes, not JavaScript string length. Label that metric
as decoded bytes; use CDP encoded data length for network transfer where
available. Separate plugin source reads from core history reads.

For task switches, measure the browser event timestamp to destination header,
current transcript marker, and composer readiness. Existing driver-clock
measurements and two-rAF paint opportunities may also be reported with their
actual names. Neither is a measured screen presentation nor field INP.

After 100 switches and released owners, measure retained editor/subscription
counts and post-GC heap in a separate retention arm. Compare with the same
state after warm-up. An increasing single heap sample is not proof of a leak.

## Extra busy-header rendering stress

The default columns fixture has six real mock stream producers. Its remaining
headers have waiting sessions. To exercise a full busy deck, add
`KANDEV_DENSE_LAYOUT=columns KANDEV_DENSE_COLUMNS=30
KANDEV_DENSE_EXTRA_BUSY_HEADERS=24`. The existing backend test API changes only
the specified non-producer sessions to `RUNNING` after each backend restart.
These are seeded status rows, not 24 additional live executions. The six real
canonical stream producers and their ordered-update checks remain unchanged.
Both arms still restore the same database snapshot before the same mutations.

Reports and samples retain `extraBusyHeaders`. The summary rejects mismatched,
negative, fractional, or non-numeric counts and labels this series
`columns-busy-24-*`. Never pool it with the default workload. Each timed window
is followed by an untimed icon snapshot; its target count must equal the real
producer count plus the seeded-header count. Running/paused counts establish
motion state, not a CPU gain. Offscreen stream catch-up remains outside timing.

Before a full run, use the small caller with 10 tasks, eight columns, ten seeded
messages, two extra busy headers, one-second windows, one pair, and 1x CPU.
Also rerun the default one-column smoke without the extra-header flag. Both
versions must preserve every icon and pass every ordered stream check.

## Navigation CPU attribution

Set `KANDEV_DENSE_NAV_PROFILE=1` with the normal navigation comparison flags
to profile the actual timed task switches. The profile begins after the five
warm-up switches and stops after the measured window, before retained-owner
checks. Reports and samples record `profileWindow: timed-switches`; reports
use `measurementKind: cpu-attribution`, which the summary rejects. Without the
flag, the existing profile covers only two post-timing task selections and is
labelled `post-timing-selection`. Do not use it to attribute file-marker wait
cost during the measured switches.

Validate changes with the full caller on `KANDEV_DENSE_NAV_TASKS=10`,
`KANDEV_DENSE_NAV_MESSAGES=10`, `KANDEV_DENSE_NAV_SWITCHES=2`, one pair, and 1x
CPU. Require both profile files, matching profile-window metadata, and a profile
duration that contains the measured window. Explicit `KANDEV_DENSE_NAV_SWITCHES`
skips the additional retention switches; use `40` for the normal timed workload
when only attribution is needed. Profiler runs are excluded from speed claims.

## Run order and comparison

After changing the measurement harness, first run its full caller with a small
fixture: `KANDEV_DENSE_TASKS=10 KANDEV_DENSE_COLUMNS=1 KANDEV_DENSE_MESSAGES=10
KANDEV_DENSE_WINDOW_MS=1000 KANDEV_DENSE_PAIRS=1 KANDEV_DENSE_CPU_RATES=1`, plus
the normal comparison opt-in and frozen baseline path. Require both samples and
all final-content checks to pass. These short windows validate the harness;
exclude them from performance conclusions. Web typecheck excludes `e2e`, so it
cannot substitute for this check.

Run one measured browser and one instance at a time. No builds, parallel test
suites, or profiling jobs during timing. Exclude warm-up from samples.
For each primary scenario, run six paired repetitions, alternating AB and BA.
Use fresh equivalent fixture state for each pair. Record all samples and
invalid-run reasons before computing results. Keep cold and warm results apart.

Run unthrottled first. Run the same desktop scenarios at 4x browser CPU
slowdown as a separate stress series. This is not an M2 Air emulation. The
current Linux host cannot substantiate an M2-specific latency or battery claim.
Provide the exact runnable protocol for optional measurement on the user's Mac.

To isolate streaming from a separately recorded cold-load failure, use
`KANDEV_DENSE_THROTTLE_AFTER_LOAD=1`. Both versions load and hydrate at 1x, then
apply the requested CPU rate before the observation windows. Reports retain
this mode and the cold CPU rate. The summary labels loading as
`1x/cold-before-4x` and subsequent windows as `4x/warm-*`; it rejects mixed modes.
This series does not replace the fully throttled cold-load reference. Run the
small full-caller smoke with this flag and `KANDEV_DENSE_CPU_RATES=4` before
using it for timing.

Use `KANDEV_DENSE_LAYOUT=columns` for the horizontal columns view. This removes
the six-column display cap while retaining the existing viewport activation
policy. The six prepared conversations produce updates; only columns that
intersect the board viewport participate in visible-content gates and progress
observations. The cold result records those task IDs. Stored-content checks
still verify every producer. After all timed windows, scroll to each previously
offscreen producer and require its exact ordered tick sequence to appear.
This catch-up check is outside timing. Summaries label these groups
`columns-*` and reject mixed-layout pairs. Default grid behavior is unchanged.
The columns smoke must use at least seven eligible columns so it exercises
offscreen catch-up and removal of the grid's six-column cap. Cold loading also
asserts and records the actual displayed column count. Full-history loading
is not combined with columns timing, because it would activate offscreen detail.

Report per-arm medians/ranges and paired percentage changes. For task switches,
report each run's p50/p95 and their paired differences, not only a pooled p95.
Use `(baseline - candidate) / baseline * 100` for lower-is-better metrics;
report absolute differences when baseline is zero. Retain raw JSON and a
machine-readable comparison, then show a Kandev Table with units.

## Acceptance and honest conclusions

Hard gates: correct final content; unchanged default layout and status; no
lost drafts; bounded viewport subscriptions; complete receipt delivery on
normal instrumented writes; no history recovery caused by those contiguous
batches; real missed-event recovery still succeeds. Existing periodic backfill
is allowed and must be counted explicitly. Compression must decode exactly.

Experiment targets: at least 80% fewer unnecessary recovery reads if that
baseline defect reproduces; at least 50% fewer encoded JS/CSS bytes on a cold
gzip load; at least 20% lower streaming main-thread task time or warm-switch p95
where a rendering fix is attributed. These are targets, not measured gains or
hardware-independent product promises. Keep all primary scenarios in the
report, including neutral or slower results. An unexplained regression above
10% outside observed run variation needs investigation before closing work.

A missing baseline defect is reported as not reproduced, not 100% improvement.
If targets are missed, name the remaining measured owner and keep unresolved
work open. Do not declare the user's sluggishness resolved from compression
alone. Report what was tested, where gains occurred, and what remains unknown.

### Compositor attribution

`KANDEV_DENSE_ANIMATION_DIAGNOSTICS=1` also inspects the six normal-motion
Threads status SVGs after the observation windows. It temporarily restores
normal motion, captures a compositor frame with a screenshot, and maps DOM
backend node IDs to layer ownership and compositing reasons. It restores the
previous motion preference afterward. These style reads and layer-domain calls
are intrusive attribution; the report remains `animation-attribution` and the
summary rejects it. A composited layer does not establish a CPU gain or zero
main-thread cost. Keep this flag off in paired performance runs.

### Final visibility probe version

The timed final-marker gate uses `waitForDenseVisible`: boolean polling of
`locator.isVisible()` with the existing 30-second deadline and visibility
semantics. Full locator assertions run after observation windows. Playwright
1.61.1 collects a page-wide ARIA snapshot on failed locator assertions whose
target is missing, which added significant work after the stream deadline in
the recorded profiles. Do not put those assertions back inside measured windows.
Reports and samples record `finalVisibilityProbe: boolean-poll`. Missing metadata
means the historical `locator-assertion` probe. Do not pool the two series; the
summary rejects mixed probe versions. See the [attribution record](evidence/visibility-probe-attribution.json).
