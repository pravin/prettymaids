// Builds examples/rendered/gallery.html: stock mermaid vs each theme, per example (run render-examples.mjs first).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');
const dir = path.join(root, 'examples/rendered');
const themes = (process.env.THEMES ?? 'maid,maid-dark').split(',');
const cols = ['stock', ...themes];
const names = [...new Set((await readdir(dir)).filter((f) => f.endsWith('.stock.svg')).map((f) => f.replace('.stock.svg', '')))].sort();

const cell = async (name, col) => {
  try {
    return (await readFile(path.join(dir, `${name}.${col}.svg`), 'utf8')).replace(/^<\?xml[^>]*>\s*/, '');
  } catch {
    return '<em>missing</em>';
  }
};

let rows = '';
for (const name of names) {
  rows += `<section><h2>${name}</h2><div class="row">`;
  for (const col of cols) rows += `<figure class="${col}"><figcaption>${col}</figcaption>${await cell(name, col)}</figure>`;
  rows += '</div></section>';
}
const html = `<!doctype html><html><head><meta charset="utf-8"><title>prettymaids gallery</title>
<style>
body{margin:0;padding:32px;font:14px/1.4 system-ui,sans-serif;background:#eef1f5;color:#1f2933}
h1{margin:0 0 24px}h2{margin:32px 0 12px;text-transform:capitalize}
.row{display:grid;grid-template-columns:repeat(${cols.length},minmax(0,1fr));gap:16px;align-items:start}
figure{margin:0;padding:16px;background:#fff;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
figure.maid-dark{background:#0f141c}figcaption{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8a94a2;margin-bottom:8px}
svg{max-width:100%;height:auto;max-height:520px}
</style></head><body><h1>prettymaids</h1>${rows}</body></html>`;
await writeFile(path.join(dir, 'gallery.html'), html);
console.log('wrote', path.join(dir, 'gallery.html'));
