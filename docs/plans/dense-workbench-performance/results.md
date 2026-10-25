# Dense workbench performance results

Status: earlier-build 1x comparisons for compatible tasks, incompatible layouts,
same-environment session tabs, Dockview core, and full-plugin Dockview are
recorded below. The latest production build is `7a984021113`. Its final grid,
columns, stress, owner retention, and regression-attribution gates remain open.
The branch is `feature/evaluate-live-thread-bc0`; the frozen baseline is
`595df36ed5c1cf02fd90cb972b623ad6edc53df8`.

## Threads reference file-state correction

The corrected full-reference grid run executes all 12 attempts. Five pass and
seven fail; only pair zero completes both arms. Its five complete samples verify
9,000 ordered updates. Both builds have native input failures, and each has a
cold board-readiness failure. Candidate return-bottom failures remain at 21 px
and 464 px in the failed predicate samples. Later diagnostic snapshots have
different positions and must not be treated as simultaneous observations.
The current wheel fix is insufficient at full load. The summary rejects this
failed series; no final six-pair speed claim follows. See
[the complete failure evidence](evidence/reference-files-grid-failed.json).

The diagnostic update retains a separate backend log per attempt, cold browser
state and errors, failure images, and input-step timings. Its 57 Node checks,
four browser regressions, fault continuation check, and healthy callers pass.
The first combined navigation check fails before comparison while preparing
task B's file marker; that failure remains retained. The documented isolated
small navigation caller passes. Its isolation and history count differ, so the
rerun does not establish the earlier setup failure's cause. These checks validate
evidence collection, with no application change or performance claim. See
[the diagnostic evidence](evidence/failure-diagnostics.json).

The prior grid attempt completes one pair and 3,600 ordered updates before a
read-only audit confirms that each prepared repository has only its default
tracked file. The run is deliberately interrupted to repair that missing
reference dimension. All data and pending attempts remain retained, and the
summary rejects the incomplete plan. See
[the gap evidence](evidence/threads-reference-file-gap.json).

The seed now prepares 630 profile files and 73 changes in each canonical
producer environment. It records actual task count and verifies content hashes
outside timing on both arms. The real regression, 53 Node checks, strict lint,
and paired default-grid, original scripted-column, and full-plugin Dockview
callers pass. See [fixture evidence](evidence/threads-reference-file-fixture.json).
No speed gain follows from these short checks. Earlier Threads measurements
retain their exact chat/history workload and do not prove the missing file-state
dimension. New final-reference comparisons remain required.

The same production build passes 228 related scroll unit checks and 50 targeted
browser checks ([evidence](evidence/native-wheel-bottom-follow.json)). Older
measurements and their limits remain below.

## Final targeted correctness

The retained `7808415cf2e` production build passes all 50 targeted browser
checks: 33 desktop cases in 7.8 minutes and 17 phone cases in 4.7 minutes.
The guarded suites run sequentially with one worker and the frozen `9f2b...`
assets. They cover canonical delivery, core/plugin recovery, actual document
hide/restore, drafts, task navigation, saved layouts, owner release, hidden
Changes anchors, lazy editor loading, normal/reduced motion, and native phone
input. Desktop and phone captures are preserved; selected states were inspected.

These are correctness gates. The Dockview regression uses a two-second stream
window, and the cases do not establish dense speed or memory gains. Scripted
control wheel failures, final dense comparisons, and stress/retention coverage
remain separate. [Complete evidence](evidence/final-targeted-correctness.json)
records every case, command, source identity, log hash, and inspected capture.

## Focused scroll-input diagnosis

A separate instrumented run passes on both frozen builds with 1,000 tasks,
30 columns, and 120 messages per primary session. Both wheel sequences pass;
the full-reference failure is not reproduced. All observed wheel events are
trusted and hit the intended transcript. Each arm verifies 1,800 ordered updates
and finishes at the bottom.

Both explicit Jump to latest checks pass the same five-second, three-pixel
poll. However, the candidate check runs after its final tick is already present,
so it does not establish live-follow recovery during an active candidate stream.
The baseline's next geometry reads can be 23 or 42 px from the moving edge after
a successful bound check. This does not establish the earlier failure's cause.
The shorter history, geometry observers, and late actions remain explicit.
See [complete diagnostic evidence](evidence/scroll-follow-attribution.json).
A separate interaction version can test the existing explicit follow control;
the original wheel failures remain unresolved and are not pooled with that series.

## Corrected reference columns: five pairs, failed series

The final `820fcd57` build and original frozen baseline execute all twelve
planned attempts with 1,000 tasks, 30 eligible columns, 36,000 stored messages,
and the corrected 630-file/73-change producer environments. Ten samples pass,
with 18,000 ordered updates verified in complete samples. The final pair fails
on both versions: the control misses the native return-bottom bound at 274
pixels; the candidate finishes its three windows but cannot show the first
producer's chat during column traversal. Its exact failed visit is not recorded.

