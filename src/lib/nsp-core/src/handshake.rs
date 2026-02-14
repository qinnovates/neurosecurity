use crate::{
    Kem, Dsa, Session, NspError, SessionParams,
    ClientHello, ServerHello, ClientConfirm, ServerReady,
    ClientConfirmPayload, ServerReadyPayload,
};
use rand::Rng;
use std::time::{SystemTime, UNIX_EPOCH};

/// Handshake state for tracking protocol progress
#[derive(Debug, Clone, PartialEq)]
pub enum HandshakeState {
    /// Initial state - no handshake started
    Initial,
    /// Client has sent ClientHello
    ClientHelloSent,
    /// Server has received ClientHello and sent ServerHello
    ServerHelloSent,
    /// Client has received ServerHello and sent ClientConfirm
    ClientConfirmSent,
    /// Server has received ClientConfirm and sent ServerReady
    ServerReadySent,
    /// Handshake complete, session established
    Established,
    /// Handshake failed with error message
    Failed(String),
}

/// Client-side handshake manager
pub struct ClientHandshake {
    state: HandshakeState,
    client_id: [u8; 32],
    kem: Kem,
    dsa: Dsa,
    session: Option<Session>,
}

impl ClientHandshake {
    /// Create a new client handshake
    pub fn new(client_id: [u8; 32]) -> Self {
        Self {
            state: HandshakeState::Initial,
            client_id,
            kem: Kem::generate(),
            dsa: Dsa::generate(),
            session: None,
        }
    }
    
    /// Get current handshake state
    pub fn state(&self) -> &HandshakeState {
        &self.state
    }
    
    /// Get the established session (if handshake is complete)
    pub fn session(&self) -> Option<&Session> {
        self.session.as_ref()
    }
    
    /// Take ownership of the established session
    pub fn take_session(mut self) -> Option<Session> {
        self.session.take()
    }
    
    /// Create ClientHello message
    pub fn create_hello(&mut self) -> Result<ClientHello, NspError> {
        if self.state != HandshakeState::Initial {
            return Err(NspError::HandshakeError(
                format!("Cannot create ClientHello in state {:?}", self.state)
            ));
        }
        
        // Get current timestamp
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| NspError::CryptoError("System time error".to_string()))?
            .as_secs();
        
        // Create unsigned message
        let hello = ClientHello::new(
            self.client_id,
            self.kem.public_key_bytes().to_vec(),
            timestamp,
            vec![], // Placeholder for signature
        );
        
        // Sign the message
        let signing_data = hello.signing_data();
        let signature = self.dsa.sign(&signing_data)?;
        
        // Create final signed message
        let signed_hello = ClientHello::new(
            self.client_id,
            self.kem.public_key_bytes().to_vec(),
            timestamp,
            signature,
        );
        
