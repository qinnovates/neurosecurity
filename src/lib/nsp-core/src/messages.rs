use serde::{Deserialize, Serialize};
use crate::NspError;

/// Protocol version
pub const PROTOCOL_VERSION: u8 = 0x01;

/// Cipher suite identifier for AES-256-GCM
pub const CIPHER_SUITE_AES256GCM: u8 = 0x01;

/// Session configuration parameters
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SessionParams {
    /// Maximum neural data frame size in bytes
    pub max_frame_size: u32,
    /// Session timeout in seconds
    pub timeout_seconds: u32,
    /// Cipher suite (always AES-256-GCM for now)
    pub cipher_suite: u8,
}

impl Default for SessionParams {
    fn default() -> Self {
        Self {
            max_frame_size: 1024 * 1024, // 1 MB
            timeout_seconds: 3600,        // 1 hour
            cipher_suite: CIPHER_SUITE_AES256GCM,
        }
    }
}

/// Client initiates handshake with KEM public key and signature
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientHello {
    /// Protocol version
    pub version: u8,
    /// Client identifier (32 bytes)
    pub client_id: [u8; 32],
    /// ML-KEM-768 public key (1184 bytes)
    pub kem_public_key: Vec<u8>,
    /// Unix timestamp (seconds since epoch)
    pub timestamp: u64,
    /// ML-DSA-65 signature over all above fields (3309 bytes)
    pub signature: Vec<u8>,
}

impl ClientHello {
    /// Create a new ClientHello message
    pub fn new(
        client_id: [u8; 32],
        kem_public_key: Vec<u8>,
        timestamp: u64,
        signature: Vec<u8>,
    ) -> Self {
        Self {
            version: PROTOCOL_VERSION,
            client_id,
            kem_public_key,
            timestamp,
            signature,
        }
    }

    /// Get the data to be signed (all fields except signature)
    pub fn signing_data(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.push(self.version);
        data.extend_from_slice(&self.client_id);
        data.extend_from_slice(&self.kem_public_key);
        data.extend_from_slice(&self.timestamp.to_be_bytes());
        data
    }
}

/// Server responds with KEM ciphertext and session parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerHello {
    /// Protocol version
    pub version: u8,
    /// Unique session identifier (32 bytes)
    pub session_id: [u8; 32],
    /// ML-KEM-768 ciphertext (1088 bytes)
    pub kem_ciphertext: Vec<u8>,
    /// Session configuration parameters
    pub session_params: SessionParams,
    /// Unix timestamp (seconds since epoch)
    pub timestamp: u64,
    /// ML-DSA-65 signature over all above fields (3309 bytes)
    pub signature: Vec<u8>,
}

impl ServerHello {
    /// Create a new ServerHello message
    pub fn new(
        session_id: [u8; 32],
        kem_ciphertext: Vec<u8>,
        session_params: SessionParams,
        timestamp: u64,
        signature: Vec<u8>,
    ) -> Self {
        Self {
            version: PROTOCOL_VERSION,
            session_id,
            kem_ciphertext,
            session_params,
            timestamp,
            signature,
        }
    }

    /// Get the data to be signed (all fields except signature)
    pub fn signing_data(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.push(self.version);
        data.extend_from_slice(&self.session_id);
        data.extend_from_slice(&self.kem_ciphertext);
        
        // Serialize session params
        data.extend_from_slice(&self.session_params.max_frame_size.to_be_bytes());
        data.extend_from_slice(&self.session_params.timeout_seconds.to_be_bytes());
        data.push(self.session_params.cipher_suite);
        
        data.extend_from_slice(&self.timestamp.to_be_bytes());
        data
    }
}

/// Client confirms session with encrypted validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientConfirm {
    /// Session identifier (32 bytes)
    pub session_id: [u8; 32],
    /// AES-GCM encrypted payload
    pub encrypted_payload: Vec<u8>,
}

impl ClientConfirm {
    /// Create a new ClientConfirm message
    pub fn new(session_id: [u8; 32], encrypted_payload: Vec<u8>) -> Self {
        Self {
            session_id,
            encrypted_payload,
        }
    }
}