All native inputs and deadlines remain unchanged. The runner and sampler are
terminal. All twelve backend logs have matching hashes; the control screenshot
is inspected. Five passing pairs do not establish the required complete series,
and summary validation rejects the report. No column gain or resolved-sluggishness
claim follows. See [the failure evidence](evidence/reference-files-columns-failed.json).
The earlier start-gate timeout has no measured samples and stays separate
([evidence](evidence/columns-start-gate-timeout.json)).

## Final scripted columns attempt (incomplete)

The full reference columns run stops after 21.7 minutes in its first control
streaming window. The fixture has 1,000 tasks, 30 columns, and 36,000 stored
messages; four producer columns are initially visible and load 100 messages
each. The other two producers remain offscreen and initially load no messages.
No extra busy headers are enabled.

The native return-bottom wheel action fails the unchanged five-second check:
expected at most 3 px from the bottom, observed 507 px. Its last checkpoint is
549 px from the bottom. This repeats the prior scripted grid control failure.
The capture shows the first transcript behind neighboring live tails, which
does not prove message loss. The cause remains unconfirmed.

No sample or pair completes. Candidate timing, final ordered verification,
offscreen catch-up, and full-deck traversal are not reached. The raw error is
preserved and the speed summary rejects the report. Backend logs also retain
HTTP 503 responses; the completed cold/idle traffic observations do not cover
the failed streaming window. See [complete failure evidence](evidence/final-scripted-columns-failed-attempt.json).
A focused scroll reproduction and final combined correctness precede another
dense scripted attempt. No timeout or final-position bound changed.

## Final scripted grid attempt (incomplete)

The final full-reference attempt stops after 50.8 minutes in the fifth control
sample. Four pairs pass all 14,400 ordered updates. During the next control
stream, the fixed return-bottom wheel action fails its unchanged five-second
check: expected at most 3 px from the bottom, observed 423 px. Its last failure
checkpoint records a 592 px gap. The final screenshot shows that tile behind
the live tail. The cause is unconfirmed. No driver tolerance or timeout changes.

All four completed pairs have higher candidate streaming frame-gap p95:
83.4 to 116.6 ms, 83.4 to 133.3 ms, 116.6 to 150 ms, and 100 to 149.9 ms.
Completed control samples also contain 104 HTTP 503 responses and eight
post-window verification retries. Candidate samples have neither and record
zero resets. Passing content checks do not erase either
availability failures or the candidate frame regression. Counts exclude failures
that were not captured in the unfinished streaming window.

The raw report retains its error, and the speed summary correctly rejects it.
This is not a successful six-pair result. [The evidence](evidence/final-scripted-grid-failed-attempt.json)
preserves every completed sample and the failed interaction. A separate quiet
CPU-stack capture will investigate renderer cost without mixing diagnostic and
speed samples. Final grid timing and the scroll-failure investigation remain open.

## Native document visibility verification

Real core and full-plugin hide-and-restore checks now pass. The earlier probe
used Playwright's default focus emulation, which kept the document visible.
A disposable external Chromium default context connected with `noDefaults: true`
emits actual hidden/visible events. Application tests retain the same document,
twelve ordered updates each, draft text, scroll offset, and plugin expansion.
Owned motion pauses while hidden; scheduled backfill pauses and one foreground
read resumes. No document property is overridden. Initial fixture and assertion
failures are retained in [the evidence](evidence/native-document-visibility.json).
This is correctness verification, separate from timing and final combined gates.

## Shared plugin-action loading indicators (isolated comparison)

Six alternating pairs compare the retained `f5c8fb8f6ab` candidate with the same
binary and a shared Spinner reduced-motion CSS rule. All 12 samples pass in
about 1.1 hours, including 21,600 ordered updates and retained hidden drafts.
The fixture has 1,000 tasks, 36,900 stored messages, nine API panels, and four
document editors. Neither version records HTTP failures, resets, or plugin
conversation reads during measured windows. Scheduled core backfill remains.

Reduced-motion idle main-thread CPU falls 79.82% and renderer CPU falls 69.65%
by median paired change. Both improve in every pair. Running animations fall
from four to zero in every reduced-motion sample. The shared loading indicators
remain visible and preserve their accessible busy state. All ten related
desktop/phone browser checks and five unit tests pass. Typecheck, strict lint,
and the fresh build pass. Normal motion resumes when the preference changes.

Normal-mode CPU results are mixed and are not credited as a benefit of this
reduced-motion rule. The first normal-idle pair regresses 40.17% in main CPU and
34.84% in renderer CPU. Frame-gap p95 is neutral by median paired change in all
three modes. Reduced-motion maximum gaps worsen in four pairs, including a
33.4 to 333.32 ms final-pair increase. Normal-idle pair 2 and streaming pair 1
also contain frame regressions. All samples remain in the evidence.

