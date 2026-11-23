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
    look: 'classic',
    themeVariables: theme.themeVariables,
    themeCSS: theme.css,
    fontFamily: theme.themeVariables.fontFamily,
    flowchart: { curve: theme.curve ?? 'basis', padding: 16, nodeSpacing: 50, rankSpacing: 55, htmlLabels: true },
  };
}
