import { describe, expect, it } from 'vitest';
import { svgSize, withExplicitSize } from '../src/svg.js';

const sample = '<svg xmlns="http://www.w3.org/2000/svg" id="a" width="100%" style="max-width: 814px;" viewBox="4 4 813.2 960.4" role="x"><g/></svg>';

describe('svg sizing', () => {
  it('reads and rounds up the viewBox size', () => {
    expect(svgSize(sample)).toEqual({ w: 814, h: 961 });
  });
  it('falls back when there is no viewBox', () => {
    expect(svgSize('<svg/>')).toEqual({ w: 800, h: 600 });
  });
  it('pins width/height and drops the percentage width and max-width style', () => {
    const out = withExplicitSize(sample);
    expect(out).toContain('width="814" height="961"');
    expect(out).not.toContain('width="100%"');
    expect(out).not.toContain('max-width');
    expect(out).toContain('viewBox="4 4 813.2 960.4"');
    expect(out).toContain('id="a"');
  });
  it('is idempotent', () => {
    expect(withExplicitSize(withExplicitSize(sample))).toBe(withExplicitSize(sample));
  });
});
