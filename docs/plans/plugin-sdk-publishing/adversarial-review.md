# SDK compatibility adversarial review

Reviewed on 2026-10-24 in a user-requested secondary session. The starting PR
head was `59c9c5603017fd2922168c8d4915a656c79b8627`. These findings concern the
implementation; the earlier [design review](design-review.md) remains a
separate historical record.

## Findings and corrections

1. **P1: the release adapter could not build a publishable candidate.**
   `inspectArchive` computed the packed record digest, but `packCandidate`
   omitted it from its return value. `ReleaseIO.build` therefore rejected every
   fresh build and missing-archive rebuild as a signed-source mismatch. The
   packer now returns that inspected digest. A regression exercises real Git
   archive extraction, packing, the release adapter, and isolated Go/npm
   consumers. It also rejects a conflicting source digest. No production test
   seam or alternate publication path was added.
2. **P2: the checker accepted host minima that the runtime rejects.**
   Above-floor prereleases such as `0.101.0-rc.1` and build metadata such as
   `0.100.0+build.1` passed the author check. The runtime requires a Stable
   minimum. The checker now reuses its Stable-version validator; tests retain
   the accepted lowercase `v` prefix and reject both suffix forms. Runtime
   manifest validation and installed-plugin behavior are unchanged.
3. **P2: the checker rejected valid hoisted npm workspace installs.**
   It required the SDK directly below the plugin directory before consulting
   the workspace lockfile. It now selects the closest installed npm SDK up to
   the nearest supported lockfile root and verifies that exact lock entry and
   consumer importer. An explicit path cannot bypass a closer package. A real
   npm workspace install and CLI check cover default and explicit hoisted
   paths, shadow packages, local symlinks, wrong lock versions, and a nearer
   lockfile boundary. pnpm store handling and the strict lockfile policy remain
   unchanged.

Each bug was reproduced by a failing regression before its production fix.
The npm workspace regression runs in the required SDK packaging CI job, with
the pinned Node/npm tools. The release-adapter regression runs in its existing
release test suite.

## Compatibility assessment

The review inspected Go extraction, protobuf and gRPC identities, host import
migration, the legacy subprocess test, frontend exports, dependency evidence,
release trust/retention/recovery, workflow permissions, and build selection.
It found no additional verified installed-binary or frontend-bundle regression.

Existing compiled plugins retain the same handshake and wire contract. Source
builds against a new checkout still need the documented Go import migration.
The legacy fixture proves its tested handshake and Host state roundtrip, not
every RPC or every community plugin. The author inventory is not a certification.

No SDK was published, no release was dispatched, and no external plugin or
template repository was modified. Registry ownership and trusted-publisher
setup remain release prerequisites. The shared SDK version and SDK-wide host
floor remain the accepted design.

## Verification

The focused red/green tests passed. SDK race tests and vet passed, as did
the SDK CI contracts, public documentation validators, documentation catalog,
and full specification lint. The final validation and follow-up review results
are recorded in the [plan](plan.md#adversarial-review-cleanup).
CI at the starting head is historical evidence; the remediation commit needs
its own current-head checks before delivery is reported complete.

The same secondary reviewer rechecked the fixes and reported no new findings
or blockers. They independently passed the focused Go compatibility/CLI tests,
the real npm workspace regression, and whitespace checks. They inspected the
release-adapter test; the primary session ran its full consumer verification.

## Browser validation follow-up

SDK, backend, and frontend checks passed at `5e6310d4`. E2E run `40129872943`
still failed after one failed-job rerun. Its retained reports contained 4237
first-attempt passes, two retry-pass failures, and 40 skipped tests. These
results did not satisfy the required E2E check.

The browser investigation found three test defects:

1. The multi-file read fixture committed files on the shared checkout's current
   branch. A preceding PR-watcher test left that checkout on `feature/always`,
   while the new task used `main`. Starting the focused test on that branch
   reproduced the same missing-file assertion. The fixture now selects `main`
   and publishes the seed commit through the existing helper. The same branch
   stimulus then passed with retries disabled.
2. The workflow session test accepted a completed synthetic startup turn as
   evidence that its new agent prompt finished. The retained trace and backend
   log showed startup readiness followed by the actual prompt entering
   `RUNNING`. The completion check now excludes `lifecycle_only` turns and
   retains its session identity, state, and real-turn completion assertions.
3. The ordered local replay exposed a PR-watcher test that submitted a user
   message as soon as the task card reached Done. That workflow move precedes
   the session's ready state. The test now uses the shared session-state wait
   before submitting the message once.

The secondary reviewer confirmed both readiness findings from source and
retained evidence. These corrections change test setup and synchronization;
they do not change plugin or runtime behavior. Current-head CI must pass before
validation is complete.
