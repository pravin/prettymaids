import type { Theme } from './types.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(doc: Document, tag: string, attrs: Record<string, string>): Element {
  const e = doc.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function ensureDefs(svg: Element): Element {
  let defs: Element | null = svg.querySelector('defs');
  if (!defs) {
    defs = el(svg.ownerDocument, 'defs', {});
    svg.insertBefore(defs, svg.firstChild);
  }
  return defs;
}

/** Adds the stacked soft-shadow filter (`pm-shadow`) that the theme CSS applies to nodes. */
export function addDefs(svg: Element, theme: Theme): void {
  const s = theme.shadow;
  if (!s || svg.querySelector('#pm-shadow')) return;
  const doc = svg.ownerDocument;
  const f = el(doc, 'filter', {
    id: 'pm-shadow', x: '-25%', y: '-25%', width: '150%', height: '170%', 'color-interpolation-filters': 'sRGB',
  });
  const merge = el(doc, 'feMerge', {});
  s.layers.forEach((l, i) => {
    f.appendChild(
      el(doc, 'feDropShadow', {
        in: 'SourceGraphic', dx: '0', dy: String(l.dy), stdDeviation: String(l.blur / 2),
        'flood-color': s.color, 'flood-opacity': String(l.opacity), result: `s${i}`,
      }),
    );
  });
  // Widest shadow first so the tight one sits closest to the node.
  for (let i = s.layers.length - 1; i >= 0; i--) merge.appendChild(el(doc, 'feMergeNode', { in: `s${i}` }));
  f.appendChild(merge);
  ensureDefs(svg).appendChild(f);
}

/** Tags flowchart nodes by shape so the theme can colour decisions and terminals differently. */
export function classifyNodes(svg: Element): void {
  // Only flowcharts: class/state/mindmap nodes use similar shapes but must keep the default look.
  if (!svg.classList.contains('flowchart') && !svg.matches('[aria-roledescription^="flowchart"]')) return;
  for (const node of Array.from(svg.querySelectorAll('g.node'))) {
    if (node.querySelector(':scope > polygon, :scope > g > polygon')) {
      node.classList.add('pm-decision');
    } else if (node.querySelector(':scope > circle, :scope > g > circle, :scope > ellipse')) {
      node.classList.add('pm-terminal');
    } else {
      const path = node.querySelector(':scope > g.label-container > path, :scope > path.label-container');
      const d = path?.getAttribute('d') ?? '';
      // Stadium ("pill") paths are cubic curves; cylinders use arc commands.
      if (d && !/[aA]/.test(d)) {
        node.classList.add('pm-terminal');
        continue;
      }
      const rect = node.querySelector(':scope > rect, :scope > g > rect');
      const rx = Number(rect?.getAttribute('rx') ?? 0);
      const h = Number(rect?.getAttribute('height') ?? 0);
      if (rect && h > 0 && rx >= h / 2 - 1) node.classList.add('pm-terminal');
    }
  }
}

/** Rounds plain rectangles that mermaid left square. */
export function roundCorners(svg: Element, radius: number): void {
  for (const rect of Array.from(svg.querySelectorAll('g.node rect.basic, g.node rect.label-container'))) {
    if (!rect.getAttribute('rx')) {
      rect.setAttribute('rx', String(radius));
      rect.setAttribute('ry', String(radius));
    }
  }
}

/**
 * Class and ER boxes are drawn as sketch-style paths (four straight edges), which CSS `rx` cannot
 * round. Regenerate those rectangle paths with rounded corners.
 */
export function roundPathBoxes(svg: Element, radius: number): void {
  for (const group of Array.from(svg.querySelectorAll('g.node g.outer-path, g.node > g.label-container'))) {
    const paths = Array.from(group.querySelectorAll(':scope > path')).slice(0, 2);
    const first = /^M\s*(-?[\d.]+)[ ,](-?[\d.]+)\s*L\s*(-?[\d.]+)[ ,](-?[\d.]+)\s*L\s*(-?[\d.]+)[ ,](-?[\d.]+)\s*L\s*(-?[\d.]+)[ ,](-?[\d.]+)\s*Z?\s*$/.exec(
      paths[0]?.getAttribute('d') ?? '',
    );
    if (!first) continue;
    const w = Math.abs(Number(first[1]));
    const h = Math.abs(Number(first[2]));
    const r = Math.min(radius, w, h);
    if (!r) continue;
    const d = `M${-w + r} ${-h}H${w - r}Q${w} ${-h} ${w} ${-h + r}V${h - r}Q${w} ${h} ${w - r} ${h}H${-w + r}Q${-w} ${h} ${-w} ${h - r}V${-h + r}Q${-w} ${-h} ${-w + r} ${-h}Z`;
    for (const path of paths) path.setAttribute('d', d);
  }
}

/** Mermaid creates an empty label for unlabelled edges; with chip styling it shows as a stray box. */
export function hideEmptyEdgeLabels(svg: Element): void {
  for (const label of Array.from(svg.querySelectorAll('g.edgeLabel'))) {
    if (!label.textContent?.trim()) label.setAttribute('style', 'display:none');
  }
}

/** Left-aligns subgraph titles inside the container, as Lucidchart does. */
export function alignClusterTitles(svg: Element, inset = 14, top = 8): void {
  for (const cluster of Array.from(svg.querySelectorAll('g.cluster'))) {
    const rect = cluster.querySelector(':scope > rect');
    const label = cluster.querySelector(':scope > g.cluster-label');
    if (!rect || !label) continue;
    const x = Number(rect.getAttribute('x'));
    const y = Number(rect.getAttribute('y'));
    if (Number.isNaN(x) || Number.isNaN(y)) continue;
    label.setAttribute('transform', `translate(${x + inset}, ${y + top})`);
  }
}

