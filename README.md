# prettymaids

Prettier [Mermaid](https://mermaid.js.org) diagrams. Wraps mermaid's parser and layout, then restyles the output with themes and SVG post-processing, so every diagram type keeps working.

Use it four ways:

- **Theme**: drop a config into `mermaid.initialize(...)`
- **Library**: `render(source, { theme })` returns SVG
- **CLI**: `prettymaids in.mmd -o out.svg`
- **Playground**: live editor in `apps/playground`

Status: scaffolding. See the plan for the build order.

## Layout

| Path | Purpose |
| --- | --- |
| `packages/core` | themes, SVG post-processor, `render()` |
| `packages/cli` | command-line renderer (puppeteer) |
| `apps/playground` | Vite playground |
| `examples` | sample `.mmd` per diagram type |
