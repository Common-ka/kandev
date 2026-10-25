# Dense workbench A/B benchmark protocol

## Status and reproducibility

This protocol is being executed. Recorded series retain their exact candidate
builds. Current verification and remaining scenarios are listed in the
[completion audit](completion-audit.md); results and exclusions remain in
[results.md](results.md). The final 4x stress series remains pending.
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
| File state | 630 tracked fixture files in 21 folders; 72 modified tracked files plus one task marker (73 initial changes) per selected environment, reusing navigation-profile helpers |
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

Temporary request-cause diagnostics use `measurementKind: "read-attribution"`.
The speed summary rejects these reports. Match each actual HTTP request or
WebSocket read to its tagged allocation by transport and request ID. Keep
allocations without a physical request outside read counts. Keep missing and
unclassified causes explicit; do not infer a cause from timing. Observation
builds do not establish latency, CPU, or memory savings.

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

## Browser-event navigation readiness

Set `KANDEV_DENSE_NAV_READINESS=1` on the navigation comparison to record trusted
native `pointerdown` time through destination header text, seeded transcript
content, and an editable composer. The recorder checks the destination session
and Dockview visibility on animation frames without geometry reads. Its listener
and pending frame are removed after each selection, including failures.

Reports and samples identify this method as `navigationReadiness: pointerdown-raf-v1`.
The existing driver-clock readiness remains separately reported. Without the
flag, the recorder is not installed and reports identify the `driver` method.
The summary rejects mixed methods, untrusted/missing/invalid browser measurements,
and mismatched navigation scenarios. Browser-event groups have the probe prefix;
never pool them with earlier driver-only comparisons. Frame sampling supplies
DOM-readiness upper bounds, not actual screen presentation or field INP.

Validate the full caller with 10 tasks, ten messages, two switches, one pair,
and 1x CPU. Run both with and without `KANDEV_DENSE_NAV_READINESS=1`. The new
browser regression and summary regressions must also pass. The initial paired
smokes pass in both modes; [measurement evidence](evidence/navigation-browser-readiness.json)
records the source, failures before implementation, and both caller reports.
They establish harness correctness only. Dense measurements remain open in
the [completion audit](completion-audit.md).

### Incompatible saved layouts

Set `KANDEV_DENSE_NAV_SCENARIO=incompatible-layout` to alternate between task A's
two-column layout and task B's three-column layout. Task B moves Files to the
left of chat and closes the default terminal. The different panel inventory
forces the saved-layout rebuild path on both builds. Both layouts are persisted
before warmup. Each selection waits for the destination chat owner and expected
root column count through Dockview's API. The driver duration includes this
check; the browser header/transcript/composer spans retain their own definitions.

The report includes the actual root count, orientation, and session owner for
every measured selection. The summary rejects missing or incorrect witnesses,
wrong owners, and samples that do not exercise both layouts. Unsupported scenario
names fail before fixture setup. The default `task-switch` path does not add
layout checks. Run the same small caller smoke with the scenario flag before
collecting dense comparisons. Use at least two measured selections.

Moving Files alone does not force a rebuild in the current product: the saved-layout
fast path compares structural component counts but ignores their arrangement.
The initial browser regression reproduced the inherited arrangement even after
explicit persistence. Those failures are preserved separately; closing the
terminal creates the intended rebuild workload and does not resolve that issue.

### Same-environment session tabs

Set `KANDEV_DENSE_NAV_SCENARIO=session-tabs` to measure native Dockview tab
selection between two sessions of one task. The fixture creates the sibling
through `session.launch` and requires both backend session records to have the
same nonempty task-environment ID. The default fixture retains 1,000 tasks,
1,000 seeded primary-session messages, and 100 seeded sibling messages. Set
`KANDEV_DENSE_NAV_SIBLING_MESSAGES=10` for the small smoke only. The second task
created by the shared navigation seed remains prepared but is not a measured
destination and receives no seeded profile history in this scenario.

The browser recorder starts at the selected session tab's trusted pointerdown.
Readiness requires the destination session's visible chat, seeded transcript,
and editable composer. The driver gate also checks the active task/session and
nonempty environment mapping. Every measured selection records those identities;
the summary requires two sessions sharing one task and environment. After timing,
the test requires exactly one detailed chat view. The focused regression also
checks draft retention over four tab selections.