        self.state = HandshakeState::ClientHelloSent;
        Ok(signed_hello)
    }
    
    /// Process ServerHello and derive session key
    pub fn process_server_hello(
        &mut self,
        server_hello: ServerHello,
        server_dsa_pk: &[u8],
    ) -> Result<(), NspError> {
        if self.state != HandshakeState::ClientHelloSent {
            return Err(NspError::HandshakeError(
                format!("Cannot process ServerHello in state {:?}", self.state)
            ));
        }
        
        // Verify timestamp is recent (within 5 minutes)
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| NspError::CryptoError("System time error".to_string()))?
            .as_secs();
        
        if now.abs_diff(server_hello.timestamp) > 300 {
            self.state = HandshakeState::Failed("ServerHello timestamp too old/new".to_string());
            return Err(NspError::HandshakeError("Invalid timestamp".to_string()));
        }
        
        // Verify signature
        let signing_data = server_hello.signing_data();
        if !Dsa::verify(server_dsa_pk, &signing_data, &server_hello.signature) {
            self.state = HandshakeState::Failed("ServerHello signature verification failed".to_string());
            return Err(NspError::HandshakeError("Invalid signature".to_string()));
        }
        
        // Decapsulate to get shared secret
        let shared_secret = self.kem.decapsulate(&server_hello.kem_ciphertext)?;
        
        // Derive session key
        let session = Session::new(
            &shared_secret,
            server_hello.session_id,
            server_hello.session_params,
        )?;
        
        self.session = Some(session);
        self.state = HandshakeState::ServerHelloSent;
        Ok(())
    }
    
    /// Create ClientConfirm message
    pub fn create_confirm(&mut self) -> Result<ClientConfirm, NspError> {
        if self.state != HandshakeState::ServerHelloSent {
            return Err(NspError::HandshakeError(
                format!("Cannot create ClientConfirm in state {:?}", self.state)
            ));
        }
        
        let session = self.session.as_ref()
            .ok_or_else(|| NspError::HandshakeError("No session available".to_string()))?;
        
        // Get current timestamp
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| NspError::CryptoError("System time error".to_string()))?
            .as_secs();
        
        // Create payload
        let payload = ClientConfirmPayload {
            client_id: self.client_id,
            session_id: *session.id(),
            timestamp,
        };
        
        // Serialize payload
        let payload_bytes = bincode::serialize(&payload)
            .map_err(|e| NspError::SerializationError(e.to_string()))?;
        
        // Encrypt payload
        let nonce = rand::thread_rng().r#gen::<[u8; 12]>();
        let mut encrypted = session.encrypt(&nonce, &payload_bytes)?;
        
        // Prepend nonce to encrypted data
        let mut final_payload = nonce.to_vec();
        final_payload.append(&mut encrypted);
        
        let confirm = ClientConfirm::new(*session.id(), final_payload);
        
        self.state = HandshakeState::ClientConfirmSent;
        Ok(confirm)
    }
    
    /// Process ServerReady message
    pub fn process_server_ready(&mut self, server_ready: ServerReady) -> Result<(), NspError> {
        if self.state != HandshakeState::ClientConfirmSent {
            return Err(NspError::HandshakeError(
                format!("Cannot process ServerReady in state {:?}", self.state)
            ));
        }
        
        let session = self.session.as_ref()
            .ok_or_else(|| NspError::HandshakeError("No session available".to_string()))?;
        
        // Verify session ID matches
        if server_ready.session_id != *session.id() {
            self.state = HandshakeState::Failed("Session ID mismatch".to_string());
            return Err(NspError::HandshakeError("Session ID mismatch".to_string()));
        }
        
        // Extract nonce and ciphertext
        if server_ready.encrypted_payload.len() < 12 {
            self.state = HandshakeState::Failed("Invalid ServerReady payload".to_string());
            return Err(NspError::HandshakeError("Payload too short".to_string()));
        }
        
        let nonce: [u8; 12] = server_ready.encrypted_payload[..12].try_into()
            .map_err(|_| NspError::CryptoError("Invalid nonce".to_string()))?;
        let ciphertext = &server_ready.encrypted_payload[12..];
        
        // Decrypt payload
        let plaintext = session.decrypt(&nonce, ciphertext)?;
        
        // Deserialize payload
        let payload: ServerReadyPayload = bincode::deserialize(&plaintext)
            .map_err(|e| NspError::SerializationError(e.to_string()))?;
        
        // Verify session ID and ready status
        if payload.session_id != *session.id() || !payload.ready {
            self.state = HandshakeState::Failed("Invalid ServerReady payload".to_string());
            return Err(NspError::HandshakeError("Invalid payload".to_string()));
        }
        
        self.state = HandshakeState::Established;
        Ok(())
    }
}

/// Server-side handshake manager
pub struct ServerHandshake {
    state: HandshakeState,
    session_id: [u8; 32],
    dsa: Dsa,
    session: Option<Session>,
    client_id: Option<[u8; 32]>,
}

impl ServerHandshake {
    /// Create a new server handshake
    pub fn new() -> Self {
        let session_id = rand::thread_rng().r#gen::<[u8; 32]>();
        
        Self {
            state: HandshakeState::Initial,
            session_id,
            dsa: Dsa::generate(),
            session: None,
            client_id: None,
        }
    }
    
    /// Get current handshake state
    pub fn state(&self) -> &HandshakeState {
        &self.state
    }
    
    /// Get the established session (if handshake is complete)
    pub fn session(&self) -> Option<&Session> {
        self.session.as_ref()
    }
    
    /// Take ownership of the established session
    pub fn take_session(mut self) -> Option<Session> {
        self.session.take()
    }
    
    /// Get server's DSA public key for client verification
    pub fn public_key_bytes(&self) -> &[u8] {
        self.dsa.public_key_bytes()
    }
    
    /// Process ClientHello and validate signature
    pub fn process_client_hello(
        &mut self,
        client_hello: ClientHello,
        client_dsa_pk: &[u8],
    ) -> Result<(), NspError> {
        if self.state != HandshakeState::Initial {
            return Err(NspError::HandshakeError(
                format!("Cannot process ClientHello in state {:?}", self.state)
            ));
        }
        
        // Verify timestamp is recent (within 5 minutes)
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| NspError::CryptoError("System time error".to_string()))?
            .as_secs();
        
