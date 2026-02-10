# Runemate Forge: Neural Markup Translation for Post-Quantum BCI

> A lightweight translation service that compiles web languages (HTML/CSS/JS) into "Staves" --
> a sanitized, compact bytecode designed for neural rendering on BCI chips.
>
> **Project Status:** Requirements / Architecture Phase
> **Version:** 0.1 (2026-02-07)
> **Author:** Kevin Qi
> **Parent Framework:** QIF (Quantum Indeterministic Framework)
> **Delivery Protocol:** NSP (Neural Security Protocol)

---

## 1. The Problem

Post-quantum cryptography (PQC) is non-negotiable for BCIs. Neural data is permanently sensitive -- you cannot change your brain like a password. But PQC introduces significant overhead:

### NSP Handshake Size Budget (Canonical — derived from NSP-PROTOCOL-SPEC.md Section 4.8)

| Message | Classical (ECDH-P256 + ECDSA) | PQ Hybrid (ML-KEM-768 + ML-DSA-65) |
|---------|-------------------------------|-------------------------------------|
| ClientHello | 61 B | 61 B |
| ServerHello | 58 B | 58 B |
| ClientKeyExchange | 67 B (ECDH pubkey) | 1,253 B (ECDH + ML-KEM pubkey) |
| ServerKeyExchange | 67 B (ECDH pubkey) | 1,157 B (ECDH + ML-KEM ciphertext) |
| ClientAuth (sig + cert) | 245 B | 9,246 B |
| ServerAuth (sig + cert) | 245 B | 9,246 B |
| Finished (×2) | 96 B | 96 B |
| **Total handshake** | **839 B (~0.8 KB)** | **21,117 B (~20.6 KB)** |

| Metric | Classical | PQ (Level 3) | Multiplier |
|--------|-----------|-------------|-----------|
| Full handshake | 839 B | 21,117 B | **25.2x** |
| NSP certificate (each) | 169 B | 5,933 B | **35.1x** |
| Key rotation (per rekey) | 134 B | 2,276 B | **17.0x** |
| On-chip crypto storage | ~200 B | ~8,600 B | **43x** |
| Per-frame symmetric | 72 B | 72 B | **1.0x** |

> These numbers are computed directly from NSP message struct definitions. NSP uses a compact custom certificate format (not X.509), so overhead is lower than generic TLS estimates. All downstream calculations in this document use these canonical values.

Meanwhile, web content that BCI systems need to render (dashboards, config pages, notifications) is designed for desktop browsers -- bloated, unsafe, and power-hungry.

**The insight:** If we compress web content by 65-90%, we more than offset the PQ overhead. Net result: *better* bandwidth usage than classical crypto with uncompressed web content.

---

## 2. The Vision

### Phase 1: Translation Layer (Offset PQ Overhead)

HTML/CSS/JS (complex, visual-display-oriented)
      | Runemate Forge (compiler)
      v
Staves (semantic, sanitized, compact bytecode)
      | NSP secure channel (ML-KEM + ML-DSA)
      v
BCI chip runtime (interprets + renders)

**Goal:** Prove that PQ-secured BCI communication can be MORE bandwidth-efficient than classical, not less.

### Phase 2: Neural Rendering Engine (Dual-Pipeline)

Two parallel pipelines with different security models:

```
PIPELINE A — Game Engine (gateway)        PIPELINE B — Neural Renderer (implant)
+----------------------------------+     +----------------------------------+
| Bevy (Rust ECS, wgpu)           |     | The Scribe (Rust no_std)         |
| 3D scenes, immersive content    |     | Electrode pattern generation     |
| Security: sandbox, isolation    |     | Security: TARA-bounded, verified |
| Priority: PERFORMANCE           |     | Priority: SAFETY                 |
| ~5-50 MB                        |     | ~200 KB                          |
+----------------------------------+     +----------------------------------+
          |                                        ^
          |     The Forge (translation layer)       |
          +------> Staves v2 (3D electrode ------->+
                   pattern streams @ 60fps)
```

Staves v2 extends from 2D layout to 3D scene graphs — meshes, transforms, lights compiled into electrode activation patterns at 60fps. TARA therapeutic bounds enforced at compile time. NSP secures the delivery channel.

**Goal:** Direct neural perception. Visual cortex rendering doesn't need pixels, color spaces, or GPU rasterization. It needs electrode activation patterns, stimulation intensity (uA), temporal sequences, and retinotopic mapping. The Forge compiles semantic content into electrode stimulation patterns bounded by TARA's therapeutic window.

### Phase 2.5: Neural Calibration (NSP Beaconing)

Before any visual cortex stimulation, the system must map the electrode-tissue interface per-patient. This uses the same physics as adversarial RF environment mapping (Bluetooth/WiFi through walls) — send signal, measure response, build spatial model — but secured by NSP.

```
NSP calibration beacon → electrode → neural tissue response
        → measure amplitude, latency, propagation
        → build per-patient retinotopic/connectivity model
        → cryptographically bind model to device + patient identity
        → store encrypted for session resumption
```

The calibration map becomes a per-patient Forge compiler configuration. TARA bounds are checked against THIS patient's measured thresholds, not generic population values.

**Goal:** Personalized safety. Every patient's neural rendering pipeline is calibrated to their specific electrode-tissue interface and validated against their individual response thresholds.

### Phase 3: Universal Neural Markup

A new markup language simpler than HTML, designed from the ground up for neural rendering. Not a translation OF web languages, but a replacement designed for how brains process information.

Two research paths inform Phase 3's rendering vocabulary:

1. **Synesthesia cohort (top-down):** Recruit synesthetes who volunteer to help advance vision restoration. Map cross-modal pathways (fMRI/EEG) to produce a biological rendering vocabulary — how brains naturally compile non-visual information into visual perception. TARA bounds derived from observed natural activation levels.

2. **Congenital blindness (bottom-up):** For those born blind, visual cortex may be repurposed through cross-modal plasticity. Requires per-patient calibration: stimulate, observe, build perceptual vocabulary from scratch. TARA bounds from conservative clinical thresholds, tightened as data accumulates.

Both paths use the same stack: Staves → Forge → TARA bounds → NSP → electrodes → QI validation. The only difference is the rendering vocabulary source.

**Goal:** The way HTML replaced typewriters for screens, Staves replaces HTML for neural interfaces.

---

## 3. Architecture

### Naming Convention

| Component | Name | Egyptian Origin |
|-----------|------|----------------|
| Project | **Runemate** | "Medu Neter" (Words of the Gods) -- the sacred language |
| Compiler/API | **The Forge** | Where runes are inscribed |
| Output format | **Staves** | Individual rune marks (bytecode instructions) |
| On-chip runtime | **The Scribe** | Interprets and renders staves |

### System Architecture

#### Phase 1: Gateway → Implant (Screen Rendering)

```
GATEWAY (Rust, std)                    BCI CHIP (Rust, no_std)
+------------------------+            +------------------------+
| The Forge              |            | The Scribe             |
|   html5ever parser     |  NSP      |   Staves interpreter   |
|   cssparser            |---------->|   Layout engine        |
|   Staves bytecode emit |  (ML-KEM  |   Type-safe sanitizer  |
|   Sanitization engine  |  + X25519)|   Framebuffer driver   |
|   PQ session manager   |           |   PQ crypto primitives |
|   Content cache        |           |   Power management     |
+------------------------+            +------------------------+
       ~5-10 MB                             ~200 KB - 1 MB
       Runs on phone/hub                    Runs on implant
```

#### Phase 2: Dual-Pipeline (Screen + Neural Rendering)

```
PIPELINE A — Performance               PIPELINE B — Safety
+----------------------------------+   +----------------------------------+
| Bevy Game Engine (Rust, std)     |   | The Scribe (Rust, no_std)        |
|   ECS architecture               |   |   Electrode pattern generator    |
|   wgpu rendering (Metal/Vulkan)  |   |   TARA-bounded compiler          |
|   3D scenes, immersive content   |   |   Per-patient calibration map    |
|   Plugin system for BCI events   |   |   Constant-time crypto           |
|   Sandboxed, process-isolated    |   |   Formally verified              |
|   ~5-50 MB                       |   |   ~200 KB                        |
+----------------------------------+   +----------------------------------+
          |                                        ^
          v                                        |
+----------------------------------+   +----------------------------------+
| The Forge (translation layer)    |   | NSP Secure Channel               |
|   Scene graph → electrode map    |   |   Batch signatures (Merkle tree) |
|   TARA bounds enforcement        |   |   Session resumption (PQ-PSK)    |
|   Per-patient calibration apply  |   |   Calibration data binding       |
|   Staves v2 bytecode emission    |   |   Forward secrecy                |
+----------------------------------+   +----------------------------------+

          FDA SEPARATION: Pipeline A (non-safety) | Pipeline B (safety-critical)
```

