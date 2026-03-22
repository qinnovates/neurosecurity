# Staves DSL v1.0 — Language Specification

## Overview

Staves is a **declarative, non-Turing-complete markup language** for brain-computer interface rendering. It replaces HTML/CSS/JS with a purpose-built format designed for safety-critical neural interfaces.

**Properties:**
- No loops, no conditionals, no variables, no functions
- No executable code of any kind
- Fixed vocabulary of elements, styles, tones, and pulses
- All safety bounds enforced at compile time (TARA)
- Compiles to compact binary bytecode for on-chip interpretation

## File Extension

`.staves`

## Grammar

### Top-Level Items

A `.staves` file contains a sequence of top-level items:

```
file       = item*
item       = stave_def | style_def | tone_def | pulse_def | safety_def
```

### Stave Definition (Visual Layout)

```
stave_def  = "stave" IDENT "{" element* "}"
```

A stave is a named visual layout tree. Multiple staves can exist in one file (e.g., dashboard, alert, settings).

### Elements

```
element    = container | leaf | tone_ref | pulse_ref

container  = container_kind attrs? "{" element* "}"
container_kind = "row" | "column" | "section" | "list" | "grid"

leaf       = heading | text_node | button | input_el | image
           | link | spacer | item_el | metric | separator

heading    = "heading" ("(" INT ")")? STRING
text_node  = "text" attrs? STRING
button     = "button" attrs STRING
input_el   = "input" attrs
image      = "image" attrs
link       = "link" attrs STRING
spacer     = "spacer" VALUE
item_el    = "item" attrs? STRING
metric     = "metric" attrs? STRING STRING
separator  = "separator"

tone_ref   = "tone" IDENT
pulse_ref  = "pulse" IDENT
```

### Attributes

```
attrs      = "(" attr ("," attr)* ")"
attr       = IDENT ":" attr_value
attr_value = STRING | INT | FLOAT | VALUE | COLOR | IDENT | DURATION
```

**Reserved attribute names:**
- `style` — reference to a named style definition
- `action` — event action ID (buttons)
- `field` — input field ID
- `placeholder` — input placeholder text
- `src` — image asset reference (no external URLs)
- `alt` — image accessibility text
- `href` — link destination (staves: protocol only)
- `id` — element identifier for delta updates
- `rows` — textarea row count
- `type` — input type (text, number, toggle)

### Style Definitions

```
style_def  = "style" IDENT "{" property* "}"

property   = prop_name ":" prop_value

prop_name  = "width" | "height" | "padding" | "padding-x" | "padding-y"
           | "margin" | "margin-x" | "margin-y"
           | "background" | "color" | "opacity"
           | "font-size" | "font-weight" | "font-family" | "text-align"
           | "display" | "direction" | "justify" | "align" | "gap" | "wrap"
           | "grow" | "shrink"
           | "border-width" | "border-color" | "border-radius"
           | "position" | "top" | "right" | "bottom" | "left"
           | "z-index" | "overflow" | "visibility"
           | "max-width" | "min-width" | "max-height" | "min-height"

prop_value = VALUE | COLOR | ENUM | INT | FLOAT | STRING
```

### Tone Definitions (Auditory)

```
tone_def   = "tone" IDENT "{" tone_prop* "}"
tone_prop  = "frequency" ":" FREQUENCY
           | "duration" ":" DURATION
           | "amplitude" ":" FLOAT
           | "waveform" ":" ("biphasic" | "sine" | "square")
           | "channel" ":" INT
```

### Pulse Definitions (Haptic / Somatosensory)

```
pulse_def  = "pulse" IDENT "{" pulse_prop* "}"
pulse_prop = "region" ":" IDENT
           | "intensity" ":" FLOAT
           | "duration" ":" DURATION
           | "waveform" ":" ("biphasic" | "monophasic" | "ramp")
           | "charge" ":" FLOAT
```

### Safety Profile Definitions

