# Related Work: BCI Security Research Landscape

**ONI Framework Context Document**

This document acknowledges the foundational and concurrent research in brain-computer interface (BCI) security that informs and complements the ONI Framework. The ONI Framework builds upon this body of work rather than claiming to be the first in the field.

---

## Table of Contents

- [Foundational Work](#foundational-work)
- [Inspirational Works](#inspirational-works)
- [Standards and Frameworks](#standards-and-frameworks)
- [Privacy and Anonymization](#privacy-and-anonymization)
- [Threat Modeling](#threat-modeling)
- [Hardware Security](#hardware-security)
- [Open Source BCI Resources](#open-source-bci-resources)
- [Neuroethics](#neuroethics)
- [How ONI Differs](#how-oni-differs)
- [References](#references)

---

## Foundational Work

### Neurosecurity: The Seminal Paper (2009)

The term "neurosecurity" was coined by **Tadayoshi Kohno** and colleagues at the University of Washington in their 2009 paper:

> Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security and privacy for neural devices. *Neurosurgical Focus*, 27(1), E7.

**Key Contributions:**
- First formal application of computer security principles to neural engineering
- Established the CIA triad (Confidentiality, Integrity, Availability) for BCIs:
  - **Confidentiality**: Protection against neural eavesdropping, thought extraction
  - **Integrity**: Prevention of signal hijacking, unauthorized stimulation
  - **Availability**: Ensuring device functionality when needed (life-critical for some users)
- Identified threat actors: malicious individuals, organizations, nation-states
- Proposed defense mechanisms: access control, encryption, anomaly detection
- Anticipated regulatory gaps that still exist today

**ONI Framework Relationship:** The ONI Framework adopts Kohno's CIA triad framing and extends it with specific architectural implementation through the 14-layer model and Coherence Metric.

---

## Inspirational Muse

These works provided conceptual inspiration for the ONI Framework's architecture and vision.

### The Society of Mind (Marvin Minsky, 1986)

> Minsky, M. (1986). *The Society of Mind*. Simon & Schuster.

**About the Author:**
Marvin Minsky (1927-2016) was a cognitive scientist and co-founder of the MIT Artificial Intelligence Laboratory. A Turing Award recipient (1969), he was one of the founding fathers of artificial intelligence and made seminal contributions to AI, cognitive psychology, mathematics, and robotics.

**Synopsis:**
In this groundbreaking work, Minsky proposes that human intelligence emerges not from a single unified mechanism, but from the interactions of many simple, specialized "agents" — each individually mindless, but collectively capable of thought, emotion, memory, and reasoning. Structured as 270 interconnected essays, the book introduces concepts like "K-lines" (memory triggers), "frames" (knowledge structures), and "agencies" (collections of cooperating agents). Minsky argues that common sense is a collection of learned skills developed through childhood, and that understanding the mind requires viewing it as a "society" of interacting components rather than a monolithic processor.

**How It Inspired ONI:**
- **Layered architecture**: Minsky's multi-agent model inspired ONI's approach of decomposing neural security into 14 distinct layers, each handling specific functions
- **Emergent properties**: The idea that complex behavior emerges from simple agents interacting informs ONI's coherence metric — trust emerges from multiple variance measurements
- **Distributed processing**: ONI's recognition that security decisions happen at multiple layers (not just one firewall) echoes Minsky's rejection of centralized control
- **Agency boundaries**: The concept of "agencies" as cooperating agent groups maps to ONI's domain boundaries (Silicon L1-7, Bridge L8, Biology L9-14)

---

### The NeuroGeneration (Tan Le, 2020)

> Le, T. (2020). *The NeuroGeneration: The New Era in Brain Enhancement That Is Revolutionizing the Way We Think, Work, and Heal*. BenBella Books.

**About the Author:**
Tan Le is the founder and CEO of EMOTIV, a leading neuroinformatics company pioneering consumer EEG brain-computer interfaces. A Vietnamese refugee who arrived in Australia at age four, she was named Young Australian of the Year at 21, featured in Forbes' "50 Names You Need to Know," and serves on the World Economic Forum's Global Future Council on the Future of Neurotechnologies and Brain Science. She is recognized as one of the most influential pioneers in the emerging BCI field.

**Synopsis:**
Le takes readers on a global tour of neurotechnology's frontier, introducing the scientists and inventors pushing the boundaries of brain enhancement. The book profiles transformative cases: an endurance racer paralyzed in a fall who walks again via neural stimulation and exoskeleton; a man who drives a race car with his mind; a color-blind "cyborg" whose brain implant lets him "hear" colors. Le explores emerging technologies including cranial stimulation for accelerated learning, artificial hippocampus implants for memory restoration, and neural interfaces designed to help humans keep pace with AI. The book captures both the promise and the profound questions these technologies raise about human identity and potential.

**How It Inspired ONI:**
- **Real-world grounding**: Le's case studies demonstrate that BCIs are not theoretical — they're transforming lives today, making security an urgent rather than academic concern
- **Commercial BCI landscape**: Understanding the EMOTIV ecosystem and consumer neurotechnology informed ONI's consideration of non-medical BCI attack surfaces
- **Human-centered design**: Le's focus on individual stories reinforced ONI's emphasis on protecting identity (L14) and cognitive autonomy
- **Accessibility vision**: Her work on democratizing neurotechnology aligns with ONI's open-source approach to security frameworks

---

## Standards and Frameworks

### IEEE Brain Initiative (2020-present)

The IEEE has ongoing standardization efforts for brain-machine interfaces:

> IEEE Standards Association. (2020). IEEE Brain Initiative: Standards Roadmap for Brain-Machine Interfaces.

**Key Contributions:**
- Industry collaboration on BMI standards
- Signal quality benchmarks
- Interoperability specifications
- Safety requirements

**ONI Framework Relationship:** ONI provides a complementary security-focused layer model that could interface with IEEE's broader standardization efforts.

### FDA Regulatory Framework

The FDA regulates BCIs as Class II or Class III medical devices:

- **510(k) Pathway**: For devices substantially equivalent to existing products
- **De Novo Pathway**: For novel low-to-moderate risk devices
- **PMA (Premarket Approval)**: For Class III high-risk devices (implantables)

**Key Documents:**
- FDA Guidance on Implanted Brain-Computer Interface Devices (2021)
- Breakthrough Device Designation (granted to Neuralink, Synchron, others)

**ONI Framework Relationship:** ONI is designed to be compatible with FDA regulatory requirements, providing security checkpoints that align with safety validation requirements.

---

## Privacy and Anonymization

### BCI Anonymizer (University of Washington)

Developed by researchers at UW, the BCI Anonymizer addresses neural data privacy:

> Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App stores for the brain: Privacy and security in brain-computer interfaces. *IEEE Technology and Society Magazine*, 34(2), 32-39.

**Key Contributions:**
- Filters sensitive information from EEG data before transmission
- Demonstrates that raw neural signals contain extractable private information
- Proposes privacy-preserving signal processing pipeline

**ONI Framework Relationship:** The ONI Framework's Layer 13 (Semantic) and Layer 14 (Identity) incorporate privacy filtering concepts similar to BCI Anonymizer's approach.

### Neural Privacy Research

> Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5.

**Key Contributions:**
- Proposed "neurorights": cognitive liberty, mental privacy, mental integrity, psychological continuity
- Framework adopted by Chile's constitutional amendment (2021) — first country to protect neurorights

**ONI Framework Relationship:** ONI's Layer 14 (Identity & Ethics) explicitly addresses psychological continuity and mental integrity as security properties.

---

## Threat Modeling

### 6-Layer BCI Threat Model

The 6-Layer BCI Threat Model provides a systematic approach to analyzing attack surfaces across the BCI data pipeline. This model has been developed and refined through multiple research efforts:

> Landau, O., Puzis, R., & Nissim, N. (2020). Mind your privacy: Privacy leakage through BCI applications using machine learning. *Knowledge-Based Systems*, 198, 105932.

> Bernal, S. L., et al. (2021). Security in Brain-Computer Interfaces: State-of-the-Art, Opportunities, and Future Challenges. *ACM Computing Surveys*, 54(1), 1-35.

**The 6 Layers:**

| Layer | Function | Attack Surface | Example Threats |
|-------|----------|----------------|-----------------|
| **1. Sensor** | Physical electrode/signal acquisition | Hardware tampering, EMI injection | Malicious electrode placement, signal jamming |
| **2. Acquisition** | ADC, amplification, initial filtering | Signal injection, spoofing | Replay attacks, fake biosignals |
| **3. Signal Processing** | Filtering, artifact removal, feature extraction | Algorithm manipulation | Adversarial signal crafting |
| **4. Transmission** | Data transfer (wireless/wired) | MitM, eavesdropping | Bluetooth exploits, packet injection |
| **5. Application** | BCI software, ML classifiers, user interface | Malware, classifier poisoning | Trojan models, UI spoofing |
| **6. Feedback/Stimulation** | Closed-loop neural stimulation | Command injection | Unauthorized stimulation, amplitude attacks |

**Key Research Contributions:**
- Systematic categorization of BCI attack surfaces across the full data pipeline
- Demonstration that ML classifiers can extract private information (personality traits, cognitive abilities) from resting-state EEG with ~73% accuracy
- Identification of replay and spoofing attacks that could cause misdiagnosis in clinical BCIs
- Evidence that legitimate BCI applications leak private information through normal operation

### ONI Framework Relationship

The ONI 14-layer model extends and refines the 6-Layer BCI Threat Model:

| 6-Layer Model | ONI Layers | ONI Enhancement |
|---------------|------------|-----------------|
| 1. Sensor | L9 (Signal Processing) | Adds biological context (L1-L7 neural layers) |
| 2. Acquisition | L9 (Signal Processing) | Coherence Metric (Cₛ) validates signal authenticity |
| 3. Signal Processing | L9-L10 (Signal Processing, Neural Protocol) | Scale-frequency invariant detects biological implausibility |
| 4. Transmission | L1-L7 (OSI stack) | Standard network security + neural-specific validation |
| 5. Application | L13-L14 (Semantic, Identity) | Privacy filtering via BCI Anonymizer concepts |
| 6. Feedback/Stimulation | L8 (Neural Gateway) | **Primary firewall location** — zero-trust validation |

**Why ONI Extends Beyond 6 Layers:**

1. **Biological grounding**: The 6-layer model treats the brain as a black box. ONI's L1-L7 (neural side) explicitly model biological processing levels where attacks can manifest differently.

2. **Explicit security boundary**: The 6-layer model distributes security across layers. ONI designates L8 (Neural Gateway) as THE critical trust boundary — all signals must pass validation here before reaching neural tissue.

3. **Cognitive/semantic layers**: The 6-layer model stops at "Application." ONI adds L11-L14 to address cognitive-level threats: session hijacking, context corruption, semantic attacks, and identity manipulation.

4. **Bidirectional threat modeling**: ONI explicitly models both read (efferent) and write (afferent) pathways with distinct threat profiles at each layer.

### STRIDE for Medical Devices

Microsoft's STRIDE threat model has been applied to medical devices:

> **S**poofing, **T**ampering, **R**epudiation, **I**nformation disclosure, **D**enial of service, **E**levation of privilege

**ONI Framework Relationship:** The ONI Framework maps specific attack vectors to layers (L8-L14) rather than using abstract threat categories, enabling more targeted defenses.

---

## Hardware Security

### Archimedes Center for Healthcare and Device Security

Founded by **Kevin Fu** at Northeastern University (formerly University of Michigan):

**Key Contributions:**
- Extensive research on medical device security
- Pacemaker/ICD vulnerability research
- EMI attack vectors on implantables
- FDA advisory work

**Relevant Papers:**
> Halperin, D., Heydt-Benjamin, T. S., Ransford, B., Clark, S. S., Defend, B., Morgan, W., ... & Fu, K. (2008). Pacemakers and implantable cardiac defibrillators: Software radio attacks and zero-power defenses. *IEEE Symposium on Security and Privacy*.

**ONI Framework Relationship:** ONI's Layer 8 (Neural Gateway) incorporates hardware security principles from medical device security research.

### SIMS Lab (Rice University)

**Kaiyuan Yang**'s Security of Implantable Medical Systems Lab:

**Key Contributions:**
- Low-power security for implantables
- Side-channel attack mitigation
- Energy-efficient authentication

**ONI Framework Relationship:** ONI's power budget constraints (25mW total, ~3-5mW for firewall) are informed by this research on implantable device limitations.

---

## Open Source BCI Resources

### NeuroTechX Community

**NeuroTechX** is an international non-profit organization building a community of neurotechnology enthusiasts, researchers, and developers:

**Key Resources:**

| Resource | Description | License | ONI Integration |
|----------|-------------|---------|-----------------|
| **[MOABB](https://github.com/NeuroTechX/moabb)** | Mother of All BCI Benchmarks — standardized EEG datasets | BSD 3-Clause | `tara.data.moabb_adapter` |
| **[awesome-bci](https://github.com/NeuroTechX/awesome-bci)** | Curated BCI resource collection | N/A (list) | Reference for partnerships |

### MOABB (Mother of All BCI Benchmarks)

> Jayaram, V., & Barachant, A. (2018). MOABB: Trustworthy algorithm benchmarking for BCIs. *Journal of Neural Engineering*, 15(6), 066011. https://doi.org/10.1088/1741-2552/aadea0

**Key Contributions:**
- Standardized benchmarking framework for BCI algorithms
- 12+ freely available EEG datasets (motor imagery, P300, SSVEP)
- Cross-session and cross-subject evaluation protocols
- Integration with scikit-learn and MNE-Python
- Reproducible research methodology

**Datasets Relevant to ONI Security Testing:**

| Dataset | Paradigm | Subjects | ONI Relevance |
|---------|----------|----------|---------------|
| BNCI2014_001 | Motor Imagery | 9 | Test motor cortex (L13) attack detection |
| BNCI2014_002 | Motor Imagery | 14 | Longitudinal firewall validation |
| EPFLP300 | P300 | 8 | Privacy-sensitive ERP detection (Kohno threats) |
| SSVEP_Exo | SSVEP | 12 | Frequency injection attack vectors |

**ONI Framework Relationship:** TARA integrates MOABB through the `tara.data.moabb_adapter` module, enabling:
- Testing coherence metric against real EEG signals
- Validating attack detection on authentic BCI paradigms
- Benchmarking false positive/negative rates with real data

**Installation:**
```bash
pip install oni-tara[moabb]
```

**Usage:**
```python
from tara.data import MOABBAdapter, BCIParadigm

adapter = MOABBAdapter()
dataset = adapter.load_dataset("BNCI2014_001")
signals = adapter.get_signals(dataset, subject=1)

# Test with Neural Firewall
from tara import NeuralFirewall
firewall = NeuralFirewall()
for signal in signals:
    result = firewall.process_signal(signal.to_tara_format())
```

### awesome-bci Curated Resources

The **awesome-bci** repository provides a comprehensive collection of BCI resources that complement ONI development:

**Categories Relevant to ONI:**

| Category | Key Resources | ONI Application |
|----------|---------------|-----------------|
| **Python Toolboxes** | MNE-Python, pyRiemann, BrainFlow | Signal processing for Neural Firewall |
| **Communication Protocols** | Lab Streaming Layer (LSL) | Real-time signal ingestion |
| **Datasets** | OpenNeuro, PhysioNet | Training data for attack detection |
| **Hardware SDKs** | OpenBCI, Emotiv, Muse | Hardware validation targets |

**ONI Framework Relationship:** These resources inform the ONI hardware partnership roadmap (see [PARTNERSHIPS.md](PARTNERSHIPS.md)) and provide validation targets for the `oni-openbci` planned package.

---

## Neuroethics

### Digital Ethics and Neurotechnology

**Luciano Floridi** (Yale/Oxford) and colleagues have established ethical frameworks for neurotechnology:

> Floridi, L. (2023). The Ethics of Artificial Intelligence: Principles, Challenges, and Opportunities. Oxford University Press.

**Key Contributions:**
- Information ethics applied to neural data
- Agency and autonomy in human-AI systems
- Governance frameworks for emerging technologies

### Neuroethics Societies

- **International Neuroethics Society (INS)**
- **IEEE Brain Initiative Neuroethics Working Group**
- **OECD Neurotechnology Governance Initiative**

**ONI Framework Relationship:** See [NEUROETHICS_ALIGNMENT.md](governance/NEUROETHICS_ALIGNMENT.md) for how ONI maps to established neuroethics principles.

---

## How ONI Differs

While building on this foundational work, the ONI Framework contributes several novel elements:

### 1. OSI Extension Architecture

**Prior Work:** Previous frameworks treat BCI security as a standalone domain.

**ONI Approach:** Extends the established OSI model (L1-L7) with seven additional layers (L8-L14) for neural/cognitive systems. This provides:
- Familiar abstraction for IT security professionals
- Clear mapping between network and neural security concepts
- Interoperability with existing security tools and frameworks

### 2. The Coherence Metric (Cₛ)

**Prior Work:** Anomaly detection based on statistical deviation or ML classifiers.

**ONI Approach:** Introduces a physics-based trust metric:
```
Cₛ = e^(−(σ²φ + σ²τ + σ²γ))
```
Where:
- σ²φ = Phase variance (timing jitter)
- σ²τ = Transport variance (pathway reliability)
- σ²γ = Gain variance (amplitude stability)

This provides a real-time, hardware-implementable trust score independent of training data.

### 3. Scale-Frequency Invariant

**Prior Work:** Frequency analysis at single scales.

**ONI Approach:** Identifies cross-scale relationship:
```
f × S ≈ k
```
This enables anomaly detection across neural scales (molecular to behavioral).

### 4. Layer 8: Neural Gateway

**Prior Work:** Security boundaries described abstractly.

**ONI Approach:** Explicitly defines L8 as THE critical security boundary — the bridge between silicon (L1-L7) and biology (L9-L14). All trust decisions are enforced here.

### 5. Implementation Focus

**Prior Work:** Primarily theoretical frameworks and threat models.

**ONI Approach:** Provides:
- Python reference implementation (`pip install oni-framework`)
- TARA security operations platform
- Specific hardware constraints (25mW power budget, <1ms latency)
- Real-time validation algorithms

### Summary: ONI's Position

| Aspect | Prior Work | ONI Framework |
|--------|------------|---------------|
| **Architecture** | Standalone security | OSI extension (L8-L14) |
| **Trust Metric** | ML-based anomaly detection | Physics-based Coherence Score |
| **Abstraction Level** | Academic/theoretical | Implementation-ready |
| **Target Audience** | Security researchers | Security + engineering teams |
| **Boundary Definition** | Implicit | Explicit Layer 8 gateway |

---

## References

### Foundational Papers

1. Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security and privacy for neural devices. *Neurosurgical Focus*, 27(1), E7. https://doi.org/10.3171/2009.4.FOCUS0985

2. Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App stores for the brain: Privacy and security in brain-computer interfaces. *IEEE Technology and Society Magazine*, 34(2), 32-39.

3. Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5.

4. Halperin, D., et al. (2008). Pacemakers and implantable cardiac defibrillators: Software radio attacks and zero-power defenses. *IEEE Symposium on Security and Privacy*.

### Standards and Guidelines

5. IEEE Standards Association. (2020). IEEE Brain Initiative: Standards Roadmap for Brain-Machine Interfaces.

6. U.S. Food and Drug Administration. (2021). Implanted Brain-Computer Interface (BCI) Devices for Patients with Paralysis or Amputation.

### Recent Research

7. Landau, O., Puzis, R., & Nissim, N. (2020). Mind your privacy: Privacy leakage through BCI applications using machine learning. *Knowledge-Based Systems*, 198, 105932.

8. Yuste, R., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159-163.

### Ethics and Governance

9. Floridi, L. (2023). *The Ethics of Artificial Intelligence: Principles, Challenges, and Opportunities*. Oxford University Press.

10. OECD. (2019). Recommendation of the Council on Responsible Innovation in Neurotechnology.

### Inspirational Works

11. Minsky, M. (1986). *The Society of Mind*. Simon & Schuster.

12. Le, T. (2020). *The NeuroGeneration: The New Era in Brain Enhancement That Is Revolutionizing the Way We Think, Work, and Heal*. BenBella Books.

### Open Source Resources

13. Jayaram, V., & Barachant, A. (2018). MOABB: Trustworthy algorithm benchmarking for BCIs. *Journal of Neural Engineering*, 15(6), 066011. https://doi.org/10.1088/1741-2552/aadea0

14. NeuroTechX. (2024). awesome-bci: Curated collection of BCI resources. GitHub. https://github.com/NeuroTechX/awesome-bci

---

## Implementation in ONI Framework

The ONI Framework has integrated the foundational research described above into working code:

### Neurosecurity Module

The `oni.neurosecurity` module implements Kohno's threat model and the BCI Anonymizer architecture:

```python
from oni.neurosecurity import (
    NeurosecurityFirewall,  # Kohno CIA triad validation
    BCIAnonymizer,          # Chizeck & Bonaci patent implementation
    ThreatType,             # ALTERATION, BLOCKING, EAVESDROPPING
    ERPType,                # ERP component classification
    PrivacyScoreCalculator, # Information-criticality metrics
)

# Layer 8 firewall with Kohno's three threat categories
firewall = NeurosecurityFirewall()
decision = firewall.validate(signal)

# BCI Anonymizer for privacy protection
anonymizer = BCIAnonymizer()
result = anonymizer.anonymize(signal_data)
```

### Implementation Details

| Component | Based On | Location |
|-----------|----------|----------|
| `NeurosecurityFirewall` | Kohno (2009) CIA triad | `oni/neurosecurity/firewall.py` |
| `BCIAnonymizer` | Chizeck & Bonaci (2014) patent | `oni/neurosecurity/anonymizer.py` |
| `ThreatType` enum | Kohno threat taxonomy | `oni/neurosecurity/threats.py` |
| `PrivacyScoreCalculator` | Information-criticality metrics | `oni/neurosecurity/privacy_score.py` |

### Full Implementation Guide

For complete implementation details, attack scenarios, and integration strategy, see:

**[NEUROSECURITY_IMPLEMENTATION.md](oni-framework/NEUROSECURITY_IMPLEMENTATION.md)**

---

## Contributing

This document is maintained as part of the ONI Framework. If you know of relevant research that should be included, please:

1. Open an issue or pull request
2. Include full citation in APA format
3. Explain the relationship to ONI Framework

---

*Last Updated: 2026-01-25*
*Part of the [ONI Framework](../README.md)*
