# Integration Roadmap: NSP + Runemate + Neurowall

> **Status:** Living document
> **Last Updated:** 2026-02-21
> **Author:** Kevin Qi

## System Architecture

NSP, Runemate, and Neurowall form a three-layer stack for securing brain-computer interfaces:

- **NSP v0.5** (transport layer) provides post-quantum cryptography (ML-KEM-768 + AES-256-GCM-SIV), compression (Delta + LZ4, 65-90% reduction), and key lifecycle management. It is the foundation: neither Neurowall nor Runemate build their own crypto or compression.
- **Runemate v1.0** (application layer) compiles the Staves declarative DSL into multimodal bytecode for neural rendering. The Forge compiler runs at build time; the Scribe interpreter (< 200KB) runs on-chip.
- **Neurowall v0.8** (signal defense layer) is a three-layer neural firewall: L1 Signal Boundary (SSVEP notch, impedance guard), L2 Inference Guard (Local-DP, temporal jitter), L3 Policy Agent (RunematePolicy engine, NISS scoring).

Architecture diagram: [`tools/neurowall/charts/qif-defense-stack.png`](tools/neurowall/charts/qif-defense-stack.png)

### Data Flow

**Inbound (content to brain):**
```
Network → NSP decrypt/decompress → Runemate Scribe decode → Neural output
```

**Outbound (brain telemetry):**
```
Sensor signal → Neurowall L1/L2 filter → NSP Delta+LZ4 compress → NSP encrypt → Transmit
```

---

## Component Status

| Component | Version | Status | What's Complete | What's Next |
|:----------|:--------|:-------|:----------------|:------------|
| **NSP** | v0.5 | 🟡 Alpha | Rust ML-KEM + ML-DSA, AES-256-GCM-SIV, Delta+LZ4 compression, Merkle amortization, frame format spec | Hardware transport on nRF5340, SPHINCS+ rotation, session resumption |
| **Runemate** | v1.0 | 🟢 Compiler shipped | Forge compiler (24 tests, 67.8% compression), Staves v1 bytecode, TARA safety bounds | Scribe interpreter (on-chip), Staves v2 neural opcodes |
| **Neurowall** | v0.8 | 🟡 Simulation | RunematePolicy engine (5-rule stack), sim.py (11/14 at 15s, 9/9 at 20s), BrainFlow validation (100% detection, 0% FPR) | nRF5340 lab bench, real sensor input, power profiling |

---

## Integrated Phase Roadmap

### Phase 0: Foundation (COMPLETE)

Build the core software components that everything else depends on.

| Component | Deliverable | Status |
|:----------|:------------|:-------|
| NSP | Rust implementation: ML-KEM-768, AES-256-GCM-SIV, HKDF-SHA-384, Delta+LZ4, Merkle frame grouping | Done |
| Runemate | Forge compiler v1.0: Staves DSL lexer/parser, codegen, TARA safety bounds, 24 tests passing | Done |
| Neurowall | N/A (no Neurowall work in this phase) | N/A |

**Gate:** NSP round-trip encrypt/decrypt passes. Forge compile-encrypt-decrypt roundtrip passes (`secure.rs` test).

---

### Phase 1: Simulation (COMPLETE)

Validate detection algorithms and policy logic in software before touching hardware.

| Component | Deliverable | Status |
|:----------|:------------|:-------|
| NSP | Compression benchmarks (65-90% verified), nonce-misuse resistance validated | Done |
| Runemate | Compile-encrypt-decrypt pipeline test, bytecode size benchmarks (67.8% compression) | Done |
| Neurowall | sim.py v0.8: SSVEP/impedance/flooding detection, RunematePolicy engine, 50-run statistical validation, BrainFlow independent validation (16-channel, 100% detection, 0% FPR) | Done |

**Gate:** Neurowall achieves 100% TPR at 20s with 0% FPR across 50 runs. NSP compression verified at 65-90%.

---

### Phase 2: Lab Bench (NEXT, ~4 weeks)

First hardware. USB-powered nRF5340 DK with UART mock telemetry. No battery, no wireless, no real sensors.

