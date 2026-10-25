# Dense workbench completion audit

Status: incomplete. This audit preserves the approved scope in
[the plan](plan.md) and [benchmark protocol](benchmark.md). A targeted gain does
not complete the package. Existing results remain evidence for their recorded
builds, fixtures, and probes; they do not automatically verify the final build.

## Latest build checkpoint

Production commit `7a984021113` repairs native wheel following when streamed
content grows between input and the resulting scroll. Its immutable asset hash
is `820fcd57e5ecaf8d39c610f13cfbfabf4cd8dea4e64e555a57522fd3823c9a5d`.
The build passes 228 related unit checks and the combined 33 desktop and 17
phone browser checks. A short original-wheel candidate rehearsal returns to
zero pixels from the bottom while the frozen baseline fails at 21 pixels.
The eight-column rehearsal passes both arms. See
[the build and correctness evidence](evidence/native-wheel-bottom-follow.json).
These checks establish correctness within their scope, not a speed gain.

Commit `4fda423daf7` records the complete attempt plan and continues independent
samples after a failure while preserving final failure. Its controlled fault
check verifies that both candidate attempts execute after control failures;
summary validation rejects incomplete or failed plans. See
[the harness evidence](evidence/dense-attempt-continuation.json).
The original native wheel sequence and deadlines remain unchanged. An easier
explicit-follow scenario does not replace this matrix.

The next six-pair grid attempt stopped after one complete pair when a read-only
audit found one tracked file and zero profile files in all six canonical
repositories. Its data, ten pending attempts, logs, and interruption reason
are retained. The summary rejects the incomplete plan despite its absent
top-level error ([gap evidence](evidence/threads-reference-file-gap.json)).

The repaired Threads seed now supplies 630 profile files and 73 changes in
each prepared producer environment. It records the actual task count and
verifies content hashes before and after each sample, outside timing. The
regression, 53 Node checks, strict lint, default grid, scripted columns, and
full-plugin Dockview callers pass ([fixture evidence](evidence/threads-reference-file-fixture.json)).
The corrected full-reference grid executes all 12 attempts: five pass and seven
fail, leaving only one complete pair. Its five complete samples verify 9,000
ordered updates. The series fails summary validation, and native-wheel repair
remains insufficient at full load. Cold readiness and native input failures
need attribution. The full matrix remains open. See
[the complete failure evidence](evidence/reference-files-grid-failed.json).
Earlier Threads series retain their recorded chat/history density and file-state limit.

The next full-reference column attempt times out at its one-hour start gate.
The agent does not release that gate before its bound expires. All twelve
attempts remain pending, and no measurement is created. The original report,
runner log, summary rejection, and Playwright artifacts are retained. This is
an orchestration failure, with no product-performance conclusion
([evidence](evidence/columns-start-gate-timeout.json)). The fresh retry removes
the pending gate and keeps the same workload, inputs, deadlines, and builds.

That retry executes all twelve column attempts: ten pass and two fail. Five
pairs complete, verifying 18,000 ordered updates in complete samples. The last
control misses the native return-bottom bound. The last candidate completes
its three windows, then cannot show the first producer's chat during column
traversal. The exact traversal visit and activation cause are unknown. All
twelve backend logs, native-step timings, and the control failure image are
retained. Summary validation rejects the series
([evidence](evidence/reference-files-columns-failed.json)). No final column
speedup follows from five passing pairs.

The final asset audit verifies all 552 compressed siblings, exact decode and
deterministic regeneration, and complete smaller-only coverage
([evidence](evidence/final-assets-byte-audit.json)). Fresh focused receipt race
tests pass all four PostgreSQL leaves and their SQLite cases on a new private
cluster, with no PostgreSQL skip and a clean stop
([evidence](evidence/final-receipt-postgres-leaves.json)). These checks do not
establish page-load, CPU, or task-switching gains.

The failure-evidence update passes 57 Node checks, four browser regressions,
fault continuation, and healthy Threads, full-plugin Dockview, and isolated
navigation callers. A first combined navigation marker-setup failure remains
retained and unattributed. Evidence capture changes no application code, native
input sequence, or deadline. See
[the diagnostic validation](evidence/failure-diagnostics.json).

Previous grid, Dockview, navigation, and motion results below also remain
limited to their recorded build identities. Final-build coverage, stress,
full-history loading, ownership retention, and regression attribution remain
open. Earlier failures are retained.

## Current evidence and remaining proof

