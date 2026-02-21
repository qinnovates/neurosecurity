//! NSP Handshake State Machine
//! 
//! Handles session establishment and mutual authentication.

use crate::Result;

#[derive(Debug, PartialEq)]
pub enum HandshakeState {
    Init,
    Hello,
    KeyExchange,
    Authenticate,
    Established,
    Error,
}

pub struct HandshakeContext {
    pub state: HandshakeState,
    pub transcript_hash: Vec<u8>,
    // TODO: Add key material and ephemeral values
}

impl HandshakeContext {
    pub fn new() -> Self {
        Self {
            state: HandshakeState::Init,
            transcript_hash: Vec::new(),
        }
    }

    /// Advance the state machine based on incoming messages
    pub fn process_message(&mut self, _msg: &[u8]) -> Result<()> {
        match self.state {
            HandshakeState::Init => {
                // Process ClientHello
                self.state = HandshakeState::Hello;
            }
            HandshakeState::Hello => {
                // Process KeyExchange material
                self.state = HandshakeState::KeyExchange;
            }
            _ => {}
        }
        Ok(())
    }
}