/// Payload inside ClientConfirm (before encryption)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientConfirmPayload {
    /// Client identifier (32 bytes)
    pub client_id: [u8; 32],
    /// Session identifier (32 bytes)
    pub session_id: [u8; 32],
    /// Unix timestamp (seconds since epoch)
    pub timestamp: u64,
}

/// Server acknowledges session establishment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerReady {
    /// Session identifier (32 bytes)
    pub session_id: [u8; 32],
    /// AES-GCM encrypted payload
    pub encrypted_payload: Vec<u8>,
}

impl ServerReady {
    /// Create a new ServerReady message
    pub fn new(session_id: [u8; 32], encrypted_payload: Vec<u8>) -> Self {
        Self {
            session_id,
            encrypted_payload,
        }
    }
}

/// Payload inside ServerReady (before encryption)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerReadyPayload {
    /// Session identifier (32 bytes)
    pub session_id: [u8; 32],
    /// Ready status
    pub ready: bool,
    /// Unix timestamp (seconds since epoch)
    pub timestamp: u64,
}

/// Handshake message envelope
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HandshakeMessage {
    ClientHello(ClientHello),
    ServerHello(ServerHello),
    ClientConfirm(ClientConfirm),
    ServerReady(ServerReady),
}

impl HandshakeMessage {
    /// Serialize message to bytes
    /// Format: [TYPE:1][LENGTH:4][PAYLOAD:N]
    pub fn to_bytes(&self) -> Result<Vec<u8>, NspError> {
        // Serialize the message payload
        let payload = bincode::serialize(self)
            .map_err(|e| NspError::SerializationError(format!("Failed to serialize message: {}", e)))?;
        
        // Create framed message: [TYPE][LENGTH][PAYLOAD]
        let mut framed = Vec::new();
        
        // Message type tag
        let msg_type = match self {
            HandshakeMessage::ClientHello(_) => 0x01u8,
            HandshakeMessage::ServerHello(_) => 0x02u8,
            HandshakeMessage::ClientConfirm(_) => 0x03u8,
            HandshakeMessage::ServerReady(_) => 0x04u8,
        };
        framed.push(msg_type);
        
        // Payload length (4 bytes, big-endian)
        let length = payload.len() as u32;
        framed.extend_from_slice(&length.to_be_bytes());
        
        // Payload
        framed.extend_from_slice(&payload);
        
        Ok(framed)
    }
    
