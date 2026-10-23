---
id: "02-conversation-repair"
title: "Incremental conversation repair"
status: done
wave: 2
depends_on: 
  - "01-dense-baseline"
plan: "plan.md"
requirements:
  - REQ-PLUGINS-PROMPT-HISTORY-HOST-006
  - REQ-PLATFORM-SESSION-SUBSCRIPTION-RECOVERY-001
acceptance_criteria:
  - AC-PLUGINS-PROMPT-HISTORY-HOST-006.3
  - AC-PLUGINS-PROMPT-HISTORY-HOST-006.6
  - AC-PLUGINS-PROMPT-HISTORY-HOST-006.9
  - AC-PLUGINS-PROMPT-HISTORY-HOST-006.10
  - AC-PLATFORM-SESSION-SUBSCRIPTION-RECOVERY-001.2
  - AC-PLATFORM-SESSION-SUBSCRIPTION-RECOVERY-001.3
  - AC-PLATFORM-SESSION-SUBSCRIPTION-RECOVERY-001.8
system_design:
  - ../../specs/plugins/system-design/conversation-source-reconciliation.md
  - ../../specs/platform/system-design/session-subscription-recovery.md
---

# Task 02: Incremental conversation repair

## Summary

Repair the reproduced normal-write path that causes source resets and redundant history recovery. Preserve authoritative recovery and periodic backfill.

## In scope

- Trace the actual writer, transaction receipt, event payload, gateway projection, and core recovery callback. Determine whether missing receipts or duplicate publications cause the observed reset.
- Add RED coverage through the real writer-to-gateway path; retain transaction completeness, commit-before-publication, privacy projection, and concurrent writer ordering.
- Repair only proven receipt loss or duplicate notification behavior. If reads overlap, join only equivalent requests within existing scope/generation ownership and retain one required follow-up.
- Exercise text streaming, tool output, turn completion, deletion, plugin scopes, dropped events, reconnect, and stale responses. No suppression of genuine resets.

## Out of scope

Live instance mutations, unrelated refactors, new task/session creation, deployment,
and changes outside this package's contracts. No delegation is authorized.

## Acceptance conditions

1. Contiguous ordinary writes update current messages and turns without reset-triggered history reads; matching revision checks cause no recovery. Scheduled backfill stays separately observable.
2. Missing coverage, malformed/incomplete receipt, reconnect, and late response races still converge without optimistic data loss or cross-session publication.
3. Focused backend/frontend tests and desktop/phone recovery flows pass; request-count evidence shows the repair at the same stream rate.

## Verification commands

Run the listed commands sequentially. New test files are implementation outputs;
they must exist before these commands count as verification. Use the guarded
E2E runner with fresh known artifacts. Capture RED/GREEN evidence for changed
logic and apply scoped lint to touched files.

```bash
cd apps/backend
go test ./internal/gateway/websocket ./internal/task/service ./internal/task/repository/sqlite
# From repository root, then run frontend checks:
cd ../../apps/web
pnpm exec vitest run lib/ws/client.test.ts hooks/domains/session/use-session-messages.live-refresh.test.tsx
pnpm e2e:run --project chromium tests/plugins/conversation-recovery.spec.ts tests/performance/dense-workbench-correctness.spec.ts
pnpm e2e:run --project mobile-chrome tests/performance/mobile-dense-workbench-correctness.spec.ts
pnpm run typecheck
```

## Likely files

- `apps/backend/internal/task/service/service_events.go` and the attributed writer
- `apps/backend/internal/gateway/websocket/conversation_delivery.go`, `task_notifications.go`, and regression tests
- Repository receipt methods only if attribution demonstrates a defect; both supported SQL implementations if shared semantics change
- `apps/web/lib/ws/client.ts` and its tests
- `apps/web/hooks/domains/session/use-session-messages.ts` and live-refresh tests
- New desktop/phone `e2e/tests/performance/*dense-workbench-correctness.spec.ts`

## Dependencies and parallelism

Requires `01-dense-baseline`. Sequential execution only.

## Inputs

Read the requirements and designs referenced in frontmatter, the
[plan](plan.md), and the [benchmark protocol](benchmark.md). Preserve existing
companion-plan ownership and historical results described by the plan.

## Risks

A suppressed reset can conceal lost data. Preserve coverage validation, bounded repair, authorization, and the subscription-readiness barrier. If repository logic changes, run its disposable PostgreSQL parity tests and record the exact command; skipped tests do not prove parity.