Normal idle has 51 running animations in every sample. One candidate streaming
window records 42 instead of 51; its owner is unconfirmed. It still passes the
same pane/editor and ordered-update checks. This is not a basis for claiming
normal-mode gains. See [complete evidence](evidence/plugin-spinner-motion-six-pair-1x.json).
The earlier original-baseline series below retains its recorded build identity.
These Linux measurements do not establish M2 Air or battery gains.

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
had zero. A separate short profile now identifies these as shared host loading indicators on
plugin composer buttons. Their CPU contribution still needs a controlled comparison. The full
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
battery, or leak claim follows. The full-plugin series remains separate; its results appear above.

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

## Saved layouts: correctness repair

Task switches now compare the saved split arrangement before choosing the
Dockview fast path. The old check matched identical panel counts even when one
task used two columns and the other used three. The browser regression fails
on the retained build and passes on the candidate, with both task drafts intact.
Compatible arrangements can still reuse the fast path across size and session-ID
changes. No default style or layout values change.

The candidate passes 75 targeted unit tests, typecheck, strict lint, the build,
the final browser regression, four phone checks, and a small comparison against
the original baseline. These checks establish correctness. The six-pair distinct-inventory timing
above shows small mixed gains. [Evidence](evidence/layout-arrangement.json) records build hashes,
failures, final checks, and inspected captures.

## Hidden Changes presentation: retained

The candidate removes hidden Changes timeline anchor, presentation-observer,
and scroll-margin measurements using Dockview's existing visibility signal.
Visible unfocused split panes still update. Data and mounted state stay owned
by the existing components. Reveal refreshes measurements and restores the
saved row; still-current deferred focus requests resume. No layout or style
values change.

A separate native-getter diagnostic records 720 hidden scroll-position reads
on the retained control and zero on the candidate during 40 switches. Visible
reveal performs seven and nine reads respectively. This tracing adds overhead
and establishes work attribution, not speed. The real-browser baseline also
moves the saved row by 106 px after a hidden Git update and resize; the candidate
preserves it within 2 px and retains editor focus beside visible Changes.

Six alternating timing pairs passed in 19.9 minutes: 480 measured switches plus
200 additional retention switches. Each selected task has 1,000 stored messages,
630 files, and 73 changed files, within a 1,000-task workspace. Style-recalculation
time falls in all six pairs, by 2.59–12.12% (median paired reduction 10.41%).
Style-recalculation count falls 12.65%, layout count 4.50%, and long-task count
5.50% by median paired change, with reductions in every pair.

Main-thread CPU falls 2.46% and renderer CPU 1.64% by median paired change.
Both improve in five pairs; the first pair instead increases 4.48% and 3.73%.
Median switch readiness improves 1.79%, but p95 is effectively unchanged:
0.14% slower by median paired change, with four slower and two faster pairs.
The first pair's p95 is 9.09% slower. Per-arm switch times rise across the series;
the cause is unconfirmed. Retain every pair. This is a targeted rendering gain,
not an established p95 navigation-speed improvement. Both retention arms keep
one editor and three Dockview group content containers; no leak conclusion follows.

Validation passes 77 unit tests in 11 files, typecheck, strict lint, the production
build, the new hidden/visible browser case, and 12 existing desktop history and
focus checks. Both phone checks pass on the unchanged rerun. The initial phone
deep-tree case fails before file actions because the heading remains mounted
after scroll; its cause remains unconfirmed and its artifacts are preserved.
The same cases pass on the retained baseline. No phone test was weakened.

The first paired timing attempt records zero samples because the frozen control
bundle lacks its relative mock-agent helper. Adding the same hash-checked
mock-agent and agentctl binaries as the candidate repairs the fixture; application
binary/assets are unchanged. The corrected preliminary two-pair run also passes
and remains separate from the six-pair confirmation.

[Complete evidence](evidence/hidden-changes-six-pair-1x.json) includes all paired
metrics, source hashes, attribution counts, validation, failures, and limits.
Raw confirmation: `matched-navigation-1792830434449.json`; log:
`hidden-changes-navigation-six-pair-logs/kandev-run.e2e.0Ty0dX1Q.log`.
The [completion audit](completion-audit.md) retains the remaining full-package
scenario and stress obligations. These results are from Linux, not an M2 Air.

## Owned Threads status visibility: retained

The six-pair repeat passed all 12 samples in 48.0 minutes. Normal-idle
main-thread CPU fell in every pair, by 70.29–71.48% (median paired reduction
70.69%). Renderer CPU fell 55.95–59.96% (median 56.98%). Streaming main-thread
CPU fell 1.69–2.36% and renderer CPU fell 1.87–3.36%, with median reductions of
2.09% and 2.67%. Streaming frame-gap p95 remained about 50 ms in both versions.

