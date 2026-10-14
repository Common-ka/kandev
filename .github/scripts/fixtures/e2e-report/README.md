# Report image replay

From the repository root:

```sh
bash .github/scripts/test-e2e-report-image.sh --image IMAGE --self-test \
  --compare-image BASELINE_DIGEST
```

The harness generates real Playwright blobs with the frozen workspace version,
without browsers. Two projects use different absolute test directories and each
includes a success, a recovered retry, a terminal failure, a skip, and text
attachments. The baseline replays the exact same bytes. Comparison includes
full JSON reports, timing profiles, retry summaries, flake history, and attachment
hashes; only report-generation timestamps are removed. HTML must exist.

Both images receive independent disposable copies and fresh dependency installs.
Host dependencies, credentials and the Docker socket are never mounted. The
container runs as root, matching Actions job containers and the existing image's
Corepack cache. Output ownership is returned to the invoking user on exit.
`REPORT_DOCKER_NETWORK` can select an existing local Docker network when the
host's default bridge is unavailable; CI uses the default bridge.

To replay downloaded Actions artifacts, add `--input-dir DIRECTORY` with:

- `blobs/`: blob ZIPs and shard metadata from the blob-report artifacts.
- `manifests/`: optional manifest/plan summaries from `e2e-shard-manifests`.
- `timing-profile.json`: optional selected main timing baseline.
- `flake-history.json`: optional prior main flake history.

The actual final-gate shell is extracted from `e2e-tests.yml` and exercised with
successful, failed, cancelled, unknown and deliberately skipped dependencies,
and missing mandatory evidence. Corrupt ZIPs must fail Playwright merging.
A successful report replay includes failed test results: the required gate must
still reject their failed shard dependencies. The harness does not redefine
what constitutes a passing application test run.
