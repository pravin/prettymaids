# prettymaids

Prettier [Mermaid](https://mermaid.js.org) diagrams: modern themes plus SVG post-processing, built around stock Mermaid.

```js
import mermaid from 'mermaid';
import { render, config } from 'prettymaids';

// Full look (needs a DOM): themes, shadows, donut pies, XMind-style mindmaps...
const svg = await render('flowchart LR\n  A --> B --> C', {
  theme: 'maid-dark',            // 'maid' | 'maid-dark' | 'maid-flat'
  params: { fontSize: 20, grid: 'dots' },
  mermaid,
});

// Or just the Mermaid theme config (no post-processing):
mermaid.initialize(config('maid'));
```

Peer dependency: `mermaid >= 11` (tested with 12.3). For Node and CI use the CLI, [`prettymaids-cli`](https://www.npmjs.com/package/prettymaids-cli).

Gallery, all parameters, playground and docs: **https://github.com/pravin/prettymaids**
