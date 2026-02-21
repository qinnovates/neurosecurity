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
| [NEUROWALL-DERIVATION-LOG.md](./NEUROWALL-DERIVATION-LOG.md) | Engineering decisions, coherence monitor design, and attack simulation results. |

## Simulation & Testing

| File | Description |
| :--- | :--- |
| [sim.py](./sim.py) | Full 3-layer pipeline simulation (v0.4). Generates synthetic EEG, runs L1 notch filters + impedance guard, L2 differential privacy, coherence-based anomaly detection (Cs metric), L3 NISS policy engine, and NSP transport (delta + LZ4 + AES-256-GCM). No hardware required. |
| [test_nic_chains.py](./test_nic_chains.py) | NIC (Neural Impact Chain) attack simulation test suite. Runs 10 TARA-mapped attack scenarios against the full pipeline and reports per-layer detection results with FPR-adjusted scoring. |

### Running the Tests

```bash
# Full pipeline simulation (clean EEG, no attack)
python sim.py

# Inject SSVEP attack
python sim.py --attack --freq 15.0

# Run all 10 NIC chain attack scenarios
python test_nic_chains.py

# Run a single scenario with verbose per-window diagnostics
python test_nic_chains.py --scenario 5 --verbose

# Dependencies
pip install numpy scipy lz4 cryptography
```

### Current Detection Results (v0.4)

| # | Attack | Detected By | Result |
|---|--------|------------|--------|
| 0 | Clean Signal (Control) | -- | BASELINE (6 FP / 16 windows) |
| 1 | SSVEP 15Hz | SSVEP + Monitor | DETECTED |
| 2 | SSVEP 13Hz (novel freq) | Monitor | DETECTED |
| 3 | Impedance Spike | L1 | DETECTED |
| 4 | Slow DC Drift | Monitor | DETECTED |
| 5 | Neuronal Flooding (QIF-T0026) | L1 | DETECTED |
| 6 | Boiling Frog (QIF-T0066) | -- | **EVADED** |
| 7 | Envelope Modulation (QIF-T0014) | Monitor | DETECTED |
| 8 | Phase Replay (QIF-T0067) | -- | **EVADED** |
| 9 | Closed-Loop Cascade (QIF-T0023) | -- | **EVADED** |

**6/9 attacks detected, 3/9 evaded.** See [NEUROWALL-DERIVATION-LOG.md Entry 007](./NEUROWALL-DERIVATION-LOG.md) for full analysis of detection boundaries, evasion mechanisms, and Phase 1 requirements.

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

**QIF-level derivations** (in [QIF-NEUROWALL-DERIVATION-LOG.md](../../qif-framework/QIF-NEUROWALL-DERIVATION-LOG.md)):

- **[Entry 68](../../qif-framework/QIF-NEUROWALL-DERIVATION-LOG.md#entry-68-guardrails-ssvep-thalamic-gate-raw):** Security Guardrails Synthesis + SSVEP Discovery + Thalamic Gate Model. Physics layer as boundary, not control.
- **[Entry 69](../../qif-framework/QIF-NEUROWALL-DERIVATION-LOG.md#entry-69-nist-iso-hardened-mapping):** NIST/ISO Hardened Compliance Mapping. Bridges neurorights to auditable technical evidence (NIST SP 800-53 / ISO 27001).
- **[Entry 70](../../qif-framework/QIF-NEUROWALL-DERIVATION-LOG.md#entry-70-wearable-neural-firewall):** Wearable Neural Firewall. Full architectural derivation: NSP v0.5 integration, Merkle amortization, Delta+LZ4 compression, Runemate Scribe execution.

**Neurowall-specific engineering log** (in [NEUROWALL-DERIVATION-LOG.md](./NEUROWALL-DERIVATION-LOG.md)):

- **Entry 001-004:** Coherence monitor design, Cs metric adaptation for single-channel EEG, software capacitor concept, QIF-T0026 flooding detection.
- **Entry 006:** NIC chain attack simulation test suite (10 scenarios, 3 bugs found/fixed).
- **Entry 007:** v0.4 trajectory tracker, DC drift detection failure analysis, FPR-adjusted detection methodology, and honest evasion boundary mapping (3/9 evade).

## Next Steps

- [ ] Implement Delta+LZ4 compression in Rust (target: `nsp` crate)
- [ ] Simulate adversarial SSVEP notch filter on mock EMG stream
- [ ] Connect firewall event logs to TAL (Temporal Aggregation Log)
- [ ] Validate Runemate Scribe footprint on Cortex-M4F reference platform
