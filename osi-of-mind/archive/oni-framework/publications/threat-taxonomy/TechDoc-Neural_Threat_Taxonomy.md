# ONI Neural Threat Taxonomy

**A Comprehensive Classification of Brain-Computer Interface Attack Vectors Mapped to the 14-Layer ONI Model**

**Author:** Kevin L. Qi
**Version:** 1.0
**Date:** 2026-01-30

---

## Abstract

This document defines the ONI Neural Threat Taxonomy — a structured classification of 46 attack techniques across 10 tactics, mapped to the 14-layer ONI security model. Unlike existing BCI threat frameworks that focus exclusively on device-level or signal-level vulnerabilities, this taxonomy extends through the cognitive and identity layers (L9–L14), addressing threats to mental privacy, cognitive liberty, and psychological continuity. The taxonomy synthesizes terminology from published BCI security research (Kohno, 2009; Martinovic et al., 2012; Bonaci et al., 2015; Bernal et al., 2023; Schroder et al., 2025) and extends it with novel cognitive-layer attack classifications that existing frameworks do not address.

**Keywords:** BCI security, neural threat model, neurosecurity, MITRE ATT&CK, cognitive liberty, brainprint, P300, brain-computer interface

---

## 1. Introduction

No standardized threat taxonomy exists for brain-computer interfaces. Existing work addresses pieces of the problem:

- **Kohno (2009)** mapped BCI threats to the CIA triad — Alteration (integrity), Blocking (availability), Eavesdropping (confidentiality) — but did not define attack techniques or progression models.
- **Martinovic et al. (2012)** demonstrated P300-based side-channel attacks empirically but classified only a single attack type.
- **Bonaci et al. (2015)** introduced "brain spyware" and the BCI Anonymizer but focused on the application layer.
- **Bernal et al. (2023)** defined 8 neural cyberattacks (flooding, jamming, scanning, selective forwarding, spoofing, sybil, sinkhole, nonce) validated in CNN simulation — the most complete attack-technique taxonomy to date, but without a tactic/progression framework.
- **Schroder et al. (2025)** identified 4 vulnerability categories (software updates, authentication, wireless, encryption) for next-generation BCIs — device-focused.
- **MITRE ATT&CK for ICS** provides a structural template for cyber-physical systems but contains no BCI-specific content.

The ONI Neural Threat Taxonomy fills this gap by:
1. Providing a unified tactic framework (attack lifecycle) from reconnaissance through impact
2. Mapping every technique to specific ONI layers (L1–L14)
3. Extending classification into the cognitive and identity layers, where threats to the mind — not just the device — must be addressed
4. Citing the research origin of each technique where applicable

---

## 2. Tactic Definitions

The taxonomy uses 10 tactics, adapted from MITRE ATT&CK for the BCI context:

| Tactic | Definition (BCI Context) | ONI Layers |
|--------|--------------------------|------------|
| **Reconnaissance** | Gather information about the target BCI system, neural signal patterns, and brain topology to plan an attack | L1, L9 |
| **Initial Access** | Gain first entry into the BCI system — through physical interfaces, wireless protocols, APIs, or compromised applications | L1, L2, L5, L7 |
| **Execution** | Run unauthorized commands or neural signals — spike timing manipulation, selective forwarding, intent subversion | L2, L4, L6, L7, L10, L11, L13 |
| **Persistence** | Maintain long-term access — exploiting brain plasticity, corrupting baselines, altering self-models | L1, L8, L14 |
| **Privilege Escalation** | Escalate from application-level to firmware-level or read-write control over the neural interface | L7 |
| **Defense Evasion** | Avoid detection by NSAM, coherence validation, or natural neural filters — spoofing, cognitive state forgery, habituation exploitation | L3, L6, L8, L9, L10, L12, L14 |
| **Credential Access** | Steal neural authentication credentials — brainprint extraction, P300 interrogation, session hijacking | L5, L12, L14 |
| **Collection** | Extract neural data — brain spyware, thought decoding, memory interception, cognitive eavesdropping | L3, L7, L10, L11, L12, L13 |
| **Lateral Movement** | Move between neural pathways, brain regions, or interconnected implants — pathway hijack, sinkhole attacks | L8, L11, L13 |
| **Impact** | Cause harm to the user — neural flooding/jamming, memory poisoning, semantic interference, identity fragmentation, agency manipulation | L4, L9, L10, L11, L12, L13, L14 |

