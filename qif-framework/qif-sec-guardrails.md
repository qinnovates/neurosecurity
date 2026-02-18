# QIF Security Guardrails: Physics-Derived Defense for Brain-Computer Interfaces

**Status:** Working Draft (Concept Design)
**Date:** 2026-02-18
**Origin:** Derivation Log Entry 60 (BCI Limits Equation Synthesis) + Entry 59 (Thalamic Gating + Guardrails Mapping)
**Classification:** HYPOTHESIS (novel integration) + VERIFIED (individual components)
**Author:** Kevin Qi, with AI co-derivation (Claude Opus 4.6)

---

## 1. The Core Insight

BCI security guardrails are not arbitrary policy decisions. They are derivable from physics.

The equations governing electromagnetism, thermodynamics, and information theory already define what a BCI can and cannot do. Those same equations define what an attacker can and cannot do. The constraint surface that limits BCI hardware defines the boundary. The security controls (Layers 1-3) use that boundary information to detect and respond to violations.

This document synthesizes a layered guardrail architecture starting from what physics gives us for free (signal integrity monitoring) and building toward what technology will eventually enable (on-chip encryption, anomaly detection, post-quantum protocols).

### How We Got Here

During research into how Johns Hopkins CELLS was calling for BCI security guardrails (Mathews, Balatbat, Dzau, 2022, NEJM), three threads converged:

1. **The BCI Limits Equation** (Derivation Log Entry 60): A unified constraint system coupling thermodynamics, electromagnetism, Moore's Law scaling, Shannon safety, Boltzmann detectability, and QIF's coherence metric. No published paper unifies these constraints. Closest: Marblestone et al. (2013), which covers thermal + EM for mouse brain only.

2. **Thalamic gating as biological precedent** (Entry 59): The brain already implements default-deny signal filtering at N4 via the reticular thalamic nucleus. BCIs that implant at N7 (cortical) bypass this gating entirely. The biology shows us what a security-relevant signal checkpoint looks like.

3. **The gap in published literature**: No current BCI implements on-device security monitoring. All existing on-chip monitoring is clinical (impedance checks, thermal limits, seizure detection). The space between "NeuroPace proves on-chip signal analysis works" and "therefore run a security monitor on-chip" has not been bridged.

---

## 2. The Physics Constraint System (Boundary, Not Control)

**Important framing:** The physics constraint system defines a *boundary*, the minimum operating envelope for any BCI. It is not itself a security control. Controls are things you implement (Layers 1-3). The physics boundary tells you what's physically possible and what deviations look like. That boundary information is what the actual controls use.

From Entry 60, the unified BCI constraint system:

```
Given: brain region R, implant depth d, target function F, time t

Subject to:
  P_total(n_ch, node_nm) <= P_thermal(R, n_chips, geometry, perfusion)  [thermodynamics]
  f_carrier <= f_max(tissue_attenuation, d)                              [wireless link EM]
  f_clock <= f_max_clk(P_budget, C_load, V_dd)                          [on-chip power]
  n_ch(t) = n_ch(0) * 2^(t/T_double)                                    [Moore's Law, T_double ~ 7.4 yr]
  k = log(D) + log(Q) < 1.75                                            [Shannon electrode safety]
  V_spike / V_noise_rms >> 1, where V_noise = sqrt(4kT*Re(Z)*df)        [detectability (SNR)]
  Cs(t) >= Cs_min(F)                                                     [QIF coherence threshold]
  DeltaT_total = f(P_total, geometry, perfusion) <= 1.0C                 [thermal ceiling, coupled to P_total]
  E_brain / E_silicon < epsilon_safe                                      [mechanical mismatch]
  Z_electrode(t) <= Z_max(signal_type)                                    [biocompatibility timeline]
  V_implant(n_ch, packaging) <= V_max(R)                                  [geometric fit]
  I_Shannon = B * log2(1 + SNR) >= I_min(F)                              [information theory]
  BW_telemetry >= n_ch * f_sample * bit_depth                            [wireless bandwidth]

Maximize: n_ch (channels) OR I_total (bandwidth) OR Cs (coherence)
```

