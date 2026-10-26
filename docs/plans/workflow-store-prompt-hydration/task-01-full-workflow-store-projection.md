---
id: "01-full-workflow-store-projection"
title: "Hydrate the workflow store with the full editable projection"
status: in_progress
wave: 1
depends_on: []
plan: "plan.md"
requirements:
  - REQ-UI-SETTINGS-MANUAL-SAVE-001
acceptance_criteria:
  - AC-UI-SETTINGS-MANUAL-SAVE-001.9
system_design:
  - ../../specs/ui/system-design/settings-manual-save.md
---

# Task 01: Full Workflow Store Projection

## Summary

Replace the partial workflow store projections with one shared
`mapWorkflowItem` so the workflow settings page never reads an omitted prompt
or description as a cleared server value.

## In scope

- `lib/routing/route-bootstrap.ts`: add `mapWorkflowItem`.
- `src/kanban-route.tsx`, `src/spa-routes.tsx`: drop local copies, use it.
- `lib/ssr/session-page-state.ts`,
  `components/task/mobile/session-task-switcher-sheet-hooks.ts`: use it.
- Unit and E2E regressions listed in [the plan](plan.md#tests).

## Out of scope

Backend, API, save coordinator, settings merge logic, `useWorkflows`.

## Acceptance

1. With the old projection, the settings-hook regression fails because the
   saved prompt and description are replaced by empty values; with the fix
   it passes.
2. After in-app navigation from the board, the prompt is visible and a step
   save leaves the persisted prompt unchanged (E2E).

## Verification

```bash
(cd apps/web && pnpm exec vitest run lib/routing/route-bootstrap hooks/domains/settings/use-workflow-settings lib/ssr/session-page-state src/kanban-route src/spa-routes components/task/mobile/session-task-switcher)
(cd apps/web && pnpm exec eslint --max-warnings 0 <changed files>)
(cd apps/web && pnpm run typecheck)
(cd apps/web && pnpm e2e:run --project chromium tests/workflow/workflow-settings.spec.ts -- --grep 'keeps the workflow prompt when a step is saved')
python3 scripts/lint-spec-files.py --all
```

## Results

Local run on Windows with Node 24.21.0, upstream `b6263ea4c`:

- RED: the settings-hook regression failed with the old projection
  (prompt and description emptied).
- GREEN: the vitest command above passed 213 tests in 19 files. The remaining
  failures are 5 structural cookie-guard tests in `route-bootstrap.test.ts`
  that build `C:\C:\...` paths on Windows; they fail identically on unchanged
  upstream.
- ESLint on the changed files: exit 0. Prettier check: clean.
- Web typecheck: no errors in changed files; the only errors come from tests
  that import backend fixtures outside this sparse checkout.
- The E2E harness needs Linux helpers and was not run locally; CI runs it.

## Files touched

- `apps/web/lib/routing/route-bootstrap.ts` and `.test.ts`
- `apps/web/src/kanban-route.tsx`, `apps/web/src/spa-routes.tsx`
- `apps/web/lib/ssr/session-page-state.ts`
- `apps/web/components/task/mobile/session-task-switcher-sheet-hooks.ts`
- `apps/web/hooks/domains/settings/use-workflow-settings.test.ts`
- `apps/web/e2e/tests/workflow/workflow-settings.spec.ts`
- `docs/specs/ui/requirements/settings-manual-save.md`
- `docs/specs/ui/system-design/settings-manual-save.md`
- This work order and `plan.md`.

## Dependencies

None.

## Parallelism

`sequential`.
