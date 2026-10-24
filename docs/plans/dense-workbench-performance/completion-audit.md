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
| Final columns idle, streaming, and fixed first/middle/last traversal | Targeted owned-header series use 120 primary messages, not the full reference history | Full reference fixture, six pairs, traversal and offscreen catch-up evidence |
| Dockview idle and streaming | Correctness covers focus, saved layouts, and visible unfocused Changes; navigation timing covers Files-active task switches | Two visible chats, retained hidden tabs, plan/files/changes panels, six paired observations, and core/plugin arms |
| Switching scenarios | Existing task-to-task Files-active timing and draft/context correctness | Separate same-environment tabs, compatible-layout tasks, and incompatible-layout restoration with 40 selections after five warmups; browser-event readiness markers where specified. The opt-in recorder now passes its browser regression and both caller modes; the incompatible-layout regression and full caller now pass ([evidence](evidence/navigation-layout-rebuild.json)); dense runs and the session-tab scenario remain pending |
| Expanded/collapsed composers and visibility | Existing motion correctness and targeted attribution | Audit scenario records for normal/reduced motion, offscreen columns, hidden Dockview tabs, and actual document hide/restore; state browser limitations explicitly |
| Long-history stress | Earlier all-history attempt failed within the unchanged 360-second load bound | Final-build attempts with verified loaded counts; report overload if a full sample cannot complete |
| 4x CPU stress | Earlier cold and warm attempts contain failures and incomplete samples | Same final desktop scenarios, with cold and throttle-after-load modes kept separate; retain every failed attempt |
| Retention after 100 switches | Existing and preliminary candidate runs retain one editor and three panels | Final retained-owner evidence, including subscriptions where required; no leak inference from one heap sample |
| Phone parity and final correctness | Native phone composition, history, and deep-tree rerun pass for current candidate | Final targeted recovery, task-switch/draft, scroll, and motion cases; inspect captures and preserve the unexplained initial deep-tree failure |
| Delivery and reporting | Validated production increments pushed through 90a440a9747179629f507b8bb2f24bf5f0f3b8f0 | Final normal-hook commits/pushes, accurate work-order statuses, companion records, public-doc impact check, reproducible commands, and Kandev rich results |

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
`layout-manager/comparator.ts:savedLayoutMatchesLive` compares structural panel
counts without checking arrangement. The failure artifacts are retained under
`navigation-layout-inherited-failure` and `navigation-layout-persisted-failure`.
This is an unresolved correctness finding. The rebuild benchmark uses distinct
panel inventories to exercise the actual rebuild path on both versions; it does
not establish that same-inventory arrangement restoration works.

## Completion rule

Close each row only with evidence whose build, fixture, scenario, and measurement
scope match the requirement. Keep missed experiment targets and unresolved
owners explicit. Do not infer M2 Air performance, field INP, battery savings,
or a memory leak from Linux Chromium measurements.
