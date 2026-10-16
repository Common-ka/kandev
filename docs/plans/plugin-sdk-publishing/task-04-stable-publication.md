---
id: "04-stable-publication"
title: "Publish SDKs through Stable releases"
status: pending
wave: 4
depends_on:
  - 03-compatibility-check
plan: "plan.md"
requirements:
  - REQ-PLUGINS-SDK-DISTRIBUTION-001
  - REQ-PLUGINS-SDK-DISTRIBUTION-002
  - REQ-PLUGINS-SDK-DISTRIBUTION-003
acceptance_criteria:
  - AC-PLUGINS-SDK-DISTRIBUTION-001.1
  - AC-PLUGINS-SDK-DISTRIBUTION-001.2
  - AC-PLUGINS-SDK-DISTRIBUTION-002.1
  - AC-PLUGINS-SDK-DISTRIBUTION-002.3
  - AC-PLUGINS-SDK-DISTRIBUTION-003.1
  - AC-PLUGINS-SDK-DISTRIBUTION-003.2
  - AC-PLUGINS-SDK-DISTRIBUTION-003.3
  - AC-PLUGINS-SDK-DISTRIBUTION-003.4
system_design:
  - ../../specs/plugins/system-design/sdk-distribution.md
---

# Task 04: Publish SDKs through Stable releases

## Summary

Integrate the shared SDK version into Stable preparation, signed tagging, npm
trusted publishing, and completion gates. Local tests prove mutation/recovery
rules; an authorized later release supplies public installation evidence.

## In scope

- Add `scripts/release/plugin-sdk.mjs` for metadata/version/contract preflight,
  the contract-input inventory, and release-PR stamping. Add tests first.
- Add `scripts/release/publish-plugin-sdk.sh` and mocked publication tests.
  Reuse registry helpers without expanding the Nightly/runtime package inventory.
- Extend `release.yml` outputs/staging/tag signing, backfill validation,
  `publish-plugin-sdk`, completion reporting, and contributor-notice dependencies.
- Verify immutable tag commit, npm integrity/record, uncertain response recovery,
  retry bounds, registry visibility, OIDC/provenance, and no `latest` downgrade.
- Implement public mode of `consumer-smoke.mjs` and include it in the SDK job.
  Reject null metadata at publication; verify reused SDK versions too.

## Workflow-mode matrix

| Mode | SDK behavior | Required result |
| --- | --- | --- |
| Stable, changed contract | Stamp release PR, sign SDK tag, publish/verify exact npm package | Both public consumers pass before completion/notices |
| Stable, unchanged contract | Verify previous SDK identity/mapping; no new upload/tag | Successful verification result for completion dependencies |
| Dry-run | Read/validate metadata and registry preflight only | Zero tag/npm mutations |
| Desktop validation or Nightly | Skip Stable SDK mutations | Existing channel behavior remains valid |
| Latest Stable backfill | Reuse signed record/tag; resume missing artifacts, verify existing ones | Identity conflict fails; no mutable-channel downgrade |

## Out of scope

Actual registry account configuration, first publish, release dispatch, or
external repository changes during implementation. Do not modify the unrelated
Stable runtime package version policy.

## Acceptance

1. Changed/reused SDK paths and every workflow mode meet the matrix; SDK failure
   prevents Stable completion and contributor notices, without blocking sibling
   channel publication unnecessarily.
2. Existing-version retry verifies immutable identities and resumes missing work;
   tag/integrity conflicts, auth/read errors, and unresolved records fail closed.
3. A release job installs both public packages, runs the compatibility check,
   and reports source/mapping evidence; npm bootstrap and OIDC setup have explicit
   maintainer prerequisites and no silent token fallback.

## Verification

```bash
node --test scripts/release/plugin-sdk.test.mjs scripts/release/publish-plugin-sdk.test.mjs
node --test scripts/release/nightly-version.test.mjs scripts/release/nightly-release.test.mjs scripts/release/publish-npm.test.mjs
python3 .github/scripts/release-workflow-contract_test.py
python3 .github/scripts/lint-action-pinning_test.py
bash -n scripts/release/publish-plugin-sdk.sh scripts/release/publish-npm.sh
zizmor .github/workflows
node scripts/pluginsdk/consumer-smoke.mjs --mode local
git diff --check
```

Future public release verification, run by the authorized Stable SDK job after
tagging/publication (not by this work order's local test block):

```bash
node scripts/pluginsdk/consumer-smoke.mjs --mode public --sdk-version "$SDK_VERSION" --host-version "$HOST_VERSION"
```

The job obtains both variables from validated metadata, not human-supplied
unverified package claims. Record public success separately from mocked/local
tests. An unavailable workflow tool is a reported verification gap, not a pass.

## Files likely touched

- `.github/workflows/release.yml`, `.github/scripts/release-workflow-contract_test.py`.
- `scripts/release/{plugin-sdk.mjs,plugin-sdk.test.mjs,publish-plugin-sdk.sh,publish-plugin-sdk.test.mjs}` (new).
- Applicable existing registry lookup/release helper tests.
- `scripts/pluginsdk/consumer-smoke{,.test}.mjs`.
- SDK record/package/version/lock files as release-prepare staging inputs.

## Dependencies

[Task 03](task-03-compatibility-check.md): consumer validation and metadata rules.

## Risks

Signed tags become publicly visible before the npm artifact; the release is
partial until verified. npm package ownership, bootstrap, trusted-publisher
identity, direct-publish permission, and dist-tag permission must be confirmed
by maintainers before the first authorized release. Backfill uses the existing
latest-tag restriction and must not restamp metadata.

## Parallelism

`sequential`

## Inputs

- [Design: Stable integration and recovery](../../specs/plugins/system-design/sdk-distribution.md#stable-release-integration).
- `.github/AGENTS.md`, release skill, current prepare/publish/backfill/notices
  jobs, registry helper semantics, and official npm/Go documentation.

## Results

Pending. Public registry verification awaits a later authorized release.
