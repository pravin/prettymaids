// Builds docs/images/social.png (1280x640): the GitHub social preview / Open Graph image.
// Run render-examples.mjs first (uses the flowchart stock + maid renders).
import puppeteer from 'puppeteer-core';
import { readFile, copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const img = async (col) => `data:image/png;base64,${(await readFile(path.join(root, `examples/rendered/flowchart.${col}.png`))).toString('base64')}`;
const [stock, maid] = await Promise.all([img('stock'), img('maid')]);

const html = `<html><body style="margin:0;width:1280px;height:640px;overflow:hidden;background:radial-gradient(900px 500px at 85% 20%,#1d2a52 0%,#12161f 60%);font-family:Inter,-apple-system,'Segoe UI',Roboto,sans-serif;color:#fff;position:relative">
<div style="position:absolute;left:84px;top:150px;width:540px">
  <div style="font-size:84px;font-weight:700;letter-spacing:-0.035em;line-height:1">prettymaids</div>
  <div style="font-size:34px;font-weight:500;color:#aab6d3;margin-top:22px;line-height:1.3">Make Mermaid diagrams<br>look good.</div>
  <div style="display:flex;gap:10px;margin-top:40px;flex-wrap:wrap">
    ${['3 themes', 'CLI', 'Live playground', 'MIT'].map((t) => `<span style="font-size:19px;font-weight:600;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#dbe3f5">${t}</span>`).join('')}
  </div>
</div>
<div style="position:absolute;left:650px;top:150px;width:260px">
  <div style="font-size:15px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#7f8bab;margin-bottom:12px">Stock Mermaid</div>
  <div style="width:260px;height:330px;box-sizing:border-box;padding:10px;border-radius:16px;background:#fff;box-shadow:0 20px 50px rgba(0,0,0,.45)"><img src="${stock}" style="width:100%;height:100%;object-fit:contain"></div>
</div>
<div style="position:absolute;left:926px;top:96px;width:320px">
  <div style="font-size:15px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8fb0ff;margin-bottom:12px">prettymaids</div>
  <div style="width:320px;height:410px;box-sizing:border-box;padding:12px;border-radius:18px;background:#fff;box-shadow:0 28px 70px rgba(79,124,240,.35),0 0 0 1px rgba(255,255,255,.12)"><img src="${maid}" style="width:100%;height:100%;object-fit:contain"></div>
</div>
<div style="position:absolute;left:84px;bottom:44px;font-size:20px;color:#6f7c9b;font-weight:500">github.com/pravin/prettymaids</div>
</body></html>`;

const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 640, deviceScaleFactor: 1 });
await page.setContent(html);
await new Promise((r) => setTimeout(r, 300));
const out = path.join(root, 'docs/images/social.png');
await mkdir(path.dirname(out), { recursive: true });
await page.screenshot({ path: out });
await browser.close();
// Also served by the hosted site, so shared links get a preview card.
await mkdir(path.join(root, 'apps/playground/public'), { recursive: true });
await copyFile(out, path.join(root, 'apps/playground/public/social.png'));
console.log('wrote', out);