All navigation scenarios first select destination A before their five warmup
switches, then alternate 40 measured selections. Earlier reports started with B
already selected, so their first warmup was a repeat selection; preserve their
original scope. This change affects warmup only. Browser-event spans and driver
spans remain separate. Session-tab driver spans retain the existing Files marker
and two-frame opportunity gate; do not describe them as native input latency.

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

## Sample failures and continued attempts

New reports use `attemptProtocol: continue-and-fail-v1`. Their `comparisonPlan`
records pair count, CPU rates, and order. The initial `attempts` array contains
every planned sample with pending status. Each completed sample becomes passed
or failed before the next independent snapshot starts.

A failed sample sets the report error immediately. The runner continues the
remaining planned samples and fails at the end if any sample failed. A failure
to save evidence stops the runner immediately. Existing sample cleanup, fresh
database copies, workload, input actions, and correctness deadlines remain in
force. Do not interpret an error field as process completion while later
attempts are pending; inspect the actual guarded runner handle.

The summary accepts a new-format report only when every planned attempt passed
in the declared order and every sample identity matches. Failed or unfinished
attempts remain invalid even if the top-level error field is missing. Legacy
reports keep their original validation. A controlled missing-assets rehearsal
verifies that two failed control samples retain their errors while both
candidate samples complete; the final run still fails. This is a harness fault,
not a result for the original baseline. See
[validation evidence](evidence/dense-attempt-continuation.json).

### Failure evidence

Each attempt saves its outcome before it copies the current backend log to a
sample-specific path. The report records the log's SHA-256 digest and capture
time. This is a snapshot before the next backend restart, not a complete log of
later shutdown activity. Copy or persistence failure stops the runner. Existing
evidence is never overwritten by a later attempt.

Cold failures retain document status, navigation timing, browser errors, failed
request paths, document readiness, board geometry, and store exposure. The
inspection records driver request time, browser observation time, and driver
receipt time separately, in Unix milliseconds. Navigation durations use
milliseconds since the document's time origin. A delayed snapshot does not show
the state at the instant of the failed readiness check.

Native interaction records include Node-clock start/end times for each existing
step and values from existing geometry reads. No extra geometry reads run on
successful paths. The action's legacy `finishedMs` remains before its final
geometry read; that read's step can therefore finish later. Failures retain the
original error, completed actions, failing step, later transcript state, and an
optional image. Image capture has a two-second bound and cannot replace the
original failure. Images and extra browser-state inspection run only on failed
samples. Hover/wheel calls, deltas, action order, schedules, and timeouts stay
unchanged.

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

## Dockview stream targeting

The canonical stream helper accepts an optional `"dockview"` surface on
`waitForVisible(page, visibleIds, surface)`, `assertVisible`, and `inspect`.
Dockview targets use session IDs, so two sessions in the same task remain
distinct. Optional visibility lists contain session IDs for Dockview and task
IDs for the default Threads surface. The producer, durable ordered-tick checks,
boolean visibility polling, and 30-second visibility bound remain unchanged.

`dense-dockview-stream.spec.ts` validates two real visible sibling chats, one
retained hidden sibling, and a draft during streaming. All sessions use one
prepared agent profile and one nonempty environment. Local validation uses
`KANDEV_DENSE_WINDOW_MS=2000`; the default remains the normal workload window.
This fixture validates targeting only. It does not replace the required dense
Dockview idle/streaming, structural-panel, plugin, visibility, or stress cases.
See [the harness evidence](evidence/dockview-stream-targets.json).

## Threads reference file state

`seedDenseThreadsFixture` records the actual workspace task count and prepares
file state in each of the six canonical producer environments, or every
prepared environment in a smaller rehearsal. It reuses the existing navigation
profile helpers: 630 profile files in 21 folders, 72 modified files, and one
untracked task marker. Other original repository files remain in the hash.
File preparation occurs before the shared database snapshot.

Each arm verifies the expected counts and a SHA-256 manifest of repository file
bytes before cold entry and after all measured work. These checks are outside
timing. Reports identify this contract as `fixtureProtocol: threads-files-v1`
and retain `fixture.taskCount`, `fixture.files`, and per-sample `fileState`.
The summary rejects missing, changed, or mismatched new-format witnesses.
Historical reports remain readable without claiming this protocol.

