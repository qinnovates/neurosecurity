# workbench: the TARA Lab shell

The frame every Lab screen sits in, and the device every mode shares.

- `WorkbenchShell` renders the top bar, the current mode's view tabs, the mode, and the standing line. It imports no mode directly: modes are listed in `mode-registry.ts` and loaded when opened.
- `view-registry.ts` lists every view of every mode. Adding a view is one entry there and a branch in its mode component, which receives the active `viewId`.
- `route.ts` parses the address. It holds only mode and view (`#model/chains`). Nothing about the device ever goes in the address.
- `FocusContext` holds the device in focus, the report computed from it, the engine data and the curated chains. Every mode reads the same device through `useFocus()`.
- `StandingLine` holds the statements that stay on screen in every mode. The text has one source and a test fails if a statement is removed. Do not shrink, shorten or hide it.
- `device-persistence.ts` saves the device to this browser only when the reader asks.

## Promises this page makes

- Nothing a reader enters leaves the browser. The page has a same-origin content security policy, and `npm run check:model-page` fails the build if the page references another origin.
- Named commercial devices show published specifications only. `src/lib/threat-model/lab-table-policy.ts` removes scoring tables and columns for every screen that reads the site database.
- TARA, NISS and QIF are proposed and not peer reviewed, and the interface says so on every screen.
