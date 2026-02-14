---
title: "Your Headphones Know Your Biometrics — No Health Sensor Required"
subtitle: "28 ways consumer sensors extract biometric, physiological, and cognitive data without dedicated health hardware, and why the attack chain ends at your brain"
date_posted: "2026-02-11"
source: "https://qinnovate.com"
tags: ["#TARA", "#NeurosecurityEngineering", "#QIF", "#BCI", "#ConsumerSensors", "#SDomain", "#Biometrics", "#Privacy", "#SensorExploitation"]
---

## Your $20 Headphones Are a Medical Device

You do not need AirPods Pro with a health sensor. You do not need a Pixel Watch with PPG. A pair of ten-year-old wired headphones plugged into a laptop can measure your heart rate.

The speaker driver in any headphone is a diaphragm attached to a coil. That is the same physical mechanism as a microphone, just running in reverse. RealTek HD Audio codecs — present in the majority of PCs and laptops shipped in the last fifteen years — allow any software process to silently reprogram an output jack as an input jack. No permission dialog. No notification. No elevated privileges. The headphone you are wearing right now becomes a microphone pointed at your ear canal. From there, your pulse is an acoustic signal.

That is one technique out of 28.

Your phone measures your heart rate through its camera. It knows your gait from its accelerometer. It can detect Parkinson's tremor from the way your hand shakes while you type. It captures your breathing pattern through inaudible ultrasonic pulses from its speaker. It fingerprints you through Bluetooth radio imperfections that no software update can change.

None of this requires a brain-computer interface. None of it requires a medical implant. None of it requires dedicated health hardware. None of it requires your permission.

The average consumer carries a smartphone, a smartwatch, and a pair of headphones. Together, those three devices contain more than ten sensors: accelerometers, gyroscopes, magnetometers, barometers, cameras, microphones, ambient light sensors, proximity sensors, WiFi radios, Bluetooth transmitters. Some have PPG optical heart rate monitors. Most do not. It does not matter. Each sensor has a legitimate purpose. Each sensor has a second purpose that nobody consented to — and that second purpose does not depend on the sensor being designed for health.

We spent the last two weeks mapping those second purposes. The result is 28 techniques across four tactical categories in what we call the S-domain: Consumer Sensor Exploitation.

Today the TARA registry reaches 99 techniques.

## What the S-Domain Covers

