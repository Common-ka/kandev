---
id: "03-motion-eligibility"
title: "Persistent motion eligibility"
status: in_progress
wave: 3
depends_on: 
  - "01-dense-baseline"
plan: "plan.md"
requirements:
  - REQ-UI-PERSISTENT-STATUS-MOTION-004
  - REQ-UI-PERSISTENT-STATUS-MOTION-006
acceptance_criteria:
  - AC-UI-PERSISTENT-STATUS-MOTION-004.1
  - AC-UI-PERSISTENT-STATUS-MOTION-004.2
  - AC-UI-PERSISTENT-STATUS-MOTION-004.3
  - AC-UI-PERSISTENT-STATUS-MOTION-004.4
  - AC-UI-PERSISTENT-STATUS-MOTION-004.5
  - AC-UI-PERSISTENT-STATUS-MOTION-006.1
  - AC-UI-PERSISTENT-STATUS-MOTION-006.2
  - AC-UI-PERSISTENT-STATUS-MOTION-006.3
system_design:
  - ../../specs/ui/system-design/persistent-status-motion.md
---

# Task 03: Persistent motion eligibility

## Summary

Make host-owned persistent indicators respect reduced motion while preserving their default appearance. Reuse the already implemented hidden-motion lifecycle.

## In scope

- Add a failing runtime preference regression before modifying GridSpinner and shared motion primitives.
- Retain existing document/intersection/panel gates and normal-mode timing. Use a visible static pose for reduced motion, including CSS fallback.
- Test hidden-to-visible and reduce-to-normal changes, state settlement while hidden, listener/animation cleanup, and visible unfocused split panes.
- Count running and paused handles separately in the benchmark.

## Out of scope

Live instance mutations, unrelated refactors, new task/session creation, deployment,
and changes outside this package's contracts. No delegation is authorized.

## Acceptance conditions

1. Normal mode keeps existing geometry, colors, stagger, timing, and accessible status on desktop and phone.
2. Reduced-motion mode has no running infinite animation for the owned status targets; their status remains visibly identifiable in both animation engines.
3. Visibility/preference changes do not lose state or accumulate effects; targeted component and browser tests pass.

## Verification commands

Run the listed commands sequentially. New test files are implementation outputs;
they must exist before these commands count as verification. Use the guarded
E2E runner with fresh known artifacts. Capture RED/GREEN evidence for changed
logic and apply scoped lint to touched files.

```bash
cd apps/web
pnpm exec vitest run lib/ui/persistent-motion-visibility.test.tsx
pnpm exec vitest run components/grid-spinner.test.tsx
pnpm e2e:run --project chromium tests/chat/persistent-animation-motion.spec.ts
pnpm e2e:run --project mobile-chrome tests/chat/mobile-persistent-animation-motion.spec.ts
pnpm run typecheck
```

## Likely files

- `apps/packages/ui/src/persistent-motion-visibility.tsx`
- `apps/packages/ui/src/compositor-spin.tsx`, `compositor-pulse.tsx`
- `apps/web/components/grid-spinner.tsx` and tests
- `apps/web/app/globals.css` scoped motion rules
- Existing desktop/phone persistent-animation-motion E2Es

## Dependencies and parallelism

Requires the frozen baseline from `01-dense-baseline`. This independent motion
change follows the first transport repair while durable-stream receipt work
continues. Browser suites and benchmark arms still run sequentially.

## Inputs

Read the requirements and designs referenced in frontmatter, the
[plan](plan.md), and the [benchmark protocol](benchmark.md). Preserve existing
companion-plan ownership and historical results described by the plan.

## Risks

Pausing at zero scale or opacity can hide status. Static reduced-motion presentation must have an explicit visible pose. Global animation disabling would affect unrelated UI and plugins.

## UI preview

