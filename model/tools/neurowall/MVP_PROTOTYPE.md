# Neurowall — MVP Prototype Plan

> **Multi-AI Review:** Architecture validated by Gemini 2.5 (2026-02-21) via Gemini CLI.
> **Status:** Lab Prototype — no human subjects required for MVP.
> **Related docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) | [ENGINEERING.md](./ENGINEERING.md) | [TESTING.md](./TESTING.md)

---

## Hardware Platform

### Recommended: NXP i.MX RT685 (Cortex-M33 + DSP core)
The original nRF5340 spec is viable for a **wired lab bench prototype**, but insufficient for a battery-powered wearable running PQC continuously.

| Requirement | nRF5340 (original spec) | i.MX RT685 (recommended) |
| :--- | :--- | :--- |
| **CPU** | Dual Cortex-M33 @ 128MHz | Cortex-M33 @ 300MHz + HiFi4 DSP |
| **Flash** | 1MB | 16MB external (QSPI) |
| **SRAM** | 512KB | 4.5MB |
| **BLE** | Yes (onboard) | Via companion nRF9160 |
| **AES-GCM-SIV** | Software only (slow) | Via CryptoLib hardware engine |
| **Power (active)** | ~7mA tx + ~10mA CPU | ~15-25mA (still needs duty-cycling) |
| **Verdict** | Phase 0 lab bench only | **Phase 1 wearable MVP** |

> **Note on power**: The 40mW budget is achievable with aggressive duty-cycling (process in 100ms windows, sleep between). Continuous PQC at 250Hz is not feasible on either platform without a hardware crypto accelerator.

### Phase 0 (bench only, start here)
- **Nordic nRF5340 DK** — development kit, USB-powered, no battery constraint.
- Soft-coded mock sensor input via UART from a host PC.

---

## MVP Scope (What to build now vs. defer)

The goal of MVP is a **demonstrable vertical slice**: receive a mock neural signal → filter/protect it → enforce a policy → transmit securely.

### ✅ Build in MVP (Phase 0 / Lab)

| Layer | Component | Why |
| :--- | :--- | :--- |
| **L1** | SSVEP Notch Array | Pure DSP — simple, highly demonstrable |
| **L1** | Impedance Guard (mock) | Threshold check on incoming data stream |
| **L2** | Local-DP Noise Injection (ε=0.5) | Computationally cheap, proves privacy core |
| **L2** | Temporal Jitter | One-line random delay on BLE TX |
| **L3** | Runemate Scribe (minimal opcode set) | Proves Policy-as-Code concept |
| **L3** | NISS trigger → DP activation | End-to-end policy flow demo |
| **Transport** | NSP session (ML-KEM handshake + AES-256-GCM-SIV) | Core security claim — must be proven |
| **Transport** | Delta + LZ4 compression | Compression claim — measurable, verifiable |

### ⏳ Defer to Phase 1

| Component | Reason |
| :--- | :--- |
| Subvocal MFCC Guardrails | Requires trained ML model — full project on its own |
| Real Intent Decoding | Requires ML inference; budget not defined yet |
| SPHINCS+ key rotation | Viable for demo, but 16KB signature is impractical until battery constraints resolved |
| Real dry EEG sensor (e.g., OpenBCI Cyton) | Adds hardware complexity; mock UART is sufficient for MVP |

---

## Critical Gaps (from Gemini CLI Review)

These are the open risks that need addressing before Phase 1:

1. **Power budget not broken down** — There is no per-component power analysis (ADC + CPU + radio + crypto). The 40mW total must be decomposed before claiming battery feasibility.

2. **Interpreter overhead** — Running the Runemate Scribe on every sample at 250Hz is a continuous CPU load. The MVP must measure actual CPU% to validate this is under 5% as specified. If not, the policy must execute at a reduced cadence (e.g., every 100ms window).

3. **The Oracle Problem (ML inputs)** — NISS Score and "Decoded Intent" are outputs of ML models not budgeted in the architecture. For MVP: use **hard-coded mock NISS values** injected via UART. Document this as a known stub.

4. **AES-256-GCM-SIV is not hardware-accelerated** on nRF5340. Software AES at 250Hz is expensive. Use the hardware AES-128-CCM as a fallback for MVP, or add NXP RT685 with hardware crypto engine to plan.

5. **Key storage / Hardware Secure Element** — The architecture specifies SPHINCS+ for key rotation but has no defined root-of-trust storage. For MVP: store private keys in protected flash (nRF5340 UICR). For production: require an SE050 or similar dedicated secure element.

---

## Implementation Roadmap

### Phase 0 — Lab Bench (no battery, UART mock input)

```
Timeline: ~4 weeks

Week 1:  Mock telemetry engine (Rust/Python on host PC)
         → Produces 250Hz UART stream with mock NISS fields

Week 2:  L1 SSVEP notch filter (Rust, no_std, IIR biquad)
         L2 Local-DP noise injection module
         
Week 3:  Runemate Scribe (minimal: LOAD, COMPARE, CALL_DP opcodes)
         Policy hot-swap via signed Stave over USB serial

Week 4:  NSP transport layer (host PC ↔ nRF5340 DK)
         ML-KEM handshake → AES-GCM-SIV encrypted stream
         Delta+LZ4 compression
```

### Phase 1 — Wearable Prototype (NXP RT685, battery, BLE)

```
Timeline: ~8–12 weeks after Phase 0

- Real BLE transport (replace USB serial)
- OpenBCI Cyton Daisy dry EEG sensor input
- Real ML-KEM key exchange over BLE
- SPHINCS+ key rotation proof-of-concept
- Measure power draw with Nordic PPK2
- PQ session resumption (PSK ticket, target <500ms)
```

### Phase 2 — Human Subjects Lab Study (IRB required)

```
- Partner with BCI research lab (e.g., OpenBCI community or academic lab)
- SSVEP injection attack replication from SAIL Lab (University of New Haven)
- Real signal validation: can the L1 notch filter block real adversarial SSVEP stimuli?
```

---

## Bill of Materials (Phase 0 BOM)

| Item | Source | Est. Cost |
| :--- | :--- | :--- |
| Nordic nRF5340 DK | Nordic Semi | $45 |
| Logic analyzer (Saleae Logic 8) | Saleae | $150 |
| Nordic PPK2 (power profiling) | Nordic Semi | $80 |
| Host PC (existing) | — | — |
| OpenBCI Cyton 8-channel kit (Phase 1) | OpenBCI | $500 |
| **Phase 0 Total** | | **~$275** |

---

*Validated by: Gemini 2.5 (Gemini CLI, 2026-02-21). Human oversight: Kevin Qi.*
