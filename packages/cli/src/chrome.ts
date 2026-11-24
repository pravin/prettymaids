import { existsSync } from 'node:fs';

const CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

/** Finds a Chrome/Chromium binary; undefined lets puppeteer use its own downloaded browser. */
export function findChrome(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const fromEnv = env.CHROME_PATH ?? env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv) {
    if (!existsSync(fromEnv)) throw new Error(`CHROME_PATH points to a missing file: ${fromEnv}`);
    return fromEnv;
  }
  return CANDIDATES.find((p) => existsSync(p));
}