| Component | Deliverable | Hardware |
|:----------|:------------|:---------|
| NSP | ML-KEM handshake over UART, AES-256-GCM-SIV frame encryption on Cortex-M33, Delta+LZ4 in 4KB SRAM | nRF5340 DK |
| Runemate | Scribe minimal interpreter: PUSH, POP, EMIT, HALT opcodes, hot-swap policy loading | nRF5340 DK |
| Neurowall | L1 SSVEP notch filter + L2 Local-DP module on real MCU, 250Hz processing cadence | nRF5340 DK |

**Hardware requirements:**
| Item | Source | Cost |
|:-----|:-------|:-----|
| Nordic nRF5340 DK | Nordic Semi | $45 |
| Saleae Logic 8 | Saleae | $150 |
| Nordic PPK2 (power) | Nordic Semi | $80 |
| **Total** | | **~$275** |

**Gate:** ML-KEM handshake completes over UART on nRF5340. Neurowall processes 250Hz mock stream without frame drops. Scribe executes policy bytecode and triggers NISS-based alert.

**Known risks:**
- AES-256-GCM-SIV is software-only on nRF5340 (no hardware accelerator), may be slow
- Scribe interpreter overhead at 250Hz cadence is unvalidated
- NISS and intent inputs are mocked (the "Oracle Problem")

---

### Phase 3: Wearable Prototype (~8-12 weeks after Phase 2)

Real wireless, real sensors, real battery constraints. Move from nRF5340 lab bench to NXP i.MX RT685 (wearable-capable MCU).

| Component | Deliverable | Hardware |
|:----------|:------------|:---------|
| NSP | Real BLE transport, ML-KEM key exchange over BLE, SPHINCS+ key rotation PoC, session resumption (PSK tickets) | RT685 |
| Runemate | Scribe full opcode set, policy hot-swap over BLE | RT685 |
| Neurowall | All 3 layers on RT685, real OpenBCI Cyton Daisy input, power profiling (< 5% of 40mW budget) | RT685 + OpenBCI Cyton |

**Hardware comparison (why the MCU switch):**

| | nRF5340 (Phase 2) | i.MX RT685 (Phase 3) |
|:--|:-------------------|:---------------------|
| CPU | Dual Cortex-M33 @ 128MHz | Cortex-M33 @ 300MHz + HiFi4 DSP |
| SRAM | 512KB | 4.5MB |
| AES-GCM-SIV | Software only | Hardware CryptoLib |
| Power | ~17mA (USB-powered) | ~15-25mA (duty-cycled, battery-capable) |

**Gate:** End-to-end BLE session: OpenBCI Cyton → Neurowall filter → NSP encrypt → BLE transmit → gateway decrypt. Power profiling confirms < 5% overhead on 40mW budget. SPHINCS+ key rotation completes within acceptable latency.

---

### Phase 4: Human Validation (PLANNED)

Real SSVEP attack replication on human subjects. Requires IRB approval and BCI research lab partnership.

| Component | Deliverable |
|:----------|:------------|
| NSP | Production key lifecycle, 20-year device lifetime validation |
| Runemate | Scribe full runtime with Staves v2 neural opcodes, calibration protocol |
| Neurowall | Real attack detection on live EEG, clinical false-positive validation, NISS scoring against real threats |

**Gate:** IRB approval obtained. Real SSVEP attack detected and blocked on human subject. False positive rate validated clinically.

---

## Dependency Graph

```
                    ┌───────────────────────┐
                    │     QIF v6.2.1        │
                    │  (Hourglass Model)    │
                    └──────────┬────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌────────────┐ ┌──────────────┐
    │   NSP v0.5      │ │ TARA v1.7  │ │  NISS v1.0   │
    │ (Crypto +       │ │ (Attack    │ │ (Scoring)    │
    │  Transport +    │ │  Library)  │ │              │
    │  Compression)   │ │            │ │              │
    └────────┬────────┘ └─────┬──────┘ └──────┬───────┘
             │                │               │
             │    ┌───────────▼───────────┐   │
             │    │  Runemate Forge v1.0  │   │
             │    │  (Compile-time)       │   │
             │    │  TARA safety gates    │   │
             │    └───────────┬───────────┘   │
             │                │               │
             ▼                ▼               ▼
    ┌─────────────────────────────────────────────────┐
    │              Neurowall v0.8                     │
    │  L1: Signal Boundary (SSVEP notch, impedance)  │
    │  L2: Inference Guard (Local-DP, jitter)         │
    │  L3: Policy Agent (RunematePolicy + NISS)       │
    │                                                 │
    │  Uses NSP for all crypto/compression            │
    │  Uses Runemate Scribe for on-chip policy exec   │
    │  Uses NISS scores as L3 trigger input            │
    └──────────────────────┬──────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Hardware Platform    │
              │  P2: nRF5340 DK (lab)  │
              │  P3: NXP RT685 (wear)  │
              └────────────────────────┘
```

