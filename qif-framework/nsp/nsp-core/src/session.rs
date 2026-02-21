use crate::{Cipher, NspError, SessionParams};
use hkdf::Hkdf;
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH};

/// NSP session with derived encryption key
pub struct Session {
    /// Unique session identifier
    id: [u8; 32],
    /// Derived session key for AES-256-GCM
    key: [u8; 32],
    /// Session creation timestamp (Unix seconds)
    created_at: u64,
    /// Session expiration timestamp (Unix seconds)
    expires_at: u64,
    /// Session configuration parameters
    params: SessionParams,
    /// Cipher instance for encryption/decryption
    cipher: Cipher,
}

impl Session {
    /// Create a new session from KEM shared secret
    /// 
    /// Uses HKDF-SHA256 to derive a session key from:
    /// - KEM shared secret (32 bytes)
    /// - Session ID (32 bytes)
    /// - Info string: "NSP-SESSION-KEY-V1"
    pub fn new(shared_secret: &[u8], session_id: [u8; 32], params: SessionParams) -> Result<Self, NspError> {
        // Derive session key using HKDF-SHA256
        let hk = Hkdf::<Sha256>::new(Some(&session_id), shared_secret);
        let info = b"NSP-SESSION-KEY-V1";
        let mut session_key = [0u8; 32];
        hk.expand(info, &mut session_key)
            .map_err(|_| NspError::CryptoError("HKDF key derivation failed".to_string()))?;
        
        // Get current timestamp
        let created_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| NspError::CryptoError("System time error".to_string()))?
            .as_secs();
        
        // Calculate expiration
        let expires_at = created_at + params.timeout_seconds as u64;
        
        // Create cipher instance
        let cipher = Cipher::new(session_key);
        
        Ok(Self {
            id: session_id,
            key: session_key,
            created_at,
            expires_at,
            params,
            cipher,
        })
    }
    
    /// Get session ID
    pub fn id(&self) -> &[u8; 32] {
        &self.id
    }
    
    /// Get session key (for testing purposes only)
    #[cfg(test)]
    pub fn key(&self) -> &[u8; 32] {
        &self.key
    }
    
    /// Get session parameters
    pub fn params(&self) -> &SessionParams {
        &self.params
    }
    
    /// Check if session has expired
    pub fn is_expired(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        
        now >= self.expires_at
    }
    
    /// Get remaining session lifetime in seconds
    pub fn remaining_lifetime(&self) -> u64 {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        
        if now >= self.expires_at {
            0
        } else {
            self.expires_at - now
        }
    }
    
    /// Encrypt data using session key
    pub fn encrypt(&self, nonce: &[u8; 12], plaintext: &[u8]) -> Result<Vec<u8>, NspError> {
        if self.is_expired() {
            return Err(NspError::HandshakeError("Session expired".to_string()));
        }
        
        self.cipher.encrypt(nonce, plaintext)
    }
    
    /// Decrypt data using session key
    pub fn decrypt(&self, nonce: &[u8; 12], ciphertext: &[u8]) -> Result<Vec<u8>, NspError> {
        if self.is_expired() {
            return Err(NspError::HandshakeError("Session expired".to_string()));
        }
        
        self.cipher.decrypt(nonce, ciphertext)
    }
}

impl Drop for Session {
    fn drop(&mut self) {
        // Zero out the session key when dropped
        self.key.fill(0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_creation() {
        let shared_secret = [1u8; 32];
        let session_id = [2u8; 32];
        let params = SessionParams::default();
        
        let session = Session::new(&shared_secret, session_id, params).unwrap();
        
        assert_eq!(session.id(), &session_id);
        assert!(!session.is_expired());
        assert!(session.remaining_lifetime() > 0);
    }

    #[test]
    fn test_key_derivation_deterministic() {
        let shared_secret = [3u8; 32];
        let session_id = [4u8; 32];
        let params = SessionParams::default();
        
        let session1 = Session::new(&shared_secret, session_id, params.clone()).unwrap();
        let session2 = Session::new(&shared_secret, session_id, params).unwrap();
        
        // Same inputs should produce same session key
        assert_eq!(session1.key(), session2.key());
    }

    #[test]
    fn test_key_derivation_unique() {
        let shared_secret = [5u8; 32];
        let session_id1 = [6u8; 32];
        let session_id2 = [7u8; 32];
        let params = SessionParams::default();
        
        let session1 = Session::new(&shared_secret, session_id1, params.clone()).unwrap();
        let session2 = Session::new(&shared_secret, session_id2, params).unwrap();
        
        // Different session IDs should produce different keys
        assert_ne!(session1.key(), session2.key());
    }

    #[test]
    fn test_encrypt_decrypt() {
        let shared_secret = [8u8; 32];
        let session_id = [9u8; 32];
        let params = SessionParams::default();
        
        let session = Session::new(&shared_secret, session_id, params).unwrap();
        
        let nonce = [10u8; 12];
        let plaintext = b"Neural signal data frame 0x42";
        
        // Encrypt
        let ciphertext = session.encrypt(&nonce, plaintext).unwrap();
        
        // Decrypt
        let decrypted = session.decrypt(&nonce, &ciphertext).unwrap();
        
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_session_expiration() {
        let shared_secret = [11u8; 32];
        let session_id = [12u8; 32];
        let mut params = SessionParams::default();
        params.timeout_seconds = 0; // Expire immediately
        
        let session = Session::new(&shared_secret, session_id, params).unwrap();
        
        // Session should be expired
        assert!(session.is_expired());
        assert_eq!(session.remaining_lifetime(), 0);
        
        // Encryption should fail on expired session
        let nonce = [13u8; 12];
        let plaintext = b"test";
        let result = session.encrypt(&nonce, plaintext);
        assert!(result.is_err());
    }

    #[test]
    fn test_key_zeroization() {
        let shared_secret = [14u8; 32];
        let session_id = [15u8; 32];
        let params = SessionParams::default();
        
        let key_copy = {
            let session = Session::new(&shared_secret, session_id, params).unwrap();
            *session.key()
        };
        
        // After session is dropped, key should be non-zero (before drop)
        assert_ne!(key_copy, [0u8; 32]);
        
        // Create and drop another session to verify zeroization happens
        let mut session2 = Session::new(&shared_secret, session_id, SessionParams::default()).unwrap();
        let _key_ptr = session2.key.as_mut_ptr();
        drop(session2);
        
        // Note: We can't safely verify the memory is zeroed after drop
        // because the memory might be reused. This test just ensures
        // the Drop implementation compiles and runs.
    }
}
