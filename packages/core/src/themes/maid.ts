import type { ParamSpec, Params, Theme, ThemeDef } from '../types.js';

const fonts: Record<string, string> = {
  'Open Sans': `'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
  Inter: `Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif`,
  Helvetica: `'Helvetica Neue', Helvetica, Arial, sans-serif`,
  System: `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`,
  Mono: `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`,
};

const num = (key: string, label: string, group: string, def: number, min: number, max: number, step = 1): ParamSpec => ({
  key, label, group, kind: 'number', default: def, min, max, step,
});
const color = (key: string, label: string, def: string): ParamSpec => ({ key, label, group: 'Colours', kind: 'color', default: def });

// Flat, Lucidchart-like: solid pastel fills, thin darker borders, small radius, elbow connectors.
export const maidParams: ParamSpec[] = [
  { key: 'font', label: 'Font', group: 'Type', kind: 'choice', default: 'Open Sans', choices: Object.keys(fonts) },
  num('fontSize', 'Node text', 'Type', 18, 11, 32),
  num('edgeFontSize', 'Edge label text', 'Type', 15, 9, 26),
  num('padding', 'Node padding', 'Spacing', 22, 6, 44),
  num('nodeSpacing', 'Node gap', 'Spacing', 70, 20, 140, 2),
  num('rankSpacing', 'Rank gap', 'Spacing', 80, 20, 160, 2),
  num('radius', 'Corner radius', 'Shape', 4, 0, 24),
  num('strokeWidth', 'Line weight', 'Shape', 1.5, 0.5, 4, 0.25),
  { key: 'curve', label: 'Connector style', group: 'Shape', kind: 'choice', default: 'step', choices: ['step', 'linear', 'basis'] },
  color('nodeFill', 'Node fill', '#dcebfa'),
  color('nodeStroke', 'Node border', '#3b82c4'),
  color('decisionFill', 'Decision fill', '#fff1cc'),
  color('decisionStroke', 'Decision border', '#e0a526'),
  color('terminalFill', 'Terminal fill', '#d9f2e0'),
  color('terminalStroke', 'Terminal border', '#46a56a'),
  color('lineColor', 'Connector', '#5a6472'),
  color('textColor', 'Text', '#1f2933'),
  color('clusterFill', 'Container fill', '#f5f7fa'),
  color('clusterStroke', 'Container border', '#c9d1db'),
];

function values(overrides: Params = {}): Params {
  const v: Params = {};
  for (const p of maidParams) v[p.key] = overrides[p.key] ?? p.default;
  return v;
}

function create(overrides?: Params): Theme {
  const v = values(overrides);
  const s = (k: string) => String(v[k]);
  const n = (k: string) => Number(v[k]);
  const fontFamily = fonts[s('font')] ?? fonts['Open Sans'];
  const sw = `${n('strokeWidth')}px`;

  return {
    name: 'maid',
    radius: n('radius'),
    curve: s('curve'),
    layout: { padding: n('padding'), nodeSpacing: n('nodeSpacing'), rankSpacing: n('rankSpacing') },
    themeVariables: {
      fontFamily,
      fontSize: `${n('fontSize')}px`,
      background: '#ffffff',
      primaryColor: s('nodeFill'),
      primaryBorderColor: s('nodeStroke'),
      primaryTextColor: s('textColor'),
      secondaryColor: s('decisionFill'),
      tertiaryColor: s('clusterFill'),
      lineColor: s('lineColor'),
      textColor: s('textColor'),
      clusterBkg: s('clusterFill'),
      clusterBorder: s('clusterStroke'),
      edgeLabelBackground: '#ffffff',
    },
    css: `
    .node rect.label-container, .node polygon, .node circle, .node ellipse, .node .label-container path {
      fill: ${s('nodeFill')}; stroke: ${s('nodeStroke')}; stroke-width: ${sw};
    }
    .node.pm-decision polygon { fill: ${s('decisionFill')}; stroke: ${s('decisionStroke')}; }
    .node.pm-terminal rect.label-container, .node.pm-terminal circle, .node.pm-terminal ellipse, .node.pm-terminal .label-container path {
      fill: ${s('terminalFill')}; stroke: ${s('terminalStroke')};
    }
    .node .label, .node .nodeLabel, .node .label text, .node .label span { color: ${s('textColor')}; }
    .edgePaths path, .flowchart-link { stroke: ${s('lineColor')}; stroke-width: ${sw}; }
    .marker { fill: ${s('lineColor')}; stroke: ${s('lineColor')}; }
    .edgeLabel, .edgeLabel p, .edgeLabel span { background-color: #ffffff; color: ${s('textColor')}; font-size: ${n('edgeFontSize')}px; }
    .edgeLabel rect { fill: #ffffff; opacity: 1; }
    .labelBkg { background-color: #ffffff; padding: 2px 6px; }
    .cluster rect { fill: ${s('clusterFill')}; stroke: ${s('clusterStroke')}; stroke-width: ${sw}; rx: ${n('radius')}px; ry: ${n('radius')}px; }
    .cluster .nodeLabel, .cluster-label .nodeLabel, .cluster text { color: ${s('lineColor')}; font-size: ${Math.round(n('fontSize') * 0.78)}px; font-weight: 600; letter-spacing: 0.02em; }
    /* Per-shape label sizing: mermaid measures these, so shape and edges follow. */
    .pmTerminal .nodeLabel { display: inline-block; padding: 10px 14px; min-width: 76px; }
    .pmDecision .nodeLabel { display: inline-block; }
  `,
  };
}

export const maid: ThemeDef = { name: 'maid', params: maidParams, create };
