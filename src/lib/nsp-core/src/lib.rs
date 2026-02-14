use fips203::ml_kem_768;
use fips203::traits::{KeyGen, Encaps, Decaps, SerDes};
use fips204::ml_dsa_65;
use fips204::traits::{KeyGen as KeyGen204, Signer, Verifier, SerDes as SerDes204};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce
};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum NspError {
    #[error("Cryptographic operation failed: {0}")]
    CryptoError(String),
    #[error("Serialization error: {0}")]
    SerializationError(String),
    #[error("Handshake failed: {0}")]
    HandshakeError(String),
    #[error("Invalid protocol message")]
    InvalidMessage,
}

/// Post-Quantum Key Encapsulation (ML-KEM-768)
/// Using opaque types since fips203 doesn't publicly export the concrete types
pub struct Kem {
    public_key: Vec<u8>,
    secret_key: Vec<u8>,
}

impl Kem {
    pub fn generate() -> Self {
        let (pk, sk) = ml_kem_768::KG::try_keygen().expect("ML-KEM Keygen failed");
        Self {
            public_key: pk.into_bytes().to_vec(),
            secret_key: sk.into_bytes().to_vec(),
        }
    }

    pub fn public_key_bytes(&self) -> &[u8] {
        &self.public_key
    }

    pub fn encapsulate(pk_bytes: &[u8]) -> Result<(Vec<u8>, Vec<u8>), NspError> {
        let pk_arr: [u8; 1184] = pk_bytes.try_into()
            .map_err(|_| NspError::CryptoError("Invalid public key length".to_string()))?;
        
        let pk = <ml_kem_768::KG as KeyGen>::EncapsKey::try_from_bytes(pk_arr)
            .map_err(|_| NspError::CryptoError("Invalid public key format".to_string()))?;
        
        let (ct, ss) = pk.try_encaps()
            .map_err(|_| NspError::CryptoError("Encapsulation failed".to_string()))?;
        
        // The ciphertext and shared secret both have into_bytes() methods
        // CT should be 1088 bytes, SS should be 32 bytes
        let ct_arr = ct.into_bytes();
        let ss_arr = ss.into_bytes();
        // Return (ciphertext, shared_secret) - swapped because into_bytes seems to return opposite
        Ok((ss_arr.to_vec(), ct_arr.to_vec()))
    }

    pub fn decapsulate(&self, ct: &[u8]) -> Result<Vec<u8>, NspError> {
        let sk_arr: [u8; 2400] = self.secret_key.as_slice().try_into()
            .map_err(|_| NspError::CryptoError("Invalid secret key length".to_string()))?;
        
        let sk = <ml_kem_768::KG as KeyGen>::DecapsKey::try_from_bytes(sk_arr)
            .map_err(|_| NspError::CryptoError("Invalid secret key format".to_string()))?;
        
        // Try to determine the correct ciphertext length dynamically
        let ct_obj = match ct.len() {
            1088 => {
                let ct_arr: [u8; 1088] = ct.try_into()
                    .map_err(|_| NspError::CryptoError("Invalid ciphertext length".to_string()))?;
                <<ml_kem_768::KG as KeyGen>::EncapsKey as Encaps>::CipherText::try_from_bytes(ct_arr)
                    .map_err(|_| NspError::CryptoError("Invalid ciphertext format".to_string()))?
            },
            32 => {
                // If it's 32 bytes, it might be the shared secret being passed incorrectly
                return Err(NspError::CryptoError("Received shared secret instead of ciphertext".to_string()));
            },
            len => {
                // Try the actual length
                return Err(NspError::CryptoError(format!("Unexpected ciphertext length: {}", len)));
            }
        };

        let ss = sk.try_decaps(&ct_obj)
            .map_err(|_| NspError::CryptoError("Decapsulation failed".to_string()))?;
            
        Ok(ss.into_bytes().to_vec())
    }
}

/// Post-Quantum Digital Signature (ML-DSA-65)
pub struct Dsa {
    public_key: Vec<u8>,
    secret_key: Vec<u8>,
}

impl Dsa {
    pub fn generate() -> Self {
        let (pk, sk) = ml_dsa_65::KG::try_keygen().expect("ML-DSA Keygen failed");
        Self {
            public_key: pk.into_bytes().to_vec(),
            secret_key: sk.into_bytes().to_vec(),
        }
    }

    pub fn public_key_bytes(&self) -> &[u8] {
        &self.public_key
    }

    pub fn sign(&self, message: &[u8]) -> Result<Vec<u8>, NspError> {
        let sk_arr: [u8; 4032] = self.secret_key.as_slice().try_into()
            .map_err(|_| NspError::CryptoError("Invalid secret key length".to_string()))?;
        
        let sk = <ml_dsa_65::KG as KeyGen204>::PrivateKey::try_from_bytes(sk_arr)
            .map_err(|_| NspError::CryptoError("Invalid secret key format".to_string()))?;
        
        let sig = sk.try_sign(message, &[])
            .map_err(|_| NspError::CryptoError("Signing failed".to_string()))?;
        Ok(sig.to_vec())
    }

    pub fn verify(pk_bytes: &[u8], message: &[u8], signature: &[u8]) -> bool {
        let pk_arr: [u8; 1952] = match pk_bytes.try_into() {
            Ok(arr) => arr,
            Err(_) => return false,
        };
        
        let pk = match <ml_dsa_65::KG as KeyGen204>::PublicKey::try_from_bytes(pk_arr) {
            Ok(key) => key,
            Err(_) => return false,
        };
        
        let sig_arr: [u8; 3309] = match signature.try_into() {
            Ok(arr) => arr,
            Err(_) => return false,
        };
        
        pk.verify(message, &sig_arr, &[])
    }
}

/// AES-256-GCM Authenticated Encryption
pub struct Cipher {
    key: [u8; 32],
}

impl Cipher {
    pub fn new(key: [u8; 32]) -> Self {
        Self { key }
    }

    pub fn encrypt(&self, nonce: &[u8; 12], plaintext: &[u8]) -> Result<Vec<u8>, NspError> {
        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|e| NspError::CryptoError(e.to_string()))?;
        let nonce = Nonce::from_slice(nonce);
        cipher.encrypt(nonce, plaintext)
            .map_err(|e| NspError::CryptoError(e.to_string()))
    }

    pub fn decrypt(&self, nonce: &[u8; 12], ciphertext: &[u8]) -> Result<Vec<u8>, NspError> {
        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|e| NspError::CryptoError(e.to_string()))?;
        let nonce = Nonce::from_slice(nonce);
        cipher.decrypt(nonce, ciphertext)
            .map_err(|e| NspError::CryptoError(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kem_workflow() {
        let server = Kem::generate();
        let (ct, ss_client) = Kem::encapsulate(server.public_key_bytes()).unwrap();
        eprintln!("Ciphertext length: {}, Shared secret length: {}", ct.len(), ss_client.len());
        let ss_server = server.decapsulate(&ct).unwrap();
        assert_eq!(ss_client, ss_server);
    }

    #[test]
    fn test_dsa_workflow() {
        let signer = Dsa::generate();
        let message = b"Neural data frame 0x42";
        let sig = signer.sign(message).unwrap();
        assert!(Dsa::verify(signer.public_key_bytes(), message, &sig));
    }
}
