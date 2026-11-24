import type { Params, Theme, ThemeDef } from '../types.js';
import { lucid, maid, maidDark } from './maid.js';

export const themes: Record<string, ThemeDef> = { maid, 'maid-dark': maidDark, lucid };
export const defaultTheme = 'maid';

/** Builds a theme by name; `overrides` replace individual parameter defaults. */
export function getTheme(name: string, overrides?: Params): Theme {
  const def = themes[name];
  if (!def) throw new Error(`Unknown theme "${name}". Available: ${Object.keys(themes).join(', ')}`);
  return def.create(overrides);
}
