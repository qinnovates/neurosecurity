# Architectural Spec: Wearable Neural Firewall (Phase 1)

This document outlines the first-generation **Neural Firewall** architecture for non-intrusive BCI wearables (e.g., Smart Glasses, Subvocal EMG interfaces).

## Target Form Factors
1.  **Neural-Embedded Eyeglasses**: Integration of dry EEG (temporal), EOG (eye tracking), and EMG (facial) sensors.
2.  **Subvocal Collars (AlterEgo Style)**: High-density jaw/neck EMG arrays for silent speech decoding.

---

## Core Security & Efficiency Stack
The firewall leverages the **QIF Hourglass Stack** to satisfy post-quantum requirements and physical chip restrictions:
1.  **NSP (Neural Sensory Protocol) v0.5**: Provides the **L14 Secure Transport**. Uses hybrid PQ key exchange (ML-KEM-768) and AES-256-GCM-SIV for link-layer security.
2.  **Runemate (The Scribe)**: The on-chip bytecode interpreter. The firewall logic runs as a **TARA-validated Stave**, ensuring safe execution in a <200KB footprint.
3.  **Neural Compression**: All telemetry is compressed using **NSP Delta+LZ4**, reducing bandwidth and power consumption by up to 90% before transmission.

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
