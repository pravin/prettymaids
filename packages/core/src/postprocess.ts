import type { Theme } from './types.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(doc: Document, tag: string, attrs: Record<string, string>): Element {
  const e = doc.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function gradient(doc: Document, id: string, from: string, to: string): Element {
  const g = el(doc, 'linearGradient', { id, x1: '0', y1: '0', x2: '0', y2: '1' });
  g.appendChild(el(doc, 'stop', { offset: '0%', 'stop-color': from }));
  g.appendChild(el(doc, 'stop', { offset: '100%', 'stop-color': to }));
  return g;
}

/** Adds gradients and the drop-shadow filter that the theme CSS refers to. */
export function addDefs(svg: Element, theme: Theme): void {
  const doc = svg.ownerDocument;
  const p = theme.gradients;
  if (!p) return;
  let defs: Element | null = svg.querySelector('defs');
  if (!defs) {
    defs = el(doc, 'defs', {});
    svg.insertBefore(defs, svg.firstChild);
  }
  defs.appendChild(gradient(doc, 'pm-node', p.nodeFrom, p.nodeTo));
  defs.appendChild(gradient(doc, 'pm-decision', p.decisionFrom, p.decisionTo));
  defs.appendChild(gradient(doc, 'pm-terminal', p.terminalFrom, p.terminalTo));
  const f = el(doc, 'filter', { id: 'pm-shadow', x: '-20%', y: '-20%', width: '140%', height: '150%' });
  f.appendChild(
    el(doc, 'feDropShadow', { dx: '0', dy: '2', stdDeviation: '3', 'flood-color': p.shadow, 'flood-opacity': '0.18' }),
  );
  defs.appendChild(f);
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

export function postprocess(svg: Element, theme: Theme): void {
  addDefs(svg, theme);
  classifyNodes(svg);
  roundCorners(svg, theme.radius);
  alignClusterTitles(svg);
}