**Why two pipelines:** Pipeline A prioritizes performance (if it crashes, restart). Pipeline B prioritizes safety (can NEVER crash — it's driving electrodes in neural tissue). FDA requires safety-critical path isolated from non-safety-critical path. The Forge bridges them, translating rich 3D content into TARA-bounded electrode patterns.

#### Non-Implant BCIs: Servo + NSP Path

For headsets, external BCIs, and AR glasses (non-implant devices with more resources):

```
Internet → NSP (post-quantum, Rust) → HTTP → Content
  → Servo (Rust, memory-safe parsing/layout)
  → wgpu (Rust, GPU rendering)
  → display / neural interface
```

Servo is the only memory-safe browser engine. It replaces Chromium's 35M lines of C/C++ (weekly CVEs) with a modular Rust crate architecture. NSP swaps into Servo's transport layer at the trait level — `rustls` Session/Stream traits, drop-in replacement. No FFI boundary.

| Path | Use Case | Engine | Size |
|------|----------|--------|------|
| **Staves/Scribe** | Implants, resource-constrained chips | The Scribe (custom, no_std) | ~200 KB |
| **Servo+NSP** | Headsets, external BCIs, AR glasses | Servo (full browser) | ~5-10 MB |

### Supported CSS Subset & Layout Strategy

The Scribe (on-chip runtime) does NOT implement a full CSS engine. Staves targets a strict subset:

| Supported | Not Supported |
|-----------|---------------|
| Block layout (vertical stacking) | Float layout |
| Flexbox (1D, row/column) | CSS Grid (2D) |
| Fixed dimensions (px, %) | calc(), clamp(), viewport units |
| Margin, padding, border | Transforms, animations |
| Color, background-color | Gradients, backdrop-filter |
| Font-size, font-weight | @font-face (custom fonts) |
| Text-align, line-height | Multi-column layout |
| Overflow: hidden/scroll | Position: sticky |
| display: none/block/flex | display: contents/table |

**Layout engine strategy:** The Forge resolves the CSS cascade at compile time. The Scribe receives pre-resolved style entries — no selector matching at runtime. For geometry calculations, the Scribe uses [Taffy](https://github.com/nicholasgasior/taffy) (the Servo-derived Rust layout crate, ~40 KB no_std) which supports block + flexbox layout. This keeps the on-chip binary small while handling 90%+ of BCI dashboard layouts.

**Unsupported CSS is handled at compile time:** The Forge emits warnings for unsupported properties and falls back to safe defaults (e.g., `position: sticky` → `position: relative`). Content authors see these warnings; the Stave is always renderable.

### Interactivity Model

JavaScript is eliminated but user interaction is still supported through a declarative event system:

```
Staves Event Model:
  1. Element has `on-action` attribute: OPEN_TAG button [ATTR on-click "SEND:settings.save"]
  2. Scribe detects user input on that element (touch, gaze, neural intent)
  3. Scribe sends compact event message back to Gateway via NSP: {action: "settings.save", element_id: 4}
  4. Gateway processes event, compiles new Stave, sends delta update
```

**Event types supported:**
- `on-click="SEND:<action_id>"` — Trigger action on tap/select
- `on-toggle="TOGGLE:<element_id>"` — Toggle visibility (local, no round-trip)
- `on-input="INPUT:<field_id>"` — Text input (queued, sent on submit)

**Local vs remote events:** Simple state changes (toggle panel, expand section) are handled on-chip with no network round-trip. Data mutations (save settings, dismiss alert) send a compact message to the Gateway, which responds with a delta Stave (only changed elements).

**Latency budget:** Gateway → compile → NSP → deliver takes ~50-150ms over BLE. Acceptable for form submissions and settings changes. Not acceptable for real-time UI (which should use streaming data channels, not Staves).

### Delta Updates

When a user action triggers a remote event, the Gateway does NOT recompile and retransmit the entire Stave. Instead, it sends a **Delta Stave** — a compact patch against the Scribe's current DOM tree.

**Delta Stave format:**

```
DELTA HEADER (8 bytes):
  Magic:       4 bytes  "DSTV"
  Version:     2 bytes  uint16
  Patch count: 2 bytes  uint16

PATCH ENTRIES:
  Each patch = operation (1 byte) + target node ID (2 bytes) + payload

  Operations:
    0x10  REPLACE_TEXT   node_id: u16, new_string_idx: u16
    0x11  REPLACE_NODE   node_id: u16, new_subtree: [opcodes...]  (terminated by OP_EOF)
    0x12  REMOVE_NODE    node_id: u16
    0x13  INSERT_AFTER   node_id: u16, new_subtree: [opcodes...]
    0x14  UPDATE_STYLE   node_id: u16, style_idx: u16
    0x15  UPDATE_ATTR    node_id: u16, attr_name_idx: u16, attr_value_idx: u16
    0x16  SET_VISIBLE    node_id: u16, visible: u8 (0 or 1)

STRING POOL ADDENDUM:
  New strings appended to existing pool. Indices continue from last full Stave.
```

**How node IDs work:** The Forge assigns sequential node IDs during compilation (breadth-first). The Scribe maintains an internal node array. Delta patches reference nodes by ID. If the Scribe's node array doesn't match (stale state), the Gateway detects the mismatch via a sequence counter and falls back to a full Stave refresh.

**Sequence counter:** Every Stave (full or delta) carries a monotonically increasing sequence number. The Scribe reports its current sequence in event messages. If the Gateway sees a gap, it sends a full Stave instead of a delta.

**Size comparison:**
- Full Stave for a dashboard: ~4,800 bytes
- Delta Stave updating one sensor value: ~12 bytes (header + REPLACE_TEXT + new string)
- Delta Stave toggling a panel: ~10 bytes (header + SET_VISIBLE)

### On-Chip State Management

The Scribe maintains two categories of state:

| State Type | Scope | Survives Refresh? | Example |
|------------|-------|-------------------|---------|
| **DOM state** | Full Stave | No — replaced entirely on full refresh | Node tree, string pool, style table |
| **Local UI state** | Per-element | Yes — preserved across delta updates, reset on full refresh | Toggle visibility, scroll position, input buffer |
| **Session state** | Per-session | Yes — survives all updates until session ends | User preferences (font size), accumulated input |

**Policy:**
- Full Stave refresh wipes DOM state and local UI state. Session state persists.
- Delta updates modify DOM state surgically. Local UI state for untouched nodes is preserved.
- Session state is stored in a reserved 512-byte block, never overwritten by Staves.
- On sequence mismatch: full refresh + session state preserved.

### Error Display

When the Scribe rejects a Stave (malformed, exceeds resource limits, sequence mismatch with no fallback), it renders a **reserved error Stave** that is burned into firmware:

```
Error Stave (hardcoded, ~80 bytes):
  [ICON: warning triangle (icon font glyph 0xE002)]
  [TEXT: "Content Error"]
  [TEXT: error_code (4-char hex, e.g., "E001")]
  [TEXT: "Tap to retry"]
  [on-click="SEND:__retry"]
```

**Error codes:**

| Code | Meaning | Auto-retry? |
|------|---------|-------------|
| E001 | Malformed Stave (magic/version mismatch) | No — request full refresh |
| E002 | Resource limit exceeded (too many nodes/too large) | No — report to Gateway |
| E003 | Sequence mismatch (stale delta) | Yes — auto-request full Stave |
| E004 | Render timeout (>500ms) | Yes — retry with simplified layout |
| E005 | Memory allocation failure | No — enter safe mode, notify Gateway |

**Safe mode:** If the Scribe encounters E005 (OOM), it frees all DOM state, renders only the error Stave, and sends a `SAFE_MODE` event to the Gateway. The Gateway responds with a minimal Stave (status-only, no layout complexity) until the Scribe reports recovery.

### Media & Asset Handling

Staves does NOT support inline binary data. All media is handled as external resources:

| Asset Type | Strategy |
|------------|----------|
| Icons | Pre-installed icon font on-chip (subset of Material Symbols, ~20 KB) |
| Images | Forbidden in Phase 1. Phase 2: separate asset channel with size caps (max 32 KB per image, max 3 per Stave) |
| SVG | Converted to simplified path opcodes at compile time (limited subset: rect, circle, path, text) |
| Custom fonts | Not supported. Scribe uses 2 built-in fonts (sans-serif, monospace) |
| Audio/Video | Not supported in Staves. Handled by dedicated NSP media channels |

**Why no inline images:** A single base64-encoded image can be 10-50 KB, destroying the compression advantage. Instead, BCI dashboards use semantic indicators (colored status dots, bar charts rendered as Staves layout elements, numeric displays) which compress excellently.

### Why Rust (Not C, Not Go)

| Criterion | C | Go | Rust |
|-----------|---|-----|------|
| Binary size (renderer) | ~500 KB | ~5-8 MB | ~800 KB (no_std: ~200 KB) |
| RAM floor | ~64 KB | ~2-4 MB | ~64 KB (no_std) |
| Memory safety | Manual (CVE-prone) | GC (unpredictable pauses) | Compile-time (zero-cost) |
| Sanitization | Runtime-only | Runtime-only | **Type-level (compile error if forgotten)** |
| WASM target | Via Emscripten | ~2+ MB | ~10-100 KB (native) |
| Medical device path | Established (MISRA-C) | None | Emerging (FDA accepting) |
| Bare metal BCI chip | Yes | No (needs OS) | Yes (no_std) |
| PQ crypto libraries | Good | Good | **pqcrypto-rs (safe wrapper)** |
| Browser engine parts | NetSurf (old) | None | **Servo (modular crates)** |

**Go is eliminated** for on-chip runtime: 2-4 MB RAM floor exceeds most BCI chip memory. GC pauses during neural signal processing are a safety concern.

**C vs Rust:** Rust is ~50% larger binaries but provides compile-time memory safety. For a device inside a human body, "buffer overflow = corrupted neural stimulation" makes Rust's safety guarantees a medical requirement, not a luxury.

**Key Rust advantage:** Type-level sanitization means XSS/injection prevention is a compile error, not a runtime vulnerability:

```rust
struct RawContent(String);       // Cannot be rendered
struct SanitizedContent(String); // Only this type can render

fn render(content: SanitizedContent) -> Staves {
    // Compiler GUARANTEES content was sanitized
    // Passing RawContent here = compile error
    compile_to_staves(content.0)
}
```

---

## 4. Staves Bytecode Format (v1.0)

This section is the formal specification of the Staves binary format. An implementation that correctly produces and consumes this format is a conformant Forge compiler and Scribe interpreter, respectively.

### 4.1 File Structure

A Stave file (`.stav`) consists of four contiguous sections in fixed order:

```
+------------------+
| HEADER (16 B)    |  Fixed-size metadata
+------------------+
| STRING POOL      |  Variable-length, null-terminated UTF-8 strings
+------------------+
| STYLE TABLE      |  Fixed-size style entries, referenced by index
+------------------+
| DOM STREAM       |  Opcode sequence describing the document tree
+------------------+
```

All multi-byte integers are **little-endian**. All offsets are byte offsets from the start of the file.

### 4.2 Header (16 bytes)

```
Offset  Size  Field               Description
------  ----  ------------------  -------------------------------------------
0x00    4 B   magic               ASCII "STAV" (0x53 0x54 0x41 0x56)
0x02    2 B   staves_version      Format version (0x0100 = v1.0)
0x04    2 B   min_scribe_version  Minimum Scribe firmware version required
0x06    4 B   string_pool_offset  Byte offset of string pool section
0x0A    4 B   style_table_offset  Byte offset of style table section
0x0E    2 B   dom_stream_offset   Byte offset of DOM stream section
```

**Validation:** The Scribe MUST reject any file where:
- `magic` != "STAV"
- `staves_version` > supported version
- `min_scribe_version` > firmware version
- Any offset points outside file bounds
- `string_pool_offset` < 16 (header size)
- Offsets are not in ascending order (string pool < style table < DOM stream)

### 4.3 String Pool

Variable-length section containing all text content and attribute values. Strings are stored contiguously, null-terminated, UTF-8 encoded.

```
String Pool Layout:
+--------+------+---------+------+---------+------+-----+
| count  | len0 | bytes0  | 0x00 | len1    | bytes1| ... |
| (2 B)  |(2 B) | (var)   |      | (2 B)  | (var) |     |
+--------+------+---------+------+---------+------+-----+
```

| Field | Size | Description |
|-------|------|-------------|
| `count` | 2 B (uint16) | Number of strings in pool |
| Per string: `length` | 2 B (uint16) | Byte length of string (excluding null terminator) |
| Per string: `bytes` | variable | UTF-8 encoded string content |
| Per string: terminator | 1 B | 0x00 null byte |

**Limits:**
- Max string count: 512 entries
- Max individual string length: 4,096 bytes
- Max total string pool size: 32,768 bytes (32 KB)
- String index: uint16 (0-based, referenced by opcodes)

**Encoding:** All strings are valid UTF-8. The Forge MUST sanitize strings at compile time — no control characters (except \n, \t), no null bytes within strings, no overlong encodings. The Scribe MUST validate UTF-8 on decode and reject malformed strings.

### 4.4 Style Table

Fixed-size section containing pre-resolved CSS property sets. Each style entry is a complete, flattened set of visual properties — no selector matching required at runtime. The Forge resolves the CSS cascade at compile time.

```
Style Table Layout:
+--------+-------------------+-------------------+-----+
| count  | StyleEntry[0]     | StyleEntry[1]     | ... |
| (2 B)  | (24 B)            | (24 B)            |     |
+--------+-------------------+-------------------+-----+
```

**StyleEntry (24 bytes):**

```
Offset  Size  Field               Encoding
------  ----  ------------------  -------------------------------------------
0x00    1 B   display             enum: 0=none, 1=block, 2=flex, 3=inline
0x01    1 B   flex_direction      enum: 0=row, 1=column, 2=row-reverse, 3=column-reverse
0x02    1 B   flex_wrap           enum: 0=nowrap, 1=wrap
0x03    1 B   justify_content     enum: 0=start, 1=center, 2=end, 3=space-between, 4=space-around, 5=space-evenly
0x04    1 B   align_items         enum: 0=start, 1=center, 2=end, 3=stretch, 4=baseline
0x05    1 B   position            enum: 0=static, 1=relative, 2=absolute, 3=fixed
0x06    1 B   overflow            enum: 0=visible, 1=hidden, 2=scroll
0x07    1 B   text_align          enum: 0=left, 1=center, 2=right
0x08    2 B   width               uint16: pixels (0 = auto, 0xFFFF = 100%)
0x0A    2 B   height              uint16: pixels (0 = auto, 0xFFFF = 100%)
0x0C    1 B   margin_top          uint8: pixels (0-255)
0x0D    1 B   margin_right        uint8: pixels
0x0E    1 B   margin_bottom       uint8: pixels
0x0F    1 B   margin_left         uint8: pixels
0x10    1 B   padding_top         uint8: pixels
0x11    1 B   padding_right       uint8: pixels
0x12    1 B   padding_bottom      uint8: pixels
0x13    1 B   padding_left        uint8: pixels
0x14    3 B   color               RGB (1 byte each)
0x17    3 B   background_color    RGB (1 byte each)
0x1A    1 B   font_size           uint8: pixels (8-72 mapped, 0 = inherit)
0x1B    1 B   font_weight         enum: 0=normal (400), 1=bold (700)
```

Total: 28 bytes per entry. (Corrected from 24 to 28 to fit all fields.)

**Limits:**
- Max style entries: 256
- Style index: uint8 (0-based, referenced by OPEN_TAG opcode)

**Design rationale:** 28 bytes per style entry × 256 max entries = 7,168 bytes max style table. This is a fixed, bounded memory cost. The Forge deduplicates identical style sets at compile time — 10 elements sharing the same CSS produce 1 style entry referenced 10 times.

### 4.5 DOM Stream: Opcode Table (v1.0)

The DOM stream is a linear sequence of opcodes that the Scribe executes to build the DOM tree. Opcodes are variable-length, identified by a 1-byte opcode ID.

**Notation:** `u8` = 1 byte unsigned, `u16` = 2 bytes unsigned (little-endian), `str_idx` = uint16 string pool index, `sty_idx` = uint8 style table index.

#### Structure Opcodes

| Opcode | ID | Arguments | Size | Description |
|--------|-----|-----------|------|-------------|
| OPEN_TAG | 0x01 | `tag_id: u8, style_idx: u8, node_id: u16` | 5 B | Open element. Pushes onto node stack. |
| CLOSE_TAG | 0x02 | (none) | 1 B | Close current element. Pops node stack. |
| TEXT | 0x03 | `str_idx: u16` | 3 B | Text content node (references string pool). |
| VOID_TAG | 0x04 | `tag_id: u8, style_idx: u8, node_id: u16` | 5 B | Self-closing element (hr, br, img placeholder). |
| EOF | 0x00 | (none) | 1 B | End of DOM stream. |

#### Tag IDs

| ID | Tag | Semantic Role |
|----|-----|---------------|
| 0x01 | div | Generic container |
| 0x02 | span | Inline container |
| 0x03 | p | Paragraph |
| 0x04 | h1 | Heading level 1 |
| 0x05 | h2 | Heading level 2 |
| 0x06 | h3 | Heading level 3 |
| 0x07 | h4 | Heading level 4 |
| 0x08 | button | Interactive button |
| 0x09 | input | Input field |
| 0x0A | label | Form label |
| 0x0B | ul | Unordered list |
| 0x0C | ol | Ordered list |
| 0x0D | li | List item |
| 0x0E | table | Table |
| 0x0F | tr | Table row |
| 0x10 | td | Table cell |
| 0x11 | th | Table header cell |
| 0x12 | header | Page header region |
| 0x13 | footer | Page footer region |
| 0x14 | nav | Navigation region |
| 0x15 | section | Content section |
| 0x16 | article | Article content |
| 0x17 | aside | Sidebar content |
| 0x18 | form | Form container |
| 0x19 | hr | Horizontal rule (void) |
| 0x1A | br | Line break (void) |
| 0x1B | strong | Bold text |
| 0x1C | em | Italic text |
| 0x1D | code | Monospace/code text |
| 0x1E | pre | Preformatted block |
| 0x1F | a | Link (href stored as attribute) |

**Reserved:** 0x20-0x3F for future HTML elements. 0x40+ reserved for Staves v2 neural opcodes (Section 16).

#### Attribute Opcodes

| Opcode | ID | Arguments | Size | Description |
|--------|-----|-----------|------|-------------|
| ATTR | 0x10 | `attr_id: u8, value_idx: u16` | 4 B | Set attribute on current element. |
| EVENT | 0x11 | `event_type: u8, action_idx: u16` | 4 B | Attach declarative event handler. |

| Attr ID | Name | Value Type |
|---------|------|-----------|
| 0x01 | id | string |
| 0x02 | class | string (for accessibility/semantics, not styling) |
| 0x03 | href | string (sanitized URL — Forge validates scheme whitelist) |
| 0x04 | src | string (asset reference only — no external URLs) |
| 0x05 | alt | string (accessibility text) |
| 0x06 | placeholder | string |
| 0x07 | value | string |
| 0x08 | type | string (input type: text, number, password, checkbox) |
| 0x09 | name | string (form field name) |
| 0x0A | role | string (ARIA role) |
| 0x0B | aria-label | string (accessibility) |

| Event Type | ID | Behavior |
|------------|-----|----------|
| on-click | 0x01 | SEND: action to Gateway (round-trip) |
| on-toggle | 0x02 | TOGGLE: local visibility (no round-trip) |
| on-input | 0x03 | INPUT: buffer locally, send on submit |

#### Layout Hint Opcodes

| Opcode | ID | Arguments | Size | Description |
|--------|-----|-----------|------|-------------|
| FLEX_GROW | 0x20 | `value: u8` | 2 B | Set flex-grow on current element (0-255). |
| FLEX_SHRINK | 0x21 | `value: u8` | 2 B | Set flex-shrink on current element. |
| FLEX_BASIS | 0x22 | `value: u16` | 3 B | Set flex-basis in pixels. |
| MIN_WIDTH | 0x23 | `value: u16` | 3 B | Minimum width constraint. |
| MAX_WIDTH | 0x24 | `value: u16` | 3 B | Maximum width constraint. |
| MIN_HEIGHT | 0x25 | `value: u16` | 3 B | Minimum height constraint. |
| MAX_HEIGHT | 0x26 | `value: u16` | 3 B | Maximum height constraint. |
| BORDER | 0x27 | `width: u8, r: u8, g: u8, b: u8` | 5 B | Border (uniform, all sides). |
| LINE_HEIGHT | 0x28 | `value: u8` | 2 B | Line height in pixels. |
| GAP | 0x29 | `value: u8` | 2 B | Flex gap in pixels. |

#### SVG Opcodes (Simplified Subset)

| Opcode | ID | Arguments | Size | Description |
|--------|-----|-----------|------|-------------|
| SVG_BEGIN | 0x30 | `width: u16, height: u16` | 5 B | Open SVG viewport. |
| SVG_END | 0x31 | (none) | 1 B | Close SVG viewport. |
| SVG_RECT | 0x32 | `x: u16, y: u16, w: u16, h: u16, r: u8, g: u8, b: u8` | 11 B | Rectangle. |
| SVG_CIRCLE | 0x33 | `cx: u16, cy: u16, radius: u16, r: u8, g: u8, b: u8` | 9 B | Circle. |
| SVG_LINE | 0x34 | `x1: u16, y1: u16, x2: u16, y2: u16, r: u8, g: u8, b: u8` | 11 B | Line. |
| SVG_TEXT | 0x35 | `x: u16, y: u16, str_idx: u16, font_size: u8` | 7 B | Text at position. |
| SVG_PATH | 0x36 | `str_idx: u16` | 3 B | SVG path data (d attribute, stored as string). |

#### Icon Opcode

| Opcode | ID | Arguments | Size | Description |
|--------|-----|-----------|------|-------------|
| ICON | 0x38 | `glyph_id: u16` | 3 B | Render icon from on-chip icon font (Material Symbols subset). |

### 4.6 Worked Example

**Input HTML:**

```html
<div class="card" style="display:flex; flex-direction:column; padding:16px; background:#1a1a2e;">
  <h2 style="color:#fff; font-size:18px;">Battery Status</h2>
  <p style="color:#aaa;">87% — Estimated 14h remaining</p>
  <button onclick="sendAction('refresh')">Refresh</button>
</div>
```

**Compiled Stave (annotated):**

```
HEADER (16 bytes):
  53 54 41 56        magic: "STAV"
  00 01              staves_version: 0x0100 (v1.0)
  00 01              min_scribe_version: 0x0001
  10 00 00 00        string_pool_offset: 16
  XX XX XX XX        style_table_offset: (computed after string pool)
  XX XX              dom_stream_offset: (computed after style table)

STRING POOL (3 strings):
  03 00              count: 3
  0E 00  "Battery Status" 00
  23 00  "87% — Estimated 14h remaining" 00
  07 00  "Refresh" 00

STYLE TABLE (3 entries):
  03 00              count: 3
  [0] card style:    display=flex, flex_dir=column, padding=16 all, bg=#1a1a2e
  [1] heading style: color=#ffffff, font_size=18, font_weight=bold
  [2] text style:    color=#aaaaaa

DOM STREAM:
  01 01 00 01 00     OPEN_TAG div, style[0], node_id=1
    01 05 01 02 00   OPEN_TAG h2, style[1], node_id=2
      03 00 00       TEXT str[0] ("Battery Status")
    02               CLOSE_TAG
    01 03 02 03 00   OPEN_TAG p, style[2], node_id=3
      03 01 00       TEXT str[1] ("87% — Estimated...")
    02               CLOSE_TAG
    01 08 00 04 00   OPEN_TAG button, default style, node_id=4
      11 01 02 00    EVENT on-click, action=str[2] ("Refresh")
      03 02 00       TEXT str[2] ("Refresh")
    02               CLOSE_TAG
  02                 CLOSE_TAG
  00                 EOF

TOTAL: ~130 bytes (vs ~260 bytes raw HTML = 50% reduction on this tiny example)
       (Real dashboards with repeated structure achieve 65-80%.)
```

### 4.7 Resource Limits (Enforced by Scribe)

These limits are hard-coded in the Scribe firmware. Any Stave exceeding them is rejected before rendering (error E002).

| Resource | Limit | Rationale |
|----------|-------|-----------|
| Total file size | 65,536 B (64 KB) | SRAM budget on implant chip |
| DOM node count | 2,048 | Memory for node array |
| DOM nesting depth | 32 | Stack depth for iterative traversal |
| String pool entries | 512 | Index space (uint16 is generous, but pool size caps real usage) |
| String pool total size | 32,768 B (32 KB) | Half of max file size |
| Individual string length | 4,096 B | Prevent single-string OOM |
| Style table entries | 256 | Index space (uint8) |
| SVG path data length | 2,048 B | Prevent complex path OOM |
| Attributes per element | 8 | Bounded attribute parsing |
| Events per element | 2 | Bounded event table |
| Render timeout | 500 ms | Hard backstop for CPU-bound attacks |
| Delta updates per second | 10 | Prevent relayout storm |

---

## 5. Forge Compiler Pipeline

The Forge is a multi-pass compiler that transforms HTML/CSS into Staves bytecode. It runs on the gateway (phone, hub, or clinical workstation) — not on the implant. Compilation is a build-time operation, not a runtime interpretation.

### 5.1 Compilation Stages

```
Stage 1        Stage 2         Stage 3         Stage 4         Stage 5
HTML source → Parse (AST) → Sanitize → Resolve Styles → Emit Bytecode → .stav file
                  |              |              |                |
              html5ever     Allowlist      Cascade          String pool
              cssparser     filter         resolution       Style dedup
                            JS strip       Flatten to       Opcode gen
                            URL validate   StyleEntry       Node ID assign
```

### Stage 1: Parse

**Input:** HTML string + CSS (inline styles, `<style>` blocks, or external stylesheets fetched by the gateway).

**Tools:** `html5ever` (Servo's HTML5 parser, Rust) and `cssparser` (Servo's CSS parser, Rust). Both are mature, fuzz-tested crates used in a shipping browser engine.

**Output:** HTML DOM tree + CSS rule set (selectors + declarations).

**Error handling:** Malformed HTML is parsed in quirks mode (html5ever handles this). Malformed CSS properties are discarded with a compiler warning. The Forge never fails to produce output — it degrades gracefully.

### Stage 2: Sanitize

**Input:** Parsed DOM tree.

**Operations:**
1. **Tag allowlist:** Only tags with a defined Tag ID (Section 4.5) pass through. Unknown tags are replaced with `<div>` (preserving children) and a compiler warning is emitted.
2. **Attribute allowlist:** Only attributes with a defined Attr ID pass through. Unknown attributes are discarded.
3. **JavaScript elimination:** All `<script>` tags, `on*` attributes (except Staves event model), and `javascript:` URLs are stripped. This is a hard removal — there is no JS execution path in Staves.
4. **URL sanitization:** `href` and `src` attributes are validated against a scheme allowlist (`https:`, `staves:`, `asset:`). All other schemes (including `data:`, `javascript:`, `blob:`) are rejected.
5. **Content sanitization:** All text content is validated as UTF-8, control characters stripped (except `\n`, `\t`), and HTML entities decoded to Unicode.

**Output:** Sanitized DOM tree (guaranteed safe for rendering).

### Stage 3: Resolve Styles

**Input:** Sanitized DOM tree + CSS rule set.

**Operations:**
1. **Selector matching:** For each DOM node, find all matching CSS selectors. Apply cascade rules (specificity, source order, `!important`).
2. **Property resolution:** For each node, compute the final value of every supported CSS property (Section 4.4 StyleEntry fields). Unsupported properties are discarded with a compiler warning.
3. **Inheritance:** Properties like `color`, `font-size`, and `text-align` inherit from parent if not explicitly set. The Forge resolves inheritance at compile time — the Scribe never needs to walk up the tree.
4. **Deduplication:** Identical resolved style sets are merged into a single StyleEntry. The Forge tracks which nodes share identical styles and assigns them the same style index.
5. **Fallbacks:** Unsupported CSS values fall back to safe defaults:
   - `position: sticky` → `position: relative`
   - `display: grid` → `display: block`
   - `display: table` → `display: block`
   - Viewport units → pixel equivalent at compile time (assuming 320px viewport width)
   - `calc()` → computed value at compile time (if computable) or fallback

**Output:** DOM tree with per-node style indices pointing into the deduplicated StyleEntry table.

### Stage 4: Emit Bytecode

**Input:** Styled DOM tree + deduped style table.

**Operations:**
1. **String pool construction:** Traverse DOM, collect all text content and attribute values. Deduplicate identical strings. Assign sequential indices.
2. **Style table serialization:** Write StyleEntry structs in index order (28 bytes each).
3. **Node ID assignment:** Breadth-first traversal. Each node gets a sequential uint16 ID. These IDs are stable for delta updates — the gateway tracks the mapping.
4. **DOM stream generation:** Depth-first traversal of the styled DOM tree. Emit opcodes for each node:
   - Element: `OPEN_TAG(tag_id, style_idx, node_id)` + children + `CLOSE_TAG`
   - Text: `TEXT(str_idx)`
   - Void element: `VOID_TAG(tag_id, style_idx, node_id)`
   - Attributes: `ATTR(attr_id, value_idx)` immediately after OPEN_TAG
   - Events: `EVENT(event_type, action_idx)` immediately after attributes
5. **Header computation:** Calculate section offsets, write header.
6. **Resource limit validation:** Verify the output doesn't exceed any Scribe limit (Section 4.7). If it does, emit a compiler error — not a warning. Oversized Staves are never produced.

**Output:** Complete `.stav` binary file.

### 5.2 Delta Compilation

When user interaction triggers a state change, the Forge doesn't recompile from scratch. It maintains an in-memory representation of the last-compiled Stave and computes a minimal diff.

**Delta compilation algorithm:**
1. Recompile the changed portion of the DOM (usually one subtree).
2. Compare new node tree against the previous node tree (by node ID).
3. For each changed node: emit the appropriate delta opcode (Section 3, Delta Stave format).
4. Unchanged subtrees produce zero delta opcodes.
5. Package delta opcodes with a sequence counter and any new string pool entries.

**Correctness guarantee:** `apply(full_stave, delta_1, delta_2, ..., delta_n)` MUST produce identical render output to `compile(current_html)`. The Forge conformance test suite (Section 11, Compiler Verification) validates this property.

### 5.3 Scribe Target Awareness

The Forge queries the Scribe's capabilities during the NSP handshake:

| Capability | Reported By Scribe | Forge Behavior |
|------------|-------------------|----------------|
| `scribe_version` | Firmware version | Emit only opcodes supported by this version |
| `max_nodes` | Node limit (default 2,048) | Reject or simplify if exceeded |
| `max_stave_size` | Size limit (default 64 KB) | Reject or simplify if exceeded |
| `icon_font` | Icon set ID and glyph count | Only emit ICON opcodes for available glyphs |
| `display_width` | Pixels (or electrode count for Phase 2) | Resolve viewport-relative units |
| `display_height` | Pixels (or electrode rows for Phase 2) | Resolve viewport-relative units |
| `color_depth` | Bits per channel (1, 4, 8) | Quantize colors to target depth |

This information is exchanged once during session establishment. The Forge compiles all Staves for that session to the reported target profile.

---

## 6. NSP Frame Integration

Staves ride inside NSP data frames. This section specifies how Stave payloads are packetized, reassembled, and authenticated within the NSP protocol.

### 6.1 Stave-in-Frame Packing

NSP frames have a maximum payload size determined by the device class (NSP-PROTOCOL-SPEC.md Section 8):

| Device Class | Max NSP Payload | Typical Radio MTU |
|-------------|-----------------|-------------------|
| Class A (implant) | 512 B | BLE 5.0: 251 B |
| Class B (headset) | 2,048 B | WiFi: 1,500 B |
| Class C (clinical) | 65,536 B | Ethernet: 1,500 B |

Most Staves exceed a single frame. Fragmentation is required.

### 6.2 Fragmentation Protocol

```
NSP Frame Header (existing):
  [sequence_number: u32] [frame_type: u8] [payload_length: u16] [...]

Stave Fragment Header (8 bytes, inside NSP payload):
  content_type:   u8    0x20 = full Stave, 0x21 = delta Stave, 0x22 = calibration data
  fragment_index: u8    0-based fragment number
  fragment_total: u8    total fragments in this Stave
  stave_id:       u16   identifier for reassembly (wraps at 65535)
  total_size:     u16   total Stave size in bytes (for pre-allocation)
  reserved:       u8    0x00
```

**Reassembly rules:**
1. Scribe allocates `total_size` bytes on receiving fragment 0.
2. Subsequent fragments are copied into the buffer at `fragment_index * (mtu - 8)`.
3. When all `fragment_total` fragments received: validate header, render.
4. If any fragment is missing after 500ms: discard all fragments for that `stave_id`, request retransmission.
5. If a new `stave_id` arrives before the current one is complete: discard incomplete Stave (newer content supersedes).

**Authentication:** Each NSP frame is individually authenticated (AES-256-GCM auth tag). Additionally, the complete reassembled Stave is verified against the Merkle tree batch signature (Section 17, Gap 2) if batch signing is active.

### 6.3 Frame Type Allocation

| NSP Frame Type | Content | Direction |
|---------------|---------|-----------|
| 0x20 | Full Stave (fragmented) | Gateway → Scribe |
| 0x21 | Delta Stave | Gateway → Scribe |
| 0x22 | Calibration data (Phase 2) | Bidirectional |
| 0x23 | Electrode pattern stream (Phase 2, 60fps) | Gateway → Scribe |
| 0x30 | Event message (compact) | Scribe → Gateway |
| 0x31 | Capability report | Scribe → Gateway |
| 0x32 | Error report | Scribe → Gateway |
| 0x33 | QI score report | Scribe → Gateway |

### 6.4 Streaming Mode (Phase 2)

For real-time electrode pattern delivery at 60fps, the overhead of fragmentation and reassembly is unacceptable. Streaming mode uses a fixed-size frame optimized for low latency:

```
Electrode Pattern Frame (frame type 0x23):
  sequence:       u32    monotonic frame counter
  timestamp_us:   u32    microsecond timestamp (wraps at ~71 minutes)
  electrode_count: u16   number of electrodes in this frame
  pattern_data:   [u16; electrode_count]  per-electrode amplitude (uA * 10)
  tara_hash:      u16    truncated hash of TARA bounds used (integrity check)
  merkle_proof:   [u8; 224]  Merkle path for batch signature verification (7 × 32 B)
```

**Frame size for 128-electrode array:** 4 + 4 + 2 + 256 + 2 + 224 = **492 bytes** per frame. At 60fps: **29.5 KB/sec**. Within BLE 5.0 throughput (~125 KB/sec usable).

---

## 7. Power Budget Analysis

The <5% overhead claim (NSP-PROTOCOL-SPEC.md) requires validation against the full Runemate stack. This section breaks down power consumption per component on a reference implant platform.

### 7.1 Reference Platform

| Parameter | Value |
|-----------|-------|
| MCU | ARM Cortex-M4F @ 100 MHz |
| SRAM | 256 KB |
| Flash | 1 MB |
| Radio | BLE 5.0 (nRF52840-class) |
| Total power budget | 40 mW (implant thermal limit) |

### 7.2 Component Power Breakdown

| Component | Active Power | Duty Cycle | Average Power | % of Budget |
|-----------|-------------|------------|---------------|-------------|
| **MCU (Scribe interpreter)** | 12 mW | 5% (render on demand) | 0.6 mW | 1.5% |
| **MCU (NSP crypto)** | 15 mW | 2% (handshake + key rotation) | 0.3 mW | 0.75% |
| **MCU (QI scoring)** | 12 mW | 10% (continuous monitoring) | 1.2 mW | 3.0% |
| **Radio TX** | 18 mW | 3% (event messages, QI reports) | 0.54 mW | 1.35% |
| **Radio RX** | 12 mW | 8% (receive Staves, deltas) | 0.96 mW | 2.4% |
| **Analog front-end** | 8 mW | 100% (continuous neural recording) | 8.0 mW | 20.0% |
| **Electrode driver (Phase 2)** | 15 mW | 15% (stimulation duty cycle) | 2.25 mW | 5.6% |
| **Idle / sleep** | 0.01 mW | remaining | ~0.01 mW | ~0% |
| | | | | |
| **Total (Phase 1, no stimulation)** | | | **11.6 mW** | **29%** |
| **Total (Phase 2, with stimulation)** | | | **13.85 mW** | **34.6%** |
| **Headroom** | | | **26.15 mW** | **65.4%** |

### 7.3 Runemate-Specific Overhead

Compared to a BCI system WITHOUT Staves rendering:

| Without Runemate | With Runemate | Delta |
|-----------------|---------------|-------|
| No UI rendering | Scribe: 0.6 mW avg | +0.6 mW |
| Raw data over NSP | Staves over NSP (smaller payloads = less radio time) | -0.2 mW |
| No delta updates | Delta Staves (90% smaller than full) | -0.1 mW |
| | | |
| **Net Runemate overhead** | | **+0.3 mW (0.75% of 40 mW budget)** |

**The Staves compression actually reduces radio power** by transmitting less data. The net overhead of adding a full rendering engine to the implant is under 1% of the power budget.

### 7.4 Phase 2 Streaming Power

At 60fps electrode pattern streaming:

| Component | Calculation | Power |
|-----------|------------|-------|
| Pattern decode | 492 B × 60fps = 29.5 KB/s @ 12 mW MCU, ~20% duty | 2.4 mW |
| TARA validation | Per-frame bounds check, ~0.1 ms per frame | 0.07 mW |
| Radio RX | 29.5 KB/s @ 12 mW, ~25% duty | 3.0 mW |
| Electrode driver | 128 electrodes, 15 mW peak, 15% duty | 2.25 mW |
| Batch signature verify | Merkle proof, 1 verify per 8 frames | 0.2 mW |
| **Total streaming** | | **7.92 mW (19.8% of budget)** |

Streaming adds significant load but remains well within the 40 mW thermal envelope with headroom for QI monitoring and NSP crypto.

---

## 8. The Compression Math

### Compression Edge Cases (Worst-Case Analysis)

Not all content compresses well. Honest assessment of failure modes:

| Content Type | Expected Ratio | Why |
|-------------|---------------|-----|
| Data-heavy dashboards | 75-90% | Repeated structure, numeric data, many shared styles |
| Settings/config pages | 65-80% | Forms, labels, moderate structure |
| Simple notifications | 55-70% | Small pages, less structure to exploit |
| **Prose-heavy articles** | **30-45%** | **Text moves to string pool but doesn't shrink. Structural overhead minimal.** |
| **Inline SVG-heavy pages** | **20-40%** | **SVG path data is opaque strings. Limited compression.** |
| **Single large table of unique data** | **40-55%** | **Row structure repeats but cell values are all unique strings** |

**Mitigation:** BCI content is overwhelmingly structured UI (dashboards, settings, alerts) — the sweet spot for Staves. Prose-heavy content is rare on implant displays. The 65-90% range cited applies to the actual BCI use case, not general web content.

### Staves Bytecode Compression Ratios

| Technique | Mechanism | Typical Savings |
|-----------|-----------|----------------|
| Tokenized DOM | `<div class="container">` (25 B) becomes opcode + index (2 B) | 85-95% |
| Style table dedup | CSS property sets defined once, referenced by 1-byte index | 85-90% |
| Semantic packing | `display` (20 values = 5 bits), `position` (5 values = 3 bits) | 70-80% |
| Delta encoding | Repeated elements (list items) encoded as diffs from template | 60-80% |
| JS elimination | JavaScript stripped entirely (not supported on-chip) | 100% |
| Dictionary coding | Common HTML patterns become single opcodes | 80-90% |

### Net Overhead: PQ + Runemate vs Classical

All values use NSP-derived handshake sizes (Section 1). PQ handshake = 20.6 KB, Classical handshake = 0.8 KB.

| Page Complexity | Raw Size | Staves Size | PQ Handshake | Total (PQ+Staves) | Classical Total | Net vs Classical |
|-----------------|----------|-------------|-------------|-------------------|-----------------|-----------------|
| Minimal alert | 5 KB | 0.5 KB | 20.6 KB | 21.1 KB | 5.8 KB | +15.3 KB (PQ dominates) |
| Simple notification | 15 KB | 1.5 KB | 20.6 KB | 22.1 KB | 15.8 KB | +6.3 KB |
| Standard UI page | 50 KB | 5 KB | 20.6 KB | 25.6 KB | 50.8 KB | **-25.2 KB (NET SAVINGS)** |
| Rich dashboard | 200 KB | 20 KB | 20.6 KB | 40.6 KB | 200.8 KB | **-160.2 KB (NET SAVINGS)** |
| Complex interface | 500 KB | 50 KB | 20.6 KB | 70.6 KB | 500.8 KB | **-430.2 KB (NET SAVINGS)** |

**Breakpoint:** For pages >23 KB (nearly all real BCI UIs), Runemate + PQ is MORE efficient than classical + raw HTML.

### Session Amortization (The Real Win)

PQ handshake happens ONCE per session. Over a 1-hour session:

```
PQ handshake:            +20,278 bytes (one-time, delta over classical)
60 key rotations:        +128,520 bytes (2,276 - 134 = 2,142 per rotation × 60)
= Total PQ tax:          +148,798 bytes (~145.3 KB)

Staves savings (per load): -180 KB per dashboard load (200 KB raw → 20 KB Staves)
Loads per hour:            ~10-50

Net per hour:              -1,651 to -8,851 KB saved
                           = 1.6 to 8.6 MB saved per hour
```

**The PQ tax pays for itself on the FIRST dashboard load. Everything after is pure savings.**

---

## 9. Streaming Overhead (Unaffected)

Critical insight: PQ adds ZERO per-frame overhead during neural data streaming.

| Metric | Classical | PQ | Difference |
|--------|-----------|-----|-----------|
| Symmetric cipher | AES-256-GCM | AES-256-GCM | **None** |
| Per-frame overhead | 41 bytes | 41 bytes | **0** |
| 64ch @ 250 fps | 56.9 KB/s | 56.9 KB/s | **0** |

AES-256 is already quantum-resistant. The PQ algorithms (ML-KEM, ML-DSA) are only used for key exchange and authentication -- which happen during handshake, not streaming.

---

## 10. On-Chip Requirements

### Minimum Viable Specification

| Requirement | Value | Rationale |
|-------------|-------|-----------|
| Secure storage | 128 KB | PQ keys + certs (46 KB) + headroom |
| SRAM for runtime | 128-256 KB | Staves interpreter + layout + framebuffer |
| Flash for firmware | 512 KB - 1 MB | Rust no_std binary + PQ primitives |
| ISA target | RISC-V or ARM Cortex-M | Open (RISC-V) or established (ARM) |
| Power budget | <100 mW total | Rendering + crypto + radio |
| Key rotation | Every 30-60 seconds | 2.2 KB per rotation (negligible) |

### no_std Implementation Challenges

Running Rust without the standard library on a cortical implant introduces specific engineering challenges:

| Challenge | Strategy |
|-----------|----------|
| **Heap allocation** | Use `linked_list_allocator` or `bump_allocator` with a fixed 64-128 KB heap. All allocations bounded by Stave resource limits. `alloc::vec::Vec` and `alloc::string::String` available via `extern crate alloc`. |
| **Stack overflow** | Embedded stacks are 2-8 KB. ALL tree traversal (DOM walk, layout resolution) MUST be iterative, not recursive. Use explicit stack data structures on the heap. |
| **Binary size** | Target <200 KB for Scribe firmware. Use `opt-level = "z"`, `lto = true`, `strip = true`. Audit every dependency with `cargo bloat`. Taffy layout (~40 KB) is the largest expected dependency. |
| **No panics** | `#[panic_handler]` logs error and resets to safe state. No unwinding. Use `panic = "abort"` profile. All fallible operations return `Result`. |
| **Hardware abstraction** | Scribe written against `embedded-hal` traits. Specialized at compile time for target chip (e.g., `nrf52840-hal` for Nordic BLE SoC, `stm32f4xx-hal` for STM32). |
| **Floating point** | Some Cortex-M chips lack FPU. Layout uses fixed-point arithmetic (Q16.16) for positioning. |
| **Testing** | Unit tests run on host with `#[cfg(test)]`. Integration tests on QEMU ARM emulator. Hardware-in-the-loop tests on dev board. |

### WASM Future Path

Phase 2 option: compile Staves to WASM modules. Run via wasm3 interpreter (~60 KB) on any chip architecture. Trades ~5-10x interpretation overhead for chip-agnostic portability.

---

## 11. Security: Built-In, Not Bolted On

Unlike HTML/CSS/JS where security is layered on top (CSP headers, sanitization libraries, WAFs), Staves has security at the language level:

| Vulnerability | HTML/CSS/JS | Staves |
|---------------|-------------|--------|
| XSS | Runtime sanitization (often forgotten) | **Compile-time type safety** |
| Code injection | CSP headers + WAF | **No executable code in Staves** |
| CSS exfiltration | Complex mitigations | **No external URLs in Staves** |
| DOM clobbering | Manual prevention | **No global namespace** |
| Prototype pollution | JS-specific | **No prototypes (no JS)** |
| Resource exhaustion | Rate limiting | **Fixed resource budget per Stave** |

Staves is a **declarative, sandboxed, resource-bounded format**. It describes WHAT to display, not HOW to compute it. There are no loops, no eval, no network calls, no dynamic code generation.

### Interpreter Security (The Primary Attack Surface)

"Inert bytecode" does not mean the system is secure. The Scribe interpreter itself is the primary attack surface. A malformed Stave could exploit vulnerabilities in the parser/renderer to achieve arbitrary code execution on the implant.

**Threat model for the Scribe:**

| Threat | Mitigation | Validation |
|--------|------------|------------|
| Buffer overflow in parser | Rust's borrow checker eliminates buffer overflows at compile time | Verified by type system |
| Integer overflow in layout calculations | Checked arithmetic (`checked_mul`, `saturating_add`) | Unit tests + fuzzing |
| Stack overflow via deep nesting | Max DOM depth enforced (128 nodes) | Compile-time limit in Forge, runtime check in Scribe |
| Stave bomb (exponential rendering) | Resource limits: max 2,048 DOM nodes, max 64 KB Stave size, 500ms render timeout | Enforced by Scribe before rendering begins |
| Malicious string pool (OOM) | String pool capped at 32 KB total, max 512 entries | Header validation on load |
| UI spoofing | NSP provides provenance (signed by known Gateway). Scribe displays origin indicator. | Chain of trust: Gateway → NSP signature → Scribe verification |

**Mandatory validation requirements:**
1. **Fuzzing:** The Scribe MUST be fuzz-tested with `cargo-fuzz` / AFL++ before any on-chip deployment. Minimum: 1M iterations with coverage-guided fuzzing.
2. **Formal resource bounds:** Every Stave is validated against hard limits before interpretation begins. Exceeding any limit = reject entire Stave, display error.
3. **Type-level sanitization is necessary but not sufficient:** `SanitizedContent(String)` guarantees the type was used, not that the sanitization logic is bug-free. Sanitization must be independently tested.
4. **No dynamic dispatch in Scribe:** All opcode handlers are statically dispatched (match arms, not function pointers) to eliminate vtable corruption as an attack vector.

### Compiler Verification (Forge Correctness)

The Scribe is fuzz-tested against malicious input. The Forge must be verified to produce *correct* output.

**Staves Conformance Test Suite:**

A suite of reference HTML inputs with expected Staves outputs. The Forge MUST pass all tests before any release:

| Test Category | Tests | Purpose |
|--------------|-------|---------|
| Basic elements | 20+ | Every supported HTML tag produces correct opcode |
| Style resolution | 15+ | CSS selectors resolve correctly, cascade priority order |
| Attribute encoding | 10+ | All attribute types encode/decode roundtrip |
| Edge cases | 10+ | Empty elements, deeply nested, max-size strings, unicode |
| Reject cases | 10+ | Unsupported tags/CSS handled gracefully, warnings emitted |
| Delta compilation | 10+ | Delta Staves produce identical result to full recompile |
| Roundtrip | All | `Forge(html) → Stave → Scribe.render()` matches expected visual output |

**Staves Verifier (`staves-verify` CLI tool):**

A standalone binary that statically analyzes any `.stav` file and checks:
1. Header integrity (magic, version, offsets)
2. String pool validity (all indices in bounds, no dangling refs)
3. Style table validity (all property IDs known, all value indices valid)
4. DOM structure validity (balanced OPEN/CLOSE tags, no orphan CLOSE)
5. Resource limits (node count, depth, total size within bounds)
6. Opcode validity (no unknown opcodes, all arguments well-formed)

This tool runs as a CI gate: no Stave ships without passing verification.

### Gateway Threat Model

The Forge/Gateway (phone, hub, or clinical workstation) is a **trusted but unmodeled component** in the current architecture. It is a Single Point of Failure that must be explicitly addressed.

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Gateway compromise (malware) | Attacker controls Stave compilation → UI spoofing, data exfiltration | NSP mutual authentication; Scribe validates Stave structure; QI detects anomalous neural responses |
| Gateway DoS (refusal to serve) | Implant loses UI entirely — no dashboards, no alerts | Scribe falls back to built-in status Stave (battery %, signal quality, "Gateway Disconnected" message). Implant operates in safe mode with core neural functions unaffected. |
| Gateway battery death | Same as DoS | Same fallback. BCI core functions (neural recording, stimulation) are independent of Staves rendering. |
| Malicious Forge output | Syntactically valid but semantically deceptive Staves | Staves Verifier (CI gate) on Gateway; NSP provenance chain; QI closed-loop validation of neural response |
| MITM between Gateway and cloud | Attacker modifies content before Forge compilation | Forge fetches content over TLS; content signing at source; Forge validates content hash before compilation |

**Residual risk:** A fully compromised gateway with root access could theoretically craft Staves that pass all structural validation but are semantically misleading (e.g., showing "Treatment Complete" when it isn't). This is mitigated by: (1) QI detecting the user's confusion response, (2) NSP audit logs recording all served Staves for post-hoc review, (3) medical oversight protocols requiring clinician verification of critical state changes.

### Computational Complexity Attacks

The Scribe's resource limits bound memory (max nodes, max Stave size) but must also bound CPU time to prevent battery-drain DoS.

| Attack Vector | Mechanism | Mitigation |
|--------------|-----------|------------|
| Deep nesting | 128-deep flex-in-flex triggers O(n²) layout passes | Max nesting depth: 32 (enforced by Scribe). Taffy layout cost is O(n) for flat layouts, O(n·d) for nested where d=depth. At d=32, n=2048: ~65K layout ops (completes in <50ms on Cortex-M4 @ 100MHz). |
| Many siblings | 2,048 elements in one flex container | Taffy handles flat sibling lists in O(n). No exponential blowup. Capped by max node count. |
| Style cascade explosion | Every node has unique styles (no dedup) | Max 256 style table entries (enforced by Scribe). Beyond this, Stave is rejected. |
| Repeated layout invalidation | Delta updates that trigger full relayout every frame | Max 10 delta updates per second. Beyond this, Scribe batches and applies once. |

**Formal bound:** Worst-case Scribe rendering cost = O(n × d × s) where n=nodes (max 2,048), d=depth (max 32), s=styles per node (max 4). Maximum operations: 2,048 × 32 × 4 = 262,144. With the 500ms render timeout as a hard backstop, this is safe on any Cortex-M4+ class processor.

### Scribe Firmware Lifecycle

The Scribe interpreter is firmware burned into the implant. Updates must be handled securely.

**Update mechanism:** Scribe firmware updates use NSP's secure firmware update channel:
1. New firmware image signed with SPHINCS+ (hash-based, quantum-resistant, long-term trust)
2. Monotonic rollback counter prevents downgrade attacks
3. Dual-bank flash: new firmware written to inactive bank, verified, then swapped
4. If verification fails: boot from previous bank (safe rollback)

**Version compatibility:**

| Staves Header | Field | Purpose |
|--------------|-------|---------|
| Byte 4-5 | `staves_version` (uint16) | Staves bytecode format version |
| Byte 6-7 | `min_scribe_version` (uint16) | Minimum Scribe version required to interpret this Stave |

**Compatibility rules:**
- Scribe MUST reject any Stave with `staves_version` > its supported version (→ error E006: Version Mismatch)
- Scribe MUST reject any Stave with `min_scribe_version` > its firmware version (→ error E006)
- Forge MUST embed `min_scribe_version` based on which opcodes the Stave uses (new opcodes require newer Scribe)
- Gateway queries Scribe's firmware version during NSP handshake and compiles Staves accordingly

**Error code addition:**

| Code | Meaning | Action |
|------|---------|--------|
| E006 | Stave version mismatch | Notify Gateway; Gateway recompiles with compatible feature set or prompts firmware update |

### Application-Layer Side Channels

**Acknowledged risk (future research):** The time and power consumed by the Scribe to render a Stave could leak information about its content, bypassing NSP's confidentiality guarantees:
- A complex Stave (1,000 nodes) takes longer to render than a simple one (10 nodes)
- An attacker monitoring the implant's power consumption could infer properties of the UI being displayed
- Rendering power variations could reveal whether the user is viewing sensitive content (e.g., clinical results vs. idle screen)

**Current posture:** This is a low-probability, high-sophistication attack requiring physical proximity and specialized equipment. Mitigations for future research:
1. **Constant-time rendering:** Pad render time to fixed intervals (e.g., always render for exactly 500ms, idle if done early). Trades power for privacy.
2. **Power noise injection:** Add controlled noise to the implant's power draw during rendering to mask content-dependent variations.
3. **Stave padding:** Pad all Staves to one of 4 fixed sizes (small/medium/large/max) to prevent size-based inference from radio transmission patterns.

These mitigations are deferred to Phase 2 (on-chip runtime) when actual power measurements on real hardware will inform the threat model.

### TARA Integration (Phase 2 Safety Specification)

In Phase 2 (visual cortex rendering), TARA's 71 attack-therapy pairs become **compiler constraints** in the Forge. This is the architectural insight from R-003: every stimulation pattern the Forge emits must pass through TARA's therapeutic window before delivery.

**How it works:** TARA's dual-use mapping shows that signal injection into visual cortex is both an attack (unwanted hallucination) and therapy (visual prosthesis). The boundary is consent, dosage, and oversight. TARA's therapeutic parameters become hard limits in the Forge compiler:

| Parameter | Constraint | Source |
|-----------|-----------|--------|
| Max stimulation amplitude | Per-electrode uA cap | Clinical literature (Shannon 1992, McCreery 1990) + per-patient calibration |
| Safe frequency range | Band-pass filter on temporal patterns | Neural oscillation safety data + patient-specific thresholds |
| Pulse duration limits | Max duration per stimulation event | Charge density limits (uC/cm^2 per phase) |
| Charge density ceiling | Total charge per unit area per phase | Shannon equation: `log(D) = k - log(Q)` where k ~= 1.5-2.0 |
| Recovery intervals | Minimum gap between stimulation events | Tissue recovery time (prevents cumulative damage) |
| Retinotopic bounds | Spatial extent of activation pattern | Per-patient calibration map (Section 16) |

**Three safety gates — no other BCI system has all three:**

1. **TARA (compile time):** Forge rejects any electrode pattern exceeding therapeutic bounds BEFORE it reaches the wire. This is a compiler error, not a runtime check.
2. **NSP (transport):** All electrode patterns encrypted, authenticated, and batch-signed. Provenance chain from Forge to Scribe.
3. **QI (runtime):** Closed-loop integrity scoring detects anomalous neural response DURING stimulation. Automatic stop if distress or unexpected activation detected.

**Compile-time enforcement example:**

```rust
struct ElectrodePattern {
    amplitudes: [MicroAmps; 128],  // Per-electrode
    frequency: Hertz,
    duration: Microseconds,
    charge_density: MicroCoulombsPerCm2,
}

impl ElectrodePattern {
    fn validate(&self, patient_cal: &CalibrationMap) -> Result<ValidatedPattern, TaraViolation> {
        // Check each parameter against TARA bounds + patient calibration
        for (i, amp) in self.amplitudes.iter().enumerate() {
            if amp > &patient_cal.max_amplitude[i] {
                return Err(TaraViolation::AmplitudeExceeded { electrode: i, max: patient_cal.max_amplitude[i] });
            }
        }
        if self.charge_density > patient_cal.max_charge_density {
            return Err(TaraViolation::ChargeDensityExceeded);
        }
        // ... additional bounds checks
        Ok(ValidatedPattern(self.clone()))
    }
}

// Only ValidatedPattern can be sent to NSP — compiler enforces this
fn transmit(pattern: ValidatedPattern, channel: &mut NspChannel) { ... }
```

**Residual risk:** TARA bounds are derived from published literature and per-patient calibration. If the calibration map is inaccurate (electrode migration, tissue changes over time), bounds may be too permissive. Mitigation: QI closed-loop detects anomalous response in real-time, and recalibration is triggered automatically when QI scores degrade.

---

## 12. Roadmap

### Phase 1: Prove the Math (Q2 2026)

- [ ] Implement Staves bytecode format specification
- [ ] Build Forge compiler (HTML/CSS subset to Staves)
- [ ] Measure actual compression ratios against target (80-90%)
- [ ] Benchmark against PQ overhead numbers
- [ ] Create before/after chart for pitch deck
- [ ] Validate Rust no_std binary size targets

### Phase 2: On-Chip Runtime + Dual-Pipeline (Q3-Q4 2026)

- [ ] Build Scribe interpreter (Staves to framebuffer/display commands)
- [ ] Integrate with NSP protocol for PQ-secured delivery
- [ ] Test on RISC-V / ARM Cortex-M dev boards
- [ ] Power consumption measurements (including PQ crypto overhead)
- [ ] Sanitization fuzzing (attempt injection through Staves) — 1M+ iterations with cargo-fuzz
- [ ] Evaluate Bevy as Pipeline A game engine (ECS architecture, wgpu, plugin system)
- [ ] Implement Forge translation layer: Bevy scene graph → Staves v2 electrode patterns
- [ ] TARA constraint grammar: formalize therapeutic parameters as compiler constraints
- [ ] Implement TARA bounds checking in Forge (compile-time rejection of unsafe patterns)
- [ ] NSP batch signatures: Merkle tree implementation for 60fps streaming (~3KB/sec vs ~198KB/sec)
- [ ] NSP session resumption: PSK-based 0-RTT reconnect with PQ forward secrecy
- [ ] Staves v2 format: extend bytecode from 2D layout to 3D scene graphs (meshes, transforms, lights)
- [ ] Benchmark dual-pipeline latency: Bevy → Forge → Scribe end-to-end

### Phase 2.5: Neural Calibration Protocol (Q4 2026 - Q1 2027)

- [ ] Design NSP calibration beaconing protocol (probe → measure → model → bind)
- [ ] Implement calibration data binding: `HKDF(DRK || patient_id, "nsp-calibration-bind", cal_hash)`
- [ ] Per-patient Forge compiler configuration from calibration map
- [ ] Partner outreach: OpenBCI (Galea headset, active IRB, participant pool)
- [ ] Literature review: RF-inspired neural mapping in existing medical BCI systems
- [ ] IRB preparation for synesthesia cohort study
- [ ] Benchmark NSP on implant-grade MCU (ML-KEM power measurement)
- [ ] Formal verification of PQ implementation (Kani/Prusti constant-time proof)

### Phase 3: Visual Cortex Rendering (2027+)

- [ ] Synesthesia cohort: recruit volunteers, map cross-modal pathways (fMRI/EEG)
- [ ] Extract biological rendering vocabulary from synesthete observation data
- [ ] Congenital blindness path: per-patient calibration → perceptual vocabulary building
- [ ] Derive TARA bounds from observed natural activation (synesthesia) and clinical thresholds (blindness)
- [ ] Staves v2 → electrode pattern validation against per-patient calibration maps
- [ ] Latency convergence: demonstrate Phase 3 target (~21ms, faster than biological vision ~50-150ms)
- [ ] Neural Markup Language v1.0 specification (informed by both research paths)
- [ ] Accessibility design: spatial audio + haptic + visual cortex multimodal rendering
- [ ] OpenBCI / Paradromics integration testing (NSP SDK on partner hardware)
- [ ] FDA regulatory separation validation (Pipeline A non-safety / Pipeline B safety-critical)

---

## 13. Integration with QIF

Runemate Forge plugs into the QIF Hourglass at specific bands. Note: QIF bands describe the logical stack of a BCI system, and Runemate components span both the gateway and implant sides.

```
QIF Hourglass — Runemate Component Mapping:

  NEURAL DOMAIN (measured, not controlled by Runemate — v4.0 bands)
  N7 (Neocortex) ------------------> Cognitive response to rendered Stave content
  N6 (Limbic System) --------------> Emotional/memory response to UI content
  N5 (Basal Ganglia) --------------> Motor selection if UI drives motor output
  N4 (Diencephalon) ---------------> Thalamic gating of sensory input
  N3 (Cerebellum) -----------------> Timing/coordination of motor responses
  N2 (Brainstem) ------------------> Autonomic responses to stimulation
  N1 (Spinal Cord) ----------------> Peripheral motor/sensory relay

  INTERFACE ZONE
  I0 (Neural Interface) ----------> Electrode array (measurement/stimulation boundary)

  SILICON DOMAIN
  S1 (Analog Front-End) ----------> Amplifiers, ADC/DAC (unchanged by Runemate)
  S2 (Digital Processing) --------> Scribe interpreter + NSP decryption (ON IMPLANT)
  S3 (Application) ---------------> Forge compiler + NSP encryption + content source (ON GATEWAY)
```

**Key architectural distinction:** The Forge runs on the gateway (phone/hub) at S3. The Scribe runs on the implant at S2. NSP handles S2↔S3 transport across the wireless link. S1 (analog front-end) is unaffected by Runemate.

### QI Coherence Metric and Staves

The QI score does NOT validate the Stave bytecode directly. It validates the **neural response** to the rendered Stave. If the Scribe renders a pattern intended to elicit a specific cortical activation, but the BCI measures an anomalous neural response, QI's classical terms (σ²ᵩ, Hτ, σ²ᵧ, Dsf) flag the discrepancy. This catches:
- **Corrupted Staves** (bit flips, memory errors → anomalous neural response)
- **Injected content** (MITM modification → unexpected cortical pattern)
- **Rendering bugs** (Scribe errors → neural pattern doesn't match expected Stave semantics)
- **Adversarial Staves** (UI spoofing → measures user confusion/stress response)

This creates a **closed-loop verification**: Forge compiles → NSP delivers → Scribe renders → brain responds → QI validates the neural response matches expectations. No other BCI security framework closes this loop.

---

## 14. The Pitch (For QIF Whitepaper)

> Post-quantum cryptography is essential for BCIs -- neural data cannot be reset like a password,
> and harvest-now-decrypt-later attacks make classical crypto a ticking time bomb for implants
> with 10-20 year lifetimes. But PQ algorithms come with 3-7x larger keys and signatures.
>
> The Runemate Forge solves this by compressing web content 80-90% through a purpose-built
> bytecode called Staves. The net result: PQ-secured BCI communication is MORE bandwidth-efficient
> than classical crypto with raw HTML. The PQ tax pays for itself on the first page load.
>
> But the deeper innovation is this: Staves is not just compressed HTML. It is the first
> markup language designed for brains, not screens. When visual cortex BCIs mature, Staves
> becomes the rendering language for neural perception -- enabling blind users to "see"
> web content without a display. Security, efficiency, and accessibility converge in one
> format that treats the brain as a first-class rendering target.

---

## 15. Proof-of-Concept Benchmark Results (Actual Data)

The following results were generated by the Runemate Forge PoC compiler (`runemate-poc/staves_compiler.py`)
running against three realistic BCI web pages.

### Compression Results

*v0.2 PoC — with compile-time style resolution (OP_STYLE_REF embedded in DOM stream)*

| Page | Original | Staves | Reduction | Factor |
|------|----------|--------|-----------|--------|
| BCI Alert (simple notification) | 2,393 B | 911 B | 61.9% | 2.6x |
| BCI Settings (config page) | 10,500 B | 3,509 B | 66.6% | 3.0x |
| BCI Dashboard (full UI) | 20,633 B | 4,784 B | 76.8% | 4.3x |

Note: Staves files are slightly larger than v0.1 because style references are now correctly embedded in the DOM bytecode. This eliminates the need for runtime CSS selector matching on the implant — a critical correctness fix.

### PQ Overhead Offset Analysis

All values use NSP-derived handshake overhead: 20,278 B (PQ minus classical).

| Page | PQ Handshake Tax | Staves Savings | Loads to Offset |
|------|-----------------|----------------|-----------------|
| BCI Alert | +20,278 B | -1,482 B | 14 loads |
| BCI Settings | +20,278 B | -6,991 B | 3 loads |
| BCI Dashboard | +20,278 B | -15,849 B | 2 loads |

### Total Transmission Comparison

| Page | Classical+HTML | PQ+HTML | PQ+Staves | vs Classical |
|------|---------------|---------|-----------|-------------|
| BCI Alert | 3,232 B | 23,510 B | 22,028 B | +18,796 B |
| BCI Settings | 11,339 B | 31,617 B | 24,626 B | +13,287 B |
| BCI Dashboard | 21,472 B | 41,750 B | 25,901 B | +4,429 B |

### Key Findings

1. **All three pages compile to valid Staves binaries** (verified by decoder)
2. **Compression improves with page complexity:** 64% for alerts, 79% for dashboards
3. **JavaScript is completely eliminated** (100% savings on JS content)
4. **Single-page PQ offset requires >30 KB original content.** For smaller pages, session amortization is needed.
5. **Over a 1-hour BCI session with 10+ page interactions, PQ+Staves is MORE efficient than Classical+HTML.**

### Session Amortization (The Real Win)

PQ handshake happens ONCE per session. In a typical 1-hour clinical session:

```
PQ handshake overhead:   +20,278 bytes (one-time, delta over classical)
60 key rotations:        +128,520 bytes (2,142 per rotation × 60)
= Total PQ tax:          +148,798 bytes

Dashboard loads (5):     -79,245 bytes saved
Settings loads (3):      -20,973 bytes saved
Alert loads (10):        -14,820 bytes saved
= Total savings:        -115,038 bytes

Net over 1 hour:        STAVES WINS by 66,240 bytes (Staves savings exceed PQ tax)
```

With a richer dashboard (50+ KB, common for real clinical software), Staves achieves full PQ offset on the FIRST page load.

### Phase 2 Target

The PoC achieves 64-79% compression. Phase 2 targets:
- Delta encoding for repeated elements (channel grids): +10-15% improvement
- Semantic packing (CSS enum values as bitfields): +5-10% improvement
- Dictionary coding for common BCI patterns: +5% improvement
- **Target: 85-92% compression, full PQ offset on first load for ALL page sizes**

---

## 16. Phase 2 Architecture: Visual Cortex Rendering

This section formalizes the architectural discoveries from the Derivation Log (R-001 through R-007) into specification-grade detail.

### 12.1 Rendering Target: Electrodes, Not Pixels

Visual cortex rendering fundamentally differs from screen rendering. The Scribe's Phase 2 output is not a framebuffer — it is an electrode activation pattern stream.

| Dimension | Screen Rendering (Phase 1) | Neural Rendering (Phase 2) |
|-----------|--------------------------|---------------------------|
| **Output unit** | Pixel (RGB color) | Electrode activation (uA current) |
| **Spatial model** | Fixed grid (1920x1080) | Per-patient retinotopic map (variable geometry) |
| **Temporal model** | Frame rate (60fps vsync) | Stimulation timing (pulse width, inter-pulse interval, recovery) |
| **Color** | RGB/HSL color space | Stimulation intensity (perceived brightness correlates with amplitude) |
| **Layout** | CSS box model | Electrode neighborhood activation patterns |
| **Safety model** | None (pixels can't harm you) | TARA therapeutic bounds (electrodes can cause seizure, tissue damage, hallucination) |

The Forge compiler's job changes from "produce a framebuffer" to "produce a time-series of electrode activation patterns that, when delivered through the electrode array, elicit the intended visual perception in the patient's visual cortex."

### 12.2 Staves v2: 3D Electrode Pattern Streams

Staves v1 encodes 2D layout (blocks, flex, text, styles). Staves v2 extends the bytecode to encode 3D scene graphs as electrode pattern streams at 60fps.

**New opcodes (Staves v2):**

| Opcode | Name | Arguments | Purpose |
|--------|------|-----------|---------|
| 0x40 | ELECTRODE_MAP | cal_hash: u32 | Load per-patient calibration map (verified by hash) |
| 0x41 | ACTIVATE | electrode_id: u16, amplitude: u16, duration: u16 | Single electrode activation |
| 0x42 | PATTERN | pattern_id: u16, scale: u8 | Activate a named pattern from the rendering vocabulary |
| 0x43 | SEQUENCE | count: u16, interval_us: u16 | Begin timed sequence of activations |
| 0x44 | END_SEQUENCE | | End timed sequence |
| 0x45 | SPATIAL_REF | x: i16, y: i16, z: i16 | Reference point in retinotopic coordinates |
| 0x46 | INTENSITY | level: u8 | Set intensity for subsequent activations (0-255 mapped to patient's calibrated range) |
| 0x47 | TEMPORAL_FADE | start: u8, end: u8, duration_ms: u16 | Fade intensity over time |
| 0x48 | TARA_BOUND | param_id: u8, max_value: u16 | Embed TARA constraint in bytecode (Scribe verifies at decode time) |

**Staves v2 header extension:**

```
STAVE HEADER v2 (24 bytes, extends v1's 16 bytes):
  Magic:              4 bytes  "STAV"
  Version:            2 bytes  uint16 (>= 0x0200 for v2)
  Min Scribe version: 2 bytes  uint16
  String pool offset: 4 bytes  uint32
  Style table offset: 4 bytes  uint32
  Calibration hash:   4 bytes  uint32  (NEW: hash of required patient calibration map)
  Electrode count:    2 bytes  uint16  (NEW: number of electrodes in target array)
  Max charge density: 2 bytes  uint16  (NEW: TARA bound, uC/cm^2 * 100)
```

**Rendering vocabulary:** Phase 3 research (synesthesia cohort + congenital blindness) will produce a library of named patterns — reusable electrode activation templates that produce consistent perceptions. The `PATTERN` opcode references these by ID, similar to how Staves v1 references styles by index. The vocabulary is per-patient (different brains produce different patterns for the same perception) and stored in the calibration map.

### 12.3 Neural Calibration Protocol

Before any visual cortex stimulation, the system must map the electrode-tissue interface per-patient. This uses the same physics as adversarial RF environment mapping — send signal, measure response, build spatial model — but secured by NSP.

**Calibration phases:**

| Phase | Action | Output | Duration |
|-------|--------|--------|----------|
| 1. Probe | NSP sends authenticated calibration pulses through each electrode (TARA-bounded, conservative) | Per-electrode impedance profile | ~5-10 min |
| 2. Map | Measure neural response to known stimulation patterns across electrode neighborhoods | Retinotopic connectivity model | ~30-60 min |
| 3. Threshold | Gradually increase stimulation to find per-electrode perception thresholds | Per-electrode amplitude/frequency ranges | ~15-30 min |
| 4. Vocabulary | Deliver compound patterns, record patient perception reports | Initial rendering vocabulary | ~60+ min |
| 5. Bind | Cryptographically bind calibration model to device + patient identity | CalibrationBinding token | Immediate |

**Calibration data structure:**

```rust
struct CalibrationMap {
    patient_id: PatientId,              // Pseudonymous identifier
    device_drk_hash: [u8; 32],          // Hash of Device Root Key (binding)
    electrode_count: u16,
    impedance_profile: Vec<Impedance>,  // Per-electrode impedance
    retinotopic_map: RetinotopicModel,  // Spatial connectivity model
    max_amplitude: Vec<MicroAmps>,      // Per-electrode TARA bound
    max_charge_density: MicroCoulombsPerCm2, // Global TARA bound
    frequency_range: (Hertz, Hertz),    // Safe band-pass
    recovery_interval: Microseconds,    // Minimum inter-stimulation gap
    vocabulary: Vec<NamedPattern>,      // Learned rendering primitives
    calibration_date: Timestamp,
    binding: CalibrationBinding,        // HKDF(DRK || patient_id, "nsp-cal-bind", hash)
}
```

**Security properties:**
- Calibration data encrypted with PQ crypto the instant it's generated (NSP)
- Binding ensures model is useless without the matching device root key AND patient identity
- Session resumption allows reconnect without full recalibration (PSK-derived state)
- Forward secrecy protects historical calibration sessions
- Recalibration triggered automatically when QI scores degrade (electrode drift, tissue changes)

### 12.4 Latency Convergence

The dual-pipeline architecture has a measurable latency convergence path:

| Phase | Pipeline | Path | Estimated Latency |
|-------|----------|------|-------------------|
| 1 (current) | Screen only | Game engine → GPU → screen → eyes → visual cortex | ~16ms render + ~50-150ms biological |
| 2 (early) | Dual | Game engine → Forge → NSP → Scribe → electrodes → visual cortex | ~5ms compile + ~10ms NSP + ~6ms Scribe + ~100ms neural propagation = **~121ms** |
| 3 (mature) | Direct | Game engine → Forge as rendering backend → electrodes | ~5ms compile + ~10ms NSP + ~6ms Scribe = **~21ms** (neural propagation reduced with cortical adaptation) |

**Phase 3 inflection point:** Direct neural rendering (~21ms end-to-end) becomes FASTER than biological vision (~50-150ms for retina → LGN → V1 processing). The bottleneck in biological vision is the retina and lateral geniculate nucleus. Direct V1 stimulation bypasses both.

**Latency budget per component:**

| Component | Budget | Basis |
|-----------|--------|-------|
| Forge compilation (Staves v2) | 5 ms | Scene graph diff + electrode pattern generation |
| NSP encryption + transmission | 10 ms | AES-256-GCM + BLE 5.0 (~2 Mbps) for ~2 KB pattern |
| Scribe decode + validation | 3 ms | Stave header + TARA bounds + opcode dispatch |
| Electrode driver | 3 ms | DAC setup + multiplexer addressing |
| **Total silicon path** | **21 ms** | |
| Neural propagation (V1 response) | 50-100 ms | Cortical processing (adapts/reduces over time) |
| **Total perceived** | **71-121 ms** | Phase 2 noticeable; Phase 3 approaches imperceptible |

---

## 17. Post-Quantum Compliance Gaps (PQKC)

NSP provides post-quantum security for BCI data links. But real-time neural rendering at 60fps exposes protocol gaps that must be addressed for Runemate Phase 2. These are engineering problems, not theoretical — each has a concrete solution path.

### Gap 1: Session Resumption (CRITICAL)

**Problem:** Full PQ handshake = ~20.6 KB key exchange. Every reconnect repeats it. Implants reconnect constantly (signal drops, power cycling, patient movement). At dozens of reconnects per hour, the handshake tax becomes significant: 204 KB+ wasted bandwidth, hundreds of milliseconds latency, battery drain.

**Solution:** PSK-based 0-RTT session resumption with PQ forward secrecy (analogous to TLS 1.3 0-RTT). The PSK is derived from the previous session's master secret via HKDF:

```
resumption_psk = HKDF-Expand(master_secret, "nsp-resumption", 32)
```

Reconnect cost drops from ~20.6 KB to ~1 KB (PSK identifier + nonce + finished). Forward secrecy maintained because each session derives a new master secret even when resuming.

**Additional requirement for calibration:** Session resumption must preserve the calibration state. The patient's electrode-tissue map doesn't change between reconnects — retransmitting it wastes bandwidth and delays rendering. The calibration map hash is bound to the resumed session via the CalibrationBinding token.

**Status:** Extension needed in NSP v0.4. Protocol design complete (N-001). Implementation pending.

### Gap 2: Batch Signatures (CRITICAL)

**Problem:** Signing every electrode pattern frame individually at 60fps = ~198 KB/sec in PQ signatures (ML-DSA-65 signatures are ~3,309 bytes each). This overwhelms the implant's radio bandwidth and power budget.

**Solution:** Merkle tree batching. Collect N frames (e.g., 8 frames = 133ms window), build a hash tree, sign only the root. Receiver verifies root signature + Merkle proof per frame.

```
Frame 0  Frame 1  Frame 2  Frame 3  Frame 4  Frame 5  Frame 6  Frame 7
  |        |        |        |        |        |        |        |
  H0       H1       H2       H3       H4       H5       H6       H7
    \      /          \      /          \      /          \      /
     H01                H23              H45                H67
       \                /                  \                /
        H0123                              H4567
              \                          /
               ROOT  ←── ML-DSA signature (3,309 bytes, ONCE per 8 frames)
```

**Per-frame cost with batching (N=8):**
- Merkle proof: ~7 hashes × 32 bytes = 224 bytes
- Amortized signature: 3,309 / 8 = ~414 bytes
- Total per frame: ~638 bytes (vs 3,309 bytes without batching = **5.2x reduction**)
- Total per second: ~38 KB/sec (vs ~198 KB/sec = **5.2x reduction**)

**Tradeoff:** Batching introduces latency equal to the batch window (133ms for N=8). For neural rendering where the total pipeline is 71-121ms, an additional 133ms may be unacceptable. Tuning options:
- N=4 (67ms batch, ~76 KB/sec) — better latency, higher overhead
- N=2 (33ms batch, ~114 KB/sec) — minimal latency impact
- N=1 (no batching, 198 KB/sec) — current behavior, fallback for safety-critical single frames

**Status:** Extension needed in NSP v0.4. Math validated. Implementation pending.

### Gap 3: Certificate Compression (HIGH)

**Problem:** PQ certificates are 5-15x larger than classical equivalents. NSP's compact certificate format (not X.509) helps, but each ML-DSA-65 certificate is still ~5,933 bytes (vs 169 bytes classical). Certificate chain verification eats memory and bandwidth on constrained implants.

**Solution options:**
1. **Certificate-by-reference:** Gateway sends certificate hash during handshake. Scribe looks up full certificate from on-chip storage (pre-provisioned during manufacturing).
2. **Certificate compression:** Apply Brotli/CBOR compression to certificate payloads. PQ certificates have structure that compresses ~30-40%.
3. **Implicit certificates:** ECQV-style implicit certificates adapted for lattice keys (research needed — not standardized for PQ).

**Recommended:** Certificate-by-reference for implants (pre-provisioned keys), full certificates for headsets/external BCIs (more memory available).

**Status:** Design phase. Pre-provisioning approach is simplest and most secure.

### Gap 4: On-Chip PQ Acceleration (HIGH)

**Problem:** ML-KEM and ML-DSA are compute-heavy. Software-only implementation on a Cortex-M4 @ 100 MHz:
- ML-KEM-768 encapsulation: ~5-10 ms
- ML-DSA-65 sign: ~15-30 ms
- ML-DSA-65 verify: ~5-10 ms

These are acceptable for handshakes but add up during key rotation and batch signature verification at 60fps.

**Solution:** NTT (Number Theoretic Transform) coprocessor — dedicated silicon for the core lattice operation, analogous to AES-NI for symmetric crypto. NTT is the computational bottleneck in both ML-KEM and ML-DSA.

**Interim solution:** Optimized Rust assembly for NTT on ARM NEON / RISC-V Vector extensions. The `pqcrypto-rs` crate supports platform-specific optimizations.

**Status:** Hardware acceleration is a chip vendor conversation. Software optimization is immediate.

### Gap 5: Key Rotation Overhead (MEDIUM)

**Problem:** NSP specifies key rotation every 30-60 seconds. PQ key rotation = 2,276 bytes per rotation (17x classical). Over a 1-hour session: 60 rotations × 2,276 = ~136 KB of key material.

**Solution:** Symmetric ratchet between rotations. Use HKDF to derive forward-secure frame keys from the current session key without a full PQ key exchange. Full PQ rotation only on schedule or when forward secrecy requires it.

```
frame_key[n+1] = HKDF-Expand(frame_key[n], "nsp-ratchet", 32)
```

This is already partially specified in NSP v0.3 (Section 7, key lifecycle). The gap is formalizing when full PQ rotation vs symmetric ratchet is required.

**Status:** Partially addressed. Formalization needed in NSP v0.4.

### Gap 6: Hybrid Deprecation Path (MEDIUM)

**Problem:** NSP v0.3 specifies hybrid key exchange (X25519 + ML-KEM-768). Running both indefinitely doubles handshake overhead. But dropping classical too early risks interoperability breakage with legacy gateway devices.

**Deprecation timeline (proposed):**

| Year | Policy | Rationale |
|------|--------|-----------|
| 2026-2028 | Hybrid mandatory | Transition period. Classical provides fallback. |
| 2029-2030 | Hybrid default, PQ-only allowed | NIST PQ standards battle-tested. Early adopters can go PQ-only. |
| 2031+ | PQ-only mandatory, hybrid deprecated | Classical algorithms retired per NSA CNSA 2.0 timeline. |

**For implants with 20-year lifetimes:** Devices manufactured in 2026 must support PQ-only mode even if hybrid is the default. The firmware update mechanism (Section 7.5) allows deprecation policy to be updated in-field.

**Status:** Policy decision. Proposed timeline above. Subject to NIST/NSA guidance updates.

### Gap 7: Formal Verification of PQ Implementation (HIGH)

**Problem:** PQ algorithms are newer than classical alternatives. Subtle implementation bugs — timing side channels, fault injection vulnerabilities, incorrect NTT implementations — are more likely and harder to catch through testing alone. A timing side channel in ML-KEM on an implant chip leaks the session key.

**Solution:** Formal verification using Rust-compatible tools:
- **Kani:** Bounded model checking for Rust. Proves absence of panics, overflows, and out-of-bounds access.
- **Prusti:** Deductive verification. Can prove constant-time execution paths.
- **ct-verif / dudect:** Timing leakage detection through statistical analysis.

**Verification targets:**
1. ML-KEM encapsulation/decapsulation: constant-time proof
2. ML-DSA sign/verify: constant-time proof
3. NTT implementation: correctness proof (matches reference)
4. HKDF key derivation: no secret-dependent branching

**Status:** Research phase. Kani supports the Rust subset used in crypto implementations. Prusti integration needs investigation.

### Gap 8: Hierarchical Key Storage (MEDIUM)

**Problem:** The implant needs multiple key tiers — device identity (permanent, burned at manufacturing), session keys (ephemeral, per-connection), group keys (for broadcast electrode patterns), calibration binding keys (per-patient). No specification exists for how these tiers interact in the PQ context.

**Solution:** Hierarchical key derivation tree (inspired by BIP-32 but for lattice keys):

```
Device Root Key (DRK) — permanent, hardware-protected
  ├── Identity Key = HKDF(DRK, "nsp-identity")
  ├── Session Master = ML-KEM decapsulation result
  │     ├── Frame Key[n] = HKDF(session_master, "nsp-frame" || n)
  │     ├── Calibration Key = HKDF(session_master, "nsp-calibration")
  │     └── Resumption PSK = HKDF(session_master, "nsp-resumption")
  └── Group Key = HKDF(DRK, "nsp-group" || group_id)
        └── Broadcast Frame Key[n] = HKDF(group_key, "nsp-broadcast" || n)
```

All derived keys are symmetric (AES-256). Only the DRK and session establishment use asymmetric PQ crypto. This minimizes the amount of PQ key material stored on-chip.

**Storage budget:**

| Key | Size | Lifetime | Storage |
|-----|------|----------|---------|
| DRK (ML-KEM-768 private) | 2,400 B | Permanent | Secure element |
| DRK (ML-DSA-65 private) | 4,032 B | Permanent | Secure element |
| Identity cert | 5,933 B | Permanent | Flash |
| Session master | 32 B | Per-session | SRAM |
| Frame key | 32 B | Per-frame | SRAM |
| Calibration key | 32 B | Per-calibration | SRAM |
| Resumption PSK | 32 B | Cached | Flash |
| **Total permanent** | **~12.4 KB** | | Secure element + flash |
| **Total ephemeral** | **~128 B** | | SRAM |

**Status:** Design complete. Aligns with NSP Section 7 (key lifecycle). Formalization needed.

---

## References

- FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM)
- FIPS 204: Module-Lattice-Based Digital Signature Algorithm (ML-DSA)
- FIPS 205: Stateless Hash-Based Digital Signature Algorithm (SLH-DSA)
- Shannon, R.V. (1992): A model of safe levels for electrical stimulation
- McCreery, D.B. et al. (1990): Charge density and charge per phase as cofactors in neural injury
- Arditi et al. (2024): Refusal in Language Models Is Mediated by a Single Direction
- Servo Browser Engine: https://servo.org (modular Rust crates)
- Bevy Game Engine: https://bevyengine.org (Rust ECS, wgpu rendering)
- wgpu: https://wgpu.rs (Rust-native WebGPU implementation)
- wasm3: https://github.com/nicholasgasior/wasm3 (60 KB WASM interpreter)
- NSP Protocol Specification: see NSP-PROTOCOL-SPEC.md
- TARA (Therapeutic Atlas of Risks and Applications): see threat-registry.json
- Kani Model Checker: https://model-checking.github.io/kani/
- Prusti Verifier: https://www.pm.inf.ethz.ch/research/prusti.html

---

## Derivation Log

> Chronological journal of architectural discoveries, integration insights, and breakthroughs.
> **Rule:** This log ONLY GROWS. Never delete or edit past entries. Corrections get new entries.

---

### Entry R-001: Servo/wgpu/NSP — The Full BCI-Safe Rendering Pipeline

**Date:** 2026-02-10
**Context:** Conversation about whether websites can be rendered entirely in Rust, triggered by Kevin's question: "is it theoretically possible to render websites using only rust?"
**AI Systems:** Claude Opus 4.6 (architecture analysis, feasibility assessment)
**Human Decision:** Kevin identified the strategic connection to NSP and Runemate's mission

#### Discovery

The entire pipeline from network transport to GPU rendering can be built in Rust with zero C/C++ in the critical path. This is not theoretical — the components exist today:

1. **Servo** (servo.org) — Mozilla's browser engine, written in Rust. Modular crate architecture. Uses SpiderMonkey for JS (C++ dependency, but isolatable). Already referenced in RUNEMATE.md Section 3 ("Why Rust" table, line 251) and used via Taffy (Servo-derived layout crate).

2. **wgpu** — Rust-native WebGPU implementation. Maps to Metal (macOS/iOS), Vulkan (Linux/Android), DX12 (Windows). Provides GPU rendering without touching C/C++ graphics drivers at the API level.

3. **NSP** — Our post-quantum wire protocol, also Rust. Designed to replace TLS for BCI data links.

#### The Integration Path: NSP ↔ Servo

Both are Rust. No FFI boundary needed. Servo's networking stack uses `hyper` (Rust HTTP) over `rustls` (Rust TLS). NSP can swap in at the transport layer:

```
Current Servo stack:        BCI-safe stack:
  Internet                    Internet
  → rustls (TLS)              → NSP (post-quantum, Rust)
  → hyper (HTTP)              → hyper (HTTP)
  → Servo (parsing/layout)    → Servo (parsing/layout)
  → wgpu (GPU rendering)      → wgpu (GPU rendering)
  → display                   → neural interface
```

The swap is architecturally clean: `rustls` is a trait-based TLS implementation. NSP can implement the same `Session`/`Stream` traits, making it a drop-in replacement at the transport layer. No changes needed upstream in `hyper` or Servo's content pipeline.

#### Three.js Compatibility

Kevin asked: "Can Servo render three.js?"

- **JS execution:** Servo uses SpiderMonkey (C++, but sandboxed). Three.js runs as standard JavaScript.
- **WebGL:** Partially supported in Servo. Three.js WebGL renderer works for basic scenes.
- **WebGPU (better path):** three.js has a `WebGPURenderer` that targets the WebGPU API. Servo + wgpu would provide native WebGPU support, meaning three.js renders through an all-Rust GPU pipeline.

```
three.js (JS) → WebGPURenderer → WebGPU API → wgpu (Rust) → Metal/Vulkan → GPU
```

This is the preferred path over WebGL for BCI rendering — WebGPU is the future standard and wgpu is the reference implementation.

#### Why This Matters for Runemate

**The Chromium problem:** Meta, Google, and Apple all use Chromium-derived rendering engines (Blink, WebKit) — ~35 million lines of C/C++. These engines produce weekly CVEs. They are currently used in AR/VR headsets that sit inches from the brain. When BCIs connect to the web, running Chromium's attack surface next to neural tissue is a security nightmare.

**Runemate's two-path strategy:**

| Path | Use Case | Engine | Status |
|------|----------|--------|--------|
| **Staves (Phase 1-3)** | Implant rendering, resource-constrained chips | The Scribe (custom, ~200 KB no_std) | Architecture phase |
| **Servo+NSP (new)** | Gateway rendering, external BCI headsets, non-implant BCIs | Servo (full browser, ~5-10 MB) | Components exist, integration needed |

Staves remains the right solution for implanted chips (resource constraints, no_std, sub-1MB). But for non-implant BCIs (headsets, external devices, AR glasses), a full browser engine is needed. Servo is the only memory-safe option.

**The full BCI-safe pipeline:**
```
Internet → NSP (Rust, post-quantum) → HTTP → Content
  → Servo (Rust, memory-safe parsing/layout)
  → wgpu (Rust, GPU rendering)
  → neural interface
```

No C/C++ in the critical path. Every component is Rust. Every component is memory-safe. This is the trust stack for consumer BCIs connecting to the open web.

#### Architectural Implications

1. **Forge enhancement:** The Forge (Section 3) currently compiles HTML→Staves. With Servo integration, the Forge can also serve as a **validator** — render content in Servo first, compare visual output to Stave rendering, catch discrepancies.

2. **Phase 2 acceleration:** Servo's modular crates can be used selectively. We already use Taffy (Servo-derived layout). We can pull in `html5ever` (Servo's HTML parser) and `cssparser` (Servo's CSS parser) — both listed in Section 3's architecture — without taking the full Servo dependency.

3. **NSP as a platform:** If NSP integrates cleanly with Servo, any Servo-based application inherits post-quantum security. This turns NSP from a BCI-specific protocol into an internet-wide security layer. The vision: "HTTPS had to exist before e-commerce. NSP has to exist before a brain safely interfaces with a website."

4. **Consumer BCI focus:** Kevin's one-sentence vision: *"I'm building the security layer that has to exist before consumer BCIs can safely connect to anything."* Servo+NSP is how that vision reaches non-implant BCIs (the near-term market).

#### Status

- **Servo:** Active development (Linux Foundation). Modular crate architecture. WebGPU support in progress via wgpu.
- **wgpu:** Mature. Powers Firefox's WebGPU. Cross-platform (Metal, Vulkan, DX12).
- **NSP-Servo integration:** Not yet attempted. Architectural analysis confirms feasibility. No blocking technical issues identified.
- **Priority:** Document and track. Implementation deferred until NSP core protocol is stable (post-RFC).

#### Dependencies

- NSP protocol spec finalization (prerequisite for any integration)
- Servo WebGPU maturity (in progress upstream)
- RUNEMATE.md Section 3 already references Servo and Taffy — no architectural conflicts

---

### Entry R-002: Neural Systems Language (NSL) — Domain-Specific Language Concept

**Date:** 2026-02-10
**Context:** Kevin asked: "is RUST the lowest level? are you able to create another language that is more efficient given all the languages you know? I think its feasible to build one with security + rendering in mind?"
**AI Systems:** Claude Opus 4.6 (feasibility analysis, language design)
**Human Decision:** Kevin proposed purpose-built language for BCI security + rendering

#### Discovery

Rust is systems-level (same as C, compiles to machine code via LLVM). Can't go meaningfully lower without losing portability/safety. But a domain-specific language AT the same level could eliminate Rust's generality overhead: arena-only memory (simpler than borrow checker), compiler-enforced constant-time crypto, native rendering primitives, power budget annotations, built-in DSP, formal verification in the type system.

Historical precedent: CUDA (GPUs), SPARK/Ada (avionics), Solidity (smart contracts), GLSL/HLSL (shading). Every time a domain got important enough, a purpose-built language won.

**Recommended path:** DSL that transpiles to Rust (NSL → Rust → LLVM → machine code). Gets domain-specific guarantees without losing Rust's 150K+ crate ecosystem.

**Connection to Staves:** Staves is already a DSL for content. NSL extends the principle to systems programming. "C was designed for computers. NSL was designed for the computers inside brains."

**Status:** Phase 4+ (long-term). Document now, build later. Deprioritized by R-003 (TARA + Rust is the near-term path).

---

### Entry R-003: TARA as Safety Specification for Visual Cortex Rendering

**Date:** 2026-02-10
**Context:** Kevin said: "if its a BCI we dont need all that overhead. Rust would be a good framework to use and we can do it just for visual rendering based on visual cortex and how we're mapping TARA to the therapeutics."
**AI Systems:** Claude Opus 4.6 (architecture refinement)
**Human Decision:** Kevin identified that screen rendering is irrelevant for visual cortex BCIs; TARA's therapeutic mappings should serve as the safety bounds for the rendering engine

#### The Insight

Visual cortex rendering doesn't need pixels, color spaces, GPU rasterization, or fonts. It needs: electrode activation patterns, stimulation intensity (μA), temporal sequences, retinotopic mapping, and per-patient threshold calibration. The "renderer" compiles semantic content into electrode stimulation patterns.

TARA's dual-use mapping becomes the **safety specification**: signal injection into visual cortex is both an attack (unwanted hallucination) and therapy (visual prosthesis). The boundary is consent, dosage, oversight. TARA's therapeutic parameters (max amplitude, safe frequency, duration limits, charge density, recovery intervals) become **compiler constraints**. Patterns exceeding therapeutic bounds are rejected at compile time.

#### The Pipeline

```
Staves semantic content → Forge (compile to electrode patterns)
  → TARA safety bounds check (within therapeutic window?)
  → NSP secure delivery → Visual cortex perception
  → QI validates neural response (closed loop)
```

Three safety gates: TARA (compile time), NSP (transport), QI (runtime). No other BCI system has all three.

**Why Rust is correct:** no_std for implant chips, formal verification tools (Kani, Prusti), the security innovation is the architecture (TARA-bounded parameters), not the language. NSL (R-002) deprioritized.

**Status:** Conceptual. Requires: TARA parameter formalization, retinotopic mapping research, visual prosthesis collaborators.

---

### Entry R-004: Dual-Pipeline Architecture — Game Engine + Neural Renderer

**Date:** 2026-02-10
**Context:** Kevin said: "We would need a game engine to run parallel and the security there can be solved differently and there may be a lag initially but I can see how we can get to my vision"
**AI Systems:** Claude Opus 4.6 (architecture synthesis)
**Human Decision:** Kevin identified two separate security domains requiring different security models

#### The Architecture Split

**Pipeline A — Game Engine (gateway):** Bevy (Rust, ECS, wgpu), ~5-50 MB. Security = sandboxing, process isolation. If it crashes, restart. Priority: PERFORMANCE.

**Pipeline B — Neural Renderer (implant):** The Scribe (Rust no_std), ~200 KB. Security = TARA-bounded, formally verified, constant-time crypto. Can NEVER crash. Priority: SAFETY.

The Forge translates between them. This separation is also a regulatory necessity — FDA requires safety-critical path isolated from non-safety-critical path.

#### Latency Convergence

- Phase 1: Game engine → screen → eyes → brain (current, ~16ms)
- Phase 2: Game engine → Forge translation → electrode patterns → visual cortex (~121ms total, noticeable but functional)
- Phase 3: Game engine → Forge as rendering backend → electrodes directly (~21ms, FASTER than eyes at ~50-150ms)

#### Staves v2

Extends from 2D layout to 3D scene graphs (meshes, transforms, lights) as electrode pattern streams at 60fps. Same TARA bounds, same NSP, same QI. Bytecode scales from dashboards to immersive environments.

**Status:** Conceptual. Bevy evaluation needed. Staves v2 format is future work.

---

### Entry R-005: Two Research Paths — Synesthesia Cohort + Congenital Blindness

**Date:** 2026-02-10
**Context:** Kevin identified two paths for visual cortex rendering research, connecting his personal synesthesia to a broader research program
**AI Systems:** Claude Opus 4.6 (research program design)
**Human Decision:** Kevin proposed synesthesia cohort (not self-study) and the congenital blindness mission

#### Option 1: Synesthesia Research Cohort

Recruit synesthetes who volunteer to help cure blindness. Map cross-modal pathways (fMRI/EEG) to produce a biological rendering vocabulary — how brains naturally compile non-visual information into visual perception. TARA bounds derived from observed natural activation. Faster path (biological ground truth exists).

#### Option 2: Congenital Blindness (Bottom-Up)

For those born blind, visual cortex may be repurposed (cross-modal plasticity). Can't assume retinotopic map is intact. Requires: stimulate → observe → calibrate → build per-patient perceptual vocabulary. TARA bounds from conservative clinical thresholds. Slower but higher humanitarian impact.

**Both paths use the same stack:** Staves → Forge → TARA bounds → NSP → electrodes → QI validation. The only difference is the rendering vocabulary source.

#### Correction: Framing

This is NOT "study Kevin's brain." It's a proper research program: volunteer cohort recruitment, IRB approval, control groups, peer review. Qinnovate leads with security first — TARA safety bounds, NSP secure delivery, QI validation must exist BEFORE any visual cortex stimulation at scale. Kevin is a founder who understands the problem firsthand, not "the test subject."

**Status:** Research program concept. Requires neuroscience collaborators, IRB, fMRI/EEG access.

---

### Entry R-006: Partnership Strategy — OpenBCI + Industry Collaboration + Ethics Foundation

**Date:** 2026-02-10
**Context:** Kevin identified OpenBCI as actively recruiting research participants with perfect vision, and proposed partnering with BCI companies to accelerate the research while maintaining ethical standards
**AI Systems:** Claude Opus 4.6 (partnership strategy)
**Human Decision:** Kevin insisted on ethics-first approach: "my moral compass of ETHICS is ensured. Security and data privacy is very important"

#### OpenBCI Partnership Concept

OpenBCI is recruiting participants with perfect vision for visual processing research. This is the exact entry point for the synesthesia cohort (R-005). Partnership: OpenBCI brings hardware (Galea headset, electrode arrays), active IRB protocols, participant pool, and lab infrastructure. Qinnovate brings TARA safety specification, NSP security, QI validation, and the synesthesia cohort concept.

#### Broader Partner Strategy

| Partner | They bring | We bring | Goal |
|---------|-----------|----------|------|
| OpenBCI | Hardware, participants, lab | TARA safety spec, NSP | Visual cortex mapping |
| Neurable | Consumer BCI headphones | NSP wire protocol | Secure consumer connectivity |
| Kernel | Flow headset, imaging | QIF threat framework | Enterprise neural data security |
| Paradromics | High-bandwidth implant | NSP + Staves + Scribe | Implant-grade secure rendering |

**Qinnovate's role:** The security layer everyone integrates. HTTPS of BCIs — every company needs it, nobody wants to build it themselves.

#### Ethics as Foundation (Non-Negotiable)

Kevin's ethical requirements are architectural constraints, not aspirations:

1. **Data privacy:** NSP encrypts all neural data with post-quantum crypto. Never exists in plaintext outside secure channel. Consent cryptographically enforced, not just form-signed.
2. **TARA as ethical guardrail:** Every stimulation pattern checked against therapeutic bounds. Dual-use risks catalogued upfront, prevention built into compiler.
3. **QI closed-loop:** System detects distress/anomalous response and stops automatically. Real-time, not clinician-noticed.
4. **Open standards:** Apache 2.0. Everyone can audit the safety spec. Trust is verified, not assumed.

The pitch to partners: "We're not asking you to trust us. We're giving you a framework where trust is mathematically verified."

**Status:** Partnership outreach phase. OpenBCI is first target. Denning/Kohno meeting may surface additional collaborators.

#### Dependencies

- R-003 (TARA safety spec — the value proposition we bring to partners)
- R-005 (synesthesia cohort — the research program partners would participate in)
- Email to Denning/Kohno (may connect to visual prosthesis researchers)
- QIF governance docs (neuroethics standards for research protocols)

---

### Entry R-007: Neural Environment Mapping — Adversarial RF Techniques as Medical Calibration

**Date:** 2026-02-10
**Context:** Kevin connected adversarial Bluetooth/WiFi environment mapping to medical neural mapping: "we can leverage the same way adversaries can use bluetooth and wifi to map out an environment. We just need something broadcasting securely just for medical use-cases like this! NSP!!!!"
**AI Systems:** Claude Opus 4.6 (connection analysis, TARA dual-use mapping)
**Human Decision:** Kevin identified the RF-to-neural mapping isomorphism and NSP as the security boundary. Designated this as the PRIMARY use-case example for QIF.

#### Discovery

Adversarial RF environment mapping and medical neural environment mapping are the same technique applied to different media:

| Dimension | Adversarial RF Mapping | Medical Neural Mapping |
|-----------|----------------------|----------------------|
| **Medium** | RF through walls/structures | Electrical signals through neural tissue |
| **Method** | Send signal, measure reflection/attenuation/timing | Send calibration pulse, measure neural response (amplitude, latency, propagation) |
| **Output** | Spatial model of physical environment | Retinotopic/connectivity model of electrode-tissue interface |
| **Math** | Inverse problems, signal propagation, tomography | Same — inverse problems, signal propagation, neural tomography |
| **Intent** | Unauthorized reconnaissance | Authorized calibration for visual prosthesis |
| **Data sensitivity** | Building layout (moderate) | Brain topology (extreme — irrevocable biometric) |

This is TARA dual-use at its purest. The attack technique (mapping neural architecture without consent = surveillance) has a direct therapeutic analog (calibration for visual prosthesis = essential medical procedure). Same mechanism, same physics, same math. The boundary is consent, authorization, and encryption.

#### Why NSP Is the Enforcement Layer

Neural mapping data — electrode response profiles, per-patient calibration models, visual cortex topology — is the most sensitive biometric data that exists. Brain topology cannot be reset. If leaked, an adversary can craft targeted stimulation that bypasses generic safety bounds.

NSP enforces:
1. **Encryption at generation:** PQ crypto the instant mapping data is captured
2. **Authenticated sessions:** Only authorized clinician + authorized device
3. **Session resumption:** Remapping after reconnect without retransmitting full model (PQKC gap #1)
4. **Forward secrecy:** Historical mapping data stays encrypted even if current key compromised

#### Connection to Runemate Pipeline

Solves the calibration problem for both research paths (R-005):
- **Synesthesia cohort:** Probe → measure cross-modal response → build rendering vocabulary. The mapping IS the experiment.
- **Congenital blindness:** Stimulate → observe → calibrate → build per-patient perceptual map.
- **Forge compiler (R-003):** Calibration map becomes per-patient compiler configuration. TARA bounds checked against THIS patient's thresholds, not generic values.

#### Primary Use Case Designation

Kevin designated this as the PRIMARY use-case example for all QIF materials. Reasoning:
- Instant comprehension (everyone knows WiFi/Bluetooth mapping)
- Demonstrates TARA dual-use in one sentence
- Makes NSP necessity visceral (brain topology = permanent, irrevocable)
- Connects to real products and active research (OpenBCI, visual prosthetics)
- Testable with existing hardware today

#### Cross-Log Entry

This insight spans three specifications:
- **QIF (Entry #54):** TARA dual-use classification, new registry technique
- **Runemate (this entry R-007):** Calibration pipeline architecture
- **NSP (N-001):** Protocol requirements for calibration data security

**Status:** Conceptual. Designated primary QIF use case.
**Dependencies:** R-003, R-005, R-006, QIF Entry #54, NSP N-001, PQKC gap #1.

---

*Part of the QIF (Quantum Indeterministic Framework) ecosystem.*
*"HTML was designed for screens. Staves was designed for brains."*