All samples verified 1,800 ordered updates; both offscreen producer chats caught
up with all 300 ticks. Post-window snapshots found 30 running header animations
in the control and four running plus 26 paused in the candidate. Both had zero
running header animations in reduced-motion windows. The 24 additional busy
headers are seeded session states; six real mock producers supply the stream.
The separate default six-busy-header two-pair result below remains essentially
neutral for streaming and is not pooled with this stress variant.

Reduced-motion CPU results are mixed: median main-thread CPU increased 0.08%
and renderer CPU fell 0.73%. Maximum frame gaps are also mixed. Streaming has
one 61 ms baseline long task and one 52 ms candidate long task in different
pairs. One baseline cold-readiness outlier is 21.254 seconds. Keep all samples;
no reduced-motion, maximum-frame-gap, long-task, or cold-readiness gain follows.

Retain the owned visibility change. All six production source hashes match the
measured build; formatting also passes. The existing 148-unit, typecheck, strict
lint, production build, and desktop/phone lifecycle evidence remains valid.
There is no icon, wrapper, animation-engine, or layout change. The shared helper
uses the board's geometric visibility and avoids observers for hidden owners.
The separate requirement 001 HTML-target migration remains outside this fix.

[Six-pair evidence](evidence/owned-thread-motion-six-pair-1x.json) retains every
metric, sample, source/build identity, and limitation. Raw report:
`matched-dense-1792824364604.json`; log:
`owned-thread-motion-busy-six-pair-logs/kandev-run.e2e.yoqh9ksN.log`.

## Owned Threads status visibility: preliminary

A new candidate reuses the board's existing geometric visibility signal to
pause offscreen status SVGs. Hidden owners allocate no intersection observer.
Visible owners retain direct icon intersection and shared document visibility
checks. Unknown geometry preserves visible feedback. No wrapper, animation
engine, icon geometry, or default timing changes.

Two alternating pairs with 30 busy headers passed in 19.3 minutes. Normal-idle
main-thread CPU fell 70.59% and 71.27%; renderer CPU fell 57.17% and 60.20%.
Streaming CPU fell about 2% in both pairs; frame-gap p95 stayed about 50 ms.
Reduced-motion idle results were mixed. The extra 24 busy headers are seeded
status rows, not extra live executions. Six real mock producers remain.

The separate default six-busy-header comparison passed both pairs in 19.1
minutes. Streaming main-thread CPU changed by +0.16% and -0.05%, renderer CPU
was mixed, and frame-gap p95 stayed 50 ms. Normal-idle main-thread CPU fell
2.61% then increased 0.01%. These results establish no useful default streaming
gain. Neither series had a long task in its measured windows. All eight
samples verified 1,800 ordered updates and both offscreen chats caught up with
all 300 ticks. Each uses 1,000 tasks, 30 columns, and 9,600 stored messages.

At this preliminary checkpoint, production retention awaited six alternating
busy-header pairs. The completed repeat above now confirms the idle gain. The 148 related unit checks,
typecheck, strict scoped lint, build, and desktop/phone motion checks pass.
The first phone whole-column test moved horizontally; native scrolling kept
the icon visible. The corrected test moves vertically and asserts actual
viewport exclusion before checking pause, then inclusion before checking
resume. This was a fixture correction, not a production workaround.

[Preliminary evidence](evidence/owned-thread-motion-preliminary-1x.json) retains
all paired CPU/frame values, build identities, and catch-up results. Raw reports:
`matched-dense-1792821897277.json` and `matched-dense-1792823078900.json`.

## Deferred file-confirmation preparation: rejected

The timed profile identified repeated file-row confirmation preparation. A
candidate deferred fine-pointer desktop preparation until the confirmation was
requested, then retained the boundary across closes and pointer changes.
Phone and coarse-pointer actions stayed available immediately. Two translation
regressions failed first. A phone-with-mouse regression caught an initial
capability error; the corrected candidate passed all 87 related unit tests,
strict lint, typecheck, production build, two desktop deletion checks, and two
phone/tablet checks.

The first two alternating pairs passed 160 timed switches and 100 additional
retention switches per version in 13.7 minutes. P50 readiness improved 17.53%,
and main-thread/renderer CPU fell 12.18%/12.33% by median paired change. P95 was
mixed, including a 2,607 ms candidate against 1,390 ms baseline. These were
preliminary results and prompted six pairs rather than a retention decision.
Both versions retained one editor and three Dockview group content containers. Post-GC used heap grew
about 3.5 MB in each, which establishes neither a leak nor a memory gain.

The six-pair validation passed all 480 timed switches in 16.4 minutes with
1,000 tasks, two stored 1,000-message conversations, and the 630-file / 73-change
fixture per task. P50 readiness was 0.62% faster, with mixed directions. P95 was
2.34% slower across paired changes, with four pairs slower. Main-thread CPU was
0.04% higher and renderer CPU was 0.05% lower; both were mixed. The preliminary
gain did not reproduce. No useful navigation-speed or CPU gain is established.

