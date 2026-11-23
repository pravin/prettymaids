# prettymaids

Prettier [Mermaid](https://mermaid.js.org) diagrams. Wraps mermaid's parser and layout, then restyles the output with themes and SVG post-processing, so every diagram type keeps working.

Use it four ways:

- **Theme**: drop a config into `mermaid.initialize(...)`
- **Library**: `render(source, { theme })` returns SVG
- **CLI**: `prettymaids in.mmd -o out.svg`
- **Playground**: live editor in `apps/playground`

## Try it

```sh
npm install
npm run dev          # playground at http://localhost:5173
node scripts/render-examples.mjs   # renders examples/*.mmd to examples/rendered/ (needs Google Chrome)
```

The playground has a live editor, an example picker, a theme picker (including stock mermaid for comparison), and SVG/PNG export.

The playground's right-hand panel tunes the theme live (type sizes, spacing, corner radius, line weight, connector style, colours). Settings persist in your browser; "Copy params" gives you the JSON to pass as `render(src, { params })`.

## Status

The `maid` theme (flat, Lucidchart-like) covers flowchart, sequence, class, state, ER, gantt, pie, mindmap and git graph. Dark theme, more themes, the CLI, and other diagram types (journey, timeline, quadrant, ...) are next.

Known limits: mermaid builds decision diamonds as squares, so they cannot be made wide like Lucidchart's; the two-pass pill/diamond sizing only applies to `render()`, not the plain `config()` theme.

## Layout

| Path | Purpose |
| --- | --- |
| `packages/core` | themes, SVG post-processor, `render()` |
| `packages/cli` | command-line renderer (puppeteer) |
| `apps/playground` | Vite playground |
| `examples` | sample `.mmd` per diagram type |