---

## 3. Technique Catalog

### 3.1 Silicon Layers (L1–L7)

These layers follow standard networking security, adapted for BCI hardware and software.

| ID | Layer | Technique | Tactic | Description | Source |
|----|-------|-----------|--------|-------------|--------|
| T1.1 | L1 Physical | EM Side-Channel Capture | Reconnaissance | Passive electromagnetic emanation capture to extract neural signal patterns | Martinovic et al., 2012 |
| T1.2 | L1 Physical | Signal Injection | Initial Access | Inject malicious signals through physical medium to corrupt or spoof neural readings | Kohno, 2009 |
| T1.3 | L1 Physical | Hardware Implant | Persistence | Physical modification or implantation of malicious components in BCI hardware | Bernal et al., 2021 |
| T2.1 | L2 Data Link | MAC Spoofing | Initial Access | Impersonate legitimate BCI device by spoofing MAC address | Standard |
| T2.2 | L2 Data Link | Frame Injection | Execution | Inject malicious frames into data link layer | Standard |
| T3.1 | L3 Network | Route Hijacking | Collection | Redirect neural data streams through attacker-controlled network paths | Standard |
| T3.2 | L3 Network | IP Spoofing | Defense Evasion | Mask attack origin by spoofing source IP addresses | Standard |
| T4.1 | L4 Transport | Neural DoS | Impact | Overwhelm transport layer with malformed packets causing denial of neural service | Kohno, 2009 (Blocking) |
| T4.2 | L4 Transport | Stream Injection | Execution | Insert malicious payloads into active neural data transport streams | Standard |
| T5.1 | L5 Session | BCI Session Hijacking | Credential Access | Take over authenticated BCI sessions to gain unauthorized neural interface access | Standard |
| T5.2 | L5 Session | Neural Replay Attack | Initial Access | Capture and replay valid neural session tokens to bypass authentication | Standard |
| T6.1 | L6 Presentation | Encryption Downgrade | Defense Evasion | Force use of weak or null encryption to expose raw neural data | Schroder et al., 2025 |
| T6.2 | L6 Presentation | Neural Format Exploit | Execution | Exploit neural data format parsing vulnerabilities | Bernal et al., 2021 |
| T7.1 | L7 Application | BCI API Exploitation | Initial Access | Exploit vulnerabilities in brain-computer interface application APIs | Takabi et al., 2016 |
| T7.2 | L7 Application | Neural Command Injection | Execution | Inject malicious commands through API calls to manipulate BCI behavior | Standard |
| T7.3 | L7 Application | Brain Spyware | Collection | Malicious BCI application with unrestricted SDK access to raw brainwave signals, silently exfiltrating neural data | Bonaci et al., 2015 |
| T7.4 | L7 Application | Firmware Privilege Escalation | Privilege Escalation | Escalate from app-level API access to firmware-level device control | Schroder et al., 2025 |

### 3.2 Neural Gateway (L8)

The critical security boundary between silicon and biology — the NSAM checkpoint.

| ID | Layer | Technique | Tactic | Description | Source |
|----|-------|-----------|--------|-------------|--------|
| T8.1 | L8 Neural Gateway | Gateway Bypass | Defense Evasion | Circumvent neural gateway security controls through protocol-level manipulation | ONI Framework |
| T8.2 | L8 Neural Gateway | NSAM Baseline Poisoning | Persistence | Gradually corrupt Neural Signal Assurance Model baselines over time | ONI Framework |
| T8.3 | L8 Neural Gateway | Coherence Metric Spoofing | Defense Evasion | Forge valid Cₛ coherence scores to pass NSAM security inspection undetected | ONI Framework |
| T8.4 | L8 Neural Gateway | Bidirectional Channel Exploit | Lateral Movement | Exploit read/write neural interface capabilities for full bidirectional compromise | Ienca & Haselager, 2016 |

### 3.3 Neural Layers (L9–L14)

These layers address threats to the mind itself — signal processing, cognition, meaning, and identity.

