---
id: "03-motion-eligibility"
title: "Persistent motion eligibility"
status: pending
wave: 3
depends_on: 
  - "02-conversation-repair"
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

Requires `02-conversation-repair`. Sequential execution only.

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

Pending. No implementation or performance result is claimed.

