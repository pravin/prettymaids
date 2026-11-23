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
    flowchart: { curve: theme.curve ?? 'basis', padding: 22, nodeSpacing: 70, rankSpacing: 80, htmlLabels: true, wrappingWidth: 240,
      subGraphTitleMargin: { top: 12, bottom: 20 } },
  };
}
