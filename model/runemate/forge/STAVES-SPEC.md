# Staves v1.0 Binary Format Specification

## Overview

Staves is a compact, multimodal bytecode format for brain-computer interface rendering. It encodes visual layouts, auditory tones, and haptic pulses in a single binary stream. Designed for minimal memory footprint, fast on-chip parsing, and post-quantum encrypted delivery via NSP.

**Not HTML.** Staves is compiled from its own declarative DSL (see STAVES-DSL-SPEC.md). No web technologies are involved.

## File Structure

```
┌──────────────────────────────┐
│  Magic (4 bytes): "STV1"     │
│  Version (2 bytes): 0x01 00  │
├──────────────────────────────┤
│  Header (19 bytes)           │
│    flags (1 byte)            │
│    string_table_offset (4B)  │
│    style_table_offset (4B)   │
│    tone_table_offset  (4B)   │
│    node_count (2 bytes)      │
│    total_size (4 bytes)      │
├──────────────────────────────┤
│  Node Stream                 │
│    (variable length opcodes) │
├──────────────────────────────┤
│  String Table                │
│    count (2 bytes)           │
│    entries: len(2B) + utf8   │
├──────────────────────────────┤
│  Style Table                 │
│    count (2 bytes)           │
│    entries: prop_count(1B)   │
│      + packed properties     │
├──────────────────────────────┤
│  Tone/Pulse Table            │
│    count (2 bytes)           │
│    entries: type(1B) + data  │
└──────────────────────────────┘
```

## Magic & Version

| Field   | Size    | Value         |
|---------|---------|---------------|
| Magic   | 4 bytes | `0x53 54 56 31` ("STV1") |
| Version | 2 bytes | `0x01 0x00` (major.minor) |

## Header (19 bytes)

| Field              | Size    | Description |
|--------------------|---------|-------------|
| flags              | 1 byte  | Bit 0: has_styles, Bit 1: has_tones, Bit 2: strict_mode, Bits 3-7: reserved |
| string_table_offset| 4 bytes | Byte offset to string table (LE) |
| style_table_offset | 4 bytes | Byte offset to style table (LE) |
| tone_table_offset  | 4 bytes | Byte offset to tone/pulse table (LE) |
| node_count         | 2 bytes | Total node opcodes in the stream |
| total_size         | 4 bytes | Total file size in bytes |

## Opcodes — Visual

| Opcode           | Byte | Operands | Description |
|------------------|------|----------|-------------|
| ELEMENT_OPEN     | 0x01 | tag(1B)  | Open element with tag byte |
| ELEMENT_CLOSE    | 0x02 | (none)   | Close current element |
| TEXT             | 0x03 | str_idx(2B) | Text node |
| STYLE_REF        | 0x04 | idx(2B)  | Apply style from style table |
| ATTR_KEY         | 0x05 | str_idx(2B) | Attribute name |
| ATTR_VAL         | 0x06 | str_idx(2B) | Attribute value |
| STAVE_START      | 0x07 | str_idx(2B) | Begin named stave |
| STAVE_END        | 0x08 | (none)   | End named stave |
| SEPARATOR        | 0x09 | (none)   | Visual separator |

## Opcodes — Auditory

| Opcode           | Byte | Operands | Description |
|------------------|------|----------|-------------|
| TONE_REF         | 0x20 | idx(2B)  | Trigger tone from tone table |

## Opcodes — Haptic

| Opcode           | Byte | Operands | Description |
|------------------|------|----------|-------------|
| PULSE_REF        | 0x30 | idx(2B)  | Trigger pulse from tone/pulse table |

## Tag Encoding (1 byte)

| Tag       | Byte | | Tag       | Byte |
|-----------|------|-|-----------|------|
| column    | 0x01 | | heading-1 | 0x10 |
| row       | 0x02 | | heading-2 | 0x11 |
| section   | 0x03 | | heading-3 | 0x12 |
| list      | 0x04 | | heading-4 | 0x13 |
| grid      | 0x05 | | heading-5 | 0x14 |
| text      | 0x08 | | heading-6 | 0x15 |
| button    | 0x09 | | metric    | 0x18 |
| input     | 0x0A | | separator | 0x19 |
| image     | 0x0B | | spacer    | 0x1A |
| link      | 0x0C | | item      | 0x1B |

No "custom" tags. Unknown tags are a compile error. The vocabulary is closed.

## String Table

Deduplicated, length-prefixed UTF-8 strings. Referenced by 2-byte index (LE).

```
┌─────────────────────────────┐
│ count: u16 (LE)             │
├─────────────────────────────┤
│ Entry 0:                    │
│   length: u16 (LE)          │
│   data: [u8; length]        │
├─────────────────────────────┤
│ Entry 1: ...                │
└─────────────────────────────┘
```

Maximum 65535 strings, each up to 65535 bytes. All strings validated as UTF-8 with no control characters except `\n` and `\t`.

## Style Table

Each entry is a set of packed visual properties.

```
┌─────────────────────────────┐
│ count: u16 (LE)             │
├─────────────────────────────┤
│ StyleSet 0:                 │
│   prop_count: u8            │
│   Property 0:               │
│     prop_id: u8             │
│     value: (variable)       │
│   Property 1: ...           │
├─────────────────────────────┤
│ StyleSet 1: ...             │
└─────────────────────────────┘
```

### Property IDs