**Validation notes (Feb 2026):**
- Constraint 2 was split: f_clock (on-chip) is limited by dynamic power (P ~ C*V^2*f), not tissue attenuation. Tissue attenuation limits the wireless carrier frequency. These are governed by different physics.
- Constraint 5 was reformulated: The BCI field uses voltage-domain SNR (Johnson-Nyquist noise), not energy ratios. The original E_spike/(kT) >> 1 is trivially true and doesn't capture the real engineering challenge.
- Constraints 1 and 7 are coupled: DeltaT_total is a function of P_total via the Pennes bioheat equation. They are not independent.
- Added constraint 13 (wireless telemetry bandwidth): total data rate must fit within the wireless link capacity.
- T_double corrected from "5-6 yr" to 7.4 yr per Stevenson & Kording (2011). Recent Neuropixels/Neuralink advances may have shortened this, but no peer-reviewed paper establishes a faster rate.

**Why this matters for security:** Each inequality defines a boundary. A BCI operating within bounds is normal. A signal that violates these bounds is either a malfunction or an attack. The physics tells you the expected operating envelope. Deviations from that envelope are detectable.

**Missing terms (acknowledged, future work):**
- Inter-channel crosstalk at high electrode density
- Foreign body / immune response model (dominant chronic failure mode, not just impedance)
- Power harvesting/delivery constraint (inductive, RF, battery each have depth/efficiency tradeoffs)
- Electrode material degradation model (separate from impedance rise due to encapsulation)
- Stimulation artifact constraint for bidirectional interfaces

### Key Physical Constants (Verified)

| Parameter | Value | Source | Status |
|-----------|-------|--------|--------|
| Max safe tissue temp rise | 1.0C | AAMI guideline (conservative subset of 2.0C limit) | Corrected attribution |
| Max intracortical power (single 2x2mm chip) | 4.8-8.4 mW | Kim et al., Marblestone et al. 2013 | Corrected from "15-40 mW" |
| Max intracortical power (distributed/epidural) | 15-40 mW | Published BCI thermal analyses | Range applies to larger systems only |
| Neural spike bandwidth | 300-10,000 Hz | Neurophysiology | Verified |
| Spike amplitude | 40-500 uV | Neurophysiology | Verified |
| Spike detection range | 50-140 um from electrode | Electrode characterization | Verified |
| Thermal noise floor (kT at 310K) | 4.28 x 10^-21 J | Boltzmann constant | Verified |
| Johnson noise (1 MOhm, 10 kHz BW) | ~12.8 uV rms | sqrt(4kT*Re(Z)*df) | Added |
| Shannon safety limit (k) | 1.75-1.85 | Shannon 1992, AAMI, DBS literature | Verified |
| Neuronal kill zone | 40-150 um around electrode | Implant pathology | Upper bound corrected |
| Brain micromotion (cardiac) | 1-4 um | Biomechanics | Corrected from "10-30 um" |
| Brain micromotion (all sources) | 10-30 um total | Cardiac + respiratory + postural | Clarified |
| BCI channel doubling time | ~7.4 yr | Stevenson & Kording 2011 | Corrected from "5-6 yr" |
| DC leakage tissue damage threshold | 0.4 uA | Preclinical studies (PMC6049833) | Added |

---

## 3. Guardrail Architecture: Four Layers

The guardrails are organized by what's technologically viable today vs. what requires future development. Each layer builds on the previous one.

```
Layer 0: Physics Boundary       [EXISTS - derivable from equations, defines the minimum envelope]
Layer 1: Signal Integrity       [FEASIBLE TODAY - proven on NeuroPace hardware]
Layer 2: Anomaly Detection      [NEAR-TERM - requires on-chip ML, Rust/embedded]
Layer 3: Cryptographic Defense   [FUTURE - requires NSP/Runemate on implant-class chips]
```

### Layer 0: Physics Boundary (The Operating Envelope)

**What it is:** The constraint system from Section 2. This is not a security control. It is the boundary definition: what is physically normal vs. abnormal for a given BCI implant. Every BCI has a physically defined operating envelope based on its implant location, electrode count, power budget, and tissue properties. Anything outside this envelope is abnormal by definition.

**What it defines:**
- Thermal limits (maximum power dissipation for tissue safety)
- EM limits (signal bandwidth and wireless carrier constraints)
- Impedance envelope (biocompatible range over time)
- Stimulation charge limits (Shannon safety criterion)

