import mermaid from 'mermaid';
import { render, themes, type Params } from 'prettymaids';
import './style.css';

const STOCK = 'stock';
const examples = import.meta.glob('../../../examples/*.mmd', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const sourceEl = $<HTMLTextAreaElement>('source');
const themeEl = $<HTMLSelectElement>('theme');
const exampleEl = $<HTMLSelectElement>('example');
const previewEl = $('preview');
const errorEl = $('error');
const tuningEl = $('tuning');

// Tuning state: per-theme overrides (only values that differ from defaults), kept in localStorage.
const STORE = 'prettymaids.tuning.v1';
let overrides: Record<string, Params> = {};
try {
  overrides = JSON.parse(localStorage.getItem(STORE) ?? '{}');
} catch {
  overrides = {};
}
const persist = () => {
  try {
    localStorage.setItem(STORE, JSON.stringify(overrides));
  } catch {
    /* storage unavailable; tuning just won't persist */
  }
};
const themeParams = () => overrides[themeEl.value] ?? {};

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
      svg = await render(source, { theme: themeEl.value, params: themeParams(), mermaid });
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

function buildTuning() {
  tuningEl.replaceChildren();
  const def = themes[themeEl.value];
  tuningEl.classList.toggle('disabled', !def);
  if (!def) return;
  const current = themeParams();
  let group = '';
  for (const spec of def.params) {
    if (spec.group !== group) {
      group = spec.group;
      const h = document.createElement('h3');
      h.textContent = group;
      tuningEl.append(h);
    }
    const value = current[spec.key] ?? spec.default;
    const row = document.createElement('div');
    row.className = 'row';
    const label = document.createElement('label');
    label.textContent = spec.label;
    row.append(label);
    let input: HTMLInputElement | HTMLSelectElement;
    const out = document.createElement('output');
    if (spec.kind === 'choice') {
      const sel = document.createElement('select');
      for (const c of spec.choices ?? []) sel.add(new Option(c, c));
      sel.value = String(value);
      input = sel;
    } else {
      const inp = document.createElement('input');
      inp.type = spec.kind === 'color' ? 'color' : 'range';
      if (spec.kind === 'number') {
        inp.min = String(spec.min);
        inp.max = String(spec.max);
        inp.step = String(spec.step ?? 1);
      }
      inp.value = String(value);
      input = inp;
      if (spec.kind === 'number') out.textContent = String(value);
    }
    input.addEventListener('input', () => {
      const v: string | number = spec.kind === 'number' ? Number(input.value) : input.value;
      out.textContent = String(v);
      const next = { ...(overrides[themeEl.value] ?? {}) };
      if (v === spec.default) delete next[spec.key];
      else next[spec.key] = v;
      overrides[themeEl.value] = next;
      persist();
      schedule();
    });
    if (spec.kind === 'number') row.append(out);
    row.append(input);
    tuningEl.append(row);
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
themeEl.addEventListener('change', () => {
  buildTuning();
  update();
});
$('reset').addEventListener('click', () => {
  delete overrides[themeEl.value];
  persist();
  buildTuning();
  update();
});
$('copy-params').addEventListener('click', () => navigator.clipboard.writeText(JSON.stringify(themeParams(), null, 2)));
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

buildTuning();
exampleEl.value = 'flowchart';
sourceEl.value = exampleEl.dataset.flowchart ?? '';
update();