| ID | Layer | Technique | Tactic | Description | Source |
|----|-------|-----------|--------|-------------|--------|
| T9.1 | L9 Signal Processing | Sensory Overload | Impact | Overwhelm neural signal processing capacity with excessive artificial stimulation | Bernal et al., 2023 (Neural Flooding) |
| T9.2 | L9 Signal Processing | Neural Filter Bypass | Defense Evasion | Craft signals that exploit habituation and sensory gating thresholds | ONI Framework |
| T9.3 | L9 Signal Processing | Neural Topology Scanning | Reconnaissance | Systematic probe stimulation to map signal processing pathways and electrode coverage | Bernal et al., 2023 (Neural Scanning) |
| T9.4 | L9 Signal Processing | Neural Jamming | Impact | Targeted inhibition preventing spike generation in specific regions | Bernal et al., 2023 (Neural Jamming) |
| T10.1 | L10 Neural Protocol | Spike Timing Attack | Execution | Alter precise spike timing patterns to corrupt or change neural message meaning | ONI Framework |
| T10.2 | L10 Neural Protocol | False Rate Pattern Injection | Impact | Inject fabricated firing rate patterns to create phantom neural signals | ONI Framework |
| T10.3 | L10 Neural Protocol | Neural Codec Interception | Collection | Intercept and decode neural encoding patterns to extract raw signal content | Kohno, 2009 (Eavesdropping) |
| T10.4 | L10 Neural Protocol | Neural Spoofing | Defense Evasion | Inject false signals mimicking legitimate spike timing and rate coding | Bernal et al., 2023 (Neural Spoofing) |
| T11.1 | L11 Cognitive Transport | Neural Pathway Hijack | Lateral Movement | Redirect cognitive signals through unintended neural pathways | ONI Framework |
| T11.2 | L11 Cognitive Transport | Synaptic Timing Disruption | Impact | Interfere with neurotransmitter release timing and reuptake mechanisms | ONI Framework |
| T11.3 | L11 Cognitive Transport | Memory Trace Interception | Collection | Intercept signals during hippocampal consolidation to extract episodic memories | Kohno, 2009 (Eavesdropping) |
| T11.4 | L11 Cognitive Transport | Neural Selective Forwarding | Execution | Selectively stimulate some pathways while inhibiting others to reroute signals | Bernal et al., 2023 |
| T12.1 | L12 Cognitive Session | Working Memory Poisoning | Impact | Inject false contextual information directly into active working memory | ONI Framework |
| T12.2 | L12 Cognitive Session | Attention Capture Attack | Collection | Force cognitive attention toward attacker-chosen stimuli to reveal knowledge | ONI Framework |
| T12.3 | L12 Cognitive Session | P300 Interrogation | Credential Access | Present subliminal stimuli to elicit involuntary P300 responses, extracting whether the user recognizes specific items (PINs, faces, locations) | Martinovic et al., 2012 |
| T12.4 | L12 Cognitive Session | Cognitive State Spoofing | Defense Evasion | Forge cognitive state indicators to bypass safety checks verifying consciousness and consent | ONI Framework |
| T13.1 | L13 Semantic | Semantic Interference | Impact | Induce systematic misinterpretation of perceived information and concepts | ONI Framework |
| T13.2 | L13 Semantic | Intent Subversion | Execution | Manipulate formation of user intentions and decision-making processes | ONI Framework |
| T13.3 | L13 Semantic | Thought Decoding | Collection | Decode semantic representations from neural activity to extract meanings and plans | Bonaci et al., 2015 (Brain Spyware) |
| T13.4 | L13 Semantic | Neural Sinkhole | Lateral Movement | Attract semantic processing to a compromised region, then modify/drop signals | Bernal et al., 2023 |
| T14.1 | L14 Identity | Identity Fragmentation | Impact | Disrupt coherent sense of self, personal continuity, and identity boundaries | Ienca & Andorno, 2017 |
| T14.2 | L14 Identity | Agency Manipulation | Impact | Compromise user sense of authorship and voluntary control | Yuste et al., 2017 |
| T14.3 | L14 Identity | Self-Model Corruption | Persistence | Gradually alter internal self-representation to accept foreign signals as authentic | ONI Framework |
| T14.4 | L14 Identity | Brainprint Theft | Credential Access | Extract unique neural authentication signature to impersonate the user | Armstrong et al., 2015 |
| T14.5 | L14 Identity | Neural Sybil Attack | Defense Evasion | One stimulation source impersonates multiple neural signal origins | Bernal et al., 2023 |

---

## 4. Mapping to Existing Frameworks

### 4.1 Kohno CIA Triad Mapping

