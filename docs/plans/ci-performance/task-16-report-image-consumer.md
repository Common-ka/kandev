---
id: "16-report-image-consumer"
title: "Adopt and measure the report image"
status: pending
wave: 3
depends_on: ["15-report-image-producer"]
plan: "plan.md"
requirements:
  - REQ-PLATFORM-CI-PERFORMANCE-008
  - REQ-PLATFORM-CI-PERFORMANCE-004
  - REQ-PLATFORM-CI-PERFORMANCE-005
acceptance_criteria:
  - AC-PLATFORM-CI-PERFORMANCE-008.1
  - AC-PLATFORM-CI-PERFORMANCE-008.2
  - AC-PLATFORM-CI-PERFORMANCE-008.3
  - AC-PLATFORM-CI-PERFORMANCE-008.4
  - AC-PLATFORM-CI-PERFORMANCE-004.1
  - AC-PLATFORM-CI-PERFORMANCE-004.2
  - AC-PLATFORM-CI-PERFORMANCE-005.1
  - AC-PLATFORM-CI-PERFORMANCE-005.5
system_design:
  - ../../specs/platform/system-design/ci-performance.md
---

# Task 16: Adopt and measure the report image

## Summary

Switch the required report job to the published and replay-tested report
digest. Prove the startup improvement while preserving its complete verdict.

## In scope

- Verify task 15's published Linux/amd64 image can be pulled anonymously and
  matches its recorded digest. Record the previous runtime digest for rollback.
- Change only `e2e-report` to the verified digest. Replace the live apt fallback
  with explicit prerequisite checks; retain frozen dependency installation,
  reporting commands, paths, histories, artifacts, timeout, and required gate.
- Extend contracts for the new image, tool validation and unchanged verdicts.
  Reuse task 15's harness with the actual published image and saved hosted
  blob/manifests/history inputs where available.
- Compare three hosted baseline/candidate samples and record outcome in
  `cache-report-evidence.md`; update internal image/rollback operating notes.

## Out of scope

Browser shard images, extra report/gate jobs, new scheduling stages, changes to
test retries, reporting schemas, test selection, runner placement or capacity.

## Acceptance

1. The consumer references an existing verified immutable digest and retains
   `E2E Tests Passed`, all current dependency joins, `if: always()`, and required
   evidence. Failure, cancellation, malformed/missing evidence and deliberate
   skip outcomes match the baseline, including mixed-root and flake cross-checks.
2. All reporting artifacts retain their semantics and attachment bytes under
   paired replay. Missing optional history retains its existing fallback;
   missing mandatory report evidence never becomes successful verification.
3. Three comparable hosted samples demonstrate lower median complete report
   execution, including initialization and installation. Record failures,
   queue/provisioning separately, and a tested rollback digest. Keep performance
   acceptance open if samples are unavailable or inconclusive.

## Verification

Run from repository root. Substitute the literal verified report and runtime
digests from task 15 when recording the executed replay command. Do not dispatch
extra full suites solely to generate reports; replay existing artifacts first.
Use naturally occurring hosted runs where comparable. Any separately authorized
benchmark runs must be bounded and avoid simultaneous full baseline/candidate suites.

```bash
python3 .github/scripts/e2e-tests-workflow-contract_test.py
python3 .github/scripts/external-runner-workflow-contract_test.py
python3 .github/scripts/ci-efficiency_test.py
python3 .github/scripts/lint-action-pinning_test.py
actionlint .github/workflows/e2e-tests.yml
zizmor .github/workflows
python3 scripts/list-docs.py validate
python3 scripts/lint-spec-files.py --all
git diff --check
```

Run `test-e2e-report-image.sh --image <verified-report-digest> --self-test
--compare-image <recorded-runtime-digest>` with those real references. The
harness's optional `--input-dir` accepts a copied saved complete report input
set; implement and document its blobs/manifests/history layout in task 15.
Keep generated dependency and output directories separate for each image.
Record exact executed commands and digests in Results; placeholders are not
execution evidence. Use `.github/scripts/ci-efficiency.py --run-id <ID>
--attempt <N> --output <path>` for each observed hosted attempt and retain
source/definition/image identity with the report-job step comparison.

## Files likely touched

- `.github/workflows/e2e-tests.yml` (report job only)
- `.github/scripts/e2e-tests-workflow-contract_test.py`
- `.github/scripts/test-e2e-report-image.sh` and fixture support, if a replay gap is found
- `docs/ci-merge-queue.md`
- `docs/plans/ci-performance/cache-report-evidence.md`

## Dependencies

Task 15 and its published digest are mandatory. This is a separate consumer
delivery after producer publication; a successful local build is insufficient.

## Risks

Image size does not predict registry pull time reliably. Cache warmth and hosted
scheduling can dominate short samples. Missing hosted artifacts require fresh
fixture evidence and later real-report confirmation, not invented parity claims.
If compatibility or performance fails, restore only the recorded runtime image
reference and tool bootstrap, leaving cache work and verification policy intact.

## Parallelism

`sequential`

## Inputs

- [Requirements 008, 004 and 005](../../specs/platform/requirements/ci-performance.md)
- [Lightweight E2E reporting](../../specs/platform/system-design/ci-performance.md#lightweight-e2e-reporting)
- [Producer work order](task-15-report-image-producer.md)
- [External runner boundary](../../decisions/2026-09-06-opt-in-external-e2e-runners.md)

## Results

Pending. The required report job still uses its existing image.
