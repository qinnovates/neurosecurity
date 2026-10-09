# Browser evidence checklist

What the post-build checks cannot see is what a page does when it runs. This run shows it in a real browser. It is evidence attached to a pull request, not a CI gate. No screenshots are committed.

## Before either run

1. `npm run build && npm run check:post-build`
2. Serve the production build on this machine: `npx astro preview --host 127.0.0.1 --port 4399`. Stop it afterwards with `npx astro preview stop`.
3. Test the build, never `npm run dev`: `ToolLayout` applies the content security policy to built pages only.

## Scripted run (preferred)

Playwright is not a dependency of this repository. Point `PLAYWRIGHT_MODULE` at the directory of an installed `playwright` package.

```sh
node src/scripts/browser-evidence/run-browser-evidence.mjs --base-url http://127.0.0.1:4399 --out <directory> --page /atlas/model/
```

| Option | Use |
|---|---|
| `--page <path>` | The page to open. Default `/atlas/model/`. A later page is the same command with another path. |
| `--press <selector>` and `--wait-for <selector>` | Press one control, then wait for an element, and record what was requested only after the press. |
| `--forbid-request <pattern>` | Fail if any request URL matches. Repeatable. Use it to show a lazy chunk or an asset folder is not fetched. |
| `--reduced-motion` | Emulate `prefers-reduced-motion: reduce`. |
| `--disable-webgl` | Start the browser with WebGL off. |

It writes `evidence.json` and screenshots to `--out`, and exits 1 on a request to another origin, a policy violation, a page error or a forbidden request.

## Manual run with the `qstack-browse` skill (fallback)

Known limits of that tool on a Mac: its headless browser has no WebGL, so it can show the no-WebGL path but cannot render a scene; screenshots must be saved under `/tmp` or the working directory; it keeps a log in a `.gstack/` folder of the working directory.

| Step | Command | Record |
|---|---|---|
| Clear the logs | `$B console --clear` then `$B network --clear` | |
| Open the page | `$B goto http://127.0.0.1:4399/atlas/model/` then `$B wait --networkidle` | |
| Requests on load | `$B network` | Every URL starts with the local origin. None is a chunk or asset that should load later. |
| Policy | `$B js "document.querySelector('meta[http-equiv]').content"` | Equals `ALLOWED_CSP_SOURCES` in `check-model-page.mjs`. |
| Console | `$B console` | No line containing "Content Security Policy". No error. |
| Screenshot | `$B screenshot /tmp/<name>.png` | |
| After an interaction | `$B click <selector>`, `$B wait <selector>`, then `$B network` and `$B console` again | Only the expected requests were added. |
| Finish | `$B stop` | If it reports it cannot connect, end the `browse` server process by its process id. |

## What to state in the pull request

- The browser and version, and whether WebGL was available.
- The request list on load, and after each interaction.
- Policy violations seen, with their text, or "none".
- What could not be tested.

## Pages

| Page | Added by | Extra steps |
|---|---|---|
| `/atlas/model/` | TARA Lab | None. On load the default mode's chunk is requested by a dynamic import; that is expected and is not in the first-load budget. |