The candidate and its specific test edits are removed. Production assets are
restored to the validated timestamp build. Keep the patch, built candidate,
and both complete series. The first six-pair attempt was interrupted during
preparation by the model/session interruption; its execution handles were
missing and no measured report had been created. The unchanged restart uses
separate logs and host samples. Its restricted execution environment is
recorded; it is not pooled with the preliminary series.

[Full evidence](evidence/rejected-deferred-file-confirmation-navigation-1x.json)
records all paired values, build hashes, validation, retention, and interruption
information. Six-pair report: `matched-navigation-1792817682151.json`; log:
`deferred-file-confirmation-six-pair-resumed-logs/kandev-run.e2e.FkBInRpT.log`.

## Timed navigation CPU attribution

The current retained build completed two identical-build profiles with 40 timed
switches each in 7.0 minutes. The fixture has 1,000 tasks, two stored 1,000-message
conversations, and the 630-file / 73-change tree per task. Both profiles contain
zero sampled `_ariaSnapshotForExpect` stacks. The streaming probe finding does
not justify changing these navigation waits.

Repeated costs include translation hooks, editor updates, static Markdown
parsing, virtualizer scroll writes, and Changes timeline anchor reads.
`recordTimelineAnchor` accounts for 1,226 and 1,422 ms of self sampled duration;
browser `scrollTo` calls account for 1,089 and 1,577 ms. These are profiler
samples, not CDP CPU counters. Both builds are identical, and profiling is
intrusive, so no product speed comparison is claimed. The next candidate must
preserve actual scrolling, focus, and confirmation behavior.

[Attribution evidence](evidence/timed-navigation-cpu-attribution.json) records
profile hashes, top self samples, and build identities. Raw report:
`matched-navigation-1792815554978.json`; log:
`timed-navigation-cpu-attribution-logs/kandev-run.e2e.DswMAwhJ.log`.

## Local text-motion cleanup: rejected

The reveal-compaction regression confirmed that cleanup reparses unchanged
Markdown. A candidate moved compaction into each motion span while preserving
synchronous selection checks, the 140 ms fade, DOM cleanup, and animation-handle
release. The parse-count regression failed first, then passed. All 129 related
unit tests passed, plus a repeated-reveal check, strict scoped lint, typecheck,
production build, two desktop checks, and two phone checks.

Two alternating pairs passed in 17.3 minutes with the corrected visibility
probe: 1,000 tasks, six visible chats, 120 primary messages plus two 100-message
sibling histories per task. All four samples verified 1,800 ordered updates;
there were no HTTP or verification errors. Streaming main-thread CPU changed
by -5.19% and +0.06%, so its direction was mixed. Renderer CPU fell 5.51% and
3.26%. Frame-gap p95 was unchanged in one pair and improved 9.96% in the other.
Reduced-motion idle main-thread CPU rose 2.81% and 10.57%; renderer CPU was
mixed. Long-task totals were mixed and include a candidate regression.

These results do not establish an overall gain. The candidate and its specific
test edits are removed. Production assets are restored to the timestamp build.
The patch and built candidate remain available for inspection. Do not repeat
this experiment without new evidence that addresses the measured tradeoffs.

The first attempt stopped after one complete pair when the next candidate
navigation returned `net::ERR_EMPTY_RESPONSE`, before application assets loaded.
The cause is not established. The preserved process log has no panic or fatal
record, and host load reached 18.93 on 16 logical CPUs. The unchanged retry
passed; workloads and time limits were not changed. Keep the failed report
`matched-dense-1792813050902.json` and its completed samples as separate evidence.

[Paired evidence](evidence/rejected-local-motion-compaction-1x.json) records all
metrics and identities. Retry report: `matched-dense-1792813854154.json`; log:
`local-compaction-two-pair-retry-logs/kandev-run.e2e.ehFMDNGD.log`.

## Final-visibility probe overhead

A current-build CPU attribution run passed both 1,800-update checks in 6.7
minutes (`matched-dense-1792811136016.json`,
`current-stream-cpu-attribution-logs/kandev-run.e2e.UI5WN7qR.log`). Both arms used
identical validated production assets. The profiles contain 9,241 and 14,828 ms
of inclusive sampled time under Playwright's `_ariaSnapshotForExpect` stack.
Those samples occur after the fixed 60-second stream window. These sampled
stack durations are not CDP thread CPU counters.

The installed Playwright 1.61.1 source confirms that an unsuccessful locator
expectation renders a full-page ARIA tree when its element is absent or not
visible. Waiting for the final marker can therefore repeatedly traverse the
dense page and add rendering pressure. This overhead is part of the older
completion-inclusive measurements. Their figures remain recorded, but they
must not be treated as pure application costs or pooled with corrected runs.
This finding does not invalidate asset byte counts or prove a product speedup.

