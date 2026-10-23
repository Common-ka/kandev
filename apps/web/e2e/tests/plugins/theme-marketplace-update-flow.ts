import { createServer } from "node:http";
import { cpSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import type { ApiClient } from "../../helpers/api-client";
import { waitForHttp } from "../../helpers/causal-waits";

function themeArchives(dir: string) {
  const root = path.resolve(__dirname, "../../../../..");
  const sample = path.join(dir, "sample");
  cpSync(path.join(root, "apps/backend/internal/plugins/themes/testdata/sample"), sample, {
    recursive: true,
  });
  const manifestPath = path.join(sample, "manifest.yaml");
  const manifest = readFileSync(manifestPath, "utf8").replace(
    "id: theme-study",
    "id: theme-update-study",
  );
  return ["1.0.0", "2.0.0"].map((version) => {
    writeFileSync(manifestPath, manifest.replace("version: 1.0.0", `version: ${version}`));
    const archivePath = path.join(dir, `${version}.tar.gz`);
    execFileSync("go", ["run", "./cmd/plugin-pack", "-dir", sample, "-out", archivePath], {
      cwd: path.join(root, "apps/backend"),
    });
    const archive = readFileSync(archivePath);
    return { version, archive, digest: createHash("sha256").update(archive).digest("hex") };
  });
}

export async function updateThemeFromMarketplace(page: Page, api: ApiClient) {
  const dir = mkdtempSync(path.join(tmpdir(), "theme-update-marketplace-"));
  const releases = themeArchives(dir);
  let release = releases[0];
  let url = "";
  const server = createServer((req, res) => {
    if (req.url === "/theme.tar.gz") {
      res.end(release.archive);
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        schema_version: 1,
        plugins: [
          {
            id: "theme-update-study",
            kind: "theme",
            name: "Monokai update study",
            description: "Theme update regression",
            author: "Kandev contributors",
            license: "MIT",
            categories: ["theme"],
            version: release.version,
            package_url: url + "/theme.tar.gz",
            package_sha256: release.digest,
          },
        ],
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  let sourceId = "";
  try {
    const sourceResponse = await api.rawRequest("POST", "/api/plugins/marketplace/sources", {
      name: "Theme update fixture",
      url: url + "/index.json",
    });
    expect(sourceResponse.ok).toBe(true);
    const source = await sourceResponse.json();
    sourceId = source.id ?? source.source?.id;
    const prepared = await api.rawRequest("POST", "/api/plugins/themes/prepare", {
      url: url + "/theme.tar.gz",
      id: "theme-update-study",
      version: release.version,
      digest: release.digest,
    });
    expect(prepared.ok).toBe(true);
    const review = await prepared.json();
    const installed = await api.rawRequest("POST", "/api/plugins/themes/commit", { id: review.id });
    expect(installed.ok).toBe(true);
    release = releases[1];
    expect((await api.rawRequest("POST", "/api/plugins/marketplace/refresh", {})).ok).toBe(true);
    await page.goto("/settings/plugins?tab=installed");
    const update = page.getByTestId("plugin-update-theme-update-study");
    await expect(update).toBeVisible();
    const prepareResponse = waitForHttp(page, "POST", /\/api\/plugins\/themes\/prepare$/);
    const commitResponse = waitForHttp(page, "POST", /\/api\/plugins\/themes\/commit$/);
    await update.click();
    const preparation = await prepareResponse;
    expect(preparation.ok()).toBe(true);
    expect(preparation.request().postDataJSON()).toEqual({
      url: url + "/theme.tar.gz",
      id: "theme-update-study",
      version: "2.0.0",
      digest: release.digest,
    });
    expect((await commitResponse).ok()).toBe(true);
    await expect
      .poll(
        async () =>
          (await (await api.rawRequest("GET", "/api/plugins/theme-update-study")).json()).version,
      )
      .toBe("2.0.0");
    await expect(update).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  } finally {
    await api.rawRequest("DELETE", "/api/plugins/theme-update-study").catch(() => undefined);
    if (sourceId)
      await api
        .rawRequest("DELETE", `/api/plugins/marketplace/sources/${sourceId}`)
        .catch(() => undefined);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  }
}
