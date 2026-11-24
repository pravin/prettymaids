// Records docs/images/tuning.gif: a scripted tour of the playground's live tuning.
// Usage: node scripts/record-gif.mjs [url]   (default: the hosted playground; needs Google Chrome + ffmpeg)
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');
const url = process.argv[2] ?? 'https://pravin.github.io/prettymaids/';
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const frames = path.join(root, 'examples/rendered/gif-frames');
const out = path.join(root, 'docs/images/tuning.gif');
const FPS = 7;

await rm(frames, { recursive: true, force: true });
await mkdir(frames, { recursive: true });
await mkdir(path.dirname(out), { recursive: true });

const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 760, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForSelector('#preview svg');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0;
const frameName = (i) => path.join(frames, `f${String(i).padStart(4, '0')}.png`);

/** Takes a screenshot and holds it for `hold` frames. */
async function snap(hold = 1) {
  await page.screenshot({ path: frameName(n++) });
  for (let i = 1; i < hold; i++) await copyFile(frameName(n - 1), frameName(n++));
}

/** Sets a tuning control by its label (slider, select or colour), scrolling it into view first. */
async function tune(label, value, hold = 1) {
  await page.evaluate(
    (label, value) => {
      const row = [...document.querySelectorAll('.row')].find((r) => r.querySelector('label').textContent === label);
      if (!row) throw new Error(`no control "${label}"`);
      row.scrollIntoView({ block: 'center' });
      const input = row.querySelector('input,select');
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    label,
    value,
  );
  await sleep(750);
  await snap(hold);
}

async function sweep(label, from, to, step, lastHold = 3) {
  const dir = Math.sign(to - from);
  for (let v = from; dir > 0 ? v <= to : v >= to; v += dir * step) await tune(label, v, v === to ? lastHold : 1);
}

async function choose(selector, value, hold = 4) {
  await page.select(selector, value);
  await sleep(1100);
  await snap(hold);
}

await sleep(600);
await snap(8); // the default look

// Big, obvious changes first: text-size changes are invisible because the preview scales to fit.
await sweep('Corner radius', 10, 24, 4);
await sweep('Border weight', 1, 3, 0.5, 2);
for (const [fill, stroke] of [['#ffe4e6', '#f08a9b'], ['#d9f7e6', '#4cc38a'], ['#fff3c4', '#e0a92f']]) {
  await tune('Node fill', fill, 1);
  await tune('Node border', stroke, 3);
}
await tune('Shadow', 'lifted', 4);
await tune('Connector style', 'curved', 5);
await page.click('#reset');
await sleep(900);
await snap(3);

await choose('#theme', 'maid-dark', 5);
await tune('Canvas grid', 'dots', 6);
await choose('#example', 'mindmap', 7);
await choose('#theme', 'maid', 2);
await choose('#example', 'pie', 6);
await tune('Pie charts', 'pie', 5);
await tune('Pie charts', 'donut', 6);
await page.click('#reset');
await sleep(500);
await choose('#example', 'flowchart', 8);
await browser.close();

execFileSync(
  'ffmpeg',
  [
    '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, 'f%04d.png'),
    '-vf', 'scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
    '-loop', '0', out,
  ],
  { stdio: 'inherit' },
);
console.log(`wrote ${out} from ${n} frames (${(n / FPS).toFixed(1)}s)`);
