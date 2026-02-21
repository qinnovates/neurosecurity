use std::collections::HashMap;
use crate::ast::*;
use crate::error::ForgeError;

/// Magic bytes: "STV1"
const MAGIC: [u8; 4] = [0x53, 0x54, 0x56, 0x31];
const VERSION: [u8; 2] = [0x01, 0x00];
const HEADER_SIZE: usize = 19;
const PREAMBLE_SIZE: usize = 6; // magic + version

// Opcodes
const OP_ELEMENT_OPEN: u8 = 0x01;
const OP_ELEMENT_CLOSE: u8 = 0x02;
const OP_TEXT: u8 = 0x03;
const OP_STYLE_REF: u8 = 0x04;
const OP_ATTR_KEY: u8 = 0x05;
const OP_ATTR_VAL: u8 = 0x06;
const OP_STAVE_START: u8 = 0x07;
const OP_STAVE_END: u8 = 0x08;
const OP_SEPARATOR: u8 = 0x09;
const OP_TONE_REF: u8 = 0x20;
const OP_PULSE_REF: u8 = 0x30;

/// Maximum total bytes in the string table (1 MB budget)
const MAX_STRING_TABLE_BYTES: usize = 1_048_576;
/// Maximum unique style definitions
const MAX_STYLE_DEFS: usize = 1024;
/// Maximum unique tone/pulse definitions
const MAX_TONE_PULSE_DEFS: usize = 256;

/// Intern strings, returning a 2-byte index.
struct StringTable {
    strings: Vec<String>,
    index: HashMap<String, u16>,
    total_bytes: usize,
}

impl StringTable {
    fn new() -> Self {
        StringTable { strings: Vec::new(), index: HashMap::new(), total_bytes: 0 }
    }

    fn intern(&mut self, s: &str) -> Result<u16, ForgeError> {
        if let Some(&idx) = self.index.get(s) {
            return Ok(idx);
        }
        if self.strings.len() >= 65535 {
            return Err(ForgeError::Codegen("string table overflow (max 65535 entries)".to_string()));
        }
        if s.len() > 65535 {
            return Err(ForgeError::Codegen(format!("string too long: {} bytes (max 65535)", s.len())));
        }
        if self.total_bytes + s.len() > MAX_STRING_TABLE_BYTES {
            return Err(ForgeError::Codegen(format!(
                "string table byte budget exceeded (max {} bytes)", MAX_STRING_TABLE_BYTES
            )));
        }
        let idx = self.strings.len() as u16;
        self.total_bytes += s.len();
        self.strings.push(s.to_string());
        self.index.insert(s.to_string(), idx);
        Ok(idx)
    }

    fn encode(&self) -> Vec<u8> {
        let mut out = Vec::new();
        out.extend_from_slice(&(self.strings.len() as u16).to_le_bytes());
        for s in &self.strings {
            let bytes = s.as_bytes();
            out.extend_from_slice(&(bytes.len() as u16).to_le_bytes());
            out.extend_from_slice(bytes);
        }
        out
    }
}

/// Encode styles, deduplicating identical style sets.
struct StyleTableEncoder {
    entries: Vec<Vec<u8>>,
    dedup: HashMap<Vec<u8>, u16>,
}

impl StyleTableEncoder {
    fn new() -> Self {
        StyleTableEncoder { entries: Vec::new(), dedup: HashMap::new() }
    }

    fn add(&mut self, style: &StyleDef, strings: &mut StringTable) -> Result<u16, ForgeError> {
        let encoded = encode_style_set(&style.properties, strings)?;
        if let Some(&idx) = self.dedup.get(&encoded) {
            return Ok(idx);
        }
        if self.entries.len() >= MAX_STYLE_DEFS {
            return Err(ForgeError::Codegen(format!("style table overflow (max {} definitions)", MAX_STYLE_DEFS)));
        }
        let idx = self.entries.len() as u16;
        self.dedup.insert(encoded.clone(), idx);
        self.entries.push(encoded);
        Ok(idx)
    }

    fn encode(&self) -> Vec<u8> {
        let mut out = Vec::new();
        out.extend_from_slice(&(self.entries.len() as u16).to_le_bytes());
        for entry in &self.entries {
            out.extend_from_slice(entry);
        }
        out
    }
}

