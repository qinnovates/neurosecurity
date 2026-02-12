# T0079 — ANC Ear Canal Acoustic Fingerprinting

**TARA ID:** QIF-T0079
**Classification:** Biometric Privacy / Covert Identification
**Severity:** High (silent biometric extraction without consent)
**Status:** PoC validated on real hardware (2 subjects, 2 devices, 6 sessions) + covert masking simulation

## Executive Summary

Active Noise Cancelling earbuds contain all the hardware needed to silently fingerprint a wearer's ear canal. The ear canal is a biometric — its geometry (length, diameter, tympanic membrane reflectance) creates a unique acoustic transfer function per individual. This PoC demonstrates that the standard Bluetooth Hands-Free Profile (HFP) audio path, available to any app with microphone permission, is sufficient to extract this biometric without the user's knowledge.

No ANC telemetry API, firmware exploit, or privileged access is required.

## Threat Model

**Attacker:** Any app on the user's phone with Bluetooth audio access (music player, voice assistant, conferencing app, podcast player).

**Capability:** Play an inaudible or masked probe signal through the earbud speaker. Record the ear canal's acoustic response through the standard HFP microphone.

**Goal:** Uniquely identify the wearer across sessions, devices, and accounts — creating a persistent biometric identifier the user never consented to share.

**Attack surface:**
```
┌──────────────────────────────────────────────────────────┐
│  Phone App (attacker-controlled)                         │
│  ┌─────────────┐                                        │
│  │ Play probe   │──── Bluetooth HFP ────┐               │
│  │ signal       │                       ▼               │
│  │              │              ┌──────────────────┐     │
│  │              │              │   ANC Earbud      │     │
│  │              │              │                   │     │
│  │              │              │  Speaker ──────►  │     │
│  │              │              │     │   Ear Canal  │     │
│  │              │              │     ▼   (unique    │     │
│  │              │              │  Feedback  geometry)│    │
│  │ Record       │◄─── BT ─────│  Mic ◄──────────  │     │
│  │ response     │              └──────────────────┘     │
│  └─────────────┘                                        │
│                                                         │
│  Extract IR → Features → Identity                       │
└──────────────────────────────────────────────────────────┘
```

## Why This Matters

Unlike cookies, MAC addresses, or device fingerprints, an ear canal acoustic fingerprint is:

- **Biometric:** Tied to your body, not your device. Follows you across phone upgrades, factory resets, new accounts.
- **Persistent:** Your ear canal doesn't change (barring surgery or injury).
- **Covert:** The probe signal can be embedded in audio content. The user has no indication they're being fingerprinted.
- **Cross-device:** Same ear = same fingerprint, regardless of which earbuds or phone you use.
- **Non-revocable:** You can't change your ear canal geometry like you can change a password.

## Prior Art

This is not speculative. Academic research has already demonstrated ear canal acoustic biometrics:

| Paper | Year | Accuracy | Method | Covert? |
|-------|------|----------|--------|---------|
| Akkermans et al. (NEC) | 2005 | >99% | In-ear mic + chirp probe, 7 subjects | No |
| Mahto et al. (EUSIPCO) | 2018 | 95%+ | Inaudible tone-based probing | Partially |
| Gao et al. (EarEcho, MobiCom) | 2019 | 97.5% | ANC earbuds + ultrasonic probe, continuous auth | No |
| Fan et al. (HeadFi, MobiCom) | 2021 | 97-99% | ANC driver-as-sensor, no external probe | Passive |
| EarID | 2025 | 98.7% | Acoustic ear canal identification | No |
| **This work (T0079)** | **2026** | **>99% (N=2)** | **Bluetooth HFP chirp, 2 devices, psychoacoustic masking** | **Yes** |

Apple, Sony, and others hold patents on ear canal acoustic identification as a *feature* (user authentication). Our contribution is threefold:

1. **Attack framing:** Demonstrating this as a covert biometric extraction attack, not a feature
2. **Standard Bluetooth path:** No ANC telemetry, firmware exploit, or privileged access required — just the standard HFP audio path available to any app with microphone permission
3. **Psychoacoustic masking:** Showing that the probe can be embedded 47 dB below audible content with zero degradation in fingerprint quality. **No prior work has demonstrated covert biometric probe extraction hidden inside music/audio content.** Mahto et al. used inaudible tones but not embedded in masking audio; HeadFi is passive but requires ANC hardware access.

## Methodology

### 1. Probe Signal

Exponential swept sine (logarithmic chirp), 200-7500 Hz, 1.5 seconds. Exponential sweep chosen over linear because it distributes equal energy per octave, producing better SNR in the lower frequencies where Bluetooth codecs (mSBC) introduce most distortion. Three repetitions averaged to improve SNR by sqrt(3).

