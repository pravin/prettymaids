import mermaid from 'mermaid';
import { render, themes } from 'prettymaids';
import './style.css';

const STOCK = 'stock';
const examples = import.meta.glob('../../../examples/*.mmd', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const sourceEl = $<HTMLTextAreaElement>('source');
const themeEl = $<HTMLSelectElement>('theme');
const exampleEl = $<HTMLSelectElement>('example');
const previewEl = $('preview');
const errorEl = $('error');

for (const name of [...Object.keys(themes), STOCK]) themeEl.add(new Option(name === STOCK ? 'stock mermaid' : name, name));
for (const [path, src] of Object.entries(examples)) {
  const name = path.split('/').pop()!.replace('.mmd', '');
  exampleEl.add(new Option(name, name));
  exampleEl.dataset[name] = src;
}

let current = 0;
let currentSvg = '';
let timer: number | undefined;

async function update() {
  const run = ++current;
  const source = sourceEl.value;
  try {
    let svg: string;
    if (themeEl.value === STOCK) {
      mermaid.initialize({ startOnLoad: false });
      svg = (await mermaid.render(`stock-${run}`, source)).svg;
    } else {
      svg = await render(source, { theme: themeEl.value, mermaid });
    }
    if (run !== current) return;
    currentSvg = svg;
    previewEl.innerHTML = svg;
    // Natural size, but shrink to fit the pane (keeps aspect ratio).
    const el = previewEl.querySelector('svg');
    if (el) {
      const { w, h } = svgSize(svg);
      el.removeAttribute('style');
      el.setAttribute('width', String(w));
      el.setAttribute('height', String(h));
    }
    errorEl.textContent = '';
  } catch (e) {
    if (run !== current) return;
    errorEl.textContent = e instanceof Error ? e.message : String(e);
  }
}

const schedule = () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(update, 250);
};

function save(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function svgSize(svg: string): { w: number; h: number } {
  const vb = /viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"/.exec(svg);
  return { w: Math.ceil(Number(vb?.[1] ?? 800)), h: Math.ceil(Number(vb?.[2] ?? 600)) };
}

async function toPng(svg: string, scale = 2): Promise<Blob> {
  const { w, h } = svgSize(svg);
  const sized = svg.replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace('<svg', `<svg width="${w}" height="${h}"`);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'));
}

sourceEl.addEventListener('input', schedule);
themeEl.addEventListener('change', update);
exampleEl.addEventListener('change', () => {
  sourceEl.value = exampleEl.dataset[exampleEl.value] ?? '';
  update();
});
$('copy').addEventListener('click', () => navigator.clipboard.writeText(currentSvg));
$('dl-svg').addEventListener('click', () => save(new Blob([currentSvg], { type: 'image/svg+xml' }), 'diagram.svg'));
$('dl-png').addEventListener('click', async () => {
  try {
    save(await toPng(currentSvg), 'diagram.png');
  } catch (e) {
    errorEl.textContent = e instanceof Error ? e.message : String(e);
  }
});

exampleEl.value = 'flowchart';
sourceEl.value = exampleEl.dataset.flowchart ?? '';
update();