fn encode_style_set(props: &[StyleProperty], strings: &mut StringTable) -> Result<Vec<u8>, ForgeError> {
    let mut out = Vec::new();
    if props.len() > 255 {
        return Err(ForgeError::Codegen("style has too many properties (max 255)".to_string()));
    }
    out.push(props.len() as u8);
    for prop in props {
        out.push(prop.id());
        match prop {
            // Value-type properties (4 bytes)
            StyleProperty::Width(v) | StyleProperty::Height(v) |
            StyleProperty::MarginTop(v) | StyleProperty::MarginRight(v) |
            StyleProperty::MarginBottom(v) | StyleProperty::MarginLeft(v) |
            StyleProperty::PaddingTop(v) | StyleProperty::PaddingRight(v) |
            StyleProperty::PaddingBottom(v) | StyleProperty::PaddingLeft(v) |
            StyleProperty::Top(v) | StyleProperty::Right(v) |
            StyleProperty::Bottom(v) | StyleProperty::Left(v) |
            StyleProperty::BorderRadius(v) | StyleProperty::Gap(v) |
            StyleProperty::MaxWidth(v) | StyleProperty::MinWidth(v) |
            StyleProperty::MaxHeight(v) | StyleProperty::MinHeight(v) => {
                out.extend_from_slice(&v.encode());
            }
            // Color properties (4 bytes)
            StyleProperty::Background(c) | StyleProperty::TextColor(c) |
            StyleProperty::BorderColor(c) => {
                out.extend_from_slice(&c.encode());
            }
            // Single-byte enum properties
            StyleProperty::Direction(d) => out.push(d.encode()),
            StyleProperty::Justify(j) => out.push(j.encode()),
            StyleProperty::Align(a) => out.push(a.encode()),
            StyleProperty::Display(d) => out.push(d.encode()),
            StyleProperty::Position(p) => out.push(p.encode()),
            StyleProperty::Overflow(o) => out.push(o.encode()),
            StyleProperty::TextAlign(t) => out.push(t.encode()),
            StyleProperty::Wrap(w) => out.push(w.encode()),
            StyleProperty::Visibility(v) => out.push(v.encode()),
            // Single-byte numeric
            StyleProperty::FontSize(v) | StyleProperty::Opacity(v) |
            StyleProperty::Grow(v) | StyleProperty::Shrink(v) => out.push(*v),
            StyleProperty::BorderWidth(v) => out.push(*v),
            // u16 properties
            StyleProperty::FontWeight(v) => out.extend_from_slice(&v.to_le_bytes()),
            StyleProperty::ZIndex(v) => out.extend_from_slice(&v.to_le_bytes()),
            // String reference
            StyleProperty::FontFamily(s) => {
                let idx = strings.intern(s)?;
                out.extend_from_slice(&idx.to_le_bytes());
            }
        }
    }
    Ok(out)
}

/// Encode tone/pulse table entries.
fn encode_tone_pulse_table(doc: &StavesDocument, strings: &mut StringTable, tone_names: &HashMap<String, u16>, pulse_names: &HashMap<String, u16>) -> Result<Vec<u8>, ForgeError> {
    let total = doc.tones.len() + doc.pulses.len();
    if total > MAX_TONE_PULSE_DEFS {
        return Err(ForgeError::Codegen(format!("tone/pulse table overflow (max {})", MAX_TONE_PULSE_DEFS)));
    }
    let mut out = Vec::new();
    out.extend_from_slice(&(total as u16).to_le_bytes());

    // Tones first (ordered by their index in tone_names)
    let mut tones_sorted: Vec<_> = doc.tones.iter().collect();
    tones_sorted.sort_by_key(|t| tone_names.get(&t.name).copied().unwrap_or(0));
    for tone in &tones_sorted {
        out.push(0x01); // type = tone
        out.extend_from_slice(&tone.frequency.to_le_bytes());
        out.extend_from_slice(&tone.duration_ms.to_le_bytes());
        out.push(tone.amplitude);
        out.push(tone.waveform.encode());
        out.push(tone.channel);
        out.push(0x00); // reserved
    }

    // Pulses next
    let mut pulses_sorted: Vec<_> = doc.pulses.iter().collect();
    pulses_sorted.sort_by_key(|p| pulse_names.get(&p.name).copied().unwrap_or(0));
    for pulse in &pulses_sorted {
        out.push(0x02); // type = pulse
        let region_idx = strings.intern(&pulse.region)?;
        out.extend_from_slice(&region_idx.to_le_bytes());
        out.extend_from_slice(&pulse.duration_ms.to_le_bytes());
        out.push(pulse.intensity);
        out.push(pulse.waveform.encode());
        out.push(pulse.charge);
        out.push(0x00); // reserved
    }

    Ok(out)
}

