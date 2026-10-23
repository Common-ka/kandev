---
id: "02-conversation-repair"
title: "Incremental conversation repair"
status: in_progress
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
instance uses NATS. Durable canonical streaming also publishes receiptless
message events in `publishCanonicalMessageEvent`; transaction-bound receipts
for that path and the controlled browser comparison remain pending.