The corrected timed gate polls `locator.isVisible()` with the same visibility
semantics and 30-second deadline. The full locator assertion runs after all
observation windows. Hidden, missing, and display-none content still fail; the
browser regression failed before implementation and passed afterward (1.4
seconds). The six-chat full-caller smoke passed both arms in 1.6 minutes
(`dense-visible-caller-smoke-logs/kandev-run.e2e.TX1uIdTV.log`).

Reports now record `finalVisibilityProbe: boolean-poll`. Older reports default
to `locator-assertion`, and the summary rejects mixed probe versions. All 14
summary tests pass, including three new RED/GREEN cases. Strict scoped lint
passes. A final metadata full-caller smoke passed in 38.5 seconds
(`matched-dense-1792811987862.json`, `dense-visible-version-smoke-logs/`), and its
summary confirms the new probe in both arms. These smokes validate the harness;
the corrected dense A/B measurements remain pending.

The corrected dense profile passed in 5.4 minutes from commit `498956f7795`
(`matched-dense-1792812289501.json`). Both identical-build samples verified all
1,800 ordered updates. Neither profile contains sampled
`_ariaSnapshotForExpect` stacks. This confirms removal of the identified
measurement overhead. It does not establish a product speedup.

[Attribution evidence](evidence/visibility-probe-attribution.json) records
profile hashes, build identities, stack timing, and verification results.

## Current retained-build navigation comparison

The retained build at `04cb2eb13179abf1b9cd7b4b2699e9fc6103ce1e` completed six
alternating pairs against the original baseline in 24.1 minutes. This includes
the selection and timestamp repairs added after the earlier navigation reference.
There was no source patch. Both versions used the same database snapshot:
1,000 tasks, two conversations with 1,000 seeded messages each, and a 630-file
fixture tree with 73 changed files per task. All 480 timed switches passed the
destination file-marker gate. These are stored-history counts, not a claim that
all 1,000 messages were visible during each switch.

Switch-readiness p50 was 0.08% slower and p95 was 0.32% slower across paired
changes; both had mixed directions. This is no demonstrated readiness gain.
Main-thread CPU was 2.48% higher and renderer CPU was 2.30% higher, with five of
six pairs higher. Keep both slow candidate samples: pair 1 p95 was 1,840 ms
against 1,509 ms; pair 5 was 2,763 ms against 1,734 ms. All per-pair values are
in the [committed evidence](evidence/current-navigation-1x.json). The earlier
reference remains historical evidence; it is not replaced or pooled with this
run.

The separate first-pair retention checks made 100 additional switches per
version. Both retained one editor and three Dockview panels. Post-GC used heap
rose from 92.95 to 99.62 MB in baseline and 85.82 to 90.25 MB in candidate. These
observations do not establish a leak or a memory improvement. Timing ends at
the destination file marker plus two animation frames; it is not INP, screen
presentation, or full conversation/composer readiness.

The first attempt failed during preparation before any timed sample
(`current-navigation-six-pair-logs/kandev-run.e2e.x9zZWfvE.log`, 4.2 minutes).
The error snapshot showed Loading changes; the later screenshot contained the
correct task-specific marker and all 73 changed files. The unchanged retry
passed. No timeout, workload, or readiness criterion changed. Failure artifacts
remain in `current-navigation-preparation-failure/`.

Raw report: `matched-navigation-1792808464087.json`; summary:
`current-navigation-six-pair-summary.json`; log:
`current-navigation-six-pair-retry-logs/kandev-run.e2e.C4KJfsUn.log`; host samples:
`current-navigation-six-pair-retry-host-load.jsonl`. Candidate assets:
`8379f62eb1bf4935c6b18d4616f732191cdefc17159c02367a54c05701f7a160`;
candidate backend:
`b6a65c8046a00cd45f3d9dcb9beb11ee1783c85633cc13f1f18b9594bae4aed9`.

## Direct SVG offscreen visibility: rejected

Two alternating columns pairs passed with 1,000 tasks, 30 headers, four visible
chats, and 1,800 ordered updates per sample. Both offscreen producer chats
caught up exactly after timing. Normal idle CPU was mixed. Streaming main-thread
CPU increased 0.89% across pairs and renderer CPU increased 2.44%; both pairs
were higher. Frame-gap p95 was 50.1 → 66.7 ms and 50 → 50 ms. Pausing two
additional animations did not demonstrate a CPU gain. The candidate is removed;
the visibility gap remains open. See the [full paired evidence](evidence/rejected-direct-svg-visibility-1x.json)
and [work order](task-03-motion-eligibility.md). No grid follow-up is run for the
rejected candidate.

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

### Candidate-first 4x retry

The candidate-first retry (`matched-dense-1792800977298.json`, source
`4348eee3946`) failed the unchanged 30-second final-visible gate after the
scheduled stream window. Cold readiness passed in 38,726 ms. All six chats
started with 100 loaded messages. Cold, idle, and stream-deadline captures had
zero HTTP failures. The run took 21.7 minutes and saved no complete samples;
it is overload evidence, not a paired timing result.

