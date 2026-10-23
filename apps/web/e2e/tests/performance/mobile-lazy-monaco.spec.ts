import { test } from "../../fixtures/test-base";
import { verifyLazyMonaco } from "../../helpers/lazy-monaco";

test("opens the native phone viewer without loading Monaco", async ({
  testPage,
  apiClient,
  seedData,
  backend,
}, info) => {
  test.setTimeout(90_000);
  await verifyLazyMonaco(testPage, apiClient, seedData, backend, { info, mobile: true });
});
