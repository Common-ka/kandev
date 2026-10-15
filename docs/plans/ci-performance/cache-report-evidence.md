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
fix; the working branch was rebased again before delivery. The shared cache
implementation is unchanged. The user-applied 20 GB repository cache limit
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