**What already exists (clinical safety checks):**
- Neuralink N1: On-chip impedance measurement across all 1,024 channels (~20 sec scan), thermal monitoring during wireless charging
- Medtronic Percept: Impedance checks at session start, artifact exclusion (ECG, motion)
- NeuroPace RNS: Continuous ECoG monitoring at 250 Hz with three detection algorithms
- Cochlear implants: Daily impedance telemetry via smartphone

**The gap:** These are all clinical safety checks, not security monitors. They detect malfunction, not manipulation. But the infrastructure is already on the chip. Reframing these boundaries as inputs to security monitoring (Layers 1-3) is the contribution.

### Governance Risk: Hardware vs. Software Protection

All commercially approved stimulation-capable BCIs use charge balancing (effectively required by ISO 14708-3:2017). But implementations vary dramatically:

| Approach | Example | Board Space | Attack Resilience |
|----------|---------|-------------|-------------------|
| Per-channel DC-blocking capacitors | MED-EL cochlear (14 caps) | ~50% of board | High: hardware-enforced, firmware attack cannot bypass |
| Active charge balancing (software) | Research ASICs (<6 nA DC error) | Minimal | Low: firmware attack can disable |
| Electrode shorting | Some cochlear manufacturers | Minimal | Lowest: doesn't prevent DC, just spreads it |

**ISO 14708-3 is performance-based, not prescriptive.** It requires "protection of electrical output pulse characteristics from unintended changes" but does not mandate specific implementations. A manufacturer can argue software-only charge balancing satisfies the standard.

**This is a cybersecurity gap.** Pycroft et al. (2016, "Brainjacking") and Schroder et al. (2025) identify firmware manipulation as the path to overriding safety limits. If a device uses software-only charge balancing, a firmware attack can disable it entirely. Hardware DC-blocking capacitors bound the attacker by physics. No published paper maps circuit-level protection architectures to attack resilience. This is a gap QIF can help fill.

**Miniaturization pressure is real.** MED-EL's safety capacitors take ~50% of circuit board space. Research on "blocking-capacitor-free" stimulator ASICs is explicitly motivated by size reduction. As BCIs shrink, hardware protection is the first casualty.

**Tissue damage from unbalanced charge:** DC leakage as low as 0.4 uA causes tissue damage. Mechanisms: electrolysis (water window violation), reactive oxygen species generation, electrode dissolution/corrosion, neural hyperactivity. The Shannon safety limit (k = 1.75) is empirical from 1990s cat cortex data, not a universal physical law.

**[GOVERNANCE-RISK: CHARGE-PROTECTION-GAP]** Which commercial BCIs use hardware-enforced vs. software-only charge protection? If a device class skips hardware protection for miniaturization, that's a risk factor. Firmware attacks on software-only implementations can disable charge balancing entirely (Pycroft 2016, Schroder 2025). No published audit maps protection architecture to attack resilience. **Action: Survey all TARA-tracked BCI devices for protection type (hardware cap / software / shorting). Track as governance risk per ISO 14708-3 performance-based gap.**

**Implementation status:** Layer 0 exists as physics. The governance risk assessment is new.

### Layer 1: Signal Integrity Monitor (The Voltmeter)

**What it is:** A lightweight, always-on signal integrity check running on the implant itself. Think of it as a voltmeter for neural signals. It doesn't need to understand the signal. It needs to know when the signal stops looking normal.

**The science behind it:** Neural signals have universal statistical properties regardless of brain region:

| Metric | What It Measures | Compute Cost | On-Chip Precedent |
|--------|-----------------|--------------|-------------------|
| **Line length** | Sum of absolute differences between consecutive samples. Surrogate for fractal dimension. | O(n), trivial | NeuroPace RNS (FDA-approved, 12+ year battery life) |
| **Signal energy (area)** | Integral of absolute amplitude | O(n), trivial | NeuroPace RNS |
| **1/f spectral exponent** | Slope of log-log power spectrum. Scale-invariant across all cortical regions. | Short FFT, moderate | FOOOF (validated in neuroscience, not yet on-chip) |
| **Higuchi fractal dimension** | Signal complexity measure | O(n * k_max), lightweight | Validated for ECoG spike detection |
| **Statistical moments** | Variance, kurtosis of amplitude distribution | O(n), trivial | Standard DSP |

