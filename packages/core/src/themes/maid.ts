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

/** Mixes two #rrggbb colours; t=0 gives a, t=1 gives b. */
function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

// Shared categorical palette (pie slices, mindmap branches, git branches): strong fill + light tint.
const strong = ['#3b82c4', '#46a56a', '#e0a526', '#d9534f', '#8b6fd0', '#2fa7a0', '#e67e3c', '#6b7a8c', '#d6609b', '#5468c9', '#8ab33a', '#35a3d6'];

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
  { key: 'paintBackground', label: 'Background', group: 'Colours', kind: 'choice', default: 'transparent', choices: ['transparent', 'solid'] },
  color('background', 'Background colour', '#ffffff'),
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

function makeMaid(name: string, defaults: Params = {}): ThemeDef {
  const params = maidParams.map((p) => ({ ...p, default: defaults[p.key] ?? p.default }));
  return { name, params, create: (overrides) => create(name, params, overrides) };
}

function create(name: string, params: ParamSpec[], overrides: Params = {}): Theme {
  const v: Params = {};
  for (const p of params) v[p.key] = overrides[p.key] ?? p.default;
  const s = (k: string) => String(v[k]);
  const n = (k: string) => Number(v[k]);
  const fontFamily = fonts[s('font')] ?? fonts['Open Sans'];
  const sw = `${n('strokeWidth')}px`;

  const fs = n('fontSize');
  const text = s('textColor');
  const line = s('lineColor');
  const bg = s('background');
  const grey = mix(bg, line, 0.55);
  const faint = mix(bg, line, 0.45);
  const grid = mix(bg, line, 0.15);
  const indexed = (prefix: string, fn: (i: number) => string, count = 12) =>
    Object.fromEntries(Array.from({ length: count }, (_, i) => [`${prefix}${i}`, fn(i)]));

  return {
    name,
    background: s('paintBackground') === 'solid' ? bg : undefined,
    radius: n('radius'),
    diagramConfig: {
      sequence: {
        actorMargin: 70, width: 170, height: 56, boxMargin: 14, boxTextMargin: 8, noteMargin: 14, messageMargin: 46,
        diagramMarginX: 30, diagramMarginY: 20, mirrorActors: true, useMaxWidth: true,
        actorFontSize: fs, messageFontSize: Math.round(fs * 0.9), noteFontSize: Math.round(fs * 0.85),
        actorFontFamily: fontFamily, messageFontFamily: fontFamily, noteFontFamily: fontFamily,
      },
      gantt: {
        fontSize: Math.round(fs * 0.8), sectionFontSize: Math.round(fs * 0.85), barHeight: 30, barGap: 8,
        topPadding: 64, leftPadding: 100, gridLineStartPadding: 40, numberSectionStyles: 2, useMaxWidth: true,
      },
      gitGraph: { rotateCommitLabel: false, showCommitLabel: true, mainBranchName: 'main' },
      pie: { textPosition: 0.65 },
      mindmap: { padding: 18, maxNodeWidth: 220 },
    },
    curve: s('curve'),
    layout: { padding: n('padding'), nodeSpacing: n('nodeSpacing'), rankSpacing: n('rankSpacing') },
    themeVariables: {
      fontFamily,
      fontSize: `${n('fontSize')}px`,
      background: bg,
      primaryColor: s('nodeFill'),
      primaryBorderColor: s('nodeStroke'),
      primaryTextColor: s('textColor'),
      secondaryColor: s('decisionFill'),
      tertiaryColor: s('clusterFill'),
      lineColor: s('lineColor'),
      textColor: s('textColor'),
      clusterBkg: s('clusterFill'),
      clusterBorder: s('clusterStroke'),
      edgeLabelBackground: bg,
      // sequence
      actorBkg: s('nodeFill'), actorBorder: s('nodeStroke'), actorTextColor: text, actorLineColor: faint,
      signalColor: line, signalTextColor: text, labelBoxBkgColor: s('clusterFill'), labelBoxBorderColor: grey,
      labelTextColor: text, loopTextColor: text, noteBkgColor: s('decisionFill'), noteBorderColor: s('decisionStroke'),
      noteTextColor: text, activationBkgColor: s('nodeFill'), activationBorderColor: s('nodeStroke'), sequenceNumberColor: '#ffffff',
      // class / state / er
      classText: text, stateBkg: s('nodeFill'), stateLabelColor: text, specialStateColor: line, transitionColor: line,
      transitionLabelColor: text, compositeBackground: bg, compositeTitleBackground: s('clusterFill'),
      innerEndBackground: line, rowOdd: bg, rowEven: s('clusterFill'), attributeBackgroundColorOdd: bg, attributeBackgroundColorEven: s('clusterFill'),
      // gantt
      sectionBkgColor: s('clusterFill'), altSectionBkgColor: bg, sectionBkgColor2: s('clusterFill'),
      gridColor: grid, taskBkgColor: s('nodeFill'), taskBorderColor: s('nodeStroke'), taskTextColor: text,
      taskTextLightColor: text, taskTextDarkColor: text, taskTextOutsideColor: text,
      activeTaskBkgColor: mix(bg, s('nodeStroke'), 0.3), activeTaskBorderColor: s('nodeStroke'),
      doneTaskBkgColor: mix(bg, line, 0.15), doneTaskBorderColor: grey, critBkgColor: mix(bg, '#d9534f', 0.22), critBorderColor: '#d9534f',
      todayLineColor: '#d9534f', titleColor: text,
      // pie
      ...Object.fromEntries(strong.map((c, i) => [`pie${i + 1}`, c])),
      pieStrokeColor: bg, pieStrokeWidth: '2px', pieOuterStrokeWidth: '0px', pieOuterStrokeColor: bg,
      pieOpacity: '1', pieSectionTextColor: '#ffffff', pieLegendTextColor: text, pieTitleTextColor: text,
      pieTitleTextSize: `${Math.round(fs * 1.25)}px`, pieSectionTextSize: `${Math.round(fs * 0.85)}px`,
      pieLegendTextSize: `${Math.round(fs * 0.85)}px`,
      // mindmap / timeline
      ...indexed('cScale', (i) => strong[i]),
      ...indexed('cScaleLabel', () => '#ffffff'),
      ...indexed('cScalePeer', (i) => strong[i]),
      ...indexed('cScaleInv', (i) => strong[(i + 6) % 12]),
      // git graph
      ...indexed('git', (i) => strong[i % strong.length], 8),
      ...indexed('gitBranchLabel', () => '#ffffff', 8),
      commitLabelColor: text, commitLabelBackground: bg, commitLabelFontSize: `${Math.round(fs * 0.75)}px`,
      tagLabelColor: text, tagLabelBackground: s('nodeFill'), tagLabelBorder: s('nodeStroke'),
      tagLabelFontSize: `${Math.round(fs * 0.75)}px`,
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
    .edgeLabel, .edgeLabel p, .edgeLabel span { background-color: ${bg}; color: ${s('textColor')}; font-size: ${n('edgeFontSize')}px; }
    .edgeLabel rect { fill: ${bg}; opacity: 1; }
    .labelBkg { background-color: ${bg}; padding: 2px 6px; }
    .cluster rect { fill: ${s('clusterFill')}; stroke: ${s('clusterStroke')}; stroke-width: ${sw}; rx: ${n('radius')}px; ry: ${n('radius')}px; }
    .cluster .nodeLabel, .cluster-label .nodeLabel, .cluster text { color: ${s('lineColor')}; font-size: ${Math.round(n('fontSize') * 0.78)}px; font-weight: 600; letter-spacing: 0.02em; }
    /* Per-shape label sizing: mermaid measures these, so shape and edges follow. */
    .pmTerminal .nodeLabel { display: inline-block; padding: 10px 14px; min-width: 76px; }
    .pmDecision .nodeLabel { display: inline-block; }
    /* sequence */
    .actor-line { stroke: ${faint}; stroke-width: 1.5px; }
    .loopLine { stroke: ${grey}; stroke-width: 1.5px; stroke-dasharray: 5 4; }
    .labelBox { stroke: ${grey}; }
    .messageLine0, .messageLine1 { stroke-width: ${sw}; }
    .note { stroke-width: ${sw}; }
    /* class / er */
    .classGroup line, .divider path { stroke: ${s('nodeStroke')}; stroke-width: ${sw}; }
    .relationshipLabelBox { fill: ${bg}; opacity: 1; }
    .relationshipLine { stroke: ${line}; stroke-width: ${sw}; }
    /* gantt */
    .grid .tick line { stroke: ${grid}; opacity: 1; }
    .grid path { stroke-width: 0; }
    .tick text { font-size: ${Math.round(fs * 0.72)}px; fill: ${line}; }
    .titleText { font-weight: 600; fill: ${text}; }
    .section0, .section2 { fill: ${s('clusterFill')}; opacity: 1; }
    .section1, .section3 { fill: ${bg}; opacity: 1; }
    rect.task, rect.milestone { rx: ${Math.min(n('radius'), 8)}px; ry: ${Math.min(n('radius'), 8)}px; stroke-width: ${sw}; }
    /* pie */
    .pieTitleText { font-weight: 600; }
    .slice { font-weight: 600; }
    /* mindmap */
    .edgePaths path.edge { stroke-width: 3px; }
    ${strong.map((c, i) => `.edgePaths path.section-edge-${i} { stroke: ${strong[(i + 1) % strong.length]}; }`).join(' ')}
    .mindmap-node.section-root circle, .mindmap-node.section-root rect, .mindmap-node.section-root path { fill: ${text}; stroke: ${text}; }
    .mindmap-node.section-root .label, .mindmap-node.section-root span, .mindmap-node.section-root p { font-size: ${Math.round(fs * 1.1)}px; }
    .mindmap-node .label, .mindmap-node text, .mindmap-node span, .mindmap-node p { color: #ffffff; fill: #ffffff; font-weight: 600; }
    .mindmap-node.section-root .label, .mindmap-node.section-root text, .mindmap-node.section-root span, .mindmap-node.section-root p { color: ${bg}; fill: ${bg}; }
  `,
  };
}

export const maid = makeMaid('maid');

export const maidDark = makeMaid('maid-dark', {
  paintBackground: 'solid',
  background: '#1a2230',
  nodeFill: '#26405f',
  nodeStroke: '#6aa9ea',
  decisionFill: '#4d3f1c',
  decisionStroke: '#e6b23a',
  terminalFill: '#1e4433',
  terminalStroke: '#4cb87a',
  lineColor: '#9fb0c3',
  textColor: '#e8eef5',
  clusterFill: '#202b3a',
  clusterStroke: '#37465a',
});
