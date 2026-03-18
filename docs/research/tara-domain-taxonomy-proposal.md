# TARA Domain Taxonomy Proposal: Sensory-Biological Reframe

**Document Type:** Architecture Proposal
**Version:** 0.1 DRAFT
**Date:** 2026-03-14
**Author:** Kevin L. Qi, Qinnovate
**Status:** Pending cross-AI review
**Classification:** ADOPTED — implemented 2026-03-17. Option C (Hybrid): QIF-Txxxx canonical + TARA-{DOMAIN}-{MODE}-{NNN} alias
**Connected:** Derivation Log Entry 92 (sensor hierarchy)

---

## 1. Motivation

TARA's current 16 tactic categories are organized by **attack method** (Neural Injection, Data Harvest, Cognitive Exploitation, etc.). This framing:

- Privileges the security perspective over the clinical perspective
- Creates artificial separation between techniques that affect the same biological system
- Makes it harder for clinicians to find relevant techniques
- Violates dual-use framing (Tennison & Moreno 2012) by leading with offense

**Proposed reframe:** Organize techniques by **biological domain** (what system is affected) with **three modes** (how it is affected). Security and clinical share one taxonomy.

## 2. Design Principles

1. **QIF-T IDs are permanent.** No renumbering. QIF-T0001 remains QIF-T0001 forever.
2. **TARA aliases are the clinical/dual-use layer.** Each technique gets a `tara_alias` field: `TARA-{DOMAIN}-{MODE}-{NNN}`.
3. **Two views, one dataset.** Security researchers use QIF-T numbers. Clinicians use TARA domain codes. Both resolve to the same entry in `qtara-registrar.json`.
4. **Domains are biological, not anatomical.** Organized by functional system (Vision, Motor, Memory), not brain region (V1, M1, hippocampus). A technique targeting V1 and LGN are both VIS.
5. **Modes describe the interaction, not the intent.** Reconnaissance/Manipulation/Disruption are neutral terms that work for both attack and therapy.

## 3. Domain Taxonomy (11 + 1)

| Code | Domain | Scope | Clinical Analog |
|------|--------|-------|-----------------|
| **VIS** | Vision | Visual cortex, retina, optic nerve, LGN, visual processing | Retinal/cortical prostheses, photobiomodulation |
| **AUD** | Audition | Auditory cortex, cochlea, auditory nerve, IC | Cochlear implants, auditory brainstem implants |
| **SOM** | Somatosensory | Touch, pain, temperature, proprioception, peripheral nerves | Spinal cord stimulation, pain management |
| **VES** | Vestibular | Balance, spatial orientation, semicircular canals, vestibular nuclei | Vestibular implants, GVS therapy |
| **MOT** | Motor | Voluntary movement, coordination, motor cortex, basal ganglia, cerebellum | DBS for Parkinson's, motor BCI (BrainGate, Neuralink) |
| **EMO** | Affect | Mood, fear, reward, motivation, amygdala, limbic, ACC, insula | DBS for depression, anxiety treatment |
| **COG** | Cognition | Attention, executive function, decision-making, prefrontal cortex | tDCS for cognitive enhancement, ADHD treatment |
| **MEM** | Memory | Encoding, consolidation, retrieval, hippocampus, entorhinal cortex | Hippocampal prosthesis (Berger/Deadwyler) |
| **LNG** | Language | Speech production, comprehension, Broca's, Wernicke's, arcuate | Speech BCI (Willett, Chang), aphasia treatment |
| **AUT** | Autonomic | Vital functions, HR, BP, respiration, sleep, neuroendocrine, brainstem | Vagus nerve stimulation, autonomic regulation |
| **IDN** | Identity | Psychological continuity, self-model, agency, narrative self, DMN | Psychedelic-assisted therapy, personality assessment |
| **SIL** | Silicon | Firmware, protocols, cloud, ML models, supply chain (no biological target) | Software/hardware security (traditional IT) |

## 4. Mode Taxonomy (3)

| Mode | Code | Security Reads As | Clinical Reads As | Example |
|------|------|-------------------|-------------------|---------|
| **Reconnaissance** | R | Reading/extracting/decoding from this system | Decoding/monitoring this function | EEG emotion detection, motor intent reading |
| **Manipulation** | M | Altering/modulating this system's output | Therapeutic modulation of this function | DBS for depression, tDCS for cognition |
| **Disruption** | D | Destroying/blocking this system's function | Ablating pathological circuits | RNS for epilepsy, lesioning for tremor |

**The boundary between attack and therapy is consent, dosage, and oversight — not the technique itself.**

## 5. Complete Mapping (111 Techniques)

### VIS — Vision (4 techniques)

| QIF-T ID | Attack Name | Mode | TARA Alias | Notes |
|----------|------------|------|------------|-------|
| QIF-T0085 | Eye tracking cognitive state inference | R | TARA-VIS-R-001 | Gaze → cognitive/personality inference |
| QIF-T0102 | Passive facial geometry estimation | R | TARA-VIS-R-002 | Display-as-illuminator inverse photometry |
| QIF-T0067 | Phase dynamics replay/mimicry | M | TARA-VIS-M-001 | Synthesized neural trajectories for sensory prosthetics |
| QIF-T0103 | SSVEP frequency hijack | M | TARA-VIS-M-002 | Display flicker → visual cortex phase-lock → BCI command injection |

**Gap: VIS-D (Disruption) — no vision-destroying techniques.** Visual cortex ablation or retinal damage via stimulation is feasible. Should be added.

### AUD — Audition (4 techniques)

| QIF-T ID | Attack Name | Mode | TARA Alias | Notes |
|----------|------------|------|------------|-------|
| QIF-T0080 | Gyroscope acoustic eavesdropping | R | TARA-AUD-R-001 | MEMS gyroscope speech capture |
| QIF-T0081 | Accelerometer speech reconstruction | R | TARA-AUD-R-002 | Surface-coupled vibration-to-audio |
| QIF-T0012 | Pulsed microwave (Frey effect) | M | TARA-AUD-M-001 | Thermoelastic auditory effect |
| QIF-T0100 | Neural steganographic encoding | M | TARA-AUD-M-002 | Inaudible audio → auditory nerve → cortex |

**Gap: AUD-D (Disruption) — no hearing-destroying techniques.** Acoustic trauma via earbuds or cochlear implant overstimulation is feasible.

### SOM — Somatosensory (9 techniques)

| QIF-T ID | Attack Name | Mode | TARA Alias | Notes |
|----------|------------|------|------------|-------|
| QIF-T0076 | Haptic motor body sonar | R | TARA-SOM-R-001 | Tissue impedance profiling |
| QIF-T0001 | Signal injection | M | TARA-SOM-M-001 | Electrode-tissue boundary; tDCS/tACS analog |
| QIF-T0005 | Quantum tunneling exploit | M | TARA-SOM-M-002 | Nanoscale electrode-tissue junction |
| QIF-T0006 | Davydov soliton attack | M | TARA-SOM-M-003 | Protein alpha-helix soliton propagation |
| QIF-T0104 | Neural spoofing | M | TARA-SOM-M-004 | Spoofed neural signals at I0-N1 |
| QIF-T0105 | Neural sybil | M | TARA-SOM-M-005 | Multiple fake identities at I0-N1 |
| QIF-T0107 | Neural nonce replay | M | TARA-SOM-M-006 | Replay attack at I0-N1 |
| QIF-T0015 | Directed energy (thermal I0 damage) | D | TARA-SOM-D-001 | Focused EM thermal damage |
| QIF-T0106 | Neural sinkhole | D | TARA-SOM-D-002 | Signal absorption at I0-N2 |

