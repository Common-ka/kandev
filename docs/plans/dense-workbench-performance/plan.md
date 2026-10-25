---
created: 2026-10-22
status: in_progress
requirements:
  - REQ-UI-CHAT-MOTION-001
  - REQ-PLATFORM-POSTGRES-DOMAIN-STORE-PARITY-007
  - REQ-PLUGINS-PROMPT-HISTORY-HOST-006
  - REQ-PLATFORM-SESSION-SUBSCRIPTION-RECOVERY-001
  - REQ-PLATFORM-VIEWPORT-SESSION-DELIVERY-001
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-003
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-004
  - REQ-UI-PERSISTENT-STATUS-MOTION-004
  - REQ-UI-PERSISTENT-STATUS-MOTION-006
  - REQ-PLATFORM-WEB-ASSET-DELIVERY-001
system_design:
  - ../../specs/ui/system-design/chat-motion.md
  - ../../specs/platform/system-design/postgres-domain-store-parity.md
  - ../../specs/plugins/system-design/conversation-source-reconciliation.md
  - ../../specs/platform/system-design/session-subscription-recovery.md
  - ../../specs/platform/system-design/viewport-bounded-session-delivery.md
  - ../../specs/ui/system-design/session-refresh-efficiency.md
  - ../../specs/ui/system-design/persistent-status-motion.md
  - ../../specs/platform/system-design/web-asset-delivery.md
legacy_specs: []
---

# Implementation plan: Dense workbench performance

## Latest measured checkpoint

The corrected full-reference grid run finishes all 12 planned attempts: five
pass and seven fail. Only pair zero completes both arms. The five complete
samples verify 9,000 ordered updates, but the failed series cannot support a
six-pair speed summary. Cold readiness, scroll-up, return-bottom, and composer
closure failures remain on the original inputs and deadlines. The current wheel
repair is insufficient at full load. See
[the complete failure evidence](evidence/reference-files-grid-failed.json).

The test harness now retains backend logs per attempt, cold-start state and
errors, failure images, and timings for each existing native input step. The
57 Node checks, four browser regressions, controlled fault caller, and healthy
Threads, full-plugin Dockview, and isolated navigation callers pass within
their scope. The first combined navigation setup failure remains retained.
The application, input sequence, and deadlines stay unchanged. See
[the diagnostic evidence](evidence/failure-diagnostics.json).

Production `7a984021113` adds the native wheel follow repair and passes 228
related unit checks plus 33 desktop and 17 phone browser checks. The original
scripted candidate rehearsal returns to the bottom after streamed height growth;
its frozen baseline fails at 21 pixels. See
[the repair evidence](evidence/native-wheel-bottom-follow.json).

The prior six-pair grid attempt stopped after one complete pair because a
read-only audit found only the default file in its six prepared repositories.
Its data and pending attempts remain preserved, and the summary rejects the
incomplete plan ([gap evidence](evidence/threads-reference-file-gap.json)).
The Threads seed now includes 630 profile files and 73 changes in each prepared
environment. It records actual task count and verifies file hashes before and
after each sample. The real regression, 53 Node checks, strict lint, default
grid, scripted eight-column, and full-plugin Dockview callers pass
([fixture evidence](evidence/threads-reference-file-fixture.json)). These are
harness correctness checks. The final dense reference matrix remains open.

The benchmark preserves failed attempts and continues the complete planned
matrix while retaining final failure
([harness evidence](evidence/dense-attempt-continuation.json)). Older measurements
below retain their own build and fixture identities. Earlier Threads data do
not prove the previously missing file-state dimension.

The retained production build at `72085e06b49` passes final six-pair comparisons
at 1x for compatible tasks, incompatible layouts, and same-environment session
tabs. Gains are modest and some pairs regress; the 20% warm-p95 target remains
unmet. Other required scenarios remain open in the [completion audit](completion-audit.md).
See the [compatible-task](evidence/final-task-switch-six-pair-1x.json),
[layout-restoration](evidence/final-incompatible-layout-six-pair-1x.json), and
[session-tab](evidence/final-session-tabs-six-pair-1x.json) evidence.

