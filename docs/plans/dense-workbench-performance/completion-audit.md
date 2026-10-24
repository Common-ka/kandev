# Dense workbench completion audit

Status: incomplete. This audit preserves the approved scope in
[the plan](plan.md) and [benchmark protocol](benchmark.md). A targeted gain does
not complete the package. Existing results remain evidence for their recorded
builds, fixtures, and probes; they do not automatically verify the final build.

## Current evidence and remaining proof

| Requirement | Current evidence | Remaining proof |
| --- | --- | --- |
| Freeze both builds and use disposable equivalent data | Existing manifests, database backup hashes, canonical fixture assertions, and paired reports | Final retained source/patch, binary, assets, lockfile, harness, and plugin bundle identities |
| Incremental conversation delivery and real gap recovery | WO02 tests and retained binary; native/plugin recovery browser cases | Inspect linked receipts and final targeted browser gates; retain scheduled backfill separately |
| Persistent motion lifecycle | WO03 desktop/phone checks and six-pair busy-header comparison | Include final visibility variants and distinguish the busy-header fixture from the default workload |
| Asset compression and lazy editor loading | WO04 handler/build/import tests and earlier cold-byte comparison | Final cold-load comparison with corrected visibility probe |
| Hidden Changes presentation work | Baseline attribution: 720 hidden scroll reads over 40 switches; candidate: zero. Baseline hidden-update/resize row moves 106 px; candidate passes. 77 unit tests, 12 existing desktop checks, and phone rerun pass | Six-pair confirmation passed; targeted rendering gain retained in [evidence](evidence/hidden-changes-six-pair-1x.json). Pushed in `90a440a9747`; final full-package comparisons remain pending. |
| Final grid cold, idle, streaming, and reduced-motion comparison | Earlier six pairs use older assets and the old final-visible assertion | Six alternating pairs on original baseline versus final retained build with corrected probe |
| Final columns idle, streaming, and fixed first/middle/last traversal | Targeted owned-header series use 120 primary messages, not the full reference history | Scripted eight-column paired rehearsal now verifies first/middle/last/first, including a non-producer, plus offscreen catch-up ([evidence](evidence/scripted-threads-harness.json)). Full reference fixture and six pairs remain pending |
| Dockview idle and streaming | Correctness covers focus, saved layouts, and visible unfocused Changes; navigation timing covers Files-active task switches. A two-chat stream-target browser regression and unchanged Threads caller now pass ([evidence](evidence/dockview-stream-targets.json)). Dense core and full-plugin fixture layouts now pass, including the plugin on the original baseline; selected histories, task counts, files, real environments, and API panels are checked ([evidence](evidence/dockview-dense-fixture.json)) | Small paired core/plugin callers now pass on both builds, including a previously opened hidden chat, retained draft, all six ordered streams, and separate plugin HTTP traffic ([evidence](evidence/dockview-timed-caller.json)). Full core six-pair comparison now passes ([evidence](evidence/final-dockview-core-six-pair-1x.json)): about 96.2% fewer streaming history reads, 11.4% lower median paired renderer CPU, and 81.0% lower reduced-motion idle main CPU. Full-plugin six pairs also pass ([evidence](evidence/final-dockview-plugin-six-pair-1x.json)): 95.6% fewer core history reads, zero plugin streaming reads, and 12.6% lower median paired renderer CPU. Mixed idle results, four residual reduced-motion animations, and frame/CPU regressions still need attribution |
| Switching scenarios | Existing task-to-task Files-active timing and draft/context correctness | Separate same-environment tabs, compatible-layout tasks, and incompatible-layout restoration with 40 selections after five warmups; browser-event readiness markers where specified. The opt-in recorder now passes its browser regression and both caller modes; the incompatible-layout regression and full caller now pass ([evidence](evidence/navigation-layout-rebuild.json)); the session-tab regression and both-build caller now pass with a real shared environment and retained draft ([evidence](evidence/navigation-session-tabs.json)); compatible-task 1x timing now passes six pairs ([evidence](evidence/final-task-switch-six-pair-1x.json)); incompatible-layout 1x timing now passes six pairs ([evidence](evidence/final-incompatible-layout-six-pair-1x.json)); session-tab 1x timing now passes six pairs ([evidence](evidence/final-session-tabs-six-pair-1x.json)); 4x switching stress remains pending |
| Expanded/collapsed composers and visibility | Existing motion correctness and targeted attribution | Audit scenario records for normal/reduced motion, offscreen columns, hidden Dockview tabs, and actual document hide/restore; Headless native tab/minimize probe stays visible with no visibility event ([evidence](evidence/scripted-threads-harness.json)); actual document hiding needs headed/native confirmation. Synthetic property overrides do not satisfy it |
| Long-history stress | Earlier all-history attempt failed within the unchanged 360-second load bound | Final-build attempts with verified loaded counts; report overload if a full sample cannot complete |
| 4x CPU stress | Earlier cold and warm attempts contain failures and incomplete samples | Same final desktop scenarios, with cold and throttle-after-load modes kept separate; retain every failed attempt |
| Retention after 100 switches | Existing and preliminary candidate runs retain one editor and three Dockview group content containers | Final compatible-task checks retain one editor and three Dockview group content containers on both arms after 100 switches. Incompatible-layout checks also retain one editor and three group containers, with about 18 MB used-heap growth per arm. Session-tab checks retain two editors and three group containers, with about 2 MB used-heap growth per arm. A separate small paired 100-switch check now verifies actual API panels, editors, acknowledged wire scopes, and same-document release. It exposed and verifies the departed-API cleanup ([evidence](evidence/dockview-api-release.json)). Full-reference ownership and private reference-count coverage remain distinct; no leak inference from one heap sample |
| Phone parity and final correctness | Native phone composition, history, and deep-tree rerun pass for current candidate | Final targeted recovery, task-switch/draft, scroll, and motion cases; inspect captures and preserve the unexplained initial deep-tree failure |
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