| Requirement | Current evidence | Remaining proof |
| --- | --- | --- |
| Freeze both builds and use disposable equivalent data | Existing manifests, database backup hashes, canonical fixture assertions, and paired reports | Final retained source/patch, binary, assets, lockfile, harness, and plugin bundle identities |
| Reference file-state coverage | The missing Threads file state is reproduced and repaired. Targeted default-grid and scripted eight-column callers now verify 630 profile files, 73 changes, mapped identities, actual task count, and matching file hashes on both builds. The shared Dockview helper passes its full-plugin caller ([evidence](evidence/threads-reference-file-fixture.json)) | Collect the final reference matrix with the repaired seed. Older Threads series do not prove this dimension |
| Incremental conversation delivery and real gap recovery | WO02 tests and retained binary; native/plugin recovery browser cases | Inspect linked receipts and final targeted browser gates; retain scheduled backfill separately |
| Persistent motion lifecycle | WO03 desktop/phone checks and six-pair busy-header comparison | Include final visibility variants and distinguish the busy-header fixture from the default workload |
| Asset compression and lazy editor loading | WO04 handler/build/import tests and earlier cold-byte comparison | Final cold-load comparison with corrected visibility probe |
| Hidden Changes presentation work | Baseline attribution: 720 hidden scroll reads over 40 switches; candidate: zero. Baseline hidden-update/resize row moves 106 px; candidate passes. 77 unit tests, 12 existing desktop checks, and phone rerun pass | Six-pair confirmation passed; targeted rendering gain retained in [evidence](evidence/hidden-changes-six-pair-1x.json). Pushed in `90a440a9747`; final full-package comparisons remain pending. |
| Final grid cold, idle, streaming, and reduced-motion comparison | Earlier six pairs use older assets and the old final-visible assertion | The corrected file-state run executes all twelve attempts: five pass and seven fail, with one complete pair ([evidence](evidence/reference-files-grid-failed.json)). It verifies file state where reached and 9,000 ordered updates in complete samples; no final speed summary is valid. The current wheel repair remains insufficient. Earlier: The corrected scripted attempt passes four pairs, then stops in the fifth control sample on the return-bottom assertion. Candidate streaming p95 is worse in all four completed pairs. The failure is retained and the summary rejects it ([evidence](evidence/final-scripted-grid-failed-attempt.json)). A separate current-build CPU profile now identifies substantial React rendering and synchronous selection work ([evidence](evidence/current-grid-render-cpu-attribution.json)). A stream-quiet cleanup experiment is rejected after two neutral CPU pairs ([evidence](evidence/rejected-stream-quiet-cleanup-1x.json)). A recovery/editor context candidate also removes targeted notifications but is rejected after an interrupted comparison with essentially unchanged first-pair streaming metrics ([evidence](evidence/interrupted-context-stability-1x.json)). Six complete pairs, interaction diagnosis, and further frame-cost attribution remain open |
| Final columns idle, streaming, and fixed first/middle/last traversal | Targeted owned-header series use 120 primary messages, not the full reference history | Scripted eight-column paired rehearsal now verifies first/middle/last/first, including a non-producer, plus offscreen catch-up ([evidence](evidence/scripted-threads-harness.json)). The corrected final file-state run executes twelve attempts: ten pass and two fail, with five complete pairs and no accepted six-pair summary ([evidence](evidence/reference-files-columns-failed.json)). The final candidate loses a chat during traversal after its timed windows; the final control fails native return-bottom. The earlier full reference attempt stops in the first control stream on the return-bottom check ([earlier failure](evidence/final-scripted-columns-failed-attempt.json)). The shorter-history instrumented wheel diagnostic passes both builds without reproducing the failure; its candidate button check occurs after streaming ([diagnostic evidence](evidence/scroll-follow-attribution.json)). Root cause and six complete pairs remain pending |
| Dockview idle and streaming | Correctness covers focus, saved layouts, and visible unfocused Changes; navigation timing covers Files-active task switches. A two-chat stream-target browser regression and unchanged Threads caller now pass ([evidence](evidence/dockview-stream-targets.json)). Dense core and full-plugin fixture layouts now pass, including the plugin on the original baseline; selected histories, task counts, files, real environments, and API panels are checked ([evidence](evidence/dockview-dense-fixture.json)) | Small paired core/plugin callers now pass on both builds, including a previously opened hidden chat, retained draft, all six ordered streams, and separate plugin HTTP traffic ([evidence](evidence/dockview-timed-caller.json)). Full core six-pair comparison now passes ([evidence](evidence/final-dockview-core-six-pair-1x.json)): about 96.2% fewer streaming history reads, 11.4% lower median paired renderer CPU, and 81.0% lower reduced-motion idle main CPU. Full-plugin six pairs also pass ([evidence](evidence/final-dockview-plugin-six-pair-1x.json)): 95.6% fewer core history reads, zero plugin streaming reads, and 12.6% lower median paired renderer CPU. The optional profiler identifies the four residual reduced-motion animations as shared host Spinner instances on plugin composer buttons ([evidence](evidence/dockview-cpu-attribution-harness.json)). The shared CSS repair now passes ten desktop/phone checks and six isolated pairs, with 79.82% lower reduced-motion main CPU and 69.65% lower renderer CPU in every pair ([evidence](evidence/plugin-spinner-motion-six-pair-1x.json)). Mixed idle results and frame/CPU regressions still need attribution |
| Switching scenarios | Existing task-to-task Files-active timing and draft/context correctness | Separate same-environment tabs, compatible-layout tasks, and incompatible-layout restoration with 40 selections after five warmups; browser-event readiness markers where specified. The opt-in recorder now passes its browser regression and both caller modes; the incompatible-layout regression and full caller now pass ([evidence](evidence/navigation-layout-rebuild.json)); the session-tab regression and both-build caller now pass with a real shared environment and retained draft ([evidence](evidence/navigation-session-tabs.json)); compatible-task 1x timing now passes six pairs ([evidence](evidence/final-task-switch-six-pair-1x.json)); incompatible-layout 1x timing now passes six pairs ([evidence](evidence/final-incompatible-layout-six-pair-1x.json)); session-tab 1x timing now passes six pairs ([evidence](evidence/final-session-tabs-six-pair-1x.json)); 4x switching stress remains pending |
| Expanded/collapsed composers and visibility | Existing motion correctness and targeted attribution | Audit scenario records for normal/reduced motion, offscreen columns, hidden Dockview tabs, and actual document hide/restore; The earlier native probe stayed visible because Playwright enables focus emulation. An owned external Chromium default context with `noDefaults: true` now passes actual core/plugin hide-and-restore checks, including updates, draft/scroll retention, paused motion, foreground refresh, and plugin-local expansion ([evidence](evidence/native-document-visibility.json)). This is native browser behavior without property overrides. The final combined desktop suite also passes both core/plugin cases ([evidence](evidence/final-targeted-correctness.json)) |
| Long-history stress | Earlier all-history attempt failed within the unchanged 360-second load bound | Final-build attempts with verified loaded counts; report overload if a full sample cannot complete |
| 4x CPU stress | Earlier cold and warm attempts contain failures and incomplete samples | Same final desktop scenarios, with cold and throttle-after-load modes kept separate; retain every failed attempt |
| Retention after 100 switches | Existing and preliminary candidate runs retain one editor and three Dockview group content containers | Final compatible-task checks retain one editor and three Dockview group content containers on both arms after 100 switches. Incompatible-layout checks also retain one editor and three group containers, with about 18 MB used-heap growth per arm. Session-tab checks retain two editors and three group containers, with about 2 MB used-heap growth per arm. A separate small paired 100-switch check now verifies actual API panels, editors, acknowledged wire scopes, and same-document release. It exposed and verifies the departed-API cleanup ([evidence](evidence/dockview-api-release.json)). The fixed private full-reference candidate now verifies stable reference counts through 100 switches and same-document Settings release ([evidence](evidence/editor-user-subscription-ownership.json)). The original counter-growth failure remains. The new uninstrumented final matrix stays pending; no leak inference from one heap sample |
| Phone parity and final correctness | Native phone composition, history, and deep-tree rerun pass for current candidate | Final combined verification passes 33 desktop and 17 phone cases, including recovery, drafts/navigation, scroll, motion, and native phone input. Selected captures are inspected ([evidence](evidence/final-targeted-correctness.json)). The unexplained initial deep-tree failure remains preserved; dense timing/stress are separate |
| Delivery and reporting | Production fixes pushed through `f5c8fb8f6ab`; compatible-task evidence pushed in `e9a849ab745` and incompatible-layout evidence in `63c1b8da509` | Final normal-hook commits/pushes, accurate work-order statuses, companion records, public-doc impact check, reproducible commands, and Kandev rich results |

