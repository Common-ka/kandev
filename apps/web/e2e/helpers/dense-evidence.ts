import fs from "node:fs";
import { createHash } from "node:crypto";
import type { Page } from "@playwright/test";

export function copyDenseBackendLog(source: string, destination: string) {
  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  return {
    path: destination,
    sha256: createHash("sha256").update(fs.readFileSync(destination)).digest("hex"),
    capturedAt: Date.now(),
  };
}

export async function captureDenseFailureImage(page: Page, filename?: string) {
  if (!filename) return undefined;
  try {
    const bytes = await page.screenshot({ path: filename, fullPage: false, timeout: 2000 });
    return {
      path: filename,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      capturedAt: Date.now(),
    };
  } catch (error) {
    return { error: String(error) };
  }
}
