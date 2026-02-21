# Neurowall Derivation Log

Engineering decisions, test results, and design rationale for the Neurowall simulation and firmware.

---

## Entry 001 — NISS v1: Signature-Based Detection (2026-02-21)

**Context:** Initial sim.py (v0.1-v0.2) used a purely signature-based NISS engine that looked for spectral power at known SSVEP target frequencies (8.57, 10.9, 15.0, 20.0 Hz). This worked for known attacks but had a fundamental blind spot: any attack using an unlisted frequency, a slow drift, or broadband saturation would be completely invisible.

**What was tested:**
- SSVEP attack at 15Hz: detected (NISS 9-10)
- Clean signal: scored 0-2 (correct)
- Impedance spikes: detected via L1 guard

**Problem identified:** NISS is just a score calculator. It cannot identify unknown anomalies. We need onboard signal monitoring that learns what "normal" looks like and flags deviations, without needing the attack taxonomy in advance.

**Decision:** Keep SSVEP signature detection as one input, but add an unsupervised anomaly detector based on the QIF coherence metric (Cs).

---

## Entry 002 — Coherence-Based Anomaly Detection (2026-02-21)

**Design:** Incorporated the QIF Coherence Metric Cs from QIF-TRUTH.md §3.1 as the anomaly scoring backbone:

```
Cs = e^(-(w1 * sigma_phi^2 + w2 * H_tau))
```

This is a Boltzmann factor. The exponent sum plays the role of "energy" (anomaly), and Cs is the probability of the signal being legitimate. Cs = 1.0 means perfectly coherent (normal). Cs -> 0 means anomalous.

### Component Adaptation for Single-Channel (Phase 0)

**sigma_phi^2 (Phase Variance):**
- QIF spec: Circular variance of cross-channel phase-locking value (PLV)
- Single-channel adaptation: Hilbert transform instantaneous phase stability on the alpha-band-filtered (8-13Hz) signal
- Rationale: Must bandpass to alpha first. Raw broadband phase is naturally jittery (sigma_phi ~ 9.8 even for clean signal, rendering Cs near zero). Alpha rhythm is the dominant structured oscillation in resting EEG, so its phase stability is the most informative single-channel metric.
- Formula: (1 - R) * pi^2, where R = |mean(e^(i*phi))|

**H_tau (Spectral Entropy / Transport Entropy):**
- QIF spec: Shannon entropy of pathway transmission reliability
- Single-channel adaptation: Shannon entropy of the normalized power spectral density
- Range: [0, 1] after dividing by ln(N_bins)
- Normal EEG: moderate entropy (~0.05-0.08, structured 1/f spectrum with alpha peak)
- SSVEP attack: low-moderate entropy change as energy concentrates
- Flood attack: high entropy (~0.88, energy distributed across many frequencies)

**sigma_gamma^2 (Gain Variance):**
- QIF spec: Amplitude stability relative to baseline
- Status: **NOT YET IMPLEMENTED.** Requires per-session baseline calibration infrastructure that tracks amplitude norms over time. Noted for Phase 1.

### Calibration Weights (w1, w2)

QIF-TRUTH.md §4.2 identifies calibration weights as "an open calibration question." For single-channel Phase 0, empirically tuned:

- **w1 = 0.02** (phase weight, low): Single-channel Hilbert phase variance is inherently noisy (range 7.9-9.8). Needs dampening.
- **w2 = 3.0** (transport weight, high): Spectral entropy is the most discriminative single-channel metric. Ranges 0.05 (clean) to 0.90 (flood).

Result:
- Clean signal: w1*8.0 + w2*0.06 ~ 0.34, Cs ~ 0.71 (High, matches QIF decision threshold)
- SSVEP attack: Cs ~ 0.28 (Medium/Low)
- Drift attack: Cs ~ 0.24 (Low)
- Flood attack (QIF-T0026): Cs ~ 0.06 (Critical)

Phase 1 (multi-channel): w1 increases because cross-channel PLV gives sigma_phi a meaningful 0-4 range instead of 7.9-9.8.

### Test Results

| Scenario | Baseline Cs | Attack Cs | Anomalies Flagged | SSVEP Detector |
|----------|-------------|-----------|-------------------|----------------|
| Clean signal | 0.70 | 0.70-0.74 | 0 | N/A |
| SSVEP 15Hz | 0.72 | 0.28 | Yes (all windows) | Also detected |
| Slow DC drift | 0.66 | 0.24 | Yes (5 windows) | **BLIND** |
| Flood (QIF-T0026) | 0.72 | 0.06 | Yes (4 windows) | **BLIND** |

