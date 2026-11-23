import type { Theme } from '../types.js';
import { maid } from './maid.js';

export const themes: Record<string, Theme> = { maid };
export const defaultTheme = 'maid';

export function getTheme(name: string): Theme {
  const t = themes[name];
  if (!t) throw new Error(`Unknown theme "${name}". Available: ${Object.keys(themes).join(', ')}`);
  return t;
}
