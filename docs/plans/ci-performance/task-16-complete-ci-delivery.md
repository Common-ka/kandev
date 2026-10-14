---
id: "16-complete-ci-delivery"
title: "Measure and deliver complete CI"
status: pending
wave: 12
depends_on: ["15-remaining-critical-paths"]
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

# Task 16: Measure and deliver complete CI

## Outcome and scope

Collect hosted attempts, exact coverage reports, workflow identities and occupancy. Keep one bounded rollout active; resolve valid CI/review failures and merge the final passing head.

## Exclusions

No application behavior, paid capacity activation, trust expansion, assertion
removal, automatic retries or delegation. Preserve unrelated user changes.

## Acceptance

Three complete successful workflow sets meet 900 seconds including waiting. Partial, cancelled and failed runs remain visible and do not count. All required checks and reviews pass at the final head before authorized squash merge.

## Files and dependencies

The backend/frontend/E2E workflow files, their registered contract tests and
CI performance evidence. Task 15 supplies the preceding measured result.

## Verification

```bash
python3 .github/scripts/ci-efficiency_test.py
scripts/pr-state --compact <PR>
scripts/pr-resolve list <PR>
python3 scripts/list-docs.py validate
python3 scripts/lint-spec-files.py --all
git diff --check
```

## Results

Pending. Hosted evidence remains mandatory; local contracts do not prove speed.