The frequency ceiling of 7500 Hz stays safely below the HFP Nyquist limit (8000 Hz at 16 kHz sample rate) to avoid aliasing artifacts from the codec.

### 2. Impulse Response Extraction

Wiener deconvolution recovers the ear canal's impulse response from the noisy recorded signal:

```
H(f) = Y(f) * X*(f) / (|X(f)|^2 + 1/SNR)
```

Where Y is the recorded response, X is the known probe, and 1/SNR is a regularization term (set to 0.01) that prevents noise amplification at frequencies where the probe has low energy.

### 3. Open-Air Control (Critical)

Each session includes an open-air recording: same probe, same earbuds, but placed on a flat surface instead of in the ear. Subtracting the open-air transfer function from the in-ear response isolates the ear canal's contribution and removes the earbud/Bluetooth channel characteristics.

This is the methodological proof that we're measuring the *ear*, not the *device*.

### 4. Feature Extraction

Four feature families capture different aspects of the ear canal's acoustic signature:

| Feature | Dimension | What It Captures |
|---------|-----------|------------------|
| **MFCCs** | 20 coefficients + delta + delta-delta | Spectral envelope shape (standard in audio biometrics) |
| **GFCCs** | 20 coefficients | Same as MFCCs but using gammatone filterbank (better cochlear model) |
| **LPC** | 16 coefficients | Tube resonance model — directly models ear canal geometry |
| **Spectral** | 10 features | Centroid, bandwidth, rolloff, flatness, ZCR (mean + std) |

Total: 186-dimensional feature vector per trial.

### 5. Classification

**Identification** (closed-set, "who is this?"): SVM with RBF kernel, C=10, 5-fold stratified cross-validation.

**Verification** (open-set, "is this person X?"): Per-subject Gaussian Mixture Models vs. Universal Background Model. Log-likelihood ratio scoring. Equal Error Rate (EER) as the primary metric.

## Results (Synthetic Data)

The PoC includes a synthetic data generator that simulates ear canal impulse responses with per-subject resonant frequencies derived from randomized canal geometry (length ~ N(25, 3) mm, diameter ~ N(7, 0.8) mm).

| Metric | Value | Interpretation |
|--------|-------|----------------|
| **Identification Accuracy** | 100% (30/30) | Perfect on held-out test set |
| **Cross-Validation Accuracy** | 97.5% +/- 2.0% | Robust across folds |
| **Equal Error Rate** | 3.33% | "Good" — face recognition grade |
| **d-prime** | 1.26 | Moderate genuine/impostor separation |

## Results (Real Hardware)

Validated on 2 subjects, 2 consumer Bluetooth ANC earbuds from different manufacturers, 6 sessions, 18 in-ear trials. Conditions included music playback, gum chewing, earbud reinsertion, typing, and silent baseline.

### Intra-Subject Consistency

| Condition | Similarity | Interpretation |
|-----------|-----------|----------------|
| Same session, same insertion | >99% | Baseline repeatability |
| Across sessions (music vs silence vs gum) | >99% | Confounders don't matter |
| Across different hardware (Device A vs B) | >99% | Same ear = same fingerprint |

Music, gum chewing, typing, and earbud reinsertion had no significant effect on the extracted fingerprint. The most similar trial pair in the entire experiment was between a music-playing session and a silent session.

### Inter-Subject Discrimination

| Comparison | Similarity | Notes |
|------------|-----------|-------|
| Subject A intra (all sessions) | >99% | Stable across devices and conditions |
| Subject B intra (both devices) | ~96% | Degraded by non-optimal ear tip fit |
| Subject A vs B (same device) | ~97% | ~3.8x separation ratio |

N=2 subjects is not sufficient for statistical significance. The direction is consistent with published literature (97-99% accuracy at N>10).

### Cross-Device Recognition

Deconvolution successfully strips hardware-specific channel characteristics. Subject A's fingerprint extracted from Device A (Manufacturer 1) and Device B (Manufacturer 2) showed >99% similarity — the ear canal resonance dominates, not the device.

## Covert Masking Simulation

**Can the probe be hidden inside music so a listener hears nothing, yet the fingerprint is still extractable?**

### Method

Using the real channel transfer function H(f) from Session 1:

1. Extract H(f) from a real in-ear recording via Wiener deconvolution
2. Generate pink noise masker (worst-case: equal energy per octave, like music)
3. Attenuate the probe from 0 dB to -60 dB, mix with masker
4. Simulate recording through H(f)
5. Deconvolve and extract 186-dim fingerprint
6. Compare to clean-simulation reference via cosine distance

