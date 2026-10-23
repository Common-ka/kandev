import { test } from "../../fixtures/test-base";
import { verifyLazyMonaco } from "../../helpers/lazy-monaco";

test("loads Monaco when the file editor first opens", async ({
  testPage,
  apiClient,
  seedData,
  backend,
}, info) => {
  test.setTimeout(90_000);
  await verifyLazyMonaco(testPage, apiClient, seedData, backend, { info });
});