| Kohno Category | CIA Property | ONI Techniques |
|----------------|-------------|----------------|
| **Eavesdropping** | Confidentiality | T1.1, T3.1, T7.3, T10.3, T11.3, T12.2, T12.3, T13.3, T14.4 |
| **Alteration** | Integrity | T1.2, T8.2, T10.1, T10.2, T11.4, T12.1, T13.1, T13.2, T14.3 |
| **Blocking** | Availability | T4.1, T9.1, T9.4, T11.2 |

### 4.2 Bernal Neural Cyberattack Mapping

| Bernal (2023) Attack | ONI Technique ID |
|----------------------|-----------------|
| Neural Flooding | T9.1 (Sensory Overload) |
| Neural Jamming | T9.4 (Neural Jamming) |
| Neural Scanning | T9.3 (Neural Topology Scanning) |
| Neural Selective Forwarding | T11.4 (Neural Selective Forwarding) |
| Neural Spoofing | T10.4 (Neural Spoofing) |
| Neural Sybil | T14.5 (Neural Sybil Attack) |
| Neural Sinkhole | T13.4 (Neural Sinkhole) |
| Neural Nonce | Distributed across T10.1, T11.2 (single-pulse attacks) |

### 4.3 Neurorights Threat Mapping

| Neuroright (Yuste, 2017; Ienca & Andorno, 2017) | Primary Threats |
|--------------------------------------------------|----------------|
| **Cognitive Liberty** | T14.2 (Agency Manipulation), T13.2 (Intent Subversion) |
| **Mental Privacy** | T12.3 (P300 Interrogation), T13.3 (Thought Decoding), T11.3 (Memory Trace Interception), T7.3 (Brain Spyware) |
| **Mental Integrity** | T12.1 (Working Memory Poisoning), T13.1 (Semantic Interference), T9.1 (Sensory Overload) |
| **Psychological Continuity** | T14.1 (Identity Fragmentation), T14.3 (Self-Model Corruption) |

### 4.4 MITRE ATT&CK ICS Comparison

| ICS-Unique Tactic | ONI Equivalent |
|-------------------|---------------|
| Inhibit Response Function | T8.1 (Gateway Bypass), T8.3 (Coherence Metric Spoofing) |
| Impair Process Control | T10.1 (Spike Timing Attack), T11.2 (Synaptic Timing Disruption) |

---

## 5. Coverage Analysis

### 5.1 Layer × Tactic Matrix

```
             Recon  Access  Exec  Persist  PrivEsc  Evade  CredAccess  Collect  Lateral  Impact
L1  Physical   ✓      ✓              ✓
L2  DataLink          ✓       ✓
L3  Network                                          ✓                  ✓
L4  Transport                 ✓                                                           ✓
L5  Session           ✓                                       ✓
L6  Present                   ✓                      ✓
L7  Application       ✓       ✓               ✓                ✓
L8  Gateway                          ✓               ✓                           ✓
L9  Signal     ✓                                     ✓                                    ✓✓
L10 Protocol                  ✓                      ✓                  ✓                  ✓
L11 CogTrans                  ✓                                         ✓        ✓        ✓
L12 CogSession                                       ✓        ✓        ✓                  ✓
L13 Semantic                  ✓                                         ✓        ✓        ✓
L14 Identity                         ✓               ✓        ✓                           ✓✓
```

### 5.2 Key Observations

1. **Credential Access now spans three distinct attack surfaces:** network sessions (L5), cognitive interrogation (L12), and identity extraction (L14) — reflecting that "credentials" in a BCI context include both digital tokens and neural signatures.

2. **Collection is the largest tactic category** with 6 techniques across 6 layers — reflecting that neural data extraction is the most immediately feasible and researched class of BCI attack.

3. **Impact remains the most common single tactic** across neural layers, but is now balanced by defensive (Evasion), intelligence (Collection, Reconnaissance), and authentication (Credential Access) techniques.

4. **Every neural layer (L9–L14) now has 4 attacks** across diverse tactics, compared to 2 attacks each (mostly Impact) in the previous version.

---

## 6. Gap Analysis

The following areas remain underexplored and represent future research directions:

