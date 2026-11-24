import { defaultTheme, getTheme } from './themes/index.js';
import type { Params } from './types.js';

/**
 * A plain mermaid config object. Pass it to `mermaid.initialize()` to get the
 * prettymaids look without any other prettymaids code (no SVG post-processing).
 */
export function config(themeName: string = defaultTheme, overrides?: Params): Record<string, unknown> {
  const theme = getTheme(themeName, overrides);
  return {
    startOnLoad: false,
    theme: 'base',
    look: 'classic',
    ...(theme.layoutEngine ? { layout: theme.layoutEngine } : {}),
    themeVariables: theme.themeVariables,
    themeCSS: theme.css,
    fontFamily: theme.themeVariables.fontFamily,
    ...theme.diagramConfig,
    flowchart: {
      ...(theme.curve ? { curve: theme.curve } : {}),
      ...theme.layout,
      htmlLabels: true,
      wrappingWidth: 240,
      subGraphTitleMargin: { top: 12, bottom: 20 },
    },
  };
}