/// Emit Staves v1.0 bytecode from a parsed document.
pub fn emit(doc: &StavesDocument) -> Result<Vec<u8>, ForgeError> {
    let mut strings = StringTable::new();
    let mut styles = StyleTableEncoder::new();
    let mut node_stream = Vec::new();
    let mut node_count: u16 = 0;

    // Build style name → index map
    let mut style_names: HashMap<String, u16> = HashMap::new();
    for style_def in &doc.styles {
        let idx = styles.add(style_def, &mut strings)?;
        style_names.insert(style_def.name.clone(), idx);
    }

    // Build tone/pulse name → index maps
    let mut tone_names: HashMap<String, u16> = HashMap::new();
    for (i, tone) in doc.tones.iter().enumerate() {
        tone_names.insert(tone.name.clone(), i as u16);
    }
    let mut pulse_names: HashMap<String, u16> = HashMap::new();
    let tone_count = doc.tones.len() as u16;
    for (i, pulse) in doc.pulses.iter().enumerate() {
        pulse_names.insert(pulse.name.clone(), tone_count + i as u16);
    }

    // Emit node stream for each stave
    for stave in &doc.staves {
        let name_idx = strings.intern(&stave.name)?;
        node_stream.push(OP_STAVE_START);
        node_stream.extend_from_slice(&name_idx.to_le_bytes());
        node_count = node_count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;

        emit_elements(&stave.body, &mut node_stream, &mut node_count, &mut strings, &style_names, &tone_names, &pulse_names)?;

        node_stream.push(OP_STAVE_END);
        node_count = node_count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
    }

    // Encode tables
    let string_table = strings.encode();
    let style_table = styles.encode();
    let tone_pulse_table = encode_tone_pulse_table(doc, &mut strings, &tone_names, &pulse_names)?;

    // Calculate offsets
    let node_stream_start = PREAMBLE_SIZE + HEADER_SIZE;
    let string_table_offset = node_stream_start + node_stream.len();
    let style_table_offset = string_table_offset + string_table.len();
    let tone_table_offset = style_table_offset + style_table.len();
    let total_size = tone_table_offset + tone_pulse_table.len();

    // Assemble
    let mut out = Vec::with_capacity(total_size);

    // Magic + Version
    out.extend_from_slice(&MAGIC);
    out.extend_from_slice(&VERSION);

    // Header (19 bytes)
    let mut flags: u8 = 0;
    if !doc.styles.is_empty() { flags |= 0x01; }
    if !doc.tones.is_empty() || !doc.pulses.is_empty() { flags |= 0x02; }
    out.push(flags);
    out.extend_from_slice(&(string_table_offset as u32).to_le_bytes());
    out.extend_from_slice(&(style_table_offset as u32).to_le_bytes());
    out.extend_from_slice(&(tone_table_offset as u32).to_le_bytes());
    out.extend_from_slice(&node_count.to_le_bytes());
    out.extend_from_slice(&(total_size as u32).to_le_bytes());

    // Node stream
    out.extend_from_slice(&node_stream);

    // Tables
    out.extend_from_slice(&string_table);
    out.extend_from_slice(&style_table);
    out.extend_from_slice(&tone_pulse_table);

    debug_assert_eq!(out.len(), total_size);

    Ok(out)
}

fn emit_elements(
    elements: &[Element],
    stream: &mut Vec<u8>,
    count: &mut u16,
    strings: &mut StringTable,
    style_names: &HashMap<String, u16>,
    tone_names: &HashMap<String, u16>,
    pulse_names: &HashMap<String, u16>,
) -> Result<(), ForgeError> {
    for el in elements {
        match el {
            Element::Container { kind, attrs, children, .. } => {
                stream.push(OP_ELEMENT_OPEN);
                stream.push(kind.tag_byte());
                *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;

                emit_attrs(attrs, stream, count, strings, style_names)?;
                emit_elements(children, stream, count, strings, style_names, tone_names, pulse_names)?;

                stream.push(OP_ELEMENT_CLOSE);
                *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
            }
            Element::Leaf { kind, attrs, .. } => {
                match kind {
                    LeafKind::Separator => {
                        stream.push(OP_SEPARATOR);
                        *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
                    }
                    _ => {
                        stream.push(OP_ELEMENT_OPEN);
                        stream.push(kind.tag_byte());
                        *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;

                        emit_attrs(attrs, stream, count, strings, style_names)?;
                        emit_leaf_content(kind, stream, count, strings)?;

                        stream.push(OP_ELEMENT_CLOSE);
                        *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
                    }
                }
            }
            Element::ToneRef { name, span: _ } => {
                let idx = tone_names.get(name).ok_or_else(|| ForgeError::Codegen(format!("unknown tone: '{}'", name)))?;
                stream.push(OP_TONE_REF);
                stream.extend_from_slice(&idx.to_le_bytes());
                *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
            }
            Element::PulseRef { name, span: _ } => {
                let idx = pulse_names.get(name).ok_or_else(|| ForgeError::Codegen(format!("unknown pulse: '{}'", name)))?;
                stream.push(OP_PULSE_REF);
                stream.extend_from_slice(&idx.to_le_bytes());
                *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
            }
        }
    }
    Ok(())
}

