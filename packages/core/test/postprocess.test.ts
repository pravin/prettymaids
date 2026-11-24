// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { classifyNodes, donutPie, hideEmptyEdgeLabels, postprocess, roundPathBoxes, styleMindmap } from '../src/postprocess.js';
import { config } from '../src/config.js';
import { getTheme } from '../src/themes/index.js';
import type { Theme } from '../src/types.js';

const maid = getTheme('maid');

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
  it('adds the stacked shadow filter only when the theme asks for it', () => {
    const svg = svgFrom('<g class="node"><rect class="basic label-container"/></g>');
    postprocess(svg, maid);
    const f = svg.querySelector('#pm-shadow')!;
    expect(f).not.toBeNull();
    expect(f.querySelectorAll('feDropShadow').length).toBe(2);
    expect(maid.css).toContain('pm-shadow');
    const flat = svgFrom('<g class="node"><rect class="basic label-container"/></g>');
    postprocess(flat, getTheme('maid-flat'));
    expect(flat.querySelector('#pm-shadow')).toBeNull();
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
    expect(getTheme('maid-dark').background).toBe('#12161f');
    expect(getTheme('maid', { paintBackground: 'solid' }).background).toBe('#ffffff');
  });
});

describe('donutPie', () => {
  it('clips slices to a ring sized from the pie radius', () => {
    const svg = svgFrom('<g><path d="M0,-100A100,100,0,0,1,50,86L0,0Z" class="pieCircle"/><path d="M50,86A100,100,0,1,1,0,-100L0,0Z" class="pieCircle"/></g>');
    donutPie(svg, 0.5);
    for (const p of Array.from(svg.querySelectorAll('path.pieCircle'))) expect(p.getAttribute('clip-path')).toBe('url(#pm-donut)');
    expect(svg.querySelector('clipPath path')!.getAttribute('d')).toContain('A50 50');
  });
});

describe('styleMindmap', () => {
  const mm = `<g class="edgePaths">
      <path id="x-edge_0_1" class="edge" d="M0,0L10,10C20,20,30,30,100,40"/>
      <path id="x-edge_1_2" class="edge" d="M100,40L110,30C120,20,130,20,200,0"/></g>
    <g class="node mindmap-node section-root" id="x-node_0"/>
    <g class="node mindmap-node section-0" id="x-node_1"/>
    <g class="node mindmap-node section-0" id="x-node_2"/>`;
  it('classes nodes by depth and edges by weight, and smooths branches', () => {
    const svg = svgFrom(mm);
    styleMindmap(svg);
    expect(svg.querySelector('#x-node_0')!.className.baseVal ?? svg.querySelector('#x-node_0')!.getAttribute('class')).not.toContain('pm-');
    expect(svg.querySelector('#x-node_1')!.classList.contains('pm-lvl1')).toBe(true);
    expect(svg.querySelector('#x-node_2')!.classList.contains('pm-sub')).toBe(true);
    const e1 = svg.querySelector('#x-edge_0_1')!;
    expect(e1.classList.contains('pm-b1')).toBe(true);
    expect(e1.getAttribute('d')).toBe('M0 0C50 0 50 40 100 40');
    expect(svg.querySelector('#x-edge_1_2')!.classList.contains('pm-b2')).toBe(true);
  });
});

describe('roundPathBoxes', () => {
  it('replaces sketch rectangle paths on class/ER boxes with rounded ones', () => {
    const svg = svgFrom('<g class="node"><g class="outer-path"><path id="f" d="M-50 -20 L50 -20 L50 20 L-50 20"/><path id="s" d="M-50 -20 C-30 -20, 0 -20, 50 -20 M1 1"/></g></g>');
    roundPathBoxes(svg, 6);
    for (const id of ['f', 's']) expect(svg.querySelector('#' + id)!.getAttribute('d')).toBe('M-44 -20H44Q50 -20 50 -14V14Q50 20 44 20H-44Q-50 20 -50 14V-14Q-50 -20 -44 -20Z');
  });
  it('leaves non-rectangular shapes alone', () => {
    const svg = svgFrom('<g class="node"><g class="outer-path"><path id="c" d="M0,13 a72,13 0,0,0 144,0"/></g></g>');
    roundPathBoxes(svg, 6);
    expect(svg.querySelector('#c')!.getAttribute('d')).toBe('M0,13 a72,13 0,0,0 144,0');
  });
});

describe('hideEmptyEdgeLabels', () => {
  it('hides unlabelled edge-label groups only', () => {
    const svg = svgFrom('<g class="edgeLabel" id="a"><g class="label"/></g><g class="edgeLabel" id="b"><g class="label"><text>Yes</text></g></g>');
    hideEmptyEdgeLabels(svg);
    expect(svg.querySelector('#a')!.getAttribute('style')).toBe('display:none');
    expect(svg.querySelector('#b')!.getAttribute('style')).toBeNull();
  });
});

describe('dot grid', () => {
  it('adds a dots pattern layer above the background', () => {
    const doc = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><g/></svg>', 'image/svg+xml');
    postprocess(doc.documentElement, getTheme('maid', { grid: 'dots', paintBackground: 'solid' }));
    const kids = Array.from(doc.documentElement.children).map((c) => c.getAttribute('data-pm'));
    expect(kids.slice(0, 2)).toEqual(['background', 'dots']);
    expect(doc.documentElement.querySelector('pattern#pm-dots')).not.toBeNull();
  });
});

describe('themes', () => {
  it('maid-flat keeps the flat look; maid-dark paints a dark background', () => {
    const l = getTheme('maid-flat');
    expect(l.radius).toBe(4);
    expect(l.shadow).toBeUndefined();
    expect(l.donut).toBeUndefined();
    expect(getTheme('maid-dark').background).toBe('#12161f');
  });
});

describe('config', () => {
  it('produces a base-theme mermaid config', () => {
    const c = config('maid') as any;
    expect(c.theme).toBe('base');
    expect(c.themeCSS).toContain('stroke');
    expect(c.flowchart.curve).toBeUndefined();
    expect(c.layout).toBeUndefined();
    expect(c.flowchart.padding).toBe(20);
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
