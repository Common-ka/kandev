---
created: 2026-10-19
status: in_progress
requirements:
  - REQ-PLATFORM-LSP-FILE-INTELLIGENCE-001
system_design:
  - ../../specs/platform/system-design/lsp-file-intelligence-01.md
legacy_specs: []
---

# Implementation Plan: Use task worktrees for LSP roots

## Overview

Correct the local task-host workspace projection so Kotlin imports the same
checkout that the task editor opens. This repairs the existing Local PC/Worktree
contract (AC-PLATFORM-LSP-FILE-INTELLIGENCE-001.1, .2, .10, and .14).
No new product behavior or schema is required.

## Evidence and root cause

Read-only investigation on macOS at PR head d8fb56ae91 found that Kotlin
263.7084.0 received a task worktree in `rootUri`, but the repository source clone
in `workspaceFolders`. Its log subsequently reported successful import of the
source clone. The task environment persisted the correct worktree path.

`service_turns.go:workspaceRepositorySpec` provides both `RepositoryPath` and
`WorktreePath`. `taskHostWorkspaceProjection` passes these records unchanged to
`workspaceSourceRoots`, which selects only `RepositoryPath`.

A temporary `TestDiagnosticTaskLSPUsesWorktreeRoot` reproduced this defect:
workspace was temporary directory 002, but roots contained source directory 001.
The focused Go test failed for the expected assertion. The temporary test was
removed after diagnosis. No live process, setting, or database was changed.

## Scope

Correct local task-host initialization and later workspace projections. Preserve
ordered multi-repository roots, explicit folders, canonicalization and deduplication.
Keep source-clone paths available for Git recovery. Do not change UI, credentials,
Kotlin installation, Docker paths, or unsupported executor policy.

## Technical approach

In `apps/backend/internal/agent/runtime/lifecycle/workspace_materialization.go`,
project each local worktree repository to its selected `WorktreePath` before
root collection. Copy records before replacing paths; do not mutate caller-owned
inventory. Retain `RepositoryPath` for local repositories without a selected
worktree. A missing selected worktree must not silently authorize its source clone.

Keep this correction at the task-host projection boundary; the shared
`workspaceSourceRoots` helper also serves session launch and recovery paths.
Verify callers in `manager_execution_task_host.go` and `manager_workspace_rescan.go`.
The current design already specifies task roots and ordered repository folders;
this implementation violates that design.

| Environment | Intended roots | Evidence |
| --- | --- | --- |
| Local worktree | Selected worktree for each repository | New projection regressions |
| Local repository/folder | Selected repository/folder paths | Compatibility regressions |
| Local Docker | Existing physical /workspace mapping | Existing projection tests |
| Unsupported executor | Existing rejection | No support expansion |

## Tests

Add `TestTaskHostWorkspaceProjectionUsesSelectedWorktrees` to
`workspace_task_host_projection_test.go`. Include single and multiple worktrees,
a folder mixed with a worktree, non-worktree local repositories, missing selected
worktree, stable order, and non-mutation of input records.

Extend `manager_workspace_sources_test.go` to assert that a task-host rescan sends
the selected worktree roots. These checks cover AC-PLATFORM-LSP-FILE-INTELLIGENCE-001.10
and .14. Run the existing agentctl LSP suite for URI and protocol compatibility.

## End-to-end verification

After the correction is installed through the user's normal development flow,
restart the task's Kotlin generation explicitly. Inspect its initialize request:
`workspaceFolders` must contain task worktrees. Confirm successful import of the
task checkout, then test completion and cross-file definition in a task Kotlin
file. This checks AC-PLATFORM-LSP-FILE-INTELLIGENCE-001.1 and .2. A successful
initialize alone does not prove navigation. Live installation and this check
remain pending; do not mark this repair verified before they pass.

## Work orders

- [ ] [Task 01: Correct task-host roots](task-01-correct-task-host-roots.md)

## Verification results

Diagnostic reproduction: failed as expected at d8fb56ae91.
Implementation is complete. Targeted lifecycle tests and the full agentctl LSP
package pass. The broader lifecycle suite was stopped after 274 seconds after recording
unrelated fixture failures. The missing `/bin/sleep` and unavailable Kubernetes
secret-store failures reproduce with the original production file through a Go
overlay. The full suite is not claimed as passing. Changed-code Go lint reports
zero issues. All 63 public-doc validator tests and validation of 48 published pages
pass. PR documentation coverage preflight passes. `git diff --check` passes.

Full specification lint reports one existing file-size violation:
`docs/specs/platform/system-design/lsp-file-intelligence-02.md` is 34,776 bytes,
above the 32,768-byte limit. The same size is present in the parent commit; this
repair does not modify that file.

User-machine installation and Kotlin navigation remain pending.

## Risks

A surviving language server retains its old initialized roots. Verify explicit
restart uses a fresh projection. Do not discard existing server state silently.
Private dependencies can still block import independently; successful current
source-clone import does not guarantee successful import of a different branch.

## Related work

[Task-scoped LSP lifecycle](../task-scoped-lsp-lifecycle/plan.md) remains the parent
implementation record. Its completed checks do not prove this repair.
