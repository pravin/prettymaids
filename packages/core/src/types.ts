export interface Shadow {
  color: string;
  /** Stacked soft shadows, tight first. */
  layers: { dy: number; blur: number; opacity: number }[];
}

export type ParamValue = string | number;
export type Params = Record<string, ParamValue>;

/** Describes one tunable theme parameter; the playground builds its controls from these. */
export interface ParamSpec {
  key: string;
  label: string;
  group: string;
  kind: 'number' | 'color' | 'choice';
  default: ParamValue;
  min?: number;
  max?: number;
  step?: number;
  choices?: string[];
}

export interface Theme {
  name: string;
  /** Mermaid `base` theme variables. */
  themeVariables: Record<string, string | boolean>;
  /** CSS injected into the diagram via mermaid's `themeCSS`. */
  css: string;
  /** If set, the post-processor paints this colour behind the diagram (otherwise the SVG is transparent). */
  background?: string;
  /** Corner radius applied to rectangular nodes. */
  radius: number;
  /** Mermaid flowchart edge curve (`basis`, `linear`, `step`). Only honoured by the dagre layout. */
  curve?: string;
  /** Mermaid layout engine. Unset keeps mermaid's default (orthogonal, rounded connectors). */
  layoutEngine?: string;
  /** Mermaid flowchart layout spacing, in px. */
  layout: { padding: number; nodeSpacing: number; rankSpacing: number };
  /** Extra mermaid config merged into `config()` (per-diagram sizing: sequence, gantt, gitGraph, ...). */
  diagramConfig?: Record<string, unknown>;
  /** If set, the post-processor defines a `pm-shadow` filter that the theme CSS applies to nodes. */
  shadow?: Shadow;
  /** If set, draws a dot-grid canvas behind the diagram. */
  dots?: { color: string; spacing: number };
  /** Donut hole size as a fraction of the pie radius (0 < x < 1). Unset keeps a full pie. */
  donut?: number;
  /** XMind-style mindmaps: curved, tapering coloured branches and lighter sub-topics. */
  organicMindmap?: boolean;
}

export interface ThemeDef {
  name: string;
  params: ParamSpec[];
  create(overrides?: Params): Theme;
}
