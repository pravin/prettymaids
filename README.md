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

## CLI

```sh
npm run build -w packages/cli
node packages/cli/dist/index.js examples/flowchart.mmd -o flowchart.png          # PNG (2x)
node packages/cli/dist/index.js examples/sequence.mmd -t maid-dark -o seq.svg    # dark SVG
cat diagram.mmd | node packages/cli/dist/index.js -p fontSize=20 -p connector=curved > out.svg
node packages/cli/dist/index.js --list-themes                                     # every tunable parameter
```

Output format comes from the extension (`.svg` or `.png`); with no `-o`, SVG goes to stdout. `--bg <colour|transparent>` sets the background (PNG defaults to white), `--scale <n>` sets PNG resolution. It drives headless Chrome (found automatically, or set `CHROME_PATH`). Text is drawn with fonts installed on the machine, so install Open Sans to match the playground.

Exit codes: 0 ok, 1 render/IO failure (e.g. mermaid syntax error), 2 bad usage.

## Themes

- `maid`: flat, Lucidchart-like, transparent background.
- `maid-dark`: the same on a dark navy background (painted into the SVG).

Connector style: `rounded` (default, mermaid's orthogonal layout), or `elbow` / `straight` / `curved`, which switch to the dagre layout.

## Status

The `maid` theme (flat, Lucidchart-like) covers flowchart, sequence, class, state, ER, gantt, pie, mindmap and git graph. Next: other diagram types (journey, timeline, quadrant, XY chart, ...) and publishing.

Known limits: mermaid builds decision diamonds as squares, so they cannot be made wide like Lucidchart's; the two-pass pill/diamond sizing only applies to `render()`, not the plain `config()` theme.

## Layout

| Path | Purpose |
| --- | --- |
| `packages/core` | themes, SVG post-processor, `render()` |
| `packages/cli` | command-line renderer (puppeteer) |
| `apps/playground` | Vite playground |
| `examples` | sample `.mmd` per diagram type |
