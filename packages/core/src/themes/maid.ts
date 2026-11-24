import type { ParamSpec, Params, Theme, ThemeDef } from '../types.js';

const fonts: Record<string, string> = {
  Inter: `Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
  'Open Sans': `'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
  Helvetica: `'Helvetica Neue', Helvetica, Arial, sans-serif`,
  System: `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`,
  Mono: `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`,
};

// `rounded` keeps mermaid's default layout (orthogonal, rounded corners). The others switch to
// the dagre layout, the only one that honours the edge curve setting.
const connectors: Record<string, { layoutEngine?: string; curve?: string }> = {
  rounded: {},
  elbow: { layoutEngine: 'dagre', curve: 'step' },
  straight: { layoutEngine: 'dagre', curve: 'linear' },
  curved: { layoutEngine: 'dagre', curve: 'basis' },
};

const shadows: Record<string, number> = { none: 0, soft: 1, lifted: 1.8 };

const num = (key: string, label: string, group: string, def: number, min: number, max: number, step = 1): ParamSpec => ({
  key, label, group, kind: 'number', default: def, min, max, step,
});
const choice = (key: string, label: string, group: string, def: string, choices: string[]): ParamSpec => ({
  key, label, group, kind: 'choice', default: def, choices,
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

const luminance = (h: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Shared categorical palette (pie slices, mindmap branches, git branches).
const strong = ['#4f7cf0', '#33b27b', '#f2a93b', '#ef5f6b', '#8a6df0', '#25a6b8', '#f27d42', '#6b7a90', '#e55fa3', '#6670e8', '#8cc152', '#38a3e8'];

export const maidParams: ParamSpec[] = [
  choice('font', 'Font', 'Type', 'Inter', Object.keys(fonts)),
  num('fontSize', 'Node text', 'Type', 17, 11, 32),
  num('fontWeight', 'Label weight', 'Type', 500, 300, 700, 100),
  num('edgeFontSize', 'Edge label text', 'Type', 14, 9, 26),
  num('padding', 'Node padding', 'Spacing', 20, 6, 44),
  num('nodeSpacing', 'Node gap', 'Spacing', 64, 20, 140, 2),
  num('rankSpacing', 'Rank gap', 'Spacing', 76, 20, 160, 2),
  num('radius', 'Corner radius', 'Shape', 10, 0, 24),
  num('strokeWidth', 'Border weight', 'Shape', 1, 0.5, 4, 0.25),
  num('lineWidth', 'Connector weight', 'Shape', 1.5, 0.5, 4, 0.25),
  choice('connector', 'Connector style', 'Shape', 'rounded', Object.keys(connectors)),
  choice('shadow', 'Shadow', 'Effects', 'soft', Object.keys(shadows)),
  choice('edgeLabels', 'Edge labels', 'Effects', 'chip', ['chip', 'plain']),
  choice('pie', 'Pie charts', 'Effects', 'donut', ['donut', 'pie']),
  choice('mindmap', 'Mindmaps', 'Effects', 'organic', ['organic', 'plain']),
  choice('grid', 'Canvas grid', 'Effects', 'none', ['none', 'dots']),
  choice('paintBackground', 'Background', 'Colours', 'transparent', ['transparent', 'solid']),
  color('background', 'Background colour', '#ffffff'),
  color('nodeFill', 'Node fill', '#eef2ff'),
  color('nodeStroke', 'Node border', '#a9b8ec'),
  color('decisionFill', 'Decision fill', '#fff6dc'),
  color('decisionStroke', 'Decision border', '#ebc566'),
  color('terminalFill', 'Terminal fill', '#e4f6ec'),
  color('terminalStroke', 'Terminal border', '#86cfa6'),
  color('lineColor', 'Connector', '#7a8699'),
  color('textColor', 'Text', '#1c2433'),
  color('clusterFill', 'Container fill', '#f7f9fc'),
  color('clusterStroke', 'Container border', '#e0e5ee'),
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
  const fontFamily = fonts[s('font')] ?? fonts.Inter;
  const sw = `${n('strokeWidth')}px`;
  const lw = `${n('lineWidth')}px`;

  const fs = n('fontSize');
  const fw = n('fontWeight');
  const text = s('textColor');
  const line = s('lineColor');
  const bg = s('background');
  const dark = luminance(bg) < 0.5;
  const grey = mix(bg, line, 0.55);
  const faint = mix(bg, line, 0.45);
  const grid = mix(bg, line, 0.15);
  const muted = mix(bg, text, 0.55);
  const hair = s('clusterStroke');
  const chip = s('edgeLabels') === 'chip';
  const shadowK = shadows[s('shadow')] ?? 0;
  const donut = s('pie') === 'donut';
  const organic = s('mindmap') === 'organic';
  const tint = (c: string) => mix(bg, c, dark ? 0.26 : 0.16);
  const ink = (c: string) => mix(c, dark ? '#ffffff' : '#000000', 0.4);
  const indexed = (prefix: string, fn: (i: number) => string, count = 12) =>
    Object.fromEntries(Array.from({ length: count }, (_, i) => [`${prefix}${i}`, fn(i)]));

  const css = `
    .node rect.label-container, .node polygon, .node circle, .node ellipse, .node .label-container path {
      fill: ${s('nodeFill')}; stroke: ${s('nodeStroke')}; stroke-width: ${sw};
    }
    .node.pm-decision polygon { fill: ${s('decisionFill')}; stroke: ${s('decisionStroke')}; }
    .node.pm-terminal rect.label-container, .node.pm-terminal circle, .node.pm-terminal ellipse, .node.pm-terminal .label-container path {
      fill: ${s('terminalFill')}; stroke: ${s('terminalStroke')};
    }
    .node .label, .node .nodeLabel, .node .label text, .node .label span { color: ${text}; font-weight: ${fw}; }
    ${shadowK ? `.node:not(.mindmap-node), rect.actor, .classGroup, .entityBox { filter: url(#pm-shadow); }` : ''}
    .edgePaths path, .flowchart-link { stroke: ${line}; stroke-width: ${lw}; }
    .marker { fill: ${line}; stroke: ${line}; }
    .edgeLabel, .edgeLabel p, .edgeLabel span { background-color: ${chip ? 'transparent' : bg}; color: ${chip ? muted : text}; font-size: ${n('edgeFontSize')}px; ${chip ? 'font-weight: 500;' : ''} }
    .edgeLabel rect { fill: ${bg}; opacity: 1; }
    .labelBkg { background-color: ${bg}; ${chip ? `border: 1px solid ${hair}; border-radius: 999px; padding: 2px 10px;` : 'padding: 2px 6px;'} }
    .cluster rect { fill: ${s('clusterFill')}; stroke: ${hair}; stroke-width: ${sw}; rx: ${Math.round(n('radius') * 1.2)}px; ry: ${Math.round(n('radius') * 1.2)}px; }
    .cluster .nodeLabel, .cluster-label .nodeLabel, .cluster text { color: ${muted}; font-size: ${Math.round(fs * 0.72)}px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; }
    /* Per-shape label sizing: mermaid measures these, so shape and edges follow. */
    .pmTerminal .nodeLabel { display: inline-block; padding: 10px 14px; min-width: 76px; }
    .pmDecision .nodeLabel { display: inline-block; }
    /* sequence */
    .actor-line { stroke: ${faint}; stroke-width: ${lw}; stroke-dasharray: 4 5; }
    .loopLine { stroke: ${grey}; stroke-width: ${lw}; stroke-dasharray: 5 4; }
    .labelBox { stroke: ${grey}; }
    rect.actor { rx: ${n('radius')}px; ry: ${n('radius')}px; stroke-width: ${sw}; }
    .actor, text.actor > tspan { font-weight: ${fw}; }
    .messageLine0, .messageLine1 { stroke-width: ${lw}; }
    .note { stroke-width: ${sw}; rx: ${Math.round(n('radius') * 0.6)}px; ry: ${Math.round(n('radius') * 0.6)}px; }
    /* class / er */
    .node .label-group .nodeLabel, .node .label-group p { font-weight: 700; }
    .classGroup line, .divider path { stroke: ${s('nodeStroke')}; stroke-width: ${sw}; }
    .relationshipLabelBox { fill: ${bg}; opacity: 1; }
    .relationshipLine { stroke: ${line}; stroke-width: ${lw}; }
    /* gantt */
    .grid .tick line { stroke: ${grid}; opacity: 1; }
    .grid path { stroke-width: 0; }
    .tick text { font-size: ${Math.round(fs * 0.72)}px; fill: ${muted}; }
    .titleText { font-weight: 600; fill: ${text}; }
    .section0, .section2 { fill: ${s('clusterFill')}; opacity: 1; }
    .section1, .section3 { fill: ${bg}; opacity: 1; }
    rect.task, rect.milestone { rx: ${Math.min(n('radius'), 8)}px; ry: ${Math.min(n('radius'), 8)}px; stroke-width: ${sw}; }
    /* pie */
    .pieTitleText { font-weight: 600; }
    .slice { font-weight: 600; }
    .pieOuterCircle { stroke: none; fill: none; }
    /* mindmap */
    .mindmap-node .label, .mindmap-node text, .mindmap-node span, .mindmap-node p { color: #ffffff; fill: #ffffff; font-weight: 600; }
    .mindmap-node.section-root circle, .mindmap-node.section-root rect, .mindmap-node.section-root path { fill: ${text}; stroke: ${text}; }
    .mindmap-node.section-root .label, .mindmap-node.section-root text, .mindmap-node.section-root span, .mindmap-node.section-root p { color: ${bg}; fill: ${bg}; font-size: ${Math.round(fs * 1.1)}px; }
    .edgePaths path.edge { stroke-width: 3px; stroke-linecap: round; }
    ${strong.map((c, i) => `.edgePaths path.section-edge-${i} { stroke: ${strong[(i + 1) % strong.length]}; }`).join(' ')}
    ${organic ? `
    .mindmap-node rect { rx: ${Math.round(n('radius') * 1.2)}px; ry: ${Math.round(n('radius') * 1.2)}px; }
    .edgePaths path.pm-b1 { stroke-width: 6px; } .edgePaths path.pm-b2 { stroke-width: 3.5px; } .edgePaths path.pm-b3 { stroke-width: 2.5px; }
    ${strong.map((c, i) => {
      const light = strong[(i + 1) % strong.length];
      return `.mindmap-node.section-${i}.pm-sub rect, .mindmap-node.section-${i}.pm-sub path { fill: ${tint(light)}; stroke: ${light}; stroke-width: 1.5px; }
    .mindmap-node.section-${i}.pm-sub .label, .mindmap-node.section-${i}.pm-sub text, .mindmap-node.section-${i}.pm-sub span, .mindmap-node.section-${i}.pm-sub p { color: ${ink(light)}; fill: ${ink(light)}; font-weight: 500; }`;
    }).join('\n    ')}` : ''}
  `;

  return {
    name,
    background: s('paintBackground') === 'solid' ? bg : undefined,
    shadow: shadowK
      ? {
          color: dark ? '#000000' : '#101828',
          layers: [
            { dy: 1, blur: 2, opacity: (dark ? 0.4 : 0.08) * shadowK },
            { dy: 6 * shadowK, blur: 14 * shadowK, opacity: (dark ? 0.35 : 0.09) * shadowK },
          ],
        }
      : undefined,
    dots: s('grid') === 'dots' ? { color: mix(bg, line, dark ? 0.3 : 0.28), spacing: 22 } : undefined,
    donut: donut ? 0.56 : undefined,
    organicMindmap: organic,
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
      pie: { textPosition: donut ? (1 + 0.56) / 2 : 0.65 },
      mindmap: { padding: 18, maxNodeWidth: 220 },
    },
    ...(connectors[s('connector')] ?? {}),
    layout: { padding: n('padding'), nodeSpacing: n('nodeSpacing'), rankSpacing: n('rankSpacing') },
    themeVariables: {
      fontFamily,
      fontSize: `${fs}px`,
      background: bg,
      primaryColor: s('nodeFill'),
      primaryBorderColor: s('nodeStroke'),
      primaryTextColor: text,
      secondaryColor: s('decisionFill'),
      tertiaryColor: s('clusterFill'),
      lineColor: line,
      textColor: text,
      clusterBkg: s('clusterFill'),
      clusterBorder: hair,
      edgeLabelBackground: bg,
      // sequence
      actorBkg: s('nodeFill'), actorBorder: s('nodeStroke'), actorTextColor: text, actorLineColor: faint,
      signalColor: line, signalTextColor: text, labelBoxBkgColor: s('clusterFill'), labelBoxBorderColor: grey,
      labelTextColor: text, loopTextColor: text, noteBkgColor: s('decisionFill'), noteBorderColor: s('decisionStroke'),
      noteTextColor: text, activationBkgColor: s('nodeFill'), activationBorderColor: s('nodeStroke'), sequenceNumberColor: '#ffffff',
      // class / state / er
      classText: text, stateBkg: s('nodeFill'), stateLabelColor: text, specialStateColor: line, transitionColor: line,
      transitionLabelColor: text, compositeBackground: bg, compositeTitleBackground: s('clusterFill'),
      innerEndBackground: line, rowOdd: bg, rowEven: s('clusterFill'), attributeBackgroundColorOdd: bg,
      attributeBackgroundColorEven: s('clusterFill'),
      // gantt
      sectionBkgColor: s('clusterFill'), altSectionBkgColor: bg, sectionBkgColor2: s('clusterFill'),
      gridColor: grid, taskBkgColor: mix(bg, strong[0], dark ? 0.3 : 0.2), taskBorderColor: mix(bg, strong[0], 0.7), taskTextColor: text,
      taskTextLightColor: text, taskTextDarkColor: text, taskTextOutsideColor: text,
      activeTaskBkgColor: mix(bg, strong[0], dark ? 0.55 : 0.4), activeTaskBorderColor: strong[0],
      doneTaskBkgColor: mix(bg, line, 0.18), doneTaskBorderColor: mix(bg, line, 0.5), critBkgColor: mix(bg, '#ef5f6b', 0.22),
      critBorderColor: '#ef5f6b', todayLineColor: '#ef5f6b', titleColor: text,
      // pie
      ...Object.fromEntries(strong.map((c, i) => [`pie${i + 1}`, c])),
      pieStrokeColor: bg, pieStrokeWidth: '3px', pieOuterStrokeWidth: '0px', pieOuterStrokeColor: bg,
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
    css,
  };
}

/** The modern default: hairline borders, soft shadow, chips, donuts, organic mindmaps. */
export const maid = makeMaid('maid');

/** The earlier flat, Lucidchart-like look: saturated 1.5px borders, no shadow, square-ish. */
export const lucid = makeMaid('lucid', {
  font: 'Open Sans', fontSize: 18, fontWeight: 400, edgeFontSize: 15, padding: 22, nodeSpacing: 70, rankSpacing: 80,
  radius: 4, strokeWidth: 1.5, lineWidth: 1.5, shadow: 'none', edgeLabels: 'plain', pie: 'pie', mindmap: 'plain',
  nodeFill: '#dcebfa', nodeStroke: '#3b82c4', decisionFill: '#fff1cc', decisionStroke: '#e0a526',
  terminalFill: '#d9f2e0', terminalStroke: '#46a56a', lineColor: '#5a6472', textColor: '#1f2933',
  clusterFill: '#f5f7fa', clusterStroke: '#c9d1db',
});

const darkColours: Params = {
  paintBackground: 'solid',
  background: '#12161f',
  nodeFill: '#1f2a44',
  nodeStroke: '#4d63a8',
  decisionFill: '#3a3320',
  decisionStroke: '#a8883a',
  terminalFill: '#183a2c',
  terminalStroke: '#3b8f67',
  lineColor: '#8b97ad',
  textColor: '#e7ecf5',
  clusterFill: '#171d2a',
  clusterStroke: '#2a3447',
};

export const maidDark = makeMaid('maid-dark', darkColours);