        if now.abs_diff(client_hello.timestamp) > 300 {
            self.state = HandshakeState::Failed("ClientHello timestamp too old/new".to_string());
            return Err(NspError::HandshakeError("Invalid timestamp".to_string()));
        }
        
        // Verify signature
        let signing_data = client_hello.signing_data();
        if !Dsa::verify(client_dsa_pk, &signing_data, &client_hello.signature) {
            self.state = HandshakeState::Failed("ClientHello signature verification failed".to_string());
            return Err(NspError::HandshakeError("Invalid signature".to_string()));
        }
        
        // Store client ID
        self.client_id = Some(client_hello.client_id);
        
        Ok(())
    }
    
    /// Create ServerHello message
    pub fn create_server_hello(
        &mut self,
        client_kem_pk: &[u8],
        params: SessionParams,
    ) -> Result<ServerHello, NspError> {
        if self.state != HandshakeState::Initial {
            return Err(NspError::HandshakeError(
                format!("Cannot create ServerHello in state {:?}", self.state)
            ));
        }
        
        // Encapsulate to create ciphertext and shared secret
        let (ciphertext, shared_secret) = Kem::encapsulate(client_kem_pk)?;
        
        // Derive session key
        let session = Session::new(&shared_secret, self.session_id, params.clone())?;
        self.session = Some(session);
        
        // Get current timestamp
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| NspError::CryptoError("System time error".to_string()))?
            .as_secs();
        
        // Create unsigned message
        let hello = ServerHello::new(
            self.session_id,
            ciphertext,
            params,
            timestamp,
            vec![], // Placeholder for signature
        );
        
        // Sign the message
        let signing_data = hello.signing_data();
        let signature = self.dsa.sign(&signing_data)?;
        
        // Create final signed message
        let signed_hello = ServerHello::new(
            self.session_id,
            hello.kem_ciphertext,
            hello.session_params,
            timestamp,
            signature,
        );
        
        self.state = HandshakeState::ServerHelloSent;
        Ok(signed_hello)
    }
    
    /// Process ClientConfirm message
    pub fn process_client_confirm(&mut self, client_confirm: ClientConfirm) -> Result<(), NspError> {
        if self.state != HandshakeState::ServerHelloSent {
            return Err(NspError::HandshakeError(
                format!("Cannot process ClientConfirm in state {:?}", self.state)
            ));
        }
        
        let session = self.session.as_ref()
            .ok_or_else(|| NspError::HandshakeError("No session available".to_string()))?;
        
        // Verify session ID matches
        if client_confirm.session_id != *session.id() {
            self.state = HandshakeState::Failed("Session ID mismatch".to_string());
            return Err(NspError::HandshakeError("Session ID mismatch".to_string()));
        }
        
        // Extract nonce and ciphertext
        if client_confirm.encrypted_payload.len() < 12 {
            self.state = HandshakeState::Failed("Invalid ClientConfirm payload".to_string());
            return Err(NspError::HandshakeError("Payload too short".to_string()));
        }
        
        let nonce: [u8; 12] = client_confirm.encrypted_payload[..12].try_into()
            .map_err(|_| NspError::CryptoError("Invalid nonce".to_string()))?;
        let ciphertext = &client_confirm.encrypted_payload[12..];
        
        // Decrypt payload
        let plaintext = session.decrypt(&nonce, ciphertext)?;
        
        // Deserialize payload
        let payload: ClientConfirmPayload = bincode::deserialize(&plaintext)
            .map_err(|e| NspError::SerializationError(e.to_string()))?;
        
        // Verify client ID and session ID match
        let expected_client_id = self.client_id
            .ok_or_else(|| NspError::HandshakeError("No client ID stored".to_string()))?;
        
        if payload.client_id != expected_client_id || payload.session_id != *session.id() {
            self.state = HandshakeState::Failed("Invalid ClientConfirm payload".to_string());
            return Err(NspError::HandshakeError("Invalid payload".to_string()));
        }
        
        Ok(())
    }
    
    /// Create ServerReady message
    pub fn create_ready(&mut self) -> Result<ServerReady, NspError> {
        if self.state != HandshakeState::ServerHelloSent {
            return Err(NspError::HandshakeError(
                format!("Cannot create ServerReady in state {:?}", self.state)
            ));
        }
        
        let session = self.session.as_ref()
            .ok_or_else(|| NspError::HandshakeError("No session available".to_string()))?;
        
        // Get current timestamp
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| NspError::CryptoError("System time error".to_string()))?
            .as_secs();
        
        // Create payload
        let payload = ServerReadyPayload {
            session_id: *session.id(),
            ready: true,
            timestamp,
        };
        
        // Serialize payload
        let payload_bytes = bincode::serialize(&payload)
            .map_err(|e| NspError::SerializationError(e.to_string()))?;
        
        // Encrypt payload
        let nonce = rand::thread_rng().r#gen::<[u8; 12]>();
        let mut encrypted = session.encrypt(&nonce, &payload_bytes)?;
        
        // Prepend nonce to encrypted data
        let mut final_payload = nonce.to_vec();
        final_payload.append(&mut encrypted);
        
        let ready = ServerReady::new(*session.id(), final_payload);
        
        self.state = HandshakeState::ServerReadySent;
        Ok(ready)
    }
    
    /// Mark handshake as established (after sending ServerReady)
    pub fn mark_established(&mut self) -> Result<(), NspError> {
        if self.state != HandshakeState::ServerReadySent {
            return Err(NspError::HandshakeError(
                format!("Cannot mark established in state {:?}", self.state)
            ));
        }
        
        self.state = HandshakeState::Established;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_full_handshake_flow() {
        let client_id = [0x11; 32];
        let mut client = ClientHandshake::new(client_id);
        let mut server = ServerHandshake::new();
        
        let client_dsa_pk = client.dsa.public_key_bytes().to_vec();
        let server_dsa_pk = server.public_key_bytes().to_vec();
        let params = SessionParams::default();

        // 1. Client -> Server: ClientHello
        let client_hello = client.create_hello().unwrap();
        assert_eq!(*client.state(), HandshakeState::ClientHelloSent);
        
        server.process_client_hello(client_hello.clone(), &client_dsa_pk).unwrap();

        // 2. Server -> Client: ServerHello
        let server_hello = server.create_server_hello(&client_hello.kem_public_key, params).unwrap();
        assert_eq!(*server.state(), HandshakeState::ServerHelloSent);
        
        client.process_server_hello(server_hello, &server_dsa_pk).unwrap();
        assert_eq!(*client.state(), HandshakeState::ServerHelloSent);

        // 3. Client -> Server: ClientConfirm
        let client_confirm = client.create_confirm().unwrap();
        assert_eq!(*client.state(), HandshakeState::ClientConfirmSent);
        
        server.process_client_confirm(client_confirm).unwrap();

        // 4. Server -> Client: ServerReady
        let server_ready = server.create_ready().unwrap();
        assert_eq!(*server.state(), HandshakeState::ServerReadySent);
        
        client.process_server_ready(server_ready).unwrap();
        assert_eq!(*client.state(), HandshakeState::Established);
        
        server.mark_established().unwrap();
        assert_eq!(*server.state(), HandshakeState::Established);

        // Verify session keys match
        let client_session = client.session().unwrap();
        let server_session = server.session().unwrap();
        assert_eq!(client_session.id(), server_session.id());
        
        // Final sanity check: try encrypting with one and decrypting with the other
        let nonce = [0x99; 12];
        let data = b"Neural signal established";
        let encrypted = client_session.encrypt(&nonce, data).unwrap();
        let decrypted = server_session.decrypt(&nonce, &encrypted).unwrap();
        assert_eq!(decrypted, data);
    }

    #[test]
    fn test_handshake_invalid_signature() {
        let client_id = [0x22; 32];
        let mut client = ClientHandshake::new(client_id);
        let mut server = ServerHandshake::new();
        
        let mut client_hello = client.create_hello().unwrap();
        let client_dsa_pk = client.dsa.public_key_bytes().to_vec();
        
        // Corrupt the signature
        client_hello.signature[0] ^= 0xFF;
        
        let result = server.process_client_hello(client_hello, &client_dsa_pk);
        
        assert!(result.is_err());
        match server.state() {
            HandshakeState::Failed(msg) => assert!(msg.contains("signature")),
            _ => panic!("Expected state to be Failed"),
        }
    }

    #[test]
    fn test_handshake_timestamp_expiry() {
        let client_id = [0x33; 32];
        let mut client = ClientHandshake::new(client_id);
        let mut server = ServerHandshake::new();
        
        let mut client_hello = client.create_hello().unwrap();
        let client_dsa_pk = client.dsa.public_key_bytes().to_vec();
        
        // Set timestamp back by 10 minutes
        client_hello.timestamp -= 600;
        
        // Resign so signature is valid but timestamp is old
        let signing_data = client_hello.signing_data();
        let signature = client.dsa.sign(&signing_data).unwrap();
        client_hello.signature = signature;

        let result = server.process_client_hello(client_hello, &client_dsa_pk);
        
        assert!(result.is_err());
        match server.state() {
            HandshakeState::Failed(msg) => assert!(msg.contains("timestamp")),
            _ => panic!("Expected state to be Failed"),
        }
    }
}
