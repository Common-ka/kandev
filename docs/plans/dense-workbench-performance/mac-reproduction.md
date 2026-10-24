# Confirm performance on a MacBook Air

Run these comparisons on the M2 Air before making a device-specific claim.
The recorded Linux CPU, frame-gap, and request measurements do not measure
Mac battery use or field INP.

Use pnpm 9.15.9, as specified in `apps/package.json`. Run one comparison at a
time with the guarded runner and its default one worker. Keep the Mac plugged
in, use one power mode, and close other CPU-heavy work. Record the chip, RAM,
macOS version, browser version, display scale, and power mode with the reports.
The runner creates disposable backend data; it does not use your personal
Kandev instance. Do not pass a personal database or home directory.

## Prepare the two builds

From the candidate repository root, create and build the original baseline:

```bash
PERF_BASELINE="$(pwd)/../kandev-perf-baseline"
git worktree add --detach "$PERF_BASELINE" 595df36ed5c1cf02fd90cb972b623ad6edc53df8
pnpm --dir "$PERF_BASELINE/apps" install --frozen-lockfile
make -C "$PERF_BASELINE/apps/backend" build
(cd "$PERF_BASELINE/apps/web" && VITE_KANDEV_API_PORT= VITE_KANDEV_DEBUG= pnpm run build:e2e)
pnpm --dir apps install --frozen-lockfile
pnpm --dir apps/web exec playwright install chromium
pnpm --dir apps/web e2e:run --host --project chromium \
  e2e/tests/layout/dockview-owner-release.spec.ts
export KANDEV_DENSE_BASELINE_ROOT="$PERF_BASELINE"
```

The last command builds the candidate backend, web assets, and E2E plugin
archive, then checks API release. Do not rebuild either arm between paired
samples. The report records binary, assets, lockfile, fixture, and plugin hashes.
The commands below use these builds. Do not use Linux `unshare` or the Nix
library wrapper on macOS.

## Run the reference scenarios

The full fixture contains 1,000 tasks and 30 eligible tasks with long stored
histories. Stored history and loaded messages are reported separately. Six
alternating pairs can take about one hour per streaming scenario, including
fixture preparation. Keep failed attempts and their logs.

Threads grid, with the fixed native scroll and composer sequence:

```bash
KANDEV_DENSE_COMPARE=1 KANDEV_DENSE_INTERACTIONS=1 \
KANDEV_DENSE_PAIRS=6 KANDEV_DENSE_CPU_RATES=1 \
pnpm --dir apps/web e2e:run --host --no-build --project chromium \
  e2e/tests/performance/dense-workbench-comparison.spec.ts
```

Repeat with `KANDEV_DENSE_LAYOUT=columns` for the full column deck and
first/middle/last traversal. Omit `KANDEV_DENSE_INTERACTIONS` for a separate
quiet series. Do not pool scripted and quiet warm windows.

Dockview core:

```bash
KANDEV_DENSE_DOCKVIEW_COMPARE=1 KANDEV_DENSE_PAIRS=6 KANDEV_DENSE_CPU_RATES=1 \
pnpm --dir apps/web e2e:run --host --no-build --project chromium \
  e2e/tests/performance/dense-dockview-comparison.spec.ts
```

Repeat with `KANDEV_DENSE_DOCKVIEW_PLUGIN=1` for the fixed full-plugin fixture.
Plugin installation and warm layout preparation are outside timing; their
setup duration is not cold-entry time.

Task switching:

```bash
KANDEV_DENSE_NAVIGATION=1 KANDEV_DENSE_NAV_READINESS=1 \
KANDEV_DENSE_NAV_SCENARIO=task-switch \
KANDEV_DENSE_PAIRS=6 KANDEV_DENSE_CPU_RATES=1 \
pnpm --dir apps/web e2e:run --host --no-build --project chromium \
  e2e/tests/performance/dense-navigation-comparison.spec.ts
```

Repeat with `KANDEV_DENSE_NAV_SCENARIO=incompatible-layout` and then
`KANDEV_DENSE_NAV_SCENARIO=session-tabs`. The recorded browser event reaches a
sampled ready frame; it is not field INP or screen presentation time.

For separate 4x stress, set `KANDEV_DENSE_CPU_RATES=4`. For Threads and Dockview,
keep normal throttled cold loading separate from `KANDEV_DENSE_THROTTLE_AFTER_LOAD=1`, which loads at
1x before applying the throttle. For a separate full-history Threads grid attempt,
set `KANDEV_DENSE_HISTORY=all`. Preserve its fixed load deadline and report
incomplete loading as overload rather than increasing the deadline.

## Inspect and retain results

Reports are saved under `.kandev/diagnostics/dense-workbench-performance/`.
Summarize complete paired reports without an error:

```bash
node apps/web/e2e/scripts/summarize-dense-performance.mjs INPUT.json OUTPUT.json
```

Keep the raw report, summary, backend log, all failed attempts, and the exact
candidate commit. Compare medians of paired changes as well as individual
pairs. Retain neutral and regressing results. Fewer requests alone do not prove
faster interaction. CPU attribution profiles are separate from speed samples.

Run document hide/restore as a separate correctness pass. Playwright enables
focus emulation by default, which can keep the document visible after tab changes.
An external Chromium default context connected with `noDefaults: true` emits
real hidden/visible events in both headed and headless capability probes. Do not
replace visibility properties and call that native behavior. For a separate
manual correctness pass in a disposable headed instance, observe actual
`visibilitychange` events, hide the tab while agents produce updates, return,
and check final ordered content, draft text, and scroll position. Record the
browser's actual hidden/visible transitions and any unavailable capability.
Keep this manual run separate from the fixed reference timings.
