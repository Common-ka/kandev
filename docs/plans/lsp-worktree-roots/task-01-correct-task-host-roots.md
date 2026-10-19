---
id: "01-correct-task-host-roots"
title: "Correct task-host roots"
status: in_progress
wave: 1
depends_on: []
plan: "plan.md"
requirements:
  - REQ-PLATFORM-LSP-FILE-INTELLIGENCE-001
acceptance_criteria:
  - AC-PLATFORM-LSP-FILE-INTELLIGENCE-001.1
  - AC-PLATFORM-LSP-FILE-INTELLIGENCE-001.2
  - AC-PLATFORM-LSP-FILE-INTELLIGENCE-001.10
  - AC-PLATFORM-LSP-FILE-INTELLIGENCE-001.14
system_design:
  - ../../specs/platform/system-design/lsp-file-intelligence-01.md
---

# Task 01: Correct task-host roots

## Summary

Use selected worktrees for local task-host LSP roots. Cover initialization and
rescan while preserving local folders and Docker projection behavior.

## In scope

- Add the projection and rescan regressions described in the plan; run them red.
- Correct local task-host projection without modifying source inventory.
- Check actual Kotlin import and navigation after the user installs the fix.

## Out of scope

UI changes, credentials, automatic live deployment, and new executor support.

## Acceptance

- Worktree tasks pass their selected checkout paths to the language server.
- Local repository/folder and Docker mappings retain their existing behavior.
- Tests pass; live Kotlin navigation is recorded separately from initialization.

## Verification

Run from the repository root:

```bash
(cd apps/backend && go test ./internal/agent/runtime/lifecycle -run 'TestTaskHostWorkspaceProjection|Test.*Workspace.*Source|Test.*Workspace.*Rescan|TestRescanWorkspaceForTaskHost|TestTaskLSPWorkspaceProjection' -count=1)
(cd apps/backend && go test ./internal/agentctl/server/lsp -count=1)
git diff --check
```

Then perform the read-only log and user navigation checks in the plan after the
user installs the corrected build. Record the generation and import result.

## Files likely touched

- `apps/backend/internal/agent/runtime/lifecycle/workspace_materialization.go`
- `apps/backend/internal/agent/runtime/lifecycle/workspace_task_host_projection_test.go`
- `apps/backend/internal/agent/runtime/lifecycle/manager_workspace_sources_test.go`

## Dependencies

None. Use `/tmp/kandev-pr2308-repair`; the original task checkout has unrelated
concurrent edits.

## Risks

Existing processes retain initialized roots. Follow the existing explicit restart
contract. Missing selected worktrees must not fall back to source clones.

## Parallelism

sequential

## Inputs

- [Plan and evidence](plan.md)
- [Requirement](../../specs/platform/requirements/lsp-file-intelligence.md)
- [Design](../../specs/platform/system-design/lsp-file-intelligence-01.md)
- Existing Docker tests in `workspace_task_host_projection_test.go`.

## Results

Implementation complete; Mac acceptance remains pending.

- The new projection tests and updated rescan/shared-host tests failed before
  the correction, then passed with it.
- The exact targeted lifecycle command above passed (0.107s).
- `go test ./internal/agentctl/server/lsp -count=1` passed (10.892s).
- `/tmp/kandev-pr2308-tools/golangci-lint run --new-from-rev=HEAD ./internal/agent/runtime/lifecycle/...`
  reported zero issues, run from `apps/backend`.
- Public documentation: `node --test scripts/validate-public-docs.test.mjs`
  passed 63 tests; `node scripts/validate-public-docs.mjs` validated 48 pages.
- PR documentation coverage `validateCoverage` preflight passed for the changed
  files and their linked requirement/design documents.
- `git diff --check` passed.
- Full spec lint has the pre-existing size violation recorded in the plan.
- The broader lifecycle suite was interrupted after 274 seconds. It reported
  missing `/bin/sleep` and unavailable Kubernetes secret-store fixtures. Both
  representative failures reproduce with the parent production file via Go
  overlay; they are independent of this correction. Full-suite success is not
  claimed.
- Pre-commit is unavailable in this environment and Git hooks are inactive.
  The checks above ran directly; no hook bypass was used.

Public docs updated: `docs/public/developer-tools.md` (language-server reference).
Live deployment is not part of this code change. Verify actual task-checkout
import, completion, and definition after the user installs the corrected build.