Production `f5c8fb8f6ab` also passes six full Dockview core pairs at 1x.
Streaming history reads fall about 96.2% in all pairs; renderer CPU falls
11.4% by median paired change with one regression. Reduced-motion idle main CPU
falls 81.0% in every pair. Late frame/CPU regressions remain open, and the 20%
streaming task-time target is unmet. See [core evidence](evidence/final-dockview-core-six-pair-1x.json).
The scripted Threads grid/column harness and unchanged quiet caller pass both
builds. The full-plugin six-pair series also passes, with lower streaming reads
and CPU but mixed idle results and four remaining reduced-motion animations
([evidence](evidence/final-dockview-plugin-six-pair-1x.json)). The isolated
shared-Spinner follow-up now removes those four reduced-motion rotations and
passes six pairs, with 79.82% lower main CPU and 69.65% lower renderer CPU in
that mode ([evidence](evidence/plugin-spinner-motion-six-pair-1x.json)). Normal
CPU and frame regressions remain explicit. Full reference grid, columns, and
stress remain separate work.

The final scripted grid attempt is incomplete: four pairs pass before the fifth
control fails its return-bottom interaction. Candidate streaming frame-gap p95
is higher in every completed pair. The failed report remains intact and is
excluded from final speed summaries. See [evidence](evidence/final-scripted-grid-failed-attempt.json).
Separate renderer attribution and the final grid gate remain open.

## Outcome and checkpoint

Reduce unnecessary work in Threads, Dockview, and task switching, then measure
the change against a frozen baseline with identical dense synthetic workloads.
Preserve the default appearance, current data freshness, drafts, and navigation.
Reduced-motion mode will show static status indicators with unchanged meaning.

The user authorized implementation, sustained optimization, and incremental
commits and pushes on 2026-10-23 after the design handoff. Execute the six work
orders in the primary session. Motion validation can follow the first transport
repair while durable-stream receipt work remains open: these changes have no
code dependency, and baseline assets are already frozen. Delegation and deployment have not
been requested. The baseline precedes production edits.

## Evidence and baseline

The live deployment was `e29a5b36448892d12b9eac9cb75d837007fb55f4`.
The source baseline for implementation is
`595df36ed5c1cf02fd90cb972b623ad6edc53df8`. These are different versions.
The deployment supplies a reproduction lead, not the A/B control.

Live observations: six visible chat tiles; 30 newest-window `message.list`
requests in 15 seconds; 12 of 18 requests in a separate eight-second capture
entered through core conversation recovery. Thirteen reset notifications in a
ten-second capture had empty revision fields. The gateway emits that shape
when it has no receipt. The exact producing writer remains unconfirmed.
The separate captures have different denominators and must not be combined.
The first resource buffer recorded at least 20.5 MB transferred and large
editor chunks without a mounted Monaco editor. The exact import initiator is
unconfirmed. Retained local evidence:
`.kandev/diagnostics/threads-performance-evaluation.json` (ignored artifact).

The live animation pause experiment had different stream rates between arms;
it did not establish a CPU gain. Existing offscreen activation, hidden motion
pausing, read sharing, and Dockview fast switching must be retained. Node
counts alone do not establish a leak. No M2 Air measurements exist yet.

## Scope and existing ownership

1. Reproduce and repair ordinary conversation updates that trigger unnecessary
   source resets. Preserve real gap, reconnect, startup, and foreground recovery.
2. Respect reduced motion and suspend demonstrated hidden presentation work.
   Keep the intentional mounted composer and its draft/plugin state.
3. Compress immutable assets. Defer editor imports only after an initiator
   trace proves they load before use and a safe existing boundary is identified.
4. Attribute dense Dockview/task-switch costs and repair demonstrated repeated
   work within existing editor, selector, and layout owners.
5. Compare baseline and candidate production builds with the protocol below.

No transcript virtualization, layout redesign, default motion removal, broad
store rewrite, dependency replacement, new flag, or agent lifecycle change is
included. Do not reduce visible chats, history, update rate, or plugin coverage
to make the candidate look faster. Do not change the user's live instance.

