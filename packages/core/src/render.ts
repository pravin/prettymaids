import { config } from './config.js';
import { postprocess } from './postprocess.js';
import { defaultTheme, getTheme } from './themes/index.js';
import type { Params } from './types.js';

export interface RenderOptions {
  theme?: string;
  /** Overrides for the theme's parameters (see `themes[name].params`). */
  params?: Params;
  /** The mermaid instance. Defaults to `globalThis.mermaid`. */
  mermaid?: any;
}

let counter = 0;

async function renderSvg(mermaid: any, source: string): Promise<string> {
  const { svg } = await mermaid.render(`pm-${Date.now()}-${counter++}`, source);
  return svg;
}

/**
 * Mermaid sizes a node from its label plus a shape-specific padding, so pills and
 * diamonds come out smaller or larger than boxes. After a first render we know which
 * nodes are which; this appends mermaid `class` statements so the theme CSS can size
 * those labels (the CSS applies while mermaid measures, so layout and edges stay correct).
 */
function withShapeClasses(source: string, svg: string, color: string): string {
  if (!/^\s*(flowchart|graph)\b/m.test(source)) return source;
  const probe = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
  postprocess(probe, getTheme(defaultTheme));
  const ids = (cls: string) =>
    Array.from(probe.querySelectorAll(`g.node.${cls}`))
      .map((n) => /flowchart-(.+)-\d+$/.exec(n.getAttribute('id') ?? '')?.[1])
      .filter((id): id is string => !!id);
  const terminals = ids('pm-terminal');
  const decisions = ids('pm-decision');
  let extra = '';
  if (terminals.length) extra += `\nclassDef pmTerminal color:${color}\nclass ${terminals.join(',')} pmTerminal`;
  if (decisions.length) extra += `\nclassDef pmDecision color:${color}\nclass ${decisions.join(',')} pmDecision`;
  return extra ? `${source.trimEnd()}\n${extra}\n` : source;
}

/** Renders mermaid source to a prettified SVG string. Needs a DOM (browser). */
export async function render(source: string, opts: RenderOptions = {}): Promise<string> {
  const mermaid = opts.mermaid ?? (globalThis as any).mermaid;
  if (!mermaid) throw new Error('prettymaids: pass `mermaid` in options or load it globally.');
  const name = opts.theme ?? defaultTheme;
  const theme = getTheme(name, opts.params);
  mermaid.initialize(config(name, opts.params));
  let svg = await renderSvg(mermaid, source);
  const sized = withShapeClasses(source, svg, String(theme.themeVariables.primaryTextColor));
  if (sized !== source) svg = await renderSvg(mermaid, sized);
  const root = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
  postprocess(root, theme);
  return new XMLSerializer().serializeToString(root);
}
