# workbench: the TARA Lab shell

The frame every Lab screen sits in, the device every mode shares, and the reader's place in each view.

## The frame

- `WorkbenchShell` sets up the two things that outlive every mode: the view-state store and `FocusProvider`. `ShellFrame` draws the frame inside them. It imports no mode directly: modes are listed in `mode-registry.ts` and loaded when opened.
- The app fills the viewport. `.lab-shell-scroll` is the only thing that scrolls. The top bar and view tabs (`.lab-bars`) are sticky inside it, a translucent material with a solid fallback; the standing statements (`.lab-foot`) sit outside it, so nothing is ever under them. Print puts everything back in normal flow.
- `--lab-topbar-height` is the measured height of the sticky bars and `--lab-foot-height` the measured height of the footer. A screen that pins something under the bars uses `top: var(--lab-topbar-height)`. The shell also sets `--lab-drawer-top` and `--lab-drawer-bottom` from them for the kit's `Drawer`.
- `StandingLine` shows the statements that stay on screen in every mode; the text lives in `standing-statements.ts` and tests fail if a statement is removed. Do not shrink, shorten or hide it. On a viewport under 500px tall the same full text opens the scrolling page instead of being a fixed bar. On paper it opens the page of every view (`use-is-printing`), and prints after the view where the browser does not report printing; the report alone is marked `data-prints-own-statements`, because its title block carries them.
- The footer is above drawers in the stack, so a phone sheet rises from behind it. The scroller scrolls down only (`overflow-x: clip`): anything wide scrolls or wraps inside itself.
- The line under the current mode and view is one element that slides (`.lab-tab-line`, the kit's `use-slide-marker`). The bars and the footer carry their own view-transition names, so they do not cross-fade with the screen.
- Under 720px the modes move to the bottom edge and `ViewTabs` becomes one labelled `<select>`, so every view is reachable.

## Where you are: `route.ts`, `use-lab-route.ts`

- The address holds only mode and view (`#model/chains`). Nothing about the device ever goes in it; `toHash` writes only ids from the registries and a test pushes every model value at it.
- `view-registry.ts` lists every view of every mode. Adding a view is one entry there and a branch in its mode component, which receives the active `viewId`.
- A mode reopens at the view it was left on. Each view's scroll offset is saved on leaving and restored when it is drawn again, including through Back.
- `document.title` names the view and mode. An unknown address shows one line, falls back, and is corrected in place. A query or trailing slash after a real screen (`#model/risks?x=1`) is dropped without a notice; it is never read.
- After a change of screen, focus that fell off the page (the control that navigated is gone) moves to `#lab-results` (`use-focus-after-navigation`). A tab or mode button keeps focus. The first screen of a visit is left alone.
- The device editor closes when the reader moves to another screen; the one move that keeps it is the one made to open it (`use-device-editor-request`).
- A change of mode or view runs through the kit's `useViewTransition` (one cross-fade; none without the API or with reduced motion).
- `shell-targets.ts` names the screens the shell opens itself (change device, edit device, report, catalog, a part) and the view-state keys it shares with them. A test fails if a target is not in the view registry.

## The reader's place: `ViewStateContext.tsx`, `view-state-store.ts`

- `useViewState(key, initial, isValid?)` is `useState` for anything a view should still have when the reader returns: filters, sort, layout, the opened item. Values are plain JSON.
- Keys are paths: `explore/catalog/filters`. Keys under `model/` describe the device and are cleared when it is replaced (`forgetDeviceViews`), along with Model's scroll offsets and last view.
- The store is mirrored to `sessionStorage`. What is read back is untrusted: the envelope is bounded and its keys checked, and a value is used only if the caller's validator accepts it, or, without one, if it has the same shape as `initial`. Pass a validator for anything stricter, such as an id that must exist.
- Outside the shell (a test, the kit page) there is no provider and the hook behaves as plain `useState`.
- This is separate from `FocusContext` on purpose: that is the device, this is where the reader was looking.

## The device: `FocusContext.tsx`

- Holds the device in focus, the report computed from it, the engine data and the curated chains. Every mode reads the same device through `useFocus()`.
- Also owns `saveModelFile`, `readModelFile`, `exportRegister`, and two truthful statuses: `isStoredInBrowser` (the last write to this browser succeeded) and `fileStatus` (`never`, `saved`, `changed`, from a fingerprint of the model last written to or read from a file). `hasUnsavedChanges` (edits to the model or decisions, in neither place) registers a `beforeunload` warning, and only then. `exportRegister` goes through `register-export.ts`, the one production path to the CSV: header block, standing statements, a reason on every catalog row.
- Dispatch every change through `useFocus().dispatch`. It is what keeps the file status true and clears `model/` view state on replacement.
- `isExampleDevice` is true until the reader picks, edits, decides or loads.
- `device-persistence.ts` saves the device to this browser only when the reader asks.

## Device menu and command palette

- `DeviceChip` opens `DeviceMenu`: Change device, Edit device, Save file, Load file, Export register, Print report, and the two statuses. No warning colour on a default state. In Model the chip is the glyph and the name; the screen's header states the facts. The menu closes when focus moves outside it, and says `Loaded <device name>.` in a status line after a file is loaded.
- `CommandPalette` (Cmd/Ctrl+K, or the "Go to" button) jumps to any view, a technique by name or ID, or a part of the device, or runs one of `DEVICE_ACTIONS` (shell-targets). Its entries are computed in `palette-commands.ts` from the registries, the catalog and the model. Matches at the start of a word rank above matches inside one, which are listed only when nothing better exists; the matched stretch is drawn heavier.
- "Edit device", a technique and a part are handed to their screens through the keys in `VIEW_STATE_KEYS`; the screen reads the key with `useViewState`.

## Conventions a screen follows

- Its results region carries `id="lab-results"`. "Skip to results" is the first focusable on the page and lands there (on the screen itself when a view has no such region).
- Never link to a `#fragment` inside the Lab: the address is the route. Move focus in script.

## Promises this page makes

- Nothing a reader enters leaves the browser. The page has a same-origin content security policy, and `npm run check:model-page` fails the build if the page references another origin. View state stays in `sessionStorage`; the device stays in `localStorage` only if asked.
- Named commercial devices show published specifications only. `src/lib/threat-model/lab-table-policy.ts` removes scoring tables and columns for every screen that reads the site database.
- TARA, NISS and QIF are proposed and not peer reviewed, and the interface says so on every screen.
