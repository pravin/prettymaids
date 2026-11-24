// Builds a self-contained comparison gallery (stock mermaid vs each theme, per example).
// Run render-examples.mjs first. Output: $OUT, default examples/rendered/gallery.html.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');
const dir = path.join(root, 'examples/rendered');
const outFile = process.env.OUT ? path.resolve(process.env.OUT) : path.join(dir, 'gallery.html');
const themes = (process.env.THEMES ?? 'maid,maid-dark,maid-flat').split(',');
const cols = ['stock', ...themes];
const caption = { stock: 'Stock mermaid', maid: 'maid', 'maid-dark': 'maid-dark', 'maid-flat': 'maid-flat' };
const title = { er: 'Entity-relationship', gitgraph: 'Git graph', class: 'Class diagram', state: 'State diagram', sequence: 'Sequence diagram' };
const pretty = (n) => title[n] ?? n[0].toUpperCase() + n.slice(1);

const names = [...new Set((await readdir(dir)).filter((f) => f.endsWith('.stock.svg')).map((f) => f.replace('.stock.svg', '')))].sort();
// Flowchart first: it is the clearest before/after.
names.sort((a, b) => (a === 'flowchart' ? -1 : b === 'flowchart' ? 1 : a.localeCompare(b)));

const cell = async (name, col) => {
  try {
    return (await readFile(path.join(dir, `${name}.${col}.svg`), 'utf8')).replace(/^<\?xml[^>]*>\s*/, '');
  } catch {
    return '<em>missing</em>';
  }
};

let sections = '';
for (const name of names) {
  sections += `<section id="${name}"><h2>${pretty(name)}</h2><div class="row">`;
  for (const col of cols) sections += `<figure class="${col}"><figcaption>${caption[col] ?? col}</figcaption>${await cell(name, col)}</figure>`;
  sections += '</div></section>';
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>prettymaids gallery</title>
XX
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#f3f5f9;--card:#fff;--text:#1c2433;--muted:#5b6678;--line:#e0e5ee;--accent:#4f7cf0}
*{box-sizing:border-box}
body{margin:0;font:15px/1.5 Inter,-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text)}
header{padding:48px 32px 8px;max-width:1500px;margin:0 auto}
h1{margin:0;font-size:32px;letter-spacing:-.02em}
header p{margin:8px 0 16px;color:var(--muted);max-width:60ch}
nav{display:flex;gap:10px;flex-wrap:wrap}
nav a{color:var(--text);text-decoration:none;font-weight:500;font-size:14px;padding:7px 14px;border:1px solid var(--line);border-radius:999px;background:var(--card)}
nav a:hover{border-color:var(--accent);color:var(--accent)}
nav a.primary{background:var(--accent);border-color:var(--accent);color:#fff}
nav a.primary:hover{color:#fff;opacity:.9}
main{padding:8px 32px 64px;max-width:1500px;margin:0 auto}
h2{margin:40px 0 12px;font-size:20px;letter-spacing:-.01em}
.row{display:grid;grid-template-columns:repeat(${cols.length},minmax(0,1fr));gap:16px;align-items:start}
figure{margin:0;padding:16px;background:var(--card);border-radius:12px;box-shadow:0 1px 3px rgba(16,24,40,.08);overflow:hidden}
figure.maid-dark{background:#12161f}
figcaption{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#8a94a2;margin-bottom:10px}
svg{display:block;max-width:100%;height:auto;max-height:520px;margin:0 auto}
@media(max-width:1100px){.row{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.row{grid-template-columns:1fr}header{padding:32px 16px 8px}main{padding:8px 16px 48px}}
</style></head><body>
<header><h1>prettymaids gallery</h1>
<p>Stock Mermaid next to the prettymaids themes, for every diagram type. Everything below is rendered by the library itself.</p>
<nav><a class="primary" href="../">Open the playground</a><a href="https://github.com/pravin/prettymaids">GitHub</a>${names.map((n) => `<a href="#${n}">${pretty(n)}</a>`).join('')}</nav></header>
<main>${sections}</main></body></html>`;

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, html);
console.log('wrote', outFile, `(${(html.length / 1e6).toFixed(1)} MB)`);
