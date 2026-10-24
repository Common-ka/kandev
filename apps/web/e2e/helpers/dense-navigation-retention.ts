import type { Page, CDPSession } from "@playwright/test";
import type { captureGatewayScopes } from "./capture-gateway-scopes";
import {
  observeNavigationOwners,
  verifyNavigationOwnerRelease,
  type OwnerCheckpoint,
} from "./navigation-owner-retention";

export function navigationProfileMetadata(file: string, timed?: boolean, owners?: boolean) {
  if (owners) return { profileFile: undefined, profileWindow: "none" };
  return { profileFile: file, profileWindow: timed ? "timed-switches" : "post-timing-selection" };
}

function groupOwners(page: Page) {
  return page.evaluate(() => ({
    editors: document.querySelectorAll(".tiptap").length,
    panels: document.querySelectorAll(".dv-content-container").length,
  }));
}

/** Runs after timing and profiling stop; the legacy panel field counts group containers. */
export async function measureNavigationRetention(options: {
  page: Page;
  cdp: CDPSession;
  pair: number;
  cpuRate: number;
  select: (index: number) => Promise<unknown>;
  capture?: ReturnType<typeof captureGatewayScopes>;
  checkpoint?: OwnerCheckpoint;
  requireApiRelease?: boolean;
}) {
  const { page, cdp, pair, cpuRate, select, capture, checkpoint } = options;
  await cdp.send("HeapProfiler.collectGarbage");
  const heapBefore = await cdp.send("Runtime.getHeapUsage");
  const ownersBefore = await groupOwners(page);
  const ownershipBefore = capture
    ? await observeNavigationOwners(page, capture, checkpoint)
    : undefined;
  checkpoint?.({ ownershipBefore });
  let retention;
  if (pair === 0 && cpuRate === 1 && !process.env.KANDEV_DENSE_NAV_SWITCHES) {
    for (let i = 0; i < 100; i++) await select(i % 2);
    await cdp.send("HeapProfiler.collectGarbage");
    retention = {
      switches: 100,
      heapBefore,
      heapAfter: await cdp.send("Runtime.getHeapUsage"),
      ownersBefore,
      ownersAfter: await groupOwners(page),
    };
  }
  const ownership =
    capture && ownershipBefore
      ? await verifyNavigationOwnerRelease({
          page,
          cdp,
          capture,
          before: ownershipBefore,
          checkpoint,
          requireApiRelease: options.requireApiRelease,
        })
      : undefined;
  return { retention, ownership };
}