A real fixture regression first fails with zero profile files. The repaired
seed, summary regressions, and both frozen-build callers pass
([validation evidence](evidence/threads-reference-file-fixture.json)). The
preceding six-pair attempt stops after one complete pair when the omission is
confirmed; its pending attempts and data remain preserved
([gap evidence](evidence/threads-reference-file-gap.json)). It cannot establish
the full file-state reference workload. Keep earlier Threads results scoped
to their recorded data and rerun the final matrix with this verified seed.

## Dense Dockview fixture

`seedDenseDockviewFixture` preserves the 1,000-task, 30-eligible-task workload
and three sessions per eligible task. It prepares real sibling sessions for the
first task and verifies their shared nonempty environment. Both visible chats
have 1,000 seeded messages; the hidden sibling has 100. This view-specific
selection adds 900 messages to the Threads fixture, for 36,900 seeded messages.
The manifest records each sibling count, and each seed verifies its stored
count and content hash. The fixture reads back the workspace task count.

Six canonical producers are selected: all three sessions of the first task,
plus the primary sessions of the next three tasks. Two producer chats are
visible, one streaming sibling is retained hidden, and three producers belong
to other tasks. The first environment has 630 profile files and 73 working-tree
changes, using the same file helpers as the navigation fixture.

The core layout has five visible panes: two chats, Files, Changes, and a
20-step Plan. It retains the hidden sibling and terminal, for seven actual
Dockview panel objects. The plugin variant uses the complete in-repo E2E
plugin archive, including its navigation, toolbar, and review contributions.
It adds a visible prompt-history pane and a hidden review tab: six visible
panes and nine panel objects. Record the archive hash; do not describe this as
an isolated conversation-only plugin. The verified archive hash is
`9fd37c4eaa58a63603e071bf6a30d76e478d685c2b3e6d1ed58d7aa3f3d25894`.

The opt-in `dense-dockview-fixture.spec.ts` checks the seed, panel arrangement,
actual prompt-history rows, and captures. Set `KANDEV_DENSE_DOCKVIEW_FIXTURE=1`;
add `KANDEV_DENSE_DOCKVIEW_PLUGIN=1` for the plugin variant. A small check uses
`KANDEV_DENSE_TASKS=10 KANDEV_DENSE_COLUMNS=6 KANDEV_DENSE_MESSAGES=120`.
Providing `KANDEV_DENSE_BASELINE_ROOT` restarts that check on the named frozen
binary and assets. These are correctness fixtures, not paired speed results.
The timed caller must snapshot identical data, keep setup separate from cold
entry, and preserve all final workload and identity checks.
See [fixture evidence](evidence/dockview-dense-fixture.json).

## Timed Dockview caller

Set `KANDEV_DENSE_DOCKVIEW_COMPARE=1` and run
`e2e/tests/performance/dense-dockview-comparison.spec.ts` with the guarded runner.
`KANDEV_DENSE_BASELINE_ROOT` identifies the frozen original checkout. Optional
`KANDEV_DENSE_CANDIDATE_ASSETS` identifies the candidate asset directory.
The normal pair, CPU-rate, window, and small-fixture environment settings apply.
Add `KANDEV_DENSE_DOCKVIEW_PLUGIN=1` for a separate full-plugin series.

The caller snapshots the seeded database, checks its hash for each arm, and
records the binary, asset, lockfile, source patch, and untracked harness hashes.
Plugin installation and layout preparation occur before measurement. Setup
elapsed time includes those actions and must not be called cold-entry time.
Each sample records actual loaded message counts separately from seeded counts.

Before timing, open the hidden sibling, wait for its warmup, enter a draft,
and return to the visible primary chat. Verify that the hidden chat and its
editor remain mounted with detail activity disabled. An unopened tab alone
does not establish this workload. After streaming, reveal the hidden sibling
and verify every tick and its draft. All six producers also pass ordered,
durable stored-history checks outside the timing window.

The three windows are idle, streaming, and reduced-motion idle. Record actual
API panel IDs, their visibility, and the two visible session IDs before and
after every window. The summary rejects missing or mismatched pane witnesses.
Core and plugin groups stay separate; all samples must use the report's exact
plugin archive hash. Global editor counts include the Plan editor. The history
observations report chat editors separately.

Fixed-deadline observations record core WebSocket traffic, separate plugin
HTTP conversation requests/responses, and DOM-only stream progress by session.
The final streaming duration includes the unchanged boolean visibility wait.
DOM progress reads do not fetch history. Stored-history verification occurs
after measurement. Plugin HTTP paths and status counts remain raw evidence;
core `historyRequests` counts do not include them.

