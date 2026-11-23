import type { Theme } from '../types.js';

const font = `Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;

export const maid: Theme = {
  name: 'maid',
  themeVariables: {
    fontFamily: font,
    fontSize: '15px',
    background: '#ffffff',
    primaryColor: '#eef2ff',
    primaryBorderColor: '#a5b4fc',
    primaryTextColor: '#1e1b4b',
    secondaryColor: '#fef3c7',
    tertiaryColor: '#f8fafc',
    lineColor: '#94a3b8',
    textColor: '#334155',
    clusterBkg: '#f8fafc',
    clusterBorder: '#cbd5e1',
    edgeLabelBackground: '#ffffff',
  },
  palette: {
    nodeFrom: '#ffffff',
    nodeTo: '#e0e7ff',
    decisionFrom: '#fffbeb',
    decisionTo: '#fde68a',
    terminalFrom: '#ecfdf5',
    terminalTo: '#a7f3d0',
    shadow: '#4338ca',
  },
  css: `
    .node rect.label-container, .node polygon, .node circle, .node ellipse, .node .label-container path {
      fill: url(#pm-node); stroke: #a5b4fc; stroke-width: 1.5px;
    }
    .node.pm-decision polygon { fill: url(#pm-decision); stroke: #f59e0b; }
    .node.pm-terminal rect.label-container, .node.pm-terminal circle, .node.pm-terminal ellipse, .node.pm-terminal .label-container path { fill: url(#pm-terminal); stroke: #34d399; }
    .node { filter: url(#pm-shadow); }
    .node .label, .node .nodeLabel, .node .label text, .node .label span { color: #1e1b4b; }
    .edgePaths path, .flowchart-link { stroke: #94a3b8; stroke-width: 1.75px; stroke-linecap: round; }
    .marker { fill: #94a3b8; stroke: #94a3b8; }
    .edgeLabel, .edgeLabel p, .edgeLabel span { background-color: #ffffff; color: #475569; font-size: 13px; }
    .edgeLabel rect { fill: #ffffff; opacity: 1; stroke: #e2e8f0; stroke-width: 1px; }
    .cluster rect { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 1.25px; stroke-dasharray: 5 4; }
    .cluster .nodeLabel, .cluster-label .nodeLabel, .cluster text { color: #64748b; font-weight: 600; }
  `,
};
