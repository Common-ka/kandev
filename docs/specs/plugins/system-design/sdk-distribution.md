---
status: draft
system: plugins
requirements:
  - REQ-PLUGINS-SDK-DISTRIBUTION-001
  - REQ-PLUGINS-SDK-DISTRIBUTION-002
  - REQ-PLUGINS-SDK-DISTRIBUTION-003
  - REQ-PLUGINS-SDK-DISTRIBUTION-004
---

# Plugin SDK Distribution System Design

## Purpose and boundaries

The plugin system owns the public dependency boundary and compatibility record.
The [release system](../../release/README.md) provides Stable preparation,
signed tags, npm publication, and recovery. This design introduces no plugin
runtime behavior, Host authority, or UI composition changes.

The version policy is recorded in the
[SDK ADR](../../../decisions/2026-10-09-published-plugin-sdk.md).

## Requirement mapping

| Requirement | Design sections |
| --- | --- |
| `REQ-PLUGINS-SDK-DISTRIBUTION-001` | Go module boundary; Frontend package; Clean consumers |
| `REQ-PLUGINS-SDK-DISTRIBUTION-002` | Release record; Consumer compatibility command |
| `REQ-PLUGINS-SDK-DISTRIBUTION-003` | Stable release integration; Failure and recovery |
| `REQ-PLUGINS-SDK-DISTRIBUTION-004` | Host integration and migration; Author guidance |

## Current evidence

At planning time, `apps/backend/go.mod` declares `github.com/kandev/kandev`.
The Go SDK's production imports outside the standard library are go-plugin,
gRPC, protobuf, and the generated plugin protocol. Tests also use testify.
There are 161 host/fixture Go files importing the SDK outside its own package.

`apps/packages/plugin-sdk` is version `0.1.0`, exposes `src/index.ts`, has no
runtime or peer dependencies, and has standalone contract tests. The web host
binds its types in `apps/web/lib/plugins/types.ts`. `release.yml` currently
publishes only the CLI and runtime npm packages. The canonical external template
uses both a backend `replace` and a frontend `file:` dependency. These are source
observations, not the target public installation contract.

## Go module boundary

Move the existing SDK package and tests to root `pluginsdk/`, retaining package
name `pluginsdk`. Create a minimal `go.mod`/`go.sum`; begin with the current
supported Go toolchain rather than adding a separate toolchain downgrade.
Derive dependency versions from the extracted imports and `go mod tidy`, not
from a copy of the backend dependency list. Keep production SDK imports free of
backend packages. Test dependencies remain test-only.

Move the sole canonical `plugin.proto`, generated `.pb.go` files, and Buf
configuration to `pluginsdk/proto/`. Set `go_package` to
`github.com/kdlbs/kandev/pluginsdk/proto/kandev/plugin/v1;pluginv1` and regenerate
with the existing pinned tools. Keep `package kandev.plugin.v1`, service/method
names, message field numbers, defaults, and handshake unchanged. Go package
identity changes; the wire contract does not.

