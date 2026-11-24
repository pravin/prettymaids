import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { svgSize, withExplicitSize, type Params } from 'prettymaids';
import { findChrome } from './chrome.js';

export interface RenderJob {
  source: string;
  theme: string;
  params: Params;
  format: 'svg' | 'png';
  scale: number;
  /** Page background for PNG when the theme doesn't paint its own. */
  bg?: string;
}

const here = path.dirname(fileURLToPath(import.meta.url));

async function loadScripts(): Promise<{ mermaid: string; browser: string }> {
  const require = createRequire(import.meta.url);
  const mermaidPath = require.resolve('mermaid/dist/mermaid.min.js');
  return {
    mermaid: await readFile(mermaidPath, 'utf8'),
    browser: await readFile(path.join(here, 'browser.js'), 'utf8'),
  };
}

/** Renders one diagram. Returns SVG text or PNG bytes. */
export async function renderDiagram(job: RenderJob): Promise<string | Buffer> {
  const scripts = await loadScripts();
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body style="margin:0"><div id="out"></div></body></html>');
    await page.addScriptTag({ content: scripts.mermaid });
    await page.addScriptTag({ content: scripts.browser });

    let svg: string;
    try {
      svg = await page.evaluate(
        (source, theme, params) => (globalThis as any).prettymaids.render(source, { theme, params }) as Promise<string>,
        job.source,
        job.theme,
        job.params,
      );
    } catch (e) {
      // Drop mermaid's internal stack frames (`Parser.parse (<anonymous>:950:179)`).
      const msg = (e as Error).message.split('\n').filter((l) => !/^\s*[\w.]+ \(<anonymous>/.test(l)).join('\n');
      throw new Error(`Mermaid could not render the diagram:\n${msg}`);
    }
    const sized = withExplicitSize(svg);
    if (job.format === 'svg') return sized.endsWith('\n') ? sized : `${sized}\n`;

    const { w, h } = svgSize(sized);
    await page.setViewport({ width: w, height: h, deviceScaleFactor: job.scale });
    const transparent = job.bg === 'transparent';
    await page.evaluate(
      (markup, bg) => {
        document.body.style.background = bg;
        document.getElementById('out')!.innerHTML = markup;
      },
      sized,
      transparent ? 'transparent' : (job.bg ?? '#ffffff'),
    );
    const el = await page.$('#out svg');
    if (!el) throw new Error('Rendered SVG not found in page');
    return Buffer.from(await el.screenshot({ type: 'png', omitBackground: transparent }));
  } finally {
    await browser.close();
  }
}
