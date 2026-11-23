import { config } from './config.js';
import { postprocess } from './postprocess.js';
import { defaultTheme, getTheme } from './themes/index.js';

export interface RenderOptions {
  theme?: string;
  /** The mermaid instance. Defaults to `globalThis.mermaid`. */
  mermaid?: any;
}

let counter = 0;

/** Renders mermaid source to a prettified SVG string. Needs a DOM (browser). */
export async function render(source: string, opts: RenderOptions = {}): Promise<string> {
  const mermaid = opts.mermaid ?? (globalThis as any).mermaid;
  if (!mermaid) throw new Error('prettymaids: pass `mermaid` in options or load it globally.');
  const name = opts.theme ?? defaultTheme;
  const theme = getTheme(name);
  mermaid.initialize(config(name));
  const { svg } = await mermaid.render(`pm-${Date.now()}-${counter++}`, source);
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  postprocess(root, theme);
  return new XMLSerializer().serializeToString(root);
}
