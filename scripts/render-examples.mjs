// Renders examples/*.mmd with stock mermaid and with prettymaids, to examples/rendered/*.png (+ .svg).
import { build } from 'esbuild';
import puppeteer from 'puppeteer-core';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const only = process.argv.slice(2);
const themes = (process.env.THEMES ?? 'maid').split(',');

const bundle = await build({
  entryPoints: [path.join(root, 'packages/core/src/index.ts')],
  bundle: true, format: 'iife', globalName: 'prettymaids', write: false,
});
const mermaidJs = await readFile(path.join(root, 'node_modules/mermaid/dist/mermaid.min.js'), 'utf8');

const outDir = path.join(root, 'examples/rendered');
await mkdir(outDir, { recursive: true });
const files = (await readdir(path.join(root, 'examples'))).filter((f) => f.endsWith('.mmd') && (!only.length || only.some((o) => f.includes(o))));

const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });
await page.setContent('<html><body style="margin:0"><div id="out"></div></body></html>');
await page.addScriptTag({ content: mermaidJs });
await page.addScriptTag({ content: bundle.outputFiles[0].text });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));

async function shoot(svg, bg, name) {
  // Themes that paint their own background fill the frame edge to edge.
  const pad = svg.includes('data-pm="background"') ? 0 : 32;
  await page.evaluate((s, b, pad) => {
    document.body.style.background = b;
    document.getElementById('out').innerHTML = `<div style="display:inline-block;padding:${pad}px">${s}</div>`;
  }, svg, bg, pad);
  const box = await page.$('#out > div');
  await box.screenshot({ path: path.join(outDir, `${name}.png`) });
  await writeFile(path.join(outDir, `${name}.svg`), svg);
}

for (const f of files) {
  const src = await readFile(path.join(root, 'examples', f), 'utf8');
  const base = f.replace(/\.mmd$/, '');
  const stock = await page.evaluate(async (s) => {
    mermaid.initialize({ startOnLoad: false });
    return (await mermaid.render('stock', s)).svg;
  }, src);
  await shoot(stock, '#fff', `${base}.stock`);
  for (const t of themes) {
    const svg = await page.evaluate((s, t) => prettymaids.render(s, { theme: t }), src, t);
    await shoot(svg, '#fff', `${base}.${t}`);
  }
  console.log('rendered', f);
}
await browser.close();
