---
created: 2026-10-09
status: draft
requirements:
  - REQ-PLUGINS-SDK-DISTRIBUTION-001
  - REQ-PLUGINS-SDK-DISTRIBUTION-002
  - REQ-PLUGINS-SDK-DISTRIBUTION-003
  - REQ-PLUGINS-SDK-DISTRIBUTION-004
system_design:
  - ../../specs/plugins/system-design/sdk-distribution.md
legacy_specs: []
---

# Implementation Plan: Versioned Plugin SDK Publishing

Start with the [complete proposal walkthrough](proposal-walkthrough.md) for
the five implementation steps and their relationship to issue #4358.

## Reassessment checkpoint

The [2026-10-15 design review and proposal](design-review.md) identifies five
release/verification gaps. Apply the required amendments before implementing
this draft package. The original structural checks below do not resolve these
findings. The review also labels one optional checker simplification separately.

## Overview

Deliver public Go and npm SDK packages for
[issue #4358](https://github.com/kdlbs/kandev/issues/4358), with pinned clean
consumer builds and an enforceable host baseline. Extract the Go module and
prove host continuity first, make the frontend artifact independently
installable second, add compatibility validation third, wire Stable publication
fourth, and finish author/release migration guidance fifth.

The user selected a shared independent SDK version, initially `0.1.0`, and an
SDK-wide minimum Kandev version. Requirements and design remain draft for this
design-package handoff. Work orders are pending; execution is sequential in the
primary conversation after a later explicit implementation request.

## Scope

### In scope

- A root `pluginsdk` Go module, canonical protobuf, migrated host imports,
  matching build layout, and an explicit SDK CI test boundary.
- A public npm tarball with standalone types and compatibility metadata.
- One compatibility record, intentional shared versions, and an author CI
  command checking actual installed Go/npm SDKs against the manifest.
- Stable release preparation, signed SDK tags, npm OIDC publication, public
  consumer verification, and partial-publication recovery.
- Live contract references, public author/release documentation, and a concrete
  external template migration handoff.

### Out of scope

- Backend module rename, new RPCs or manifest fields, and source alias shims.
- SDK Nightlies, feature-specific minimums, or SDK `1.0.0` promotion.
- Rendered UI, new Playwright flows, or changed plugin permissions.
- Mutating external plugin repositories or registry configuration during this
  monorepo implementation package.
- Running a Stable release as part of implementation. Public availability is a
  later release completion gate, not a claim made from local packaging tests.

## Technical approach

### Go extraction and host continuity

Move `apps/backend/pkg/pluginsdk` to `pluginsdk`, and move
`apps/backend/proto` to `pluginsdk/proto`. Migrate imports atomically, regenerate
the `go_package` identity, and retain the actual gRPC wire and go-plugin
handshake. Introduce SDK module/Make targets; the backend proto target delegates.
Use a backend-only `../../pluginsdk` replacement so unreleased host development
works without a workspace file. SDK consumers and SDK module metadata have no
replacement.

Audit `e2e.Dockerfile`, the backend Makefile, CI paths, test fixture build
commands, `.dockerignore`, module traversal, and the deprecation ledger. Docker
must preserve the module-relative layout before `go mod download`. The root
SDK gets explicit Go unit/race/vet CI coverage. Build a minimal legacy binary
from the verified pre-extraction `v0.97.0` source in a disposable directory;
test it against the new Host in a real subprocess. Do not commit a binary or
turn an old source snapshot into a second production SDK.

### Packaging and compatibility

Keep npm source exports and its runtime-free dependency boundary. Add package
repository/license metadata and the exported release-record file. The canonical
record lives in `pluginsdk/sdk-release.json`; the npm copy is generated and
checked. Initial `host_release` and minimum remain pending until Stable
preparation resolves the actual first shipping release. Do not write `0.97.0`
as the initial SDK floor: current source includes changes beyond that release.

Add `pluginsdk/cmd/kandev-sdk-check` and an internal compatibility package.
Use the existing YAML and SemVer libraries rather than custom parsers. The
command verifies selected Go module metadata and installed npm metadata,
rejects unpublished/local evidence, compares the maximum host baseline, and
checks each API-version set. It is read-only and does not import backend
manifest validation. The host's manifest constants remain runtime authority.

### Release boundary

Add dedicated scripts under `scripts/release/` for SDK metadata/version
preflight and publication. Keep the existing runtime package arrays and Nightly
state machine separate. Declare one contract-input inventory; version updates
are intentional and their change kind is reviewed, not inferred from text.

Extend `release.yml` prepare to stamp pending records into its existing release
PR and sign `pluginsdk/v<S>` at the same merge commit as the originating root
Stable tag. Extend backfill to verify and reuse those records/tags. Add a
`publish-plugin-sdk` job after `publish-release`, guarded like the existing
Stable jobs, with explicit success dependencies and protected OIDC identity.
An unchanged SDK runs verification and reports success without republishing.
Contributor notices and Stable completion include the SDK result.

Retries compare remote source and artifact integrity. A partial Go/npm release
resumes at the existing version; a mismatch fails. First-publish ownership/setup
is a maintainer prerequisite. Never create a placeholder `0.1.0` package or
silently add a long-lived npm token.

## Compatibility matrix

| Consumer or mode | Target behavior | Evidence |
| --- | --- | --- |
| Backend and in-tree fixtures | One current SDK source via host-local replacement | Host compile, targeted plugin/automation tests, real subprocess test |
| External Go-only plugin | Exact public module, no replacement/workspace | Clean Go build, vet, tests, checker |
| External frontend-only plugin | Exact npm tarball, no application graph | Independent NodeNext/bundler typecheck, checker frontend-only mode |
| Combined plugin | Check both resolved baselines and API sets | Clean consumer and mixed-SDK mismatch cases |
| Supported legacy binary | Existing wire/Host behavior | Pre-extraction binary against extracted host |

Dry-run, desktop-only validation, Nightly, and backfill are covered in the
release work order's workflow-mode matrix. Unsupported/draft/ambiguous evidence
fails the author check rather than defaulting to the current SDK version.

## Tests

All new test paths below are planned outputs of the named work order. Existing
SDK tests move with their source. Use TDD for new logic and meaningful failure
cases; import-only migration relies on compile/runtime evidence.

| Acceptance criteria | Test boundary and planned evidence |
| --- | --- |
| `001.1`, `001.3` | WO01: `scripts/pluginsdk/consumer-smoke.test.mjs`, fresh Go archive/proxy consumer; graph excludes backend; missing archive/dependency fails |
| `001.2`, `001.3` | WO02: `apps/packages/plugin-sdk/test/packed-consumer.node.mjs`, install packed artifact outside checkout and typecheck both resolution modes |
| `002.1`, `002.3`, `002.4` | WO03/04: `pluginsdk/internal/compatibility/release_test.go` and `scripts/release/plugin-sdk.test.mjs`, version/floor/API consistency and prepare stamping |
| `002.2` | WO03: `pluginsdk/internal/compatibility/check_test.go` and `pluginsdk/cmd/kandev-sdk-check/main_test.go`, resolved versions, missing/low minima, unsupported API, malformed/null metadata, local replacements/links, mixed SDK floors |
| `003.1`, `003.2` | WO04: `scripts/release/publish-plugin-sdk.test.mjs`, unchanged reuse, signed tag targets, registry failures, integrity mismatch, retry after uncertain response and partial completion |
| `003.3`, `003.4` | WO04: `.github/scripts/release-workflow-contract_test.py`, mode guards, downstream completion, contributor notices, provenance/OIDC/bootstrap boundaries |
| `004.1` | WO01: moved `serve_test.go`/`protocol_test.go`, existing runtime tests, new `sdk_binary_compatibility_test.go` with an actual legacy subprocess |
| `004.2` | WO05: public/harness/spec validators, canonical example/import audit, template handoff and clean consumer commands |

Criterion IDs in this table abbreviate the common prefix
`AC-PLUGINS-SDK-DISTRIBUTION-`.

## End-to-end author workflow

Create `scripts/pluginsdk/consumer-smoke.mjs` to orchestrate disposable Go and
TypeScript consumers. `--mode local` installs an exact local Go module archive
through a test proxy and a packed npm tarball, with caches outside the checkout.
`--mode public` fetches the exact Go/npm SDK version from public infrastructure.
Both modes build/vet/test a plugin, typecheck representative frontend Host
types, and run the compatibility check once WO03 exists. Before WO03, pass
`--skip-compatibility-check` explicitly. Negative cases prove the local
replacement cannot accidentally hide incomplete artifacts.

Release verification runs public mode. Record fresh-cache paths, selected
versions, signed source revision, registry integrity, and mapping in job output.
No browser interaction or mobile composition changes; no ASCII UI preview or
new Playwright suite is applicable.

## Work orders

- [ ] [Task 01: Extract Go SDK and preserve host execution](task-01-go-module.md)
- [ ] [Task 02: Package standalone frontend SDK](task-02-frontend-package.md)
- [ ] [Task 03: Enforce consumer compatibility](task-03-compatibility-check.md)
- [ ] [Task 04: Publish SDKs through Stable releases](task-04-stable-publication.md)
- [ ] [Task 05: Document author and maintainer migration](task-05-author-migration.md)

Dependency order: **01 -> 02 -> 03 -> 04 -> 05**. All work orders are sequential
because the module, canonical record, package metadata, and release contract are
shared. This sequence does not authorize subagents.

## Verification commands

Each work order contains its exact command block rooted at the repository root.
The principal checks are SDK Go race/vet, focused Host package tests and compile,
isolated packed npm typechecks, checker tests, mocked release tests, workflow
security contracts, and spec/public/harness validators. Future scripts named in
those blocks must be implemented in the work order that introduces them.

Use the repo's PR-documentation `validateCoverage` function against this package
to validate work-order frontmatter, requirement/AC ownership, plan backlinks,
and design coverage. Do not stage files merely to make a diff-based check see
new files; include untracked package files in the local adapter.

After implementation, promote the paired requirement to `active`, the design
to `current`, and this plan to `implemented` only when every work order passes.
Public package availability is recorded separately after authorized release.

## Verification results

Design-package validation on 2026-10-09:

- `python3 scripts/list-docs.py validate`: passed; 369 decisions and 1495
  specifications validated.
- `python3 scripts/lint-spec-files.test.py`: passed; 36 tests.
- `python3 scripts/lint-spec-files.py --all`: passed.
- Repository `validateCoverage` preflight: passed for all five work orders,
  using their actual files and a representative future `pluginsdk/serve.go`
  change to exercise coverage. No product file was created for this check.
- `git diff --check` and local artifact link/whitespace checks: passed. All new
  artifacts remain unstaged and uncommitted.

Product and release tests were not run in this planning turn. All work-order
results remain pending. Public Go/npm availability has not been established.

## Risks and delivery dependencies

- npm `@kandev` ownership and bootstrap/trusted-publisher configuration require
  maintainer access; they cannot be inferred from `publishConfig.access`.
- Moving 161 host imports and the proto root requires one atomic migration.
  SDK tests fall outside backend `./...`; Docker copy layout and CI discovery
  must be updated with the move.
- Go tags and npm uploads can expose a partial release. Completion is gated
  on verified installs; recovery must not move immutable source identities.
- The initial SDK host baseline is unresolved by design until the actual Stable
  release. Package and checker tests use resolved temporary test records; public
  publication rejects pending values.
- External template/Forgejo migrations are separate repository work. This
  package provides the public dependency contract and a handoff, not changes to
  those repositories.