fn emit_attrs(
    attrs: &Attrs,
    stream: &mut Vec<u8>,
    count: &mut u16,
    strings: &mut StringTable,
    style_names: &HashMap<String, u16>,
) -> Result<(), ForgeError> {
    // Style reference
    if let Some(ref style_name) = attrs.style {
        let idx = style_names.get(style_name).ok_or_else(|| ForgeError::Codegen(format!("unknown style: '{}'", style_name)))?;
        stream.push(OP_STYLE_REF);
        stream.extend_from_slice(&idx.to_le_bytes());
        *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
    }

    // ID attribute
    if let Some(ref id) = attrs.id {
        let key_idx = strings.intern("id")?;
        let val_idx = strings.intern(id)?;
        stream.push(OP_ATTR_KEY);
        stream.extend_from_slice(&key_idx.to_le_bytes());
        stream.push(OP_ATTR_VAL);
        stream.extend_from_slice(&val_idx.to_le_bytes());
        *count = count.checked_add(2).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
    }

    // Extra attributes (deterministic order via BTreeMap)
    for (key, val) in &attrs.extra {
        let key_idx = strings.intern(key)?;
        let val_idx = strings.intern(val)?;
        stream.push(OP_ATTR_KEY);
        stream.extend_from_slice(&key_idx.to_le_bytes());
        stream.push(OP_ATTR_VAL);
        stream.extend_from_slice(&val_idx.to_le_bytes());
        *count = count.checked_add(2).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
    }

    Ok(())
}

