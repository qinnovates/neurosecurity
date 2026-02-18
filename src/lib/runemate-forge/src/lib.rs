pub mod ast;
pub mod lexer;
pub mod parser;
pub mod codegen;
pub mod tara;
pub mod disasm;
pub mod error;
pub mod secure;

pub use error::{ForgeError, CompileResult};

/// Maximum input size: 1 MB (per THREAT-MODEL M1)
const MAX_INPUT_BYTES: usize = 1_048_576;

/// Compile Staves DSL source into Staves v1.0 bytecode.
///
/// Pipeline: size check → lex → parse → TARA validate → codegen
pub fn compile(source: &str) -> Result<CompileResult, ForgeError> {
    // 0. Input size limit (THREAT-MODEL M1)
    if source.len() > MAX_INPUT_BYTES {
        return Err(ForgeError::ParseSimple(format!(
            "input too large: {} bytes (max {})",
            source.len(), MAX_INPUT_BYTES
        )));
    }

    // 1. Lex
    let tokens = lexer::lex(source)?;

    // 2. Parse
    let doc = parser::Parser::new(tokens).parse()?;

    // 3. TARA validation
    let safety = doc.safety.clone().unwrap_or_default();
    let warnings = tara::validate(&doc, &safety)?;

    // 4. Codegen
    let bytecode = codegen::emit(&doc)?;

    // 5. TARA bytecode size check
    tara::validate_bytecode_size(bytecode.len(), &safety)?;

    // Collect stave names
    let stave_names: Vec<String> = doc.staves.iter().map(|s| s.name.clone()).collect();

    Ok(CompileResult {
        bytecode,
        warnings,
        stave_names,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compile_minimal() {
        let src = r#"stave dashboard {
            heading(1) "Neural Status"
        }"#;
        let result = compile(src);
        assert!(result.is_ok(), "compile failed: {:?}", result.err());
        let cr = result.unwrap();
        assert!(!cr.bytecode.is_empty());
        assert_eq!(cr.stave_names, vec!["dashboard"]);
        assert_eq!(&cr.bytecode[0..4], b"STV1");
    }

    #[test]
    fn test_compile_with_style() {
        let src = r#"
            style card {
                width: 200px
                background: #1a1a2e
                padding-top: 16px
            }
            stave test {
                column(style: card) {
                    text "Hello"
                }
            }
        "#;
        let result = compile(src);
        assert!(result.is_ok(), "compile failed: {:?}", result.err());
        let cr = result.unwrap();
        assert!(!cr.bytecode.is_empty());
        // flags byte should indicate styles present
        assert_eq!(cr.bytecode[6] & 0x01, 0x01);
    }

    #[test]
    fn test_compile_with_tone() {
        let src = r#"
            tone alert {
                frequency: 440hz
                duration: 200ms
                amplitude: 0.25
                waveform: sine
                channel: 0
            }
            stave test {
                text "Check"
                tone alert
            }
        "#;
        let result = compile(src);
        assert!(result.is_ok(), "compile failed: {:?}", result.err());
        let cr = result.unwrap();
        // flags byte should indicate tones present
        assert_eq!(cr.bytecode[6] & 0x02, 0x02);
    }

    #[test]
    fn test_compile_full_dashboard() {
        let src = r#"
            style dark_card {
                background: #1a1a2e
                padding-top: 16px
                padding-right: 16px
                padding-bottom: 16px
                padding-left: 16px
                border-radius: 8px
            }

            tone notify {
                frequency: 440hz
                duration: 100ms
                amplitude: 0.25
                waveform: sine
                channel: 0
            }

            safety bci_default {
                max-elements: 256
                max-depth: 16
                max-bytecode: 65536
                max-charge-density: 30.0
                max-charge-per-phase: 4.0
                max-frequency: 2500
                max-amplitude: 1.0
                shannon-k: 1.75
            }

            stave dashboard {
                column(style: dark_card) {
                    heading(1) "Neural Status"
                    separator
                    row {
                        metric "Heart Rate" "72 bpm"
                        metric "Neural Load" "14%"
                    }
                    button(action: "calibrate") "Re-calibrate"
                    tone notify
                }
            }
        "#;
        let result = compile(src);
        assert!(result.is_ok(), "compile failed: {:?}", result.err());
        let cr = result.unwrap();
        assert_eq!(cr.stave_names, vec!["dashboard"]);
        assert!(cr.warnings.is_empty());

        // Verify disassembly works
        let disasm = disasm::disassemble(&cr.bytecode);
        assert!(disasm.is_ok(), "disasm failed: {:?}", disasm.err());
        let text = disasm.unwrap();
        assert!(text.contains("Neural Status"));
        assert!(text.contains("STAVE \"dashboard\""));
    }

    #[test]
    fn test_compile_rejects_oversized_input() {
        let big = "a".repeat(MAX_INPUT_BYTES + 1);
        let result = compile(&big);
        assert!(result.is_err());
        let msg = format!("{}", result.unwrap_err());
        assert!(msg.contains("input too large"));
    }

    #[test]
    fn test_compile_error_unterminated_string() {
        let src = r#"stave test {
            text "unterminated
        }"#;
        let result = compile(src);
        assert!(result.is_err());
    }
}
