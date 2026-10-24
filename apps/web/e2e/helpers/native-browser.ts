import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { chromium, type BrowserContext } from "@playwright/test";

async function nativeBrowserEndpoint(child: ChildProcess): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const signal = AbortSignal.timeout(10_000);
  let stderr = "";
  const abort = () => reject(new Error("Native Chromium did not expose its CDP endpoint"));
  const read = (chunk: Buffer) => {
    stderr = (stderr + chunk.toString()).slice(-16_384);
    const endpoint = stderr.match(/DevTools listening on (ws:\/\/\S+)/)?.[1];
    if (endpoint) resolve(endpoint);
  };
  const exit = (code: number | null) => reject(new Error(`Native Chromium exited: ${code}`));
  child.stderr!.on("data", read);
  child.once("exit", exit);
  child.once("error", reject);
  signal.addEventListener("abort", abort, { once: true });
  try {
    return await promise;
  } finally {
    child.stderr!.off("data", read);
    child.off("exit", exit);
    child.off("error", reject);
    signal.removeEventListener("abort", abort);
  }
}

export async function withNativeBrowser(
  use: (context: BrowserContext, version: string) => Promise<void>,
) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "kandev-native-browser-"));
  const child = spawn(
    chromium.executablePath(),
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--window-size=1470,956",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  const exited = new Promise<void>((resolve) => child.once("close", () => resolve()));
  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;
  try {
    const endpoint = await nativeBrowserEndpoint(child);
    browser = await chromium.connectOverCDP(endpoint, { noDefaults: true });
    await use(browser.contexts()[0], browser.version());
  } finally {
    try {
      if (child.exitCode === null && child.signalCode === null) {
        const closed = once(child, "close", { signal: AbortSignal.timeout(5_000) });
        child.kill("SIGTERM");
        await closed.catch(() => child.kill("SIGKILL"));
      }
      await exited;
      await browser?.close();
    } finally {
      fs.rmSync(profile, { recursive: true, force: true });
    }
  }
}
