# Neural Sensory Protocol (NSP) — Protocol Specification

```
Title:          Neural Sensory Protocol (NSP) v0.3
Version:        0.3
Date:           2026-02-06
Status:         Draft
Author:         Kevin Qi (Qinnovate)
Framework:      QIF v4.0 Hourglass Model (11-band, 7-1-3)
```

---

## Abstract

The Neural Sensory Protocol (NSP) defines a post-quantum security protocol for brain-computer interface (BCI) data links. NSP provides authenticated encryption, signal integrity verification, and key lifecycle management for neural data transmitted between implanted or wearable BCI hardware and receiving systems. The protocol is designed for devices with operational lifetimes of 20 years or more, during which currently deployed classical key exchange algorithms (ECDH, RSA) will become vulnerable to quantum computing attacks.

NSP implements five independent defense layers: hardware root of trust, hybrid post-quantum key exchange, physics-based signal integrity scoring, adaptive per-user anomaly detection, and electromagnetic environment monitoring. Each layer addresses a distinct threat class. No single layer claims comprehensive protection. The composition of all five layers provides defense-in-depth coverage across firmware compromise, quantum key recovery, signal injection, replay, and electromagnetic interference attacks.

The protocol targets less than 5% power overhead on implantable hardware (estimated 3.25% at 40 mW). All cryptographic primitives are NIST-standardized (FIPS 203, FIPS 204, FIPS 205). The frame format, handshake state machine, key hierarchy, and device class requirements are specified in this document.

---

## Table of Contents

