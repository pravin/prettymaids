export interface Gradients {
  nodeFrom: string;
  nodeTo: string;
  decisionFrom: string;
  decisionTo: string;
  terminalFrom: string;
  terminalTo: string;
  shadow: string;
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
  /** If set, the post-processor adds gradients (`pm-node`, `pm-decision`, `pm-terminal`) and a `pm-shadow` filter. */
  gradients?: Gradients;
}