/** Paints a solid background and/or a dot grid behind everything, covering the viewBox. */
export function addBackground(svg: Element, color?: string, dots?: Theme['dots']): void {
  const doc = svg.ownerDocument;
  const [x, y, w, h] = (svg.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
  if ([x, y, w, h].some((n) => Number.isNaN(n))) {
    if (color) svg.setAttribute('style', `${svg.getAttribute('style') ?? ''};background:${color}`);
    return;
  }
  const box = { x: String(x), y: String(y), width: String(w), height: String(h) };
  // Inserted first, so they paint beneath everything (mermaid may put <defs> last).
  const layers: Element[] = [];
  if (color) layers.push(el(doc, 'rect', { ...box, fill: color, 'data-pm': 'background' }));
  if (dots) {
    const pat = el(doc, 'pattern', {
      id: 'pm-dots', width: String(dots.spacing), height: String(dots.spacing), patternUnits: 'userSpaceOnUse',
    });
    pat.appendChild(el(doc, 'circle', { cx: String(dots.spacing / 2), cy: String(dots.spacing / 2), r: '1.1', fill: dots.color }));
    ensureDefs(svg).appendChild(pat);
    layers.push(el(doc, 'rect', { ...box, fill: 'url(#pm-dots)', 'data-pm': 'dots' }));
  }
  for (const l of layers.reverse()) svg.insertBefore(l, svg.firstChild);
}

/** Turns mermaid's pie into a donut by clipping each slice to a ring. */
export function donutPie(svg: Element, hole: number): void {
  const slices = Array.from(svg.querySelectorAll('path.pieCircle'));
  if (!slices.length) return;
  const R = Number(/A\s*([\d.]+)/.exec(slices[0].getAttribute('d') ?? '')?.[1]);
  if (!R) return;
  const r = R * hole;
  const doc = svg.ownerDocument;
  const clip = el(doc, 'clipPath', { id: 'pm-donut' });
  clip.appendChild(
    el(doc, 'path', {
      'clip-rule': 'evenodd',
      d: `M${-R} 0A${R} ${R} 0 1 0 ${R} 0A${R} ${R} 0 1 0 ${-R} 0ZM${-r} 0A${r} ${r} 0 1 0 ${r} 0A${r} ${r} 0 1 0 ${-r} 0Z`,
    }),
  );
  ensureDefs(svg).appendChild(clip);
  for (const s of slices) s.setAttribute('clip-path', 'url(#pm-donut)');
}

/** Pairs of (parent, child) node indexes from mindmap edge ids like `...-edge_3_7`. */
function mindmapLinks(svg: Element): { path: Element; from: number; to: number }[] {
  const out: { path: Element; from: number; to: number }[] = [];
  for (const path of Array.from(svg.querySelectorAll('path.edge'))) {
    const m = /edge_(\d+)_(\d+)$/.exec(path.getAttribute('id') ?? '');
    if (m) out.push({ path, from: Number(m[1]), to: Number(m[2]) });
  }
  return out;
}

/**
 * XMind-style mindmaps: smooth S-curve branches whose weight falls off with depth, and a
 * depth class on each node (`pm-lvl1`, `pm-sub`) so the theme can fill main topics solid and
 * keep sub-topics light.
 */
export function styleMindmap(svg: Element): void {
  if (!svg.matches('[aria-roledescription="mindmap"]') && !svg.querySelector('.mindmap-node')) return;
  const links = mindmapLinks(svg);
  const depth = new Map<number, number>([[0, 0]]);
  for (let pass = 0; pass < links.length; pass++) {
    for (const l of links) if (depth.has(l.from) && !depth.has(l.to)) depth.set(l.to, depth.get(l.from)! + 1);
  }
  for (const node of Array.from(svg.querySelectorAll('g.node.mindmap-node'))) {
    const idx = Number(/node_(\d+)$/.exec(node.getAttribute('id') ?? '')?.[1]);
    const d = depth.get(idx);
    if (d === 1) node.classList.add('pm-lvl1');
    else if (d !== undefined && d > 1) node.classList.add('pm-sub');
  }
  for (const l of links) {
    const d = depth.get(l.to) ?? 1;
    l.path.classList.add(d <= 1 ? 'pm-b1' : d === 2 ? 'pm-b2' : 'pm-b3');
    const nums = (l.path.getAttribute('d') ?? '').match(/-?\d+(?:\.\d+)?/g)?.map(Number);
    if (!nums || nums.length < 4) continue;
    const [x1, y1, x2, y2] = [nums[0], nums[1], nums[nums.length - 2], nums[nums.length - 1]];
    const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
    const c = horizontal
      ? `C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`
      : `C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2}`;
    l.path.setAttribute('d', `M${x1} ${y1}${c}`);
  }
}

export function postprocess(svg: Element, theme: Theme): void {
  addDefs(svg, theme);
  classifyNodes(svg);
  roundCorners(svg, theme.radius);
  roundPathBoxes(svg, Math.min(theme.radius, 8));
  alignClusterTitles(svg);
  hideEmptyEdgeLabels(svg);
  if (theme.donut) donutPie(svg, theme.donut);
  if (theme.organicMindmap) styleMindmap(svg);
  if (theme.background || theme.dots) addBackground(svg, theme.background, theme.dots);
}
