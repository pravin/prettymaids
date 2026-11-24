/** Reads the natural size from the SVG's viewBox (rounded up). Falls back to 800x600. */
export function svgSize(svg: string): { w: number; h: number } {
  const vb = /viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"/.exec(svg);
  return { w: Math.ceil(Number(vb?.[1] ?? 800)), h: Math.ceil(Number(vb?.[2] ?? 600)) };
}

/**
 * Mermaid emits `width="100%"` plus a `max-width` style, which renders at an unpredictable size
 * outside a page. This pins width/height to the viewBox so the SVG is self-sized (files, <img>, canvas).
 */
export function withExplicitSize(svg: string): string {
  const { w, h } = svgSize(svg);
  return svg.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    const cleaned = attrs
      .replace(/\swidth="[^"]*"/, '')
      .replace(/\sheight="[^"]*"/, '')
      .replace(/\sstyle="[^"]*max-width:[^"]*"/, '');
    return `<svg width="${w}" height="${h}"${cleaned}>`;
  });
}