**Why these work for security:**
- An adversarial signal injection that dramatically alters energy or frequency content WILL trigger line length and area detectors (same principle as NeuroPace seizure detection, different thresholds).
- A sudden change in the 1/f exponent indicates a fundamental shift in excitation-inhibition balance, which is region-agnostic because ALL cortical areas exhibit 1/f structure.
- A drop in fractal dimension means the signal has become too regular (possibly synthetic/injected). A spike means too chaotic (possibly corrupted).
- Changes in kurtosis indicate the amplitude distribution has shifted (adversarial signals may have different statistical properties than biological noise).

**What this CANNOT catch:** Subtle adversarial perturbations designed to shift BCI classification without changing signal statistics. This is a known limitation (SAIL Lab, University of New Haven, IEEE SMC 2023, demonstrated sensory-channel attacks via visual perturbation that evade simple detectors). Layer 2 addresses this.

**Connection to QIF coherence metric (Cs):** The coherence metric's four factors (phase variance, temporal entropy, gain fluctuation, spectral drift) map directly to these signal features:
- Phase variance (sigma^2_phi) ~ fractal dimension stability
- Temporal entropy (H_tau) ~ line length / energy ratio over time
- Gain fluctuation (sigma^2_gamma) ~ amplitude distribution moments
- Spectral drift (D_sf) ~ 1/f exponent change rate

**Cs_min becomes the threshold.** When the composite signal integrity score drops below Cs_min for a given brain function F, the guardrail triggers. This is the first security control: physics-derived, computationally cheap, and provably viable on existing implant hardware.

**Implementation path:**
1. Define Cs_min thresholds per band and function (requires clinical data collection)
2. Implement line length + energy + kurtosis monitor in Rust (`no_std`, Cortex-M target)
3. Validate against NeuroPace-style hardware constraints (250 Hz sampling, 12-year battery target)
4. Add 1/f exponent and Higuchi FD for Cortex-M4+ class chips with more headroom

**Implementation status:** FEASIBLE TODAY. NeuroPace proves the compute model works. Rust embedded toolchain is mature. Ferrocene (January 2025) is the first Rust compiler certified to IEC 62304 Class C for medical device software. The gap is integration, not capability.

### Layer 2: Adaptive Anomaly Detection (The Sentinel)

**What it is:** A per-patient baseline model that learns what "normal" looks like for a specific individual's neural signals and flags deviations. Goes beyond universal metrics (Layer 1) to catch subtle, targeted attacks.

**Why it's harder:** Requires:
- Enough on-chip memory to store a baseline model (~10-50 KB)
- Enough compute to run inference periodically (not per-sample)
- A training phase during initial implant calibration

**What it would detect that Layer 1 misses:**
- Slow-drift attacks (gradual parameter shift over days/weeks)
- Targeted perturbations tuned to a specific patient's signal characteristics
- Replay attacks using previously recorded legitimate neural data

**Compute feasibility:**

| Platform | Architecture | Native Performance | WASM (wasm3) | WASM (WAMR) |
|----------|-------------|-------------------|--------------|-------------|
| Cortex-M0+ (Pico-class) | ARM | Baseline | ~6-10x slower | ~48x slower |
| Cortex-M4F (clinical-grade) | ARM | Baseline | ~6x slower | ~30x slower |
| RISC-V (ESP32-C6 class) | RISC-V | Baseline | ~11x slower | ~similar |

Native Rust on Cortex-M4: viable for periodic anomaly checks (every 100ms-1s).
WASM via wasm3: viable for non-real-time monitoring tasks (~134 KB footprint).
WASM via WAMR: heavier (~280 KB) but more feature-complete.