The existing [conversation design](../../specs/plugins/system-design/conversation-source-reconciliation.md)
and [ADR](../../decisions/2026-09-16-conversation-source-reconciliation.md)
require complete transaction receipts and incremental updates. Implement that
contract; do not invent revisions, content hashes, or another payload journal.
The [subscription recovery requirements](../../specs/platform/requirements/session-subscription-recovery.md)
retain backfill and state snapshots. Their reads are counted separately from
unnecessary reset-driven reads. This package does not remove that safeguard.

The [session efficiency plan](../session-refresh-efficiency/plan.md), Task 05,
already owns unresolved editor attribution. Work order 05 below supplies its
dense reproduction and follow-up evidence; it does not duplicate completed
route/read-sharing work. The [rendering CPU plan](../frontend-rendering-cpu/plan.md)
already delivered hidden animation gating; its separate attribution work
remains open until evidence meets its own criteria. Historical conversation
storage verification remains historical. Update companion links and only the
statuses actually established by new evidence.

## Technical approach and compatibility

| Boundary                           | Change and invariant                                                                                                                                                   | Evidence/fallback                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Task repository/service to gateway | Trace ordinary message and turn publications through transaction receipts and `conversation_delivery.go`. Preserve complete revision intervals and privacy projection. | SQLite production path plus PostgreSQL receipt parity if touched. Exceptional incomplete receipts still reset.             |
| Core chat and plugin facade        | Apply complete batches by ID. Coalesce only equivalent concurrent recovery reads within the existing store/session/auth owner.                                         | Native and plugin consumers, missed delivery, stale responses, reconnect. No global cache or removal of periodic backfill. |
| Threads                            | Preserve viewport-owned activation and current visible tile count.                                                                                                     | Six-visible-tile grid and horizontally scrolled 30-column list.                                                            |
| Dockview                           | Preserve `detailActive`, split visibility, saved layout, pinned tabs, environment mapping, and fast/slow switch semantics.                                             | Same-layout, changed-layout, cross-environment, and A-B-A cases. No forced fast path across incompatible layouts.          |
| Composer                           | Retain mounted editor state; gate only proven unnecessary hidden effects.                                                                                              | Text, rich draft, attachments, focus, expand/collapse, delayed send acknowledgement.                                       |
| Status motion                      | Extend existing owned primitives for reduced motion.                                                                                                                   | Web Animations and CSS fallback; static status stays visible.                                                              |
| Static assets                      | Build gzip siblings and negotiate in the native handler.                                                                                                               | Identity fallback, packaged resources, original decoded bytes, desktop and phone route load.                               |

## UI preservation and motion preview

Desktop keeps the current Threads grid/list and Dockview split panels. Phone
keeps its native selected conversation and existing task/panel navigation.
Headers, controls, spacing, colors, borders, scroll owners, and touch targets
remain unchanged. There is no layout or control-placement change to sketch.

UI-01, shared status region: in normal mode the existing status icon moves;
in reduced-motion mode the same visible status icon is static. The existing
label and task content stay in place. This preview maps to
`AC-UI-PERSISTENT-STATUS-MOTION-006.1` through `.3`. Verify it in desktop and
phone browser captures; a static screenshot alone cannot prove motion stops.

## Tests and E2E coverage

The [benchmark protocol](benchmark.md) defines the fixture, measurements,
comparison, and limits. Work orders name exact commands and implementation
targets. New filenames are planned outputs, not existing test evidence.

| Acceptance criteria                                                       | Owned evidence                                                                               |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `AC-PLUGINS-PROMPT-HISTORY-HOST-006.3`, `.6`, `.9`, `.10`                 | WO02: real writer-to-gateway regression, core/facade tests, desktop and phone recovery flows |
| `AC-PLATFORM-SESSION-SUBSCRIPTION-RECOVERY-001.2`, `.3`, `.8`             | WO02: subscription acknowledgement, shared recovery, reconnect and late-read races           |
| `AC-PLATFORM-VIEWPORT-SESSION-DELIVERY-001.1`                             | WO01/05: visible consumer counts while horizontal scrolling and switching panels             |
| `AC-UI-SESSION-REFRESH-EFFICIENCY-003.3`, `.4`, `004.1` through `.3`      | WO05: mounted real editors, A-B-A draft/scroll restoration, desktop and phone navigation     |
| `AC-UI-PERSISTENT-STATUS-MOTION-004.1` through `.5`, `006.1` through `.3` | WO03: hidden/visible and runtime preference tests, desktop/mobile browser motion checks      |
| `AC-PLATFORM-WEB-ASSET-DELIVERY-001.1` through `.4`                       | WO04: build helper, handler, packaged asset smoke and browser checks                         |
| All above                                                                 | WO06: matched A/B evidence, correctness matrix, no unsupported performance claims            |