| Property         | ID   | Value Encoding |
|------------------|------|----------------|
| width            | 0x01 | value(4B) |
| height           | 0x02 | value(4B) |
| margin-top       | 0x03 | value(4B) |
| margin-right     | 0x04 | value(4B) |
| margin-bottom    | 0x05 | value(4B) |
| margin-left      | 0x06 | value(4B) |
| padding-top      | 0x07 | value(4B) |
| padding-right    | 0x08 | value(4B) |
| padding-bottom   | 0x09 | value(4B) |
| padding-left     | 0x0A | value(4B) |
| background-color | 0x0B | rgba(4B) |
| color            | 0x0C | rgba(4B) |
| font-size        | 0x0D | u8 |
| direction        | 0x0E | enum(1B): 0=row, 1=column |
| justify          | 0x0F | enum(1B): 0=start, 1=center, 2=end, 3=between, 4=around, 5=evenly |
| align            | 0x10 | enum(1B): 0=start, 1=center, 2=end, 3=stretch |
| display          | 0x11 | enum(1B): 0=block, 1=flex, 2=grid, 3=inline, 4=none |
| position         | 0x12 | enum(1B): 0=static, 1=relative, 2=absolute, 3=fixed |
| top              | 0x13 | value(4B) |
| right            | 0x14 | value(4B) |
| bottom           | 0x15 | value(4B) |
| left             | 0x16 | value(4B) |
| border-width     | 0x17 | u8 (px) |
| border-color     | 0x18 | rgba(4B) |
| border-radius    | 0x19 | value(4B) |
| opacity          | 0x1A | u8 (0-255 maps to 0.0-1.0) |
| overflow         | 0x1B | enum(1B): 0=visible, 1=hidden, 2=scroll, 3=auto |
| text-align       | 0x1C | enum(1B): 0=left, 1=center, 2=right, 3=justify |
| font-weight      | 0x1D | u16 (100-900) |
| font-family      | 0x1E | str_idx(2B) |
| gap              | 0x1F | value(4B) |
| wrap             | 0x20 | enum(1B): 0=nowrap, 1=wrap |
| grow             | 0x21 | u8 |
| shrink           | 0x22 | u8 |
| z-index          | 0x23 | i16 |
| visibility       | 0x24 | enum(1B): 0=visible, 1=hidden |
| max-width        | 0x25 | value(4B) |
| min-width        | 0x26 | value(4B) |
| max-height       | 0x27 | value(4B) |
| min-height       | 0x28 | value(4B) |

### Value Encoding (4 bytes)

| Byte 0 (unit) | Bytes 1-3 (value, LE i24) |
|----------------|--------------------------|
| 0x00 = auto    | (ignored) |
| 0x01 = px      | pixels (clamped +-32767) |
| 0x02 = percent  | basis points (10000 = 100%) |
| 0x03 = vh      | 0.1% units (1000 = 100vh) |
| 0x04 = vw      | 0.1% units (1000 = 100vw) |

### Color Encoding (4 bytes)

RGBA: `[r, g, b, a]`, 1 byte per channel.

## Tone/Pulse Table

Mixed table of auditory tones and haptic pulses.

```
┌─────────────────────────────┐
│ count: u16 (LE)             │
├─────────────────────────────┤
│ Entry 0:                    │
│   type: u8                  │
│     0x01 = tone             │
│     0x02 = pulse            │
│   data: (type-dependent)    │
├─────────────────────────────┤
│ Entry 1: ...                │
└─────────────────────────────┘
```

### Tone Entry (8 bytes)

| Field     | Size | Encoding |
|-----------|------|----------|
| frequency | 2B   | u16 Hz (20-20000, clamped) |
| duration  | 2B   | u16 milliseconds |
| amplitude | 1B   | u8 (0-255 maps to 0.0-1.0) |
| waveform  | 1B   | 0=biphasic, 1=sine, 2=square |
| channel   | 1B   | u8 electrode channel |
| reserved  | 1B   | 0x00 |

### Pulse Entry (8 bytes)

| Field     | Size | Encoding |
|-----------|------|----------|
| region    | 2B   | str_idx into string table |
| duration  | 2B   | u16 milliseconds |
| intensity | 1B   | u8 (0-255 maps to 0.0-1.0) |
| waveform  | 1B   | 0=biphasic, 1=monophasic, 2=ramp |
| charge    | 1B   | u8 (0-255 maps to 0.0-30.0 uC/cm^2) |
| reserved  | 1B   | 0x00 |

## TARA Safety Constraints (enforced at compile time)

| Limit | Default (BCI) | Description |
|-------|---------------|-------------|
| max_elements | 256 | Maximum visual elements per stave |
| max_depth | 16 | Maximum nesting depth |
| max_bytecode | 65536 | Maximum output bytes |
| max_strings | 4096 | Maximum string table entries |
| max_string_len | 1024 | Maximum bytes per string |
| max_charge_density | 30.0 | uC/cm^2 per phase (Shannon) |
| max_charge_per_phase | 4.0 | nC per phase (microelectrode) |
| max_frequency | 2500 | Hz (stimulation rate) |
| max_amplitude | 1.0 | Normalized (0.0-1.0) |
| shannon_k | 1.75 | Conservative Shannon criterion |

## Constraints

- Max string table entries: 65535
- Max style table entries: 65535
- Max tone/pulse table entries: 256
- Max node stream opcodes: 65535
- Max file size: 256 KB (BCI default, configurable)
- Max individual string length: 65535 bytes
- All integer values little-endian
- All indices bounds-checked at compile time AND at decode time