Give the SDK its own `Makefile` proto target, and preserve
`make -C apps/backend proto` as a delegation to it. Move existing generation
tests with the source. No old generated package or SDK alias facade remains.
The Go release tag is `pluginsdk/v0.1.0`, matching the module subdirectory.
[Go's module rules](https://go.dev/ref/mod#vcs-version) require that tag prefix.

## Host integration and migration

The backend keeps its existing module identity. Require the new SDK module and
use `replace github.com/kdlbs/kandev/pluginsdk => ../../pluginsdk` for same-tree
development. This replacement belongs to the backend main module only; the
SDK's published `go.mod` must contain no replacement. Do not introduce `go.work`
as a prerequisite for existing host commands.

Migrate all host, fixture, and SDK test imports atomically with extraction.
Root builds, targeted tests, and proto generation must work before that work
order completes. The local replacement deliberately follows current source so
an unpublished contract change can be tested before its first tag exists.

Build paths that currently copy only `apps/backend/` must retain the relative
`apps/backend` to `pluginsdk` layout. In particular, `e2e.Dockerfile` currently
flattens the backend into `/build`; change its Go stage to `/build/apps/backend`
and copy the SDK to `/build/pluginsdk` before module download. Audit build
contexts, sparse checkouts, scripts, and module enumeration: `go test ./...`
inside the backend no longer includes SDK tests. Add an explicit SDK CI step.
Preserve deprecation history when updating the moved SDK source path in
`config/architecture-lint/deprecation_ledger.json`.

A legacy binary fixture, built from the pre-extraction public SDK without new
imports, proves handshake and a Host state round trip against the new host.
Keep its legacy SDK snapshot bounded and test-only; it is not another
production protocol source. Record the snapshot revision. Existing
`TestServe_EndToEnd` is a same-process gRPC harness, so it alone is insufficient
evidence for this binary compatibility outcome.

## Frontend package

Keep the current runtime-free TypeScript source exports and npm package name.
Publish `src`, the release record, README, and license; add repository metadata
with the package directory so provenance identifies the monorepo source.
Expose `./sdk-release.json` for tooling without introducing a runtime dependency.
The current host receives types through its workspace dependency.

Generate the package's release-record copy from the canonical Go module record,
with a consistency check; do not maintain two editable policies. Add an isolated
tarball consumer test using an independent tsconfig and the packed artifact.
Retain the no-dependencies/no-bare-import tests, and verify both NodeNext and
bundler TypeScript resolution. No runtime code is promised by the type exports.

## Release record

The proposed canonical file is `pluginsdk/sdk-release.json`. Versioned fields:

| Field | Meaning |
| --- | --- |
| `schema_version` | Record schema, initially `1` |
| `sdk_version` | Shared SDK version, initially `0.1.0`, without Go's `v` prefix |
| `host_release` | Exact originating Stable version for this SDK publication |
| `min_kandev_version` | SDK-wide minimum host, at most `host_release` |
| `api_versions` | Supported manifest integers; initially the actual `[1, 2]` |
| `change_kind` | `initial`, `patch`, `additive`, or `breaking` for this release |

For an unpublished SDK change, `host_release` may be null. A null host minimum
means the next actual Stable host release is required. These nulls are draft
state, never valid published metadata. Stable preparation fills `host_release`
from its computed release and fills a null minimum with that version in the
release PR. Compatible SDK fixes can retain an earlier non-null minimum.
Backfill reads the record from the existing signed tag and never restamps it.

New Go and npm artifacts for one SDK version contain identical records. They
originate from the same root Stable tag commit. A later host release reusing
that SDK references its original record; it does not change the record's
`host_release`. Publish the mapping in host release notes and artifact metadata.

PR/release checks compare the public contract inputs against the previous SDK
tag. Inputs include SDK production source and module declarations, protobuf
source, frontend SDK declarations, frontend Host public bindings, and manifest
API/capability version policy. Declare that inventory once in release tooling.
Changed inputs require an intentional shared SDK version and change kind;
tests, comments-only changes, and implementation-only fixes may conservatively
cause a compatible patch release. Do not infer a semantic change kind from a
text diff. Check the declared kind and version progression; semantic reviewers
judge whether the declaration matches the change.

API constants in `internal/plugins/manifest/manifest.go` remain the runtime
authority; consistency tests compare them with the release record. SDK SemVer,
manifest `api_version`, protobuf package `v1`, and go-plugin ProtocolVersion `1`
are separate axes. Extraction increments none of the last three.

## Consumer compatibility command

Ship a Go command at `pluginsdk/cmd/kandev-sdk-check`, usable as:

```bash
go run github.com/kdlbs/kandev/pluginsdk/cmd/kandev-sdk-check@v0.1.0 \
  --manifest manifest.yaml \
  --frontend-sdk node_modules/@kandev/plugin-sdk
```

The frontend flag is omitted for Go-only plugins. Support `--frontend-only` for
projects without a backend SDK dependency. Resolve the Go SDK via `go list -m
-json` in the consumer's directory with `GOWORK=off`; inspect the selected
module version and its record, not just the verifier's own version. For the
frontend, inspect the installed package manifest and its release record. The
author installs and freezes dependencies before running the check.

Reject missing SDKs, draft/null records, metadata/package version disagreement,
SDK pseudo-versions, Go replacements, and frontend packages resolved through
local workspace/file dependencies. Inspect npm `package-lock.json` or pnpm
`pnpm-lock.yaml` to establish registry resolution. Normal pnpm symlinks into
its managed dependency store are valid; a symlink alone is not evidence of a
local SDK substitution. Missing or unsupported lock evidence fails with a
specific diagnostic. Require the caller's minimum host to be at least the
maximum of the consumed SDK floors and `api_version` to be in each relevant
supported set. Plugins may intentionally pin different releases from the shared
SDK train; both are checked. The checker is read-only and exits nonzero with a
specific mismatch; it does not rewrite a manifest or bump dependencies.

Use existing `gopkg.in/yaml.v3` for bounded manifest parsing in this command,
and a maintained SemVer parser already used by the repo for comparison. These
small checker dependencies belong to the SDK module, with no backend import;
the author runtime package still only imports its current transport dependencies.
Do not create a second full manifest validator. Runtime install validation and
capability/version gates remain authoritative in Kandev.

## Stable release integration

Extend the existing `.github/workflows/release.yml` and its protected release
environment. Do not add the SDK to the runtime package array, which also feeds
Nightly. Use dedicated SDK scripts sharing existing registry lookup helpers
where their semantics fit.

1. Prepare validates the shared version, compatibility record, contract change
   inventory, registry status, and registry ownership/bootstrap prerequisites.
   It stamps pending host values into the existing release PR and stages both
   SDK records and package version/lock changes alongside current release files.
2. After the PR merge, prepare signs the root host tag and, when publishing a
   new SDK, `pluginsdk/v<S>` at that same exact merge commit. Reuse the validated
   signing identity. Existence checks compare the remote peeled tag target;
   never move a tag. An unchanged SDK uses its original verified tag.
3. After `publish-release`, a dedicated `publish-plugin-sdk` job verifies Go
   module retrieval and publishes the exact packed npm artifact with public
   access, OIDC, and provenance. Use a GitHub-hosted runner, `id-token: write`,
   the exact configured workflow/environment identity, and a supported npm CLI.
4. The job runs clean public-registry consumer checks, emits the host/SDK/API
   mapping, and reports the artifact identities. Stable completion and
   contributor notices require its success as well as the existing publication
   channels. Reuse an unchanged SDK through verification, so downstream jobs
   do not mistake an intentional publish skip for a missing completion gate.

Dry-run runs metadata/version and mocked/public-read preflight checks only.
Desktop validation and Nightly skip all Stable SDK mutation paths. Use explicit
status functions and result conditions for downstream jobs. The existing
release-wide non-cancelling concurrency group also serializes SDK publication.

The first npm publication needs confirmed ownership of `@kandev` and package
setup. If an existing package is required to configure its publisher, maintainers
bootstrap the exact final signed-release tarball using their authenticated npm
account, then configure OIDC. Never consume `0.1.0` with a placeholder artifact.
Document that bootstrap separately, including its provenance limitation. Normal
CI must not fall back to an added long-lived npm token. Trusted publisher setup
must allow direct publication and any dist-tag repair used by the workflow.
Verify the current setup instructions during implementation against
[official npm documentation](https://docs.npmjs.com/trusted-publishers/).

## Failure and recovery

There is no atomic transaction across Git tags, the Go proxy, and npm. A failed
SDK job leaves the Stable release partial. Keep the signed revision and rerun
the failed job or the existing latest-tag `backfill_tag` flow.

An existing Go tag must match its original signed source. An existing npm
version must match the expected packed artifact integrity and compatibility
record; HTTP/auth errors are not evidence of absence. On a publication timeout,
re-query before attempting another upload. Reject identity mismatches. Never
delete tags, unpublish SDKs, or reuse a version for changed bytes.

Use bounded retries for proxy/registry visibility. Regenerate the tarball using
the same locked tools and signed source, then compare registry integrity before
reuse. If a version exists but `latest` is missing, repair only after identity
verification and only if it does not downgrade a newer valid tag. A backfill
must not promote an older SDK over a newer one.

## Clean consumers

PR tests construct a Go module archive/local test proxy and npm tarball, then
install into temporary directories outside the checkout with fresh caches and
no replacements/workspaces. This proves package contents before public tags
exist. Label that result as local packaging evidence, not public availability.

The Stable job repeats the flow using only the public Go proxy and npm registry.
The consumer imports `pluginsdk`, embeds `UnimplementedPlugin`, builds a binary,
runs vet/tests, typechecks representative frontend Host types, and executes the
compatibility command. Tests include a too-low minimum and unsupported API to
prove meaningful failures. No browser test is needed: the author installation
workflow is the changed end-to-end boundary.

## Author guidance

Update `docs/public/plugins-authoring.md` with a short installation/migration
section and link detailed policy rather than duplicating the entire contract.
Update the release how-to for setup, partial recovery, and SDK completion gates.
Show exact pinning and replace the old Go import in live examples. Preserve
historical completed plan results as snapshots; update unresolved work-order
paths and live authority references that would otherwise point to removed code.

The canonical external template requires a subsequent repository change to
remove its sibling dependencies and SDK-ref checkout logic. Record exact target
files and validation commands as a handoff; changes to external plugin
repositories are excluded from this monorepo package. Host fixtures supply the
clean-consumer acceptance evidence independently of that follow-up.

## Related contracts and implementation plan

- [Plugin boundary](plugins-01.md).
- [Managed coordination compatibility](managed-coordination.md#independent-consumers-and-compatibility).
- [SDK publishing plan](../../../plans/plugin-sdk-publishing/plan.md).