## Current candidate limits

The two preliminary navigation pairs reduce style-recalculation time by 6.08%
and 9.13%, and long-task count by 13.39% and 9.24%. Total CPU and median switch
readiness are essentially neutral. Six separate alternating pairs passed. Style time fell 10.41% and long-task
count fell 5.50% by median paired change, both lower in every pair. Main-thread
CPU fell 2.46% across paired changes but regressed in the first pair. p95
readiness was 0.14% slower and remains essentially neutral. The fix is retained
for its targeted rendering and row-retention benefits.
Do not claim an overall task-switch speedup from reduced hidden-read counts.

The phone deep-tree test failed once before file actions because its heading
remained mounted after scrolling. The same test passed alone and with the
history case on the retained build, then both unchanged candidate cases passed.
The failure is preserved; its cause is unconfirmed.

The first navigation timing attempt recorded zero samples because the frozen
owned-motion bundle lacked its relative mock-agent executable. The same
mock-agent and agentctl helpers as the candidate were added and hash-checked.
The retained application binary and assets were unchanged. This was fixture
setup failure, not a measured product regression.

## Saved-layout arrangement finding

The new layout benchmark exposed an existing restoration issue: moving Files
into a third column in task B leaves that arrangement in task A after switching
back. Explicit persistence of both environments reproduces the failure.
The previous `layout-manager/comparator.ts:savedLayoutMatchesLive` compared
structural panel counts without checking arrangement. The failure artifacts are retained under
`navigation-layout-inherited-failure` and `navigation-layout-persisted-failure`.
The candidate now compares root orientation and recursive structural group shape.
The same-inventory browser regression restores both arrangements and drafts;
75 unit tests, typecheck, lint, final build, original-baseline caller smoke, and
four phone checks pass. See [the repair evidence](evidence/layout-arrangement.json).
The distinct-inventory benchmark remains useful for paired rebuild timing on
both versions. Compatible-task timing now passes six pairs. Incompatible-layout timing also passes six pairs, with small mixed gains and an unmet 20% warm-p95 target.

