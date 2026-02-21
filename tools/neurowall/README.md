# Neurowall

> **QIF Module — Neurowall**
> **Status:** Phase 1 Architecture (Design-Complete)
> **Date:** 2026-02-21
> **Authors:** Kevin Qi, Antigravity (Gemini)
> **Parent Framework:** [QIF v4.0 Hourglass](../qif-framework/README.md) / [NSP v0.5](../qif-framework/NSP-PROTOCOL-SPEC.md) / [Runemate](../qif-framework/RUNEMATE.md)

---

## What is this?

**Neurowall** is a hardware-level security architecture for non-intrusive BCI wearables — specifically smart glasses (temporal dry EEG/EOG) and subvocal collars (jawline EMG, e.g. MIT AlterEgo).

It provides three concentric defense layers:
1. **Signal Boundary (L1)** — Prevents hardware-level signal injection and SSVEP-based adversarial attacks.
2. **Inference Guard (L2)** — Prevents neural fingerprinting and intent exfiltration via on-device Differential Privacy.
3. **Policy Agent (L3)** — Enforces the NIST/ISO Hardened Policy Matrix as a TARA-validated Runemate Stave.

## Documents

| Document | Description |
| :--- | :--- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | High-level system design, threat model, and 3-layer defense strategy. |
| [ENGINEERING.md](./ENGINEERING.md) | Signal chain schematics, compression spec, Merkle amortization, and Rust pseudocode. |
| [NECKBAND_BLUEPRINT.md](./NECKBAND_BLUEPRINT.md) | Behind-the-neck wearable form factor: ground electrode + security processor + OpenBCI integration. |
| [MVP_PROTOTYPE.md](./MVP_PROTOTYPE.md) | Phase 0/1 prototype plan, BOM, and critical gaps from Gemini review. |
| [TESTING.md](./TESTING.md) | Test strategy and validation plan. |

## Key Technical Properties

| Property | Value |
| :--- | :--- |
| **Transport Security** | NSP v0.5 (hybrid ML-KEM-768 + AES-256-GCM-SIV) |
| **Signature Amortization** | Merkle grouping (100 frames), per-frame overhead ~144 bytes |
| **Neural Compression** | Delta + LZ4 (4KB SRAM window), 65-90% size reduction |
| **On-Chip Footprint** | < 200KB (Runemate Scribe) |
| **Power Budget** | < 5% overhead on 40mW wearable thermal budget |
| **Differential Privacy** | Local-DP, Laplace noise (ε = 0.5) applied pre-transmission |

## Derivation History

- **Entry 68** (QIF-DERIVATION-LOG): Guardrails Synthesis — physics layer as boundary, not control.
- **Entry 69**: NIST/ISO Hardened Compliance Mapping tied to neurorights.
- **[Entry 70](../qif-framework/QIF-DERIVATION-LOG.md#entry-70-wearable-neural-firewall)**: Neurowall — full derivation chain.

## Next Steps

- [ ] Implement Delta+LZ4 compression in Rust (target: `nsp` crate)
- [ ] Simulate adversarial SSVEP notch filter on mock EMG stream
- [ ] Connect firewall event logs to TAL (Temporal Aggregation Log)
- [ ] Validate Runemate Scribe footprint on Cortex-M4F reference platform
