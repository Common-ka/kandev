---
created: 2026-10-22
status: in_progress
requirements:
  - REQ-PLUGINS-PROMPT-HISTORY-HOST-006
  - REQ-PLATFORM-SESSION-SUBSCRIPTION-RECOVERY-001
  - REQ-PLATFORM-VIEWPORT-SESSION-DELIVERY-001
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-003
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-004
  - REQ-UI-PERSISTENT-STATUS-MOTION-004
  - REQ-UI-PERSISTENT-STATUS-MOTION-006
  - REQ-PLATFORM-WEB-ASSET-DELIVERY-001
system_design:
  - ../../specs/plugins/system-design/conversation-source-reconciliation.md
  - ../../specs/platform/system-design/session-subscription-recovery.md
  - ../../specs/platform/system-design/viewport-bounded-session-delivery.md
  - ../../specs/ui/system-design/session-refresh-efficiency.md
  - ../../specs/ui/system-design/persistent-status-motion.md
  - ../../specs/platform/system-design/web-asset-delivery.md
legacy_specs: []
---

# Implementation plan: Dense workbench performance

## Outcome and checkpoint

Reduce unnecessary work in Threads, Dockview, and task switching, then measure
the change against a frozen baseline with identical dense synthetic workloads.
Preserve the default appearance, current data freshness, drafts, and navigation.
Reduced-motion mode will show static status indicators with unchanged meaning.

The user authorized implementation, sustained optimization, and incremental
commits and pushes on 2026-10-23 after the design handoff. Execute the six work
orders sequentially in the primary session. Delegation and deployment have not
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

| Boundary | Change and invariant | Evidence/fallback |
| --- | --- | --- |
| Task repository/service to gateway | Trace ordinary message and turn publications through transaction receipts and `conversation_delivery.go`. Preserve complete revision intervals and privacy projection. | SQLite production path plus PostgreSQL receipt parity if touched. Exceptional incomplete receipts still reset. |
| Core chat and plugin facade | Apply complete batches by ID. Coalesce only equivalent concurrent recovery reads within the existing store/session/auth owner. | Native and plugin consumers, missed delivery, stale responses, reconnect. No global cache or removal of periodic backfill. |
| Threads | Preserve viewport-owned activation and current visible tile count. | Six-visible-tile grid and horizontally scrolled 30-column list. |
| Dockview | Preserve `detailActive`, split visibility, saved layout, pinned tabs, environment mapping, and fast/slow switch semantics. | Same-layout, changed-layout, cross-environment, and A-B-A cases. No forced fast path across incompatible layouts. |
| Composer | Retain mounted editor state; gate only proven unnecessary hidden effects. | Text, rich draft, attachments, focus, expand/collapse, delayed send acknowledgement. |
| Status motion | Extend existing owned primitives for reduced motion. | Web Animations and CSS fallback; static status stays visible. |
| Static assets | Build gzip siblings and negotiate in the native handler. | Identity fallback, packaged resources, original decoded bytes, desktop and phone route load. |

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

| Acceptance criteria | Owned evidence |
| --- | --- |
| `AC-PLUGINS-PROMPT-HISTORY-HOST-006.3`, `.6`, `.9`, `.10` | WO02: real writer-to-gateway regression, core/facade tests, desktop and phone recovery flows |
| `AC-PLATFORM-SESSION-SUBSCRIPTION-RECOVERY-001.2`, `.3`, `.8` | WO02: subscription acknowledgement, shared recovery, reconnect and late-read races |
| `AC-PLATFORM-VIEWPORT-SESSION-DELIVERY-001.1` | WO01/05: visible consumer counts while horizontal scrolling and switching panels |
| `AC-UI-SESSION-REFRESH-EFFICIENCY-003.3`, `.4`, `004.1` through `.3` | WO05: mounted real editors, A-B-A draft/scroll restoration, desktop and phone navigation |
| `AC-UI-PERSISTENT-STATUS-MOTION-004.1` through `.5`, `006.1` through `.3` | WO03: hidden/visible and runtime preference tests, desktop/mobile browser motion checks |
| `AC-PLATFORM-WEB-ASSET-DELIVERY-001.1` through `.4` | WO04: build helper, handler, packaged asset smoke and browser checks |
| All above | WO06: matched A/B evidence, correctness matrix, no unsupported performance claims |

Run targeted Chromium E2Es for streaming, recovery, dense Threads, Dockview,
and navigation. Run mobile-chrome counterparts for recovery, status motion,
task switching, drafts, and scroll. Use the mobile-parity and E2E skills.
Use causal readiness and mutation completion for correctness, bounded timed
windows only for profiling. Performance values are comparative results, not
absolute timing assertions in CI.

## Work orders

- [ ] [01: Dense fixture and baseline](task-01-dense-baseline.md)
- [ ] [02: Incremental conversation repair](task-02-conversation-repair.md)
- [ ] [03: Persistent motion eligibility](task-03-motion-eligibility.md)
- [ ] [04: Asset delivery and import boundaries](task-04-asset-delivery.md)
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

Only documentation changed. Implementation, product tests, dense fixture
execution, and A/B performance results are pending. Files remain uncommitted.
