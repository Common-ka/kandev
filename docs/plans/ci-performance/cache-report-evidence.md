# Go cache and report image acceptance evidence

The lightweight report image has passed publication and paired hosted replay.
Three samples reduced median complete replay job time from 82 to 61 seconds
(25.6%). Three warm Go build pairs reduced median complete job time from 425 to
144 seconds (66.1%); cold population and compatible reuse are recorded below.
Verification of the latest head is maintained in
[PR #4486](https://github.com/kdlbs/kandev/pull/4486), so recording this evidence
does not mistake a documentation commit for an already verified PR head.

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

1. Observe an actual next-day generation save/restore and hosted failed/cancelled
   save absence. Deterministic rollover and failure-boundary tests pass, but
   they do not substitute for those operational observations.
2. Verify the latest PR head in the linked PR. Distinguish observational full CI runs from controlled
   replay/build measurements; neither proves lower total pipeline elapsed time
   without comparable complete-run evidence.

## Published candidate and review corrections

User authorized publication on October 14. [Publication run 38568106690](https://github.com/kdlbs/kandev/actions/runs/38568106690)
used definition/source `1c22f1675a0a987464993a76003f4432c2e5b76c` with
`report_only=true`; runtime, build, desktop and Postgres publication steps were
skipped. Report build, smoke, and publication passed in 120 seconds.

- Published tag: `ghcr.io/kdlbs/kandev-ci:report-sha-8699e598697b`.
- Index: `sha256:599d8a800bdd141f99924d9503988843c9d6ea386bfc57d04c83f1aa17f579aa`.
- Linux/amd64 manifest: `sha256:5f88da53eb2941e18a62952a1341f32dfad924fafeabe2f26d1ea9b68da68532`.
- Compressed layers: 121,784,187 bytes; runtime: 1,007,649,604 bytes (87.9% smaller).
- Anonymous pull used an empty Docker config. The published index passed
  `test-e2e-report-image.sh --image ghcr.io/kdlbs/kandev-ci@sha256:599d8a800bdd141f99924d9503988843c9d6ea386bfc57d04c83f1aa17f579aa --self-test --compare-image ghcr.io/kdlbs/kandev-ci@sha256:780b2a90f12011a44b8257bf47bf76e818156764e5834af85a8f9e8a8b0b921e`.
  Full semantic JSON and attachment hashes matched.

Initial PR workflows 38544495936 (E2E) and 38544495952 (backend), attempt 1,
passed. They are cold-cache samples, not speedup evidence: E2E build took 668s,
including 130s of cache post-save; backend shards took 1576s/1415s, including
116s/137s of post-save. The report still used the runtime image (104s).
Static checks took 893s with caching disabled: review identified an unsupported
`golangci-lint cache path` command. The correction uses an explicit
`GOLANGCI_LINT_CACHE` shared by identity discovery and the actual linter and adds
a successful CLI regression. First-run cold costs are retained in comparisons.

Review also added tracked-only container input and executable target-selection
coverage: report-script-only edits do not build/publish core images. Report
summary output distinguishes an unpublished local build from a published digest.

## Controlled hosted report comparison

[Run 38570183864](https://github.com/kdlbs/kandev/actions/runs/38570183864),
attempt 1, succeeded at source/definition
`6fa51456637abf9caa5238c6335b5ad879f0eccd`. The manual
`performance_probe=report` mode replayed saved blobs and manifests from main run
38524205488 in six sequential GitHub-hosted jobs. Baseline and candidate used
the immutable runtime and report index digests recorded above, identical source,
lockfile, and saved artifact bytes. No images were published by this probe.

| Image | Sample 1 seconds | Sample 2 seconds | Sample 3 seconds | Median seconds |
| --- | ---: | ---: | ---: | ---: |
| Baseline runtime | 88 | 82 | 75 | 82 |
| Candidate report | 60 | 65 | 61 | 61 |

These are complete occupied-job times, including container initialization,
dependency cache/install, saved artifact downloads, report generation and gate
checks, and semantic evidence upload. The median reduction is 21 seconds
(25.6%). They measure controlled report replay, not complete E2E workflow elapsed
time. The replay does not perform the production job's optional history-run
selection API calls. All six jobs succeeded; the run occupied 7.2 runner-minutes
and elapsed 444 seconds including scheduling.

All six normalized full semantic outputs were byte-identical, SHA-256
`9d937ba181f10b004abf8fd2a724272b4c95245bae7025627dbf7e3588bda548`.
They retained 3,958 test identities (3,911 first-pass, 7 after retry, 40 skipped,
zero final failures/timeouts) and 66 attachment hashes. Only generated/recorded
timestamps were normalized. The run's `report-probe-{baseline,candidate}-{1,2,3}`
artifacts retain the semantic JSON for seven days; the workflow and run logs
provide the reproducible procedure and execution record.

The actual [PR E2E run 38570176939](https://github.com/kdlbs/kandev/actions/runs/38570176939),
attempt 1 at the same source, also passed. Its report job took 73s, including
8s container initialization, 11s install and 7s merge, versus 88s in the recorded
main run. The whole workflow elapsed 1872s and occupied 328.7 runner-minutes,
versus main's 1721s/305.23 minutes: this full cold-cache run was slower overall.
Its Build job took 510s, including 8s cache setup/restore and 87s post-save.
This observational run confirms report integration; it does not establish
complete-pipeline improvement. Later head verification is tracked in the PR.

## Controlled hosted Go comparison

[Run 38570188498](https://github.com/kdlbs/kandev/actions/runs/38570188498),
attempt 1, uses definition and checkout
`6fa51456637abf9caa5238c6335b5ad879f0eccd`. The bounded manual
`performance_probe=go` matrix runs serially: baseline/candidate sample zero,
then three baseline/candidate pairs. It executes the production backend,
delivery-fixture and web build commands, with identical source and dependency
lockfiles. The baseline restores main's original combined cache; the candidate
uses the new module/build action. No images are published.

The first complete pair used build image
`sha256:b77c5f217a44e0554436b734e21b3fd4d25b0465c981c117a79d496ac750eff1`
on both sides (Go 1.26.0 in the image recipe). Baseline sample zero took 436s
and hit the existing 828,095,058-byte combined cache; it was not a cold baseline.
Candidate sample zero took 595s, missing both new keys and saving 721,075,403
bytes of compiled output plus 295,349,784 bytes of modules. Its cache post-save
occupied about 131 seconds. This population cost is retained, not discarded.

All eight jobs succeeded. Complete occupied-job timings, including startup,
installation and cache transfer, are:

| Cache strategy | Sample 1 seconds | Sample 2 seconds | Sample 3 seconds | Median seconds |
| --- | ---: | ---: | ---: | ---: |
| Baseline combined cache | 425 | 391 | 483 | 425 |
| Candidate separate caches | 144 | 145 | 134 | 144 |

The median reduction is 281 seconds (66.1%). Every sample used the same image
digest recorded above. All baseline samples restored the existing main cache;
all warm candidate samples restored both exact keys and skipped re-upload.
Baseline cache restore took 24/24/26 seconds; candidate discovery and restore
took 31/31/25 seconds. The backend/web build step itself took 331/272/385 seconds
for baseline versus 34/26/29 seconds for candidate. Thus the complete-job benefit
survives the somewhat larger cache transfer. The build generation is
`2026-10-14`. The full comparison occupied 45.9 runner-minutes and elapsed 2864
seconds including scheduling; no unsuccessful samples were omitted.

This establishes warm E2E-build improvement for the measured source and cache
state, not every backend family or total PR wall time. The first cold candidate
was slower as recorded above. Later generations can incur a new snapshot save;
the next-day observation remains open.

Cache keys and sizes are visible in the job logs. The candidate module key is
`go-mod-v2-db818dda829283c1a86d2ea894d44bd7d5066f427167818a8522a3e7b4eb1010`;
the build compatibility hash is
`2cf5d91d46d1c43eec48de6ecc25f5dbaa8b21a917e74d1fac24ed05b8774e73`.
The manual run caches are scoped to the feature branch; PR merge-ref caches
are separate. No caches were deleted to manufacture misses.

The pinned [cache action manifest](https://github.com/actions/cache/blob/55cc8345863c7cc4c66a329aec7e433d2d1c52a9/action.yml)
declares `post-if: success()`. The optional-cache regression also runs the real
extracted build/test commands after an injected cache-boundary failure. These
establish the configured behavior; a hosted failed/cancelled publication
observation and a natural next-day generation remain open for task 17.

The corrected static cache path also ran successfully on GitHub in job
115873191487 of backend run 38570176792. It restored the shared module cache
and saved separate compilation and lint generations; discovery did not fall
back to disabled caching. That static run was cold for the new build/lint keys
and is correctness evidence, not a warm static performance sample.

## Follow-up validation at 60690a432

[Backend run 38581011695](https://github.com/kdlbs/kandev/actions/runs/38581011695)
passed all 12 jobs. The previously failing Postgres mutation-fence case passed
in 0.71s without changing its assertion or the production 250ms work limit.
It also passed 20 consecutive local race-detector executions against disposable
Postgres before this hosted run.

[E2E run 38581011809](https://github.com/kdlbs/kandev/actions/runs/38581011809)
failed shard 14 on the transcript frozen-position assertion. The report gate
correctly propagated that failure. Its complete artifact audit found 3914
first-attempt passes, six passes after retries, one final failure and 40 skips.
The report produced these results using the published lightweight image;
its whole job took 73s, including failure reporting. This run does not establish
successful full-PR validation.

The E2E Build took 699s and missed both caches despite unchanged keys. Earlier
PR-scoped entries had disappeared. Repository cache usage was 9,813,117,958
bytes against its configured 10 GB capacity, consistent with eviction under
pressure; the available evidence does not identify an individual eviction.
No shared caches were deleted and no paid storage setting was changed.
The paired warm-cache result remains valid, but cache retention and sustained
total CI improvement remain unproven under the current capacity.

The failing scrolling spec and its product implementation are byte-identical
between this PR head and main `73c5ddb8c9550744655432d03edbe5872b6bbb80`.
The exact failed case passed locally with a fresh managed build and retries
disabled (18.6s). All seven cases in that spec then passed with one worker
restricted to two CPU cores (1.5m). These local passes do not explain the hosted
position failure.

The hosted live-follow trace does prove a selector defect: substring matching
finds both the submitted script and the agent response. The follow-up test-only
change scopes live-follow markers to agent message bodies and uses exact text
for response waits in the position test. This also prevents those waits from
succeeding on the submitted prompt before a response arrives. All seven cases
passed again under the same two-core limit with retries disabled (1.5m), and
the changed spec passed ESLint and Prettier. Assertions, timeout budgets and
product behavior are unchanged; hosted validation is still required.

The repository-tooltip case passed three consecutive runs with fresh workers,
the same two-core limit and retries disabled (28.5s total). Its hosted retry
failure remains unexplained; no tooltip code or assertion was changed.

## October 15 rebase onto PR #4489

The branch was rebased onto main `68bad6c7702cdccbc906b340c7193d10f73b1c9d`.
The shared Go cache action/helper and E2E Build use are already upstream.
Main also contains the scrolling selector changes and further wheel-settling
fixes; this branch retains no scrolling-spec diff. Main's host-based report
consumer is preserved, including GitHub CLI/Python blob downloads. The published
slim image lacks those tools and is no longer selected by this branch. Historical
runtime-versus-slim measurements do not establish a benefit over native hosting.
The remaining backend cache migration covers static checks, four ordinary test
shards and ambient verification. No rebased hosted performance result exists.

The actual successful post-merge main runs are E2E 38699936990 (2852s, 295.92
runner-minutes), backend 38699936984 (2231s, 276.12 runner-minutes), and frontend
38699936970 (782s, 29.18 runner-minutes). They started together. Full elapsed time
was 47m32s, including scheduling; combined occupancy was 601.22 runner-minutes.
The report job itself took 83s. These measurements differ from PR #4489's last
pre-merge successful set (16m18s); neither sample alone establishes repeatability.
Shard 10 was created at 07:42:48 UTC and started at 08:11:13, a 28m25s
scheduling gap before 548s execution. Its exact scheduling cause is not proven.
Build missed both Go caches, then saved the October 15 generation successfully.

The old benchmark workflow remains historical test tooling. Its E2E build commands
and runtime-container report baseline predate main's host execution and parallel
build changes; it must not be dispatched as a current-main comparison unchanged.
