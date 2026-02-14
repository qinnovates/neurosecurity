use nsp_core::Session;
use crate::error::ForgeError;
use crate::compile;

/// Compile HTML/CSS source into Staves v1.0 bytecode and encrypt it for a secure session.
/// 
/// This is the primary API for secure neural interface delivery.
pub fn compile_and_encrypt(
    session: &Session,
    html: &str,
    nonce: &[u8; 12]
) -> Result<Vec<u8>, ForgeError> {
    // 1. Compile to Staves bytecode
    let bytecode = compile(html)?;
    
    // 2. Encrypt using the NSP session key
    let encrypted = session.encrypt(nonce, &bytecode)
        .map_err(|e| ForgeError::CodegenError(format!("Encryption failed: {}", e)))?;
        
    Ok(encrypted)
}

#[cfg(test)]
mod tests {
    use super::*;
    use nsp_core::SessionParams;

    #[test]
    fn test_secure_compile_workflow() {
        // Setup a mock NSP session
        let shared_secret = [0x42; 32];
        let session_id = [0x55; 32];
        let params = SessionParams::default();
        let session = Session::new(&shared_secret, session_id, params).unwrap();
        
        let html = "<div class='dashboard'>Secure Implant Data</div>";
        let nonce = [0x99; 12];
        
        let result = compile_and_encrypt(&session, html, &nonce);
        assert!(result.is_ok());
        
        let encrypted = result.unwrap();
        assert!(!encrypted.is_empty());
        
        // Verify we can decrypt it back
        let decrypted = session.decrypt(&nonce, &encrypted).unwrap();
        assert!(!decrypted.is_empty());
        
        // Bytecode should be identical to raw compile
        let raw_bytecode = compile(html).unwrap();
        assert_eq!(decrypted, raw_bytecode);
    }
}