## Results

2026-10-23: The JSON event transport loses nested mutation receipts in
`conversationReceiptFromData`: the recursive map branch expects another
envelope instead of decoding the receipt map. A writer-shaped event serialized
through `bus.Event` reproduces a reset at the first contiguous revision.
The minimal correction preserves map receipt decoding. The regression then
passes 100 contiguous updates through the broadcaster for both typed and JSON
transport. `go test -race ./internal/gateway/websocket -count=1` passes.

This is one confirmed transport defect, not proof that the observed live
instance uses NATS. Durable canonical streaming also published receiptless message events in
`publishCanonicalMessageEvent`. A real mock-agent script reproduced that
path in the frozen baseline: 20 agent updates produced 20 empty-revision
resets. The candidate now returns transaction-bound receipts and preserves
them through generation checks, coalescing, the orchestrator, and service
privacy projection. It publishes the committed snapshot instead of reading
a potentially newer message and labelling it with an earlier revision.


### Canonical streaming implementation boundary

The durable projector must return a transient receipt from the same SQL
transaction as its message writes and inbox cursor. Capture the starting
revision after the existing session lock, record the message/turn rows that
this transaction actually writes, and read their final snapshots before
commit. Return no receipt for a replay that makes no source changes. A failed
transaction returns neither a receipt nor a successful projection.

Carry the receipt with the host notification through existing generation
checks and coalescing. The low-level agent event cannot import task models;
use a host-only JSON field excluded from agent wire encoding, then a typed
receipt inside lifecycle. Merge only complete contiguous intervals for the
same session. The orchestrator publishes the receipt's committed message
snapshot through the task service's existing privacy projection. Missing or
incomplete evidence retains the existing reset/recovery behavior.

This changes notification evidence only. It does not change durable admission,
ACK order, journal payloads, execution state, or repository retention.

### First browser comparison

One gated 20-update script ran against frozen baseline source `595df36ed5c`
and the candidate. The probe waits for agent output, not the echoed user
prompt, before opening its capture window. Both runs verify the final stored
and displayed agent content. This short check is not the dense timing series.

| Metric | Baseline | Candidate |
| --- | ---: | ---: |
| Reset notifications | 20 | 0 |
| `message.list` requests | 23 | 1 |
| Decoded history request/response bytes | 249,518 | 10,754 |
| All captured decoded WS bytes | 277,234 | 83,264 |

Local raw artifacts are
`.kandev/diagnostics/dense-workbench-performance/baseline-canonical-stream-1792748856792.json`
and `canonical-stream-1792749213198.json` in that same directory. Counts include
remaining scheduled reads; the fix does not remove periodic backfill.

Targeted SQLite and disposable PostgreSQL tests pass for text, thinking,
new/existing turns, immutable snapshots, replay, and transaction rollback.
Desktop and phone canonical-stream browser checks pass. The desktop plugin
conversation-recovery tests also pass. Existing client/refresh tests pass
(41 tests), as do frontend type checking and scoped test lint. Scoped Go lint passed on retry. The first attempt reached its five-minute
limit without reported findings and is not counted as a pass. Race checks
passed for the repository, orchestrator, task service, and gateway. The
lifecycle package exposed an existing Linux fixture that hardcoded
`/bin/sleep`, which does not exist on the Nix host. The fixture now resolves
`sleep` through PATH; its focused lifecycle race rerun passes (37.8 seconds).

The full task-service suite passed in 777.571 seconds. The initial full
service/SQLite run exceeded Go's default ten-minute limit; that run is not a
pass. The later SQLite run was split after 316 completed top-level cases.
Four disjoint batches cover all remaining registered cases. The aggregate
contains 1935 top-level tests: 1617 passed and 318 explicitly skipped,
with no missing names. PostgreSQL parity above is separate from those skips.

One existing GitHub-issue cancellation fixture failed because its 15-second
deadline included schema setup. Start the deadline after setup, as the adjacent
metadata cancellation fixture already does. The corrected test passed three
consecutive runs under the same concurrent load. The failed batch and all
rerun evidence remain recorded in
`.kandev/diagnostics/dense-workbench-performance/sqlite-suite-complete.json`.
Benchmark databases remain disk-backed. The full dense performance comparison
is owned by work order 06 and is still pending.
