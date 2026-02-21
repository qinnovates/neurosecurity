# Architectural Spec: Wearable Neural Firewall (Phase 1)

This document outlines the first-generation **Neural Firewall** architecture for non-intrusive BCI wearables (e.g., Smart Glasses, Subvocal EMG interfaces).

## Target Form Factors
1.  **Neural-Embedded Eyeglasses**: Integration of dry EEG (temporal), EOG (eye tracking), and EMG (facial) sensors.
2.  **Subvocal Collars (AlterEgo Style)**: High-density jaw/neck EMG arrays for silent speech decoding.

---

## NSP & Runemate Integration

> This firewall does not build its own crypto or compression stack. It runs entirely on **NSP v0.5** for transport security and **Runemate** for on-chip execution — both already specified in the QIF framework.

### NSP (Neural Sensory Protocol) v0.5

NSP handles every aspect of secure, authenticated transmission of neural telemetry from the wearable to a receiving endpoint (phone gateway, clinical receiver, or cloud TAL aggregator).

#### Post-Quantum Cryptography (PQC)
Neural data is permanently sensitive — you cannot reset your brain signals like a password. Classical key exchange (ECDH/RSA) will be broken by quantum computers. NSP uses a **hybrid PQ key exchange** to protect against both classical *and* harvest-now-decrypt-later attacks:

| Layer | Algorithm | Purpose |
| :--- | :--- | :--- |
| **Key Exchange** | ECDH-P256 + **ML-KEM-768** (NIST FIPS 203) | Hybrid classical+PQ session key derivation |
| **Encryption** | AES-256-GCM-SIV | Nonce-misuse-resistant frame encryption |
| **Signatures** | **ML-DSA-65** (NIST FIPS 204) | Per-frame-group authentication |
| **Key Rotation** | **SPHINCS+-SHA2-192s** (NIST FIPS 205) | Stateless hash-based signing for key lifecycle events |
| **Key Derivation** | HKDF-SHA-384 | Session key and sub-key derivation |

**Why GCM-SIV over standard GCM?** Wearables can lose power without warning (blinks, battery drops). Standard AES-GCM catastrophically leaks the auth key on nonce reuse. GCM-SIV is nonce-misuse-resistant — a duplicate nonce only reveals whether two plaintexts were identical.

**Why SPHINCS+ only for rotation?** ML-DSA signatures are 3,309 bytes. SPHINCS+ signatures are 16,224 bytes — too large for per-frame use. NSP defers SPHINCS+ to key rotation events (every 8 hours for T2 clinical wearables) where its hash-based, quantum-hardened security assumptions justify the one-time cost.

#### Compression (Delta + LZ4)
NSP mandates the order: **Compress → Encrypt → Sign**. Encryption produces pseudorandom output that cannot be compressed afterwards.

For neural wearables:
1. **Delta Encoding** – compute `D[n] = S[n] - S[n-1]` per channel. EEG/EMG signals are continuous; deltas cluster near zero, drastically reducing entropy.
2. **LZ4** – applied to blocks of 100 delta-encoded samples. Window capped at **4KB** to fit within wearable SRAM constraints.
3. **Result** – 65–90% payload size reduction, more than offsetting the PQ handshake overhead (~20KB) after just a few seconds of streaming.

#### Authenticated Frame Structure (Merkle Amortization)
ML-DSA signatures (3.3KB each) are too large to attach to every telemetry packet over BLE. NSP solves this with **Merkle tree amortization**:
- Group 100 frames into a Merkle tree.
- Sign only the **Merkle root** with ML-DSA + SPHINCS+.
- Per-frame signature overhead drops from **3,309 bytes → ~144 bytes**.
- The Merkle hash link on every frame allows individual frame tamper detection without awaiting the group signature.

#### Session Resumption (PQ-PSK)
After initial pairing, wearables use **session tickets** (HKDF-derived PSK) to skip the full ML-KEM handshake on reconnect. This reduces reconnect latency from ~2s to ~400ms — critical for glasses that go on and off throughout the day. Tickets expire after 8 hours (T2 Clinical tier), stored in the on-chip secure enclave.

---

### Runemate (The Scribe — on-chip execution engine)

Runemate provides the **bytecode execution environment** that runs the firewall's policy logic on the chip itself. This keeps security decisions local — the wearable is not dependent on a phone app or cloud service to enforce neural privacy.

#### The Scribe Interpreter
- **Language**: Staves v2 bytecode (compiled from QIF policy DSL by The Forge on a gateway).
- **Footprint**: < 200KB Flash (ROM), < 64KB SRAM — fits any implant-grade or wearable MCU.
- **Memory safety**: Written in Rust `no_std` — zero allocator dependencies, no garbage collector pauses during signal processing.
- **Safety gate**: Every policy Stave is **TARA-validated at compile time** before deployment. If it doesn't compile safely, it doesn't run on-chip.

