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

Run the existing frontend static checks and build independently of two built-in
Vitest file shards. Keep the same package script (including pretest generation),
production NODE_ENV guard, isolated projects, container, cache discovery and
worker-budget resolver. Register the two standard-tier jobs in the existing
runner planner. Each shard emits a distinct JSON report. Compare the complete
file/test identity multiset and outcomes against an unsharded same-source run;
retain unknown files in their existing full setup. The required frontend gate
joins the static job and every shard, rejecting failed/cancelled/unexpected
skips and absent reports. Keep the public check name unchanged.

Partition the native Windows command sequence into compilation, native platform,
persistence and settings groups. The initial process cohort stayed unchanged and measured 19m08s in hosted
job 115897903616. Execute its existing two native cohorts on separate Windows
jobs. The native runner gains a bounded `-cohort=1|2` selector; omitted/zero
retains its existing local two-process mode. Enumeration and exact per-cohort
completion validation remain mandatory, and both hosted results join the backend
gate. Reports record the selected cohort so a single-job report cannot claim
full package coverage. Reject other cohort numbers before starting work.
Move whole existing steps, retaining their commands and timeouts;
do not derive coverage from source-name guesses. Every prior native step has
exactly one owner. All groups remain on windows-latest and join the existing
backend aggregate. Targeted native compilation uses GOMAXPROCS=2 and a 2 GiB
Go soft memory limit on the existing hosted Windows runner, so cold race builds
do not thrash under the former 512 MiB heap. Test and step alarms stay intact.
Fail-fast stays false. This isolates compilation and groups
related tagged persistence checks without changing test selections.

## Subsequent bounded candidates

The first backend candidate isolates `internal/task/repository/sqlite` from the
two existing package-hash jobs and partitions it into three hosted jobs. The
explicit PostgreSQL 16 catalog retains one ordinary-packages job plus the same
three repository cohorts. Other packages keep their existing commands.

A narrow repository-only Python launcher enumerates native Go tests with the same
race/coverage flags as execution. It accepts only successful JSON package
completion and native top-level Test/Fuzz/Example names. Sort names and distribute
round-robin into three nonempty cohorts; use exact anchored selectors with no
slash so all nested subtests and fuzz seeds remain selected. Unknown new names
enter the inventory automatically. Reject malformed/duplicate/missing enumeration,
unselected execution, missing/duplicate terminal test records, or failed package
completion. The test command's exit is authoritative even when its report exists.

Normal repository cohorts retain race detection, atomic coverage and the
120-minute deadlock bound; PostgreSQL cohorts retain race detection, the
90-minute bound and only the existing nested SQLite million-fixture exclusion.
Each cohort uploads inventory, selected names, raw Go JSON, diagnostics and
coverage where applicable. All cohort results join the unchanged backend gate.
Keep the full explicit PostgreSQL catalog in the workflow and assert that its
sole repository exclusion delegates to all three required repository cohorts.
The launcher is not a generic scheduler and does not alter local test commands.

The workflow-sensitive sidebar resource lane is also part of complete acceptance.
Its memory job has 84 sort/group/direction cases plus alternating, preparation
and maximum-input checks. Partition only its whole isolated child scenarios into
three hosted groups. Group one retains the original three top-level tests and
skips only the five explicitly delegated pool-sort keys; group two selects
state/updatedAt and group three createdAt/title/custom. New sort keys remain in group
one by default. Preserve all nested groups/directions, 100-read plateau loops,
GOMAXPROCS=4 child measurement, native-memory limits and deadlines. Keep the
populated SQLite/PostgreSQL benchmark lane unchanged. Native Go fixture tests
prove complete disjoint leaf selection, including a future sort key.

For E2E retain duration-aware manifests, complete report reconciliation, guarded
one-worker processes, build identity and Docker/Kind coverage. Measure build,
container startup, test fixture work, browser execution and report overhead
separately. The first candidate uses 28 normal jobs, retaining two guarded processes per job
and six container jobs. Main profile 38554759444 predicts a 514.7-second slowest
process for the unchanged 3,808-test normal catalog, versus 1,027.8 at fourteen
jobs; measured queue and occupancy decide adoption. Run backend and web builds
concurrently inside the existing build job and join both before producing the
delivery fixture and identity manifest. A failed child remains a build failure.
Every further change gets a source-specific work-order update before implementation.

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
