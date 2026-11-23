import { defaultTheme, getTheme } from './themes/index.js';

/**
 * A plain mermaid config object. Pass it to `mermaid.initialize()` to get the
 * prettymaids look without any other prettymaids code (no SVG post-processing).
 */
export function config(themeName: string = defaultTheme): Record<string, unknown> {
  const theme = getTheme(themeName);
  return {
    startOnLoad: false,
    theme: 'base',
    themeVariables: theme.themeVariables,
    themeCSS: theme.css,
    fontFamily: theme.themeVariables.fontFamily,
    flowchart: { curve: 'basis', padding: 18, nodeSpacing: 55, rankSpacing: 60, htmlLabels: true },
  };
}
