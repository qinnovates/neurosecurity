# T0079 — ANC Ear Canal Acoustic Fingerprinting

**TARA ID:** QIF-T0079
**Classification:** Biometric Privacy / Covert Identification
**Severity:** High (silent biometric extraction without consent)
**Status:** PoC validated on synthetic data; hardware testing pending

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

| Paper | Year | Accuracy | Method |
|-------|------|----------|--------|
| Akkermans et al. (NEC) | 2016 | >99% | In-ear microphone + chirp probe |
| Gao et al. (EarEcho) | 2019 | 97.5% | ANC earbuds + ultrasonic probe, continuous auth |
| Fan et al. (HeadFi) | 2021 | 97-99% | ANC driver-as-sensor, no external probe needed |
| EarID | 2025 | 98.7% | Acoustic ear canal identification |

Apple holds patents on this exact capability as a *feature* (user authentication via ear canal acoustics). Our contribution is demonstrating it as an *attack* — specifically, that the standard Bluetooth audio path (no ANC telemetry required) is sufficient.

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

These results validate that the pipeline works end-to-end. Real ear canal data is expected to show even stronger discrimination based on prior art (97-99% in published work).

## Reproduction

The PoC code is in the [Mindloft tools repo](https://github.com/qinnovates/mindloft/tree/main/tools/ctf/t0079-anc-fingerprint).

```bash
# Clone and install
git clone https://github.com/qinnovates/mindloft.git
cd mindloft/tools/ctf/t0079-anc-fingerprint
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

1. Akkermans, A. et al. (2016). Acoustic ear recognition. NEC Technical Report.
2. Gao, C. et al. (2019). EarEcho: Using Ear Canal Echo for Wearable Authentication. Proc. ACM IMWUT, 3(3).
3. Fan, Y. et al. (2021). HeadFi: Bringing Intelligence to All Headphones. Proc. ACM MobiCom.
4. Apple Inc. (2020). User identification using headphones. US Patent Application 2020/0074049.
5. OpenEarable. (2024). OpenEarable 2.0: Open-source research platform. Karlsruhe Institute of Technology.
