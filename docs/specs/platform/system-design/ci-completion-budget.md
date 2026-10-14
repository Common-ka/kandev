---
status: draft
system: platform
created: 2026-10-14
requirements:
  - REQ-PLATFORM-CI-PERFORMANCE-003
  - REQ-PLATFORM-CI-PERFORMANCE-004
  - REQ-PLATFORM-CI-PERFORMANCE-005
  - REQ-PLATFORM-CI-PERFORMANCE-007
---

# Complete CI completion budget

## Boundary and baseline

Platform owns verification latency. CI automation retains authorization; the
external-runner contract retains eligible-job and provider boundaries. This
continuation changes scheduling and test infrastructure, with no application UI.

The complete October 14 workflow set at `2705829f097d` took 30m03s:
backend run 38524205425, frontend 38524205486, E2E 38524205488.
Windows native execution took 27m59s; PostgreSQL 24m33s; frontend 24m18s;
normal E2E execution reached 18m01s inside a 28m42s workflow. These are diagnostic
observations, not same-source candidate comparisons. Refresh source and selection
for each experiment. PR #4457 already met the distinct 50% E2E-step target.

## Requirement mapping

| Requirement | Design |
| --- | --- |
| REQ-PLATFORM-CI-PERFORMANCE-003 | Complete disjoint test partitions and required joins |
| REQ-PLATFORM-CI-PERFORMANCE-004 | Attempt-specific hosted measurement |
| REQ-PLATFORM-CI-PERFORMANCE-005 | Occupancy and loaded feedback comparison |
| REQ-PLATFORM-CI-PERFORMANCE-007 | Full workflow budget and staged delivery |

## First candidate: independent frontend and Windows work

Run the existing frontend static checks and build independently of four built-in
Vitest file shards. Keep the same package script (including pretest generation),
production NODE_ENV guard, isolated projects, container, cache discovery and
worker-budget resolver. Register the four standard-tier jobs in the existing
runner planner. Each shard emits a distinct JSON report. Compare the complete
file/test identity multiset and outcomes against an unsharded same-source run;
retain unknown files in their existing full setup. The required frontend gate
joins the static job and every shard, rejecting failed/cancelled/unexpected
skips and absent reports. Keep the public check name unchanged.

Partition the native Windows command sequence into compilation, native platform,
persistence and settings groups. Keep the process cohort unchanged initially.
Move whole existing steps, including their environment, commands and timeouts;
do not derive coverage from source-name guesses. Every prior native step has
exactly one owner. All groups remain on windows-latest and join the existing
backend aggregate. Fail-fast stays false. This isolates compilation and groups
related tagged persistence checks without changing test selections.

## Subsequent bounded candidates

Inspect complete Go JSON and PostgreSQL timings before choosing package or
within-package partitions. Preserve the explicit PostgreSQL package catalog,
service version, race checks and existing SQLite-only scale exclusion. A long
package cannot be accelerated just by adding package shards; native top-level
inventory and complete disjoint result checks are required for any cohort split.
Do not use substring filters that silently omit new tests.

For E2E retain duration-aware manifests, complete report reconciliation, guarded
one-worker processes, build identity and Docker/Kind coverage. Measure build,
container startup, test fixture work, browser execution and report overhead
separately. Start with avoidable work and dependency edges; expand hosted fan-out
only when measured service demand and queues support it. Every such change gets
its own source-specific work-order update before implementation.

## Evidence, acceptance and rollback

Use one bounded hosted candidate at a time. Collect attempt-specific run/job/step
responses and original reports. A test command's nonzero exit remains failure;
artifact upload or later summary success never erases it. Missing evidence is
unknown or failure, never zero tests or success. Keep all attempted samples.

Frontend adoption retains three comparable samples, at least 30% shorter execution
and at most 10% extra runner-minutes against optimized unsharded verification.
For the complete goal, collect three fully selected successful workflow sets at
or below 900 seconds each, including waiting/setup/reporting. A changed source
requires explicit identity deltas, not an unexplained percentage comparison.
Record queue variability; do not infer p90 or a guaranteed ceiling.

Revert or revise candidates that lose coverage or worsen loaded feedback. No
billing settings, provider activation, global worker overrides, assertion deletion,
retry increases, skipped required platforms or manual approval bypasses are part
of this package. Existing protected workloads remain hosted.

## Delivery

[CI performance plan](../../../plans/ci-performance/plan.md), Tasks 14–16, owns
implementation and measurement. The maintainer explicitly requested continuous
execution through verified completion and merge; the design checkpoint does not
end this authorized loop. No delegation is authorized.

[Budget decision](../../../decisions/2026-10-14-complete-ci-latency-budget.md)
records the revised fan-out boundary.