Run targeted Chromium E2Es for streaming, recovery, dense Threads, Dockview,
and navigation. Run mobile-chrome counterparts for recovery, status motion,
task switching, drafts, and scroll. Use the mobile-parity and E2E skills.
Use causal readiness and mutation completion for correctness, bounded timed
windows only for profiling. Performance values are comparative results, not
absolute timing assertions in CI.

## Work orders

- [ ] [01: Dense fixture and baseline](task-01-dense-baseline.md)
- [x] [02: Incremental conversation repair](task-02-conversation-repair.md)
- [x] [03: Persistent motion eligibility](task-03-motion-eligibility.md) (reduced motion and owned Threads offscreen lifecycle verified; six-pair busy-header CPU reduction retained)
- [x] [04: Asset delivery and import boundaries](task-04-asset-delivery.md)
- [ ] [05: Dockview and editor lifecycle](task-05-workbench-lifecycle.md)
- [ ] [06: Matched comparison and regression evidence](task-06-performance-comparison.md)

## Risks and decision gates

- The observed live reset producer may already differ at the source baseline.
  Reproduce first; if absent, report that result and preserve the fix scope as
  unresolved rather than adding speculative code.
- Coalescing reads with different scope, cursors, or authority can lose history.
  Join only equivalent work and retain dirty follow-up and generation checks.
- Unmounting hidden composers can lose drafts, plugins, or focus. Retain their
  ownership and gate demonstrated effects instead.
- Compression improves cold transfer, not warm rendering. Report separately.
- Profiling changes timing. Keep attribution runs separate from timed runs.
- Linux Chromium with CPU throttling is not an M2 Air simulation. Publish the
  host details; a direct M2 run remains a separate confirmation.

## Verification results

Design validation on 2026-10-22 passed:

- `python3 scripts/list-docs.py validate`: 384 decisions and 1,618 specifications.
- `python3 scripts/lint-spec-files.py --all`: all specification files passed.
- `python3 scripts/lint-spec-files.test.py`: 36 tests passed.
- `.github/scripts/pr-docs.cjs` synthetic coverage preflight: all six work
  orders covered, with valid requirements, criteria, plans, and design links.
- `git diff --check`: passed.

Implementation began on 2026-10-23. The design package and serialized-receipt
repair are committed. The dense pilot passed with 1,000 tasks and 36,000
messages. Motion eligibility is implemented with passing component and
browser checks. See each work order for exact evidence and remaining work.
The six-pair unthrottled grid comparison is complete. Cold encoded asset bytes
fell 77.62%, streaming history requests fell 90.85%, and reduced-motion idle
main-thread work fell 42.93% by median paired change. Normal streaming main-thread task time did
not improve, and frame-gap p95 increased 59.93%. All twelve samples passed final
content checks. The existing six-pair navigation comparison also establishes
no switching gain. Rendering follow-up, 4x stress, and the remaining scenario
matrix stay open. See [results.md](results.md) for ranges, errors, and limits.

The [completion audit](completion-audit.md) tracks the remaining scenario,
artifact, correctness, and delivery proof against the full approved scope.


## Editor subscription lifecycle follow-up

Full-reference private ownership observation finds user-reference growth of
200 per 100 task switches on both the original and retained candidate. The
existing `004.3` cleanup contract covers this finding. A minimal `useEditors`
effect cleanup passes 14 unit checks, both build/type pipelines, the fixed
100-switch and Settings release proof, and all 50 targeted desktop/phone checks.
The new uninstrumented candidate is `39be7b61`. Its full comparison matrix
remains pending; previous `820f` failures and measurements retain their build
scope. See [the repair evidence](evidence/editor-user-subscription-ownership.json).
