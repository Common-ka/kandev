import { randomUUID } from "node:crypto";
import { test, expect } from "../../fixtures/test-base";
import { assertNoDocumentHorizontalOverflow } from "../../helpers/layout-assertions";
import { exerciseSSHIdentitySetup } from "../../helpers/ssh-identities";

for (const width of [390, 767, 768, 1280]) {
  test(`managed SSH settings preserve drafts at ${width}px`, async ({ backend, testPage }) => {
    test.setTimeout(120_000);
    const release = await backend.useEnv({ KANDEV_FEATURES_SSH_CONNECTION_MANAGER: "true" });
    try {
      await testPage.setViewportSize({ width, height: 900 });
      const response = await fetch(`${backend.baseUrl}/api/v1/ssh/managed/identities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: randomUUID(),
          kind: "generate",
          label: `Browser key ${width}`,
        }),
      });
      expect(response.ok).toBe(true);
      await testPage.goto("/settings/ssh-connections?tab=connections&new=1");
      await testPage.getByLabel("Name", { exact: true }).fill(`Browser target ${width}`);
      await testPage.getByLabel("Host", { exact: true }).fill("example.invalid");
      await testPage.getByLabel("SSH user", { exact: true }).fill("deploy");
      await testPage
        .getByLabel("Identity", { exact: true })
        .selectOption({ label: `Browser key ${width}` });
      await testPage.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(testPage).toHaveURL(/id=/);
      await expect(
        testPage.getByRole("button", { name: "Inspect host key", exact: true }),
      ).toBeVisible();
      await testPage
        .getByRole("button", { name: "Save draft and create a bastion", exact: true })
        .click();
      await expect(testPage).toHaveURL(/return_connection=/);
      await testPage.getByRole("button", { name: "Return to destination", exact: true }).click();
      await expect(testPage.getByLabel("Host", { exact: true })).toHaveValue("example.invalid");
      await assertNoDocumentHorizontalOverflow(testPage);
    } finally {
      await testPage.close();
      await release();
    }
  });
}

// @covers AC-EXECUTORS-SSH-CONNECTIONS-001.1, 001.2, 004.3
test("managed SSH identity creation, protected import, and cancellation", async ({
  backend,
  testPage,
}) => {
  const release = await backend.useEnv({ KANDEV_FEATURES_SSH_CONNECTION_MANAGER: "true" });
  try {
    await exerciseSSHIdentitySetup(testPage, backend.baseUrl, false);
  } finally {
    await testPage.close();
    await release();
  }
});
