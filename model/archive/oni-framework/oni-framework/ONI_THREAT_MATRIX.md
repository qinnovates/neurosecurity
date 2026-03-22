# ONI Threat Matrix

> A Neural Security Threat Framework for Brain-Computer Interfaces

**Version:** 1.0.0
**Last Updated:** 2026-01-25
**Status:** Active Development

---

## Legal Notice and Attribution

### MITRE ATT&CK Attribution

This framework's methodology is **inspired by** the [MITRE ATT&CK](https://attack.mitre.org/) framework. MITRE ATT&CK is a globally-accessible knowledge base of adversary tactics and techniques based on real-world observations.

**Important Disclaimers:**

1. **ONI Threat Matrix is NOT affiliated with, endorsed by, or derived from MITRE Corporation.**
2. The ONI Threat Matrix is an **independent, domain-specific adaptation** of adversarial threat modeling concepts for the emerging field of brain-computer interface security.
3. MITRE ATT&CK® is a registered trademark of The MITRE Corporation.
4. We gratefully acknowledge MITRE's pioneering work in adversarial threat modeling that inspired this methodology.

### Academic References

The ONI Threat Matrix incorporates research from:

- **Kohno, T., et al. (2009)**. "Neurosecurity: Security and Privacy for Neural Devices." *Neurosurgical Focus*, 27(1). — CIA threat taxonomy for neural devices
- **Bonaci, T., et al. (2015)**. "App Stores for the Brain." *IEEE S&P Workshop*. — BCI privacy attack patterns
- **Schroder, T., et al. (2025)**. "Cyber Risks to Next-Gen Brain-Computer Interfaces." *Neuroethics*. — Yale Digital Ethics Center threat model
- **Landau, O., et al. (2020)**. "Mind Your Privacy: Privacy Leakage through BCI Apps." *NDSS Workshop*.

### License

This documentation is released under the Apache 2.0 License, consistent with the ONI Framework. The threat matrix is provided for **educational and defensive security purposes only**.

---

## Overview

The ONI Threat Matrix provides a structured approach to understanding adversarial threats against brain-computer interfaces (BCIs). It maps **10 tactics** containing **46 techniques** across the ONI 14-layer model (L1-L14).

### Key Concepts

| Term | Definition |
|------|------------|
| **Tactic** | The adversary's goal or objective (the "why") |
| **Technique** | How the adversary achieves the tactic (the "how") |
| **ONI Layer** | Which layer(s) of the ONI model are targeted |
| **CIA Impact** | Effect on Confidentiality, Integrity, and Availability |

### Coverage

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONI THREAT MATRIX                            │
├─────────────────────────────────────────────────────────────────┤
│  10 Tactics   │  46 Techniques  │  14 ONI Layers │  63+ Mitigations│
└─────────────────────────────────────────────────────────────────┘

Tactics: Reconnaissance → Initial Access → Execution → Persistence →
         Defense Evasion → Collection → Impact
