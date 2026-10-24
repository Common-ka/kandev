import { expect, type CDPSession, type Page } from "@playwright/test";
import { inspectNavigationOwners, type captureGatewayScopes } from "./capture-gateway-scopes";

type Capture = ReturnType<typeof captureGatewayScopes>;
export type OwnerCheckpoint = (evidence: Record<string, unknown>) => void;

export async function observeNavigationOwners(
  page: Page,
  capture: Capture,
  checkpoint?: OwnerCheckpoint,
) {
  try {
    await expect.poll(() => capture.snapshot().pendingRequests).toBe(0);
  } finally {
    checkpoint?.({
      ownerObservation: {
        gateway: capture.snapshot(),
        owners: await inspectNavigationOwners(page),
      },
    });
  }
  const gateway = capture.snapshot();
  expect(gateway.parseErrors).toBe(0);
  expect(gateway.failedRequests).toBe(0);
  expect(gateway.openConnections).toBe(1);
  return { owners: await inspectNavigationOwners(page), gateway };
}

export async function verifyNavigationOwnerRelease(options: {
  page: Page;
  cdp: CDPSession;
  capture: Capture;
  before: Awaited<ReturnType<typeof observeNavigationOwners>>;
  checkpoint?: OwnerCheckpoint;
  requireApiRelease?: boolean;
}) {
  const { page, cdp, capture, before, checkpoint, requireApiRelease = true } = options;
  const after = await observeNavigationOwners(page, capture, checkpoint);
  checkpoint?.({ ownershipBefore: before, ownershipAfter: after });
  expect(after.owners).toEqual(before.owners);
  expect(after.gateway.totalConnections).toBe(before.gateway.totalConnections);
  const roles = (snapshot: typeof before) =>
    snapshot.gateway.scopes
      .map((scope) =>
        JSON.stringify([
          scope.kind,
          scope.taskId,
          scope.sessionId,
          scope.consumerKind,
          scope.pluginId,
        ]),
      )
      .sort();
  expect(roles(after)).toEqual(roles(before));
  expect(after.gateway.scopes.some((scope) => scope.kind === "session.conversation")).toBe(true);
  await page.getByTestId("sidebar-settings-gear").click();
  await expect(page).toHaveURL(/\/settings(?:\/|$)/);
  await expect(page.getByTestId("dockview-task-layout")).toHaveCount(0);
  try {
    await expect.poll(() => capture.snapshot().scopes.length).toBe(0);
  } finally {
    checkpoint?.({
      releaseObservation: {
        gateway: capture.snapshot(),
        owners: await inspectNavigationOwners(page),
      },
    });
  }
  const released = await observeNavigationOwners(page, capture, checkpoint);
  await cdp.send("HeapProfiler.collectGarbage");
  const result = { before, after, released, releasedHeap: await cdp.send("Runtime.getHeapUsage") };
  checkpoint?.({ ownership: result });
  expect(released.owners.documentTimeOrigin).toBe(before.owners.documentTimeOrigin);
  expect(released.gateway.totalConnections).toBe(before.gateway.totalConnections);
  expect(released.owners).toMatchObject({ chatRoots: [], documentEditors: 0 });
  if (requireApiRelease)
    expect(released.owners).toMatchObject({ dockviewAvailable: false, panels: [] });
  return result;
}