The [TARA framework](https://qinnovate.com/TARA) (Therapeutic Atlas of Risks and Applications) classifies attacks against brain-computer interfaces across eight operational domains. Seven of those domains cover threats that touch neural tissue, BCI hardware, cognitive processes, or the data pipeline between them.

The eighth domain is different. It covers the consumer devices that billions of people already carry, devices that sit upstream of any neural interface in the kill chain.

We organized the 28 techniques into four tactics:

**Sensor Repurposing (S.RP):** Using a sensor for something it was not designed to do. Your gyroscope was designed to detect rotation. [Michalevsky et al. (2014)](https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/michalevsky) showed it can record speech. Your speaker was designed to produce sound. [Guri et al. (2017)](https://www.usenix.org/conference/woot17/workshop-program/presentation/guri) showed it can be reprogrammed to function as a microphone (that one became [our first CVE](https://qinnovate.com/blog/2026-02-11-tara-first-cve-realtek-audio-jack-retasking)). Your earbuds were designed for audio. [Kaveh et al. (2020)](https://pubmed.ncbi.nlm.nih.gov/31425018/) showed that a conductive ear tip turns them into an EEG recorder.

**Sensor Fingerprinting (S.FP):** Using sensor data to identify you. Your ear canal has a unique acoustic signature ([NEC Corporation, 2016](https://www.nec.com/en/press/201603/global_20160307_02.html)). Your walking pattern is as distinctive as a fingerprint ([Muaaz & Mayrhofer, 2017](https://ieeexplore.ieee.org/document/7893786)). Your cardiac pulse waveform is unique to your cardiovascular anatomy ([Biswas et al., 2019](https://ieeexplore.ieee.org/document/8567966)). Your Bluetooth radio has manufacturing imperfections that identify your specific device even when MAC address randomization is enabled ([Becker et al., 2022](https://petsymposium.org/popets/2022/popets-2022-0003.php)).

**Sensor Harvest (S.HV):** Extracting physiological or cognitive data through sensors. A webcam extracts your heart rate from sub-pixel skin color changes ([Chen & McDuff, 2018](https://arxiv.org/abs/1805.07888)). A WiFi router detects your breathing through walls ([Zeng et al., 2020](https://dl.acm.org/doi/10.1145/3386901.3388905)). Your phone's motion sensors reveal whether you have a neurological condition like Parkinson's disease ([Bot et al., 2016](https://www.nature.com/articles/sdata201611)). An AR headset's eye tracker infers your cognitive state, emotional arousal, and potentially your sexual orientation from gaze patterns ([Katsini et al., 2020](https://dl.acm.org/doi/10.1145/3383123)).

**Sensor Chaining (S.CH):** Combining multiple sensor exploits into compound attack chains. This is where it gets interesting.

## The Chain Techniques

Individual sensor exploits are concerning. Chained together, they become something qualitatively different.

Consider a pair of earbuds. Not smart earbuds. Not health earbuds. Any earbuds with a speaker and a wire or Bluetooth radio. A single device. What it can do, step by step:

**Step 1:** The speaker is reprogrammed as a microphone (T0072). The attacker has ambient audio. Everything said in the room.

**Step 2:** The ANC system's probe tones fingerprint the ear canal (T0079). The attacker knows who is wearing the earbuds. Silent, passive identification every time the earbuds are inserted.

**Step 3:** A conductive ear tip and a sub-$5 biopotential amplifier hidden in the housing capture in-ear EEG from temporal cortex (T0073). The attacker has continuous neural telemetry.

**Step 4:** A machine learning model trained on weeks of that EEG data builds a personalized cognitive profile (T0074). The attacker can predict cognitive state in real time, identifying moments of low vigilance, high emotional arousal, or deep engagement.

The end state: identity plus ambient audio plus neural telemetry plus a personalized cognitive vulnerability map. From a device the target voluntarily wears for hours every day.

We documented this as T0095, the acoustic-to-neural profiling pipeline. Each step in the chain has been independently demonstrated or is actively emerging in research. The complete chain has not been demonstrated end to end. But every component exists.

## The Biometric Panopticon

There is a parallel chain that does not require neural data at all.

Your earbuds fingerprint you by ear canal acoustics (T0079). Your phone fingerprints you by gait pattern (T0088). Your watch fingerprints you by cardiac pulse waveform (T0093). Your Bluetooth radio fingerprints your device by hardware imperfections (T0091). If you wear a VR headset, your eye tracking data fingerprints you by gaze behavior (T0085).

Each of these biometrics works independently. Combine three and identification accuracy exceeds 99 percent. Combine four and the system maintains identification even if one channel is disrupted. You can change your earbuds. You can alter your gait. You can disable Bluetooth. You cannot do all three simultaneously, and the fusion system only needs two of four channels.

We documented this as T0096, the multi-modal biometric fusion attack. The individual biometrics are established research. The insight is that the average consumer already carries enough sensors for the fusion to work, and no single privacy measure can defeat the aggregate.

These biometrics share a property that makes them different from passwords and cookies: they are irrevocable. You cannot change your ear canal geometry. You cannot change your cardiovascular anatomy. You cannot change the manufacturing imperfections in your phone's Bluetooth transmitter. Once captured, these identifiers track you for life.

## Why This Matters for Brain-Computer Interfaces

The capstone technique in the registry is T0099: Consumer-Sensor-to-BCI Kill Chain Escalation.

The argument is straightforward. Before a person ever receives a brain-computer interface, whether a medical implant for Parkinson's treatment or a consumer neural headband for meditation, an attacker who has been monitoring their consumer devices already has:

A **behavioral baseline** from months of gait, activity, and sleep data. A **physiological profile** from cardiac, respiratory, and neurological sensor streams. A **biometric identity** fused from multiple irrevocable signatures. And, if the target uses VR/AR or wears modified earbuds, a **cognitive profile** from eye tracking or in-ear EEG.

When the BCI arrives, this pre-existing intelligence makes every attack more effective. Neural injection can be calibrated to the individual's neural baseline. Evasion of anomaly detection can be trained on their "normal." Cognitive exploitation can target known cognitive vulnerabilities.

The S-domain is not a separate problem from BCI security. It is the reconnaissance phase.

## What the Numbers Say

The TARA registry now contains 99 techniques across 15 tactics and 8 domains. The S-domain accounts for 28 of those 99 techniques, making it the largest single domain by technique count.

Evidence levels for the 28 S-domain techniques:

| Status | Count | What it means |
|--------|-------|--------------|
| Demonstrated | 16 | Proven in published research with working implementations |
| Confirmed | 5 | Observed in real-world systems or products |
| Emerging | 5 | Active research, partial demonstrations |
| Theoretical | 2 | Plausible from known physics, not yet demonstrated |

Twenty-one of the 28 techniques have been demonstrated or confirmed. These are not speculative attacks. They are published, peer-reviewed, and in some cases commercially deployed (Google's Nest Hub uses ultrasonic vital sign sensing; Apple's Watch uses PPG for atrial fibrillation detection; Silverpush deployed ultrasonic cross-device tracking in 234 Android apps).

Every technique in the registry carries both a [CVSS v4.0](https://www.first.org/cvss/) base vector and a [NISS v1.0](https://qinnovate.com/scoring) neural impact extension vector. An observation from the scoring: NISS scores remain low for most S-domain techniques (1.4 to 5.0 out of 10.0), because NISS measures neural safety impact and most consumer sensor attacks do not directly damage neural tissue. CVSS scores are high (confidentiality violation, data theft). The gap between the two scores is largest in the S-domain, which validates the dual-scoring approach. CVSS alone would miss the BCI-specific risks. NISS alone would miss the consumer privacy risks. You need both.

## What You Can Do About It

For individuals: review sensor permissions on your devices. Motion sensor access (accelerometer, gyroscope) required no permission on Android until API level 33. Ambient light sensors still require no permission on most platforms. Microphone permission gates acoustic attacks but not ultrasonic beacon detection through other apps that already have mic access.

For device manufacturers: lock sensor access behind explicit permissions. Rate-limit high-frequency sensor sampling when the accessed data could reconstruct speech or keystrokes. Implement firmware attestation on audio codecs (the RealTek vulnerability that became our first CVE exists because jack retasking requires no authorization). Add physical-layer randomization to Bluetooth transmitters to prevent RF fingerprinting.

For policymakers: the EU AI Act's provisions on emotion recognition systems and biometric identification apply to several techniques in this registry. The Illinois Biometric Information Privacy Act (BIPA) applies to ear canal fingerprinting, gait biometrics, and PPG waveform identification. But no current regulation addresses the aggregate: the multi-modal biometric fusion that combines individually regulated data streams into a surveillance capability that exceeds the sum of its parts.

For researchers: the full TARA registry is machine-readable JSON, available in the [QIF repository](https://github.com/qinnovates/qinnovate). Every technique entry includes sources, evidence status, CVSS and NISS scores, clinical dual-use mappings, and governance requirements. If you are working on sensor security, privacy-preserving sensing, or BCI security, the registry is designed to be built upon.

## The Map Before the Territory

We are mapping attack surfaces that mostly do not have defenses yet. The consumer sensor ecosystem formed around utility: step counting, heart rate monitoring, noise cancellation, augmented reality. Security was not part of the design because the sensors were not considered threats.

They are threats. Not because the sensors are malicious, but because they are capable. The same PPG sensor that detects atrial fibrillation (FDA-cleared, genuinely life-saving) also captures a biometric that identifies you for life. The same eye tracker that enables foveated rendering in VR (a legitimate performance optimization) also infers your cognitive state, your emotional arousal, and your attention patterns. The same WiFi router that provides your internet connection can detect your breathing through walls.

Ninety-nine techniques. Twenty-eight of them using hardware you already own — not health hardware, not smart hardware, just hardware with speakers and accelerometers and radios. Five of them chaining consumer sensors into escalation paths that terminate at brain-computer interfaces.

The map is public. The [registry](https://qinnovate.com/TARA) is open. The point is not to make people afraid of their headphones. The point is to design the security before the ecosystem forms around the assumption that consumer sensors are benign.

They are not benign. They are dual-use. Just like every other technology in TARA.

## References

1. Michalevsky, Y., Boneh, D., & Nakibly, G. (2014). Gyrophone: Recognizing Speech from Gyroscope Signals. *USENIX Security Symposium*.
2. Guri, M., Solewicz, Y., Daidakulov, A., & Elovici, Y. (2017). SPEAKE(a)R: Turn Speakers to Microphones for Fun and Profit. *USENIX WOOT*.
3. Kaveh, A., et al. (2020). Wireless User Authentication in Ear-EEG. *IEEE Trans Biomed Eng*.
4. NEC Corporation (2016). Ear Acoustic Authentication Technology.
5. Muaaz, M. & Mayrhofer, R. (2017). Smartphone-Based Gait Recognition. *IEEE Trans Mobile Computing*.
6. Biswas, D., et al. (2019). CorNET: Deep Learning Framework for PPG-Based Biometric Identification. *IEEE Trans Biomed Eng*.
7. Becker, J., et al. (2022). Tracking Anonymized Bluetooth Devices. *PoPETS*.
8. Chen, W. & McDuff, D. (2018). DeepPhys: Video-Based Physiological Measurement. *ECCV*.
9. Zeng, Y., et al. (2020). FarSense: Pushing the Range Limit of WiFi-Based Respiration Sensing. *ACM MobiSys*.
10. Bot, B., et al. (2016). The mPower Study: Parkinson Disease Mobile Data. *Scientific Data*.
11. Katsini, C., et al. (2020). The Role of Eye Gaze in Security and Privacy Applications. *ACM Computing Surveys*.
12. Ba, Z., et al. (2020). Learning-based Practical Smartphone Eavesdropping with Built-in Accelerometer. *NDSS*.
13. Harrison, A. & Matyunin, N. (2023). A Practical Deep Learning-Based Acoustic Side Channel Attack on Keyboards. *IEEE EuroS&P Workshops*.
14. Zhao, M., et al. (2018). Through-Wall Human Pose Estimation Using Radio Signals. *CVPR*.
15. Arp, D., et al. (2017). Privacy Threats through Ultrasonic Side Channels on Mobile Devices. *IEEE EuroS&P*.
16. Yuste, R., et al. (2017). Four Ethical Priorities for Neurotechnologies and AI. *Nature* 551, 159-163.
