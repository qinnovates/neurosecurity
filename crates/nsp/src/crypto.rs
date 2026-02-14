//! Cryptographic primitives for NSP.
//! Implements NIST-standardized Post-Quantum and Hybrid schemes.

use crate::Result;

/// Combined Post-Quantum and Classical Key Material
pub struct HybridSecret {
    pub mlkem_secret: Vec<u8>,
    pub ecdh_secret: Vec<u8>,
}

/// Generic interface for NSP Key Encapsulation
pub trait KeyEncapsulation {
    fn generate_keypair() -> (Vec<u8>, Vec<u8>);
    fn encapsulate(public_key: &[u8]) -> (Vec<u8>, Vec<u8>);
    fn decapsulate(ciphertext: &[u8], secret_key: &[u8]) -> Vec<u8>;
}

/// Generic interface for NSP Digital Signatures
pub trait DigitalSignature {
    fn sign(message: &[u8], secret_key: &[u8]) -> Vec<u8>;
    fn verify(message: &[u8], signature: &[u8], public_key: &[u8]) -> bool;
}