Diagnostic storage reads at 2026-10-24 00:19:46.599–610 UTC found 300 unique
ticks per chat with last tick 299. Browser inspection at 00:19:58.822–835 UTC,
about 12.2 seconds later, found only 215–216 ticks per chat (last tick 214–215).
The candidate therefore had a substantial display backlog after all updates
were stored. This diagnostic count check does not replace the benchmark's
ordered-sequence assertion, which was not reached.

The raw report, backend log, launch receipt, host-load log, and failure captures
remain under the diagnostic directory; captures are in
`reference-grid-4x-candidate-first-failure/`. The next bounded experiment will
schedule existing plain-agent updates fairly across sessions. New messages,
user input, permission changes, deletes, and turn completion must preserve
immediate ordering. The previous all-session frame batch remains rejected.

## CPU audit of rejected experiments

Recalculation from the captured CPU counters supports the previous decisions.
The spinner wrapper increased normal-idle main-thread CPU by 7.21% and renderer
CPU by 7.84% in median paired changes. Containment increased streaming CPU by
3.14% and 4.50%, respectively. Composer changes had mixed streaming results
and worse idle CPU. Tree identity changes increased switching CPU by 22.95%
and 19.92%. Row lookup changes showed absent or small CPU gains with mixed
frame results; all-session batching increased CPU and frame gaps. No rejected
experiment was reinstated. See the [paired CPU audit and raw provenance](evidence/rejected-experiment-cpu-audit.json).

The six-pair navigation comparison also now has [committed CPU and retention
evidence](evidence/reference-navigation-1x.json). Main-thread CPU increased
7.06%, and renderer CPU increased 5.69% in median paired changes. The existing
p95 switching regression remains 10.25%. After the separate 100-switch arm,
both builds retained one editor and three Dockview group content containers. Post-GC JS heap rose from
93,131,240 to 96,536,020 bytes for baseline and 85,695,184 to 89,883,244 bytes
for candidate. These isolated snapshots do not establish a leak or a memory fix.

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

## Current grid renderer attribution

A separate full-reference quiet run on original `595df36` and current assets
`9f2b7a96` passes both streaming samples and all ordered-content checks. Each
sample has six visible chats, 100 loaded messages per chat, 36,000 stored
messages, and 1,800 scheduled updates. Both CPU profiles cover their measured
windows; no sampled ARIA inspection functions were found.

The current profile samples about 4.24 seconds in the selection guard. About
3.56 seconds comes from content updates and 0.674 seconds from cleanup timers.
React rendering and context propagation are also prominent. These overlapping
stacks are attribution evidence. This single profiled pair is excluded from
speed summaries and does not explain the separate scripted scroll failure.

[Complete evidence](evidence/current-grid-render-cpu-attribution.json) retains
profile hashes, mapped bundle locations, caller costs, and limitations. A
separate stream-quiet cleanup experiment was rejected after two full-reference pairs.

## Rejected stream-quiet cleanup experiment

The experiment kept the 140 ms fade and delayed wrapper compaction until a
300 ms quiet period. It passes 68 relevant unit checks, typecheck, lint, build,
and four desktop/phone browser checks. Its new unit regression halves parses
between regularly spaced appends, but that result does not establish a dense
workbench speed gain.

Two alternating full-reference pairs pass in 31.8 minutes, with 7,200 ordered
updates, no HTTP failures, and no verification retries. Streaming main CPU
changes by -0.17% and +0.23%; renderer CPU changes by -0.46% and +1.58%. Both
builds nearly saturate the main thread. Streaming p95 changes from 100.1 to
100 ms and from 116.6 to 100 ms. Maximum streaming gap is mixed: 133.4 to
166.6 ms, then 166.7 to 150.1 ms.

Reduced-motion idle CPU is mixed. Its maximum frame gap rises from 50 to about
66.7 ms in both pairs; the cause is unconfirmed. Initial idle CPU is modestly
lower and p95 is unchanged. These preliminary results do not show a repeatable
streaming CPU gain. The experiment and its tests were removed. The retained
production assets remain `9f2b7a96`.

[Complete evidence](evidence/rejected-stream-quiet-cleanup-1x.json) preserves
all paired metrics, exact builds, the rejected patch hash, correctness checks,
and host observations. This is a separate 9f-to-experiment comparison, not the
final original-baseline package comparison.

## Rejected context stability candidate

Read-only React diagnostics identify repeated recovery and editor context
updates during a fixed 300-update canonical stream. Structural sharing and
memoization remove both sets of updates. The candidate passes 113 relevant
unit checks, typecheck, lint, build, six desktop checks, and fourteen phone
checks. File-link context is stable already and was not changed.

