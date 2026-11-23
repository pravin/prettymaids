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

Status: the `maid` theme (flat, Lucidchart-like) covers flowcharts. Other diagram types, themes and the CLI are next.

## Layout

| Path | Purpose |
| --- | --- |
| `packages/core` | themes, SVG post-processor, `render()` |
| `packages/cli` | command-line renderer (puppeteer) |
| `apps/playground` | Vite playground |
| `examples` | sample `.mmd` per diagram type |
