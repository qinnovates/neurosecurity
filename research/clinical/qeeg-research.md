# qEEG Research & Integration Guide

> Living document. Add findings as we discover them.
> Last updated: 2026-03-13

Quantitative EEG (qEEG) is the mathematical/statistical analysis layer on top of raw EEG — PSD, coherence, z-scores against normative databases, source localization. The field has decades of tooling and clinical validation. This document tracks what exists and what we can adopt for NISS, Brain Map, Signal Monitor, and Neurowall.

---

## Table of Contents

- [Open-Source Tools](#open-source-tools)
- [Normative Databases](#normative-databases)
- [Key Metrics & Methods](#key-metrics--methods)
- [Clinical Patterns Reference](#clinical-patterns-reference)
- [Adversarial EEG Attack Literature](#adversarial-eeg-attack-literature)
- [Security-Relevant Insights](#security-relevant-insights)
- [Standards & Guidelines](#standards--guidelines)
- [Action Items](#action-items)
- [Clinical Pattern Identification Strategy](#clinical-pattern-identification-strategy)
- [KQL Data Lake Integration Plan](#kql-data-lake-integration-plan)
- [Future Work & Whitepaper Connection](#future-work--whitepaper-connection)
- [References](#references)

---

## Open-Source Tools

### MNE-Python (`mne-tools/mne-python`)

Full EEG/MEG analysis pipeline. Current stable: v1.11.0.

**Capabilities:** PSD (Welch, multitaper), ICA artifact rejection, source localization (sLORETA, eLORETA), time-frequency analysis (Morlet wavelets, STFT), functional connectivity (coherence, PLV, wPLI), BIDS read/write.

**What we can adopt:**
- Multitaper PSD (better than our naive DFT — less spectral leakage)
- ICA-based artifact removal patterns
- Connectivity metrics (wPLI especially)
- Their Raw/Epochs/Evoked data model as export format reference

**Companion libraries:** PyPREP (channel rejection), Autoreject (automated epoch rejection), MNE-Connectivity, MNE-BIDS.

Gramfort et al. (2013). *Frontiers in Neuroscience*, 7:267. DOI: [10.3389/fnins.2013.00267](https://doi.org/10.3389/fnins.2013.00267). PMID: 24431986.

### EEGLAB (MATLAB)

ICA decomposition, spectral analysis, 200+ plugins including ASR (Artifact Subspace Reconstruction), DIPFIT (dipole modeling), ICLabel (automated IC classification).

**What we can adopt:** Their automated artifact classification approach — ICLabel distinguishes brain vs. muscle vs. eye vs. injected signal. This is directly relevant to distinguishing biological artifacts from adversarial injection.

Delorme & Makeig (2004). *J Neuroscience Methods*, 134(1):9-21. DOI: [10.1016/j.jneumeth.2003.10.009](https://doi.org/10.1016/j.jneumeth.2003.10.009). PMID: 15102499.

### BrainFlow

Already integrated for acquisition. Their signal processing API also has bandpass/bandstop filters, Welch PSD, CSP (Common Spatial Pattern), concentration/mindfulness metrics, and artifact detection that we're not fully leveraging.

Docs: [brainflow-openbci.readthedocs.io](https://brainflow-openbci.readthedocs.io/en/latest/)

### FieldTrip (MATLAB, Donders Institute)

Beamforming (LCMV, DICS), source analysis, LORETA integration, connectivity analysis (coherence, PLI, wPLI, Granger causality), BIDS support.

Home: [fieldtriptoolbox.org](https://fieldtriptoolbox.org)

### sLORETA / eLORETA (Pascual-Marqui)

Standardized discrete 3D distributed linear minimum-norm inverse solution. Zero localization error in absence of noise. Also implemented inside MNE-Python (`mne.minimum_norm.apply_inverse` with `method='sLORETA'`) and FieldTrip.

Home: [uzh.ch/keyinst/NewLORETA](https://uzh.ch/keyinst/NewLORETA)

### Other Python Libraries

| Library | What It Does |
|---------|-------------|
| **neurodsp** | Spectral analysis, burst detection, neural signal simulation |
| **yasa** | Sleep staging, spindle/slow-oscillation detection (uses MNE objects) |
| **EEG-Pype** | MNE pipeline with GUI for resting-state EEG. DOI: [10.1371/journal.pcbi.1014043](https://doi.org/10.1371/journal.pcbi.1014043) |

---

## Normative Databases

### Commercial

| Database | Subjects | Ages | Metrics | Key Feature |
|----------|----------|------|---------|-------------|
| **NeuroGuide** | 625 | 2mo-82yr | Power, coherence, phase lag, asymmetry, LORETA | Sliding-average age regression (3-month resolution) |
| **qEEG-Pro** | 1,482 (EC) / 1,231 (EO) | 6-60yr | Power, phase lag, phase coherence | Regression-corrected for psychopathology — removes diagnostic variance from normative fits |

### Open-Access

#### ISB-NormDB
- 1,289 subjects (553 male, 736 female), ages 4.5-81 years
- 19-channel 10-20 system, eyes open and eyes closed (4 min each)
- Z-score method: Generalized Additive Models (GAM) with spline curve fitting — continuous age prediction rather than age-band bins
- **Sex-differentiated normative curves** (separate models for male/female) — first major database to offer this
- Full methodology published, open-access

Ko et al. (2021). *Frontiers in Neuroscience*, 15:766781. DOI: [10.3389/fnins.2021.766781](https://doi.org/10.3389/fnins.2021.766781). PMC8718919.

#### Temple University Hospital EEG Corpus (TUEG)
- World's largest open EEG corpus: 16,986 sessions, 10,874 unique subjects, 572 GB
- Clinical-grade data with neurologist interpretation, demographics
- Subsets: TUSZ (seizure detection), TUH Artifact Corpus (21 artifact categories)
- Not a normative database — no z-score infrastructure — but ideal for training anomaly detectors and artifact classifiers
- Access: [isip.piconepress.com/projects/tuh_eeg](https://isip.piconepress.com/projects/tuh_eeg) (free registration)

Obeid & Picone (2016). *Frontiers in Neuroscience*, 10:196. DOI: [10.3389/fnins.2016.00196](https://doi.org/10.3389/fnins.2016.00196). PMC4865520.

### What This Means for Us
- ISB-NormDB gives us open-access z-score methodology we can reference for NISS baseline comparison
- TUH corpus could train artifact/anomaly classifiers that distinguish biological artifacts from injected signals
- Z-score threshold recommendation: Z > 3.5 in any single metric should trigger a Signal Monitor alert

---

## Key Metrics & Methods

### Currently Implemented

- [x] RMS amplitude (NISS, Neurowall)
- [x] Basic DFT / frequency analysis (NISS)
- [x] Cross-channel coherence — simplified variance proxy (NISS)
- [x] Band power display (Brain Map, Spectrum)
- [x] Amplitude thresholds (Neurowall)

### High Priority — Improves NISS Accuracy

#### Welch PSD (replace naive DFT)
Better spectral estimates with reduced leakage. Segment signal into overlapping windows, compute FFT per window, average. Standard in every qEEG tool. JS equivalent of `scipy.signal.welch`, or use BrainFlow's built-in.

#### Relative Power (alongside absolute)
Band power / total power. More robust for inter-subject comparison. Different sensitivity to injection types than absolute power — using both in tandem is more sensitive than either alone.

- Narrow-band injection: absolute power spikes, relative may not change proportionally
- Broadband injection: relative power shifts across bands

#### wPLI (weighted Phase Lag Index)
Volume-conduction-robust connectivity metric. Should replace our current coherence proxy (cross-channel RMS variance).

- Explicitly rejects zero-lag (volume-conducted) coupling
- Injected signals from a single external source produce near-zero phase lag across all channels — wPLI detects this as anomalously low
- Better signal-to-noise than raw PLI

Vinck et al. (2011). *NeuroImage*, 55(4):1548-1565. DOI: [10.1016/j.neuroimage.2011.01.055](https://doi.org/10.1016/j.neuroimage.2011.01.055). PMID: 21276857.

#### Sample Entropy (SampEn)
Measures signal complexity/irregularity. Injected signals are more regular/predictable than biological neural noise — entropy drops sharply under structured injection. Strong distinguisher between biological and artificial signals.

### Medium Priority — Improves Brain Map & Analysis

| Metric | What It Does | Why We Want It |
|--------|-------------|----------------|
| **Peak Alpha Frequency (PAF)** | Frequency bin with max power in 8-12 Hz. Normal: 9.5-11 Hz in healthy adults | Stability check — rapid PAF shift without physiological cause is suspicious. Also: slow PAF (~7-8 Hz) confounds TBR by pushing alpha into theta range |
| **Frontal Alpha Asymmetry (FAA)** | F4 alpha - F3 alpha (log-transformed) | Well-studied lateralization metric. Small but significant effect in depression |
| **Theta/Beta Ratio (TBR)** | Theta power / beta power at Cz | Display only with caveats. FDA cleared as ADHD adjunct aid (NEBA K112711, 2013) but not standalone diagnostic. Must note PAF confound |
| **Delta/Alpha Ratio (DAR)** | Delta power / alpha power | Elevated in encephalopathy, TBI, dementia. Tracks recovery trajectory |

### Lower Priority — Future Work

| Metric | What It Does |
|--------|-------------|
| **ICA artifact classification** | Separate brain vs. muscle vs. eye vs. injected components automatically |
| **sLORETA source localization** | Map surface signals to estimated brain regions |
| **Cordance** | Combined absolute+relative power; predicts treatment response. One of the more validated qEEG metrics for MDD |
| **Spectral Entropy** | Complementary to SampEn; measures frequency-domain irregularity |

---

## Clinical Patterns Reference

> These patterns are documented in literature for **threat modeling reference only**. They are NOT diagnostic claims. Per neuromodesty framework: NISS scores correspond to diagnostic categories for threat modeling purposes, not diagnostic claims.

| Condition | EEG Pattern | Evidence Level | Key Citation |
|-----------|------------|----------------|--------------|
| **ADHD** | Elevated theta, decreased beta, elevated TBR at Cz | Investigational for diagnosis; valid for stratification | Arns et al. (2013), DOI: [10.1177/1087054712460087](https://doi.org/10.1177/1087054712460087) |
| **TBI (acute)** | Reduced alpha, increased delta/theta, diffuse slowing | Established for monitoring; Level U for diagnosis | Tenney et al. (2021), DOI: [10.1097/WNP.0000000000000853](https://doi.org/10.1097/WNP.0000000000000853) |
| **TBI (chronic mTBI)** | Increased relative theta, decreased relative alpha, decreased interhemispheric beta coherence | Level U for diagnosis | Tenney et al. (2021) |
| **Depression (MDD)** | Frontal alpha asymmetry, increased frontal theta, altered cordance | Class II/III; not standalone | Popa et al. (2020), DOI: [10.25122/jml-2019-0085](https://doi.org/10.25122/jml-2019-0085) |
| **PTSD** | Altered resting alpha asymmetry, impaired theta-band networks, beta elevation | Research-grade | — |
| **Alzheimer's/MCI** | Slowed dominant frequency, reduced alpha coherence, reduced SampEn | Promising biomarker; not standalone | Yuan & Zhao (2025), DOI: [10.3389/fnagi.2025.1522552](https://doi.org/10.3389/fnagi.2025.1522552) |
| **Parkinson's** | Reduced PAF, posterior alpha slowing, increased delta, reduced frontoparietal coherence | Predictive for PD dementia | — |
| **DLB** | Pronounced frequency shifting with lower dominant frequency (distinct from AD power changes) | Differential diagnosis potential | — |
| **Epilepsy** | Spike/seizure detection | Established (Class I/II) | Obeid & Picone (2016) |

---

## Adversarial EEG Attack Literature

Small but rapidly expanding field. Directly validates the NISS threat model.

### Adversarial Filtering Attacks
Bandpass/bandstop filters applied to EEG cause catastrophic BCI classification failure with negligible apparent signal change.

**Detection approach:** Monitor the acquisition pipeline's filter response for unauthorized modifications.

Meng et al. (2024). *Information Fusion*, 107:102316. [arXiv:2412.07231](https://arxiv.org/abs/2412.07231).

### "Professor X" Backdoor Attack
Frequency-domain spectral amplitude interpolation at specific electrodes and frequency ranges. Clean-label poisoning.

**Detection approach:** Per-channel PSD comparison against normative baseline; unexpected spectral peaks at non-physiological frequencies.

Liu et al. (2024). [arXiv:2409.20158](https://arxiv.org/abs/2409.20158).

### Time-Frequency Joint Attacks
Wavelet-domain perturbations imperceptible in time or frequency domain individually but detectable in joint TF representation.

**Detection approach:** Cross-domain consistency checks — time-domain amplitude + frequency-domain PSD + TF spectrogram should be mutually consistent for physiological signals.

Yi et al. (2024). ICME 2024. [arXiv:2403.10021](https://arxiv.org/abs/2403.10021).

### EVA-Net (Anomaly Detection via Normative Manifold)
Trains a normative aging manifold from healthy subjects and detects pathological deviation by measuring distance from it. Same architecture applied to baseline qEEG profiles could detect injected signals as normative deviations.

Zhang et al. (2025). [arXiv:2511.15393](https://arxiv.org/abs/2511.15393). Preprint.

---

## Security-Relevant Insights

### Metrics Most Sensitive to Injection

| Metric | Sensitivity | Why |
|--------|------------|-----|
| **Absolute power** | Highest | Direct injection adds power to specific bins — spikes outside normative range |
| **SampEn** | High | Injected signals are more regular/predictable than biological noise |
| **wPLI** | High | Single-source injection produces near-zero phase lag across all channels |
| **Coherence** | Medium-High | External injection maximally coherent across channels — pattern healthy brains don't produce |
| **Relative power** | Medium | Shifts if injection is broadband; less sensitive to narrow-band |
| **PAF** | Low (stability) | Only shifts if attacker targets 8-12 Hz band specifically |

### Volume Conduction as a Spoofing Surface
An attacker who understands volume conduction geometry could inject signals that appear plausibly coherent with expected topographic spread. Defense: use wPLI rather than raw coherence, since wPLI explicitly rejects zero-lag coupling.

### Normative Z-Score Thresholds for Neurowall
- Z > 3.5 in any single metric should trigger alert
- Use both absolute AND relative power — more sensitive than either alone
- Reference ISB-NormDB methodology for age/sex-matched baselines

---

## Standards & Guidelines

### BIDS-EEG (Brain Imaging Data Structure)
Standard format for EEG data sharing. Our Session Recorder export should follow this for MNE/EEGLAB interoperability.

- `electrodes.tsv` — physical positions
- `channels.tsv` — amplifier/ADC metadata
- `events.tsv` — event markers
- Distinction: electrodes (physical attachment) vs. channels (amplifier+ADC) — matters for signal integrity provenance

Pernet et al. (2019). *Scientific Data*, 6:103. DOI: [10.1038/s41597-019-0104-8](https://doi.org/10.1038/s41597-019-0104-8). PMID: 31239435.

### ACNS Clinical Guidelines
- **Established uses** (Class I/II): epilepsy screening, ICU frequency trending, dementia severity
- **Investigational** (Level U): mTBI diagnosis, standalone psychiatric diagnosis
- Our modules should never present qEEG-derived metrics as diagnostic — always "for threat modeling purposes"

Tenney et al. (2021). *J Clinical Neurophysiology*, 38(4):287-292. DOI: [10.1097/WNP.0000000000000853](https://doi.org/10.1097/WNP.0000000000000853). PMID: 34038930.

### ISNR Standards for Neurofeedback
19-channel full qEEG recommended for comprehensive assessment. Practitioner certification standards.

---

## Action Items

- [ ] Replace naive DFT with Welch PSD in NISS `computeFrequencyScore()`
- [ ] Add relative power alongside absolute power in NISS scoring
- [ ] Implement wPLI to replace cross-channel RMS variance as coherence metric
- [ ] Add Sample Entropy (SampEn) as 4th NISS component
- [ ] Add PAF detection to Brain Map module
- [ ] Add z-score display option (reference ISB-NormDB methodology)
- [ ] Export Session Recorder data in BIDS-EEG format
- [ ] Add TBR, FAA, DAR as optional display metrics in Spectrum Analyzer
- [ ] Investigate EVA-Net architecture for normative deviation detection in Neurowall
- [ ] Add adversarial attack detection rules to Neurowall based on literature patterns

---

## Clinical Pattern Identification Strategy

> How we map qEEG patterns back to make them usable for clinical-grade signal identification in our modules.

### The Problem
Our modules currently compute raw metrics (RMS, basic frequency power, simple coherence). Clinical qEEG goes further — it compares individual signals against population baselines, identifies condition-specific signatures, and flags deviations that correspond to known pathological or adversarial patterns.

### Step 1: Baseline Profiling
Before identifying anomalies, establish what "normal" looks like for each user session:

1. **Capture 2-minute resting baseline** (eyes open + eyes closed) at session start
2. **Compute per-channel metrics:** absolute power per band, relative power per band, PAF, SampEn
3. **Store as session baseline** in Session Recorder
4. **Compare against ISB-NormDB z-score methodology** (age/sex-matched GAM curves) when demographics are available

### Step 2: Pattern Library
Build a pattern library mapping signal signatures to known conditions. Each pattern entry includes:

```
{
  "pattern_id": "ADHD_TBR_ELEVATED",
  "condition": "ADHD",
  "metrics": {
    "tbr_cz": { "threshold": ">3.0", "band": "theta/beta at Cz" },
    "paf": { "threshold": "<9.0 Hz", "note": "slow PAF confound" }
  },
  "evidence_level": "investigational",
  "clinical_note": "Not standalone diagnostic. Stratification aid only.",
  "references": ["Arns2013", "NEBA_K112711"]
}
```

**Patterns to implement (in priority order):**
1. **Signal tampering** — absolute power z > 3.5, SampEn drop > 2 SD, wPLI anomaly (zero-lag injection)
2. **TBI acute** — delta/theta increase > 2 SD, alpha decrease > 2 SD, diffuse slowing
3. **Cognitive load** — alpha suppression, beta increase, frontal theta increase
4. **ADHD profile** — elevated TBR, slow PAF (with PAF confound flag)
5. **Depression markers** — FAA pattern, altered cordance, frontal theta
6. **Alzheimer's/MCI** — progressive SampEn decline, alpha coherence reduction, dominant frequency slowing

### Step 3: Real-Time Pattern Matching
In Signal Monitor and NISS, run pattern matching every scoring cycle:

1. Compute current metrics against session baseline
2. Compute z-scores where normative data is available
3. Match against pattern library
4. Display matched patterns with evidence level and confidence
5. **Never display as diagnosis** — always "pattern consistent with [condition] (for threat modeling purposes)"

### Step 4: Cross-Module Integration
- **NISS:** Pattern matches feed severity scoring. A signal that matches both "TBI acute" and "signal tampering" patterns gets higher severity than either alone
- **Neurowall:** Pattern matches trigger firewall rules. Injection patterns auto-escalate to block/alert
- **Brain Map:** Highlight electrodes involved in matched patterns with condition-specific color coding
- **Spectrum Analyzer:** Overlay expected band power ranges for matched condition on the spectrum display

---

## KQL Data Lake Integration Plan

> How qEEG metrics integrate with the existing KQL data lake architecture.

### Current State
The qinnovate KQL data lake (`src/lib/kql-tables.ts`) already has:
- `eeg_electrodes` — electrode positions and metadata
- `eeg_samples` — tagged sample datasets
- TARA techniques with NISS scores
- DSM-5 diagnostic category mappings

### New Tables Needed

#### `qeeg_metrics`
Per-session computed metrics for analysis and historical comparison.

```
| Column | Type | Description |
|--------|------|-------------|
| session_id | string | Links to session recorder |
| timestamp | datetime | Computation time |
| channel | string | Electrode name (10-20) |
| absolute_power_delta | number | µV²/Hz in 1-4 Hz |
| absolute_power_theta | number | µV²/Hz in 4-8 Hz |
| absolute_power_alpha | number | µV²/Hz in 8-12 Hz |
| absolute_power_beta | number | µV²/Hz in 12-30 Hz |
| absolute_power_gamma | number | µV²/Hz in 30-80 Hz |
| relative_power_delta | number | 0-1 proportion |
| relative_power_theta | number | 0-1 proportion |
| relative_power_alpha | number | 0-1 proportion |
| relative_power_beta | number | 0-1 proportion |
| relative_power_gamma | number | 0-1 proportion |
| paf | number | Peak alpha frequency (Hz) |
| sample_entropy | number | SampEn value |
| rms_amplitude | number | µV |
```

#### `qeeg_connectivity`
Cross-channel connectivity metrics.

```
| Column | Type | Description |
|--------|------|-------------|
| session_id | string | Links to session recorder |
| timestamp | datetime | Computation time |
| channel_a | string | First electrode |
| channel_b | string | Second electrode |
| coherence_alpha | number | Magnitude squared coherence in alpha band |
| wpli_alpha | number | Weighted phase lag index in alpha band |
| wpli_theta | number | wPLI in theta band |
| wpli_beta | number | wPLI in beta band |
| phase_lag | number | Mean phase difference (radians) |
```

#### `qeeg_patterns`
Pattern library for condition identification.

```
| Column | Type | Description |
|--------|------|-------------|
| pattern_id | string | Unique identifier |
| condition | string | Clinical condition or threat type |
| category | string | clinical | security | cognitive_state |
| metric_rules | string | JSON rules for pattern matching |
| evidence_level | string | established | investigational | research |
| sensitivity_to_injection | string | high | medium | low |
| references | string | Citation keys |
| clinical_note | string | Mandatory qualifier for display |
```

#### `qeeg_zscore_norms`
Normative reference data (derived from ISB-NormDB methodology).

```
| Column | Type | Description |
|--------|------|-------------|
| age_years | number | Age in years |
| sex | string | M | F |
| channel | string | Electrode name |
| metric | string | Which metric this norm applies to |
| mean | number | Population mean |
| sd | number | Population standard deviation |
| condition | string | eyes_open | eyes_closed |
```

### KQL Query Examples

**Find sessions with potential injection signatures:**
```kql
qeeg_metrics
| where sample_entropy < 0.3
| where absolute_power_alpha > 500
| join kind=inner (qeeg_connectivity | where wpli_alpha < 0.05) on session_id, timestamp
| project session_id, timestamp, channel, sample_entropy, absolute_power_alpha
| order by timestamp desc
```

**Compute z-scores against norms:**
```kql
qeeg_metrics
| join kind=inner qeeg_zscore_norms on channel
| extend z_alpha = (absolute_power_alpha - mean) / sd
| where abs(z_alpha) > 3.5
| project session_id, channel, z_alpha, absolute_power_alpha
```

**Match ADHD pattern:**
```kql
qeeg_metrics
| where channel == "Cz"
| extend tbr = absolute_power_theta / absolute_power_beta
| where tbr > 3.0 and paf < 9.0
| project session_id, timestamp, tbr, paf
```

### Tagging & Analysis Pipeline

Every EEG recording session gets tagged with computed qEEG features:

1. **Ingestion:** Raw EEG recorded in Session Recorder
2. **Compute:** Run qEEG metric extraction (PSD, connectivity, entropy) post-session
3. **Tag:** Auto-tag session with matched patterns from pattern library
4. **Store:** Insert rows into `qeeg_metrics`, `qeeg_connectivity` tables
5. **Query:** All modules can KQL-query the computed data for analysis, comparison, trending
6. **Export:** BIDS-EEG format for external tool compatibility (MNE, EEGLAB)

### Integration with Existing TARA Data

Each TARA technique already has a NISS score. The qEEG integration adds a new dimension — **expected signal signature per technique:**

```kql
tara_techniques
| join kind=inner qeeg_patterns on $left.technique_id == $right.pattern_id
| project technique_id, name, niss_score, pattern_id, metric_rules, sensitivity_to_injection
```

This lets Neurowall detect not just "something is wrong" but "this looks like TARA technique T-AMP-001 (amplitude injection)" based on the signal signature.

---

## Future Work & Whitepaper Connection

> How this qEEG integration connects to the QIF whitepaper roadmap.

### Connection to Whitepaper Section 11 ("What's Next")

The whitepaper's NISS v2.0 roadmap calls for "five new weighting factors (reversibility severity, functional impact domains, pathway specificity, clinical evidence strength, modality criticality)" and "extended clinical outcome mapping." qEEG integration directly enables this:

| Whitepaper Roadmap Item | qEEG Contribution |
|-------------------------|-------------------|
| **NISS v2.0 weighting factors** | qEEG metrics provide the signal-level evidence for each factor. Clinical evidence strength can be derived from the evidence_level field in the pattern library. Pathway specificity maps to which electrodes/channels are affected |
| **Extended clinical outcome mapping** | The clinical patterns reference table maps qEEG signatures to conditions with evidence levels. This is the data source for clinical outcome mapping — not clinical claims, but threat modeling categories |
| **Calibrate weights via expert elicitation** | qEEG normative databases (ISB-NormDB) provide population-level statistical baselines against which NISS weights can be calibrated. Z-score deviations give a principled basis for severity thresholds |
| **NSP reference implementation** | NSP Layer 3 (Filter) and Layer 4 (Features) map directly to qEEG computations. Welch PSD, wPLI, SampEn are the feature extraction methods NSP would standardize |
| **Runemate protocol inspection** | Runemate's pipeline stages (Raw ADC > Transport > Filter > Features > Classification > App) correspond to the qEEG processing chain. Each stage can be inspected with qEEG-standard metrics |

### Connection to Whitepaper Section 12 (Limitations)

The whitepaper acknowledges "no empirical validation on real BCI devices." qEEG integration addresses this gap:

1. **Open datasets exist** — TUH EEG Corpus (16,986 sessions) provides real clinical EEG data for validation, even without hardware access
2. **Normative baselines exist** — ISB-NormDB's 1,289-subject database gives statistical grounding to NISS thresholds that are currently arbitrary
3. **The adversarial attack literature exists** — published attacks on EEG-based BCIs validate the threat model with reproducible results

### Proposed Whitepaper Addition

Add a subsection to Section 11 (or a new Section 11.5):

> **11.x qEEG Integration**
>
> NISS scoring currently uses signal-level metrics computed from first principles. The quantitative EEG (qEEG) field provides decades of validated methods for the same computations — spectral analysis, connectivity metrics, normative comparison — plus open-access normative databases and standardized data formats (BIDS-EEG). QIF's next phase integrates established qEEG methodology into NISS, Neurowall, and the Demo Atlas:
>
> - Replace naive DFT with Welch PSD and multitaper methods (standard in MNE-Python, EEGLAB)
> - Adopt wPLI (weighted Phase Lag Index) as the primary connectivity metric, replacing cross-channel RMS variance — wPLI is inherently resistant to volume conduction artifacts, making it more suitable for distinguishing biological signals from injected signals
> - Add Sample Entropy (SampEn) as a NISS component — injected signals produce measurably lower entropy than biological neural noise
> - Reference ISB-NormDB z-score methodology for age/sex-matched baseline comparison
> - Build a pattern library mapping TARA techniques to expected qEEG signatures, enabling Neurowall to identify specific attack types by their signal fingerprint
> - Export session data in BIDS-EEG format for interoperability with MNE-Python, EEGLAB, and the broader neuroscience tool ecosystem
>
> The adversarial EEG attack literature (Meng et al. 2024, Liu et al. 2024, Yi et al. 2024) validates NISS's threat model: small-amplitude signal perturbations can cause catastrophic BCI classification failures while remaining visually imperceptible. qEEG metrics — particularly SampEn and wPLI — detect these perturbations where visual inspection and simple amplitude thresholds cannot.

### Open Questions for Future Research
1. **Can ISB-NormDB z-scores serve as NISS severity thresholds?** If a signal deviates >3.5 SD from age/sex norms, is that sufficient to flag as "high" severity? Needs validation against known attack signatures
2. **Does SampEn reliably distinguish biological artifacts from adversarial injection?** Muscle artifacts also produce low entropy — how to differentiate?
3. **Can EVA-Net's normative manifold architecture be adapted for real-time Neurowall detection?** Current EVA-Net is offline/batch — needs streaming adaptation
4. **What's the minimum electrode count for reliable qEEG pattern matching?** Consumer devices have 4-8 channels vs. clinical 19-channel. Which patterns survive downsampling?
5. **How do qEEG metrics behave under the specific TARA techniques?** No published study has measured SampEn/wPLI/PAF changes under each TARA attack category. This is a gap we can fill with synthetic data in the Demo Atlas

---

## References

1. Gramfort A et al. (2013). MEG and EEG data analysis with MNE-Python. *Frontiers in Neuroscience*, 7:267. DOI: [10.3389/fnins.2013.00267](https://doi.org/10.3389/fnins.2013.00267). PMID: 24431986.
2. Gramfort A et al. (2014). MNE software for processing MEG and EEG data. *NeuroImage*, 86:446-460. DOI: [10.1016/j.neuroimage.2013.10.027](https://doi.org/10.1016/j.neuroimage.2013.10.027). PMID: 24161808.
3. Delorme A & Makeig S (2004). EEGLAB: an open source toolbox for analysis of single-trial EEG dynamics. *J Neuroscience Methods*, 134(1):9-21. DOI: [10.1016/j.jneumeth.2003.10.009](https://doi.org/10.1016/j.jneumeth.2003.10.009). PMID: 15102499.
4. Pernet CR et al. (2019). EEG-BIDS, an extension to the brain imaging data structure for EEG. *Scientific Data*, 6:103. DOI: [10.1038/s41597-019-0104-8](https://doi.org/10.1038/s41597-019-0104-8). PMID: 31239435.
5. Ko J et al. (2021). Quantitative Electroencephalogram Standardization: A Sex- and Age-Differentiated Normative Database. *Frontiers in Neuroscience*, 15:766781. DOI: [10.3389/fnins.2021.766781](https://doi.org/10.3389/fnins.2021.766781).
6. Obeid I & Picone J (2016). The Temple University Hospital EEG Data Corpus. *Frontiers in Neuroscience*, 10:196. DOI: [10.3389/fnins.2016.00196](https://doi.org/10.3389/fnins.2016.00196).
7. Tenney JR et al. (2021). Practice Guideline: Use of Quantitative EEG for the Diagnosis of Mild Traumatic Brain Injury. *J Clinical Neurophysiology*, 38(4):287-292. DOI: [10.1097/WNP.0000000000000853](https://doi.org/10.1097/WNP.0000000000000853). PMID: 34038930.
8. Popa LL et al. (2020). The Role of Quantitative EEG in the Diagnosis of Neuropsychiatric Disorders. *J Medicine and Life*, 13(1):8-15. DOI: [10.25122/jml-2019-0085](https://doi.org/10.25122/jml-2019-0085). PMID: 32341694.
9. Yuan Y & Zhao Y (2025). The role of quantitative EEG biomarkers in Alzheimer's disease and mild cognitive impairment. *Frontiers in Aging Neuroscience*, 17:1522552. DOI: [10.3389/fnagi.2025.1522552](https://doi.org/10.3389/fnagi.2025.1522552).
10. Arns M et al. (2013). A Decade of EEG Theta/Beta Ratio Research in ADHD. *J Attention Disorders*, 17(5):374-383. DOI: [10.1177/1087054712460087](https://doi.org/10.1177/1087054712460087). PMID: 23086632.
11. Vinck M et al. (2011). An improved index of phase-synchronization for electrophysiological data. *NeuroImage*, 55(4):1548-1565. DOI: [10.1016/j.neuroimage.2011.01.055](https://doi.org/10.1016/j.neuroimage.2011.01.055). PMID: 21276857.
12. Meng L et al. (2024). Adversarial Filtering Based Evasion and Backdoor Attacks to EEG-Based BCIs. *Information Fusion*, 107:102316. [arXiv:2412.07231](https://arxiv.org/abs/2412.07231).
13. Liu X-H et al. (2024). Professor X: Manipulating EEG BCI with Invisible and Robust Backdoor Attack. [arXiv:2409.20158](https://arxiv.org/abs/2409.20158).
14. Yi H et al. (2024). Time-Frequency Jointed Imperceptible Adversarial Attack to Brainprint Recognition. ICME 2024. [arXiv:2403.10021](https://arxiv.org/abs/2403.10021).
15. Zhang K et al. (2025). EVA-Net: Interpretable Anomaly Detection for Brain Health. [arXiv:2511.15393](https://arxiv.org/abs/2511.15393). Preprint.