The separate uninstrumented two-pair attempt is interrupted after one completed
pair. Its streaming main CPU changes by -0.49%, renderer CPU by -0.99%, and
frame-gap p95 from 116.7 to 116.6 ms. This does not establish a useful speed
gain. Initial and reduced-motion idle CPU are higher in the completed candidate
sample; causes are unconfirmed. The second candidate has two saved windows,
but no completed sample or matching second control. The attempt remains incomplete.

Both production changes and both tests were removed. The exact retained
`9f2b7a96` asset tree is restored. Fourteen surviving disposable backend and
mock processes were identified by the exact inherited benchmark marker and
process start identity, then stopped with SIGTERM. No forced kill was needed.

[Attribution evidence](evidence/context-stability-attribution.json) includes
the diagnostic source and counts. [The interrupted result](evidence/interrupted-context-stability-1x.json)
preserves the rejected patch, first-pair metrics, partial checkpoint summary,
raw hash, correctness checks, and cleanup audit. No complete two-pair or M2
performance claim follows. Remaining work returns to the final comparison matrix.

## Request-cause calibration and column failure evidence

Private observer builds now join each physical history read to an explicit
call-site cause by transport and request ID. Five candidate browser cases pass:
all 32 reads have a cause, with no collector errors. The original-version
observer also classifies all 85 captured reads. Its two real native lifecycle
cases fail the unchanged hidden-read bound; three other cases pass. Different
completion paths make these totals unsuitable for a speed comparison.

The real native fixture has no active turn ID. Scheduled backfill is therefore
calibrated separately with a backend-seeded unfinished turn whose eligibility
is verified in the browser. Actual tab hiding pauses its reads. Restoring the
tab must produce a new foreground read. The real native cases still verify
ordered updates, draft and scroll retention. Both builds, negative controls,
source identities, and earlier failures are retained in
[the calibration evidence](evidence/read-cause-calibration.json).

The column verifier now retains the exact failed visit, completed visits,
assertion stage, bounded DOM observation and image before cleanup. Observation
occurs after the original failure and is labelled accordingly. Three genuine
RED regressions become GREEN; four final browser checks, 15 Node checks and
strict scoped lint pass. Native scroll calls, visit order and assertion bounds
are unchanged. The original assertion remains the reported failure if diagnostic
writing fails. See [the failure-evidence checks](evidence/column-traversal-diagnostics.json).
These synthetic faults do not attribute the earlier dense activation failure.
Production assets are unchanged; full-density attribution, the remaining
matrix and the completion gates stay open.

## Full-density Dockview read causes

A separate diagnostic pair passes on the frozen private observer builds. The
fixture has 1,000 tasks, 36,900 stored messages, 630 profile files and 73 changes.
Both arms verify all 1,800 ordered updates and hidden-tab catch-up. Every
physical history read has an explicit cause and no collector error.

During streaming, the original version issues 617 core gap-recovery reads,
295 plugin message-rebind reads and 295 plugin turn-rebind reads. The candidate
issues zero reads for those three causes. Scheduled backfill remains: 16
streaming reads on the control and 24 on the candidate. That count difference
is not attributed. The control also has 74 recovered HTTP 409 responses;
the candidate has zero. All requests, failures and phases remain recorded.

This trace explains repeated read paths. It does not measure a speed gain.
The speed-summary guard rejects it despite both successful attempts. Frozen
app sources, runtime/helper hashes, exact raw reports and backend logs are
verified, and the disposable instance stops cleanly. See
[the cause evidence](evidence/full-density-dockview-read-causes.json).
The final uninstrumented timing matrix, Threads attribution and private
100-switch ownership proof remain open.

## Editor user-subscription cleanup

The private full-reference ownership check finds a missed cleanup in
`useEditors`. Its mount effect acquires a user-subscription reference without
releasing it on unmount. Both the original and retained candidate grow from
97 to 297 user references after 100 task switches. Session references, actual
API panels, editors and acknowledged scope roles remain stable. The increasing
counter is separate from those wire and panel counts.

The effect now releases the same client that it acquired. Three new unit
regressions fail before this repair, and all 14 related checks pass afterward.
Both production and private observer typechecks and builds pass. The fixed
observer completes the full 1,000-task, 2,000-message navigation check: user
references stay at five after 100 switches. Native Settings navigation clears
all session references, editors, API panels and acknowledged task/session
scopes on the same document, client and connection epoch. The single root user
subscription remains. The original negative control and its failure are retained.

The uninstrumented candidate is `39be7b61`; its private proof bundle is
`5cf52600`. All 33 desktop and 17 phone checks pass, and four selected
captures are inspected. The phone runner exits zero; its interrupted parent
receipt is recovered from the exact wrapper, raw log and Playwright state.
The parent termination remains separately recorded. These are ownership
correctness results, not a speed or memory-saving estimate. Existing `820f`
measurements keep their old build scope. The new final performance matrix and
remaining Threads attribution stay open. See
[the repair evidence](evidence/editor-user-subscription-ownership.json).