UI-01: Shared desktop/phone status region, as in [the plan](plan.md#ui-preservation-and-motion-preview).
The existing icon and label stay in place. Normal mode retains motion; reduced
motion shows the same visible status without animation. No control, geometry,
scroll owner, or navigation change is proposed. Verify both animation engines
and preference changes; a screenshot alone does not prove motion eligibility.

## Results

2026-10-23: Four failing component regressions confirmed that GridSpinner and
CompositorSpin ignored initial and changed reduced-motion preferences. Both
now cancel owned effects when reduced motion is enabled, restore normal motion
when it is disabled, and remove preference listeners on unmount. Scoped CSS
keeps the static grid cubes visible at their normal maximum scale. The existing
visibility controller and normal timing remain unchanged.

All 35 focused component tests pass, including hidden-to-visible transitions,
deferred grid setup, normal timing, and listener cleanup. Four desktop and
four phone Chromium tests passed, including real busy/settled transitions and
CSS fallback. Fresh-build targeted desktop and phone preference tests also
passed after the final timing-preservation adjustment. Frontend type checking,
scoped lint, and documentation validation passed.

The user-facing animation guide documents the static status behavior. Dense
A/B timing remains owned by work order 06. No CPU improvement is inferred from
an animation count alone.

## Threads header follow-up

The completed six-pair reference still had six running animations in reduced
motion. An attribution-only run (`matched-dense-1792795035161.json`) identified
all six as `thread-status-working` SVG elements with the one-second CSS `spin`
animation. Both arms used the same retained build and reproduced the same
owners. The summary tool excludes this short diagnostic from timing results.

The shared `ThreadSessionStatusIcon` also owns the phone header, session picker,
and mobile thread picker. A real browser regression failed before the change:
one SVG animation remained while reduced motion was active.

### Rejected shared-wrapper experiment

The first candidate moved starting/working icons into `CompositorSpin`.
Four desktop checks and nine phone checks passed, including both animation
engines, runtime preference changes, hide/show, settlement, and existing
Threads layout/navigation. Typecheck, scoped lint, and five summary-tool tests
passed. These checks establish correctness, not a performance gain.

Two alternating pairs completed with 1,000 tasks, six chats, 120 seeded primary
messages per chat, and 1,800 ordered stream updates per sample. All four samples
passed, with no HTTP or verification errors. Raw report:
`matched-dense-1792795466229.json`; summary:
`thread-motion-wrapper-two-pair-summary.json`; log:
`thread-motion-benchmark-logs/kandev-run.e2e.jNfjBXVf.log` (15.8 minutes).

Normal idle main-thread task time rose from 14,523 to 16,262 ms in pair 0 and from
15,321 to 15,795 ms in pair 1 (12.0% and 3.1% higher). Streaming main-thread task time fell by
2.0% and 4.3%, with essentially unchanged frame-gap p95. Reduced-motion idle
task time fell from 9,807 to 7,373 ms and from 8,682 to 6,833 ms (24.8% and 21.3%
lower). Reduced-motion running animations fell from six to zero.

The wrapper was removed because normal idle was slower in both pairs. Its
patch is retained as `rejected-thread-motion-wrapper.patch`. This does not
establish that all shared-spinner uses are slow; it is a result for this
fixture and this migration. Backend hashes were identical. Control assets:
`4ff1054df16bebc5e35a9fd75f94484f45f03fb2b063cf1d219a6346b67c77ee`;
rejected candidate assets:
`8cc45afce4d9359868d0bc6b731f77931546d516702f2b6f3230754574230468`.

### Narrow reduced-motion candidate

Apply `motion-reduce:animate-none` to the existing icon. This candidate changes
only the reduced-motion path and implements requirement 006; it leaves the
existing normal rotation target unchanged. Efficient rotation under requirement
001 and offscreen motion ownership remain unresolved for this legacy target.
The regression retains initial/runtime reduced motion, normal one-second CSS
rotation, unchanged label/14px geometry, and task settlement on desktop and
phone. The CSS-only path has one test per device rather than duplicate cases
for an unused Web Animations branch. Fresh-build checks passed: the desktop regression (14.6 seconds), phone
regression (21.3 seconds), typecheck, scoped lint, and documentation validation.
Matched timing completed in 16.7 minutes. All four samples verified 1,800
ordered updates, with no HTTP or verification errors. Reduced-motion idle
main-thread task time fell from 8,968 to 5,271 ms and from 9,245 to 5,986 ms (41.2%
and 35.3% lower; median paired reduction 38.2%). Running animations fell from
six to zero. Normal idle main-thread task time was 4.8% and 1.3% lower, but the normal production
path is unchanged and no default-idle gain is claimed. Streaming main-thread task time was 8.3%
higher in pair 0 and 4.1% lower in pair 1; no streaming gain is claimed.

Raw report: `matched-dense-1792796710483.json`; summary:
`thread-motion-css-two-pair-summary.json`; log:
`thread-motion-css-benchmark-logs/kandev-run.e2e.3QbnqMv5.log`.
[Committed evidence](evidence/threads-reduced-motion-1x.json) contains every
paired result, build hashes, fixture details, and verification counts.
Candidate assets:
`01e8b16fd50096caa2f324e177e53e555e9475578006facde9a2962ba1aef39e`.
The backend and control assets match the rejected wrapper experiment.

Keep the narrow CSS correction. Offscreen motion ownership for this legacy
SVG remains open; this work order is not marked complete. The public animation
guide already documents the reduced-motion contract, so no new product copy or
public documentation change is required.
