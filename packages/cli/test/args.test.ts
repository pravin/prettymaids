import { describe, expect, it } from 'vitest';
import { parseCli, UsageError } from '../src/args.js';

describe('parseCli', () => {
  it('defaults to svg, maid, scale 2', () => {
    const o = parseCli(['in.mmd']);
    expect(o).toMatchObject({ input: 'in.mmd', format: 'svg', theme: 'maid', scale: 2, params: {} });
  });
  it('infers png from the output extension', () => {
    expect(parseCli(['in.mmd', '-o', 'out.PNG']).format).toBe('png');
    expect(parseCli(['in.mmd', '-o', 'out.svg']).format).toBe('svg');
  });
  it('coerces params by their spec and accepts repeats', () => {
    const o = parseCli(['-p', 'fontSize=20', '-p', 'connector=curved', '-p', 'nodeFill=#ff0000']);
    expect(o.params).toEqual({ fontSize: 20, connector: 'curved', nodeFill: '#ff0000' });
  });
  it('validates params', () => {
    expect(() => parseCli(['-p', 'fontSize=big'])).toThrow(/needs a number/);
    expect(() => parseCli(['-p', 'connector=zigzag'])).toThrow(/must be one of/);
    expect(() => parseCli(['-p', 'nope=1'])).toThrow(/Unknown parameter/);
    expect(() => parseCli(['-p', 'novalue'])).toThrow(/key=value/);
  });
  it('rejects bad themes, extensions, scales and extra inputs', () => {
    expect(() => parseCli(['-t', 'nope'])).toThrow(UsageError);
    expect(() => parseCli(['-o', 'x.pdf'])).toThrow(/Unsupported output extension/);
    expect(() => parseCli(['--scale', '0'])).toThrow(/--scale/);
    expect(() => parseCli(['a.mmd', 'b.mmd'])).toThrow(/at most one input/);
    expect(() => parseCli(['--wat'])).toThrow(UsageError);
  });
  it('allows --help and --list-themes without further validation', () => {
    expect(parseCli(['-h']).help).toBe(true);
    expect(parseCli(['--list-themes']).listThemes).toBe(true);
  });
});
