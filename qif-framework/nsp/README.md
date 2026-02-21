# NSP (Neural Security Protocol)

Post-quantum wire protocol for BCI data links. Designed for implant-class hardware with sub-4ms latency and under 4% power overhead on ARM Cortex-M4.

## Table of Contents

- [Crypto Stack](#crypto-stack)
- [Crates](#crates)
- [Building](#building)
- [Specification](#specification)

## Crypto Stack

| Primitive | Algorithm | Purpose |
|-----------|-----------|---------|
| Key Encapsulation | ML-KEM-768 (FIPS 203) | Post-quantum key exchange |
| Digital Signatures | ML-DSA (FIPS 204) | Authentication and integrity |
| Symmetric Encryption | AES-256-GCM-SIV | Frame-level payload encryption |
| Key Derivation | HKDF-SHA-256 | Session key derivation |

## Crates

### `nsp` (top-level)

The protocol wrapper crate. Includes the scientific audit binary and protocol-level dependencies (Kyber, Dilithium, SPHINCS+).

**Modules:** `crypto.rs`, `frame.rs`, `handshake.rs`, `error.rs`

### `nsp-core`

The PQ-secure core implementation. Uses NIST FIPS 203/204 reference crates (`fips203`, `fips204`) for ML-KEM and ML-DSA.

**Modules:** `crypto.rs`, `frame.rs`, `handshake.rs`, `error.rs`

## Building

Requires Rust (edition 2024 for nsp-core, 2021 for nsp).

```bash
# Build both crates
cd qif-framework/nsp
cargo build

# Run tests
cargo test

# Run the scientific audit binary
cargo run --bin scientific_audit
```

## Specification

- Full protocol spec: [NSP-PROTOCOL-SPEC.md](../NSP-PROTOCOL-SPEC.md) (94 KB)
- Pitch document: [NSP-PITCH.md](../NSP-PITCH.md)
- Website: [qinnovate.com/nsp](https://qinnovate.com/nsp/)

---

*v0.5, Secure Core Complete. Apache 2.0.*
