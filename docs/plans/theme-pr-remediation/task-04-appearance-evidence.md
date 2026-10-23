---
id: "04-appearance-evidence"
title: "Repair Appearance fixtures and reconcile evidence"
status: done
wave: 2
depends_on:
  - "01-theme-update-admission"
  - "02-vscode-defaults"
  - "03-pierre-options"
plan: "plan.md"
requirements:
  - REQ-UI-APP-THEMES-002
acceptance_criteria:
  - AC-UI-APP-THEMES-002.1
  - AC-UI-APP-THEMES-002.5
system_design:
  - ../../specs/ui/system-design/application-themes.md
---

# Task 04: Repair Appearance Fixtures and Reconcile Evidence

## Summary

Restore the existing Appearance regressions with representative auth, theme
context and optional-store fixtures. Record the combined repair checks and
replace the live PR's obsolete blocker/verification prose after successful fixes.

## In scope

- Reproduce the thirteen existing Appearance failures before changing fixtures.
- Supply the auth shape used by `useIsAdmin`, full built-in theme context and
  required optional-store accessors. Preserve all existing save, discard,
  storage and delayed-response assertions; do not mock away the theme card.
- Run the combined affected suites after the final production edit.
- Synchronize this package and the original application-themes plan/delivery
  record, keeping historical evidence distinct from final verified results.
- On authorized delivery, commit and push through the normal skills, then
  preserve the live PR body while replacing obsolete blocker claims. Keep the
  PR in draft unless the user requests promotion. Do not merge or monitor CI
  beyond the user's requested scope.
- Refresh affected desktop/phone PR screenshots through `/pr` if the final
  fixes change rendered output; retain untouched bot and preview sections.

## Out of scope

Weakening production authorization, replacing behavioral assertions with
visibility-only checks, unrelated failures and broad local verification.

## Acceptance

1. All eighteen existing Appearance cases pass, including the thirteen
   previously blocked before their assertions. No case is removed or skipped.
2. All targeted checks below pass at the final edited tree; documentation
   records actual outcomes instead of planned or stale counts.
3. Any delivered PR update preserves existing body content outside owned
   changes and clearly distinguishes local results from pending remote checks.

## Verification

```bash
(cd apps/web && pnpm exec vitest run components/settings/general-settings.test.tsx components/theme/app-theme.test.tsx components/theme-provider.test.tsx lib/theme components/settings/plugins/use-plugin-update-action.test.tsx components/settings/plugins/use-plugin-actions.test.tsx hooks/domains/plugins/use-plugin-updates.test.ts lib/api/domains/themes-api.test.ts)
(cd apps/backend && go test -trimpath ./internal/plugins/... ./cmd/plugin-pack ./cmd/plugin-package-verify)
(cd apps/backend && go test -trimpath ./internal/backendapp ./internal/gateway/websocket -run Theme -count=1)
node --test plugin-registry/build-index.test.mjs
(cd apps/web && pnpm run typecheck)
python3 scripts/list-docs.py validate
python3 scripts/lint-spec-files.py --all
git diff --check
```

Run changed-file ESLint and `bash scripts/lint-go-changed <changed-go-files>`
after the final file inventory is known. Tasks 01 and 02 own the focused
desktop/phone E2E checks; repeat them only for subsequent relevant changes.

## Files likely touched

- `apps/web/components/settings/general-settings.test.tsx`
- `docs/plans/theme-pr-remediation/{plan.md,task-*.md}`
- `docs/plans/application-themes/{plan.md,delivery.md}`

## Dependencies

Tasks 01-03 must pass their checks before combined verification and delivery.

## Risks

Test fixtures must represent the production guard's inputs. A newly passing
suite obtained by bypassing the card or removing assertions is not remediation.
Do not mark the PR ready to merge from local checks alone.

## Parallelism

`sequential`

## Inputs

The appearance design's preview/persistence contract, existing settings
regressions and the original application-themes delivery records.

## Results

- Red: all 13 previously reported Appearance failures reproduced before fixture
  changes. The production theme card and authorization guard remain exercised.
- Green: the fixture supplies authenticated admin state, a complete built-in theme
  context and optional-store access. All 18 existing Appearance cases pass,
  preserving save/discard/failure and concurrent-edit assertions.
- Combined frontend: 15 files, 89 tests passed. After the test callback annotation
  correction, the affected update-action file passed again (9 tests).
- Full Go plugin/theme/marketplace/store/runtime and package CLI suites passed;
  focused theme update/review/lifecycle tests passed with `-race`. Boot-payload
  and WebSocket theme integration checks passed.
- Registry: 28 tests passed. Web typecheck passed with
  `NODE_OPTIONS=--max-old-space-size=8192` after the default 4 GiB heap exhausted.
  Changed-file ESLint and Go lint passed.
- Production-artifact E2E: 3 desktop and 2 phone scenarios passed, covering catalog
  installation, Installed-tab updates, VS Code defaults, selection/save/reload and
  unavailable-theme recovery. Final importer refactoring was followed by reruns.
- Public-doc validation and its test passed (56 published pages). Appearance is a
  how-to guide; theme authoring is a reference. Both document the repaired behavior.
- Documentation catalog/spec validation and whitespace checks passed.
- Original delivery evidence is preserved as historical. The live PR remains
  draft; its final validation/body update preserves screenshots and bot sections.
