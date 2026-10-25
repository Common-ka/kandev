import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { copyDenseBackendLog, captureDenseFailureImage } from "../helpers/dense-evidence.ts";

function files(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kandev-dense-evidence-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return {
    source: path.join(directory, "backend.log"),
    first: path.join(directory, "first.log"),
    second: path.join(directory, "second.log"),
  };
}

test("preserves exact backend bytes and a digest before the source is replaced", (t) => {
  const f = files(t);
  const original = Buffer.from([0, 255, 65, 10]);
  fs.writeFileSync(f.source, original);
  const result = copyDenseBackendLog(f.source, f.first);
  assert.equal(result?.path, f.first);
  assert.equal(result.sha256, createHash("sha256").update(original).digest("hex"));
  fs.writeFileSync(f.source, "next sample");
  assert.deepEqual(fs.readFileSync(f.first), original);
});

test("retains a separate backend log for each sample", (t) => {
  const f = files(t);
  fs.writeFileSync(f.source, "first");
  copyDenseBackendLog(f.source, f.first);
  fs.writeFileSync(f.source, "second");
  copyDenseBackendLog(f.source, f.second);
  assert.equal(fs.readFileSync(f.first, "utf8"), "first");
  assert.equal(fs.readFileSync(f.second, "utf8"), "second");
});

test("refuses missing sources and overwriting retained evidence", (t) => {
  const f = files(t);
  assert.throws(() => copyDenseBackendLog(f.source, f.first), /ENOENT/);
  fs.writeFileSync(f.source, "new");
  fs.writeFileSync(f.first, "retained");
  assert.throws(() => copyDenseBackendLog(f.source, f.first), /EEXIST/);
  assert.equal(fs.readFileSync(f.first, "utf8"), "retained");
});

test("bounds image capture and retains its error without throwing", async () => {
  let options;
  const page = {
    screenshot: async (value) => {
      options = value;
      throw new Error("capture unavailable");
    },
  };
  assert.deepEqual(await captureDenseFailureImage(page, "failure.png"), {
    error: "Error: capture unavailable",
  });
  assert.equal(options.timeout, 2000);
  let called = false;
  assert.equal(
    await captureDenseFailureImage({
      screenshot: async () => {
        called = true;
      },
    }),
    undefined,
  );
  assert.equal(called, false);
});