The drift and flood attacks are invisible to the SSVEP signature detector. Only the coherence monitor catches them.

---

## Entry 003 — Software Capacitor Concept (2026-02-21)

**Concept:** The anomaly score from the coherence monitor acts as a "software capacitor." Like a physical capacitor absorbs transient voltage spikes without passing them through, the monitor absorbs small, normal signal variations (anomaly score < 1.0) without triggering NISS escalation. But when sustained anomalies exceed the capacitor's capacity (anomaly > 1.0), the overflow feeds directly into NISS scoring, triggering policy tightening.

This maps directly to the BCI limits equation thermal budget constraint from QIF-TRUTH.md (Entry 60, Field Journal Entry 017):

```
P_total(n_ch, node_nm) <= P_thermal(R, n_chips)    [thermodynamics]
```

A flood attack (QIF-T0026) pushes signal power beyond the thermal budget. The physical capacitor on the implant can absorb brief transients, but sustained overload exceeds its capacity. The software capacitor mirrors this: brief Cs drops are tolerated, but sustained Cs collapse triggers the firewall.

**Implementation in sim.py:**
```python
if anomaly_score > 1.0:
    niss_score += min((anomaly_score - 1.0) * 3.0, 5.0)  # Up to 5 NISS points
```

---

## Entry 004 — QIF-T0026 Neuronal Flooding Detection (2026-02-21)

**TARA Reference:**
- Technique: QIF-T0026 "Neuronal flooding"
- Tactic: QIF-P.DS (Denial of Service / Disruption)
- Bands: I0 -> N4-N7
- Severity: Critical

**Neural Impact Chain (NIC):**
```
I0 (electrode saturation)
  -> N4 (thalamic gate overwhelmed: reticular thalamic nucleus cannot
         maintain default-deny inhibition under broadband flooding)
  -> N5 (basal ganglia motor circuits disrupted)
  -> N6 (limbic/emotional circuits saturated)
  -> N7 (cortical flooding, seizure risk)
```

**NISS Vector:** BI:H / CG:H / CV:E / RV:P / NP:T (score 6.4, medium)

**Detection mechanism:** The flood attacks across ALL frequencies simultaneously, so no single SSVEP target frequency is elevated. The signature detector is blind. But the coherence monitor detects two things:
1. **Phase coherence collapse (sigma_phi^2):** The alpha rhythm's instantaneous phase becomes erratic as the broadband noise overwhelms the structured oscillation.
2. **Spectral entropy spike (H_tau):** The normal 1/f spectral shape is destroyed. Energy distributes unnaturally across the spectrum.

Both cause Cs to crash from ~0.72 to ~0.06 (Critical threshold in QIF decision table).

**BCI limits connection:** From the constraint system (Field Journal Entry 017):
- Flood exceeds `P_thermal(R, n_chips)`: sustained power injection beyond the tissue's thermal absorption capacity
- Flood violates `Cs(sigma_phi, H_tau, sigma_gamma) >= Cs_min(F)`: coherence drops below the minimum required for the target function
- The "software capacitor" overflow corresponds to exceeding the physical thermal budget

---

## Entry 005 — Phase 1 Roadmap (2026-02-21)

**What's implemented (Phase 0, single-channel):**
- sigma_phi^2 via Hilbert transform on alpha-band-filtered signal
- H_tau via normalized spectral entropy
- Calibration weights w1=0.02, w2=3.0
- Software capacitor overflow into NISS
- Anomaly detection for unknown attacks (drift, flood)

**What's needed for Phase 1 (multi-channel, OpenBCI Cyton 8-ch):**
- sigma_phi^2 via cross-channel PLV (the actual QIF spec method)
- sigma_gamma^2 via per-session amplitude baseline deviation
- Recalibrate w1 upward (cross-channel PLV is more informative)
- Recalibrate w2 based on multi-channel spectral characteristics
- H_tau via actual pathway integrity (not just spectral entropy proxy)
- Real-time Cs computation on Raspberry Pi 4B (should be fine: scipy + numpy)

**Phase 2 (nRF5340 / embedded):**
- Port coherence monitor to Rust no_std
- Fixed-point Hilbert transform for ARM Cortex-M33
- Pre-computed butterworth SOS coefficients (no scipy at runtime)
- SRAM budget: ~16KB for 8-channel * 125-sample windows
