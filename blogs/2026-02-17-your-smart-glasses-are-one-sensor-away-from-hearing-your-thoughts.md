---
title: "Your Smart Glasses Are One Sensor Away From Hearing Your Thoughts"
subtitle: "How a $38 muscle sensor turns consumer smart glasses into a subvocal surveillance device — and why no security framework models the threat"
date_posted: "2026-02-17"
author: "Kevin L. Qi"
source: "https://qinnovate.com"
tags: ["#TARA", "#NeurosecurityEngineering", "#QIF", "#BCI", "#Subvocalization", "#SmartGlasses", "#SmartGlasses", "#SilentSpeech", "#ConsumerSensors", "#SDomain"]
---

## From Headphones to Smart Glasses

Two weeks ago, we published ["How Malicious Apps Derive Your Personal Biometrics — No Health Sensor Required"](https://qinnovate.com/blog/2026-02-11-how-malicious-apps-derive-your-personal-biometrics), documenting 28 ways consumer sensors extract biometric data without dedicated health hardware. The capstone finding was the acoustic-to-neural profiling pipeline (T0095): a pair of earbuds, repurposed step by step, from speaker to microphone to ear-canal fingerprint to in-ear EEG recorder to personalized cognitive profile.

That post ended with a warning: the S-domain — consumer sensor exploitation — is not a separate problem from BCI security. It is the reconnaissance phase.

This post is the next link in that chain. We followed the attack surface from earbuds to smart glasses, and what we found is worse than we expected. Not because smart glasses are more dangerous than earbuds — but because the gap between what they can do today and what they will do next year is exactly one off-the-shelf sensor.

## The Subvocalization Problem

You are subvocalizing right now.

As you read this sentence, the muscles in your jaw, tongue, and throat are making micro-movements — imperceptible contractions that mirror the words your inner voice is "saying." This is subvocalization: silent, internal articulation of speech. It is involuntary for most people. It happens during reading, mental math, composing messages, rehearsing conversations, and thinking in words.

Subvocalization generates two kinds of signals:

1. **Electromyographic (EMG) signals** — electrical activity in the speech muscles (jaw, larynx, submental, buccal). These signals are 8–20 microvolts RMS, detectable with skin-contact electrodes.
2. **Acoustic micro-vibrations** — faint mechanical signals conducted through bone and soft tissue. These are weaker, but present.

If you can detect these signals, you can read what someone is silently saying to themselves.

## MIT Already Did It

In 2018, MIT's Media Lab published AlterEgo — a wearable device that detects subvocalization with 92% accuracy. The system uses seven gold-plated electrodes positioned on the jaw and face, capturing EMG signals at 250 Hz. A dual-CNN pipeline first detects windows containing subvocal activity, then classifies the word content.

The work was published, patented ([US10878818B2](https://patents.google.com/patent/US10878818B2/en)), and demonstrated live. AlterEgo's user controlled IoT devices, played chess, and sent messages — all without speaking or moving visibly. The patent was granted in December 2020 and assigned to AlterEgo AI, Inc. and MIT. It expires in 2038.

AlterEgo was presented as assistive technology. Nobody framed it as a threat.

## Google Confirmed the Glasses Form Factor

In August 2023, A major tech company published a [defensive technical disclosure](https://www.tdcommons.org/dpubs_series/6205/) titled "Multimodal Sensing for Subvocal Speech Recognition for Silent Speech Interfaces in Future AR Glasses."

The disclosure describes exactly what it sounds like: using sensors distributed across AR glasses and earbuds to detect and decode subvocal speech. The architecture combines three signal types:

- **EMG** from facial/temple contact points on the glasses
- **EEG** from in-ear electrodes in the hearables
- **Microphone** audio as a third fusion channel

The signals are fused using ML/DL models to reproduce speech from subvocal input. The disclosure describes three configurations: glasses alone, hearables alone, or both combined for maximum accuracy.

This is a *defensive publication* — Google published it to prevent others from patenting the concept, while preserving their own right to build it. They are telling the industry: subvocal detection through smart glasses is coming.

Meanwhile, a major tech company acquired an EMG wristband startup in 2019 for approximately $500 million to $1 billion. The startup built an EMG wristband that reads motor intent at single-motor-unit resolution. The acquirer shipped it as a commercial neural wristband in 2025, paired with their consumer smart glasses. Published research in *Nature* (July 2025) demonstrated single-finger decoding from wrist EMG.

Meta chose the wrist. the published disclosure points to the face. Both confirm: consumer companies are building subvocal detection into wearables. The question is not *if* but *when*.

## Three Research Threads That Have Never Been Connected

We found three independent lines of published research that, together, define a threat class no existing framework models:

**Thread 1 — Subvocal Detection.** AlterEgo (Kapur et al., 2018), SilentSpeller (Kimura et al., 2019), and multiple 2024–2025 papers demonstrate that EMG electrodes on the face and jaw can decode silently articulated words with high accuracy. The field is mature. The sensors are small. The ML pipelines work.

**Thread 2 — Headphone and Earbud Side-Channels.** EarSpy (Gao et al., 2023) showed that smartphone accelerometers can reconstruct speech from earbud vibrations during calls. WhisperPair demonstrated bilateral earbud acoustic analysis. Our own S-domain registry (T0072–T0096) documents 28 consumer sensor exploitation techniques, including repurposing speakers as microphones and ear-canal acoustic fingerprinting. Multiple CVEs in Bluetooth chipsets used in major earbud brands were disclosed in 2024–2025.

**Thread 3 — BCI Security and Neural Privacy.** The QIF framework maps 103 attack techniques across 11 neural-to-silicon bands. TARA scores each for both traditional severity (CVSS) and neural impact (NISS). Neurorights frameworks (Yuste et al., 2017) define mental privacy, cognitive liberty, and psychological continuity as rights. But none of these frameworks model the threat of subvocal extraction through consumer wearables.

**The gap:** Nobody has connected these three threads. The subvocal detection researchers are building assistive technology. The side-channel researchers are studying acoustic and motion leakage. The BCI security researchers are focused on implanted devices. Nobody is asking: *what happens when consumer smart glasses gain the sensor resolution to decode what you're thinking?*

That is the question TARA is designed to answer.

## The Delta

Here is what the published disclosure says you need versus what consumer smart glasses ship today:

| Channel | Published Architecture | Consumer Smart Glasses (~$300) | Gap |
|---------|----------------------|--------------------|----|
| Acoustic (mics) | Yes, fused | 5 microphones | Covered |
| EMG (muscle) | Temple + jaw electrodes | None | **Missing** |
| EEG (brain) | In-ear via hearables | None | **Missing** |
| IMU (motion) | Accelerometer/gyro | Wear-detection sensor | Partial |
| Bone conduction output | Yes | No (open-ear speakers) | **Missing** |

Current consumer smart glasses have one of the three sensing modalities Google describes. The microphones are air-coupled, optimized for voice commands — not the micro-vibrations of subvocalization. The glasses have no skin-contact electrodes, no EMG, no EEG.

With stock hardware, the probability of detecting subvocalization from the stock smart glasses microphones alone is low. The signals are likely too quiet for air-coupled MEMS mics to capture without direct tissue contact.

But here is the problem: the delta is cheap.

## The Attacker's Augmentation Kit

An attacker who wants to replicate the full multimodal architecture described in the disclosure can do it with consumer parts:

### Tier 1 — $15 (Jaw EMG Only)

- 3x Ag/AgCl adhesive electrode pads ($6 for a 30-pack)
- 1x AD8226 instrumentation amplifier breakout ($5)
- 1x Arduino Nano ($4)

Two electrodes on the jaw, one ground on the earlobe. Wire runs behind the ear, under hair, to a microcontroller in a collar or pocket. This is AlterEgo stripped to the minimum viable sensor. Combined with the glasses' microphone audio via timestamp synchronization, an attacker now has two channels where the victim has none.

### Tier 2 — $130 (Wireless EMG)

- [MyoWare 2.0 Muscle Sensor](https://www.sparkfun.com/products/21265) with wireless shield ($130)
- Snap-on electrode pads, BLE streaming to phone
- No visible wires — sensor patch hides under a collar, mask, or bandage

The phone app records the EMG stream synchronized with glasses audio. The attacker wears the sensor. The victim sees normal glasses.

### Tier 3 — $350+ (Full Google Stack)

- consumer smart glasses (~$300) — acoustic + IMU
- MyoWare 2.0 wireless ($130) — jaw EMG
- [IDUN Guardian earbuds](https://iduntechnologies.com/idun-guardian) (~$250) — in-ear EEG with jaw clench detection

All three stream to a phone simultaneously. This replicates every channel in the published disclosure using hardware available today from consumer retailers. No custom fabrication. No lab equipment. No soldering.

Total cost to replicate a patented subvocal detection architecture: under $700.

## Why This Is a TARA Problem, Not a MITRE Problem

Try to express this threat in MITRE ATT&CK. You can't.

MITRE ATT&CK describes adversary behavior against enterprise IT systems. Its tactics (Reconnaissance, Initial Access, Collection, Exfiltration) assume a target that is a computer, a network, or an application. The "Collection" tactic includes "Audio Capture" (T1123) — recording through a microphone. But T1123 describes capturing ambient speech from a compromised device. It does not describe:

- Capturing *subvocal* signals that the target is not audibly producing
- Using *EMG electrodes* as the collection mechanism
- Fusing multiple biometric modalities to reconstruct *internal cognitive content*
- The clinical impact of someone's inner monologue being exfiltrated

Now try DSM-5. The closest diagnostic category might be something under anxiety or paranoia — but DSM-5 describes conditions, not adversarial causation. It cannot express "this patient's anxiety disorder was caused by an attacker who decoded their subvocalization for six months."

TARA can express all of it:

- **QIF Band:** N2 (peripheral nerve — muscle activation) → N3 (subcortical — motor planning) → N7 (neocortex — linguistic content)
- **Attack type:** Cross-band escalation via EMG side-channel
- **NISS dimensions:** Persistence (continuous monitoring), Reversibility (biometric data is permanent), Consent (none), Cognitive Impact (violation of inner speech)
- **Neurorights violated:** Mental Privacy, Cognitive Liberty
- **Dual-use identity:** The same EMG detection enables assistive silent speech interfaces for ALS patients — identical sensor, identical ML pipeline, opposite intent

This is what makes TARA a third taxonomy, not a translation layer. MITRE ATT&CK cannot express clinical harm as an impact category. DSM-5 cannot express adversarial causation as an etiology. TARA occupies the space between them: *how you attack minds through systems*.

## The HNDL Problem

There is a temporal dimension that makes this worse.

Harvest Now, Decrypt Later (HNDL) is a known problem in cryptography: an adversary records encrypted traffic today, stores it, and decrypts it years later when quantum computers or better algorithms become available. The data was captured cheaply; the decryption improves over time.

Subvocal EMG data has the same property. An attacker who records raw sensor streams today — acoustic, EMG, accelerometer — does not need to decode them in real time. The ML models for subvocal recognition are improving rapidly. Data recorded in 2026 with crude electrodes and noisy amplifiers can be retroactively decoded in 2028 with better models trained on larger datasets.

And unlike encrypted traffic, biometric data never expires. Your subvocal EMG signature is tied to the anatomy of your jaw, tongue, and larynx. You cannot rotate your muscle activation patterns the way you rotate an encryption key.

The threat window is not "when the glasses ship with EMG sensors." The threat window is *now*, because the raw signals are already recordable with $15 in parts, and the decoding will only get better.

## What a Negative Result Proves

We are testing this. The initial experiment is straightforward: record subvocalization attempts using the stock smart glasses microphones plus supplemental EMG electrodes, and evaluate detection accuracy across configurations.

If the stock microphones detect subvocalization: that is a finding with immediate implications for every consumer smart glasses product on the market. The threat is not one sensor away — it is already here.

If the stock microphones fail but the EMG electrodes succeed: that confirms the published disclosure — multimodal sensing is required, and the current generation is one hardware revision away. It also demonstrates the attacker augmentation scenario: $15 bridges the gap.

If both fail with consumer hardware: that is still a publishable result. It establishes a baseline, identifies the signal-to-noise threshold for consumer sensors, and produces a predictive threat model — "at what sensor resolution does this threat class activate?" — which is exactly what TARA is designed to answer.

Every outcome validates the framework. That is by design. TARA is a threat *atlas*, not a threat *alarm*. It maps attack surfaces before they become active so that defenses can be designed in advance.

## The Through-Line

This blog is the third in a sequence:

1. [**"TARA's First CVE"**](https://qinnovate.com/blog/2026-02-11-tara-first-cve-realtek-audio-jack-retasking) — A BCI security framework found a 9-year-old unfiled vulnerability in RealTek audio codecs. Your headphones can be silently reprogrammed as microphones. TARA caught it because it traces the full attack chain, from silicon to biology.

2. [**"How Malicious Apps Derive Your Personal Biometrics"**](https://qinnovate.com/blog/2026-02-11-how-malicious-apps-derive-your-personal-biometrics) — 28 consumer sensor exploitation techniques. Your earbuds fingerprint your ear canal, chain into cognitive profiling pipelines, and extract biometric data without dedicated health hardware. The S-domain is the reconnaissance phase for BCI attacks.

3. **This post** — The chain extends to smart glasses. Google's own technical disclosure confirms subvocal detection through glasses-form-factor sensors is coming. An attacker can bridge the gap between today's hardware and that capability for $15–$350. No existing security framework models the threat. TARA does.

The progression is deliberate. Each post extends the kill chain one link further upstream — from headphones to earbuds to smart glasses — showing that the consumer devices people already own (or will buy this year) are accumulating the sensor density to extract increasingly intimate data, up to and including the words you say only to yourself.

TARA maps the full chain. QIF provides the coordinate system. NISS scores the impact. The question is whether the industry will adopt a security framework before the sensors arrive, or after.

## What Comes Next

We are ordering the hardware. The experimental protocol:

1. Record subvocalization of standardized word sets (digits, alphabet, common phrases) using consumer smart glasses stock microphones
2. Record the same sets with supplemental jaw EMG electrodes (MyoWare 2.0 or DIY AD8226 circuit)
3. Record with both channels simultaneously
4. Apply bandpass filtering, feature extraction, and classification (CNN or transformer architecture)
5. Compare accuracy across configurations: mics only, EMG only, fused

Results will be published as a TARA proof-of-concept with full methodology, raw data, and code. If the experiment produces a positive result, we will follow responsible disclosure practices before publishing detection-specific findings.

The TARA registry, QIF framework, and all scoring methodologies are open at [qinnovate.com](https://qinnovate.com).

---

## References

1. Kapur, A., Kapur, S., & Maes, P. (2018). AlterEgo: A Personalized Wearable Silent Speech Interface. *23rd International Conference on Intelligent User Interfaces (IUI '18)*. [DOI: 10.1145/3172944.3172977](https://doi.org/10.1145/3172944.3172977)
2. US Patent US10878818B2 — Methods and apparatus for silent speech interface. AlterEgo AI, Inc. / MIT. Granted December 29, 2020. [Patent](https://patents.google.com/patent/US10878818B2/en)
3. Anderson, M., Lunner, T., Balaji, A.N., & Khaleghimeybodi, M. (2023). Multimodal sensing for Subvocal speech recognition for Silent speech interfaces in future AR glasses. *Technical Disclosure Commons*. [Disclosure](https://www.tdcommons.org/dpubs_series/6205/)
4. Gao, C., et al. (2023). EarSpy: Spying Caller Speech and Identity through Tiny Vibrations of Smartphone Ear Speakers. *USENIX Security Symposium*.
5. Guri, M., Solewicz, Y., Daidakulov, A., & Elovici, Y. (2017). SPEAKE(a)R: Turn Speakers to Microphones for Fun and Profit. *USENIX WOOT*.
6. Yuste, R., et al. (2017). Four Ethical Priorities for Neurotechnologies and AI. *Nature* 551, 159–163.
7. Meta CTRL-labs acquisition (2019). EMG wristband technology. Neural Band shipped 2025.
8. Qi, K. L. (2026). QIF: Quantified Interconnection Framework for BCI Security. *Zenodo preprint*. [DOI: 10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)
