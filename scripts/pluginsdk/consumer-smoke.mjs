import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { sdkModule, goEnvironment, startProxy } from './go-consumer.mjs';

const run = promisify(execFile);
const repository = fileURLToPath(new URL('../../', import.meta.url));

export async function archiveModule(source, proxyRoot, version) {
  if (!/^v\d+\.\d+\.\d+$/.test(version)) throw new Error('expected an exact SDK version');
  const output = join(proxyRoot, sdkModule, '@v');
  await mkdir(output, { recursive: true });
  const goMod = await readFile(join(source, 'go.mod'), 'utf8');
  if (!goMod.startsWith(`module ${sdkModule}\n`) || /^\s*replace(?:\s|\()/m.test(goMod)) {
    throw new Error('SDK must declare its public module without replacements');
  }
  await writeFile(join(output, `${version}.mod`), goMod);
  await writeFile(join(output, `${version}.info`), JSON.stringify({ Version: version, Time: '2026-01-01T00:00:00Z' }));
  await writeFile(join(output, 'list'), version + '\n');
  await run('python3', ['-c', `
import pathlib, sys, zipfile
source, output, prefix = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3]
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
 for path in sorted(source.rglob('*')):
  rel = path.relative_to(source)
  if any(part.startswith('.') or part == 'node_modules' for part in rel.parts): continue
  if path.is_symlink(): raise ValueError('module archive contains a symlink: ' + str(rel))
  if path.is_file(): archive.write(path, prefix + '/' + rel.as_posix())
`, source, join(output, `${version}.zip`), `${sdkModule}@${version}`]);
}

export async function smokeGo({ mode = 'local', version = 'v0.1.0', skipCompatibilityCheck = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'kandev-sdk-consumer-'));
  let proxy;
  try {
    if (mode === 'local') {
      await archiveModule(join(repository, 'pluginsdk'), join(root, 'proxy'), version);
      proxy = await startProxy(join(root, 'proxy'));
    }
    const env = goEnvironment(mode, root, proxy?.url);
    const cwd = join(root, 'consumer');
    await mkdir(cwd);
    await writeFile(join(cwd, 'go.mod'), `module example.com/sdk-consumer\n\ngo 1.26.0\n\nrequire ${sdkModule} ${version}\n`);
    await writeFile(join(cwd, 'main.go'), `package main\nimport "${sdkModule}"\nfunc main() { pluginsdk.Serve(&pluginsdk.UnimplementedPlugin{}) }\n`);
    await writeFile(join(cwd, 'main_test.go'), `package main\nimport ("testing"; "${sdkModule}")\nfunc TestPluginContract(t *testing.T) { var plugin pluginsdk.Plugin = &pluginsdk.UnimplementedPlugin{}; if plugin == nil { t.Fatal("missing plugin") } }\n`);
    const go = (args) => run('go', args, { cwd, env, maxBuffer: 8 * 1024 * 1024, timeout: 300_000 });
    await go(['mod', 'tidy']);
    const { stdout: graph } = await go(['list', '-m', 'all']);
    if (graph.split('\n').some((line) => line.startsWith('github.com/kandev/kandev '))) {
      throw new Error('consumer graph includes backend module');
    }
    const { stdout: selected } = await go(['list', '-m', '-json', sdkModule]);
    const module = JSON.parse(selected);
    if (module.Replace || module.Version !== version) throw new Error('consumer selected an unexpected SDK');
    for (const args of [['build', '-trimpath', './...'], ['vet', './...'], ['test', '-trimpath', './...']]) await go(args);
    if (!skipCompatibilityCheck) {
      throw new Error('compatibility check is not available until work order 03; pass --skip-compatibility-check explicitly');
    }
    console.log(JSON.stringify({ mode, version, module: sdkModule, cache: root, graph, status: 'passed' }));
  } finally {
    await proxy?.close();
    await rm(root, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { mode: { type: 'string', default: 'local' },
    version: { type: 'string', default: 'v0.1.0' }, 'backend-only': { type: 'boolean' },
    'skip-compatibility-check': { type: 'boolean' } } });
  if (!values['backend-only']) throw new Error('frontend consumer is not available until work order 02; pass --backend-only');
  await smokeGo({ mode: values.mode, version: values.version, skipCompatibilityCheck: values['skip-compatibility-check'] });
}
