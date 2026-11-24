// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { classifyNodes, postprocess } from '../src/postprocess.js';
import { config } from '../src/config.js';
import { getTheme } from '../src/themes/index.js';
import type { Theme } from '../src/types.js';

const g = { nodeFrom: '#fff', nodeTo: '#eee', decisionFrom: '#fff', decisionTo: '#eee', terminalFrom: '#fff', terminalTo: '#eee', shadow: '#000' };
const maid = getTheme('maid');
const gradTheme: Theme = { ...maid, gradients: g };

function svgFrom(inner: string, cls = ''): Element {
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}">${inner}</svg>`,
    'image/svg+xml',
  );
  return doc.documentElement;
}

describe('classifyNodes', () => {
  it('tags polygons as decisions, curve paths as terminals, arc paths as neither', () => {
    const svg = svgFrom(`
      <g class="node" id="d"><polygon points="0,0 1,1 0,1" class="label-container"/></g>
      <g class="node" id="t"><g class="label-container"><path d="M0 0 C1 1, 2 2, 3 3"/></g></g>
      <g class="node" id="c"><path class="label-container" d="M0,1 a2,1 0,0,0 4,0"/></g>`, 'flowchart');
    classifyNodes(svg);
    expect(svg.querySelector('#d')!.classList.contains('pm-decision')).toBe(true);
    expect(svg.querySelector('#t')!.classList.contains('pm-terminal')).toBe(true);
    const c = svg.querySelector('#c')!;
    expect(c.classList.contains('pm-terminal') || c.classList.contains('pm-decision')).toBe(false);
  });
});

describe('classifyNodes scope', () => {
  it('leaves non-flowchart diagrams (class, mindmap) alone', () => {
    const svg = svgFrom('<g class="node" id="x"><g class="label-container"><path d="M0 0 C1 1, 2 2, 3 3"/></g></g>', 'classDiagram');
    classifyNodes(svg);
    expect(svg.querySelector('#x')!.classList.contains('pm-terminal')).toBe(false);
  });
});

describe('postprocess', () => {
  it('adds gradients and shadow filter only when the theme asks for them', () => {
    const svg = svgFrom('<g class="node"><rect class="basic label-container"/></g>');
    postprocess(svg, gradTheme);
    for (const id of ['pm-node', 'pm-decision', 'pm-terminal', 'pm-shadow']) {
      expect(svg.querySelector(`#${id}`)).not.toBeNull();
    }
    const flat = svgFrom('<g class="node"><rect class="basic label-container"/></g>');
    postprocess(flat, maid);
    expect(flat.querySelector('#pm-node')).toBeNull();
  });
  it('rounds square rects to the theme radius', () => {
    const svg = svgFrom('<g class="node"><rect class="basic label-container"/></g>');
    postprocess(svg, maid);
    expect(svg.querySelector('rect')!.getAttribute('rx')).toBe(String(maid.radius));
  });
});

describe('background', () => {
  it('paints a solid background as the first child, beneath later defs', () => {
    const doc = new DOMParser().parseFromString(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 100 50"><g class="content"/><defs/></svg>',
      'image/svg+xml',
    );
    const svg = doc.documentElement;
    postprocess(svg, { ...maid, background: '#123456' });
    const first = svg.firstElementChild!;
    expect(first.getAttribute('data-pm')).toBe('background');
    expect(first.getAttribute('fill')).toBe('#123456');
    expect(first.getAttribute('width')).toBe('100');
  });
  it('is transparent by default and solid for maid-dark', () => {
    expect(getTheme('maid').background).toBeUndefined();
    expect(getTheme('maid-dark').background).toBe('#1a2230');
    expect(getTheme('maid', { paintBackground: 'solid' }).background).toBe('#ffffff');
  });
});

describe('config', () => {
  it('produces a base-theme mermaid config', () => {
    const c = config('maid') as any;
    expect(c.theme).toBe('base');
    expect(c.themeCSS).toContain('stroke');
    expect(c.flowchart.curve).toBeUndefined();
    expect(c.layout).toBeUndefined();
    expect(c.flowchart.padding).toBe(22);
  });
  it('applies parameter overrides', () => {
    const c = config('maid', { padding: 30, connector: 'curved', fontSize: 20 }) as any;
    expect(c.flowchart.padding).toBe(30);
    expect(c.flowchart.curve).toBe('basis');
    expect(c.layout).toBe('dagre');
    expect(c.themeVariables.fontSize).toBe('20px');
  });
  it('rejects unknown themes', () => {
    expect(() => config('nope')).toThrow(/Unknown theme/);
  });
});
