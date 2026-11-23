export interface Theme {
  name: string;
  /** Mermaid `base` theme variables. */
  themeVariables: Record<string, string | boolean>;
  /** CSS injected into the diagram via mermaid's `themeCSS`. */
  css: string;
  /** Colours used by the SVG post-processor (gradients, shadows). */
  palette: {
    nodeFrom: string;
    nodeTo: string;
    decisionFrom: string;
    decisionTo: string;
    terminalFrom: string;
    terminalTo: string;
    shadow: string;
  };
}