1. [Terminology](#1-terminology)
2. [Protocol Overview](#2-protocol-overview)
3. [Frame Format](#3-frame-format)
4. [Handshake Protocol](#4-handshake-protocol)
5. [Cryptographic Primitives](#5-cryptographic-primitives)
6. [QI Integration](#6-qi-integration)
7. [Key Lifecycle](#7-key-lifecycle)
8. [Device Class Requirements](#8-device-class-requirements)
9. [Power Budget](#9-power-budget)
10. [Security Considerations](#10-security-considerations)
11. [Test Vectors](#11-test-vectors)
12. [References](#12-references)

---

## 1. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 [RFC2119].

| Term | Definition |
|------|-----------|
| **BCI** | Brain-Computer Interface. A device that records or stimulates neural activity. |
| **NSP** | Neural Sensory Protocol. The protocol defined by this specification. |
| **QI** | Quantum Indeterminacy score. A composite signal integrity metric ranging from 0 (maximally anomalous) to 1 (perfectly normal). |
| **QIF** | Quantum Indeterministic Framework for Neural Security. The security framework from which NSP derives its signal integrity model. |
| **Band** | One of eleven QIF v4.0 Hourglass bands: N7, N6, N5, N4, N3, N2, N1, I0, S1, S2, S3. |
| **Frame** | The fundamental unit of NSP-protected data transmission. |
| **Frame group** | A sequence of frames sharing a single Merkle root signature. Group size is negotiated during handshake (range: 1 to 256, default: 100). |
| **Session** | A cryptographically authenticated connection between two NSP endpoints. |
| **Device Root Key (DRK)** | The long-lived asymmetric keypair provisioned at manufacturing. Stored in a secure enclave. |
| **Session Key (SK)** | A symmetric key derived during handshake. Used for frame encryption. Lifetime bounded by rotation interval. |
| **Frame Key (FK)** | A per-frame nonce-derived encryption context. Derived from SK and frame sequence number. |
| **HNDL** | Harvest Now, Decrypt Later. The adversary strategy of recording encrypted traffic for future quantum decryption. |
| **PQC** | Post-Quantum Cryptography. Cryptographic algorithms resistant to attacks by both classical and quantum computers. |
| **ML-KEM** | Module-Lattice-Based Key Encapsulation Mechanism. NIST FIPS 203. |
| **ML-DSA** | Module-Lattice-Based Digital Signature Algorithm. NIST FIPS 204. |
| **SLH-DSA (SPHINCS+)** | Stateless Hash-Based Digital Signature Algorithm. NIST FIPS 205. |
| **TTT** | Test-Time Training. An adaptive machine learning technique for per-user baseline detection. |
| **SCA** | Side-Channel Attack. Attacks exploiting physical emissions (power, EM, timing) rather than algorithmic weaknesses. |
| **Secure Enclave** | A hardware-isolated execution environment for key storage and cryptographic operations (e.g., ARM TrustZone, dedicated security co-processor). |
| **TRNG** | True Random Number Generator. A hardware entropy source. |

---

## 2. Protocol Overview

### 2.1 Architecture

NSP defines five defense layers. Each layer operates independently. Failure of one layer does not compromise the others.

```
+================================================================+
|  LAYER 5: EM Environment Monitoring                            |
|  Spectral scanning, resonance shield interface                 |
|  [Implanted devices only. Future/research.]                    |
+================================================================+
|  LAYER 4: Adaptive Per-User Detection (TTT)                    |
|  Personalized baseline, test-time training                     |
|  [Clinical and implanted devices]                              |
+================================================================+
|  LAYER 3: QI Signal Integrity                                  |
|  Per-frame QI scoring, anomaly detection                       |
|  [All device classes]                                          |
+================================================================+
|  LAYER 2: Hybrid Post-Quantum Key Exchange                     |
|  ECDH + ML-KEM, ML-DSA signatures, AES-256-GCM encryption     |
|  [All device classes]                                          |
+================================================================+
|  LAYER 1: Hardware Root of Trust                               |
|  SPHINCS+-signed secure boot, firmware attestation, TRNG       |
|  [Clinical and implanted devices]                              |
+================================================================+

                        NSP 5-Layer Stack
```

### 2.2 Data Pipeline

NSP mandates the following processing order. This order is non-negotiable.

```
Raw Neural Data
       |
       v
  [1] COMPRESS (delta encode + LZ4, lossless)
       |
       v
  [2] COMPUTE QI (4 classical terms on existing signal data)
       |
       v
  [3] BUILD NSP FRAME (header + compressed payload + Merkle link)
       |
       v
  [4] ENCRYPT (AES-256-GCM, authenticated)
       |
       v
  [5] SIGN (ML-DSA per frame group, SPHINCS+ for key rotation)
       |
       v
  TRANSMIT
```

Rationale: Compressed data is smaller (reduces encryption cost). Encrypted data is pseudorandom (cannot be compressed after encryption). Signatures cover ciphertext (Encrypt-then-MAC paradigm). Reversing any step in this order degrades either efficiency or security.

On the receiver side, the pipeline runs in reverse:

```
RECEIVE --> Verify Signature --> Decrypt --> Decompress --> Verify QI --> ACCEPT / REJECT
```

### 2.3 Device Class Tiers

NSP defines three device classes. Each class activates a subset of the five layers.

| Tier | Device Class | Examples | Active Layers | Mandatory |
|------|-------------|----------|---------------|-----------|
| **T1** | Consumer | Muse, NeuroSky, OpenBCI | 2, 3 | YES |
| **T2** | Clinical | Synchron Stentrode, research EEG | 1, 2, 3, 4 | YES |
| **T3** | Implanted | Neuralink N1, deep brain stimulators | 1, 2, 3, 4, 5 | YES (L5 when available) |

A device claiming NSP compliance at tier T(n) MUST implement all layers designated as active for that tier. A device MAY implement layers from a higher tier. A consumer device implementing Layer 1 MAY claim T2 compliance if it satisfies all T2 requirements.

### 2.4 QIF Hourglass Mapping

NSP layers map to QIF bands as follows:

| NSP Layer | QIF Band(s) | Security Boundary |
|-----------|-------------|-------------------|
| Layer 1 (Hardware Root of Trust) | S1, S2 | Firmware integrity, boot chain |
| Layer 2 (PQC Key Exchange) | S1, S2, S3 | Key exchange, encryption, authentication |
| Layer 3 (QI Signal Integrity) | I0, N1 | Signal physics at electrode-tissue boundary |
| Layer 4 (Adaptive TTT) | N1, N2 | Per-user statistical baseline |
| Layer 5 (EM Environment) | I0 (physical boundary) | Electromagnetic interference detection |

---

## 3. Frame Format

### 3.1 NSP Frame Header

Every NSP frame begins with a fixed 24-byte header, followed by a variable-length payload.

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|    Version    |     Flags     |  Frame Type   |    Band ID    |  Bytes 0-3
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Sequence Number                         |  Bytes 4-7
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Timestamp (ms)                          |  Bytes 8-11
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          QI Score             |       QI Components           |  Bytes 12-15
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Payload Length        |    Cipher Suite ID            |  Bytes 16-19
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Reserved (MUST be 0)                      |  Bytes 20-23
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|                   Payload (variable length)                   |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                   Merkle Hash Link (32 bytes)                 |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|              AES-256-GCM Authentication Tag (16 bytes)        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### 3.2 Field Definitions

| Field | Offset | Size | Description |
|-------|--------|------|-------------|
| Version | 0 | 1 byte | Protocol version. This specification defines version `0x01`. |
| Flags | 1 | 1 byte | Bitfield. See Section 3.3. |
| Frame Type | 2 | 1 byte | Frame type identifier. See Section 3.4. |
| Band ID | 3 | 1 byte | QIF band identifier (0x00=S3, 0x01=S2, 0x02=S1, 0x03=I0, 0x04=N1, 0x05=N2, 0x06=N3, 0x07=N4, 0x08=N5, 0x09=N6, 0x0A=N7). v4.0 architecture (11-band, 7-1-3). |
| Sequence Number | 4 | 4 bytes | Monotonically increasing per-session frame counter. Big-endian unsigned integer. Wraps at 2^32. |
| Timestamp | 8 | 4 bytes | Milliseconds since session establishment. Big-endian unsigned integer. Wraps at 2^32 (~49.7 days). Receivers MUST handle wrap by treating timestamp as a monotonic counter modulo 2^32; if sessions approach 49.7 days, key rotation (Section 7.3) resets the session clock. |
| QI Score | 12 | 2 bytes | QI value encoded as unsigned 16-bit fixed-point (0x0000 = 0.0, 0xFFFF = 1.0). Resolution: ~0.0000153. |
| QI Components | 14 | 2 bytes | Packed 4-bit fields for individual anomaly indicators: [phase(4)][transport(4)][amplitude(4)][scale-freq(4)]. Each field: 0x0=normal, 0xF=max anomaly. Note: Quantum anomaly terms (Q̂i, Q̂t, Q̂e) are not encoded in this field in v0.3. Future revisions MAY extend QI Components to 4 bytes to include quantum indicators for Tier T3 devices. |
| Payload Length | 16 | 2 bytes | Length of the payload in bytes. Big-endian unsigned integer. Maximum: 65,535 bytes. |
| Cipher Suite ID | 18 | 2 bytes | Identifies the active cipher suite. See Section 5.6. |
| Reserved | 20 | 4 bytes | Reserved for future use. Senders MUST set to zero. Receivers MUST ignore. |
| Payload | 24 | variable | Compressed and encrypted neural data. |
| Merkle Hash Link | 24+len | 32 bytes | SHA-256 hash linking this frame to its Merkle tree. See Section 3.6. |
| Auth Tag | 56+len | 16 bytes | AES-256-GCM authentication tag covering header + payload + Merkle link. |

Total frame overhead (excluding payload): 24 (header) + 32 (Merkle) + 16 (auth tag) = **72 bytes**.

### 3.3 Flags Field

```
Bit 7 (MSB): KEY_ROTATION_PENDING  - Receiver should expect a KEY_ROTATION frame.
Bit 6:       QI_ALERT              - QI score below threshold. Frame flagged.
Bit 5:       COMPRESSED            - Payload is compressed. MUST be 1 for DATA frames.
Bit 4:       GROUP_FINAL           - Last frame in a Merkle frame group.
Bit 3:       EMERGENCY             - Emergency condition. Overrides normal processing.
Bits 2-0:    Reserved              - MUST be 0.
```

### 3.4 Frame Types

| Value | Name | Description |
|-------|------|-------------|
| 0x00 | DATA | Neural data payload. Standard transmission frame. |
| 0x01 | HANDSHAKE | Session establishment messages. See Section 4. |
| 0x02 | KEY_ROTATION | Key rotation initiation and completion. See Section 7.3. |
| 0x03 | ALERT | Security alert. Carries alert type, severity, and diagnostic payload. |
| 0x04 | HEARTBEAT | Keep-alive. Sent at configurable intervals. Contains QI summary. |
| 0x05 | FIRMWARE_ATTESTATION | Hardware root of trust attestation report. Layer 1 only. |
| 0x06 | HELLO_RETRY | DoS protection cookie exchange. See Section 4.3.1. |
| 0x07-0xEF | Reserved | Reserved for future frame types. |
| 0xF0-0xFF | Vendor-Specific | Vendor extensions. MUST NOT affect protocol security. |

### 3.5 DATA Frame Payload

The payload of a DATA frame contains compressed neural data. Before encryption, the payload structure is:

```
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Compression Method (1 byte)  |  Channel Count (2 bytes)      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Sample Rate (2 bytes)        |  Bits per Sample (1 byte)     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Window Duration (2 bytes, microseconds)                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|              Compressed Sample Data (variable)                |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

| Compression Method | Value | Description |
|-------------------|-------|-------------|
| NONE | 0x00 | Uncompressed. SHOULD NOT be used except for debugging. |
| DELTA_LZ4 | 0x01 | Delta encoding followed by LZ4. Default. |
| DELTA_ONLY | 0x02 | Delta encoding only. Reduced compute. |
| LZ4_ONLY | 0x03 | LZ4 only. No delta stage. |
| WAVELET | 0x04 | Wavelet compression. Lossy. Clinical approval required. |

### 3.6 Merkle Hash Chain

Frames within a group are linked via a binary Merkle hash tree. The group size `G` is negotiated during handshake (Section 4.8, `frame_group_size` field). Valid range: 1 to 256. Default: 100.

Each frame's leaf hash is computed over the **encrypted** frame (ciphertext + auth tag), not the plaintext:

```
Frame 0:  H0 = SHA-256(encrypted_frame_0 || auth_tag_0)
Frame 1:  H1 = SHA-256(encrypted_frame_1 || auth_tag_1)
...
Frame G-1: H_{G-1} = SHA-256(encrypted_frame_{G-1} || auth_tag_{G-1})
```

The Merkle tree is a balanced binary tree. If `G` is not a power of two, the rightmost leaves are duplicated to pad the tree to the next power of two. Internal nodes are computed as:

```
parent = SHA-256(0x01 || left_child || right_child)
leaf   = SHA-256(0x00 || encrypted_frame_data)
```

The `0x00`/`0x01` domain separation prefix prevents second preimage attacks on the tree structure.

```
Merkle Root = BinaryMerkleTree(H0, H1, ..., H_{G-1})

Group Signature = ML-DSA-65(Merkle Root) || SPHINCS+-SHA2-128s(Merkle Root)
```

For a `frame_group_size` of 1, the Merkle tree construction is bypassed. The group signature consists only of the ML-DSA-65 signature computed over the SHA-256 hash of the single encrypted frame. The SPHINCS+ signature is omitted in this minimum-latency configuration; SPHINCS+ signing is deferred to key rotation events (Section 7.3) where its stronger security assumptions justify the cost.

For group sizes greater than 1, the last frame in a group (GROUP_FINAL flag set) carries the group signature appended after its auth tag. The group signature structure is:

```
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Signature Type (1 byte)      |  Signature Length (2 bytes)   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|          ML-DSA-65 Signature (3,309 bytes)                    |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|     SPHINCS+-SHA2-128s Signature (7,856 bytes)                |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### 3.7 Frame Group Size and Latency

The group size `G` directly determines authentication latency. Receivers MUST buffer frames until the group signature arrives, then verify the Merkle root before accepting any frame in the group. If verification fails, the entire group MUST be rejected.

| Group Size (G) | Auth Latency @ 250 fps | Amortized Signature Overhead | Use Case |
|----------------|------------------------|------------------------------|----------|
| 1 | 4 ms | 11,197 bytes/frame | Closed-loop motor control, seizure abatement |
| 10 | 40 ms | ~1,152 bytes/frame | Real-time neurofeedback |
| 50 | 200 ms | ~256 bytes/frame | Clinical monitoring |
| 100 (default) | 400 ms | ~144 bytes/frame | Research recording, data logging |
| 250 | 1,000 ms | ~77 bytes/frame | Offline analysis, bulk transfer |

For closed-loop applications where authentication latency exceeds the control loop deadline, implementations MUST negotiate a smaller group size. A group size of 1 eliminates Merkle amortization entirely: every frame carries a full ML-DSA-65 signature (3,309 bytes) and SPHINCS+ is omitted (deferred to periodic key rotation signing). This is the maximum-overhead, minimum-latency configuration.

Implementations MUST support group sizes of 1, 10, and 100 at minimum. Other sizes in the range [1, 256] are OPTIONAL.

---

## 4. Handshake Protocol

### 4.1 State Machine

```
    +--------+
    |  INIT  |
    +---+----+
        |
        | (power on / connection request)
        v
    +--------+
    | HELLO  |------> [timeout / failure] ----+
    +---+----+                                 |
        |                                      |
        | (capabilities exchanged)             |
        v                                      |
  +------------+                               |
  |KEY_EXCHANGE|------> [failure] -------------+
  +-----+------+                               |
        |                                      |
        | (hybrid secret derived)              |
        v                                      v
  +--------------+                        +--------+
  | AUTHENTICATE |----> [failure] ------->| ERROR  |
  +------+-------+                        +--------+
         |
         | (mutual auth verified)
         v
  +-------------+
  | ESTABLISHED |<------------+
  +------+------+             |
         |                    |
         | (rotation timer)   |
         v                    |
  +----------+                |
  | REKEYING |----------------+
  +----------+
    (new session key derived)
```

### 4.2 State Definitions

| State | Description | Valid Transitions |
|-------|-------------|-------------------|
| **INIT** | Device powered on or connection initiated. No cryptographic state. | HELLO |
| **HELLO** | Endpoints exchange version, capabilities, cipher suites, and device class. | KEY_EXCHANGE, ERROR |
| **KEY_EXCHANGE** | Hybrid key exchange (ECDH + ML-KEM) executes. Shared secret derived. | AUTHENTICATE, ERROR |
| **AUTHENTICATE** | Mutual authentication via ML-DSA signatures over transcript hash. | ESTABLISHED, ERROR |
| **ESTABLISHED** | Session active. DATA frames flow. QI scoring active. | REKEYING, ERROR, INIT (on disconnect) |
| **REKEYING** | Key rotation in progress. Old key remains valid until new key is confirmed. | ESTABLISHED, ERROR |
| **ERROR** | Unrecoverable error. All session state MUST be securely erased. | INIT (after cooldown) |

### 4.3 Message Sequence

```
  Device (D)                                            Receiver (R)
     |                                                       |
     |  [INIT -> HELLO]                                      |
     |                                                       |
     |---------- ClientHello ------------------------------>|
     |           version, cipher_suites[], device_class,     |
     |           extensions[], random_D (32 bytes)           |
     |                                                       |
     |<--------- HelloRetryRequest -------------------------|  (optional, DoS protection)
     |           cookie (HMAC-based, stateless)              |
     |                                                       |
     |---------- ClientHello (with cookie) ---------------->|  (retransmit with cookie)
     |                                                       |
     |<--------- ServerHello --------------------------------|
     |           version, cipher_suite, extensions[],        |
     |           random_R (32 bytes)                         |
     |                                                       |
     |  [HELLO -> KEY_EXCHANGE]                              |
     |                                                       |
     |---------- ClientKeyExchange ------------------------->|
     |           ecdh_public_D, mlkem_encaps_D               |
     |                                                       |
     |<--------- ServerKeyExchange --------------------------|
     |           ecdh_public_R, mlkem_ciphertext_R           |
     |                                                       |
     |  Both sides compute:                                  |
     |  shared_secret = KDF(ecdh_secret || mlkem_secret)     |
     |  session_key = HKDF-SHA-384(shared_secret,            |
     |                salt=random_D||random_R,               |
     |                info="NSP-v0.1-session-key")           |
     |                                                       |
     |  [KEY_EXCHANGE -> AUTHENTICATE]                       |
     |                                                       |
     |---------- ClientAuth -------------------------------->|
     |           ML-DSA-65 signature over transcript_hash    |
     |           device_certificate (signed by manufacturer) |
     |                                                       |
     |<--------- ServerAuth ---------------------------------|
     |           ML-DSA-65 signature over transcript_hash    |
     |           receiver_certificate                        |
     |                                                       |
     |  [AUTHENTICATE -> ESTABLISHED]                        |
     |                                                       |
     |---------- Finished ---------------------------------->|
     |<--------- Finished -----------------------------------|
     |                                                       |
     |========== DATA frames (encrypted, QI-scored) ========>|
     |                                                       |
```

### 4.3.1 DoS Protection: Stateless Cookie Mechanism

The receiver MAY respond to any ClientHello with a `HelloRetryRequest` instead of a `ServerHello`. This forces the device to prove it can receive messages at its claimed address before the receiver allocates any state or performs expensive cryptographic operations.

The cookie is computed as:

```
cookie = HMAC-SHA-256(server_secret, client_address || random_D || timestamp)
```

Where `server_secret` is a local value rotated periodically (RECOMMENDED: every 60 seconds). The receiver does not store any per-connection state to generate or verify the cookie. This is a stateless operation.

The device MUST retransmit its ClientHello with the received cookie included in the `cookie` extension. The receiver verifies the cookie by recomputing the HMAC. If verification fails, the receiver MUST silently discard the message.

The receiver SHOULD enable cookie verification when:

- More than 10 concurrent handshakes are in progress.
- The device's address is not in a known-good allowlist.
- The receiver is operating on battery power.

The receiver MUST enable cookie verification for Tier T3 (implanted) devices acting as receivers, where battery depletion is a safety concern.

The `HelloRetryRequest` does not count toward the 5-second handshake timeout. The timeout begins after the receiver sends `ServerHello`.

### 4.4 Transcript Hash

The transcript hash is computed incrementally over all handshake messages sent and received, in order. It provides binding between the key exchange, cookie verification, and authentication phases.

If no `HelloRetryRequest` was sent:

```
transcript_hash = SHA-384(ClientHello || ServerHello || ClientKeyExchange || ServerKeyExchange)
```

If a `HelloRetryRequest` was sent (Section 4.3.1):

```
transcript_hash = SHA-384(
    ClientHello_initial || HelloRetryRequest || ClientHello_retry ||
    ServerHello || ClientKeyExchange || ServerKeyExchange
)
```

Including the `HelloRetryRequest` and both ClientHello messages in the transcript binds the cookie exchange to the authenticated session. Without this, an attacker could inject a spurious retry request and desynchronize the transcript view between endpoints.

Both sides MUST compute the transcript hash identically. The ML-DSA signature in the AUTHENTICATE phase covers this hash. Any modification to any handshake message causes authentication failure.

### 4.5 Cipher Suite Negotiation

The ClientHello message contains an ordered list of supported cipher suites. The server selects the first mutually supported suite.

| Suite ID | KEM | Signature | Encryption | KDF | Status |
|----------|-----|-----------|------------|-----|--------|
| 0x0001 | ECDH-P256 + ML-KEM-768 | ML-DSA-65 + SPHINCS+-SHA2-128s | AES-256-GCM | HKDF-SHA-384 | MANDATORY |
| 0x0002 | ECDH-P384 + ML-KEM-1024 | ML-DSA-87 + SPHINCS+-SHA2-256s | AES-256-GCM | HKDF-SHA-384 | OPTIONAL |
| 0x0003 | ML-KEM-768 (PQC-only) | ML-DSA-65 + SPHINCS+-SHA2-128s | AES-256-GCM | HKDF-SHA-384 | OPTIONAL |

Suite 0x0001 is MANDATORY. All NSP implementations MUST support it. Suite 0x0003 removes the classical ECDH component for environments that require pure post-quantum operation.

### 4.6 Handshake Timing

The handshake MUST complete within 5 seconds. If any state transition exceeds its individual timeout, the implementation MUST transition to ERROR.

| Transition | Timeout |
|-----------|---------|
| INIT to HELLO | 1,000 ms |
| HELLO to KEY_EXCHANGE | 1,500 ms |
| KEY_EXCHANGE to AUTHENTICATE | 1,500 ms |
| AUTHENTICATE to ESTABLISHED | 500 ms |

### 4.7 Session Resumption

NSP supports session resumption using a pre-shared key (PSK) derived from a previous session. When both endpoints store a session ticket from a prior session:

1. The ClientHello includes a `session_ticket` extension.
2. If the server recognizes the ticket and the ticket has not expired, the KEY_EXCHANGE phase MAY be skipped.
3. A new session key is derived: `HKDF-SHA-384(resumption_secret, salt=random_D||random_R, info="NSP-v0.1-resumption")`.
4. Both sides proceed directly to AUTHENTICATE.

Session tickets MUST expire after 24 hours. Session tickets MUST be stored in the secure enclave.

### 4.8 Handshake Message Definitions

All multi-byte integers are big-endian. Variable-length fields are preceded by a 2-byte length prefix unless otherwise noted. The notation `opaque field_name<min..max>` denotes a variable-length byte sequence with the given size bounds.

#### 4.8.1 ClientHello

```
struct {
    uint8           version;                    // 0x01 for this spec
    uint8           device_class;               // 0x01=T1, 0x02=T2, 0x03=T3
    opaque          random_D[32];               // 32 bytes of TRNG output
    uint16          cipher_suite_count;          // number of suites offered
    uint16          cipher_suites<2..512>;       // ordered list of suite IDs
    uint8           frame_group_size;            // requested group size (1-256, 0 = use default 100)
    uint16          extensions_length;
    Extension       extensions<0..65535>;        // see Section 4.8.8
} ClientHello;
```

Total minimum size (no extensions, 1 suite): 1 + 1 + 32 + 2 + 2 + 1 + 2 = **41 bytes**.

#### 4.8.2 HelloRetryRequest

```
struct {
    opaque          cookie[32];                 // HMAC-SHA-256 output
    uint32          timestamp;                  // seconds since epoch, for cookie freshness
} HelloRetryRequest;
```

Total size: **36 bytes**.

#### 4.8.3 ServerHello

```
struct {
    uint8           version;                    // 0x01 for this spec
    opaque          random_R[32];               // 32 bytes of TRNG output
    uint16          cipher_suite;               // selected suite ID
    uint8           frame_group_size;            // confirmed group size
    uint16          extensions_length;
    Extension       extensions<0..65535>;
} ServerHello;
```

Total minimum size (no extensions): 1 + 32 + 2 + 1 + 2 = **38 bytes**.

#### 4.8.4 ClientKeyExchange

```
struct {
    uint16          ecdh_public_length;         // 0 if PQC-only suite
    opaque          ecdh_public_D<0..133>;      // ECDH public key (P-256: 65 bytes uncompressed, P-384: 97)
    uint16          mlkem_encaps_length;
    opaque          mlkem_encaps_D<1184..1568>; // ML-KEM public key (768: 1184 bytes, 1024: 1568)
} ClientKeyExchange;
```

#### 4.8.5 ServerKeyExchange

```
struct {
    uint16          ecdh_public_length;         // 0 if PQC-only suite
    opaque          ecdh_public_R<0..133>;      // ECDH public key
    uint16          mlkem_ciphertext_length;
    opaque          mlkem_ciphertext_R<1088..1568>; // ML-KEM ciphertext (768: 1088 bytes, 1024: 1568)
} ServerKeyExchange;
```

#### 4.8.6 ClientAuth / ServerAuth

```
struct {
    uint16          signature_length;
    opaque          mldsa_signature<3293..4627>;    // ML-DSA-65: 3309 bytes, ML-DSA-87: 4627 bytes
    uint16          certificate_length;
    opaque          certificate<1..65535>;           // Device identity certificate (Section 4.8.9)
} AuthMessage;
```

The signature covers the transcript hash (Section 4.4). Both ClientAuth and ServerAuth use the same structure.

#### 4.8.7 Finished

```
struct {
    opaque          verify_data[48];            // HMAC-SHA-384(finished_key, transcript_hash)
} Finished;
```

The `verify_data` is computed using dedicated finished keys, not the session key directly. This prevents the session key from being used for multiple cryptographic purposes (encryption and MACing), hardening against cross-protocol attacks.

```
client_finished_key = HKDF-SHA-384(
    IKM  = session_key_material,
    salt = random_D || random_R,
    info = "NSP-v0.2-client-finished"
)[0:48]

server_finished_key = HKDF-SHA-384(
    IKM  = session_key_material,
    salt = random_D || random_R,
    info = "NSP-v0.2-server-finished"
)[0:48]
```

The device computes `verify_data = HMAC-SHA-384(client_finished_key, transcript_hash)` in its Finished message. The receiver computes `verify_data = HMAC-SHA-384(server_finished_key, transcript_hash)` in its Finished message. Each side verifies the peer's value using the peer's finished key. Mismatch indicates a protocol error or active attack.

Total size: **48 bytes**.

#### 4.8.8 Extension Format

```
struct {
    uint16          extension_type;             // see registry below
    uint16          extension_data_length;
    opaque          extension_data<0..65535>;
} Extension;
```

| Type ID | Name | Description |
|---------|------|-------------|
| 0x0001 | session_ticket | PSK ticket for session resumption (Section 4.7). |
| 0x0002 | cookie | HelloRetryRequest cookie echo (Section 4.3.1). |
| 0x0003 | supported_versions | List of supported protocol versions. |
| 0x0004 | frame_group_size_range | Min/max acceptable group sizes (2 bytes each). |
| 0x0005 | qi_configuration | QI threshold overrides for this session. |
| 0x0006-0xEFFF | Reserved | Reserved for future standardized extensions. |
| 0xF000-0xFFFF | Vendor-Specific | Vendor extensions. MUST NOT affect security. |

#### 4.8.9 Device Identity Certificate

```
struct {
    uint8           cert_version;               // 0x01
    opaque          serial_number[16];          // unique device identifier
    uint8           device_class;               // T1, T2, or T3
    uint16          manufacturer_id;            // assigned by NSP registry
    uint16          drk_public_key_length;
    opaque          drk_public_key<32..2592>;   // DRK public key (ML-DSA-87: 2592 bytes)
    uint32          not_before;                 // validity start (seconds since epoch)
    uint32          not_after;                  // validity end (seconds since epoch)
    uint16          issuer_signature_length;
    opaque          issuer_signature<3309..4627>; // manufacturer CA signature (ML-DSA)
} DeviceIdentityCertificate;
```

NSP defines its own certificate format rather than using X.509. X.509 certificates carry significant encoding overhead (ASN.1/DER) and optional fields that are unnecessary for constrained BCI devices. The NSP certificate contains only the fields required for device authentication.

This version of NSP assumes a flat trust model. The device certificate is signed directly by a recognized Manufacturer Root CA whose public key is pre-provisioned on the receiver. Certificate chains containing intermediate CAs are not supported in v0.2. Each manufacturer operates exactly one Root CA. Receivers MUST maintain a list of trusted Manufacturer Root CA public keys, updatable via authenticated firmware update.

#### 4.8.10 Alert Payload

```
struct {
    uint8           alert_level;                // 0x01=warning, 0x02=fatal
    uint8           alert_description;          // see registry below
    uint16          diagnostic_length;
    opaque          diagnostic_data<0..1024>;   // optional diagnostic info
} AlertPayload;
```

| Code | Name | Level | Description |
|------|------|-------|-------------|
| 0x00 | close_notify | warning | Normal session termination. |
| 0x01 | unexpected_message | fatal | Message received in wrong state. |
| 0x02 | bad_auth_tag | fatal | AES-GCM authentication tag verification failed. |
| 0x03 | bad_signature | fatal | ML-DSA or SPHINCS+ signature verification failed. |
| 0x04 | bad_certificate | fatal | Device certificate validation failed. |
| 0x05 | certificate_revoked | fatal | Device certificate has been revoked. |
| 0x06 | certificate_expired | fatal | Device certificate not_after has passed. |
| 0x07 | handshake_failure | fatal | Handshake could not complete (no common suite, etc.). |
| 0x08 | qi_critical | fatal | QI score below critical threshold. Stimulation halted. |
| 0x09 | qi_warning | warning | QI score below warning threshold. Frame flagged. |
| 0x0A | key_rotation_failure | fatal | Key rotation handshake failed. |
| 0x0B | sequence_number_overflow | fatal | Sequence number approaching wrap. Immediate rekey required. |
| 0x0C | firmware_attestation_failure | fatal | Firmware attestation report invalid. |
| 0x0D | battery_critical | warning | Device battery below safe operating threshold. |
| 0x0E-0xEF | Reserved | | Reserved for future alert codes. |
| 0xF0-0xFF | Vendor-Specific | | Vendor-defined alerts. |

Upon receiving a fatal alert, the endpoint MUST immediately transition to ERROR state, securely erase all session key material, and close the connection. Warning alerts are logged but do not terminate the session.

#### 4.8.11 Key Rotation Payload

```
struct {
    uint8           rotation_phase;             // 0x01=initiate, 0x02=acknowledge, 0x03=confirm
    uint16          mlkem_data_length;
    opaque          mlkem_data<0..1568>;        // ML-KEM encapsulation (initiate) or ciphertext (ack)
    uint16          signature_length;
    opaque          mldsa_signature<0..4627>;   // ML-DSA signature over rotation transcript
    uint16          sphincsplus_signature_length;
    opaque          sphincsplus_signature<0..7856>; // SPHINCS+ signature (initiate and confirm only)
} KeyRotationPayload;
```

The rotation proceeds in three messages:

1. **Initiate** (rotation_phase=0x01): Sender includes fresh ML-KEM public key and signs with both ML-DSA and SPHINCS+.
2. **Acknowledge** (rotation_phase=0x02): Receiver encapsulates against the new public key, sends ciphertext, signs with ML-DSA only.
3. **Confirm** (rotation_phase=0x03): Sender sends Finished-equivalent verify_data under the new key, signed with both ML-DSA and SPHINCS+.

---

## 5. Cryptographic Primitives

### 5.1 ML-KEM-768 (FIPS 203)

ML-KEM-768 provides post-quantum key encapsulation based on the Module Learning with Errors (MLWE) problem.

| Parameter | Value |
|-----------|-------|
| Security level | NIST Level 3 (AES-192 equivalent) |
| Public key size | 1,184 bytes |
| Ciphertext size | 1,088 bytes |
| Shared secret size | 32 bytes |
| Usage | Session key establishment (hybrid with ECDH) |

Implementations MUST use ML-KEM-768 for Tier T1 and T2 devices. Tier T3 devices SHOULD use ML-KEM-1024.

### 5.2 ML-DSA-65 (FIPS 204)

ML-DSA-65 provides post-quantum digital signatures based on the Module Learning with Errors problem (Fiat-Shamir with Aborts).

| Parameter | Value |
|-----------|-------|
| Security level | NIST Level 3 |
| Public key size | 1,952 bytes |
| Signature size | 3,309 bytes |
| Usage | Handshake authentication, frame group signatures |

ML-DSA-65 is used for real-time operations where signature generation and verification must complete within frame timing constraints.

### 5.3 SPHINCS+-SHA2-128s (FIPS 205)

SLH-DSA (SPHINCS+) provides post-quantum digital signatures based exclusively on hash functions. Security assumptions are more conservative than lattice-based schemes.

| Parameter | Value |
|-----------|-------|
| Security level | NIST Level 1 (128-bit) |
| Public key size | 32 bytes |
| Signature size | 7,856 bytes |
| Signing speed | Slow (relative to ML-DSA) |
| Usage | Firmware signing, key rotation signing, Merkle group signatures |

SPHINCS+ is used for infrequent, high-security operations where larger signature sizes and slower computation are acceptable. Its hash-based security assumptions have been studied for decades and carry less cryptanalytic risk than lattice problems.

### 5.4 AES-256-GCM (FIPS 197 + SP 800-38D)

AES-256-GCM provides authenticated encryption with associated data (AEAD).

| Parameter | Value |
|-----------|-------|
| Key size | 256 bits |
| Nonce size | 96 bits (12 bytes) |
| Auth tag size | 128 bits (16 bytes) |
| Quantum resistance | Grover reduces effective security to 128 bits. Sufficient per NIST guidance. |
| Usage | Per-frame payload encryption and integrity |

The nonce MUST be constructed as:

```
nonce = session_nonce_prefix (8 bytes) || sequence_number (4 bytes)
```

The `session_nonce_prefix` is derived during key establishment:

```
session_nonce_prefix = HKDF-SHA-384(
    IKM  = session_key_material,
    salt = random_D || random_R,
    info = "NSP-v0.1-nonce-prefix"
)[0:8]
```

The `sequence_number` is the 4-byte frame sequence number from the NSP frame header (Section 3.2). Each frame produces exactly one nonce. There is no sub-counter or fragmentation within a single frame.

Nonce reuse under the same key is catastrophic: it allows an attacker to recover the GCM authentication key and forge arbitrary messages. Implementations MUST NOT reuse a (key, nonce) pair. Since the sequence number is monotonically increasing and unique per frame, nonce uniqueness is guaranteed as long as the sequence number does not wrap within a single session key lifetime (see Section 10.5).

### 5.5 HKDF-SHA-384 (RFC 5869)

HKDF provides the key derivation function for all key material.

| Parameter | Value |
|-----------|-------|
| Hash | SHA-384 |
| Extract output | 48 bytes |
| Usage | Derive session keys, frame keys, resumption secrets |

The HKDF extract step uses the combined secret from hybrid key exchange as the input keying material (IKM). The salt is the concatenation of both random values from the HELLO phase. The info parameter encodes the key purpose string and protocol version.

### 5.6 Hybrid Key Exchange

The hybrid key exchange combines classical ECDH with ML-KEM. The combined shared secret is:

```
combined_secret = ECDH_shared_secret (32 bytes) || ML-KEM_shared_secret (32 bytes)

session_key_material = HKDF-SHA-384(
    IKM  = combined_secret,
    salt = random_D || random_R,
    info = "NSP-v0.1-session-key"
)
```

The session is secure if EITHER the ECDH discrete logarithm problem OR the MLWE problem remains hard. This follows the NSA-recommended hybrid transition strategy.

When cipher suite 0x0003 (PQC-only) is negotiated, the ECDH component is absent:

```
combined_secret = ML-KEM_shared_secret (32 bytes)
```

### 5.7 Constant-Time Requirement

All cryptographic operations MUST be implemented in constant time with respect to secret data. Variable-time implementations are a protocol violation.

Specifically:

- All comparisons involving secret keys, shared secrets, or authentication tags MUST use constant-time comparison functions.
- Branch conditions MUST NOT depend on secret values.
- Memory access patterns MUST NOT depend on secret values.
- ML-KEM decapsulation MUST use implicit rejection (as specified in FIPS 203) to prevent chosen-ciphertext timing oracles.
- ML-DSA signing MUST implement rejection sampling in constant time.

Implementations SHOULD be hardened against power analysis and electromagnetic emission side channels. For Tier T2 and T3 devices, SCA hardening beyond timing is REQUIRED.

---

## 6. QI Integration

### 6.1 QI Computation

The QI score is computed per band, per time window. The equation is:

```
QI(b,t) = e^(-Sigma(b,t))
```

where `Sigma(b,t)` is the total anomaly score for band `b` at time `t`.

For NSP purposes, the classical component is sufficient:

```
Sigma_c = sigma2_phi + H_tau/ln(N) + sigma2_gamma + D_sf
```

| Term | Symbol | Measurement | Range |
|------|--------|-------------|-------|
| Phase coherence | sigma2_phi | Circular phase variance across channels | [0, pi^2] |
| Transport entropy | H_tau/ln(N) | Normalized Shannon entropy of pathway distribution | [0, ~1] |
| Amplitude stability | sigma2_gamma | Relative gain variance | [0, +inf) |
| Scale-frequency deviation | D_sf | (ln(f*L / v_expected))^2 | [0, +inf) |

For consumer devices with fewer than 8 electrodes, D_sf MAY be replaced by D_spec (spectral consistency), which checks whether the power spectrum matches expected band distributions.

### 6.2 QI Thresholds and Actions

These thresholds derive from QIF-TRUTH.md (Section 3.1). Implementations MUST enforce these actions.

| QI Score | Classification | Action (Valid Auth) | Action (Invalid Auth) |
|----------|---------------|--------------------|-----------------------|
| QI > 0.6 | HIGH | ACCEPT | REJECT + ALERT |
| 0.3 < QI < 0.6 | MEDIUM | ACCEPT + FLAG | REJECT + ALERT |
| QI < 0.3 | LOW | REJECT + CRITICAL | REJECT + CRITICAL |

**ACCEPT**: Frame is forwarded to the application layer.
**FLAG**: Frame is forwarded with a warning annotation. Application layer SHOULD log the event.
**REJECT**: Frame is discarded. Not forwarded.
**ALERT**: An ALERT frame (type 0x03) is generated and transmitted to the peer.
**CRITICAL**: An ALERT frame with EMERGENCY flag set is generated. If the device supports stimulation, stimulation MUST halt immediately.

### 6.3 QI in Frame Header

The QI score occupies bytes 12-15 of the frame header (Section 3.2).

- **QI Score (2 bytes):** The computed QI value, quantized to 16-bit unsigned fixed-point. Resolution is approximately 1.53e-5 per step.
- **QI Components (2 bytes):** Four 4-bit fields packing the individual anomaly indicators (phase, transport, amplitude, scale-freq). Each field maps 0x0 = no anomaly to 0xF = maximum anomaly. This allows receivers to identify which specific component triggered a low QI score without recomputing.

The QI score is computed BEFORE encryption. The QI fields in the header are encrypted along with the payload (they are part of the authenticated plaintext). The receiver decrypts the header, reads the QI score, and applies threshold logic.

### 6.4 Band-Specific Parameters

QI computation parameters vary by QIF band. The following table defines expected ranges for each band.

| Band | Expected QI Range | Dominant Terms | Notes |
|------|------------------|----------------|-------|
| N7 | 0.3 - 0.5 | sigma2_phi, H_tau | Neocortex. High natural variability. Widest acceptance window. |
| N6 | 0.2 - 0.4 | sigma2_phi, H_tau | Limbic system. Emotion/memory introduces variability. |
| N5 | 0.15 - 0.35 | sigma2_phi, sigma2_gamma | Basal ganglia. Pathological beta oscillations (Parkinson's). |
| N4 | 0.1 - 0.3 | sigma2_phi, sigma2_gamma | Diencephalon/thalamus. Sensory gating variability. |
| N3 | 0.1 - 0.25 | sigma2_gamma | Cerebellum. Complex spike timing. |
| N2 | 0.05 - 0.15 | H_tau, sigma2_gamma | Brainstem. Low variability, vital function monitoring. |
| N1 | 0.01 - 0.1 | sigma2_gamma | Spinal cord. Reflex arcs, low natural variability. |
| I0 | 0.01 - 0.1 | sigma2_gamma, D_sf | Electrode-tissue boundary. Noise-dominated. |
| S1 | 0.001 - 0.01 | sigma2_gamma | Analog front-end. Very low variability expected. |
| S2 | ~0 | All terms ~0 | Digital processing. Deterministic. Any anomaly is suspect. |
| S3 | 0 | N/A | Application layer. QI not computed here. |

Implementations MUST calibrate QI thresholds per band. A QI score of 0.2 in band N3 is normal. A QI score of 0.2 in band S1 indicates a severe anomaly.

### 6.5 QI Limitations

QI is a heuristic. It is not a proof of signal legitimacy. Specific limitations:

1. A sophisticated adversary who learns valid signal statistics can craft payloads that pass QI scoring.
2. QI does not detect replay attacks (replayed signals were once legitimate).
3. QI cannot detect attacks that produce physically plausible signal characteristics.

These limitations are why QI is Layer 3 in a 5-layer stack. Layer 2 (PQC) catches replay and MITM. Layer 4 (TTT) catches replay via personalized baseline deviation. QI catches what cryptography cannot: physically impossible signals inside properly encrypted frames.

---

## 7. Key Lifecycle

### 7.1 Key Hierarchy

NSP defines a three-level key hierarchy.

```
+---------------------------------------------------+
|  Device Root Key (DRK)                             |
|  Algorithm: ML-DSA-87 + SPHINCS+-SHA2-256s         |
|  Lifetime: Device operational lifetime (20+ years) |
|  Storage: Secure enclave, non-exportable           |
|  Provisioned: Manufacturing / implant surgery      |
+----------------------------+-----------------------+
                             |
                             | signs
                             v
+---------------------------------------------------+
|  Session Key (SK)                                  |
|  Algorithm: AES-256 (derived via HKDF-SHA-384)     |
|  Lifetime: Maximum 90 days                         |
|  Storage: Secure enclave volatile memory            |
|  Derived: Each handshake / key rotation             |
+----------------------------+-----------------------+
                             |
                             | derives
                             v
+---------------------------------------------------+
|  Frame Key (FK)                                    |
|  Algorithm: AES-256-GCM nonce-derived context      |
|  Lifetime: Single frame                            |
|  Storage: Ephemeral (register only)                 |
|  Derived: SK + session_nonce_prefix + sequence number |
+---------------------------------------------------+
```

### 7.2 Key Provisioning

At manufacturing or implant surgery:

1. The secure enclave generates a Device Root Key pair using its on-chip TRNG.
2. The DRK private key MUST never leave the secure enclave.
3. The DRK public key is certified by the manufacturer's root certificate authority.
4. The manufacturer's root CA public key is embedded in the device firmware (signed by SPHINCS+ during secure boot).
5. A device identity certificate, signed by the manufacturer CA with ML-DSA, binds the DRK public key to a device serial number.

### 7.3 Key Rotation

Session keys MUST be rotated at intervals not exceeding 90 days. Implementations MAY rotate more frequently. The rotation procedure is:

1. The initiating endpoint sends a KEY_ROTATION frame (type 0x02) containing a fresh ML-KEM encapsulation.
2. The receiving endpoint decapsulates and derives a new session key.
3. The receiving endpoint sends a KEY_ROTATION acknowledgment signed with ML-DSA.
4. Both endpoints confirm the new key via a Finished message under the new key.
5. The old session key is securely erased (overwritten with zeros, then with random data, then deallocated).

During rekeying, both old and new keys are valid simultaneously. The transition window MUST NOT exceed 10 seconds. After the transition window, frames encrypted under the old key MUST be rejected.

Key rotation frames MUST be signed with SPHINCS+-SHA2-128s (in addition to ML-DSA) due to the criticality of this operation.

### 7.4 Emergency Revocation

If device compromise is detected:

1. The manufacturer issues a revocation message signed with SPHINCS+-SHA2-256s by the manufacturer root CA.
2. The revocation message includes a counter-signature from a second, independent signing authority.
3. Upon receiving and verifying a valid revocation, the device MUST:
   a. Halt all data transmission immediately.
   b. Securely erase all session keys.
   c. Enter a locked state requiring physical intervention to restore.

For implanted devices, "physical intervention" means a clinical procedure. Revocation of an implanted device is a last resort.

### 7.5 Crypto Agility

NSP separates algorithm choice from protocol logic. The cipher suite negotiation (Section 4.5) allows new algorithms to be introduced without protocol redesign.

When new post-quantum algorithms are standardized (e.g., future NIST selections), they MAY be assigned new cipher suite IDs and deployed via authenticated firmware update. The existing protocol framing, state machine, and key hierarchy remain unchanged.

Algorithm migration procedure:

1. New firmware containing new algorithm implementations is signed with the SPHINCS+ secure boot chain.
2. After verified firmware update, the device advertises new cipher suites in ClientHello.
3. Session establishment negotiates the new suite if both endpoints support it.
4. Old cipher suites are deprecated over a transition period.

### 7.6 Firmware Rollback Protection

Authenticated firmware updates alone are insufficient. An attacker who obtains a legitimately signed but older firmware image (containing known vulnerabilities) can force a device to "update" to the vulnerable version. NSP mandates rollback protection for Tier T2 and T3 devices.

Requirements:

1. The secure enclave MUST maintain a monotonic firmware version counter in tamper-proof non-volatile storage (e.g., one-time programmable fuses, RPMB partition, or secure counter register).
2. Every signed firmware image MUST include a `firmware_version` field as a 32-bit unsigned integer in the signed header, covered by the SPHINCS+ boot chain signature.
3. The secure bootloader MUST reject any firmware image whose `firmware_version` is less than or equal to the value stored in the monotonic counter.
4. After successful boot of new firmware, the bootloader MUST increment the monotonic counter to match the new firmware version. This operation is irreversible.
5. The monotonic counter MUST survive factory reset and power loss. It MUST NOT be resettable via software.

For Tier T1 (consumer) devices without a secure enclave, rollback protection is RECOMMENDED but not required. Implementations without hardware monotonic counters SHOULD use a software-based version check with integrity protection (e.g., HMAC-protected version stored in flash), acknowledging that this provides weaker guarantees.

The firmware attestation report (frame type 0x05) MUST include the current monotonic counter value. Receivers MAY reject connections from devices reporting firmware versions below a minimum acceptable threshold.

### 7.7 20-Year Lifecycle Summary

| Event | Frequency | Key Material Affected |
|-------|-----------|----------------------|
| Session establishment | Per power-on or reconnect | New SK derived |
| Key rotation | Every 90 days (maximum) | SK replaced |
| Firmware update | As needed (rare) | New algorithms available |
| Algorithm migration | When new NIST standards publish | Cipher suite set updated |
| Emergency revocation | On compromise detection | All keys erased |
| End of life (explant) | Once | All keys and state securely destroyed |

Secure destruction at end of life MUST include:

1. Overwrite all key material in the secure enclave with zeros.
2. Overwrite again with random data from the TRNG.
3. Destroy the secure enclave's non-volatile storage (hardware zeroization if supported).
4. Physical presence of authorized personnel is REQUIRED for this operation.

---

## 8. Device Class Requirements

### 8.1 Tier T1: Consumer

| Requirement | Specification |
|-------------|---------------|
| Active layers | 2 (PQC), 3 (QI) |
| Key exchange | Hybrid ECDH-P256 + ML-KEM-768 |
| Frame signing | ML-DSA-65 per frame group (100 frames) |
| Encryption | AES-256-GCM |
| QI computation | Consumer QI (3 classical terms, no D_sf) |
| Secure enclave | RECOMMENDED but not required |
| Firmware attestation | NOT required |
| TTT baseline | NOT required |
| EM monitoring | NOT required |
| Power overhead target | < 5% |

### 8.2 Tier T2: Clinical

| Requirement | Specification |
|-------------|---------------|
| Active layers | 1 (Hardware Root of Trust), 2 (PQC), 3 (QI), 4 (TTT) |
| Key exchange | Hybrid ECDH-P256 + ML-KEM-768 (minimum) |
| Frame signing | ML-DSA-65 + SPHINCS+-SHA2-128s (Merkle-amortized) |
| Encryption | AES-256-GCM with hardware acceleration REQUIRED |
| QI computation | Full QI (4 classical terms including D_sf) |
| Secure enclave | REQUIRED |
| Firmware attestation | REQUIRED (SPHINCS+-signed boot chain) |
| TTT baseline | REQUIRED (initial calibration period of 72 hours minimum) |
| EM monitoring | NOT required |
| Key rotation | Maximum 90 days |
| SCA hardening | REQUIRED (constant-time + power/EM hardening) |
| TRNG | REQUIRED (on-chip, not PRNG) |

### 8.3 Tier T3: Implanted

| Requirement | Specification |
|-------------|---------------|
| Active layers | All five (Layer 5 when available) |
| Key exchange | Hybrid ECDH-P384 + ML-KEM-1024 RECOMMENDED |
| Frame signing | ML-DSA-65 + SPHINCS+-SHA2-128s (Merkle-amortized) |
| Encryption | AES-256-GCM with hardware acceleration REQUIRED |
| QI computation | Full QI (4 classical terms + quantum terms where applicable) |
| Secure enclave | REQUIRED (dedicated security co-processor RECOMMENDED) |
| Firmware attestation | REQUIRED (full SPHINCS+-256s boot chain) |
| TTT baseline | REQUIRED (continuous adaptation) |
| EM monitoring | REQUIRED when Layer 5 hardware is available |
| Key rotation | Maximum 90 days. 30 days RECOMMENDED. |
| SCA hardening | REQUIRED (full side-channel suite: timing, power, EM) |
| TRNG | REQUIRED |
| Emergency revocation | REQUIRED (dual-signature revocation) |
| End-of-life zeroization | REQUIRED (hardware zeroization RECOMMENDED) |
| Algorithm agility | REQUIRED (OTA firmware update capability) |
| 20-year lifecycle support | REQUIRED |

---

## 9. Power Budget

### 9.1 Reference Platform

The following power estimates use the Neuralink N1 as a reference platform (24.7 mW nominal, 40 mW budget). Actual power consumption varies by hardware. Implementors MUST benchmark on their target platform.

### 9.2 Steady-State Power Breakdown

| Operation | Estimated Power | Frequency | % of 40 mW Budget |
|-----------|----------------|-----------|-------------------|
| Delta + LZ4 compression | ~0.2 mW | Per sample window | 0.50% |
| QI score computation | ~0.5 mW | Per time window (~4 ms) | 1.25% |
| AES-256-GCM (hardware accel.) | ~0.1 mW | Per frame | 0.25% |
| ML-DSA-65 sign (amortized) | ~0.5 mW | Per frame group | 1.25% |
| SPHINCS+-SHA2-128s (amortized via Merkle) | Negligible | Per frame group (portion) | <0.01% |
| **Total steady-state** | **~1.3 mW** | | **~3.25%** |

### 9.3 Intermittent Operations

| Operation | Estimated Power | Frequency | Impact |
|-----------|----------------|-----------|--------|
| Hybrid ECDH + ML-KEM handshake | ~2 mW burst | Session start only | Negligible (amortized) |
| SPHINCS+-SHA2-128s (full signature) | ~10 mW burst | Key rotation (every 90 days) | Negligible |
| TTT model update | ~1-3 mW burst | Per user session | Negligible (amortized) |

### 9.4 Pipeline Order and Power

The mandatory pipeline order (compress, then encrypt, then sign) is also the power-optimal order:

1. **Compression first** reduces payload size by 3-5x, reducing the number of bytes that pass through encryption and signing.
2. **Hardware-accelerated AES** operates on the smaller compressed payload.
3. **Signature amortization** via Merkle trees reduces per-frame signing cost to a single hash (SHA-256).

Implementations SHOULD use hardware AES acceleration where available. Most modern ARM Cortex-M and RISC-V SoCs include AES hardware. This reduces the AES power draw below the 0.1 mW estimate.

### 9.5 Power Budget Constraint

NSP-compliant implementations MUST NOT exceed 5% of the device's total power budget for security operations. If power measurements on the target platform exceed 5%, the implementation MUST document the variance and identify which operations dominate.

---

## 10. Security Considerations

### 10.1 Threat Model

NSP is designed to resist the following adversary capabilities:

| Adversary Capability | Addressed By |
|---------------------|--------------|
| Passive eavesdropping (classical) | Layer 2 (AES-256-GCM encryption) |
| Passive eavesdropping (quantum, HNDL) | Layer 2 (hybrid ML-KEM key exchange) |
| Active man-in-the-middle | Layer 2 (ML-DSA mutual authentication) |
| Chosen-plaintext attack (CPA) | Layer 2 (AES-256-GCM, IND-CPA secure) |
| Chosen-ciphertext attack (CCA) | Layer 2 (ML-KEM IND-CCA2, AES-GCM) |
| Replay attack | Layer 2 (sequence numbers + nonces), Layer 4 (TTT baseline) |
| Signal injection | Layer 3 (QI phase and scale-frequency checks) |
| Physically impossible signal | Layer 3 (QI scale-frequency deviation) |
| Firmware tampering | Layer 1 (SPHINCS+-signed secure boot) |
| Supply chain compromise | Layer 1 (hardware root of trust, firmware attestation) |
| Side-channel attack | Layer 1 (constant-time mandate, SCA hardening) |
| Handshake DoS (battery drain) | Layer 2 (stateless cookie mechanism, Section 4.3.1) |
| Firmware rollback | Layer 1 (monotonic version counter, Section 7.6) |
| Slow drift / gradual poisoning | Layer 4 (TTT adaptive baseline) |
| EM interference / intermodulation | Layer 5 (spectral scanning, resonance shield) |

### 10.2 What NSP Protects

1. **Confidentiality of neural data in transit.** Encrypted frames are computationally indistinguishable from random data under both classical and quantum adversaries (assuming ML-KEM and AES-256 remain secure).
2. **Integrity of neural data.** AES-256-GCM authentication tags and ML-DSA/SPHINCS+ signatures detect any modification.
3. **Authenticity of endpoints.** Mutual authentication during handshake prevents impersonation.
4. **Forward secrecy.** Session keys derived from ephemeral key exchange material. Compromise of long-term keys does not compromise past sessions.
5. **Physical plausibility of neural signals.** QI scoring rejects signals that violate known neurophysics.
6. **Post-quantum resistance of key exchange.** Hybrid construction ensures security if either ECDH or ML-KEM remains hard.

### 10.3 What NSP Does NOT Protect

1. **Data at rest.** NSP is a transport protocol. Storage encryption is out of scope. Devices SHOULD encrypt stored data, but NSP does not specify how.
2. **Application-layer logic.** NSP does not validate the semantic correctness of decoded neural data. A correctly encrypted and authenticated frame containing malicious stimulation parameters is accepted by NSP.
3. **Endpoint compromise beyond firmware.** If an adversary has persistent root access to the device OS (above the secure enclave), NSP cannot prevent data exfiltration from application memory.
4. **Denial of service.** An adversary who can jam the wireless channel prevents communication. NSP detects this (heartbeat timeout) but cannot prevent it.
5. **QI evasion by sophisticated adversaries.** An adversary with detailed knowledge of valid neural signal statistics can craft payloads that pass QI scoring. This is mitigated (not eliminated) by Layer 4 (TTT).
6. **Physical access attacks beyond SCA.** Decapping the chip, probing the die with focused ion beams, or other invasive hardware attacks are outside the threat model. These require physical security measures beyond NSP scope.
7. **Compromised TRNG.** If the hardware random number generator is biased or predictable, all derived key material is weakened. NSP mandates TRNG but does not specify TRNG validation procedures.

### 10.4 HNDL Mitigation

The Harvest Now, Decrypt Later attack is the primary motivation for post-quantum key exchange.

NSP mitigates HNDL as follows:

1. **Hybrid key exchange** ensures that even if ML-KEM is broken in the future, the ECDH component prevents retrospective decryption (and vice versa).
2. **90-day key rotation** limits the volume of traffic encrypted under any single session key.
3. **Forward secrecy** from ephemeral key exchange ensures that compromise of the Device Root Key does not expose past session keys.
4. **Algorithm agility** allows migration to stronger algorithms as they become available, without protocol redesign.

Residual risk: If both ECDH and ML-KEM are broken simultaneously (requires breakthroughs against both discrete logarithms and lattice problems), recorded traffic is exposed. This is considered an acceptable residual risk given the independence of the two mathematical problems.

### 10.5 Nonce Management

AES-256-GCM security depends entirely on nonce uniqueness per (key, nonce) pair. Nonce reuse allows an attacker to recover the authentication key and forge messages.

NSP constructs nonces deterministically: `nonce = session_nonce_prefix (8 bytes) || sequence_number (4 bytes)` (Section 5.4). The prefix is derived from handshake randomness via HKDF and is unique per session. The sequence number is monotonically increasing per frame. This two-part construction prevents nonce reuse as long as:

1. The sequence number does not wrap within a single session key lifetime.
2. The session nonce prefix is unique per session (guaranteed by HKDF derivation from ephemeral key exchange randomness).

At 250 frames per second (typical high-density BCI), a 32-bit sequence number wraps after approximately 198 days. With a 90-day rotation maximum, this provides a safety margin of 2.2x. Implementations that exceed 250 fps MUST use a shorter rotation interval to prevent wrap.

There is no sub-counter or frame fragmentation mechanism. Each frame maps to exactly one (key, nonce) pair. This eliminates an entire class of nonce management errors.

To guarantee nonce uniqueness independent of time-based rotation, implementations MUST initiate a key rotation procedure (Section 7.3) when the sequence number exceeds `2^31 - 1` (2,147,483,647). This provides a hard, sequence-based trigger in addition to the 90-day time-based maximum. If rekeying does not complete before the sequence number reaches `2^32 - 1`, the implementation MUST send a `sequence_number_overflow` fatal alert (0x0B) and terminate the session.

---

## 11. Test Vectors

> **This section is a placeholder.** Test vectors will be provided in a future revision of this specification. The following categories of test vectors are planned:

### 11.1 Planned Test Vector Categories

| Category | Description |
|----------|-------------|
| **Handshake** | Complete handshake transcript with known randomness, expected shared secrets, and expected session keys. |
| **Frame Encryption** | Known plaintext + known session key producing expected ciphertext and auth tag. |
| **Merkle Tree** | Known set of frame hashes producing expected Merkle root. |
| **QI Computation** | Known signal inputs producing expected QI scores and component values. |
| **Key Rotation** | Key rotation sequence with expected new session key derivation. |
| **Nonce Construction** | Known session prefix + sequence number producing expected nonce. |
| **HKDF Derivation** | Known IKM + salt + info producing expected key material. |
| **Cipher Suite Negotiation** | ClientHello with specific suite lists and expected server selections. |

### 11.2 Test Vector Format

Each test vector SHALL include:

- **Identifier:** Unique test vector ID.
- **Description:** What the test vector validates.
- **Inputs:** All input values in hexadecimal.
- **Expected outputs:** All expected outputs in hexadecimal.
- **Intermediate values:** Key intermediate computation results for debugging.

### 11.3 Compliance Testing

An implementation claiming NSP compliance MUST pass all mandatory test vectors for its device class tier. Test vectors will be published alongside the reference implementation.

---

## 12. References

### 12.1 Normative References

| Reference | Title |
|-----------|-------|
| [FIPS 203] | NIST. "Module-Lattice-Based Key-Encapsulation Mechanism Standard." Federal Information Processing Standards Publication 203, August 2024. |
| [FIPS 204] | NIST. "Module-Lattice-Based Digital Signature Standard." Federal Information Processing Standards Publication 204, August 2024. |
| [FIPS 205] | NIST. "Stateless Hash-Based Digital Signature Standard." Federal Information Processing Standards Publication 205, August 2024. |
| [FIPS 197] | NIST. "Advanced Encryption Standard (AES)." Federal Information Processing Standards Publication 197, November 2001. |
| [SP 800-38D] | NIST. "Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC." Special Publication 800-38D, November 2007. |
| [RFC 2119] | Bradner, S. "Key words for use in RFCs to Indicate Requirement Levels." BCP 14, RFC 2119, March 1997. |
| [RFC 5869] | Krawczyk, H. and P. Eronen. "HMAC-based Extract-and-Expand Key Derivation Function (HKDF)." RFC 5869, May 2010. |
| [RFC 9180] | Barnes, R., Bhargavan, K., Lipp, B., and C. Wood. "Hybrid Public Key Encryption." RFC 9180, February 2022. |

### 12.2 Informative References

| Reference | Title |
|-----------|-------|
| [QIF-TRUTH] | Qi, K. "QIF Source of Truth." Qinnovate internal document, 2026. Canonical reference for QIF equations and layer architecture. |
| [Gidney2019] | Gidney, C. and M. Ekera. "How to factor 2048 bit RSA integers in 8 hours using 20 million noisy qubits." arXiv:1905.09749, 2019. |
| [Gidney2025] | Gidney, C. "Fewer than 1 million noisy qubits to factor 2048-bit RSA in under a week." arXiv:2505.15917, 2025. |
| [Buzsaki2004] | Buzsaki, G. and A. Draguhn. "Neuronal oscillations in cortical networks." Science 304(5679):1926-1929, 2004. |
| [Sekino2008] | Sekino, Y. and L. Susskind. "Fast scramblers." JHEP 10:065, 2008. |
| [Dvali2018] | Dvali, G. "Black holes as brains: neural networks with area law entropy." Fortschritte der Physik 66(4), 2018. |
| [NSA-Hybrid] | NSA. "Announcing the Commercial National Security Algorithm Suite 2.0." 2022. Recommends hybrid key exchange for quantum transition. |

---

## Appendix A: Frame Size Examples

### A.1 Consumer Headband (4 channels, 250 Hz, 16-bit)

```
Raw sample window (1 second):    4 * 250 * 2 = 2,000 bytes
After delta + LZ4 (3x):          ~667 bytes
NSP frame overhead:               72 bytes (header + Merkle + auth tag)
Per-group signature (amortized):  ~112 bytes/frame
Total per frame:                  ~851 bytes
Overhead percentage:              ~28% over compressed payload
Overhead over raw:                ~851/2000 = 42.5% (but compression saved 57%)
Net: smaller than raw.
```

### A.2 Clinical Implant (128 channels, 1 kHz, 16-bit)

```
Raw sample window (4 ms):        128 * 4 * 2 = 1,024 bytes
After delta + LZ4 (3x):          ~341 bytes
NSP frame overhead:               72 bytes
Per-group signature (amortized):  ~112 bytes/frame
Total per frame:                  ~525 bytes
Frames per second:                250
Throughput:                       ~131 KB/s (1.05 Mbps)
```

### A.3 Surgical Implant (1024 channels, 20 kHz, 10-bit)

```
Raw data rate:                    1024 * 20000 * 1.25 bytes = 25.6 MB/s (204.8 Mbps)
After delta + LZ4 (3x):          ~8.53 MB/s (68.3 Mbps)
NSP overhead (8.7%):              ~0.74 MB/s (5.9 Mbps)
Total:                            ~9.27 MB/s (74.2 Mbps)
```

---

## Appendix B: Attack Coverage Matrix

| Attack Vector | L1 (HW) | L2 (PQC) | L3 (QI) | L4 (TTT) | L5 (EM) |
|--------------|---------|----------|---------|----------|---------|
| Malicious firmware | X | | | | |
| Supply chain tamper | X | | | | |
| ECDH key recovery (quantum) | | X | | | |
| Harvest-now-decrypt-later | | X | | | |
| Man-in-the-middle | | X | | | |
| Replay attack | | X | | X | |
| Signal injection | | | X | | |
| Physically impossible signal | | | X | | |
| Phase/amplitude manipulation | | | X | | |
| Slow drift poisoning | | | partial | X | |
| Adversarial crafted signal | | | | partial | |
| Intermodulation (tissue mixing) | | | | | X |
| Temporal interference (beat freq) | | | | | X |
| Side-channel (power/EM/timing) | X | | | | |
| Handshake DoS (battery drain) | | X | | | |
| Firmware rollback | X | | | | |

No single layer covers all attack vectors. The composition provides coverage across all identified threat classes.

---

## Appendix C: Notation Summary

| Symbol | Meaning |
|--------|---------|
| QI(b,t) | Quantum Indeterminacy score for band b at time t |
| Sigma(b,t) | Total anomaly score |
| Sigma_c | Classical anomaly component |
| sigma2_phi | Circular phase variance |
| H_tau | Transport entropy (Shannon surprise) |
| sigma2_gamma | Relative gain variance |
| D_sf | Scale-frequency deviation |
| C_s | Coherence metric: e^(-(sigma2_phi + H_tau + sigma2_gamma)) |
| L | Spatial extent of one wave (unified: lambda in silicon, S in neural tissue) |
| v | Wave velocity (axonal conduction or speed of light in medium) |
| f | Frequency |
| Gamma_D(t) | Decoherence factor: 1 - e^(-t/tau_D) |
| DRK | Device Root Key |
| SK | Session Key |
| FK | Frame Key |
| N | Number of channels |

---

```
Document:       NSP-PROTOCOL-SPEC.md
Version:        0.2
Status:         Draft
Date:           2026-02-06
Author:         Kevin Qi (Qinnovate)
Location:       qinnovates/mindloft/drafts/ai-working/
Related:        NSP-PITCH.md, NSP-USE-CASE.md, QIF-TRUTH.md
Reviewed by:    Gemini (Google, independent peer review)
Changes in 0.2: Fixed 5 weaknesses from Gemini review round 1:
                 (1) Negotiable frame group size (latency fix)
                 (2) Formal message struct definitions for all handshake types
                 (3) Stateless cookie DoS protection (HelloRetryRequest)
                 (4) Firmware rollback protection (monotonic version counter)
                 (5) Unambiguous GCM nonce construction (removed frame_sub_counter)
                 Also: Merkle tree signs ciphertext not plaintext, domain-separated hashes,
                 alert code registry, extension type registry, certificate format defined.
Changes in 0.3: Applied 5 hardening fixes from Gemini review round 2:
                 (1) HelloRetryRequest included in transcript hash (anti-desync)
                 (2) Separate client/server finished keys (key separation)
                 (3) Hard sequence number rekey trigger at 2^31 (nonce safety)
                 (4) Flat trust model explicitly stated (no intermediate CAs)
                 (5) Formalized group_size=1 signature rule (SPHINCS+ omission)
Next revision:  Test vectors, reference implementation alignment, formal security analysis
```
