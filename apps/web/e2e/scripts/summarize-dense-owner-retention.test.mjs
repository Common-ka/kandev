import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeReport } from "./summarize-dense-performance.mjs";

test("excludes owner-retention observations from paired speed summaries", () => {
  assert.throws(
    () => summarizeReport({ measurementKind: "owner-retention", samples: [] }),
    /excluded from timing comparisons/,
  );
});
