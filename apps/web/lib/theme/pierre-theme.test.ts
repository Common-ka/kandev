import { expect, it } from "vitest";
import { resolveTheme } from "@pierre/diffs";
import { registerPierreTheme, updatePierreTheme } from "./pierre-theme";
it("registers imported data with the actual Pierre theme resolver", async () => {
  const name = registerPierreTheme({
    reference: "theme:test/night",
    base: "dark",
    digest: "aabbcc",
    status: "ready",
    definition: {
      schema_version: 1,
      base: "dark",
      editor: { background: "#272822" },
      syntax: { keyword: { foreground: "#f92672" } },
    },
  });
  expect(name).toBe("kandev-aabbcc");
  const resolved = await resolveTheme(name!);
  expect(resolved.colors?.["editor.background"]).toBe("#272822");
});

it("serializes worker updates so a slower old switch cannot win", async () => {
  let finish!: () => void;
  const calls: string[] = [];
  const pool = {
    setRenderOptions: async (options: { theme?: unknown }) => {
      calls.push(String(options.theme));
      if (calls.length === 1)
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
    },
  };
  const theme = (digest: string) => ({
    reference: "theme:test/night" as const,
    base: "dark" as const,
    digest,
    status: "ready" as const,
    definition: { schema_version: 1 as const, base: "dark" as const },
  });
  const first = updatePierreTheme(pool, theme("111111"));
  await Promise.resolve();
  await Promise.resolve();
  const second = updatePierreTheme(pool, theme("222222"));
  finish();
  await Promise.all([first, second]);
  expect(calls).toEqual(["kandev-111111", "kandev-222222"]);
});