**What blocks what:**
- NSP must be on hardware before Neurowall can encrypt frames on hardware (Phase 2 gate)
- Runemate Scribe must run on MCU before Neurowall L3 can execute policy on-chip (Phase 2 gate)
- Neurowall must process real sensor data before human validation (Phase 3 gate)
- SPHINCS+ rotation requires RT685 hardware crypto (Phase 3, not possible on nRF5340)

---

## Validation Gates Summary

| Phase | Gate | Pass/Fail Criteria |
|:------|:-----|:-------------------|
| 0 → 1 | NSP crypto roundtrip | `secure.rs` compile-encrypt-decrypt test passes |
| 0 → 1 | Forge compiler | 24 tests pass, TARA bounds enforced |
| 1 → 2 | Neurowall detection | 100% TPR at 20s, 0% FPR (50 runs) |
| 1 → 2 | NSP compression | 65-90% size reduction verified |
| 2 → 3 | MCU crypto | ML-KEM handshake over UART on nRF5340 |
| 2 → 3 | MCU processing | 250Hz mock stream, zero frame drops |
| 2 → 3 | On-chip policy | Scribe executes RunematePolicy bytecode |
| 3 → 4 | BLE end-to-end | Cyton → Neurowall → NSP → BLE → gateway decrypt |
| 3 → 4 | Power budget | < 5% overhead on 40mW thermal budget |
| 3 → 4 | Key rotation | SPHINCS+ rotation completes on RT685 |
| 4 | Human validation | IRB approved, real SSVEP attack blocked, clinical FPR validated |

---

## Hardware Progression

| Phase | MCU | Power | Connectivity | Sensor | Status |
|:------|:----|:------|:-------------|:-------|:-------|
| 0-1 | Desktop (simulation) | N/A | N/A | Mock data | COMPLETE |
| 2 | Nordic nRF5340 DK | USB-powered | UART only | Mock 250Hz stream | NEXT |
| 3 | NXP i.MX RT685 | Battery (duty-cycled) | BLE 5.3 | OpenBCI Cyton Daisy | PLANNED |
| 4 | RT685 or custom | Battery | BLE 5.3 | Real dry EEG | PLANNED |

---

## What NSP Provides

NSP is the single source of truth for cryptography and compression across the entire stack. No other component implements its own crypto or compression.

**Post-Quantum Cryptography:**

| Function | Algorithm | Standard |
|:---------|:----------|:---------|
| Key Exchange | ECDH-P256 + ML-KEM-768 | NIST FIPS 203 |
| Encryption | AES-256-GCM-SIV | RFC 8452 |
| Frame Signatures | ML-DSA-65 | NIST FIPS 204 |
| Key Rotation | SPHINCS+-SHA2-192s | NIST FIPS 205 |
| Key Derivation | HKDF-SHA-384 | RFC 5869 |

**Compression:**

| Stage | Method | Result |
|:------|:-------|:-------|
| Delta encoding | Per-channel: D[n] = S[n] - S[n-1] | High redundancy removal |
| LZ4 | 100-frame blocks, 4KB SRAM window | 65-90% total reduction |
| Order | Compress → Encrypt → Sign | Standard secure pipeline |

**Signature Amortization:**
- 100 frames grouped into Merkle tree, sign only root
- Per-frame overhead: ~144 bytes (down from 3,309 bytes for individual ML-DSA signatures)

---

## Related Documents

- [NSP Protocol Spec](qif-framework/NSP-PROTOCOL-SPEC.md)
- [Runemate Forge](qif-framework/RUNEMATE.md)
- [Neurowall README](tools/neurowall/README.md)
- [Neurowall MVP Prototype](tools/neurowall/MVP_PROTOTYPE.md)
- [Neurowall Architecture](tools/neurowall/ARCHITECTURE.md)
- [TARA Techniques](qif-framework/QIF-TARA-TECHNIQUES.md)
