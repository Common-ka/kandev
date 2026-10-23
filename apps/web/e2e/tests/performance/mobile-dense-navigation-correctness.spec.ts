import { test } from "../../fixtures/test-base";
import { verifyDenseNavigation } from "../../helpers/dense-navigation-correctness";

test("preserves file actions, context, and drafts through A-B-A navigation", async ({
  testPage,
  apiClient,
  seedData,
  backend,
}, info) => {
  test.setTimeout(120_000);
  await verifyDenseNavigation({
    page: testPage,
    api: apiClient,
    seed: seedData,
    backend,
    mobile: true,
    info,
  });
});
