import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { goEnvironment, startProxy, sdkModule } from "./go-consumer.mjs";

// @covers AC-PLUGINS-SDK-DISTRIBUTION-001.3
for (const mode of ["local", "public"]) {
  test(`${mode} consumers use fresh caches and explicit Go trust`, () => {
    const inherited = {
      PATH: "/bin",
      GOWORK: "/secret/go.work",
      GOFLAGS: "-modfile=hidden",
      GOPRIVATE: "*",
      GONOPROXY: "*",
      GONOSUMDB: "*",
      GOSUMDB: "off",
      GOINSECURE: "*",
      GOPROXY: "file:///private",
      GOENV: "/secret/env",
    };
    if (mode === "public")
      assert.throws(
        () => goEnvironment(mode, "/tmp/fresh", "", inherited),
        /trust/,
      );
    else {
      const env = goEnvironment(
        mode,
        "/tmp/fresh",
        "http://127.0.0.1:1234",
        inherited,
      );
      assert.equal(env.GOWORK, "off");
      assert.equal(env.GOENV, "off");
      assert.equal(env.GOFLAGS, "-modcacherw");
      assert.equal(env.GONOSUMDB, sdkModule);
      assert.equal(env.GOPRIVATE, "");
      assert.equal(env.GONOPROXY, "");
      assert.equal(env.GOINSECURE, "");
      assert.equal(env.GOSUMDB, "sum.golang.org");
      assert.equal(env.GOPROXY, "http://127.0.0.1:1234");
      assert.equal(env.GOMODCACHE, "/tmp/fresh/mod");
    }
  });
}

test("SDK proxy serves the exact archive and never forwards missing SDK bytes", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "sdk-proxy-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const prefix = join(root, sdkModule, "@v");
  await mkdir(prefix, { recursive: true });
  await writeFile(join(prefix, "v0.1.0.zip"), "exact archive");
  const proxy = await startProxy(root);
  t.after(() => proxy.close());
  const url = `${proxy.url}/${sdkModule}/@v/v0.1.0.zip`;
  assert.equal(await (await fetch(url)).text(), "exact archive");
  await rm(join(prefix, "v0.1.0.zip"));
  assert.equal((await fetch(url)).status, 404);
  assert.equal(
    (await fetch(`${proxy.url}/${sdkModule}/@v/v99.0.0.info`)).status,
    404,
  );
});

test("Go installs the standalone module archive, then rejects a missing archive in a fresh cache", async (t) => {
  const { archiveModule } = await import("./consumer-smoke.mjs");
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  const root = await mkdtemp(join(tmpdir(), "sdk-archive-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, "source");
  await mkdir(source);
  await writeFile(join(source, "go.mod"), `module ${sdkModule}\n\ngo 1.26.0\n`);
  await writeFile(
    join(source, "sdk.go"),
    "package pluginsdk\nconst Value = 42\n",
  );
  const proxyRoot = join(root, "proxy");
  await archiveModule(source, proxyRoot, "v0.1.0");
  const proxy = await startProxy(proxyRoot);
  t.after(() => proxy.close());
  const args = ["mod", "download", "-json", `${sdkModule}@v0.1.0`];
  const result = await run("go", args, {
    cwd: root,
    env: goEnvironment("local", join(root, "first"), proxy.url),
  });
  assert.equal(JSON.parse(result.stdout).Version, "v0.1.0");
  await rm(join(proxyRoot, sdkModule, "@v/v0.1.0.zip"));
  await assert.rejects(
    run("go", args, {
      cwd: root,
      env: goEnvironment("local", join(root, "second"), proxy.url),
    }),
    (error) => /404/.test(error.stdout),
  );
});

test("module archives reject local replacements", async (t) => {
  const { archiveModule } = await import("./consumer-smoke.mjs");
  const root = await mkdtemp(join(tmpdir(), "sdk-invalid-module-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    join(root, "go.mod"),
    `module ${sdkModule}\n\ngo 1.26.0\n  replace example.com/private => ../private\n`,
  );
  await assert.rejects(
    archiveModule(root, join(root, "proxy"), "v0.1.0"),
    /without replacements/,
  );
});
