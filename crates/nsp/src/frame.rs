//! NSP Frame Pipeline
//! 
//! Implements the 5-stage processing order: 
//! 1. Compress
//! 2. QI Compute
//! 3. Build Header
//! 4. Encrypt
//! 5. Sign

use serde::{Serialize, Deserialize};
use crate::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NspFrame {
    pub header: FrameHeader,
    pub payload: Vec<u8>,
    pub auth_tag: [u8; 16],
    pub signature: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameHeader {
    pub version: u8,
    pub flags: u8,
    pub frame_type: u8,
    pub band_id: u8,
    pub sequence_number: u32,
    pub timestamp: u32,
    pub qi_score: u16,
    pub qi_components: u16,
    pub payload_length: u16,
    pub cipher_suite: u16,
}

impl NspFrame {
    /// Step 1 & 2: Processes raw neural data into a frame (Simplified PoC)
    pub fn build(
        raw_data: &[u8], 
        seq: u32, 
        ts: u32, 
        band: u8,
        qi_score: u16
    ) -> Result<Self> {
        // 1. COMPRESS (Placeholder)
        let payload = raw_data.to_vec(); // TODO: Add LZ4/Delta
        
        let header = FrameHeader {
            version: crate::NSP_VERSION,
            flags: 0x00,
            frame_type: 0x00, // DATA
            band_id: band,
            sequence_number: seq,
            timestamp: ts,
            qi_score,
            qi_components: 0,
            payload_length: payload.len() as u16,
            cipher_suite: 0x0001,
        };

        Ok(Self {
            header,
            payload,
            auth_tag: [0u8; 16],
            signature: None,
        })
    }
}
