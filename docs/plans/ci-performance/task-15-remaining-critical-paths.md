---
id: "15-remaining-critical-paths"
title: "Shorten remaining critical paths"
status: in_progress
wave: 11
depends_on: ["14-partition-independent-checks"]
plan: "plan.md"
requirements:
  - REQ-PLATFORM-CI-PERFORMANCE-003
  - REQ-PLATFORM-CI-PERFORMANCE-007
acceptance_criteria:
  - AC-PLATFORM-CI-PERFORMANCE-007.1
  - AC-PLATFORM-CI-PERFORMANCE-007.2
  - AC-PLATFORM-CI-PERFORMANCE-007.3
  - AC-PLATFORM-CI-PERFORMANCE-007.4
system_design:
  - ../../specs/platform/system-design/ci-completion-budget.md
---

# Task 15: Shorten remaining critical paths

## Outcome and scope

Implement the repository-only native inventory launcher described in the complete
CI design. Separate the large repository package into three normal and three
PostgreSQL cohorts; retain ordinary package jobs and the explicit PostgreSQL
catalog. Required gates join all cohorts. Then inspect E2E setup/fixture/report
intervals and update this work order before changing E2E execution.

## Exclusions

No application behavior, paid capacity activation, trust expansion, assertion
removal, automatic retries or delegation. Preserve unrelated user changes.

## Acceptance

Preserve explicit database/platform catalogs and complete test evidence. No blanket test removal or resource-guard bypass. Candidate choice follows observed bottlenecks.

## Files and dependencies

The backend/frontend/E2E workflow files, their registered contract tests and
CI performance evidence. Task 14 supplies the preceding measured result.

## Verification

```bash
python3 .github/scripts/repository-test-shard_test.py
python3 .github/scripts/backend-tests-workflow-contract_test.py
python3 .github/scripts/e2e-tests-workflow-contract_test.py
python3 scripts/list-docs.py validate
python3 scripts/lint-spec-files.py --all
git diff --check
```

## Results

Baseline run 38524205425 repository JSON contains 1,571 passing top-level tests,
769.6 seconds summed test duration and 771.3 seconds package elapsed. Retention
names account for only 147.9 seconds, so a retention/rest split would remain
unbalanced. Three round-robin native cohorts distribute both existing and new
names without maintaining a guessed list. PostgreSQL logs show 1,047 seconds
for the same package, with no single top-level test dominating. Hosted
acceptance remains pending.

## E2E candidate selected before implementation

Using successful main profile run 38554759444 against the current catalog,
1,336 normal project/file units retain all 3,808 tests. With two guarded
processes per hosted job, predicted slowest process work is 1,027.8 seconds
at 14 jobs, 685.8 at 21 and 514.7 at 28. Twenty-one jobs leave insufficient
headroom for build/setup/reporting, so measure 28 normal jobs; keep six container
jobs and every other platform unchanged. These are model estimates, not results.

Keep all normal manifest and report completeness checks synchronized at 28;
reject old-count, duplicate and incomplete metadata. Execute independent backend
and web build commands concurrently within the existing build job, join both
original processes even on failure, and only then build the delivery fixture.
Do not change build identity, permissions, retry policy or resource guards.

Additional verification: focused plan/timing/runner/subshard unit tests; native
catalog union with both profile and fallback; E2E workflow contracts including
parallel build failure propagation. Hosted coverage and all workflow elapsed
measurements remain required before adoption.

### Local candidate verification

The real repository launcher enumerated 1,904 native top-level tests and completed
cohort 1/3: 635 selected, 536 passed and 99 environment/platform skips, in
260.377 seconds package execution. Complete inventory, selection, raw JSON and
atomic coverage are retained outside Git under
`apps/backend/.build/full15-local-repository-1/`. This is one local normal cohort,
not PostgreSQL or full hosted acceptance.

Seven launcher tests cover native enumeration, disjoint future-name selection,
missing/duplicate/unselected results, nested tests, fuzz seeds, runnable examples,
command failure propagation and a real CLI race/coverage run. Backend workflow
contracts cover required joins and exact catalog delegation. The E2E planner,
timing, process and subshard checks pass 51 cases; 19 workflow checks include
actual parallel build joins and independent child failures.

### Sidebar resource lane

The first candidate's job 115897903303 remained in its memory step after the
fifteen-minute full-workflow budget. Workflow edits select this lane, so it
cannot be omitted from acceptance. Divide its 84 isolated pool combinations
across three complementary selectors as specified in the design, preserving
preparation, maximum-input, alternating, child concurrency, native-memory bounds
and the independent populated database timing lane. Verify actual Go nested
selection with a future sort key before adopting it.

The first memory lane completed successfully in 26m40s. Its scenario sums are
lastActivityAt 216.94s, runningFirstActivity 212.73s, state 230.58s, updatedAt
162.52s, createdAt 159.48s, title 158.17s, custom 158.31s and alternating 19.07s.
Use memory-1 for the first two sorts, alternating and the standalone memory
checks; memory-2 for state/updatedAt; memory-3 for createdAt/title/custom. This
balances observed work while retaining future sort keys in memory-1.

Both the historical-profile and no-profile native E2E plans were generated and
validated. Their exact unit IDs, file hashes and test counts match: 1,336 normal
units/3,808 tests across 28 jobs and 46 container units/153 tests across six jobs.
