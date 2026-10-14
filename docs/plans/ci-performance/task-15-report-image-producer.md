---
id: "15-report-image-producer"
title: "Produce the lightweight report image"
status: done
wave: 2
depends_on: []
plan: "plan.md"
requirements:
  - REQ-PLATFORM-CI-PERFORMANCE-008
acceptance_criteria:
  - AC-PLATFORM-CI-PERFORMANCE-008.1
  - AC-PLATFORM-CI-PERFORMANCE-008.2
  - AC-PLATFORM-CI-PERFORMANCE-008.3
system_design:
  - ../../specs/platform/system-design/ci-performance.md
---

# Task 15: Produce the lightweight report image

## Summary

Add a small report-only CI image and prove it can process the existing report
formats. Deliver its producer before changing the required E2E consumer.

## In scope

- Add independent `report` target to the existing CI Dockerfile from an
  official Node 24 Debian slim base pinned to a resolved digest. Install
  pnpm 9.15.9 and only the shell/archive/checkout dependencies specified by the
  design. Preserve the three existing targets and browser images.
- Add build/load, replay smoke, and then publication steps to the existing
  image workflow. Preserve its push/dispatch authority and use a distinct
  BuildKit cache scope, content-hash tag, and summary entry for report.
  An isolated `report_only=true` dispatch publishes only the report candidate
  after explicit authorization, allowing consumer testing on this PR.
- Implement `.github/scripts/test-e2e-report-image.sh` and bounded fixture
  support under `.github/scripts/fixtures/e2e-report/`. Keep temporary test
  discovery and dependencies outside the shared checkout. Fixtures use the
  lockfile's real Playwright serializer without browser launches.
- Extend image/workflow contracts and their path filters. Test frozen workspace
  install, report scripts, mixed-root merge, artifact parity and verdicts in
  a fresh container. No host node_modules, credentials, or Docker socket mount.

## Out of scope

Changing the `e2e-report` image, report schema/logic redesign, dependency trimming,
Playwright upgrades, new jobs or runner capacity, publishing from PR validation,
and changing the other CI image targets.

## Acceptance

1. The report target contains no browsers, Go, Rust, or Docker executable and
   runs frozen installation and all existing reporting commands. Its compressed
   image target is at most half the existing runtime image; record actual sizes.
2. Replay preserves identities, outcomes, retries, durations, attachments and
   mixed-root handling. Corrupt/missing evidence and failed/cancelled required
   dependencies cannot produce a passing gate; explicit irrelevant skips pass.
3. Image publication is preceded by smoke validation and retains existing
   authority. The current report consumer remains usable throughout this
   producer-only delivery, and the published Linux/amd64 digest is recorded.

## Verification

The new smoke script accepts `--image REF --self-test` and optional
`--compare-image REF` and `--input-dir DIR`; implement these exact options.
Document the input directory's blobs/manifests/history layout alongside the
fixture support, so task 16 can replay saved hosted evidence. Comparison runs use
independent dependency/output directories and the same source/fixture bytes.
Run the actual workflow final-gate shell with controlled `needs` inputs; do
not create a duplicate result evaluator. Add contract tests for producer-only
rollout and smoke-before-publication.

```bash
python3 .github/scripts/e2e-tests-workflow-contract_test.py
python3 .github/scripts/lint-action-pinning_test.py
bash -n .github/scripts/test-e2e-report-image.sh
docker build --target report --tag kandev-ci-report:local --file .github/docker/ci-base/Dockerfile .
bash .github/scripts/test-e2e-report-image.sh --image kandev-ci-report:local --self-test
actionlint .github/workflows/ci-base-image.yml .github/workflows/e2e-tests.yml
zizmor .github/workflows
python3 scripts/list-docs.py validate
python3 scripts/lint-spec-files.py --all
git diff --check
```

Record the resolved baseline runtime digest and run the same smoke with
`--compare-image` against it. Compare image manifests' compressed layer sums,
not unrelated Docker disk-usage totals. Record any unavailable Docker/registry
evidence as pending. After authorized producer delivery and main publication,
pull the published immutable report digest and rerun the smoke. Publication
is a delivery checkpoint, not something local tests can simulate as complete.

## Files likely touched

- `.github/docker/ci-base/Dockerfile`
- `.github/workflows/ci-base-image.yml`
- `.github/workflows/e2e-tests.yml` (change-detection filters only)
- `.github/scripts/test-e2e-report-image.sh` (new)
- `.github/scripts/fixtures/e2e-report/` (new)
- `.github/scripts/e2e-tests-workflow-contract_test.py`
- `.github/workflows/lint-action-pinning.yml` (test registration if needed)
- `docs/plans/ci-performance/cache-report-evidence.md`

## Dependencies

No code dependency on task 14. Execute sequentially because shared workflow
tests and evidence files overlap. Task 16 requires actual published image
availability and successful digest replay from this task.

## Risks

Slim Debian may expose native dependency requirements hidden by the Playwright
base. Add a package only when frozen-install or replay evidence requires it.
Lockfile changes can alter report compatibility. Never put a nonexistent image
reference into required CI to bypass the producer/publication ordering.

## Parallelism

`sequential`

## Inputs

- [Requirements 008](../../specs/platform/requirements/ci-performance.md)
- [Lightweight E2E reporting](../../specs/platform/system-design/ci-performance.md#lightweight-e2e-reporting)
- `.github/AGENTS.md`, existing CI Dockerfile, image workflow and report job.

## Results

Report target built locally. Frozen installation, mixed-root real Playwright
replay, required-gate cases, and identical-byte baseline semantic/attachment
comparison passed. Isolated publication is implemented; authorized publication
run 38568106690 and anonymous published-digest replay
passed. Compressed layers are 87.9% smaller than the runtime baseline. See [evidence](cache-report-evidence.md).
