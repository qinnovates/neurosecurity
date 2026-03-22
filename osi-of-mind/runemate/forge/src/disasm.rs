use crate::error::ForgeError;

/// Disassemble Staves v1.0 bytecode into human-readable text.
pub fn disassemble(bytecode: &[u8]) -> Result<String, ForgeError> {
    if bytecode.len() < 25 {
        return Err(ForgeError::Codegen("bytecode too short for valid Staves file".to_string()));
    }

    // Verify magic
    if &bytecode[0..4] != b"STV1" {
        return Err(ForgeError::Codegen(format!(
            "invalid magic: expected STV1, got {:?}",
            &bytecode[0..4]
        )));
    }

    let version_major = bytecode[4];
    let version_minor = bytecode[5];

    // Header
    let flags = bytecode[6];
    let string_offset = read_u32_le(bytecode, 7) as usize;
    let style_offset = read_u32_le(bytecode, 11) as usize;
    let tone_offset = read_u32_le(bytecode, 15) as usize;
    let node_count = read_u16_le(bytecode, 19);
    let total_size = read_u32_le(bytecode, 21) as usize;

    let mut out = String::new();
    out.push_str(&format!("=== Staves v{}.{} Disassembly ===\n", version_major, version_minor));
    out.push_str(&format!("Flags: 0x{:02x} (styles={}, tones={}, strict={})\n",
        flags, flags & 1 != 0, flags & 2 != 0, flags & 4 != 0));
    out.push_str(&format!("Node count: {}\n", node_count));
    out.push_str(&format!("Total size: {} bytes\n", total_size));
    out.push_str(&format!("String table @ {}\n", string_offset));
    out.push_str(&format!("Style table @ {}\n", style_offset));
    out.push_str(&format!("Tone/Pulse table @ {}\n\n", tone_offset));

    // Decode string table
    let strings = if string_offset < bytecode.len() {
        decode_string_table(bytecode, string_offset)?
    } else {
        vec![]
    };

    // Print string table
    if !strings.is_empty() {
        out.push_str(&format!("--- String Table ({} entries) ---\n", strings.len()));
        for (i, s) in strings.iter().enumerate() {
            out.push_str(&format!("  [{}] \"{}\"\n", i, s));
        }
        out.push('\n');
    }

    // Print style table
    if style_offset < tone_offset && style_offset < bytecode.len() {
        out.push_str(&format!("--- Style Table ---\n"));
        let style_count = read_u16_le(bytecode, style_offset);
        out.push_str(&format!("  {} style sets\n", style_count));
        // Detailed style decoding could go here
        out.push('\n');
    }

    // Print tone/pulse table
    if tone_offset < bytecode.len() {
        let tp_count = read_u16_le(bytecode, tone_offset);
        if tp_count > 0 {
            out.push_str(&format!("--- Tone/Pulse Table ({} entries) ---\n", tp_count));
            let mut pos = tone_offset + 2;
            for i in 0..tp_count as usize {
                if pos >= bytecode.len() { break; }
                let entry_type = bytecode[pos];
                match entry_type {
                    0x01 => {
                        let freq = read_u16_le(bytecode, pos + 1);
                        let dur = read_u16_le(bytecode, pos + 3);
                        let amp = bytecode[pos + 5];
                        let wf = bytecode[pos + 6];
                        let ch = bytecode[pos + 7];
                        let wf_name = match wf { 0 => "biphasic", 1 => "sine", 2 => "square", _ => "?" };
                        out.push_str(&format!("  [{}] TONE freq={}Hz dur={}ms amp={} wf={} ch={}\n",
                            i, freq, dur, amp, wf_name, ch));
                        pos += 9;
                    }
                    0x02 => {
                        let region_idx = read_u16_le(bytecode, pos + 1);
                        let dur = read_u16_le(bytecode, pos + 3);
                        let intensity = bytecode[pos + 5];
                        let wf = bytecode[pos + 6];
                        let charge = bytecode[pos + 7];
                        let wf_name = match wf { 0 => "biphasic", 1 => "monophasic", 2 => "ramp", _ => "?" };
                        let region = strings.get(region_idx as usize).map(|s| s.as_str()).unwrap_or("?");
                        out.push_str(&format!("  [{}] PULSE region=\"{}\" dur={}ms int={} wf={} charge={}\n",
                            i, region, dur, intensity, wf_name, charge));
                        pos += 9;
                    }
                    _ => {
                        out.push_str(&format!("  [{}] UNKNOWN type=0x{:02x}\n", i, entry_type));
                        break;
                    }
                }
            }
            out.push('\n');
        }
    }

    // Disassemble node stream
    out.push_str("--- Node Stream ---\n");
    let node_stream_start = 25; // 6 preamble + 19 header
    let node_stream_end = string_offset.min(bytecode.len());
    let mut pos = node_stream_start;
    let mut indent = 0usize;

    while pos < node_stream_end {
        let op = bytecode[pos];
        let prefix = "  ".repeat(indent);
        match op {
            0x01 => { // ELEMENT_OPEN
                if pos + 1 >= node_stream_end { break; }
                let tag = bytecode[pos + 1];
                out.push_str(&format!("{}{}\n", prefix, tag_name(tag)));
                indent += 1;
                pos += 2;
            }
            0x02 => { // ELEMENT_CLOSE
                if indent > 0 { indent -= 1; }
                pos += 1;
            }
            0x03 => { // TEXT
                if pos + 2 >= node_stream_end { break; }
                let idx = read_u16_le(bytecode, pos + 1);
                let text = strings.get(idx as usize).map(|s| s.as_str()).unwrap_or("?");
                out.push_str(&format!("{}TEXT \"{}\"\n", prefix, text));
                pos += 3;
            }
            0x04 => { // STYLE_REF
                if pos + 2 >= node_stream_end { break; }
                let idx = read_u16_le(bytecode, pos + 1);
                out.push_str(&format!("{}STYLE [{}]\n", prefix, idx));
                pos += 3;
            }
            0x05 => { // ATTR_KEY
                if pos + 2 >= node_stream_end { break; }
                let idx = read_u16_le(bytecode, pos + 1);
                let key = strings.get(idx as usize).map(|s| s.as_str()).unwrap_or("?");
                out.push_str(&format!("{}ATTR_KEY \"{}\"\n", prefix, key));
                pos += 3;
            }
            0x06 => { // ATTR_VAL
                if pos + 2 >= node_stream_end { break; }
                let idx = read_u16_le(bytecode, pos + 1);
                let val = strings.get(idx as usize).map(|s| s.as_str()).unwrap_or("?");
                out.push_str(&format!("{}ATTR_VAL \"{}\"\n", prefix, val));
                pos += 3;
            }
            0x07 => { // STAVE_START
                if pos + 2 >= node_stream_end { break; }
                let idx = read_u16_le(bytecode, pos + 1);
                let name = strings.get(idx as usize).map(|s| s.as_str()).unwrap_or("?");
                out.push_str(&format!("{}STAVE \"{}\" {{\n", prefix, name));
                indent += 1;
                pos += 3;
            }
            0x08 => { // STAVE_END
                if indent > 0 { indent -= 1; }
                let prefix = "  ".repeat(indent);
                out.push_str(&format!("{}}}\n", prefix));
                pos += 1;
            }
            0x09 => { // SEPARATOR
                out.push_str(&format!("{}SEPARATOR\n", prefix));
                pos += 1;
            }
            0x20 => { // TONE_REF
                if pos + 2 >= node_stream_end { break; }
                let idx = read_u16_le(bytecode, pos + 1);
                out.push_str(&format!("{}TONE_REF [{}]\n", prefix, idx));
                pos += 3;
            }
            0x30 => { // PULSE_REF
                if pos + 2 >= node_stream_end { break; }
                let idx = read_u16_le(bytecode, pos + 1);
                out.push_str(&format!("{}PULSE_REF [{}]\n", prefix, idx));
                pos += 3;
            }
            _ => {
                out.push_str(&format!("{}UNKNOWN 0x{:02x}\n", prefix, op));
                pos += 1;
            }
        }
    }

    Ok(out)
}

