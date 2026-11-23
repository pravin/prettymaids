import type { Theme } from '../types.js';

const font = `'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`;

// Flat, Lucidchart-like: solid pastel fills, thin darker borders, small radius, elbow connectors.
export const maid: Theme = {
  name: 'maid',
  radius: 4,
  curve: 'step',
  themeVariables: {
    fontFamily: font,
    fontSize: '18px',
    background: '#ffffff',
    primaryColor: '#dcebfa',
    primaryBorderColor: '#3b82c4',
    primaryTextColor: '#1f2933',
    secondaryColor: '#fff1cc',
    tertiaryColor: '#f5f7fa',
    lineColor: '#5a6472',
    textColor: '#1f2933',
    clusterBkg: '#f5f7fa',
    clusterBorder: '#c9d1db',
    edgeLabelBackground: '#ffffff',
  },
  css: `
    .node rect.label-container, .node polygon, .node circle, .node ellipse, .node .label-container path {
      fill: #dcebfa; stroke: #3b82c4; stroke-width: 1.5px;
    }
    .node.pm-decision polygon { fill: #fff1cc; stroke: #e0a526; }
    .node.pm-terminal rect.label-container, .node.pm-terminal circle, .node.pm-terminal ellipse, .node.pm-terminal .label-container path {
      fill: #d9f2e0; stroke: #46a56a;
    }
    .node .label, .node .nodeLabel, .node .label text, .node .label span { color: #1f2933; }
    .edgePaths path, .flowchart-link { stroke: #5a6472; stroke-width: 1.5px; }
    .marker { fill: #5a6472; stroke: #5a6472; }
    .edgeLabel, .edgeLabel p, .edgeLabel span { background-color: #ffffff; color: #3e4754; font-size: 15px; }
    .edgeLabel rect { fill: #ffffff; opacity: 1; }
    .labelBkg { background-color: #ffffff; padding: 2px 6px; }
    .cluster rect { fill: #f5f7fa; stroke: #c9d1db; stroke-width: 1.5px; rx: 4px; ry: 4px; }
    .cluster .nodeLabel, .cluster-label .nodeLabel, .cluster text { color: #5a6472; font-size: 14px; font-weight: 600; letter-spacing: 0.02em; }
    /* Per-shape label sizing: mermaid measures these, so shape and edges follow. */
    .pmTerminal .nodeLabel { display: inline-block; padding: 10px 14px; min-width: 76px; }
    .pmDecision .nodeLabel { display: inline-block; }
  `,
};
