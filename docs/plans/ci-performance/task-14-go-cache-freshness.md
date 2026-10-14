---
id: "14-go-cache-freshness"
title: "Refresh Go compilation caches"
status: in_progress
wave: 1
depends_on: []
plan: "plan.md"
requirements:
  - REQ-PLATFORM-CI-PERFORMANCE-007
  - REQ-PLATFORM-CI-PERFORMANCE-004
  - REQ-PLATFORM-CI-PERFORMANCE-005
acceptance_criteria:
  - AC-PLATFORM-CI-PERFORMANCE-007.1
  - AC-PLATFORM-CI-PERFORMANCE-007.2
  - AC-PLATFORM-CI-PERFORMANCE-007.3
  - AC-PLATFORM-CI-PERFORMANCE-007.4
  - AC-PLATFORM-CI-PERFORMANCE-004.1
  - AC-PLATFORM-CI-PERFORMANCE-004.2
  - AC-PLATFORM-CI-PERFORMANCE-005.1
system_design:
  - ../../specs/platform/system-design/ci-performance.md
---

# Task 14: Refresh Go compilation caches

## Summary

Separate module-download reuse from daily compilation snapshots across the
existing Linux Go cache consumers. Preserve full required verification and
measure the benefit after including cache transfer cost.

## In scope

- Implement the proposed `.github/actions/cache-go/action.yml` and
  `.github/scripts/go-cache-identity.mjs`, using installed toolchain paths and
  the compatibility fields defined in the system design.
- Replace combined caches in backend `static_checks`, `test_shards` (both
  members), `test_ambient_env`, and E2E `build`. Preserve a separate static
  analysis cache with its linter/configuration identity.
- Use a new namespace and daily UTC compilation generations, with exact
  module keys and compatibility-scoped compilation fallback. Resolve the day
  once and retain existing success-conditioned cache publication.
- Add TDD coverage for rollover, same-day reuse, changed dependencies/toolchain/
  image/platform/family, paths containing spaces, missing metadata, and cache
  failure. Extend workflow contracts and the CI contract-test registration if needed.
- Record read-only hosted evidence in `cache-report-evidence.md` and concise
  cache troubleshooting/rollback notes in `docs/ci-merge-queue.md`.

## Out of scope

Report images, Windows/Postgres/desktop/release cache migration, cache deletion,
new credentials, test selection, Go command changes, more workers, or local
cache-management redesign.

## Acceptance

1. Real source-only changes with unchanged dependencies can reuse prior-day
   compilation and save a fresh daily snapshot. Same-day reruns do not upload
   a new generation; incompatible families/environments cannot match a prefix.
2. Cache misses/service failures still run the existing commands. Failed or
   cancelled jobs do not save compilation snapshots, and every required gate
   and race/test selection is preserved.
3. Three comparable baseline/candidate samples demonstrate lower median
   occupied time, including restore/save, with source, cache generation, image,
   toolchain, ref, attempts, and cache sizes recorded. Missing hosted evidence
   keeps performance acceptance open; no speedup is inferred from a hit alone.

## Verification

Run from repository root. New helper/test files are deliverables. Add named
tests `daily rollover preserves compatible restore prefix`, `same day reuses
the generation`, `compatibility changes cannot match`, and `invalid identity
disables optional caching` to the identity suite. Extend existing workflow
tests with execution of cache-failure and required-command scenarios rather
than relying only on substring checks. Reuse the disposable real-Go probe in
`scripts/go-cache-reuse.test.sh` for compilation reuse/source invalidation.

```bash
node --test .github/scripts/go-cache-identity.test.mjs
bash scripts/go-cache-reuse.test.sh
python3 .github/scripts/backend-tests-workflow-contract_test.py
python3 .github/scripts/e2e-tests-workflow-contract_test.py
python3 .github/scripts/external-runner-workflow-contract_test.py
python3 .github/scripts/lint-action-pinning_test.py
actionlint .github/workflows/backend-tests.yml .github/workflows/e2e-tests.yml
zizmor .github/workflows .github/actions/cache-go/action.yml
python3 scripts/list-docs.py validate
python3 scripts/lint-spec-files.py --all
git diff --check
```

For hosted acceptance use the existing `.github/scripts/ci-efficiency.py` with
each actual run ID and attempt, then pair the job/step records with cache logs.
Record image and command parity; include unsuccessful attempts. Natural runs
are preferable to dispatching redundant full suites. The first new-namespace
cold run is reported separately. Verify an actual next-day save and later
restore, and inspect failed/cancelled runs for absent snapshot publication.
Do not mark the work order done from local tests alone.

## Files likely touched

- `.github/actions/cache-go/action.yml` (new)
- `.github/scripts/go-cache-identity.mjs` and `go-cache-identity.test.mjs` (new)
- `.github/workflows/backend-tests.yml`
- `.github/workflows/e2e-tests.yml` (build cache only)
- `.github/scripts/backend-tests-workflow-contract_test.py`
- `.github/scripts/e2e-tests-workflow-contract_test.py`
- `.github/workflows/lint-action-pinning.yml` (register new tests if needed)
- `docs/ci-merge-queue.md`
- `docs/plans/ci-performance/cache-report-evidence.md` (new)

## Dependencies

No earlier unfinished CI performance task blocks this scoped continuation.
Implementation begins only after the design-package handoff. Hosted evidence
requires authorized delivery or naturally occurring runs of the candidate.

## Risks

Daily snapshots trade freshness within the same day for bounded uploads.
Initial cold caches, cache quota pressure, or large restore/save cost can erase
the gain. Composite post-save semantics must be observed on GitHub; a unit test
cannot establish service behavior. Avoid broad fallback when identity fails.

## Parallelism

`sequential`

## Inputs

- [Requirements 007, 004 and 005](../../specs/platform/requirements/ci-performance.md)
- [Go cache generations](../../specs/platform/system-design/ci-performance.md#go-cache-generations)
- [Capacity decision](../../decisions/2026-10-08-capacity-aware-ci-verification.md)
- [Plan](plan.md), October 14 continuation.

## Results

Implemented the shared optional cache action and daily identity helper, with
separate module/build/lint paths. Local identity, real-Go reuse, workflow and
gate checks pass. Hosted cache behavior and performance acceptance remain open;
see [evidence](cache-report-evidence.md).
