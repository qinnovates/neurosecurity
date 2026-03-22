//! Neural Sensory Protocol (NSP)
//! 
//! A post-quantum security protocol for brain-computer interface (BCI) data links.

pub mod crypto;
pub mod frame;
pub mod handshake;
pub mod error;

pub use error::NspError;
pub type Result<T> = std::result::Result<T, NspError>;

/// Protocol version defined by this implementation
pub const NSP_VERSION: u8 = 0x01;