Workspace task counts use the task-list response's `total`, not the current
page length. The endpoint returns 50 tasks by default even when the workspace
contains 1,000. A 61-task fixture validates this boundary. The first full
Dockview attempt stopped on this fixture assertion before timing; preserve it
as a setup failure, not a product performance result.
See [the count correction](evidence/dockview-task-total.json).


### Departed API retention mode

`KANDEV_DENSE_NAV_RETENTION=1` enables a separate ownership check. Set
`KANDEV_DENSE_PAIRS=1`, `KANDEV_DENSE_CPU_RATES=1`, and omit
`KANDEV_DENSE_NAV_SWITCHES` and timed profiling. The caller performs its normal
selections, then 100 retention switches and native navigation to Settings.
It records actual API panels, document editors, and successfully acknowledged
gateway scopes before and after switching and after release. It requires the
same document and connection epoch across release. It does not expose private
frontend subscription reference counts. The control records its old API
behavior; the candidate must release the API and panels. Speed summaries
reject this mode. See [the cleanup evidence](evidence/dockview-api-release.json)
for the small control/candidate validation and post-GC observations.

### Scripted Threads inputs and full-column traversal

Set `KANDEV_DENSE_INTERACTIONS=1` to select `scripted-scroll-v1`. The default
remains `quiet`. During the streaming window, the caller schedules four native
pointer/wheel actions at 20%, 40%, 60%, and 80% of the fixed duration: hover and
scroll up, return to the bottom, leave the tile to close the composer, and hover
to reopen it. Composer disclosure changes transcript bounds, so the pointer
must target the transcript again after disclosure before wheel input.

Record each action's scheduled, start, and finish times, task/session identity,
scroll geometry, and composer state. Preserve late actions; a short rehearsal
does not establish that inputs ran on schedule. Wait for both the fixed duration
and the action sequence before recording the deadline. A failure preserves its
partial observations. No document visibility property is overridden.

The summary rejects mixed or unknown interaction modes, incomplete or reordered
actions, offscreen targets, and invalid timing witnesses. It labels all warm
windows with the scripted mode, including reduced-motion idle after the pointer
sequence. Do not pool them with quiet measurements. Cold loads remain separate.

After timing in columns mode, visit the first, middle, last, and first pinned
columns. Resolve this order from the rendered deck, compare it with every seeded
eligible task, and verify active session identity, visible fixture content, and
loaded messages at each stop. This includes non-producer columns. The existing
exact-tick checks still verify previously offscreen streaming producers. Grid
mode omits column traversal. These visits are correctness checks outside timing.

## Optional Dockview CPU attribution

Set `KANDEV_DENSE_DOCKVIEW_PROFILE=1` with the Dockview comparison caller.
Each sample writes separate idle, streaming, and reduced-motion idle CPU profiles
beside the raw report. The caller checks sample structure, profile duration, and
application frames. It records animation targets after each measured window.
These reports use `measurementKind: "cpu-attribution"`; the speed summary rejects
them. Leave this option unset for paired performance comparisons.

The small plugin RED/GREEN and default core caller regression pass. See
[validation and animation ownership](evidence/dockview-cpu-attribution-harness.json).
The four residual candidate animations belong to shared host loading indicators
on plugin composer buttons. This identifies their owner, not their CPU cost.

## MacBook Air confirmation

[The Mac reproduction procedure](mac-reproduction.md) uses the same disposable
fixture and guarded runner. Record device and power settings with each report.
Linux CPU throttling does not replace testing on the M2 Air. Native document
hide/restore remains a separate headed-browser correctness check.

## Native document hide and restore

Playwright normally enables focus emulation. A second tab can therefore leave
`document.visibilityState` visible even in a headed browser. The native
correctness helper launches an owned disposable Chromium process and connects
to its existing default context with `noDefaults: true`. This preserves real
browser visibility behavior. New contexts would restore the normal overrides.
No document visibility property or event is replaced.

Core and full-plugin application checks now pass actual hidden/visible events
in one document. They verify ordered updates, draft and scroll retention, paused
owned motion, resumed foreground backfill, and retained plugin expansion. The
paired speed caller does not use this helper. See
[complete evidence](evidence/native-document-visibility.json), including the
initial fixture/cleanup timeouts and collapsed-row assertion failure.