### VES — Vestibular (0 current → 5 proposed)

**EMPTY DOMAIN — critical gap now being filled.**

Galvanic vestibular stimulation (GVS) is clinically established, militarily researched, and directly relevant to BCI security. This is not theoretical — the technology exists, is funded, and has published results.

**Key evidence:**

1. **Lockheed Martin Advanced Technology Labs** actively researches GVS for military training. Their published work demonstrates:
   - GVS can make someone feel motion when stationary (flight illusions in VR simulation)
   - GVS can accelerate motor learning (astronauts, soldiers, athletes)
   - GVS can induce spatial disorientation for training purposes
   - Source: [Lockheed Martin GVS](https://www.lockheedmartin.com/en-us/capabilities/research-labs/advanced-technology-labs/gvs.html)

2. **Cochlear implants already cause vestibular disruption** as a documented adverse effect. All subjects with cochlear stimulators showed abnormal postural stability, with instability *increasing* when stimulation was active (PubMed: 310472). This is an existing, deployed medical device causing vestibular side effects — the attack surface already exists.

3. **GVS parameter research** is extensive. A 2025 systematic review covers clinical parameter settings for GVS across multiple applications (Frontiers in Human Neuroscience, 2025). The physics is well-characterized.

4. **Flight illusion induction** via GVS in VR has been demonstrated (Frontiers in Neuroergonomics, 2022; PMC: 10790896). Intentionally mismatched GVS significantly affects motion perception.

**Proposed VES techniques (to be added as QIF-T0110–T0114):**

| Proposed ID | Attack Name | Mode | TARA Alias | Drift | Mechanism | Clinical Analog | Evidence |
|-------------|------------|------|------------|-------|-----------|-----------------|----------|
| QIF-T0110 | Vestibular balance profiling | R | TARA-VES-R-001 | A | GVS perturbation response measurement to map individual vestibular sensitivity | Vestibular function testing (caloric, rotary chair) | Established clinical practice |
| QIF-T0111 | GVS motion illusion injection | M | TARA-VES-M-001 | A | Supra-threshold GVS current via hijacked BCI/cochlear implant electrodes to induce false motion perception | GVS for spatial disorientation training (Lockheed Martin); vestibular rehabilitation | Demonstrated (Lockheed Martin, Frontiers 2022) |
| QIF-T0112 | Vestibular-ocular reflex manipulation | M | TARA-VES-M-002 | A | Targeted GVS to disrupt VOR, causing nystagmus and visual instability | VOR suppression therapy for motion sickness | Established physiology |
| QIF-T0113 | Cochlear-vestibular crosstalk exploitation | M | TARA-VES-M-003 | C | Exploiting cochlear implant current spread to adjacent vestibular structures | Documented CI adverse effect (PubMed: 310472) | Verified — observed in all CI subjects |
| QIF-T0114 | Vestibular overload (vertigo induction) | D | TARA-VES-D-001 | A | Sustained high-amplitude bilateral GVS exceeding vestibular compensation limits; acute vertigo, nausea, fall risk | Caloric vestibular testing (diagnostic) | Established physiology; safety limits documented |

### MOT — Motor (7 techniques)

| QIF-T ID | Attack Name | Mode | TARA Alias | Notes |
|----------|------------|------|------------|-------|
| QIF-T0088 | Gait biometric identification | R | TARA-MOT-R-001 | Walking pattern fingerprint |
| QIF-T0089 | Tremor/movement neurological profiling | R | TARA-MOT-R-002 | Motor disorder detection from IMU |
| QIF-T0008 | Command hijacking | M | TARA-MOT-M-001 | Motor/sensory command substitution |
| QIF-T0030 | Motor hijacking | M | TARA-MOT-M-002 | Involuntary movement via motor cortex BCI |
| QIF-T0002 | Neural ransomware | D | TARA-MOT-D-001 | Locks neural function via DBS/RNS manipulation |
| QIF-T0023 | Closed-loop perturbation cascade | D | TARA-MOT-D-002 | Cascading perturbation in closed-loop stimulation |
| QIF-T0029 | Neural DoS (stimulation flood) | D | TARA-MOT-D-003 | Sustained high-rate stimulation |

**Multi-domain technique (MOT/COG/EMO — target depends on pathway exploited):**

| Proposed ID | Name | Domain | Mode | Drift | Mechanism | Clinical Analog |
|-------------|------|--------|------|-------|-----------|-----------------|
| QIF-T0135 | Neural pathway chaining (off-target propagation exploitation) | COG | M | L | Exploiting known anatomical connectivity to reach brain regions beyond electrode's direct range; device stimulates area A, current propagates through axonal projections to affect area B | DBS off-target effects (STN→limbic current spread causing depression/mania) |

**Note:** QIF-T0135 is multi-domain by nature. The primary domain depends on which pathway is exploited — STN→limbic = EMO, STN→prefrontal = COG, cortical→subcortical = MOT. Listed here as COG primary but should carry `tara_domain_secondary: ["MOT", "EMO"]` in the registrar.

### EMO — Affect (1 technique)

| QIF-T ID | Attack Name | Mode | TARA Alias | Notes |
|----------|------------|------|------------|-------|
| QIF-T0092 | Thermal facial stress/emotion inference | R | TARA-EMO-R-001 | Autonomic → emotional state inference |

**Gap filled with proposed techniques:**

| Proposed ID | Name | Mode | TARA Alias | Drift | Mechanism | Clinical Analog |
|-------------|------|------|------------|-------|-----------|-----------------|
| QIF-T0116 | Progressive reward pathway desensitization | M | TARA-EMO-M-001 | C | Gradual dopaminergic modulation shifting baseline reward sensitivity | DBS impulse control disorders (STN); behavioral addiction treatment |
| QIF-T0119 | Delayed emotional baseline shift | M | TARA-EMO-M-002 | L | Calibration bias propagating through limbic circuits over weeks/months | DBS-induced depression/mania appearing months post-programming |
| QIF-T0127 | Acute fear circuit activation | M | TARA-EMO-M-003 | A | Direct amygdala stimulation via implanted electrodes; immediate fear/panic response | Amygdala stimulation studies (Lanteaume et al. 2007); fear conditioning research |
| QIF-T0128 | Hedonic tone suppression | M | TARA-EMO-M-004 | C | Sustained modulation of nucleus accumbens / ventral striatum reducing pleasure response over weeks | DBS for OCD (ventral capsule/striatum); anhedonia as DBS adverse effect |
| QIF-T0129 | Emotional flooding (affect overload) | D | TARA-EMO-D-001 | A | High-amplitude limbic stimulation overwhelming emotional regulation capacity; acute emotional crisis | ECT-induced confusion; DBS-induced mania at high voltage |
| QIF-T0130 | Empathy circuit disruption | D | TARA-EMO-D-002 | C | Sustained interference with insula-ACC-prefrontal empathy network; patient gradually loses affective empathy while retaining cognitive empathy | Lesion studies of insula/ACC; psychopathy neuroscience literature |

**EMO now: 1 → 7 techniques (1R, 4M, 2D). All modes covered.**

### Reclassification from COG to EMO (dual-domain)

Several techniques currently classified as COG-primary have EMO as the actual primary target:

| Current ID | Name | Current Domain | Reclassify To | Rationale |
|------------|------|---------------|---------------|-----------|
| QIF-T0040 | Neurophishing | COG | EMO primary, COG secondary | Trust manipulation targets emotional circuits (amygdala/insula) before cognitive processing |
| QIF-T0065 | Algorithmic psychosis induction | COG-D | EMO-D primary, COG-D secondary | Psychotic-like states are fundamentally affective/perceptual, not purely cognitive |

These two techniques move from COG to EMO as primary domain, reducing COG from 29 → 27 and increasing EMO from 7 → 9.

### LNG — Language (1 → 4 techniques)

| QIF-T ID | Attack Name | Mode | TARA Alias | Notes |
|----------|------------|------|------------|-------|
| QIF-T0036 | Thought decoding (covert speech) | R | TARA-LNG-R-001 | Internal speech decoding from neural activity |

**Gap filled:**

| Proposed ID | Name | Mode | TARA Alias | Drift | Mechanism | Clinical Analog |
|-------------|------|------|------------|-------|-----------|-----------------|
| QIF-T0118 | Cumulative speech degradation | D | TARA-LNG-D-001 | C | Sustained stimulation near Broca's area causing progressive dysarthria | DBS dysarthria worsening at 1-3yr follow-up (PubMed: 32955467) |
| QIF-T0131 | Speech production hijacking | M | TARA-LNG-M-001 | A | Direct stimulation of speech motor cortex forcing vocalization or suppressing speech | Intraoperative cortical stimulation mapping; Penfield's speech arrest studies |
| QIF-T0132 | Comprehension interference | M | TARA-LNG-M-002 | A | Wernicke's area stimulation disrupting language comprehension; patient hears words but cannot extract meaning | Wada testing; DBS-induced word-finding difficulty; receptive aphasia literature |

**LNG now: 1 → 4 techniques (1R, 2M, 1D). All modes covered.**

### VIS — Vision (4 → 5 techniques, gap: VIS-D filled)

| Proposed ID | Name | Mode | TARA Alias | Drift | Mechanism | Clinical Analog |
|-------------|------|------|------------|-------|-----------|-----------------|
| QIF-T0133 | Visual cortex overstimulation | D | TARA-VIS-D-001 | A | Excessive current through visual cortex electrodes exceeding tissue safety limits; acute cortical blindness in stimulated region | Cortical stimulation safety limits (Shannon limit); phototoxicity from optogenetic overstimulation |

### AUD — Audition (4 → 5 techniques, gap: AUD-D filled)

| Proposed ID | Name | Mode | TARA Alias | Drift | Mechanism | Clinical Analog |
|-------------|------|------|------------|-------|-----------|-----------------|
| QIF-T0134 | Cochlear implant overstimulation | D | TARA-AUD-D-001 | A | Excessive current through cochlear electrode array causing hair cell damage or auditory nerve trauma; permanent hearing loss in stimulated frequency bands | CI device failure modes; acoustic trauma; documented CI vestibular adverse effects (PubMed: 310472) |

### MEM — Memory (3 → 4 techniques, gap: MEM-D filled)

Already proposed as QIF-T0117 in Section 9.1:

| QIF-T0117 | Incremental memory consolidation interference | D | TARA-MEM-D-001 | C | Repeated hippocampal sharp-wave ripple disruption during sleep | Sleep-dependent memory consolidation research |

### COG — Cognition (29 → 27 techniques after reclassification)

Two techniques reclassified to EMO-primary (T0040, T0065). COG drops to 27 — still the largest domain but below the proposed 35-technique split threshold.

### Updated Distribution Summary

| Domain | Before | After | R | M | D |
|--------|--------|-------|---|---|---|
| VIS | 4 | 5 | 2 | 2 | 1 |
| AUD | 4 | 5 | 2 | 2 | 1 |
| SOM | 9 | 9 | 1 | 6 | 2 |
| VES | 0 | 5 | 1 | 3 | 1 |
| MOT | 7 | 8 | 2 | 3 | 3 |
| EMO | 1 | 9 | 1 | 5 | 3 |
| COG | 29 | 27 | 12 | 11 | 4 |
| MEM | 3 | 4 | 1 | 2 | 1 |
| LNG | 1 | 4 | 1 | 2 | 1 |
| AUT | 9 | 11 | 7 | 2 | 2 |
| IDN | 8 | 10 | 5 | 3 | 2 |
| SIL | 36 | 36 | 15 | 19 | 2 |
| **TOTAL** | **111** | **133** | **50** | **60** | **23** |

**Every domain now has all three modes covered.** Zero gaps remain in the domain × mode matrix.

### COG — Cognition (29 → 27 techniques after reclassification)

| QIF-T ID | Attack Name | Mode | TARA Alias |
|----------|------------|------|------------|
| QIF-T0003 | Eavesdropping / signal interception | R | TARA-COG-R-001 |
| QIF-T0027 | Neuronal scanning | R | TARA-COG-R-002 |
| QIF-T0035 | P300 interrogation | R | TARA-COG-R-003 |
| QIF-T0041 | Cognitive biometric inference | R | TARA-COG-R-004 |
| QIF-T0051 | Neural data privacy breach | R | TARA-COG-R-005 |
| QIF-T0052 | ERP harvesting | R | TARA-COG-R-006 |
| QIF-T0053 | Cognitive state capture | R | TARA-COG-R-007 |
| QIF-T0056 | Neuro-surveillance | R | TARA-COG-R-008 |
| QIF-T0073 | Ear-canal neural eavesdropping | R | TARA-COG-R-009 |
| QIF-T0074 | Cognitive inference from in-ear EEG | R | TARA-COG-R-010 |
| QIF-T0095 | Acoustic-to-neural profiling pipeline | R | TARA-COG-R-011 |
| QIF-T0099 | Consumer-sensor-to-BCI kill chain | R | TARA-COG-R-012 |
| QIF-T0009 | RF false brainwave injection | M | TARA-COG-M-001 |
| QIF-T0010 | ELF neural entrainment | M | TARA-COG-M-002 |
| QIF-T0011 | Intermodulation | M | TARA-COG-M-003 |
| QIF-T0013 | Temporal interference (deep targeting) | M | TARA-COG-M-004 |
| QIF-T0014 | Envelope modulation (stealth carrier) | M | TARA-COG-M-005 |
| QIF-T0022 | Neurofeedback falsification | M | TARA-COG-M-006 |
| QIF-T0040 | Neurophishing | M | TARA-COG-M-007 |
| QIF-T0059 | Pattern lock | M | TARA-COG-M-008 |
| QIF-T0062 | Gradual drift | M | TARA-COG-M-009 |
| QIF-T0064 | User consent fatigue | M | TARA-COG-M-010 |
| QIF-T0066 | Slow drift / boiling frog | M | TARA-COG-M-011 |
| QIF-T0025 | Neuronal jamming | D | TARA-COG-D-001 |
| QIF-T0026 | Neuronal flooding | D | TARA-COG-D-002 |
| QIF-T0055 | BCI cognitive warfare | D | TARA-COG-D-003 |
| QIF-T0065 | Algorithmic psychosis induction | D | TARA-COG-D-004 |

**Note:** COG has 29 techniques (27% of total). Consider future split into COG-ATT (attention), COG-EXE (executive), COG-PER (perception) if the domain grows beyond ~35 techniques.

### MEM — Memory (3 techniques)

| QIF-T ID | Attack Name | Mode | TARA Alias | Notes |
|----------|------------|------|------------|-------|
| QIF-T0054 | Memory extraction | R | TARA-MEM-R-001 | Extracting episodic/semantic memory patterns |
| QIF-T0034 | Working memory poisoning | M | TARA-MEM-M-001 | Disrupting WM maintenance oscillations |
| QIF-T0060 | Memory implant | M | TARA-MEM-M-002 | Persistent information during consolidation |

**Gap: MEM-D (Disruption) — no memory destruction techniques.** Hippocampal disruption causing amnesia is feasible and clinically documented (DBS adverse effects).

### LNG — Language (1 technique)

| QIF-T ID | Attack Name | Mode | TARA Alias | Notes |
|----------|------------|------|------------|-------|
| QIF-T0036 | Thought decoding (covert speech) | R | TARA-LNG-R-001 | Internal speech decoding from neural activity |

**Critical gap: LNG-M and LNG-D are empty.** DBS literature documents dysarthria and word-finding problems as adverse effects. Speech production disruption (Broca's area interference) and comprehension manipulation (Wernicke's) are plausible techniques.

### AUT — Autonomic (9 techniques)

| QIF-T ID | Attack Name | Mode | TARA Alias | Notes |
|----------|------------|------|------------|-------|
| QIF-T0075 | Ultrasonic sonar vital sign extraction | R | TARA-AUT-R-001 | Cardiac/respiratory Doppler |
| QIF-T0077 | IR vascular mapping via Face ID | R | TARA-AUT-R-002 | NIR hemoglobin absorption |
| QIF-T0078 | LiDAR remote pulse detection | R | TARA-AUT-R-003 | Cardiac waveform via laser Doppler |
| QIF-T0084 | Remote photoplethysmography | R | TARA-AUT-R-004 | Camera-based pulse/SpO2 |
| QIF-T0090 | WiFi CSI passive body sensing | R | TARA-AUT-R-005 | Through-wall vital signs |
| QIF-T0093 | PPG pulse waveform biometric ID | R | TARA-AUT-R-006 | Cardiac waveform as biometric |
| QIF-T0097 | Cross-device physiological correlation | R | TARA-AUT-R-007 | Multi-device health profiling |
| QIF-T0070 | Integrator/resonator type switching | M | TARA-AUT-M-001 | Neuron computational mode switching |
| QIF-T0068 | Bifurcation forcing | D | TARA-AUT-D-001 | Forcing neural state transitions; seizure-like |

### IDN — Identity (8 techniques)

| QIF-T ID | Attack Name | Mode | TARA Alias | Notes |
|----------|------------|------|------------|-------|
| QIF-T0038 | Brainprint theft | R | TARA-IDN-R-001 | Neural identity signature extraction |
| QIF-T0069 | Separatrix leakage | R | TARA-IDN-R-002 | Identity from dynamical transitions |
| QIF-T0079 | Ear canal acoustic fingerprinting | R | TARA-IDN-R-003 | Acoustic transfer function biometric |
| QIF-T0096 | Multi-modal biometric fusion | R | TARA-IDN-R-004 | Cross-sensor biometric fusion |
| QIF-T0032 | Identity spoofing | M | TARA-IDN-M-001 | Neural biometric impersonation |
| QIF-T0033 | Identity erosion | M | TARA-IDN-M-002 | Long-term personality drift |
| QIF-T0037 | Agency manipulation | M | TARA-IDN-M-003 | Sense of agency/ownership |
| QIF-T0039 | Self-model corruption | D | TARA-IDN-D-001 | Body ownership, self-awareness disruption |

### SIL — Silicon (36 techniques)

| QIF-T ID | Attack Name | Mode | TARA Alias |
|----------|------------|------|------------|
| QIF-T0004 | Man-in-the-middle | R | TARA-SIL-R-001 |
| QIF-T0020 | Membership inference | R | TARA-SIL-R-002 |
| QIF-T0021 | Federated gradient leakage | R | TARA-SIL-R-003 |
| QIF-T0042 | BLE/RF side-channel | R | TARA-SIL-R-004 |
| QIF-T0045 | Harvest-now-decrypt-later | R | TARA-SIL-R-005 |
| QIF-T0057 | Network mapping | R | TARA-SIL-R-006 |
| QIF-T0072 | Transducer inversion | R | TARA-SIL-R-007 |
| QIF-T0082 | Ultrasonic cross-device tracking | R | TARA-SIL-R-008 |
| QIF-T0083 | Acoustic keystroke inference | R | TARA-SIL-R-009 |
| QIF-T0086 | Ambient light sensor side-channel | R | TARA-SIL-R-010 |
| QIF-T0087 | Accelerometer keystroke inference | R | TARA-SIL-R-011 |
| QIF-T0091 | BLE physical-layer fingerprinting | R | TARA-SIL-R-012 |
| QIF-T0094 | Magnetometer speaker-leakage | R | TARA-SIL-R-013 |
| QIF-T0098 | WiFi + camera surveillance fusion | R | TARA-SIL-R-014 |
| QIF-T0101 | Multi-modal keystroke inference | R | TARA-SIL-R-015 |
| QIF-T0007 | Protocol manipulation | M | TARA-SIL-M-001 |
| QIF-T0016 | Professor X backdoor | M | TARA-SIL-M-002 |
| QIF-T0017 | Transfer learning backdoor | M | TARA-SIL-M-003 |
| QIF-T0018 | Adversarial filter attack | M | TARA-SIL-M-004 |
| QIF-T0019 | Universal adversarial perturbation | M | TARA-SIL-M-005 |
| QIF-T0024 | Training data poisoning | M | TARA-SIL-M-006 |
| QIF-T0028 | Neural selective forwarding | M | TARA-SIL-M-007 |
| QIF-T0043 | Supply chain compromise | M | TARA-SIL-M-008 |
| QIF-T0044 | Cloud infrastructure attack | M | TARA-SIL-M-009 |
| QIF-T0046 | OTA firmware weaponization | M | TARA-SIL-M-010 |
| QIF-T0048 | Electrode compromise | M | TARA-SIL-M-011 |
| QIF-T0049 | Wireless authentication bypass | M | TARA-SIL-M-012 |
| QIF-T0050 | Hardware fault injection | M | TARA-SIL-M-013 |
| QIF-T0058 | Calibration poisoning | M | TARA-SIL-M-014 |
| QIF-T0061 | Coherence mimicry | M | TARA-SIL-M-015 |
| QIF-T0063 | Noise injection (detection masking) | M | TARA-SIL-M-016 |
| QIF-T0071 | Baseline adaptation poisoning | M | TARA-SIL-M-017 |
| QIF-T0108 | Neuromorphic mimicry attack | M | TARA-SIL-M-018 |
| QIF-T0109 | Data alignment exploitation | M | TARA-SIL-M-019 |
| QIF-T0031 | Battery drain attack | D | TARA-SIL-D-001 |
| QIF-T0047 | Mass BCI compromise | D | TARA-SIL-D-002 |

## 6. Gap Analysis

### Domain-Mode Coverage (ALL GAPS FILLED)

All 11 biological domains now have R, M, and D coverage. Original gaps and how they were filled:

| Domain | Was Missing | Filled By | Techniques Added |
|--------|-----------|-----------|-----------------|
| **VES** | R, M, D (all) | T0110-T0114 (GVS-based) | 5 |
| **EMO** | M, D | T0116, T0119, T0127-T0130 + reclassified T0040, T0065 | 8 |
| **LNG** | M, D | T0118, T0131, T0132 | 3 |
| **VIS** | D | T0133 (cortical overstimulation) | 1 |
| **AUD** | D | T0134 (cochlear overstimulation) | 1 |
| **MEM** | D | T0117 (consolidation interference) | 1 |

### Overloaded Domains

| Domain | Count | Recommendation |
|--------|-------|----------------|
| **COG** | 29 | Monitor. If it exceeds ~35, consider splitting into COG-ATT (attention), COG-EXE (executive), COG-PER (perception) |
| **SIL** | 36 | Acceptable. Silicon attacks are well-understood via traditional IT security frameworks |

### Techniques Needing Enrichment

QIF-T0104 through QIF-T0107 have incomplete TARA enrichment (no mechanism, therapeutic analog, or dual_use classification). Domain assignments are provisional.

## 7. Distribution Summary

| Domain | Total | R | M | D |
|--------|-------|---|---|---|
| VIS | 4 | 2 | 2 | 0 |
| AUD | 4 | 2 | 2 | 0 |
| SOM | 9 | 1 | 6 | 2 |
| VES | 0 → 5 | 0 → 1 | 0 → 3 | 0 → 1 |
| MOT | 7 | 2 | 2 | 3 |
| EMO | 1 | 1 | 0 | 0 |
| COG | 29 (27 after reclassification of T0040, T0065 to EMO) | 12 | 11 | 4 |
| MEM | 3 | 1 | 2 | 0 |
| LNG | 1 | 1 | 0 | 0 |
| AUT | 9 | 7 | 1 | 1 |
| IDN | 8 | 4 | 3 | 1 |
| SIL | 36 | 15 | 19 | 2 |
| **TOTAL** | **111** | **48** | **48** | **13** |

## 8. Scalability Considerations

### Adding New Techniques

New techniques slot in as: `TARA-{DOMAIN}-{MODE}-{next_number}`. QIF-T numbers continue sequentially (QIF-T0110, QIF-T0111...). No renumbering ever.

### Adding New Domains

If a new biological domain is identified (unlikely given neuroscience coverage), it gets a 3-letter code and inserts into the table. No existing IDs change.

### Splitting Overloaded Domains

If COG exceeds ~35 techniques, split into sub-domains with 6-letter codes: `TARA-COGATT-R-001`. Parent domain `COG` becomes an alias that includes all sub-domains.

### Multi-Domain Techniques

Some techniques genuinely span multiple domains. The registrar supports this via:
- `tara_domain_primary`: the main domain
- `tara_domain_secondary`: array of secondary domains
- The technique appears in the primary domain's listing and is cross-referenced in secondary domains

### Drift Metadata

Every technique gets a `tara_drift` field describing its temporal onset behavior:

```
tara_drift: A | C | L | P
  A = Acute       — immediate onset, immediate offset
  C = Cumulative   — builds over repeated exposure
  L = Latent       — delayed onset (hours to months)
  P = Persistent   — continues/worsens after exposure stops
```

Plus `tara_drift_window` for the expected timeframe (e.g., "weeks to months", "immediate", ">1 year").

Drift is a technique characteristic, not an impact score. It lives in TARA, not NISS. NISS scores single-event impact; drift describes how the technique behaves over time.

## 9. Slow & Persistent Attack Patterns (New Techniques)

The drift field reveals a class of techniques that single-event scoring misses: attacks that individually score low but compound into high-severity outcomes. These are the hardest to detect, attribute, and stop.

### 9.1 Cumulative Techniques (Drift: C)

| Proposed ID | Name | Domain | Mode | TARA Alias | Drift | Mechanism | Clinical Analog |
|-------------|------|--------|------|------------|-------|-----------|-----------------|
| QIF-T0115 | Chronic sub-threshold neural conditioning | SOM | M | TARA-SOM-M-007 | C | Repeated low-amplitude stimulation below detection threshold; individually benign, cumulatively alters neural excitability thresholds | Chronic tDCS protocols; long-term DBS tissue effects |
| QIF-T0116 | Progressive reward pathway desensitization | EMO | M | TARA-EMO-M-001 | C | Gradual dopaminergic modulation over weeks/months; shifts baseline reward sensitivity without acute symptoms | DBS impulse control disorders (STN stimulation); behavioral addiction literature |
| QIF-T0117 | Incremental memory consolidation interference | MEM | D | TARA-MEM-D-001 | C | Repeated disruption of hippocampal sharp-wave ripples during sleep over multiple nights; individually causes minor next-day forgetfulness, cumulatively degrades consolidation capacity | Sleep-dependent memory research (Born et al.); RNS hippocampal stimulation |
| QIF-T0118 | Cumulative speech degradation | LNG | D | TARA-LNG-D-001 | C | Sustained stimulation near Broca's area over months causes progressive dysarthria; each session produces barely noticeable speech changes that compound | DBS dysarthria (STN/GPi); documented in systematic reviews as worsening at 1-3 year follow-up |

### 9.2 Latent Techniques (Drift: L)

| Proposed ID | Name | Domain | Mode | TARA Alias | Drift | Mechanism | Clinical Analog |
|-------------|------|--------|------|------------|-------|-----------|-----------------|
| QIF-T0119 | Delayed emotional baseline shift | EMO | M | TARA-EMO-M-002 | L | BCI calibration bias introduced during setup; manifests as mood changes weeks to months later as the neural adaptation to biased parameters propagates through limbic circuits | DBS-induced depression/mania appearing months post-programming |
| QIF-T0120 | Latent cognitive decline via chronic electrode micromotion | COG | D | TARA-COG-D-005 | L | Electrode micromotion causes gradual glial scarring at I0; impedance increases over months, requiring higher stimulation amplitudes, which eventually cross tissue damage thresholds | Long-term DBS cognitive decline >2 years post-surgery (PubMed: 28678830) |
| QIF-T0121 | Sleep architecture manipulation | AUT | M | TARA-AUT-M-002 | L | Subtle disruption of sleep staging (suppressing N3 deep sleep) over weeks; patient reports daytime fatigue but doesn't connect it to the BCI; cognitive and immune effects emerge over months | Closed-loop sleep stimulation research; sleep deprivation cognitive impairment literature |

### 9.3 Persistent Techniques (Drift: P)

| Proposed ID | Name | Domain | Mode | TARA Alias | Drift | Mechanism | Clinical Analog |
|-------------|------|--------|------|------------|-------|-----------|-----------------|
| QIF-T0122 | Kindling-induced epileptogenic focus | AUT | D | TARA-AUT-D-002 | P | Repeated sub-seizure electrical stimulation creates a permanent epileptogenic focus that generates seizures even after stimulation stops; the brain has been permanently rewired to seize | Kindling model (Goddard 1967); stimulation-induced seizures in DBS/RNS literature |
| QIF-T0123 | Permanent motor pathway rerouting | MOT | M | TARA-MOT-M-003 | P | Sustained stimulation forces motor commands through alternative pathways; after months, neuroplastic changes make the rerouting permanent even without continued stimulation | Constraint-induced movement therapy; motor cortex reorganization post-stroke |
| QIF-T0124 | Identity narrative fragmentation | IDN | D | TARA-IDN-D-002 | P | Long-term subtle manipulation of self-referential processing (DMN interference) during rest states; patient gradually loses coherent self-narrative; effect persists because the narrative itself is the substrate that was damaged | DBS-induced personality changes; depersonalization literature; philosophical work on narrative identity |

### 9.4 Brute-Force Reconnaissance (Drift: C)

| Proposed ID | Name | Domain | Mode | TARA Alias | Drift | Mechanism | Clinical Analog |
|-------------|------|--------|------|------------|-------|-----------|-----------------|
| QIF-T0125 | Longitudinal neural fingerprint extraction | IDN | R | TARA-IDN-R-005 | C | Repeated low-level probing over weeks to incrementally build a complete neural identity profile; each probe captures a partial fingerprint; full profile only emerges from aggregation | Longitudinal EEG biometric studies; Finn et al. (2015) functional connectome fingerprinting |
| QIF-T0126 | Progressive sensory response mapping | VIS | R | TARA-VIS-R-003 | C | Systematic presentation of varied visual stimuli over sessions to map the patient's complete visual processing characteristics; no single session reveals enough to be useful | Visual evoked potential mapping; SSVEP-based BCI calibration |

### 9.5 Why This Matters

The drift field exposes a pattern invisible to single-event scoring:

```
Single event:   QIF-T0115 → NISS: BI:L, CD:L → Score: ~3.0 (Low)
After 200x:     Same technique → NISS: BI:H, CD:H → Score: ~7.0 (High)
```

Without drift metadata, both look like the same technique at different severity. With `tara_drift: C`, the taxonomy explicitly warns: **this technique's impact is a function of exposure count, not single-event parameters.** That changes monitoring requirements, consent obligations, and detection strategy.

A security team sees: "filter all drift:C techniques — these need continuous monitoring, not point-in-time assessment."
A clinical team sees: "filter all drift:C techniques — these need longitudinal follow-up protocols, not single-visit evaluation."

Same data, same filter, two contexts. That's the dual atlas working.

### 9.6 Drift as Dual-Use: Persistence Enables Both Harm and Healing

The drift dimension is where the dual-use principle is most visible. The same persistence mechanism that makes cumulative attacks dangerous is exactly what makes cumulative therapy effective. The boundary is consent, dosage, and oversight.

**Vision prosthesis example — drift:C as therapeutic asset:**

A retinal or cortical prosthesis doesn't restore vision in one session. It's inherently cumulative:

1. **Session 1:** Patient perceives crude phosphene patterns. No useful vision. (Individually: low value)
2. **Sessions 1-50:** Brain gradually learns to interpret stimulation patterns as spatial information. Cortical plasticity reorganizes V1 receptive fields around the electrode array.
3. **Sessions 50-200:** Patient begins reliably navigating with prosthesis. Can identify guide dog, doorways, obstacles. Phosphene map stabilizes.
4. **Session 200+:** Persistent — neural reorganization is now structural. Patient's visual cortex has permanently adapted to the prosthesis input.

This is `tara_drift: C → P` (cumulative becoming persistent). In the threat view, that's terrifying — an attacker who corrupts the calibration during the learning phase (sessions 1-50) can permanently alter what the patient perceives. The brain will structurally encode the corrupted mapping.

In the clinical view, that same persistence is the entire therapeutic mechanism — the brain MUST permanently rewire for the prosthesis to work. You want drift:P. You're engineering it deliberately.

**The TARA dual atlas makes this explicit:**

| Technique | Security View | Clinical View | Drift |
|-----------|--------------|---------------|-------|
| QIF-T0115 (chronic sub-threshold conditioning) | Covert neural excitability manipulation | tDCS therapeutic protocol for depression | C |
| QIF-T0123 (motor pathway rerouting) | Forced motor reorganization | Constraint-induced movement therapy for stroke recovery | P |
| Prosthesis calibration over months | Calibration poisoning window | Essential learning period for cortical adaptation | C→P |
| QIF-T0116 (reward desensitization) | Dopaminergic manipulation for control | DBS for OCD/addiction — intentional desensitization | C |

**The insight:** Every persistent therapeutic technique has a persistent attack analog. The taxonomy doesn't hide this — it surfaces it, so governance can address it. A clinician designing a prosthesis calibration protocol can look at the same drift:C techniques and ask: "what monitoring do we need during this learning window to ensure nobody is corrupting the calibration?"

That's the dual atlas doing what it's designed to do: same data, same structure, two lenses — one for building, one for defending.

## 10. Registrar Schema v2

### 10.1 Field Rename: `attack` → `technique`

The field `attack` is renamed to `technique` across the entire system. This is the foundational dual-use change — a taxonomy that calls everything an "attack" cannot serve clinicians.

Every technique also gets a `technique_clinical` field — the clinical-facing name:

| Security Name (`technique`) | Clinical Name (`technique_clinical`) |
|-----|-----|
| Signal injection | Electrode-tissue current delivery |
| Neural ransomware | Therapeutic parameter lockout |
| Motor hijacking | Involuntary motor activation |
| Thought decoding (covert speech) | Covert speech neural decoding |
| Memory implant | Memory encoding augmentation |
| Neurophishing | Trust-mediated behavioral manipulation |
| Algorithmic psychosis induction | Content-driven perceptual disturbance |
| BCI cognitive warfare | Population-scale cognitive manipulation |
| Neural sybil | Multi-identity interface signal spoofing |
| Neural sinkhole | Interface signal absorption |
| Neural nonce replay | Interface signal replay |
| Neural DoS (stimulation flood) | Stimulation amplitude saturation |
| Professor X backdoor | Pre-trained model trojan insertion |
| Brainprint theft | Neural identity signature extraction |
| Identity erosion | Long-term personality drift |
| Self-model corruption | Body ownership disruption |
| P300 interrogation | Event-related potential cognitive probing |
| Neuronal jamming | Broadband neural interference |
| Neuronal flooding | Excessive stimulation current delivery |

The `attack` field is deprecated but kept as an alias for backward compatibility. All new code references `technique`.

### 10.2 Complete Technique Entry Schema (v2)

```json
{
  // ═══ IDENTITY ═══
  "id": "QIF-T0001",
  "technique": "Signal injection at electrode-tissue boundary",
  "technique_clinical": "Electrode-tissue current delivery",
  "tactic": "QIF-N.IJ",
  "attack": "Signal injection",  // DEPRECATED alias — kept for backward compat

  // ═══ TARA DOMAIN TAXONOMY (NEW) ═══
  "tara_alias": "TARA-SOM-M-001",
  "tara_domain_primary": "SOM",
  "tara_domain_secondary": ["MOT"],
  "tara_mode": "M",
  "tara_drift": "A",
  "tara_drift_window": "immediate",
  "tara_direction": "afferent",
  "use_context_tags": ["therapeutic", "offensive"],
  "biological_target": true,

  // ═══ HOURGLASS POSITION ═══
  "bands": ["I0", "N1"],

  // ═══ VALIDATION & EVIDENCE (ENHANCED) ═══
  "status": "CONFIRMED",
  "evidence": {
    "tier": "demonstrated_poc",
    "sources": [
      {"doi": "10.xxxx/yyyy", "type": "journal", "verified": "2026-03-14"},
      {"pmid": "12345", "type": "pubmed", "verified": "2026-03-14"}
    ],
    "study_designs": ["proof-of-concept", "in-vitro"],
    "last_verified": "2026-03-14",
    "confidence_note": "Demonstrated in lab settings with animal models"
  },

  // ═══ SCORING (UNCHANGED) ═══
  "niss": {
    "vector": "NISS:2.1/BI:H/CR:H/CD:H/CV:E/RV:P/NP:T",
    "score": 6.02,
    "severity": "medium",
    "pins": true
  },
  "cvss": {
    "base_vector": "CVSS:4.0/AV:P/AC:L/AT:P/PR:L/UI:N/VC:L/VI:H/VA:H/SC:N/SI:H/SA:L",
    "gap_group": "neural_tissue_damage"
  },

  // ═══ DETECTION & DEFENSE (NEW) ═══
  "detection": {
    "methods": [
      "Impedance monitoring at electrode-tissue interface",
      "Stimulation parameter audit logging",
      "Coherence metric (Cs) anomaly detection"
    ],
    "data_sources": [
      "Device telemetry logs",
      "Neural signal baseline comparison",
      "Patient-reported symptom diary"
    ],
    "indicators": [
      "Unexpected impedance changes at I0",
      "Stimulation parameters outside prescribed range",
      "Cs score deviation > 2σ from baseline"
    ]
  },
  "mitigations": {
    "controls": [
      "Parameter bounds enforcement (amplitude, frequency, pulse width)",
      "Cryptographic authentication of stimulation commands",
      "Rate limiting on parameter changes",
      "Real-time Cs monitoring with automatic shutoff"
    ],
    "qif_controls": [
      "Neural Firewall — I0 boundary enforcement",
      "NSP protocol validation"
    ],
    "clinical_controls": [
      "Regular impedance checks",
      "Programming session logging",
      "Patient symptom monitoring"
    ]
  },

  // ═══ CLINICAL EXTENSION (NEW) ═══
  "clinical": {
    "therapeutic_analog": "tDCS/tACS for major depressive disorder",
    "fda_status": "cleared",
    "fda_class": "II",
    "indications": ["MDD", "chronic pain", "stroke rehabilitation"],
    "targets": ["motor cortex", "DLPFC"],
    "parameters": "1-2 mA, 20 min, anodal/cathodal montage",
    "endpoints": ["MADRS", "VAS pain scale"],
    "adverse_effects": ["skin irritation", "phosphenes", "headache"],
    "evidence_tier": "standard-of-care"
  },

  // ═══ ATTACK CHAINS (NEW) ═══
  "chains": [
    {
      "chain_id": "CHAIN-VIS-001",
      "chain_name": "Vision prosthesis calibration compromise",
      "position": 1,
      "role": "initial_access",
      "enables": ["QIF-T0008", "QIF-T0030"],
      "requires": [],
      "drift_contribution": "A"
    }
  ],

  // ═══ GOVERNANCE (NEW) ═══
  "governance_tags": {
    "consent_requirement": "explicit_informed",
    "oversight_level": "clinical_supervision",
    "dual_use_risk": "high",
    "regulatory_gate": "FDA_Class_III_PMA",
    "ethical_review": "IRB_required",
    "revocability": true
  },

  // ═══ EXISTING FIELDS (UNCHANGED) ═══
  "tara_enrichment": {
    "mechanism": "...",
    "dual_use": "confirmed",
    "governance": { "..." },
    "engineering": { "..." },
    "dsm5": { "..." }
  },
  "physics_feasibility": { "..." },
  "neurorights": { "..." },
  "regulatory": { "..." },

  // ═══ PRESENTATION ═══
  // "severity" is derived from niss.severity (not stored at root level)
  // "ui_category" is derived from tara_domain + tara_mode (not stored at root level)
  "classical": true,
  "quantum": false
}
```

**Field explanations for new TARA fields:**

- `tara_direction`: Signal flow direction. Controlled enum:
  - `afferent` — signal flows INTO the brain (sensory input, stimulation)
  - `efferent` — signal flows OUT OF the brain (motor output, speech production)
  - `bidirectional` — signal flows both ways (closed-loop systems)
  - `internal` — no external I/O (self-regulatory, identity, autonomic)

- `use_context_tags`: Describes the contexts in which this technique is applied. NOT intent classification (intent was explicitly excluded as a mode). Valid values: `therapeutic`, `offensive`, `enhancement`, `research`, `diagnostic`. A technique can have multiple tags.

### 10.3 Evidence Tiering

Every technique gets an `evidence` block documenting how confident we are that it's real. Tiers are ordered by strength of evidence:

| Tier | Code | Meaning | Example |
|------|------|---------|---------|
| **1** | `validated_rct` | Randomized controlled trial data | DBS for Parkinson's (multiple RCTs) |
| **2** | `validated_cohort` | Cohort study / systematic review | Long-term DBS adverse effects (PubMed: 28678830) |
| **3** | `demonstrated_case` | Published case report(s) | Specific stimulation-induced mania cases |
| **4** | `demonstrated_poc` | Working proof-of-concept in lab | BCI signal injection demo (controlled setting) |
| **5** | `theoretical_mechanism` | Sound mechanism, no demonstration | Physics supports it, nobody has done it yet |
| **6** | `theoretical_extrapolation` | Extrapolated from related work | "If X works on rats, it could work on humans" |
| **7** | `speculative` | First-principles reasoning only | Quantum tunneling exploits at I0 |

This reconciles with the existing `status` field:

| Current Status | Maps to Evidence Tier |
|---------------|----------------------|
| CONFIRMED | 1-3 (validated) |
| DEMONSTRATED | 3-4 (demonstrated) |
| EMERGING | 4-5 (demonstrated or theoretical) |
| THEORETICAL | 5-6 (theoretical) |
| PLAUSIBLE | 6 (extrapolation) |
| SPECULATIVE | 7 (speculative) |

When `status` and `evidence.tier` disagree (e.g., status=CONFIRMED but evidence.tier=demonstrated_case),
the lower of the two governs public-facing claims. Status measures what happened; evidence.tier measures
how rigorously it was documented.

The `evidence.sources` array requires verified citations — every DOI/PMID must be resolved before inclusion (per the anti-hallucination rules in the research agent protocol).

### 10.4 Detection & Defense Layer

Every technique should eventually have three defense components:

**Detection** — how do you know this is happening?
```
detection.methods:     What monitoring approach catches it
detection.data_sources: What systems/sensors provide the data
detection.indicators:   Specific observable signatures (IOCs for the brain)
```

**Mitigations** — how do you prevent or stop it?
```
mitigations.controls:          Technical controls
mitigations.qif_controls:     QIF-specific (Neural Firewall, NSP, Cs monitoring)
mitigations.clinical_controls: Clinical practice controls (monitoring protocols, consent)
```

**Response** — what do you do if detected?
```
Not in v2 schema yet — future addition. Would include:
  - Immediate: stop stimulation, alert clinician
  - Investigation: compare against baseline, review parameter logs
  - Recovery: restore from known-good calibration, patient assessment
```

Detection fields are nullable — techniques without documented detection methods get `null` until enriched. This is a long-term enrichment effort, not a day-one requirement.

### 10.5 Attack Chains

An attack chain is a sequence of techniques that together achieve a higher-level objective. Individual techniques are nodes; the chain describes the path.

**Chain Schema:**
```json
{
  "chain_id": "CHAIN-VIS-001",
  "chain_name": "Vision prosthesis calibration compromise",
  "objective": "Permanently corrupt patient's visual perception mapping",
  "drift_profile": "C→P (cumulative calibration poisoning becomes persistent neural rewiring)",
  "steps": [
    {
      "position": 1,
      "technique_id": "QIF-T0057",
      "tara_alias": "TARA-SIL-R-006",
      "role": "reconnaissance",
      "action": "Map BCI network topology and identify calibration endpoints",
      "detection_window": "passive — no patient-visible effect"
    },
    {
      "position": 2,
      "technique_id": "QIF-T0049",
      "tara_alias": "TARA-SIL-M-012",
      "role": "initial_access",
      "action": "Bypass wireless authentication to gain device control",
      "detection_window": "device logs show unauthorized connection"
    },
    {
      "position": 3,
      "technique_id": "QIF-T0058",
      "tara_alias": "TARA-SIL-M-014",
      "role": "pivot",
      "action": "Poison calibration parameters during prosthesis learning phase",
      "detection_window": "subtle — patient may notice slightly 'off' percepts"
    },
    {
      "position": 4,
      "technique_id": "QIF-T0067",
      "tara_alias": "TARA-VIS-M-001",
      "role": "objective",
      "action": "Inject false visual percepts aligned with corrupted calibration",
      "detection_window": "patient perceives incorrect scene — but may attribute to prosthesis limitations"
    },
    {
      "position": 5,
      "technique_id": "QIF-T0062",
      "tara_alias": "TARA-COG-M-009",
      "role": "persistence",
      "action": "Gradual drift ensures neural adaptation encodes corrupted mapping permanently",
      "detection_window": "months — by the time drift is noticed, neuroplastic changes are structural"
    }
  ],
  "clinical_parallel": {
    "name": "Normal prosthesis calibration and adaptation",
    "note": "The therapeutic version of this chain IS the intended clinical workflow — camera→processing→calibration→perception→adaptation. The attack exploits the same pipeline the therapy requires."
  },
  "defenses": [
    "Cryptographic device authentication (breaks step 2)",
    "Calibration checksum validation (breaks step 3)",
    "Cs coherence monitoring during calibration window (detects step 4)",
    "Longitudinal perception testing against ground truth (detects step 5)"
  ]
}
```

**Pre-defined chain roles:**
- `reconnaissance` — gathering information (no patient effect)
- `initial_access` — gaining device/system access
- `pivot` — transitioning from silicon to neural domain
- `objective` — achieving the primary attack goal
- `persistence` — ensuring the effect survives after access is lost
- `exfiltration` — extracting data (R-mode chains)

**Chain storage:** Chains are stored in a separate file `shared/tara-chains.json`, not inside individual technique entries. Each technique's `chains` array references chain IDs it participates in.

### 10.6 Consent & Oversight Tags

To mitigate the capability laundering risk flagged by Codex, every technique gets governance tags:

```json
"governance_tags": {
  "consent_requirement": "explicit_informed",
  "oversight_level": "clinical_supervision",
  "dual_use_risk": "high",
  "regulatory_gate": "FDA_Class_III_PMA",
  "ethical_review": "IRB_required",
  "revocability": true
}
```

Consent requirement levels:
- `none` — no consent needed (passive observation of public signals)
- `implicit` — standard device consent covers this
- `explicit_informed` — specific informed consent for this procedure
- `enhanced` — consent + ongoing monitoring + right to withdraw
- `prohibited` — no consent framework exists that would ethically permit this

Revocability flag:
- `true` — effects can be reversed; patient can withdraw
- `false` — structural neuroplastic changes (NP:S) make withdrawal impossible
  Techniques with drift:P + NP:S automatically get revocability: false
  This is a mandatory IRB disclosure flag

### 10.7 SIL Domain Filtering

SIL (Silicon) techniques are tagged `"biological_target": false`. Dashboards and clinical views can filter:

```
TARA | where biological_target == true   // clinical view — biology only
TARA | where biological_target == false  // IT security view — silicon only
TARA                                      // full view — both
```

## 11. Cross-AI Review Checklist

Questions for validation:

- [ ] Are the 11 biological domains complete? Is there a neural functional system not covered?
- [ ] Is the R/M/D mode taxonomy sufficient? Should there be a fourth mode (e.g., "Enhancement" for augmentation beyond baseline)?
- [ ] Are any technique domain assignments clearly wrong?
- [ ] Does the SIL domain make sense, or should silicon-only techniques be excluded from the biological taxonomy entirely?
- [ ] Is the naming convention (TARA-XXX-X-NNN) clear and unambiguous?
- [ ] Does this taxonomy scale to 500+ techniques without structural changes?
- [ ] Are there known BCI attack vectors in the literature not captured by any of the 109 techniques?
- [ ] Does the dual-use framing (same taxonomy for security and clinical) create any ethical concerns?

## 12. References

1. Pycroft, L., Boccard, S.G., Owen, S.L.F., Stein, J.F., Fitzgerald, J.J., Green, A.L., & Aziz, T.Z. (2016). Brainjacking: Implant Security Issues in Invasive Neuromodulation. *World Neurosurgery*, 92, 454–462. doi:10.1016/j.wneu.2016.05.010
2. Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security and privacy for neural devices. *Neurosurgical Focus*, 27(1), E7. doi:10.3171/2009.4.focus0985
3. Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), Article 5. doi:10.1186/s40504-017-0050-1
4. Yuste, R., Goering, S., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551, 159–163. doi:10.1038/551159a
5. Li, Q., Ding, D., & Conti, M. (2015). Brain-Computer Interface applications: Security and privacy challenges. *Proceedings of the IEEE Conference on Communications and Network Security (CNS)*, 663–666.
6. Shannon, R.V. (1992). A model of safe levels for electrical stimulation. *IEEE Transactions on Biomedical Engineering*, 39(4), 424–426. doi:10.1109/10.126616
7. Goddard, G.V. (1967). Development of epileptic seizures through brain stimulation at low intensity. *Nature*, 214, 1020–1021. doi:10.1038/2141020a0
8. Finn, E.S., Shen, X., Scheinost, D., et al. (2015). Functional connectome fingerprinting: identifying individuals using patterns of brain connectivity. *Nature Neuroscience*, 18, 1664–1671. doi:10.1038/nn.4135
9. Diekelmann, S., & Born, J. (2010). The memory function of sleep. *Nature Reviews Neuroscience*, 11(2), 114–126. doi:10.1038/nrn2762
10. Lanteaume, L., Khalfa, S., Régis, J., et al. (2007). Emotion induction after direct intracerebral stimulations of human amygdala. *Cerebral Cortex*, 17(6), 1307–1313. doi:10.1093/cercor/bhl041
11. Tennison, M.N. & Moreno, J.D. (2012). Neuroscience, Ethics, and National Security: The State of the Art. *PLoS Biology*. doi:10.1371/journal.pbio.1001289
12. Buhmann, C., et al. (2017). Adverse events in deep brain stimulation: A retrospective long-term analysis. *PLoS One*. PMID:28678830
13. Chiu, S.Y., et al. (2020). Dysarthria and Speech Intelligibility Following Parkinson's Disease GPi-DBS. *Journal of Parkinson's Disease*, 10(4). PMID:32955467
14. Black, F.O., et al. (1978). Galvanic disruption of vestibulospinal postural control by cochlear implant devices. *Journal of Otolaryngology*, 7(6), 519–27. PMID:310472
15. Pradhan, G.N., et al. (2022). Generating Flight Illusions Using Galvanic Vestibular Stimulation in Virtual Reality Flight Simulations. *Frontiers in Neuroergonomics*, 3, 883962. doi:10.3389/fnrgo.2022.883962
16. MITRE (2021). Playbook for Threat Modeling Medical Devices. MITRE Corporation.

All citations verified via Crossref API and/or PubMed. DOIs resolved as of 2026-03-14.

---

*This document is part of the QIF research initiative. QIF is a proposed framework that has not been independently peer-reviewed or adopted by any standards body.*