#### Firewall Policy-as-Code
Policy updates (e.g., tightening DP epsilon, changing SSVEP filter frequencies, adjusting NISS triggers) are delivered as **signed Staves v2 payloads** over NSP:
1. Gateway compiles the new policy rule into Staves bytecode (The Forge).
2. Forge applies TARA bounds (stimulus ceiling, charge density, element limits).
3. Compiled Stave is signed (ML-DSA) and transmitted via the established NSP session.
4. The Scribe verifies the signature, loads the new policy into a hot-swappable bytecode slot.
5. Old policy remains active until the new one is verified and swapped atomically.

This means **a zero-downtime policy update** — the firewall never exposes an unprotected window during a rule change.

#### Runemate Security Properties

| Property | Runemate Guarantee |
| :--- | :--- |
| **Sandboxing** | Staves bytecode has no system calls, no memory addresses, no I/O — only declarative content and event opcodes |
| **Injection prevention** | Closed vocabulary: if source compiles, it is safe. No HTML parsing, no JS, no unbounded input |
| **Side-channel resistance** | Constant-time crypto primitives from RustCrypto (`aes-gcm`, `hkdf`, `sha2`) |
| **Formal verification path** | Compiled via Ferrocene (IEC 62304 Class C certified Rust toolchain) |

---

## Core Security & Efficiency Stack (Summary)

| Component | Role | Key Properties |
| :--- | :--- | :--- |
| **NSP v0.5** | Secure transport | ML-KEM-768 PQC, AES-256-GCM-SIV, Merkle amortization |
| **Runemate Scribe** | On-chip policy execution | <200KB, TARA-safe, hot-swap policy updates |
| **Delta + LZ4** | Neural compression | 65-90% reduction, 4KB SRAM window |
| **SPHINCS+** | Key rotation signing | Stateless hash-based PQC, 20-year security horizon |
| **Local-DP** | Privacy (L2) | Laplace noise ε=0.5 applied pre-transmission |

---

## Layered Defense Architecture

### Layer 1: The Signal Boundary (Physical/EMV)
*Objective: Prevent signal injection and hardware-level tampering.*

- **Hardware Root of Trust (RoT)**: Encrypted sensor pathways from the electrode to the processor.
- **Adaptive Impedance Guard**: Real-time Monitoring of dry-electrode contact. Instantaneous impedance spikes (indicating probe injection or displacement) trigger a 50ms signal lockout.
- **Adversarial SSVEP Notch Array**:
  - Programmable digital notch filters targeting **8.57Hz, 10.9Hz, 15Hz, and 20Hz** (primary neural injection frequencies).
  - Harmonic suppression for square-wave adversarial stimuli (3rd and 5th harmonics).

### Layer 2: The Inference Guard (Privacy/Processing)
*Objective: Prevent "Intent Exfiltration" and "Neural Fingerprinting".*

- **Subvocal MFCC Guardrails**:
  - For AlterEgo-style EMG, the firewall monitors the **50-150Hz energy band**.
  - **Intent Shadowing**: If the MFCC pattern matches a "Privileged Command" (e.g., "Authorize Pay") without a concurrent Layer 3 context, the signal is zeroed before decoding.
- **Local-DP Noise Injection**:
  - Laplician noise ($\epsilon = 0.5$) applied to the raw 250Hz - 1kHz EEG/EMG stream.
- **Temporal Jittering**: Random 5-15ms delay injected into BT/WiFi transmission packets to break timing-based side-channels.

### Layer 3: The Cognitive Policy Agent (Intent/Regulation)
*Objective: Enforce the NIST/ISO Hardened Policy Matrix at the edge.*

- **Runemate Enclave Execution**:
  - The Policy Agent runs as a dedicated **Runemate Scribe** task.
  - Policy updates (NISS triggers) are delivered as signed **Staves v2** bytecode.
- **Intent-Mismatch Detection**:
  - Compares the *Decoded Intent* (e.g., "Send Message") with the *System Context* (e.g., "Is the user in a high-stress threat scenario?").
  - Trigger: If NISS Biological Impact &ge; H, the firewall requires a secondary physical confirmation (e.g., a temple-tap on the glasses).
- **Hardened Policy Enforcement**:
  - Automatically tags all outgoing neural telemetry with NIST AC-3 and SC-28 control IDs for auditing.
  - Telemetry is encapsulated in **NSP Frames** (authenticated per frame-group via Merkle roots).

---

## Technical Mapping (NISS to Firewall)

| NISS Threat Vector | Firewall Intervention | mandatory Control |
| :--- | :--- | :--- |
| **PINS = True** | **Total Isolation Mode**: Sever all external data links; run in local-only secure enclave. | NIST SI-4 |
| **Consent = Implicit** | **Explicit Handshake Loop**: Block signal processing until a non-neural "Confirmation Pulse" is received. | ISO A.18.1.1 |
| **Plasticity (NP) = T** | **Stimulation Ceiling**: Hard-limit current/frequency of any haptic/optical feedback to prevent Long-Term Potentiation (LTP) hijacking. | NIST SI-7 |

## Implementation Roadmap
1.  **Mock Telemetry Engine**: Simulate a vulnerable EMG/EEG stream from smart-glass frames.
2.  **L2 Privacy Module**: Implement the Laplician noise injector in Python/C++.
3.  **Audit Connector**: Connect the firewall logs to the **Temporal Aggregation Log (TAL)** infrastructure.
