// Bundles the CLI (node) and the core browser build (IIFE, injected into headless Chrome).
import { build } from 'esbuild';
import { chmod, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = path.resolve(here, '../core/src/index.ts');
const { version } = JSON.parse(await readFile(path.join(here, 'package.json'), 'utf8'));
await mkdir(path.join(here, 'dist'), { recursive: true });

await build({
  entryPoints: [core],
  bundle: true,
  format: 'iife',
  globalName: 'prettymaids',
  outfile: path.join(here, 'dist/browser.js'),
  minify: true,
});

await build({
  entryPoints: [path.join(here, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: path.join(here, 'dist/index.js'),
  external: ['puppeteer', 'mermaid'],
  banner: { js: '#!/usr/bin/env node' },
  define: { __VERSION__: JSON.stringify(version) },
  alias: { prettymaids: core },
});
await chmod(path.join(here, 'dist/index.js'), 0o755);
console.log('built packages/cli/dist');
