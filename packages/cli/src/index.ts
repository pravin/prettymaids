import { readFile, writeFile } from 'node:fs/promises';
import { themes } from 'prettymaids';
import { HELP, parseCli, UsageError, type CliOptions } from './args.js';
import { renderDiagram } from './render.js';

const VERSION = '0.0.1';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

function listThemes(): string {
  return Object.values(themes)
    .map((t) => {
      const rows = t.params.map((p) => {
        const range = p.kind === 'number' ? ` (${p.min}-${p.max})` : p.kind === 'choice' ? ` (${p.choices?.join('|')})` : '';
        return `    ${p.key.padEnd(16)} ${String(p.default).padEnd(10)} ${p.label}${range}`;
      });
      return `${t.name}\n${rows.join('\n')}`;
    })
    .join('\n\n');
}

/** Applies --bg: a colour paints the theme background; "transparent" disables it. */
function withBackground(o: CliOptions): CliOptions {
  if (!o.bg) return o;
  const params = { ...o.params };
  if (o.bg === 'transparent') params.paintBackground = 'transparent';
  else {
    params.paintBackground = 'solid';
    params.background = o.bg;
  }
  return { ...o, params };
}

// A closed pipe (e.g. `prettymaids x.mmd | head`) is not an error.
process.stdout.on('error', (e: NodeJS.ErrnoException) => {
  if (e.code === 'EPIPE') process.exit(0);
  throw e;
});

async function main(): Promise<void> {
  const raw = parseCli(process.argv.slice(2));
  if (raw.help) return void console.log(HELP);
  if (raw.version) return void console.log(VERSION);
  if (raw.listThemes) return void console.log(listThemes());
  const o = withBackground(raw);

  let source: string;
  if (o.input && o.input !== '-') source = await readFile(o.input, 'utf8');
  else if (!process.stdin.isTTY) source = await readStdin();
  else throw new UsageError('No input. Pass a file, or pipe Mermaid source on stdin (see --help).');
  if (!source.trim()) throw new UsageError('Input is empty.');

  const out = await renderDiagram({
    source,
    theme: o.theme,
    params: o.params,
    format: o.format,
    scale: o.scale,
    bg: o.bg,
  });
  if (o.output) await writeFile(o.output, out);
  else if (o.format === 'svg') process.stdout.write(out);
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`prettymaids: ${msg}`);
  if (e instanceof UsageError) console.error('Run with --help for usage.');
  process.exit(e instanceof UsageError ? 2 : 1);
});