**Connection to Staves bytecode:** Runemate's Staves bytecode could serve as the update mechanism for anomaly detection models. Rather than reflashing firmware (risky for implants), deliver new detection rules as Staves programs that run in a sandboxed WASM-like interpreter. This allows:
- Hot-swappable security rules without surgery
- Sandboxed execution (a malformed update can't crash the device)
- Compact representation (Staves is designed for compression)

**Open question:** Can Staves compile to wasm3-compatible bytecode? This needs exploration. The 10-50x performance penalty of WASM interpretation vs native is acceptable for periodic monitoring (not per-sample processing) but may be too expensive for the power budget of T3 implants.

**Implementation status:** NEAR-TERM (2-4 years). Requires embedded ML advances and clinical validation. The individual components exist, the integration does not.

### Layer 3: Cryptographic Defense (The Shield)

**What it is:** Full NSP (Neural Security Protocol) implementation on the implant, providing:
- Post-quantum key exchange (ML-KEM-768/1024)
- Authenticated encryption (AES-256-GCM-SIV)
- Device authentication (ML-DSA-65/87 + SPHINCS+-SHA2-192s)
- Rollback-protected firmware updates
- Per-frame integrity verification

**Why it's future:** The NSP handshake is a one-time ~10-12 KB cost, and per-frame encryption via AES-GCM-SIV is fast (microseconds on modern chips). But:

| Constraint | Current BCI Chips (~65nm) | Required for Full NSP |
|-----------|--------------------------|----------------------|
| Clock speed | ~10-50 MHz | Sufficient for AES-GCM |
| RAM | ~64-256 KB | ML-KEM needs ~30 KB working memory |
| Flash | ~256 KB - 1 MB | NSP firmware ~50-100 KB |
| Power for crypto | ~1-5 mW overhead | Within 4.8-8.4 mW budget (tight for single chip) |
| PQ signature verification | ~100ms on Cortex-M4 | Acceptable for handshake, not per-frame |

**Assessment:** AES-256-GCM-SIV symmetric encryption is viable on current implant hardware. The expensive part is the PQ handshake (ML-KEM + SPHINCS+), which only happens once per session. Per-frame symmetric encryption adds minimal overhead.

**The phased approach (from NSP spec):**

| Tier | Device Class | What's Feasible Now | What Needs Future Hardware |
|------|-------------|--------------------|-----------------------------|
| T1 (Consumer) | EEG headbands, hobby BCIs | Full NSP (external processor has plenty of compute) | Nothing, fully viable today |
| T2 (Clinical) | Research EEG, endovascular | Full NSP on gateway device, symmetric encryption on sensor | PQ handshake on-sensor |
| T3 (Implanted) | Cortical, DBS | Symmetric encryption + Layer 1 monitoring | Full PQ stack on-implant |

**Implementation status:** FUTURE for on-implant (T3). TODAY for T1/T2 with external processing.

---

## 4. What Exists vs. What's New

| Capability | State of the Art | QIF Contribution |
|-----------|-----------------|------------------|
| On-chip impedance monitoring | Neuralink, Medtronic, cochlear implants | Reframe as security control (Layer 0) |
| On-chip signal feature extraction | NeuroPace RNS (line length, area, half-wave) | Repurpose for adversarial detection (Layer 1) |
| Scale-invariant signal metrics | 1/f exponent, fractal dimension (validated in neuroscience) | Integrate into coherence metric Cs (Layer 1) |
| BCI physics constraint system | Marblestone et al. 2013 (thermal + EM, mouse brain) | Unified human-scale constraint system with security dimension (Layer 0) |
| Adversarial BCI attack detection | SAIL Lab, UNH (off-device sensory-channel attacks, IEEE SMC 2023) | On-chip detection using signal integrity (Layers 1-2) |
| Medical-grade Rust compiler | Ferrocene IEC 62304 Class C (Ferrous Systems, Jan 2025, MIT/Apache-2.0) | Enables certified Rust for implant firmware |
| Post-quantum BCI encryption | Nobody (no published work) | NSP protocol spec (Layer 3) |
| Updateable on-chip security rules | Nobody | Staves bytecode as sandboxed update mechanism (Layer 2) |

---

## 5. Known Gaps and Open Questions

### Gaps We Acknowledge

1. **No clinical validation.** The signal integrity thresholds (Cs_min per band/function) need to be calibrated against real patient data. NeuroPace took years of clinical trials to tune seizure detection parameters. Security thresholds will need similar validation.

2. **Adversarial robustness of Layer 1 is limited.** A sophisticated attacker who understands the detection metrics can craft signals that evade line length / energy / kurtosis checks. This is why Layer 2 (adaptive, per-patient) is necessary. Published work (adversarial EEG benchmarks) shows simple detectors can be evaded, but defense restores accuracy to >80%.

3. **Staves-to-WASM compilation path is unexplored.** We have Staves bytecode (Runemate) and we have wasm3 running on Cortex-M. Whether Staves can target wasm3 directly, or needs an intermediate compilation step, is an open engineering question.

4. **Power budget for crypto on T3 implants is tight.** ML-KEM-768 key generation on Cortex-M4 takes ~50-100ms and ~1-5 mW. This is within the thermal budget for a one-time handshake but leaves less headroom for continuous monitoring. The two capabilities compete for the same power envelope.

5. **Biocompatibility timeline degrades all layers.** Gliosis (scar tissue formation around electrodes) changes impedance and signal characteristics over 3-6 months. Layer 1 baselines must adapt. Layer 2 must retrain. This is a time-dependent term in the constraint system that we haven't fully modeled.

6. **No threat model for the update mechanism itself.** If Staves bytecode can update detection rules without surgery, an attacker who compromises the update channel can disable guardrails. NSP's rollback protection (Section 10 of the spec) addresses this partially, but the full threat model for over-the-air security updates to implants is complex and largely unexplored.

### Questions for Future Research

- What is the minimum Cs_min threshold that provides meaningful security without false positives during normal cognitive variation (sleep, stress, medication changes)?
- Can the 1/f spectral exponent serve as a universal "signal health" metric across all QIF bands, or does it need per-band calibration?
- What is the power cost of running a minimal anomaly detection model (e.g., isolation forest, one-class SVM) on Cortex-M4 at clinically relevant update rates?
- How does the NeuroPace line-length algorithm perform when repurposed for detecting adversarial signal injection rather than seizures? (This could be tested with existing NeuroPace data.)
- Can the constraint system predict when specific TARA attack techniques become feasible based on projected BCI hardware capabilities? (Mapping constraint violations to the TARA timeline.)

---

## 6. Relationship to QIF Framework

| QIF Component | Guardrail Connection |
|--------------|---------------------|
| **Hourglass Band I0** | Layers 1-3 operate at I0 (the neural-silicon interface) |
| **QI Coherence Metric (Cs)** | Layer 1 threshold. Cs_min defines the minimum signal integrity for safe operation |
| **NISS Scoring** | Constraint violations map to elevated NISS scores for affected techniques |
| **TARA Atlas** | Constraint system predicts which techniques become feasible at what hardware generation |
| **NSP Protocol** | Layer 3 implements NSP tiers (T1/T2/T3) mapped to device class |
| **Runemate / Staves** | Layer 2 update mechanism via sandboxed bytecode |
| **BCI Limits Equation** | Layer 0. The constraint surface defines the operating envelope (boundary, not control) |

---

## 7. Concept Design: Layer 1 Implementation Sketch

This is the first guardrail. Start here.

```
[Electrode Array] --> [Analog Front-End] --> [ADC] --> [Signal Integrity Monitor] --> [Downstream Processing]
                                                              |
                                                              v
                                                      [Cs >= Cs_min?]
                                                        /          \
                                                      YES           NO
                                                       |             |
                                                  [Pass through]  [Alert + Log]
                                                                       |
                                                                  [Configurable Response]
                                                                  - Log only (T1)
                                                                  - Attenuate signal (T2)
                                                                  - Halt stimulation (T3)
```

**Signal Integrity Monitor components (all O(n) or better):**

```rust
// Conceptual - not production code
// Target: Cortex-M4, no_std, ~2 KB RAM

struct SignalIntegrityMonitor {
    window_size: usize,        // e.g., 256 samples (1 sec at 250 Hz)
    cs_min: f32,               // Coherence threshold for this band/function
    baseline_line_length: f32, // Learned during calibration
    baseline_energy: f32,
    baseline_kurtosis: f32,
    alert_count: u16,          // Consecutive violations before response
}

impl SignalIntegrityMonitor {
    fn check(&mut self, window: &[i16]) -> SignalStatus {
        let ll = line_length(window);
        let energy = signal_energy(window);
        let kurt = kurtosis(window);

        // Composite coherence estimate
        let cs = self.compute_cs(ll, energy, kurt);

        if cs < self.cs_min {
            self.alert_count += 1;
            if self.alert_count >= ALERT_THRESHOLD {
                SignalStatus::Violation
            } else {
                SignalStatus::Warning
            }
        } else {
            self.alert_count = 0;
            SignalStatus::Normal
        }
    }
}
```

**Resource estimate:**
- RAM: ~2-4 KB (signal window + state)
- Flash: ~8-16 KB (monitor code + calibration data)
- Power: <0.5 mW (dominated by ADC, not computation)
- Latency: <1 ms per window check on Cortex-M4 at 48 MHz

This fits comfortably within the power and memory budget of every clinical-grade BCI currently in existence.

---

## 8. Roadmap

| Phase | Guardrail Layer | Timeframe | Dependencies |
|-------|---------------|-----------|--------------|
| **0** | Layer 0: Document physics envelope per band | Now | BCI Limits Equation (Entry 60) |
| **1** | Layer 1: Signal integrity monitor (Rust, Cortex-M) | 6-12 months | Ferrocene qualification for Cortex-M, Cs_min calibration data |
| **2** | Layer 1 validation: Test against known attack patterns | 12-18 months | TARA attack simulation, NeuroPace data access |
| **3** | Layer 2: Adaptive anomaly detection prototype | 2-3 years | On-chip ML feasibility study, Staves-to-WASM exploration |
| **4** | Layer 3: NSP symmetric crypto on T3 hardware | 3-5 years | Next-gen BCI chips (~28nm), NSP T3 implementation |
| **5** | Layer 3: Full PQ stack on implant | 5-8 years | BCI chips at ~7nm, sufficient power headroom |

---

## References

### Primary (Verified)

- Marblestone AH, Zamft BM, et al. (2013). "Physical Principles for Scalable Neural Recording." Frontiers in Computational Neuroscience. DOI: 10.3389/fncom.2013.00137
- Stevenson IH, Kording KP. (2011). "How advances in neural recording affect data analysis." Nature Neuroscience 14:139-142. DOI: 10.1038/nn.2731
- Mathews DJH, Balatbat CA, Dzau VJ. (2022). "Governance of Emerging Technologies in Health and Medicine." NEJM 386(23):2239-2242. DOI: 10.1056/NEJMms2200907
- Neuralink (2019). "An integrated brain-machine interface platform with thousands of channels." JMIR 10:e16194
- Neuralink (2024). "Building Safe Implantable Devices." https://neuralink.com/updates/building-safe-implantable-devices/
- Donoghue T, et al. (2020). "Parameterizing neural power spectra into periodic and aperiodic components." Nature Neuroscience 23:1655-1665
- Ferrous Systems (2025). "Ferrocene Achieves IEC 62304 Qualification." https://ferrous-systems.com/blog/ferrocene-achieves-iec-62304-qualification/
- SAIL Lab, University of New Haven (2023). "Adversarial Perturbation Attacks on Brain-Computer Interfaces." IEEE SMC 2023. Vahid Behzadan et al.
- Pycroft L, et al. (2016). "Brainjacking: Implant Security Issues in Invasive Neuromodulation." World Neurosurgery. DOI: 10.1016/j.wneu.2016.05.010
- Schroder T, et al. (2025). "Cyber Risks to Next-Gen Brain-Computer Interfaces: Analysis and Recommendations." SSRN: 5138265
- Kim S, et al. "Thermal Considerations for the Design of an Implanted Cortical BMI." NCBI Bookshelf NBK3932
- ISO 14708-3:2017. "Active Implantable Medical Devices, Implantable Neurostimulators."
- MED-EL (2024). "Independent Safety Capacitors for Cochlear Implants." https://blog.medel.pro/audiology/safety-capacitors-reliability/

### QIF Internal

- QIF Derivation Log Entry 60: BCI Limits Equation Synthesis
- QIF Derivation Log Entry 59: I0 Depth Subclassification, Thalamic Gating, Guardrails Mapping
- NSP Protocol Specification v0.5
- QIF-TRUTH.md Section 4.6: Implicit Hamiltonian

---

*This document connects physics constraints to security controls. The equations already exist. The on-chip precedent already exists (NeuroPace). The embedded Rust toolchain already exists (Ferrocene). The gap is putting them together. That's what QIF provides.*
