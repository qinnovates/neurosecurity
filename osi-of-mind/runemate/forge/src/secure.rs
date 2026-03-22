use nsp_core::Session;
use crate::error::{ForgeError, CompileResult};
use crate::compile;

/// Compile Staves DSL source into bytecode and encrypt it for a secure session.
///
/// This is the primary API for secure neural interface delivery.
pub fn compile_and_encrypt(
    session: &Session,
    source: &str,
    nonce: &[u8; 12]
) -> Result<(Vec<u8>, CompileResult), ForgeError> {
    // 1. Compile to Staves bytecode
    let result = compile(source)?;

    // 2. Encrypt using the NSP session key
    let encrypted = session.encrypt(nonce, &result.bytecode)
        .map_err(|e| ForgeError::Codegen(format!("encryption failed: {}", e)))?;

    Ok((encrypted, result))
}

/// Encrypt pre-compiled bytecode for a secure session.
pub fn encrypt_bytecode(
    session: &Session,
    bytecode: &[u8],
    nonce: &[u8; 12]
) -> Result<Vec<u8>, ForgeError> {
    session.encrypt(nonce, bytecode)
        .map_err(|e| ForgeError::Codegen(format!("encryption failed: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use nsp_core::SessionParams;

    /// Generate a deterministic test-only secret from a seed byte.
    /// SAFETY: test-only placeholder — never use in production.
    fn test_secret(seed: u8) -> [u8; 32] {
        [seed; 32]
    }

    /// Generate a deterministic test-only nonce from a seed byte.
    /// SAFETY: test-only placeholder — never use in production.
    fn test_nonce(seed: u8) -> [u8; 12] {
        [seed; 12]
    }

    #[test]
    fn test_secure_compile_workflow() {
        let shared_secret = test_secret(0x42);
        let session_id = test_secret(0x55);
        let params = SessionParams::default();
        let session = Session::new(&shared_secret, session_id, params).unwrap();

        let source = r#"stave dashboard {
            heading(1) "Secure Implant Data"
        }"#;
        let nonce = test_nonce(0x99);

        let (encrypted, result) = compile_and_encrypt(&session, source, &nonce).unwrap();
        assert!(!encrypted.is_empty());
        assert_eq!(result.stave_names, vec!["dashboard"]);

        // Verify we can decrypt it back
        let decrypted = session.decrypt(&nonce, &encrypted).unwrap();
        assert_eq!(decrypted, result.bytecode);

        // Verify magic bytes in decrypted bytecode
        assert_eq!(&decrypted[0..4], b"STV1");
    }
}
