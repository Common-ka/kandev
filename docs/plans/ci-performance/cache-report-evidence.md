# Backend cache evidence

## Current scope

PR #4486 extends main's existing shared Go cache action to backend static
checks, four ordinary Go test shards and ambient verification. Required
commands, selections, race flags, deadlines and gates remain unchanged.
PR #4489 already merged the helper and E2E Build consumer. The report-image
producer, fixtures, consumer and obsolete benchmark dispatches are removed.
No backend speedup against this new main has yet been established.

The user approved the reduced scope on October 15. Main advanced from
`68bad6c7702cdccbc906b340c7193d10f73b1c9d` to
`5302566674b5db307a5d03fed79f4b62f884fe79` with the native async turn ownership
fix; the working branch was rebased again before delivery. The shared cache family allowlist is extended to all four backend shards;
its key and compatibility policy is unchanged. The user-applied 20 GB repository cache limit
remains the authorized setting; no caches have been deleted.

## Local validation

The cache identity suite covers daily generations, compatibility and safe
failure. The real-Go reuse probe covers source invalidation. Backend workflow
contracts execute required Go commands after an injected optional-cache failure.
Full backend/E2E workflow contracts retain main's four ordinary shards, separate
repository/Postgres cohorts and Windows selections. Relevant identity, workflow,
pinning, gate, Actionlint, Zizmor, catalog and specification checks are required
before pushing the narrowed branch. Hosted validation remains pending.

## Current-main scheduling baseline

At `68bad6c77`, successful attempt-1 runs started together on October 15:

| Workflow | Run | Elapsed seconds | Runner-minutes |
| --- | --- | ---: | ---: |
| E2E | [38699936990](https://github.com/kdlbs/kandev/actions/runs/38699936990) | 2852 | 295.92 |
| Backend | [38699936984](https://github.com/kdlbs/kandev/actions/runs/38699936984) | 2231 | 276.12 |
| Frontend | [38699936970](https://github.com/kdlbs/kandev/actions/runs/38699936970) | 782 | 29.18 |

Full elapsed time was 47m32s; combined occupancy was 601.22 runner-minutes.
E2E shard 10 was created at 07:42:48 UTC, started at 08:11:13 (28m25s waiting),
and executed for 548s. The report job executed for 83s. Build missed both Go
caches, then saved the October 15 generation. Scheduling delay is observed;
its precise cause must not be inferred solely from these timestamps.

PR #4489's final pre-merge successful set completed in 16m18s. That is a
separate sample and not the post-merge result above. Neither establishes
repeatability. Preserve failed, cancelled and partial overlapping runs when
assessing capacity. No scheduling-policy or paid-capacity change is part of
this PR.

## Historical results before PR #4489

These observations explain the investigation but do not measure the remaining
backend-cache candidate:

- [Go probe 38570188498, attempt 1](https://github.com/kdlbs/kandev/actions/runs/38570188498/attempts/1)
  used three complete warm pairs at the same source/build-image digest.
  Baseline 425/391/483s versus candidate 144/145/134s gave medians 425s and
  144s (66.1% lower). Cold candidate population took 595s including about
  131s post-save; the already cached baseline took 436s.
- After the owner raised cache capacity to 20 GB, isolated population job
  115960906852 took 609s. Reuse job 115967641057 took 148s, restored both exact
  keys in 33s, built in 34s and skipped uploads. Copied historical jobs in
  those rerun attempts were excluded from timing.
- [Report probe 38570183864](https://github.com/kdlbs/kandev/actions/runs/38570183864)
  reduced the old container baseline median from 82s to 61s. This comparison
  is obsolete now that main reports directly on its hosted runner.
- At old head `fe7d97c84`, 57 checks passed and 12 skipped. The full 34-report
  E2E audit had 3919 first-attempt passes, two retry passes, 40 skips and no
  final failure. Full E2E took 2478s versus the old main baseline's 1721s;
  backend took 2181s versus 1802s. Overall improvement was not demonstrated.

The cache action's pinned manifest declares success-only post-save, and local
failure-boundary tests pass. Natural next-day fallback/save and hosted
failed/cancelled snapshot-publication observations remain open acceptance
items. They are not replaced by the historical same-day reuse measurements.

## Scheduling investigation, October 15

A read-only sample covers twelve core workflow runs created between 07:00 and
08:25 UTC, including 255 jobs and cancelled PR attempts. Actual runner-assigned
execution intervals peak at twenty concurrent jobs. At 07:50, thirteen main
jobs overlapped five PR jobs; at 08:10, ten main jobs overlapped nine PR jobs.
The 07:38, 07:57 and 08:13 PR iterations competed with the uncancelled main run.
One main shard waited 1804s between creation and execution.

The organization API reports `plan.name=free`. GitHub's current
[Actions limits](https://docs.github.com/en/actions/reference/limits) list twenty
concurrent standard hosted jobs for Free, compared with sixty for Team. This
matches the observed peak and is evidence of capacity contention; a custom
support override and organization-wide activity outside this sample were not
verified. Earlier planning's approximate sixty-slot assumption is not supported
by this current account readback. The 20 GB cache allowance changes storage,
not concurrency. No plan, paid capacity, scheduling policy or other run was
changed or cancelled during this investigation.

A cross-check of the final pre-merge successful set (backend 38694389776,
frontend 38694389805, E2E 38694389881) includes 75 runner-assigned execution
intervals and reaches sixty simultaneous jobs at 06:52:19 UTC. Thus the Free
plan readback alone does not explain the difference. Effective capacity differs
between the observed windows; account-limit history, custom overrides and
competing work outside this repository remain unknown. Do not assume the current
default applied to the earlier run or attribute the entire slowdown to cache code.

## First narrowed-head validation and remediation

At `6ce780f27`, backend run 38724737341 exposed an integration defect: shard 3
passed its tests in job 116390150261, but identity discovery warned
`Go caching disabled: invalid cache family`. The inherited helper allowed only
`test-1` and `test-2`, so four-shard workflow wiring did not enable caching for
shards 3 and 4. This 565s job is not cold-population or reuse evidence; no cache
was saved. The superseded backend run was deliberately cancelled before the
remaining queued jobs consumed capacity; its cancellations remain historical.

A regression derives shard families from the actual backend matrix and verifies
all produce isolated compilation keys with a shared module key. It failed with
`invalid cache family` before the allowlist extension and passes after it;
unsupported family bounds remain rejected. Shared-helper edits now trigger E2E
verification through change filters, while E2E execution/report commands remain
unchanged. Fresh hosted validation is required after this correction.

## Corrected-head cold population

At `cdae54bda`, backend run 38727632804 enabled caching and successfully
published compilation snapshots. Initial occupied times include restore/save:

| Job | Main `530256667`, warm (seconds) | Candidate, cold (seconds) |
| --- | ---: | ---: |
| Static checks | 437 | 772 |
| Ordinary shard 2 | 446 | 864 |
| Ordinary shard 3 | 362 | 705 |
| Ordinary shard 4 | 414 | 796 |
| Ambient verification | 471 | 620 |

These individual main jobs passed, but its full backend run 38714650144 failed
on `TestGitCredentialHelperSupportsRepeatedRequests` with `Text file busy`.
The table is diagnostic, not a successful paired workflow comparison. The
candidate's initial population is slower; no warm backend benefit is established.
Both runs used build image digest
`sha256:b77c5f217a44e0554436b734e21b3fd4d25b0465c981c117a79d496ac750eff1`.
Shard 3 spent 552s testing and 89s saving caches. Static checks saved separate
compilation and linter generations. Ambient and static reused the module entry
saved by shard 3 and skipped its upload.

The host E2E module path is `/home/runner/go/pkg/mod`; backend containers use
`/root/go/pkg/mod`. Their visible module keys match, but GitHub's cache versions
include archive paths and differ. The host entry still existed when the first
container lookup missed. This miss is not evidence of eviction. Backend
consumers sharing the container path subsequently reused the container entry.

A complete 11:53 UTC repository snapshot included every nonterminal workflow
status and found twenty executing jobs across other PRs, thirteen Ubuntu and
seven Windows. A workflow can be `queued` while some of its jobs execute;
enumerating only `in_progress` workflows undercounts occupied capacity.

## E2E validation findings

Run 38727632745 failed two tests after the cold build. The queued-prompt
cancellation test missed its 300ms pending-state window: its first attempt
observed pending state before the button disappeared, and its retry waited for
pending after cancellation had settled. Both DOM snapshots showed a cancelled
turn and one retained queued message. One isolated local run and five
single-CPU repetitions passed with retries disabled, so local reproduction was
not established. The fixture now uses the existing cancellation-progress
pattern of an 8s mock hold and 12s test-only join budget on desktop and mobile.
All state, queue, execution-continuity and UI assertions remain intact.

The mobile goal drawer test measured its close control about 300ms after
opening and received `43.999969482421875` instead of at least 44 pixels. It
now waits for finite drawer animations using the helper already used later
in that test. The strict 44px assertion remains unchanged. These test-only
remediations passed nine focused single-CPU runs with one worker and retries
disabled: three desktop cancellation, three mobile cancellation and three
mobile drawer checks. A new hosted run remains required. They do not
change application behavior, worker counts, retries or locator timeouts.

## Warm backend extension and PID fixture remediation (2026-10-15)

Run `38737476804` on `59e0d5bcb` restored exact compilation caches for all
six backend consumers. Its Actions merge revision `821daf4bb` has the same
backend source tree as main `530256667` and used the same `b77c5f...` image.
The passing individual-job comparisons are:

| Job | Main | Warm PR | Saved |
| --- | ---: | ---: | ---: |
| Static | 7m17s | 3m25s | 3m52s |
| Tests 2/4 | 7m26s | 7m10s | 16s |
| Tests 3/4 | 6m02s | 5m33s | 29s |
| Tests 4/4 | 6m54s | 5m58s | 56s |
| Ambient | 7m51s | 7m35s | 16s |
| Total occupied time | 35m30s | 29m41s | 5m49s (16.4%) |

These are five different jobs, one sample each. Main's workflow failed elsewhere;
this is neither a successful full-pipeline comparison nor repeated paired
evidence. Static also restored its exact lint cache. All five successful jobs
skipped re-upload. Frontend passed in 73m02s elapsed, with 26.97 runner-minutes
and a verified execution-only critical path of 12m33s. Its final three-second
gate waited 26m15s after dependencies. Scheduling dominates elapsed time.

Shard 1 failed `TestRunOrphanReapPhaseDoesNotReportCapForTrailingPreSignalSkips`:
expected 256 simulated signals, observed 255. Its fixed synthetic PID range can
include the test process PID, which production ownership correctly protects.
A temporary fixture including `os.Getpid()` reproduced the exact failure. Four
generated PID ranges now sit above the process PID; signal-count, ordering,
permission and cap assertions remain. All 13 phase tests passed ten repetitions
with the race detector. Production behavior and retry policies are unchanged.
The failed hosted shard skipped both cache post-save actions. Its 4m01s result
is excluded from performance comparisons.

The two E2E catalogs before/after the observation fixes contain the same 3,957
test identities, with no additions or removals. Initial container artifacts
contain 63 passed tests, two skips and zero retries/errors. Full hosted E2E
completion, the PID-fixture follow-up commit, repeated paired measurements and
natural daily rollover still need verification; do not report full CI green
or overall elapsed-time improvement from these partial results.
