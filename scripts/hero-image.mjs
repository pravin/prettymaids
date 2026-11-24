// Builds docs/images/hero.png: stock mermaid (left) vs prettymaids with a light/dark split (right), from docs/hero.mmd.
import { build } from 'esbuild';
import puppeteer from 'puppeteer-core';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const source = await readFile(path.join(root, 'docs/hero.mmd'), 'utf8');
const bundle = await build({
  entryPoints: [path.join(root, 'packages/core/src/index.ts')],
  bundle: true, format: 'iife', globalName: 'prettymaids', write: false,
});
const mermaidJs = await readFile(path.join(root, 'node_modules/mermaid/dist/mermaid.min.js'), 'utf8');

const PANEL = { w: 780, h: 340 };

const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
await page.addScriptTag({ content: mermaidJs });
await page.addScriptTag({ content: bundle.outputFiles[0].text });
const [stock, light, dark] = await page.evaluate(async (src) => {
  mermaid.initialize({ startOnLoad: false });
  return [
    (await mermaid.render('stock', src)).svg,
    await prettymaids.render(src, { theme: 'maid' }),
    await prettymaids.render(src, { theme: 'maid-dark' }),
  ];
}, source);
await page.setViewport({ width: PANEL.w * 2 + 84, height: 460, deviceScaleFactor: 2 });
await page.setContent(`<html><head><style>
  body{margin:0;padding:28px;background:#eef1f6;font:600 15px Inter,system-ui,sans-serif;color:#5b6678;display:flex;gap:28px}
  figure{margin:0}
  .panel{position:relative;width:${PANEL.w}px;height:${PANEL.h}px;overflow:hidden;border-radius:14px;background:#fff;box-shadow:0 1px 3px rgba(16,24,40,.14)}
  .layer{position:absolute;inset:0;overflow:hidden}
  .layer > svg{position:absolute}
  .dark{clip-path:inset(0 0 0 50%);background:#12161f}
  .divider{position:absolute;top:0;bottom:0;left:50%;width:2px;margin-left:-1px;background:#7c8aa5;opacity:.8}
  .tag{position:absolute;top:14px;padding:4px 10px;border-radius:999px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;background:rgba(255,255,255,.9);color:#334155}
  .tag.r{right:14px;background:rgba(18,22,31,.85);color:#e5e9f2}
  .tag.l{left:14px}
  figcaption{margin-top:14px;text-align:center;letter-spacing:.02em}
</style></head><body>
  <figure><div class="panel"><div class="layer" id="stock"></div></div><figcaption>Stock mermaid</figcaption></figure>
  <figure><div class="panel">
    <div class="layer" id="light"></div><div class="layer dark" id="dark"></div><div class="divider"></div>
    <span class="tag l">maid</span><span class="tag r">maid-dark</span>
  </div><figcaption>prettymaids</figcaption></figure>
</body></html>`);

await page.evaluate(
  (parts, panel) => {
    for (const [id, markup] of Object.entries(parts)) {
      const host = document.getElementById(id);
      host.innerHTML = markup;
      const el = host.querySelector('svg');
      // Each diagram is scaled to fill the panel width, then centred vertically.
      const [, , w, h] = el.getAttribute('viewBox').split(/\s+/).map(Number);
      const scale = (panel.w * 0.94) / w;
      el.removeAttribute('width');
      el.removeAttribute('height');
      el.style.cssText = `width:${w * scale}px;height:${h * scale}px;max-width:none;transform:none;left:${(panel.w - w * scale) / 2}px;top:${(panel.h - h * scale) / 2}px`;
    }
  },
  { stock, light, dark }, PANEL,
);
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 200));
const { width, height } = await page.evaluate(() => ({ width: document.body.scrollWidth, height: document.body.scrollHeight }));
await page.screenshot({ path: path.join(root, 'docs/images/hero.png'), clip: { x: 0, y: 0, width, height: height + 12 } });
await browser.close();
console.log('wrote hero');
