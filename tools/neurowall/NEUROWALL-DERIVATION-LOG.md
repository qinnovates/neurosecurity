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

## Entry 006 — NIC Chain Attack Simulation Test Suite (2026-02-21)

**Context:** After implementing the coherence monitor (Entries 002-004), we needed a systematic test harness that runs multiple attack techniques from the TARA registry against the full Neurowall pipeline and reports per-layer detection results. The goal is to map detection boundaries, not prove perfection.

### Test Script: `test_nic_chains.py`

10 scenarios covering 4 categories:
1. **Baseline attacks** (should be detected): clean signal (control), known SSVEP, impedance spike
2. **Unknown-frequency attacks** (monitor should catch): 13Hz SSVEP (not in notch bank), DC drift
3. **Broadband attacks** (monitor should catch): QIF-T0026 neuronal flood
4. **Evasion attacks** (designed to bypass): QIF-T0066 boiling frog, QIF-T0014 envelope modulation, QIF-T0067 phase replay, QIF-T0023 closed-loop cascade

### Test Harness Bugs Found and Fixed

**Bug 1: L1 Startup Artifact**
`SignalBoundary.prev_sample` starts at 0.0. The first EEG sample is ~2.5V (DC offset). `abs(2.5 - 0.0) = 2.5`, which triggers the impedance guard on the very first sample. Fix: initialize `prev_sample` to the first signal value in the test harness. Note: this is also a real bug in sim.py that should be fixed for production (the Arduino firmware doesn't have this issue because the ADC starts reading continuously).

**Bug 2: SSVEP False Positive from Alpha/10.9Hz Bin Overlap**
The NISS SSVEP detector checks spectral power at target frequencies [8.57, 10.9, 15.0, 20.0] Hz. At 2Hz FFT resolution (125-sample window, 250Hz), the 10.9Hz target maps to bin 5 (round(10.9/2) = 5). The natural 10Hz alpha rhythm ALSO maps to bin 5 (round(10/2) = 5). Result: the alpha rhythm itself registers as an SSVEP attack at 10.9Hz. This affected ALL scenarios, making the detection matrix unreadable. Fix in test: exclude 10.9Hz from SSVEP checks and use local spectral peak detection instead of global median comparison.

**Bug 3: SSVEP False Positive from 1/f^2 Spectral Slope**
Even after excluding 10.9Hz, the 8.57Hz target (bin 4) triggered false positives. Cause: the pink noise (random walk via `np.cumsum(white)`) has a 1/f^2 power spectrum. Low-frequency bins have ~64x more power than the global median. A global median comparison can't distinguish 1/f slope from an actual spectral peak. Fix: switched to LOCAL peak detection (compare target bin to its neighbors ±3 bins). A genuine SSVEP attack creates a sharp peak above the local spectral floor.

### Final Test Results

| # | Scenario | L1 | SSVEP | Monitor | NISS | Result |
|---|----------|-----|-------|---------|------|--------|
| 0 | Clean Signal (Control) | --- | --- | YES(1) | 6 | FALSE POS |
| 1 | SSVEP 15Hz (Known Target) | --- | YES | YES(16) | 10 | DETECTED |
| 2 | SSVEP 13Hz (Novel Freq) | --- | --- | YES(16) | 10 | DETECTED |
| 3 | Impedance Spike | YES | --- | YES(5) | 10 | DETECTED |
| 4 | Slow DC Drift (T0062) | --- | --- | YES(16) | 10 | DETECTED |
| 5 | Flood (QIF-T0026) | YES | YES | YES(10) | 10 | DETECTED |
| 6 | Boiling Frog (QIF-T0066) | --- | --- | --- | 5 | **EVADED** |
| 7 | Envelope Mod (QIF-T0014) | --- | --- | YES(16) | 10 | DETECTED |
| 8 | Phase Replay (QIF-T0067) | --- | --- | YES(1) | 9 | DETECTED* |
| 9 | Closed-Loop (QIF-T0023) | --- | --- | YES(6) | 10 | DETECTED |

*Phase replay detection is marginal (1 anomaly in 16 windows). A more sophisticated replay with matched noise statistics would evade.

### Analysis of Key Findings

**Finding 1: QIF-T0066 (Boiling Frog) Successfully Evades**
The ultra-slow drift at 0.001V/s stays below per-window detection thresholds. Over 10 seconds, total displacement is only 0.008V, well within noise floor. Each window's Cs remains at baseline (~0.69-0.74). Anomaly score: 0.0 across all windows. NISS stays at 5 (baseline from variance, no escalation). Policy never tightens.

This is the expected result. The boiling frog attack is specifically designed for adiabatic evasion. Fix requires a STATEFUL trajectory tracker that monitors cumulative Cs displacement over many windows, not just per-window z-scores. This is a Phase 1 requirement.

**Finding 2: QIF-T0014 (Envelope Modulation) Detected (Unexpected)**
We expected this to evade because the carrier (80Hz) is outside the alpha band the monitor tracks, and the envelope (10Hz) matches alpha. But the monitor caught it (16/16 windows flagged, Cs ~0.36 vs baseline 0.72).

Why it was caught: The 80Hz carrier at 0.15V amplitude is visible in the power spectrum. H_tau (spectral entropy) increases from ~0.06 to ~0.29 because the carrier adds a significant spectral peak outside the normal 1/f shape. The monitor doesn't need to demodulate the envelope; the carrier itself distorts the spectral shape enough for H_tau to catch it.

Important caveat: In a real attack with higher sample rates, the carrier would be at >500Hz (per TARA engineering parameters), well above Nyquist. At 250Hz sample rate, it aliases into the observable band. A real envelope modulation attack against a 250Hz system would use a sub-Nyquist carrier that blends with the noise floor, and would likely evade. Our 80Hz carrier is an artifact of the sim's sample rate limitation.

**Finding 3: QIF-T0067 (Phase Replay) Marginally Detected**
Expected full evasion, got 1 anomaly in 16 windows (Cs briefly dropped to 0.62, anomaly score 12.62). The detection is from statistical differences between the original and replay pink noise patterns. The replay used a different random seed, creating subtly different spectral characteristics in some windows.

A sophisticated replay (GAN-synthesized, matching higher-order statistics) would likely evade completely. The monitor's detection here is incidental, not robust. Proper replay defense requires biological TLS (challenge-response authentication), which is Phase 2+.

**Finding 4: Clean Signal False Positive**
1 anomaly flagged on clean signal (window at ~5.0s, Cs=0.65, anomaly=7.11). The monitor's baseline std during calibration is very small (~0.002), so even normal Cs variance creates large z-scores. The z-score based anomaly detection is too sensitive to outlier windows.

Options:
- Increase baseline_std floor from 1e-6 to 0.01 (reduces sensitivity to normal variance)
- Increase anomaly flag threshold from 1.5 to 2.0
- Use more calibration windows (8 instead of 4) for a more stable baseline

This is a tuning issue, not a fundamental problem. One false positive in 16 windows is a ~6% FPR. Acceptable for Phase 0 but needs improvement.

**Finding 5: QIF-T0023 (Closed-Loop Cascade) Detected Late**
The exponential growth (doubling every 1.5s) was invisible for the first 6 seconds. First anomaly at t=8.5s (anomaly=3.90), escalating to 8.36 by t=10s. The cascade was detectable only after the perturbation grew to ~0.016V (4x normal alpha amplitude). Earlier detection would require amplitude baseline tracking (sigma_gamma^2, not yet implemented).

### Detection Gap Summary

- **Currently detected (8/9):** Known SSVEP, novel SSVEP, impedance spike, DC drift, flood, envelope modulation*, phase replay*, closed-loop cascade
- **Currently evaded (1/9):** Boiling frog (QIF-T0066)
- **Marginal detections:** Phase replay (1/16 windows), envelope modulation (caveat: sim sample rate limitation)
- **False positives:** 1/16 windows on clean signal (~6% FPR)

### Phase 1 Requirements from Test Results

1. Stateful trajectory tracker for cumulative Cs drift detection (defeats QIF-T0066)
2. sigma_gamma^2 amplitude baseline for earlier closed-loop cascade detection
3. Demodulation analysis for proper envelope modulation detection at real sample rates
4. Biological TLS (challenge-response) for replay defense (Phase 2)
5. Increased baseline_std floor or adaptive thresholding to reduce false positive rate

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
