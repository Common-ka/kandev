# Go cache and report image acceptance evidence

Implementation is in progress. No performance improvement is claimed until
comparable hosted candidate evidence is available. Tasks 14–16 remain open.

## Baseline

Base source: `2705829f097d507225290ea3b649dd2cae9de8fb`, main, October 14, 2026.
Both workflows below succeeded on attempt 1 and used GitHub-hosted capacity for
the affected jobs. Report baseline image is anonymously resolvable:
`ghcr.io/kdlbs/kandev-ci@sha256:780b2a90f12011a44b8257bf47bf76e818156764e5834af85a8f9e8a8b0b921e`.

| Main run | Job | Occupied seconds | Cache restore seconds | Container startup seconds |
| --- | --- | ---: | ---: | ---: |
| [38524205488](https://github.com/kdlbs/kandev/actions/runs/38524205488) | E2E Build | 320 | 27 | 42 |
| Same | E2E Tests Passed | 88 | n/a | 28 |
| [38524205425](https://github.com/kdlbs/kandev/actions/runs/38524205425) | Backend Static Checks | 656 | 32 | 41 |
| Same | Backend Tests (1/2) | 1258 | 18 | 63 |
| Same | Backend Tests (2/2) | 1083 | 22 | 41 |
| Same | Backend ambient integration env | 406 | 7 | 46 |

Main E2E observed workflow elapsed: 1721 seconds; summed occupied runner time:
305.23 minutes. Backend observed elapsed: 1802 seconds; summed occupied runner
time: 129.05 minutes. These are different measures. Dependency-ready queue delay
and critical path are unknown without an exact workflow graph. Unaffected
Postgres/Windows jobs can dominate backend elapsed even if Go cache jobs improve.

Reproduce using `.github/scripts/ci-efficiency.py --run-id ID --attempt 1
--repo kdlbs/kandev --output OUTPUT.json`. Raw API-derived reports for this session
are in `/tmp/kandev-ci-evidence/`; the run links are the durable source.

## Local verification

- Cache identity suite: daily generation rollover, same-day reuse, incompatible
  family/dependency/toolchain/build environment separation, independent lint
  identity, safe paths and optional failure fallback.
- Real Go probe: reuse across checkout paths and invalidation after source
  changes passed with `GOTOOLCHAIN=go1.26.0 bash scripts/go-cache-reuse.test.sh`.
  The host default Go is 1.22.2; the probe's implicit `go1.24` auto-download is
  unavailable, so the explicit project toolchain was used.
- Backend/E2E workflow, external runner, action-pinning, required-gate and
  efficiency tests passed. Actionlint passed on the changed workflows.
- Zizmor 1.30.1: changed workflows/composite have no medium-or-higher findings.
  Full workflow scan reports pre-existing findings outside this change and
  informational local-action syntax suggestions; it is not a clean global audit.
- Report target built from the pinned Node 24 Debian slim image. Frozen workspace
  installation and real mixed-root Playwright replay passed, including eight test
  identities, retries, final failures, skips, HTML/JSON, and required-gate cases.
  Identical-byte baseline comparison passed for full semantic JSON output and
  attachment hashes; only generation timestamps were normalized.
- This host's default Docker bridge is missing. Local build used `--network host`;
  smoke runs use the task-owned `kandev-report-smoke` network. CI uses its normal
  default Docker bridge. No shared images or caches were deleted.

## Outstanding acceptance

1. Finish identical-byte replay against the baseline runtime and published report
   digest; record compressed registry layer sizes.
2. Publish only the immutable candidate through an explicitly authorized
   `report_only=true` dispatch; verify anonymous pull before consumer cutover.
3. Capture PR CI, including the initial cold cache run, subsequent compatible
   reuse, cache restore/save sizes and costs, failed/cancelled save behavior,
   and an actual next-day generation save/restore.
4. Compare at least three representative hosted baseline/candidate samples per
   design. Distinguish observational samples with different source/workloads
   from controlled evidence. Report job occupied time must include container
   startup and installation; a faster merge step alone is insufficient.