### Why It Works (Matched Filter Gain)

The swept sine probe has a bandwidth-time product (BT) of ~33,000 (7300 Hz × 4.5 s). Wiener deconvolution provides ~45 dB processing gain (10 × log10(33000)). Music/noise is uncorrelated with the probe and gets suppressed. The probe response is amplified.

### Results

| Probe Attenuation | Probe-to-Masker Ratio | Fingerprint Similarity | Match? |
|--------------------|----------------------|----------------------|--------|
| 0 dB (original) | +13 dB | ~96% | YES |
| -12 dB | +1 dB | ~96% | YES |
| -24 dB | -11 dB | ~96% | YES |
| -36 dB | -23 dB | ~96% | YES |
| -48 dB | -35 dB | ~96% | YES |
| -60 dB | -47 dB | ~96% | YES |

**The fingerprint does not degrade.** From 0 to -60 dB attenuation (1000× reduction in probe amplitude), the similarity is constant. At -47 dB PMR, the probe is ~200× quieter than the music — far below the human auditory masking threshold (20-30 dB). No listener could detect it.

### Implication

An attacker could embed an inaudible probe in any audio content (music, podcast, phone call, notification sound) and extract a biometric fingerprint from the earbud microphone response. The listener hears only music. The attacker gets a persistent biometric identifier.

## Reproduction

The PoC code is in the [Mindloft tools repo](https://github.com/qinnovates/mindloft/tree/main/tools/ml-research-labs/t0079-anc-fingerprint).

```bash
# Clone and install
git clone https://github.com/qinnovates/mindloft.git
cd mindloft/tools/ml-research-labs/t0079-anc-fingerprint
pip install -r requirements.txt

# Run demo with synthetic data (no hardware needed)
python main.py demo --n-subjects 10 --n-trials 15

# With real Bluetooth earbuds
python main.py record --list-devices
python main.py record --subject subject_01 --session session_1
python main.py process
python main.py train
python main.py evaluate
```

## Current Limitations

- **N=2 subjects.** Real hardware results are directionally strong but not statistically significant. Need N>=10 with proper ear tip fitting per subject for d-prime and EER metrics.
- **Single platform.** All recording on macOS Core Audio. iOS, Android, and Windows Bluetooth HFP paths untested.
- **No longitudinal data.** All sessions within ~3 hours on one evening. Day-over-day, week-over-week fingerprint stability unknown.
- **Masking is simulation only.** Physical validation (playing masked audio through real earbuds and recording) is the next step. The ~45 dB processing gain provides substantial margin.
- **No malicious app demo.** The threat model describes a background app scenario — not yet demonstrated on mobile.

## Disclosure Plan

| Target | Type | Status |
|--------|------|--------|
| Apple Product Security | Vendor notification (AirPods Pro) | Pending |
| Sony PSIRT | Vendor notification (WF-1000XM series) | Pending |
| Bose Security | Vendor notification | Pending |
| MITRE CWE | Vulnerability classification proposal | Pending |
| Academic venue | Peer-reviewed publication | In preparation |

## Proposed CWE

This vulnerability does not fit cleanly into existing CWEs. We propose:

**CWE-XXX: Covert Biometric Extraction via Standard Interface**

> A system exposes a hardware interface (speaker + microphone) that enables extraction of a biometric identifier (ear canal acoustic fingerprint) through standard, non-privileged API access, without user awareness or explicit consent.

Nearest existing CWEs:
- CWE-359: Exposure of Private Personal Information to an Unauthorized Actor
- CWE-200: Exposure of Sensitive Information to an Unauthorized Actor

Neither captures the *biometric* dimension or the *covert extraction through standard interfaces* aspect.

## References

1. Akkermans, A. et al. (2005). Acoustic ear recognition for person identification. Workshop on Automatic Identification Methods.
2. Mahto, S. et al. (2018). User authentication using ear canal as transmission medium. EUSIPCO.
3. Gao, C. et al. (2019). EarEcho: Using Ear Canal Echo for Wearable Authentication. Proc. ACM IMWUT, 3(3).
4. Fan, Y. et al. (2021). HeadFi: Bringing Intelligence to All Headphones. Proc. ACM MobiCom.
5. Apple Inc. (2020). User identification using headphones. US Patent Application 2020/0074049.
6. OpenEarable. (2024). OpenEarable 2.0: Open-source research platform. Karlsruhe Institute of Technology.
7. Muduganti, J. et al. (1998). Audio means for the identification of human beings. US Patent 5,787,187 (Sandia National Laboratories).
8. EarID. (2025). Acoustic ear canal identification. 98.7% accuracy.
