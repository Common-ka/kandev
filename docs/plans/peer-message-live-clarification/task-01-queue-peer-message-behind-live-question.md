---
id: "01-queue-peer-message-behind-live-question"
title: "Queue peer messages behind a live question"
status: done
wave: 1
depends_on: []
plan: "plan.md"
requirements:
  - REQ-TASKS-CLARIFICATION-LIFECYCLE-001
acceptance_criteria:
  - AC-TASKS-CLARIFICATION-LIFECYCLE-001.10
system_design:
  - ../../specs/tasks/system-design/clarification-active-lifecycle.md
---

# Task 01: Queue Peer Messages Behind a Live Question

## Summary

Before `dispatchTaskMessage` prompts a non-running session for a queued-mode
peer message, ask the orchestrator whether a live clarification owns the turn.
If it does, queue the message.

## In scope

- `liveClarificationReader` and the queued branch in `dispatchTaskMessage`.
- `Service.SessionHasLiveClarification`, a public accessor for the existing
  queue-drain rule.
- Tests in `message_task_live_clarification_test.go` and
  `clarification_guard_test.go`.
- AC `.10` and the system-design section "Peer messages during a live question".

## Verification

- `go test ./internal/mcp/handlers/ ./internal/orchestrator/`
- The queued-behind-live-question test fails without the handler change.
