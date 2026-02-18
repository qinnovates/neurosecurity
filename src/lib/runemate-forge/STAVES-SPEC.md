# Staves v1.0 Binary Format Specification

## Overview

Staves is a compact bytecode format for encoding HTML/CSS UI layouts for neural interface rendering. It is designed for minimal memory footprint, fast on-chip parsing, and post-quantum encrypted delivery via NSP.

## File Structure

```
┌──────────────────────────────┐
│  Magic (4 bytes): "STV1"     │
│  Version (2 bytes): 0x01 00  │
├──────────────────────────────┤
│  Header                      │
│    flags (1 byte)            │
│    string_table_offset (4B)  │
│    style_table_offset (4B)   │
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
└──────────────────────────────┘
```

## Magic & Version

| Field   | Size    | Value         |
|---------|---------|---------------|
| Magic   | 4 bytes | `0x53 54 56 31` ("STV1") |
| Version | 2 bytes | `0x01 0x00` (major.minor) |

## Header (15 bytes)

| Field              | Size    | Description |
|--------------------|---------|-------------|
| flags              | 1 byte  | Bit 0: has_styles, Bit 1: strict_mode, Bits 2-7: reserved |
| string_table_offset| 4 bytes | Byte offset from file start to string table (little-endian) |
| style_table_offset | 4 bytes | Byte offset from file start to style table (little-endian) |
| node_count         | 2 bytes | Total number of node opcodes in the node stream |
| total_size         | 4 bytes | Total file size in bytes |

## Opcodes

| Opcode           | Byte | Operands | Description |
|------------------|------|----------|-------------|
| ELEMENT_OPEN     | 0x01 | tag(1B) [style_idx(2B)] | Open an element; tag byte follows. If tag has style, STYLE_REF follows. |
| ELEMENT_CLOSE    | 0x02 | (none)  | Close the current element |
| TEXT             | 0x03 | str_idx(2B) | Text node; 2-byte string table index |
| STYLE_REF        | 0x04 | idx(2B) | Reference into the style table |
| ATTR_KEY         | 0x05 | str_idx(2B) | Attribute name; string table index |
| ATTR_VAL         | 0x06 | str_idx(2B) | Attribute value; string table index |
| FRAGMENT_OPEN    | 0x07 | (none)  | Open a fragment (virtual container) |
| FRAGMENT_CLOSE   | 0x08 | (none)  | Close a fragment |

## Tag Encoding (1 byte)

Known tags use a fixed byte value. Unknown/custom tags use `0xFF` followed by a 2-byte string table index.

| Tag      | Byte | | Tag      | Byte |
|----------|------|-|----------|------|
| div      | 0x01 | | a        | 0x0E |
| span     | 0x02 | | ul       | 0x0F |
| p        | 0x03 | | ol       | 0x10 |
| h1       | 0x04 | | li       | 0x11 |
| h2       | 0x05 | | section  | 0x12 |
| h3       | 0x06 | | header   | 0x13 |
| h4       | 0x07 | | footer   | 0x14 |
| h5       | 0x08 | | nav      | 0x15 |
| h6       | 0x09 | | main     | 0x16 |
| button   | 0x0A | | form     | 0x17 |
| input    | 0x0B | | label    | 0x18 |
| img      | 0x0C | | select   | 0x19 |
| br       | 0x0D | | option   | 0x1A |
|          |      | | textarea | 0x1B |
| Custom   | 0xFF | str_idx(2B) follows |

## String Table

Deduplicated, length-prefixed UTF-8 strings. Referenced by 2-byte index (little-endian).

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

Maximum 65535 strings, each up to 65535 bytes.

## Style Table

Each entry is a `StyleSet` — a list of packed CSS properties.

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
| flex-direction   | 0x0E | enum(1B): 0=row, 1=column |
| justify-content  | 0x0F | enum(1B): 0=flex-start, 1=center, 2=flex-end, 3=space-between, 4=space-around, 5=space-evenly |
| align-items      | 0x10 | enum(1B): 0=flex-start, 1=center, 2=flex-end, 3=stretch |
| display          | 0x11 | enum(1B): 0=block, 1=flex, 2=grid, 3=inline, 4=inline-block, 5=inline-flex, 6=none |
| position         | 0x12 | enum(1B): 0=static, 1=relative, 2=absolute, 3=fixed, 4=sticky |
| top              | 0x13 | value(4B) |
| right            | 0x14 | value(4B) |
| bottom           | 0x15 | value(4B) |
| left             | 0x16 | value(4B) |
| border-width     | 0x17 | u8 (px) |
| border-color     | 0x18 | rgba(4B) |
| border-radius    | 0x19 | value(4B) |
| opacity          | 0x1A | u8 (0-255, maps to 0.0-1.0) |
| overflow         | 0x1B | enum(1B): 0=visible, 1=hidden, 2=scroll, 3=auto |
| text-align       | 0x1C | enum(1B): 0=left, 1=center, 2=right, 3=justify |
| font-weight      | 0x1D | u16 (100-900) |
| font-family      | 0x1E | str_idx(2B) |
| gap              | 0x1F | value(4B) |
| flex-wrap        | 0x20 | enum(1B): 0=nowrap, 1=wrap, 2=wrap-reverse |
| flex-grow        | 0x21 | u8 |
| flex-shrink      | 0x22 | u8 |
| z-index          | 0x23 | i16 |
| visibility       | 0x24 | enum(1B): 0=visible, 1=hidden |
| max-width        | 0x25 | value(4B) |
| min-width        | 0x26 | value(4B) |
| max-height       | 0x27 | value(4B) |
| min-height       | 0x28 | value(4B) |

### Value Encoding (4 bytes)

CSS dimensional values are packed into 4 bytes:

| Byte 0 (unit) | Bytes 1-3 (value, LE i24) |
|----------------|--------------------------|
| 0x00 = auto    | (ignored) |
| 0x01 = px      | value in pixels |
| 0x02 = percent  | value in basis points (10000 = 100%) |
| 0x03 = vh      | value in 0.1% units (1000 = 100vh) |
| 0x04 = vw      | value in 0.1% units (1000 = 100vw) |

### Color Encoding (4 bytes)

RGBA, 1 byte per channel: `[r, g, b, a]`

## Constraints

- Max string table entries: 65535
- Max style table entries: 65535
- Max node stream opcodes: 65535
- Max file size: 4 GB (u32 total_size)
- Max individual string length: 65535 bytes