    /// Deserialize message from bytes
    /// Format: [TYPE:1][LENGTH:4][PAYLOAD:N]
    pub fn from_bytes(data: &[u8]) -> Result<Self, NspError> {
        if data.len() < 5 {
            return Err(NspError::SerializationError(
                "Message too short (need at least 5 bytes for header)".to_string()
            ));
        }
        
        // Parse message type
        let msg_type = data[0];
        
        // Parse length
        let length_bytes: [u8; 4] = data[1..5].try_into()
            .map_err(|_| NspError::SerializationError("Failed to parse length".to_string()))?;
        let length = u32::from_be_bytes(length_bytes) as usize;
        
        // Validate length
        if data.len() < 5 + length {
            return Err(NspError::SerializationError(
                format!("Message incomplete: expected {} bytes, got {}", 5 + length, data.len())
            ));
        }
        
        // Extract payload
        let payload = &data[5..5 + length];
        
        // Deserialize based on type
        let message = bincode::deserialize(payload)
            .map_err(|e| NspError::SerializationError(format!("Failed to deserialize message: {}", e)))?;
        
        // Verify type matches
        match (&message, msg_type) {
            (HandshakeMessage::ClientHello(_), 0x01) |
            (HandshakeMessage::ServerHello(_), 0x02) |
            (HandshakeMessage::ClientConfirm(_), 0x03) |
            (HandshakeMessage::ServerReady(_), 0x04) => Ok(message),
            _ => Err(NspError::SerializationError(
                format!("Message type mismatch: tag={}, content={:?}", msg_type, message)
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_params_default() {
        let params = SessionParams::default();
        assert_eq!(params.max_frame_size, 1024 * 1024);
        assert_eq!(params.timeout_seconds, 3600);
        assert_eq!(params.cipher_suite, CIPHER_SUITE_AES256GCM);
    }

    #[test]
    fn test_client_hello_serialization() {
        let client_id = [1u8; 32];
        let kem_pk = vec![2u8; 1184];
        let signature = vec![3u8; 3309];
        let timestamp = 1234567890;
        
        let hello = ClientHello::new(client_id, kem_pk.clone(), timestamp, signature.clone());
        let msg = HandshakeMessage::ClientHello(hello.clone());
        
        // Serialize and deserialize
        let bytes = msg.to_bytes().unwrap();
        let decoded = HandshakeMessage::from_bytes(&bytes).unwrap();
        
        // Verify
        match decoded {
            HandshakeMessage::ClientHello(decoded_hello) => {
                assert_eq!(decoded_hello.version, PROTOCOL_VERSION);
                assert_eq!(decoded_hello.client_id, client_id);
                assert_eq!(decoded_hello.kem_public_key, kem_pk);
                assert_eq!(decoded_hello.timestamp, timestamp);
                assert_eq!(decoded_hello.signature, signature);
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_server_hello_serialization() {
        let session_id = [4u8; 32];
        let kem_ct = vec![5u8; 1088];
        let params = SessionParams::default();
        let signature = vec![6u8; 3309];
        let timestamp = 1234567890;
        
        let hello = ServerHello::new(session_id, kem_ct.clone(), params.clone(), timestamp, signature.clone());
        let msg = HandshakeMessage::ServerHello(hello);
        
        // Serialize and deserialize
        let bytes = msg.to_bytes().unwrap();
        let decoded = HandshakeMessage::from_bytes(&bytes).unwrap();
        
        // Verify
        match decoded {
            HandshakeMessage::ServerHello(decoded_hello) => {
                assert_eq!(decoded_hello.version, PROTOCOL_VERSION);
                assert_eq!(decoded_hello.session_id, session_id);
                assert_eq!(decoded_hello.kem_ciphertext, kem_ct);
                assert_eq!(decoded_hello.session_params, params);
                assert_eq!(decoded_hello.timestamp, timestamp);
                assert_eq!(decoded_hello.signature, signature);
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_client_confirm_serialization() {
        let session_id = [7u8; 32];
        let encrypted = vec![8u8; 128];
        
        let confirm = ClientConfirm::new(session_id, encrypted.clone());
        let msg = HandshakeMessage::ClientConfirm(confirm);
        
        // Serialize and deserialize
        let bytes = msg.to_bytes().unwrap();
        let decoded = HandshakeMessage::from_bytes(&bytes).unwrap();
        
        // Verify
        match decoded {
            HandshakeMessage::ClientConfirm(decoded_confirm) => {
                assert_eq!(decoded_confirm.session_id, session_id);
                assert_eq!(decoded_confirm.encrypted_payload, encrypted);
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_server_ready_serialization() {
        let session_id = [9u8; 32];
        let encrypted = vec![10u8; 128];
        
        let ready = ServerReady::new(session_id, encrypted.clone());
        let msg = HandshakeMessage::ServerReady(ready);
        
        // Serialize and deserialize
        let bytes = msg.to_bytes().unwrap();
        let decoded = HandshakeMessage::from_bytes(&bytes).unwrap();
        
        // Verify
        match decoded {
            HandshakeMessage::ServerReady(decoded_ready) => {
                assert_eq!(decoded_ready.session_id, session_id);
                assert_eq!(decoded_ready.encrypted_payload, encrypted);
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_message_too_short() {
        let data = vec![0x01, 0x00, 0x00]; // Only 3 bytes
        let result = HandshakeMessage::from_bytes(&data);
        assert!(result.is_err());
    }

    #[test]
    fn test_incomplete_message() {
        let mut data = vec![0x01]; // Type
        data.extend_from_slice(&100u32.to_be_bytes()); // Length = 100
        data.extend_from_slice(&[0u8; 50]); // Only 50 bytes of payload
        
        let result = HandshakeMessage::from_bytes(&data);
        assert!(result.is_err());
    }
}