| Gap | Description | Relevance |
|-----|-------------|-----------|
| **Cross-device lateral movement** | What happens when an attacker compromises one implant and pivots to another in the same patient? | Multi-implant patients (DBS + cortical) |
| **Supply chain attacks** | Compromised components inserted during manufacturing of neural devices | Noted by Bernal (2021) but not formally modeled |
| **Adversarial ML against BCI classifiers** | Poisoning or evasion attacks against the ML models that decode neural signals | Bernal (2021) flagged; no technique-level taxonomy |
| **Social engineering for neural systems** | Manipulating users into granting BCI access or accepting malicious stimulation parameters | Standard ATT&CK technique, unexplored in BCI context |
| **Real-world validation** | Most cognitive-layer attacks (L11–L14) remain theoretical — empirical validation requires clinical BCI access | Fundamental research gap |

---

## 7. Limitations and Non-Claims

- **Cognitive-layer attacks (L11–L14) are theoretical.** No published research demonstrates these attacks on clinical-grade BCIs. They represent logical extensions of demonstrated device-level and signal-level capabilities.
- **The taxonomy is a framework, not a prediction.** Not all listed techniques may be feasible with current technology. The goal is to map the possibility space so defenses can be designed proactively.
- **This is not a guide for conducting attacks.** All techniques are described at the conceptual level for defensive research purposes.

---

## References

Armstrong, B. C., Ruiz-Blondet, M. V., Khalifian, N., Kurtz, K. J., Jin, Z., & Laszlo, S. (2015). Brainprint: Assessing the uniqueness, collectability, and permanence of a novel method for ERP biometrics. *Neurocomputing*, 166, 59–67.

Bernal, S. L., Celdran, A. H., Perez, G. M., Barros, M. T., & Balasubramaniam, S. (2021). Security in brain-computer interfaces: State-of-the-art, opportunities, and future challenges. *ACM Computing Surveys*, 54(1), 1–35.

Bernal, S. L., Celdran, A. H., Perez, G. M., Barros, M. T., & Balasubramaniam, S. (2023). Eight reasons to prioritize brain-computer interface cybersecurity. *Communications of the ACM*, 66(4), 68–78.

Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App stores for the brain: Privacy and security in brain-computer interfaces. *IEEE Technology and Society Magazine*, 34(2), 32–39.

Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security and privacy for neural devices. *Neurosurgical Focus*, 27(1), E7.

Gui, Q., Ruiz-Blondet, M. V., Laszlo, S., & Jin, Z. (2016). A survey on brain biometrics. *ACM Computing Surveys*, 51(6), 1–38.

Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5.

Ienca, M., & Haselager, P. (2016). Hacking the brain: Brain-computer interfacing technology and the ethics of neurosecurity. *Ethics and Information Technology*, 18(2), 117–129.

Landau, O., Puzis, R., & Nissim, N. (2020). Mind your mind: EEG-based brain-computer interfaces and their security in cyber space. *ACM Computing Surveys*, 53(1), 1–38.

Martinovic, I., Davies, D., Frank, M., Perito, D., Ros, T., & Song, D. (2012). On the feasibility of side-channel attacks with brain-computer interfaces. *Proceedings of the 21st USENIX Security Symposium*.

Schroder, T., Sirbu, A., Park, J., Morley, J., Street, C., & Floridi, L. (2025). Cyber risks to next-gen brain-computer interfaces: Analysis and recommendations. *Neuroethics*, 18, 34.

Takabi, H., Bhalotiya, A., & Alqatawna, J. (2016). Brain-computer interface (BCI) applications: Privacy threats and countermeasures. *IEEE 2nd International Conference on Collaboration and Internet Computing*.

Yuste, R., Goering, S., Arcas, B. A. Y., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551, 159–163.

---

## Acknowledgments

The author wishes to acknowledge the support of colleagues and mentors in the development of this work. Initial research validation was conducted through LMArena (LMSYS, 2024-2025), enabling cross-model verification of hypotheses and findings to mitigate single-model bias. Deep research synthesis and writing assistance was provided by Claude (Anthropic, 2025). All original ideas, theoretical frameworks, analyses, and conclusions are the author's own. Final revisions, editing, and validation were performed by the author.

---

## Interactive Visualizations

- **[ONI Framework 3D Visualization](https://qinnovates.github.io/ONI/visualizations/08-oni-framework-viz.html)** — All 46 techniques mapped to 14 layers with interactive 3D exploration
- **[ONI Threat Matrix](https://qinnovates.github.io/ONI/visualizations/06-oni-threat-matrix.html)** — 10 tactics × 29 techniques in MITRE-style matrix view

---

*Document: TechDoc-Neural_Threat_Taxonomy.md*
*Topic: threat-taxonomy*
*Last Updated: 2026-01-30*