## Completion rule

Close each row only with evidence whose build, fixture, scenario, and measurement
scope match the requirement. Keep missed experiment targets and unresolved
owners explicit. Do not infer M2 Air performance, field INP, battery savings,
or a memory leak from Linux Chromium measurements.

## Retention counter scope

The legacy report field `panels` counts `.dv-content-container` elements.
Dockview 4.13.1 constructs one such content container per group
(`dockviewGroupPanelModel.js:161`), so this is a group-container count.
It does not count API panel objects or subscription owners. Keep the raw field
for historical comparisons; actual API panel and acknowledged wire-scope retention now have a separate
small paired check. Private reference counts and dense retention remain distinct
open checks. No timing calculation changes.

## Public documentation impact

The retained fixes preserve the existing commands, configuration, API, labels,
layout, and interaction model. They repair delivery, presentation eligibility,
asset transfer, layout restoration, and scroll following within those contracts.
The public [Threads composer and chat motion guide](../../public/sessions-and-review.md)
still describes the resulting behavior: independent transcript scrolling,
reduced-motion disclosure, retained drafts, and the existing auto-scroll setting.
No new public setup step or setting is introduced. The internal benchmark
protocol documents continued failed attempts, and
[the Mac reproduction guide](mac-reproduction.md) keeps native commands separate
from this Linux runner. This assessment does not close the remaining measurement
or regression-attribution gates.

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

## New production Grid reference

The uninstrumented `39be7b61` build completes all 12 planned Grid attempts
against the original `312770e3` control. The workload stays at 1,000 tasks,
30 columns, 36,000 stored messages, six canonical streams and 60-second
windows. All six original attempts pass. Five candidate attempts pass;
`candidate-1x-2` fails the unchanged native scroll-up check during streaming.
The 11 complete samples verify 19,800 ordered updates.

Both hover steps and the composer reveal finish before the failed wheel
action. The five-second predicate expects a position below 52,067 pixels
and receives 52,488 pixels. A later snapshot is separate evidence. The trace
does not capture the actual wheel target or first native scroll response,
so the production cause remains unknown. Capture those events in a separate
diagnostic before changing scroll behavior. Do not change the original
inputs or deadlines.

The failed report is correctly rejected by the summary guard. No speed
comparison is published from its five complete pairs. All raw attempts,
12 backend logs and the failure screenshot are retained; runtime and helper
identities remain exact, and the temporary instance stops cleanly. The other
19 new-build matrix cases remain pending. Earlier `820f` failures retain
their original scope. See [the Grid evidence](evidence/reference39be-grid-failed.json).