```
safety_def = "safety" IDENT "{" safety_prop* "}"
safety_prop = "max-elements" ":" INT
            | "max-depth" ":" INT
            | "max-bytecode" ":" INT
            | "max-charge-density" ":" FLOAT
            | "max-charge-per-phase" ":" FLOAT
            | "max-frequency" ":" FREQUENCY
            | "max-amplitude" ":" FLOAT
            | "shannon-k" ":" FLOAT
            | "blocked-actions" ":" IDENT ("," IDENT)*
```

## Tokens

```
IDENT      = [a-zA-Z_][a-zA-Z0-9_-]*
STRING     = '"' [^"]* '"'
INT        = [0-9]+
FLOAT      = [0-9]+ "." [0-9]+
VALUE      = INT ("px" | "%" | "vh" | "vw") | "auto"
COLOR      = "#" [0-9a-fA-F]{3,8}
           | "rgb(" INT "," INT "," INT ")"
           | "rgba(" INT "," INT "," INT "," FLOAT ")"
           | named_color
FREQUENCY  = INT "hz"
DURATION   = INT "ms" | INT "s"
ENUM       = "flex" | "block" | "grid" | "none" | "inline"
           | "row" | "column"
           | "start" | "center" | "end" | "between" | "around" | "stretch"
           | "static" | "relative" | "absolute" | "fixed"
           | "visible" | "hidden" | "scroll" | "auto"
           | "left" | "right" | "justify"
           | "wrap" | "nowrap"
COMMENT    = "//" [^\n]* | "#" [^\n]*
```

### Named Colors

`black`, `white`, `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`, `gray`, `orange`, `purple`, `pink`, `brown`, `transparent`

## Example

```staves
// BCI Dashboard — Neural Status Monitor

safety bci {
  max-elements: 256
  max-depth: 16
  max-bytecode: 65536
  max-charge-density: 30.0
  shannon-k: 1.75
}

style card {
  background: #1a1a2e
  border-radius: 8px
  padding: 12px
  color: #ffffff
}

style metric-row {
  direction: row
  gap: 16px
  justify: between
  align: center
}

tone warning {
  frequency: 880hz
  duration: 200ms
  amplitude: 0.3
  waveform: biphasic
}

pulse confirm {
  region: fingertip
  intensity: 0.5
  duration: 100ms
  waveform: biphasic
}

stave dashboard {
  column(style: card, id: "main") {
    heading(1) "Neural Status"

    row(style: metric-row) {
      metric "Heart Rate" "72 bpm"
      metric "Neural Load" "14%"
      metric "Temperature" "36.8C"
    }

    separator

    text "All systems nominal."

    row(gap: 8px) {
      button(action: "calibrate") "Re-calibrate"
      button(action: "dismiss") "Dismiss"
    }
  }
}

stave alert {
  column(style: card) {
    tone warning
    heading(2) "Warning: Elevated Neural Load"
    text "Current load exceeds 80% threshold."
    button(action: "acknowledge") "Acknowledge"
    pulse confirm
  }
}
```

## Compilation

```
.staves source
    | Lexer (tokenize)
    v
Token stream
    | Parser (recursive descent)
    v
Staves AST (modality-agnostic)
    | TARA Validator (safety bounds)
    v
Validated AST
    | Codegen (bit-packed bytecode)
    v
.stv binary (Staves bytecode)
    | NSP (post-quantum encryption)
    v
Encrypted payload → BCI chip
```

## Security Properties

1. **No executable code** — the language has no control flow, no functions, no eval
2. **Closed vocabulary** — only known element types and properties are accepted
3. **Compile-time bounds** — TARA validates all stimulation parameters before bytecode is emitted
4. **No external resources** — no URLs, no imports, no network access
5. **No string interpolation** — text content is literal, never evaluated
6. **Deterministic output** — same input always produces identical bytecode
7. **Type-safe values** — colors are RGBA, dimensions are px/%/vh/vw, frequencies are hz

## Unsupported (By Design)

- Variables, constants, or bindings
- Conditionals (if/else)
- Loops (for/while)
- Functions or macros
- Imports or includes
- String interpolation or templates
- JavaScript, CSS selectors, media queries
- External URLs or network references
- Comments in output (stripped at parse time)
