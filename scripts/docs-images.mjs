// Builds the README images in docs/images/ from examples/rendered/*.png (run render-examples.mjs first, with THEMES=maid,maid-dark,maid-flat).
import puppeteer from 'puppeteer-core';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const rendered = path.join(root, 'examples/rendered');
const out = path.join(root, 'docs/images');
await mkdir(out, { recursive: true });

const label = { stock: 'Stock mermaid', maid: 'prettymaids (maid)', 'maid-dark': 'maid-dark', 'maid-flat': 'maid-flat' };
const data = async (name, col) => `data:image/png;base64,${(await readFile(path.join(rendered, `${name}.${col}.png`))).toString('base64')}`;

// [output name, example, columns, max image height]
const sheets = [
  ['hero', 'flowchart', ['stock', 'maid', 'maid-dark'], 720],
  ['themes', 'sequence', ['maid-flat', 'maid', 'maid-dark'], 560],
  ...['sequence', 'class', 'state', 'er', 'gantt', 'pie', 'mindmap', 'gitgraph'].map((n) => [n, n, ['stock', 'maid'], n === 'class' || n === 'state' || n === 'er' ? 600 : 420]),
];

const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage();
for (const [file, name, cols, maxH] of sheets) {
  const cells = await Promise.all(
    cols.map(async (c) => `<figure><img src="${await data(name, c)}" style="max-height:${maxH}px"><figcaption>${label[c]}</figcaption></figure>`),
  );
  const width = cols.length === 3 ? 1500 : 1200;
  await page.setViewport({ width, height: 400, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;padding:28px;background:#f3f5f9;font:600 14px system-ui,sans-serif;color:#5b6678">
    <div style="display:flex;gap:20px;align-items:flex-start">${cells.map((c) => `<div style="flex:1;min-width:0;display:flex;justify-content:center">${c}</div>`).join('')}</div>
    <style>figure{margin:0;text-align:center}img{max-width:100%;width:auto;border-radius:10px;box-shadow:0 1px 3px rgba(16,24,40,.12);background:#fff}figcaption{margin-top:12px;letter-spacing:.02em}</style></body></html>`);
  await new Promise((r) => setTimeout(r, 150));
  await page.screenshot({ path: path.join(out, `${file}.png`), fullPage: true });
  console.log('wrote', file);
}
await browser.close();
