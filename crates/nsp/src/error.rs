use std::fmt;

#[derive(Debug)]
pub enum NspError {
    CryptoError(String),
    HandshakeError(String),
    FrameError(String),
    IoError(String),
}

impl fmt::Display for NspError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NspError::CryptoError(s) => write!(f, "Crypto error: {}", s),
            NspError::HandshakeError(s) => write!(f, "Handshake error: {}", s),
            NspError::FrameError(s) => write!(f, "Frame error: {}", s),
            NspError::IoError(s) => write!(f, "IO error: {}", s),
        }
    }
}

impl std::error::Error for NspError {}
