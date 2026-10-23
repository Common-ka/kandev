import type { Page } from "@playwright/test";

// Match the rendered engine and Monaco's browser-platform keyboard profile.
export async function markdownModifier(page: Page): Promise<"Meta" | "Control"> {
  return page.evaluate(() => (/Macintosh|Mac OS X/.test(navigator.userAgent) ? "Meta" : "Control"));
}

export async function markdownDocumentEnd(page: Page): Promise<string> {
  return (await markdownModifier(page)) === "Meta" ? "Meta+ArrowDown" : "Control+End";
}

// CodeMirror treats iOS Safari as Mac, including when emulated on a Linux host.
export async function codeMirrorDocumentEnd(page: Page): Promise<string> {
  return page.evaluate(() => {
    const ios =
      /Apple Computer/.test(navigator.vendor) &&
      (/Mobile\/\w+/.test(navigator.userAgent) || navigator.maxTouchPoints > 2);
    return ios || /Mac/.test(navigator.platform) ? "Meta+ArrowDown" : "Control+End";
  });
}

// Monaco needs real Enter commands; direct protocol insertion can skip its newline reconciliation.
export async function typeMarkdownSource(page: Page, content: string): Promise<void> {
  const lines = content.split("\n");
  await page.keyboard.type(lines[0]);
  for (const line of lines.slice(1)) {
    await page.keyboard.press("Enter");
    if (line) await page.keyboard.type(line);
  }
}
