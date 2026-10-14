---
id: "15-remaining-critical-paths"
title: "Shorten remaining critical paths"
status: pending
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

Inspect Go package and PostgreSQL case timings and E2E setup/fixture/report intervals. Update this work order with exact candidates and tests before changing selection or execution.

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
python3 .github/scripts/backend-tests-workflow-contract_test.py
python3 .github/scripts/e2e-tests-workflow-contract_test.py
python3 scripts/list-docs.py validate
python3 scripts/lint-spec-files.py --all
git diff --check
```

## Results

Pending. Hosted evidence remains mandatory; local contracts do not prove speed.
