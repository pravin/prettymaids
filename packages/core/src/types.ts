export interface Gradients {
  nodeFrom: string;
  nodeTo: string;
  decisionFrom: string;
  decisionTo: string;
  terminalFrom: string;
  terminalTo: string;
  shadow: string;
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
  /** Corner radius applied to rectangular nodes. */
  radius: number;
  /** Mermaid flowchart edge curve (`basis`, `linear`, `step`, ...). */
  curve?: string;
  /** Mermaid flowchart layout spacing, in px. */
  layout: { padding: number; nodeSpacing: number; rankSpacing: number };
  /** If set, the post-processor adds gradients (`pm-node`, `pm-decision`, `pm-terminal`) and a `pm-shadow` filter. */
  gradients?: Gradients;
}

export interface ThemeDef {
  name: string;
  params: ParamSpec[];
  create(overrides?: Params): Theme;
}