fn decode_string_table(bytecode: &[u8], offset: usize) -> Result<Vec<String>, ForgeError> {
    if offset + 2 > bytecode.len() {
        return Ok(vec![]);
    }
    let count = read_u16_le(bytecode, offset) as usize;
    let mut strings = Vec::with_capacity(count);
    let mut pos = offset + 2;

    for _ in 0..count {
        if pos + 2 > bytecode.len() {
            return Err(ForgeError::Codegen("truncated string table".to_string()));
        }
        let len = read_u16_le(bytecode, pos) as usize;
        pos += 2;
        if pos + len > bytecode.len() {
            return Err(ForgeError::Codegen("truncated string entry".to_string()));
        }
        let s = std::str::from_utf8(&bytecode[pos..pos + len])
            .map_err(|_| ForgeError::Codegen("invalid UTF-8 in string table".to_string()))?
            .to_string();
        strings.push(s);
        pos += len;
    }

    Ok(strings)
}

fn tag_name(tag: u8) -> &'static str {
    match tag {
        0x01 => "COLUMN",
        0x02 => "ROW",
        0x03 => "SECTION",
        0x04 => "LIST",
        0x05 => "GRID",
        0x08 => "TEXT",
        0x09 => "BUTTON",
        0x0A => "INPUT",
        0x0B => "IMAGE",
        0x0C => "LINK",
        0x10 => "HEADING-1",
        0x11 => "HEADING-2",
        0x12 => "HEADING-3",
        0x13 => "HEADING-4",
        0x14 => "HEADING-5",
        0x15 => "HEADING-6+",
        0x18 => "METRIC",
        0x19 => "SEPARATOR",
        0x1A => "SPACER",
        0x1B => "ITEM",
        _ => "UNKNOWN",
    }
}

fn read_u16_le(data: &[u8], offset: usize) -> u16 {
    if offset + 2 > data.len() { return 0; }
    u16::from_le_bytes([data[offset], data[offset + 1]])
}

fn read_u32_le(data: &[u8], offset: usize) -> u32 {
    if offset + 4 > data.len() { return 0; }
    u32::from_le_bytes([data[offset], data[offset + 1], data[offset + 2], data[offset + 3]])
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::codegen;
    use crate::ast::*;

    #[test]
    fn test_disasm_roundtrip() {
        let doc = StavesDocument {
            staves: vec![StaveDef {
                name: "test".to_string(),
                body: vec![Element::Leaf {
                    kind: LeafKind::Text("hello world".to_string()),
                    attrs: Attrs::default(),
                    span: crate::error::Span { line: 1, col: 1 },
                }],
                span: crate::error::Span { line: 1, col: 1 },
            }],
            styles: vec![],
            tones: vec![],
            pulses: vec![],
            safety: None,
        };
        let bytecode = codegen::emit(&doc).unwrap();
        let output = disassemble(&bytecode).unwrap();
        assert!(output.contains("Staves v1.0"));
        assert!(output.contains("hello world"));
        assert!(output.contains("STAVE \"test\""));
    }
}