```

---

## Tactics Overview

| ID | Tactic | Description | Techniques | Primary Layers |
|----|--------|-------------|------------|----------------|
| TA0001 | Reconnaissance | Gathering information about the target BCI | 3 | L7, L8 |
| TA0002 | Initial Access | Gaining foothold in the BCI system | 3 | L7, L8, L9 |
| TA0003 | Execution | Running malicious signals or commands | 3 | L9, L10, L11, L12, L13 |
| TA0004 | Persistence | Maintaining access across sessions | 3 | L9, L10, L11, L12 |
| TA0005 | Defense Evasion | Avoiding detection by security systems | 3 | L8, L9, L10 |
| TA0006 | Collection | Gathering sensitive neural data | 3 | L12, L13, L14 |
| TA0007 | Impact | Causing harm through the BCI | 3 | L11, L12, L13, L14 |

### Mapping to MITRE ATT&CK

The ONI tactics parallel MITRE ATT&CK tactics where applicable:

| ONI Tactic | MITRE ATT&CK Equivalent | Notes |
|------------|-------------------------|-------|
| Reconnaissance | [TA0043](https://attack.mitre.org/tactics/TA0043/) | Adapted for neural signal profiling |
| Initial Access | [TA0001](https://attack.mitre.org/tactics/TA0001/) | Extended for electrode/RF vectors |
| Execution | [TA0002](https://attack.mitre.org/tactics/TA0002/) | Neural signal injection context |
| Persistence | [TA0003](https://attack.mitre.org/tactics/TA0003/) | Calibration and memory persistence |
| Defense Evasion | [TA0005](https://attack.mitre.org/tactics/TA0005/) | Coherence mimicry is BCI-specific |
| Collection | [TA0009](https://attack.mitre.org/tactics/TA0009/) | Extended for cognitive data |
| Impact | [TA0040](https://attack.mitre.org/tactics/TA0040/) | Neural-specific harm vectors |

---

## Technique Reference

### TA0001: Reconnaissance

*Gathering information about the target BCI system*

#### ONI-T001: Signal Profiling

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T001 |
| **Name** | Signal Profiling |
| **Target Layers** | L7 (Application Interface), L8 (Neural Gateway) |
| **Severity** | Medium |
| **CIA Impact** | C: High, I: Low, A: Low |

**Description:**
Passive monitoring and analysis of neural signal patterns to understand communication protocols, timing characteristics, and signal baselines. Attackers collect data without active interference to avoid detection.

**Mitigations:**
- Implement signal encryption at L7
- Use frequency hopping protocols
- Deploy RF shielding for wireless BCIs

**Detection:**
- RF Monitoring: Detect unauthorized receivers in proximity
- Signal Analysis: Identify unusual monitoring patterns

**MITRE Mapping:** Similar to [T1595](https://attack.mitre.org/techniques/T1595/) (Active Scanning)

---

#### ONI-T002: Side-Channel Analysis

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T002 |
| **Name** | Side-Channel Analysis |
| **Target Layers** | L7, L8, L9 (Signal Processing) |
| **Severity** | High |
| **CIA Impact** | C: High, I: Low, A: Low |

**Description:**
Extracting sensitive information through timing variations, power consumption patterns, or electromagnetic emissions from BCI hardware components.

**Mitigations:**
- Implement constant-time algorithms
- Add power consumption noise
- Use EM shielding on sensitive components

**Detection:**
- Power Monitoring: Detect unusual power consumption probes
- EM Scanning: Identify unauthorized EM measurement devices

**Academic Reference:** Bonaci et al. (2015) demonstrated side-channel attacks on consumer EEG devices.

---

#### ONI-T003: Network Mapping

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T003 |
| **Name** | Network Mapping |
| **Target Layers** | L7, L8 |
| **Severity** | Medium |
| **CIA Impact** | C: Medium, I: Low, A: Low |

**Description:**
Discovering the topology of BCI node networks, identifying communication pathways between electrodes, processing units, and external interfaces.

**Mitigations:**
- Implement network segmentation
- Use dynamic addressing
- Deploy honeypot nodes

**Detection:**
- Network Monitor: Detect scanning patterns
- L8 Firewall: Log enumeration attempts

---

### TA0002: Initial Access

*Techniques to gain initial foothold in the BCI system*

#### ONI-T004: Electrode Compromise

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T004 |
| **Name** | Electrode Compromise |
| **Target Layers** | L8 (Neural Gateway), L9 (Signal Processing) |
| **Severity** | Critical |
| **CIA Impact** | C: High, I: High, A: High |

**Description:**
Physical manipulation or replacement of neural electrodes to inject malicious signals or intercept legitimate neural data at the hardware level.

**Mitigations:**
- Implement electrode authentication
- Use tamper-evident seals
- Deploy impedance monitoring for changes

**Detection:**
- Impedance Check: Detect electrode tampering via impedance changes
- Physical Security: Monitor for unauthorized access

**Yale Threat Model:** Maps to AUTHENTICATION vulnerability category.

---

#### ONI-T005: RF Protocol Exploitation

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T005 |
| **Name** | RF Protocol Exploitation |
| **Target Layers** | L7, L8 |
| **Severity** | Critical |
| **CIA Impact** | C: High, I: High, A: Medium |

**Description:**
Exploiting vulnerabilities in wireless BCI communication protocols to gain unauthorized access to the neural interface system.

**Mitigations:**
- Use authenticated encryption
- Implement protocol hardening
- Deploy intrusion detection at L8

**Detection:**
- RF Monitor: Detect protocol anomalies
- L8 Firewall: Block unauthorized protocol messages

**Yale Threat Model:** Maps to WIRELESS vulnerability category.

---

#### ONI-T006: Firmware Backdoor

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T006 |
| **Name** | Firmware Backdoor |
| **Target Layers** | L7, L8, L9 |
| **Severity** | Critical |
| **CIA Impact** | C: High, I: High, A: High |

**Description:**
Compromising BCI firmware through supply chain attacks or update mechanisms to establish persistent unauthorized access.

**Mitigations:**
- Implement secure boot
- Use signed firmware updates
- Verify supply chain integrity

**Detection:**
- Firmware Audit: Compare against known-good hashes
- Behavioral Analysis: Detect unexpected firmware behavior

**Yale Threat Model:** Maps to SOFTWARE_UPDATE vulnerability category.
**MITRE Mapping:** Similar to [T1195.002](https://attack.mitre.org/techniques/T1195/002/) (Supply Chain Compromise: Software)

---

### TA0003: Execution

*Running malicious signals or commands in the BCI*

#### ONI-T007: Signal Injection

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T007 |
| **Name** | Signal Injection |
| **Target Layers** | L9, L10 (Neural Protocol), L11 (Cognitive Transport) |
| **Severity** | Critical |
| **CIA Impact** | C: Medium, I: High, A: High |

**Description:**
Injecting crafted neural signals that mimic legitimate brain activity to trigger unauthorized actions or corrupt neural processing.

**Mitigations:**
- Implement coherence validation at L8 (Cₛ threshold)
- Use signal authentication
- Deploy anomaly detection on signal patterns

**Detection:**
- Coherence Metric: Detect signals with abnormal Cₛ scores
- Pattern Analysis: Identify non-biological signal characteristics

**Kohno Taxonomy:** ALTERATION (Integrity violation)

---

#### ONI-T008: Protocol Manipulation

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T008 |
| **Name** | Protocol Manipulation |
| **Target Layers** | L10, L11 |
| **Severity** | High |
| **CIA Impact** | C: Medium, I: High, A: Medium |

**Description:**
Exploiting weaknesses in neural data protocols to inject commands or alter data formatting in ways that bypass security controls.

**Mitigations:**
- Implement protocol integrity checks
- Use message authentication codes (MACs)
- Validate all protocol fields

**Detection:**
- Protocol Monitor: Detect malformed protocol messages
- L10 Validation: Flag protocol violations

---

#### ONI-T009: Command Hijacking

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T009 |
| **Name** | Command Hijacking |
| **Target Layers** | L11, L12 (Cognitive Session), L13 (Semantic) |
| **Severity** | Critical |
| **CIA Impact** | C: Medium, I: High, A: High |

**Description:**
Intercepting and modifying motor commands or cognitive instructions as they transit through the BCI system.

**Mitigations:**
- Implement end-to-end encryption
- Use command authentication
- Deploy integrity verification at L12

**Detection:**
- Command Audit: Verify command source and integrity
- Behavioral Check: Detect commands inconsistent with user intent

**Kohno Taxonomy:** ALTERATION (Integrity violation)

---

### TA0004: Persistence

*Maintaining access to the compromised BCI system*

#### ONI-T010: Pattern Lock

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T010 |
| **Name** | Pattern Lock |
| **Target Layers** | L10, L11 |
| **Severity** | High |
| **CIA Impact** | C: Medium, I: High, A: Medium |

**Description:**
Embedding recurring attack patterns that survive system resets by exploiting learned neural pathways or stored calibration data.

**Mitigations:**
- Implement pattern integrity verification
- Regular calibration audits
- Secure storage for learned patterns

**Detection:**
- Pattern Analysis: Detect unauthorized pattern modifications
- Calibration Check: Verify calibration data integrity

---

#### ONI-T011: Memory Implant

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T011 |
| **Name** | Memory Implant |
| **Target Layers** | L11, L12 |
| **Severity** | Critical |
| **CIA Impact** | C: Medium, I: High, A: Medium |

**Description:**
Persistent modification of neural pathway configurations or cognitive associations that survive across sessions.

**Mitigations:**
- Implement memory integrity checks
- Use session isolation
- Deploy cognitive state verification

**Detection:**
- State Comparison: Detect unexpected cognitive state changes
- Session Analysis: Identify cross-session anomalies

---

#### ONI-T012: Calibration Poisoning

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T012 |
| **Name** | Calibration Poisoning |
| **Target Layers** | L9, L10 |
| **Severity** | High |
| **CIA Impact** | C: Low, I: High, A: Medium |

**Description:**
Subtly corrupting BCI calibration data to maintain influence over signal interpretation across device resets.

**Mitigations:**
- Cryptographically sign calibration data
- Implement calibration verification
- Regular recalibration audits

**Detection:**
- Calibration Audit: Compare against baseline calibration
- Performance Monitor: Detect calibration drift

---

### TA0005: Defense Evasion

*Avoiding detection by BCI security systems*

#### ONI-T013: Coherence Mimicry

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T013 |
| **Name** | Coherence Mimicry |
| **Target Layers** | L8, L9 |
| **Severity** | High |
| **CIA Impact** | C: Medium, I: High, A: Low |

**Description:**
Crafting malicious signals that maintain legitimate coherence scores (Cₛ) to bypass the Neural Firewall's signal validation.

**Mitigations:**
- Implement multi-factor signal validation
- Use behavioral analysis beyond coherence
- Deploy ensemble detection methods

**Detection:**
- Behavioral Analysis: Detect signals with unusual context
- Ensemble Detection: Use multiple validation metrics

**ONI-Specific:** This technique specifically targets the ONI Coherence Metric (Cₛ).

---

#### ONI-T014: Gradual Drift

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T014 |
| **Name** | Gradual Drift |
| **Target Layers** | L9, L10 |
| **Severity** | Medium |
| **CIA Impact** | C: Low, I: High, A: Low |

**Description:**
Slowly modifying neural parameters below detection thresholds to accumulate significant changes over time.

**Mitigations:**
- Implement long-term baseline tracking
- Use cumulative change detection
- Regular security audits

**Detection:**
- Trend Analysis: Detect slow parameter drift
- Baseline Comparison: Compare against historical baselines

---

#### ONI-T015: Noise Injection

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T015 |
| **Name** | Noise Injection |
| **Target Layers** | L8, L9 |
| **Severity** | Medium |
| **CIA Impact** | C: Low, I: Medium, A: Low |

**Description:**
Adding carefully calibrated noise to mask malicious signal components from detection algorithms.

**Mitigations:**
- Implement noise-resilient detection
- Use signal denoising preprocessing
- Deploy multiple detection channels

**Detection:**
- Noise Analysis: Detect unusual noise patterns
- Multi-Channel: Cross-validate across channels

---

### TA0006: Collection

*Gathering sensitive neural data from the BCI*

#### ONI-T016: ERP Harvesting

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T016 |
| **Name** | ERP Harvesting |
| **Target Layers** | L12, L13, L14 (Identity) |
| **Severity** | Critical |
| **CIA Impact** | C: High, I: Low, A: Low |

**Description:**
Extracting event-related potentials (P300, N170, N400) that reveal cognitive states, recognition, and decision-making processes.

**Mitigations:**
- Implement BCI Anonymizer filtering
- Use ERP obfuscation
- Deploy privacy-preserving signal processing

**Detection:**
- ERP Monitor: Detect unusual ERP extraction patterns
- Data Flow Analysis: Track ERP data destinations

**Kohno Taxonomy:** EAVESDROPPING (Confidentiality violation)
**Academic Reference:** Bonaci et al. (2015) demonstrated P300-based attacks on consumer BCIs.

---

#### ONI-T017: Cognitive State Capture

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T017 |
| **Name** | Cognitive State Capture |
| **Target Layers** | L12, L13 |
| **Severity** | High |
| **CIA Impact** | C: High, I: Low, A: Low |

**Description:**
Recording patterns that reveal attention, emotion, fatigue, or other cognitive states without user awareness.

**Mitigations:**
- Implement cognitive privacy filters
- Use state obfuscation
- Deploy minimal data collection policies

**Detection:**
- Privacy Monitor: Detect unauthorized state inference
- Data Audit: Review cognitive data collection

**Kohno Taxonomy:** EAVESDROPPING (Confidentiality violation)

---

#### ONI-T018: Memory Extraction

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T018 |
| **Name** | Memory Extraction |
| **Target Layers** | L13, L14 |
| **Severity** | Critical |
| **CIA Impact** | C: High, I: Low, A: Low |

**Description:**
Attempting to extract memory-related neural patterns that could reveal personal experiences, knowledge, or intentions.

**Mitigations:**
- Implement memory signal filtering
- Use hippocampal activity obfuscation
- Deploy strict data access controls

**Detection:**
- Memory Monitor: Detect hippocampal signal extraction
- Access Audit: Log all memory-related data access

**Kohno Taxonomy:** EAVESDROPPING (Confidentiality violation)

---

### TA0007: Impact

*Causing harm through the compromised BCI*

#### ONI-T019: Neural DoS

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T019 |
| **Name** | Neural Denial of Service |
| **Target Layers** | L11, L12, L13 |
| **Severity** | Critical |
| **CIA Impact** | C: Low, I: Medium, A: High |

**Description:**
Overwhelming neural pathways with excessive stimulation or signal flooding to cause temporary dysfunction or distress.

**Mitigations:**
- Implement rate limiting at L8
- Use circuit breakers for stimulation
- Deploy emergency shutdown mechanisms

**Detection:**
- Rate Monitor: Detect signal flooding
- L8 Firewall: Block excessive traffic

**Kohno Taxonomy:** BLOCKING (Availability violation)

---

#### ONI-T020: Motor Hijacking

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T020 |
| **Name** | Motor Hijacking |
| **Target Layers** | L12, L13 |
| **Severity** | Critical |
| **CIA Impact** | C: Low, I: High, A: High |

**Description:**
Forcing involuntary motor actions by injecting false motor commands through compromised BCI motor interfaces.

**Mitigations:**
- Implement motor command authentication
- Use intent verification
- Deploy physical safety interlocks

**Detection:**
- Intent Verification: Compare commands to detected intent
- Motor Monitor: Detect unauthorized motor signals

**Kohno Taxonomy:** ALTERATION (Integrity violation)
**Yale Threat Model:** AI-mediated malicious stimulation scenario.

---

#### ONI-T021: Identity Erosion

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T021 |
| **Name** | Identity Erosion |
| **Target Layers** | L13, L14 |
| **Severity** | Critical |
| **CIA Impact** | C: Medium, I: High, A: Medium |

**Description:**
Long-term subtle manipulation of cognitive patterns leading to gradual personality changes or identity confusion.

**Mitigations:**
- Implement identity baseline tracking
- Use long-term cognitive monitoring
- Deploy personality integrity checks

**Detection:**
- Identity Monitor: Track identity markers over time
- Behavioral Analysis: Detect personality drift

**Kohno Taxonomy:** ALTERATION (Integrity violation targeting L14 Identity layer)

---

## Proposed Extensions

The following techniques are proposed additions based on emerging research:

### TA0002: Initial Access (Proposed)

#### ONI-T022: Wireless Authentication Bypass (Proposed)

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T022 |
| **Name** | Wireless Authentication Bypass |
| **Target Layers** | L7, L8 |
| **Severity** | Critical |
| **Source** | Yale Digital Ethics Center (2025) |

**Description:**
Exploiting weak or absent authentication on BCI wireless interfaces. Many older devices assume connection implies authorization.

**Yale Category:** AUTHENTICATION

---

#### ONI-T023: Unencrypted Data Interception (Proposed)

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T023 |
| **Name** | Unencrypted Data Interception |
| **Target Layers** | L10, L11 |
| **Severity** | High |
| **Source** | Yale Digital Ethics Center (2025) |

**Description:**
Intercepting unencrypted neural data in transit. Most BCIs lack encryption due to power constraints.

**Yale Category:** ENCRYPTION

---

### TA0007: Impact (Proposed)

#### ONI-T024: Mass Neural Manipulation (Proposed)

| Attribute | Value |
|-----------|-------|
| **ID** | ONI-T024 |
| **Name** | Mass Neural Manipulation |
| **Target Layers** | L13, L14 |
| **Severity** | Critical |
| **Source** | Yale Digital Ethics Center (2025) |

**Description:**
Coordinated attack on standardized BCI systems affecting millions simultaneously. Yale's worst-case scenario.

**Yale Category:** All (SOFTWARE_UPDATE, WIRELESS, AUTHENTICATION, ENCRYPTION)

---

## Integration with ONI Framework

### Layer Coverage Matrix

| ONI Layer | Role | Techniques Targeting |
|-----------|------|----------------------|
| L7 (Application Interface) | Entry point | T001, T002, T003, T005, T006, T022 |
| L8 (Neural Gateway) | **Firewall location** | T001-T006, T013, T015, T022 |
| L9 (Signal Processing) | Signal analysis | T002, T004, T006, T007, T012-T015 |
| L10 (Neural Protocol) | Protocol security | T007, T008, T010, T012, T014, T023 |
| L11 (Cognitive Transport) | Data transport | T007-T011, T019, T023 |
| L12 (Cognitive Session) | Session security | T009, T011, T016, T017, T019, T020 |
| L13 (Semantic) | Intent interpretation | T009, T016-T021, T024 |
| L14 (Identity) | Identity protection | T016, T018, T021, T024 |

### Kohno Threat Taxonomy Mapping

| Kohno Category | CIA Property | ONI Techniques |
|----------------|--------------|----------------|
| **ALTERATION** | Integrity | T007, T008, T009, T020, T021 |
| **BLOCKING** | Availability | T019 |
| **EAVESDROPPING** | Confidentiality | T001, T002, T016, T017, T018 |

---

## Using This Framework

### For Security Researchers

1. Use technique IDs (ONI-T###) when documenting BCI vulnerabilities
2. Map discovered vulnerabilities to existing techniques or propose new ones
3. Reference the CIA impact ratings for risk assessment
4. Use the mitigations as a starting point for defensive research

### For BCI Developers

1. Review the mitigation recommendations for each technique
2. Implement detection methods appropriate to your device's capabilities
3. Prioritize defenses for Critical severity techniques
4. Consider the Layer Coverage Matrix when designing security architecture

### For Security Auditors

1. Use the tactic categories to structure penetration testing
2. Verify detection capabilities against listed detection methods
3. Assess mitigation implementation completeness
4. Report findings using ONI technique IDs

---

## Contributing

To propose new techniques or modifications:

1. Open an issue on the [ONI GitHub repository](https://github.com/qinnovates/mindloft)
2. Use the technique template format shown above
3. Include academic references where available
4. Map to existing frameworks (MITRE, Kohno, Yale) where applicable

---

## References

1. MITRE Corporation. (2024). *MITRE ATT&CK*. https://attack.mitre.org/
2. Kohno, T., et al. (2009). "Neurosecurity: Security and Privacy for Neural Devices." *Neurosurgical Focus*, 27(1).
3. Bonaci, T., et al. (2015). "App Stores for the Brain: Privacy & Security in BCIs." *IEEE S&P Workshop*.
4. Schroder, T., et al. (2025). "Cyber Risks to Next-Gen Brain-Computer Interfaces." *Neuroethics*.
5. Landau, O., et al. (2020). "Mind Your Privacy." *NDSS Workshop*.
6. FIRST. (2023). *Common Vulnerability Scoring System v4.0*. https://www.first.org/cvss/

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-25 | Initial release with 7 tactics, 21 techniques |
| 2.0.0 | 2026-01-30 | Expanded to 10 tactics, 46 techniques across L1-L14 |

---

*ONI Threat Matrix is part of the [ONI Framework](https://github.com/qinnovates/mindloft) — Open Neural Interface Security*
