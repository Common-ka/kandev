#!/usr/bin/env bash
set -euo pipefail
image= compare= input= self_test=false
while (( $# )); do
  case "$1" in
    --image) image="$2"; shift 2 ;;
    --compare-image) compare="$2"; shift 2 ;;
    --input-dir) input="$(realpath "$2")"; shift 2 ;;
    --self-test) self_test=true; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$image" && ( "$self_test" == true || -n "$input" ) ]] || { echo 'usage: --image REF --self-test [--compare-image REF] [--input-dir DIR]' >&2; exit 2; }
root="$(git rev-parse --show-toplevel)"
cd "$root"
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT
# Include candidate files, never host dependencies, credentials, or build outputs.
git ls-files --cached -z > "$scratch/files"
tar --null --files-from="$scratch/files" -cf "$scratch/source.tar"
mkdir "$scratch/candidate" "$scratch/baseline"
run_image() {
  local ref="$1" output="$2" fixtures="$3" slim="$4"
  local mounts=()
  if [[ -n "$fixtures" ]]; then mounts=(-v "$fixtures:/input:ro"); fi
  docker run --rm --network "${REPORT_DOCKER_NETWORK:-bridge}" \
    -e REPORT_OWNER="$(id -u):$(id -g)" -e CI=true -e PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    -e REPORT_SELF_TEST="$self_test" -e REPORT_EXPECT_SLIM="$slim" \
    -v "$scratch/source.tar:/source.tar:ro" -v "$output:/result" \
    "${mounts[@]}" "$ref" bash -euo pipefail -c '
      trap "chown -R \"\$REPORT_OWNER\" /result" EXIT
      mkdir -p /tmp/report-home /tmp/report
      cd /tmp/report
      tar -xf /source.tar
      if [[ "$REPORT_EXPECT_SLIM" == true ]]; then
        for tool in go rustc docker chromium firefox; do
          if command -v "$tool"; then echo "Unexpected report-image tool: $tool" >&2; exit 1; fi
        done
        [[ ! -d /ms-playwright ]]
      fi
      node --version
      pnpm --version
      command -v unzip
      cd apps
      pnpm install --frozen-lockfile
      cd ..
      node .github/scripts/fixtures/e2e-report/exercise.mjs
    '
}
run_image "$image" "$scratch/candidate" "$input" true
if [[ -n "$compare" ]]; then
  # Reuse the exact serialized blobs, including their recorded durations.
  run_image "$compare" "$scratch/baseline" "$scratch/candidate/input" false
  cmp "$scratch/candidate/semantic.json" "$scratch/baseline/semantic.json"
  echo 'Report semantic output and attachment hashes match the baseline image.'
fi
echo 'Report image replay passed.'
