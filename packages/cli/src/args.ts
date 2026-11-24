import { parseArgs } from 'node:util';
import { defaultTheme, themes, type Params } from 'prettymaids';

export interface CliOptions {
  input?: string;
  output?: string;
  format: 'svg' | 'png';
  theme: string;
  params: Params;
  scale: number;
  bg?: string;
  help: boolean;
  version: boolean;
  listThemes: boolean;
}

export const HELP = `prettymaids - render Mermaid diagrams as pretty SVG/PNG

Usage:
  prettymaids [input.mmd] [options]
  cat diagram.mmd | prettymaids -o diagram.png

Options:
  -o, --output <file>    Output file; format from extension (.svg or .png). Default: SVG to stdout
  -t, --theme <name>     Theme (default: ${defaultTheme}). See --list-themes
  -p, --param <k=v>      Override a theme parameter (repeatable), e.g. -p fontSize=20 -p connector=curved
      --bg <colour>      Background colour, or "transparent". PNG defaults to white
      --scale <n>        PNG pixel scale (default: 2)
      --list-themes      List themes and their parameters
  -h, --help             Show this help
  -v, --version          Show version

Needs Google Chrome/Chromium (set CHROME_PATH to override the location).`;

export class UsageError extends Error {}

/** Parses argv (without node/script) into options. Throws UsageError on bad input. */
export function parseCli(argv: string[]): CliOptions {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        output: { type: 'string', short: 'o' },
        theme: { type: 'string', short: 't' },
        param: { type: 'string', short: 'p', multiple: true },
        bg: { type: 'string' },
        scale: { type: 'string' },
        'list-themes': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    });
  } catch (e) {
    throw new UsageError((e as Error).message);
  }
  const { values, positionals } = parsed;
  if (positionals.length > 1) throw new UsageError(`Expected at most one input file, got ${positionals.length}`);

  const theme = values.theme ?? defaultTheme;
  const def = themes[theme];
  if (!def && !values['list-themes'] && !values.help && !values.version) {
    throw new UsageError(`Unknown theme "${theme}". Available: ${Object.keys(themes).join(', ')}`);
  }

  const params: Params = {};
  for (const kv of values.param ?? []) {
    const eq = kv.indexOf('=');
    if (eq < 1) throw new UsageError(`Invalid --param "${kv}" (expected key=value)`);
    const key = kv.slice(0, eq);
    const raw = kv.slice(eq + 1);
    const spec = def?.params.find((p) => p.key === key);
    if (def && !spec) {
      throw new UsageError(`Unknown parameter "${key}" for theme "${theme}". Available: ${def.params.map((p) => p.key).join(', ')}`);
    }
    if (spec?.kind === 'number') {
      const n = Number(raw);
      if (raw.trim() === '' || Number.isNaN(n)) throw new UsageError(`Parameter "${key}" needs a number, got "${raw}"`);
      params[key] = n;
    } else if (spec?.kind === 'choice' && !spec.choices?.includes(raw)) {
      throw new UsageError(`Parameter "${key}" must be one of: ${spec.choices?.join(', ')}`);
    } else {
      params[key] = raw;
    }
  }

  const scale = values.scale === undefined ? 2 : Number(values.scale);
  if (Number.isNaN(scale) || scale <= 0 || scale > 8) throw new UsageError(`--scale must be a number in (0, 8], got "${values.scale}"`);

  const output = values.output;
  let format: 'svg' | 'png' = 'svg';
  if (output) {
    const ext = output.toLowerCase().split('.').pop();
    if (ext === 'png') format = 'png';
    else if (ext !== 'svg') throw new UsageError(`Unsupported output extension ".${ext}" (use .svg or .png)`);
  }

  return {
    input: positionals[0],
    output,
    format,
    theme,
    params,
    scale,
    bg: values.bg,
    help: !!values.help,
    version: !!values.version,
    listThemes: !!values['list-themes'],
  };
}
