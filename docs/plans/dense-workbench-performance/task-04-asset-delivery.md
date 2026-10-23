---
id: "04-asset-delivery"
title: "Asset delivery and import boundaries"
status: pending
wave: 4
depends_on: 
  - "03-motion-eligibility"
plan: "plan.md"
requirements:
  - REQ-PLATFORM-WEB-ASSET-DELIVERY-001
  - REQ-UI-SESSION-REFRESH-EFFICIENCY-004
acceptance_criteria:
  - AC-PLATFORM-WEB-ASSET-DELIVERY-001.1
  - AC-PLATFORM-WEB-ASSET-DELIVERY-001.2
  - AC-PLATFORM-WEB-ASSET-DELIVERY-001.3
  - AC-PLATFORM-WEB-ASSET-DELIVERY-001.4
  - AC-UI-SESSION-REFRESH-EFFICIENCY-004.2
system_design:
  - ../../specs/platform/system-design/web-asset-delivery.md
  - ../../specs/ui/system-design/session-refresh-efficiency.md
---

# Task 04: Asset delivery and import boundaries

## Summary

Serve compressed immutable assets from the native server and preserve original decoded bytes. Defer an editor import only if the baseline trace proves that a closed surface loads it unnecessarily.

## In scope

- Implement and test deterministic smaller-only gzip siblings through the Vite build lifecycle.
- Implement quality-aware representation selection, MIME/cache headers, GET/HEAD, conditional/range behavior, identity fallback, and encoded error handling in the existing native handler.
- Trace packaging paths and smoke-test the production asset tree. Keep the shell private and API/WS handling unchanged.
- Use import initiators and chunk graphs to locate optional editor code. Move only a proven eager boundary to an existing lazy surface with unchanged loading/focus behavior. Record no change if no safe unused boundary exists.

## Out of scope

Live instance mutations, unrelated refactors, new task/session creation, deployment,
and changes outside this package's contracts. No delegation is authorized.

## Acceptance conditions

1. Compression negotiation tests pass and every served gzip asset decodes to the original bytes; all build entry points await completed siblings.
2. Packaged native assets load Threads and task detail on desktop and phone, with correct identity fallback, caching, HEAD, and ranges.
3. Any import deferral has a measured reduction before first use and a real editor-open regression test; report cold byte gains separately from warm CPU.

## Verification commands

Run the listed commands sequentially. New test files are implementation outputs;
they must exist before these commands count as verification. Use the guarded
E2E runner with fresh known artifacts. Capture RED/GREEN evidence for changed
logic and apply scoped lint to touched files.

```bash
cd apps/web
node --test scripts/precompress-assets.test.mjs
pnpm run build:vite
pnpm run typecheck
cd ../backend
go test ./internal/webapp
cd ../web
pnpm e2e:run --project chromium tests/performance/dense-workbench-correctness.spec.ts
pnpm e2e:run --project mobile-chrome tests/performance/mobile-dense-workbench-correctness.spec.ts
```

## Likely files

- `apps/web/vite.config.ts`
- `apps/web/scripts/precompress-assets.mjs` and `.test.mjs` (new)
- `apps/backend/internal/webapp/handler.go` and handler tests
- Production asset-copy/archive paths identified during the packaging audit
- Only the optional editor import boundary demonstrated by work order 01

## Dependencies and parallelism

Requires `03-motion-eligibility`. Sequential execution only.

## Inputs

Read the requirements and designs referenced in frontmatter, the
[plan](plan.md), and the [benchmark protocol](benchmark.md). Preserve existing
companion-plan ownership and historical results described by the plan.

## Risks

Wrong variant headers can break caches or execute compressed bytes as JavaScript. Sidecars omitted from packaged assets erase the benefit. Lazy imports must not delay an already-visible composer or lose selection.

## Results

Pending. No implementation or performance result is claimed.

