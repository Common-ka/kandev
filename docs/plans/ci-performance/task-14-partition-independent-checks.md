---
id: "14-partition-independent-checks"
title: "Partition frontend and Windows verification"
status: in_progress
wave: 10
depends_on: ["13-e2e-runner-processes"]
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

# Task 14: Partition frontend and Windows verification

## Outcome and scope

Move frontend unit execution into four built-in shards parallel to static checks; partition whole Windows native steps into compilation, platform, persistence and settings groups. Preserve original commands and gates.

## Exclusions

No application behavior, paid capacity activation, trust expansion, assertion
removal, automatic retries or delegation. Preserve unrelated user changes.

## Acceptance

Exact frontend report union and every prior Windows step remain required once. Failure/cancellation/missing-report paths block aggregates. Hosted candidate reports execution, waiting and occupancy.

## Files and dependencies

The backend/frontend/E2E workflow files, their registered contract tests and
CI performance evidence. Task 13 supplies the preceding measured result.

## Verification

```bash
python3 .github/scripts/frontend-tests-workflow-contract_test.py
python3 .github/scripts/backend-tests-workflow-contract_test.py
python3 .github/scripts/ci-gates_test.py
python3 scripts/list-docs.py validate
python3 scripts/lint-spec-files.py --all
git diff --check
```

## Results

Local workflow contracts pass: frontend 11 cases, backend 19, runner placement 5,
required gate failure/skip/cancellation paths 5, action pinning 9. Catalog and
specification lint pass. Comparing every Windows step body against base
`5c6cf5196f886bdb29bcccf6530aa48174efef55` proves all 27 bodies unchanged apart
from their owner condition. The native Vitest sequencer selects all 2,948 files
exactly once across four 737-file shards. `vitest list --filesOnly` alone ignores
sharding and is not partition evidence. Hosted timing and case outcomes remain
pending; local contracts and enumeration do not prove speed.

Public documentation is unchanged: this affects repository CI scheduling only.
The contributor runbook and internal delivery documents describe the new layout.
