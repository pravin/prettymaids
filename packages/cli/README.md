# prettymaids-cli

Render [Mermaid](https://mermaid.js.org) diagrams as pretty SVG or PNG from the command line, using the [prettymaids](https://github.com/pravin/prettymaids) themes.

```sh
npx prettymaids-cli diagram.mmd -o diagram.png               # PNG at 2x
npx prettymaids-cli diagram.mmd -t maid-dark -o diagram.svg  # dark SVG
cat diagram.mmd | npx prettymaids-cli -p fontSize=20 > out.svg
npx prettymaids-cli --list-themes                            # every parameter
```

Installing it provides the `prettymaids` command. It drives headless Chrome (found automatically, or set `CHROME_PATH`).

Gallery, options and docs: **https://github.com/pravin/prettymaids**
