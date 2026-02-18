# Runemate Forge v1.0 — Feature Scope

## Supported HTML Tags (27)

### Structural
| Tag | Encoding | Notes |
|-----|----------|-------|
| div | 0x01 | Generic container |
| span | 0x02 | Inline container |
| section | 0x12 | Semantic section |
| header | 0x13 | Page/section header |
| footer | 0x14 | Page/section footer |
| nav | 0x15 | Navigation |
| main | 0x16 | Main content area |

### Text
| Tag | Encoding | Notes |
|-----|----------|-------|
| p | 0x03 | Paragraph |
| h1-h6 | 0x04-0x09 | Headings |
| a | 0x0E | Hyperlink |
| br | 0x0D | Line break |

### Lists
| Tag | Encoding | Notes |
|-----|----------|-------|
| ul | 0x0F | Unordered list |
| ol | 0x10 | Ordered list |
| li | 0x11 | List item |

### Forms
| Tag | Encoding | Notes |
|-----|----------|-------|
| form | 0x17 | Form container |
| label | 0x18 | Form label |
| input | 0x0B | Input field |
| select | 0x19 | Dropdown |
| option | 0x1A | Dropdown option |
| textarea | 0x1B | Multi-line text input |
| button | 0x0A | Button |

### Media
| Tag | Encoding | Notes |
|-----|----------|-------|
| img | 0x0C | Image (src via attributes) |

### Custom
| Tag | Encoding | Notes |
|-----|----------|-------|
| (any) | 0xFF + str_idx | Preserved but warned |

## Supported CSS Properties (31)

### Box Model
width, height, margin (top/right/bottom/left), padding (top/right/bottom/left), border-width, border-color, border-radius, max-width, min-width, max-height, min-height

### Layout
display, position, top, right, bottom, left, flex-direction, justify-content, align-items, gap, flex-wrap, flex-grow, flex-shrink, z-index, overflow

### Visual
background-color, color, opacity, visibility

### Typography
font-size, font-weight, font-family, text-align

## Supported CSS Values

### Dimensions
- `px` — Pixel values (integer)
- `%` — Percentage (stored as basis points: 10000 = 100%)
- `vh` — Viewport height (stored as 0.1% units: 1000 = 100vh)
- `vw` — Viewport width (stored as 0.1% units: 1000 = 100vw)
- `auto` — Automatic sizing

### Colors
- Hex: `#RGB`, `#RRGGBB`, `#RRGGBBAA`
- Named: 17 CSS basic colors (black, white, red, green, blue, yellow, cyan, magenta, gray, etc.)
- Functional: `rgb(r, g, b)`, `rgba(r, g, b, a)`

### Enums
- display: block, flex, grid, inline, inline-block, inline-flex, none
- position: static, relative, absolute, fixed, sticky
- overflow: visible, hidden, scroll, auto
- text-align: left, center, right, justify
- flex-direction: row, column
- flex-wrap: nowrap, wrap, wrap-reverse
- justify-content: flex-start, center, flex-end, space-between, space-around, space-evenly
- align-items: flex-start, center, flex-end, stretch
- visibility: visible, hidden

## Unsupported Input Policy

| Category | Policy | Behavior |
|----------|--------|----------|
| Unknown HTML tags | Warn + preserve as Custom | Tag emitted with string table lookup |
| Unknown CSS properties | Warn + skip | Property dropped, warning emitted |
| Invalid CSS values | Warn + skip | Property dropped, warning emitted |
| `<script>` tags | Warn + skip (error in strict mode) | Entire element dropped |
| `<style>` tags | Warn + skip | Only inline styles supported |
| JavaScript event handlers | Warn + skip attribute | onclick, onload, etc. dropped |
| CSS selectors / classes | Not resolved | Only inline `style=""` parsed |
| `@media` / `@keyframes` | Not supported | Ignored |

### Strict Mode

When `strict_mode` is enabled in `CompilerConfig`:
- All warnings become errors
- Compilation fails on first unsupported tag/property
- Useful for CI/CD validation of BCI UI templates

## Explicitly Out of Scope (v1.0)

- External CSS stylesheets
- CSS class/ID selectors
- JavaScript execution
- `<canvas>`, `<svg>`, `<video>`, `<audio>`
- CSS animations/transitions
- CSS variables (`var()`)
- `calc()` expressions
- `em`/`rem` units
- Media queries
- Shadow DOM / Web Components