fn emit_leaf_content(
    kind: &LeafKind,
    stream: &mut Vec<u8>,
    count: &mut u16,
    strings: &mut StringTable,
) -> Result<(), ForgeError> {
    match kind {
        LeafKind::Heading(_, text) | LeafKind::Text(text) | LeafKind::Item(text) => {
            let idx = strings.intern(text)?;
            stream.push(OP_TEXT);
            stream.extend_from_slice(&idx.to_le_bytes());
            *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
        }
        LeafKind::Button { action, label } => {
            let action_key = strings.intern("action")?;
            let action_val = strings.intern(action)?;
            stream.push(OP_ATTR_KEY);
            stream.extend_from_slice(&action_key.to_le_bytes());
            stream.push(OP_ATTR_VAL);
            stream.extend_from_slice(&action_val.to_le_bytes());
            *count = count.checked_add(2).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
            let idx = strings.intern(label)?;
            stream.push(OP_TEXT);
            stream.extend_from_slice(&idx.to_le_bytes());
            *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
        }
        LeafKind::Input { field, input_type, placeholder } => {
            let field_key = strings.intern("field")?;
            let field_val = strings.intern(field)?;
            stream.push(OP_ATTR_KEY);
            stream.extend_from_slice(&field_key.to_le_bytes());
            stream.push(OP_ATTR_VAL);
            stream.extend_from_slice(&field_val.to_le_bytes());
            *count = count.checked_add(2).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
            if let Some(t) = input_type {
                let k = strings.intern("type")?;
                let v = strings.intern(t)?;
                stream.push(OP_ATTR_KEY);
                stream.extend_from_slice(&k.to_le_bytes());
                stream.push(OP_ATTR_VAL);
                stream.extend_from_slice(&v.to_le_bytes());
                *count = count.checked_add(2).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
            }
            if let Some(p) = placeholder {
                let k = strings.intern("placeholder")?;
                let v = strings.intern(p)?;
                stream.push(OP_ATTR_KEY);
                stream.extend_from_slice(&k.to_le_bytes());
                stream.push(OP_ATTR_VAL);
                stream.extend_from_slice(&v.to_le_bytes());
                *count = count.checked_add(2).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
            }
        }
        LeafKind::Image { src, alt } => {
            let src_key = strings.intern("src")?;
            let src_val = strings.intern(src)?;
            let alt_key = strings.intern("alt")?;
            let alt_val = strings.intern(alt)?;
            stream.push(OP_ATTR_KEY);
            stream.extend_from_slice(&src_key.to_le_bytes());
            stream.push(OP_ATTR_VAL);
            stream.extend_from_slice(&src_val.to_le_bytes());
            stream.push(OP_ATTR_KEY);
            stream.extend_from_slice(&alt_key.to_le_bytes());
            stream.push(OP_ATTR_VAL);
            stream.extend_from_slice(&alt_val.to_le_bytes());
            *count = count.checked_add(4).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
        }
        LeafKind::Link { href, label } => {
            let href_key = strings.intern("href")?;
            let href_val = strings.intern(href)?;
            stream.push(OP_ATTR_KEY);
            stream.extend_from_slice(&href_key.to_le_bytes());
            stream.push(OP_ATTR_VAL);
            stream.extend_from_slice(&href_val.to_le_bytes());
            *count = count.checked_add(2).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
            let idx = strings.intern(label)?;
            stream.push(OP_TEXT);
            stream.extend_from_slice(&idx.to_le_bytes());
            *count = count.checked_add(1).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
        }
        LeafKind::Spacer(val) => {
            // Encode spacer value as a 4-byte attribute
            let key = strings.intern("size")?;
            let encoded = val.encode();
            let val_str = format!("{:02x}{:02x}{:02x}{:02x}", encoded[0], encoded[1], encoded[2], encoded[3]);
            let val_idx = strings.intern(&val_str)?;
            stream.push(OP_ATTR_KEY);
            stream.extend_from_slice(&key.to_le_bytes());
            stream.push(OP_ATTR_VAL);
            stream.extend_from_slice(&val_idx.to_le_bytes());
            *count = count.checked_add(2).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
        }
        LeafKind::Metric { label, value } => {
            let label_key = strings.intern("label")?;
            let label_val = strings.intern(label)?;
            let value_key = strings.intern("value")?;
            let value_val = strings.intern(value)?;
            stream.push(OP_ATTR_KEY);
            stream.extend_from_slice(&label_key.to_le_bytes());
            stream.push(OP_ATTR_VAL);
            stream.extend_from_slice(&label_val.to_le_bytes());
            stream.push(OP_ATTR_KEY);
            stream.extend_from_slice(&value_key.to_le_bytes());
            stream.push(OP_ATTR_VAL);
            stream.extend_from_slice(&value_val.to_le_bytes());
            *count = count.checked_add(4).ok_or_else(|| ForgeError::Codegen("node count overflow".to_string()))?;
        }
        LeafKind::Separator => {} // handled in parent
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn minimal_doc() -> StavesDocument {
        StavesDocument {
            staves: vec![StaveDef {
                name: "test".to_string(),
                body: vec![Element::Leaf {
                    kind: LeafKind::Text("hello".to_string()),
                    attrs: Attrs::default(),
                    span: crate::error::Span { line: 1, col: 1 },
                }],
                span: crate::error::Span { line: 1, col: 1 },
            }],
            styles: vec![],
            tones: vec![],
            pulses: vec![],
            safety: None,
        }
    }

    #[test]
    fn test_emit_magic() {
        let doc = minimal_doc();
        let bytecode = emit(&doc).unwrap();
        assert_eq!(&bytecode[0..4], b"STV1");
        assert_eq!(bytecode[4], 0x01);
        assert_eq!(bytecode[5], 0x00);
    }

    #[test]
    fn test_emit_nonempty() {
        let doc = minimal_doc();
        let bytecode = emit(&doc).unwrap();
        assert!(bytecode.len() > PREAMBLE_SIZE + HEADER_SIZE);
    }

    #[test]
    fn test_emit_total_size_consistent() {
        let doc = minimal_doc();
        let bytecode = emit(&doc).unwrap();
        // total_size is at header offset 15..19 (after flags(1) + 3*4-byte offsets + 2-byte node_count)
        let total_size_offset = PREAMBLE_SIZE + 1 + 12 + 2; // 6 + 15 = 21
        let total_size = u32::from_le_bytes([
            bytecode[total_size_offset],
            bytecode[total_size_offset + 1],
            bytecode[total_size_offset + 2],
            bytecode[total_size_offset + 3],
        ]);
        assert_eq!(total_size as usize, bytecode.len());
    }

    #[test]
    fn test_string_dedup() {
        let mut st = StringTable::new();
        let a = st.intern("hello").unwrap();
        let b = st.intern("hello").unwrap();
        assert_eq!(a, b);
        assert_eq!(st.strings.len(), 1);
    }

    #[test]
    fn test_empty_doc() {
        let doc = StavesDocument {
            staves: vec![],
            styles: vec![],
            tones: vec![],
            pulses: vec![],
            safety: None,
        };
        let bytecode = emit(&doc).unwrap();
        assert_eq!(&bytecode[0..4], b"STV1");
    }
}
