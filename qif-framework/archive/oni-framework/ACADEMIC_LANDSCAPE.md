# Academic Research Landscape: BCI Security & Neuroethics

> A comprehensive mapping of foundational research, key institutions, and notable researchers whose work aligns with and informs the ONI Framework.

**Last Updated:** 2026-01-25
**Purpose:** Academic positioning, collaboration opportunities, graduate program alignment

🎯 **[Explore Interactive Visualization →](https://qinnovates.github.io/ONI/visualizations/03-academic-alignment.html)** — See research alignments, gaps, and ONI solutions in an interactive format.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Tier 1: Core Foundational Research](#tier-1-core-foundational-research-directly-integrated)
  - [University of Washington — Security & Privacy Research Lab](#university-of-washington--security--privacy-research-lab--biorobotics-lab)
  - [UC Berkeley — Security Research](#uc-berkeley--security-research)
  - [Northeastern University — Archimedes Center](#northeastern-university--archimedes-center-for-medical-device-security)
- [Tier 2: Neuroethics & Policy Research](#tier-2-neuroethics--policy-research)
  - [University of Washington — Neuroethics Research Group](#university-of-washington--neuroethics-research-group)
  - [Harvard Medical School — Center for Bioethics](#harvard-medical-school--center-for-bioethics)
  - [Columbia University — NeuroRights Foundation](#columbia-university--neurorights-foundation)
  - [Yale University — Digital Ethics Center](#yale-university--digital-ethics-center)
  - [ETH Zurich / TU Munich — Neurorights Theory](#eth-zurich--tu-munich--neurorights-theory)
  - [Oxford University — Uehiro Centre](#oxford-university--uehiro-centre-for-practical-ethics)
  - [University of British Columbia — Neuroethics Canada](#university-of-british-columbia--neuroethics-canada)
  - [University of Pennsylvania — Center for Neuroscience & Society](#university-of-pennsylvania--center-for-neuroscience--society)
  - [University of North Carolina — School of Law](#university-of-north-carolina--school-of-law)
  - [Tongji University — Intellectual Property & Neurolaw](#tongji-university--intellectual-property--neurolaw)
- [Tier 3: Neural Engineering & BCI Development](#tier-3-neural-engineering--bci-development)
  - [Stanford University — Neural Prosthetics Systems Lab](#stanford-university--neural-prosthetics-systems-lab)
  - [Brown University — BrainGate Consortium](#brown-university--braingate-consortium)
  - [Carnegie Mellon University — Biomedical Engineering](#carnegie-mellon-university--biomedical-engineering)
  - [Caltech — Andersen Lab / Chen BMI Center](#caltech--andersen-lab--chen-bmi-center)
  - [Johns Hopkins University](#johns-hopkins-university--apl--physical-medicine)
  - [Duke University — Nicolelis Lab](#duke-university--nicolelis-lab)
  - [Rice University — Neural Interface Lab](#rice-university--neural-interface-lab)
- [Research Gaps ONI Addresses](#research-gaps-oni-addresses)
- [Collaboration Opportunities](#collaboration-opportunities)
- [Citation Practices](#citation-practices)
- [Integrated Research Log](#integrated-research-log)
- [Quick Reference: Key Researchers by Domain](#quick-reference-key-researchers-by-domain)

---

## Executive Summary

The ONI Framework sits at the intersection of three academic domains:
1. **BCI Security** — Technical protection of neural device communications
2. **Neuroethics** — Philosophical and policy frameworks for neural technology
3. **Neural Engineering** — Development of brain-machine interfaces

This document maps the research landscape to:
- Acknowledge foundational work that ONI builds upon
- Identify synergies between ONI's contributions and ongoing research
- Position ONI for academic collaboration and graduate study opportunities

---

## Tier 1: Core Foundational Research (Directly Integrated)

These researchers' work is directly implemented in ONI's codebase.

### University of Washington — Security & Privacy Research Lab + BioRobotics Lab

**The birthplace of "neurosecurity" as a field.**

| Researcher | Role | Key Contributions | ONI Integration |
|------------|------|-------------------|-----------------|
| **[Tadayoshi Kohno](https://homes.cs.washington.edu/~yoshi/)** | Professor, Allen School | Coined "neurosecurity" (2009), IEEE Fellow for cybersecurity contributions | `NeurosecurityFirewall` — CIA threat model |
| **[Tamara Bonaci](https://www.researchgate.net/profile/Tamara-Bonaci)** | PhD, Security Researcher | BCI Anonymizer patent (abandoned), "brain spyware" demonstration, neural PII classification | `BCIAnonymizer` — privacy-preserving filtering |
| **[Howard Chizeck](https://people.ece.uw.edu/chizeck/)** | Professor Emeritus, BioRobotics | Deep brain stimulator security, closed-loop neural device safety | Attack surface analysis, L8 firewall design |

**Key Publications:**
- Kohno, T., Denning, T., & Matsuoka, Y. (2009). [Neurosecurity: Security and privacy for neural devices](https://cyberlaw.stanford.edu/content/files/doi/pdf/10.3171/2009.4.pdf). *Journal of Neurosurgery: Focus*, 27(1), E7.
- Bonaci, T., Calo, R., & Chizeck, H. (2015). [App Stores for the Brain: Privacy & Security in Brain-Computer Interfaces](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2788104). *IEEE Technology & Society Magazine*, 34(2), 32-39.
- US Patent US20140228701A1 — [Brain-Computer Interface Anonymizer](https://patents.google.com/patent/US20140228701A1)

**How ONI Extends This Work:**
- Implements Kohno's CIA threat model as executable code (`NeurosecurityFirewall`)
- Operationalizes the BCI Anonymizer patent concepts (`BCIAnonymizer`)
- Extends security considerations to a full 14-layer model (beyond device-level to cognitive layers)

---

### UC Berkeley — Security Research

**Pioneering research on BCI side-channel attacks and privacy vulnerabilities.**

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Dawn Song](https://people.eecs.berkeley.edu/~dawnsong/)** | Professor, EECS | MacArthur Fellow, first BCI privacy attack demonstration (2012), most-cited in computer security | Attack vector identification |
| **[Mario Frank](https://www.mariofrankphd.com/)** | Research Scientist | Co-author of foundational BCI side-channel research | Privacy attack patterns |

**Key Publication:**
- Martinovic, I., Davies, D., Frank, M., Perito, D., Ros, T., & Song, D. (2012). [On the Feasibility of Side-Channel Attacks with Brain-Computer Interfaces](https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/martinovic). *USENIX Security Symposium*.

**Key Findings:**
- First demonstration that consumer EEG devices can leak private information
- Captured EEG signals revealed bank card PINs, location, and known persons
- Entropy of private information decreased 15-40% vs random guessing
- Tested on Emotiv EEG device with 28 participants

**How ONI Aligns:**
- Attack patterns inform TARA's adversarial testing scenarios
- Privacy leakage vectors addressed in L13 Semantic layer protections

---

### Northeastern University — Archimedes Center for Medical Device Security

**Leading center for implantable medical device cybersecurity, including neural implants.**

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Kevin Fu](https://www.khoury.northeastern.edu/people/kevin-fu/)** | Professor, Director | ACM/IEEE Fellow, former FDA acting director of medical device cybersecurity | Regulatory pathway, hardware security |

**Center:** [secure-medicine.org](https://www.secure-medicine.org/)

**Funding & Achievements:**
- **$3.5M NSF grant** for brain and neural implant cybersecurity
- **$22M total awards** for healthcare device security research
- Inaugural FDA acting director of medical device cybersecurity (2021-2022)
- Research on cardiac defibrillator vulnerabilities prompted global regulatory changes

**How ONI Can Contribute:**
- Framework provides theoretical model for their neural implant security work
- TARA platform could integrate with their vulnerability testing
- Collaboration for FDA regulatory guidance alignment

---

## Tier 2: Neuroethics & Policy Research

These researchers define the ethical and legal frameworks that ONI's technical implementations serve.

### University of Washington — Neuroethics Research Group

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Sara Goering](https://phil.washington.edu/people/sara-goering)** | Professor & Chair, Philosophy | Agency in BCI users, disability theory integration, BRAIN Initiative ethics lead | Identity layer (L14) design principles |
| **[Eran Klein](https://phil.washington.edu/neuroethics-research-group)** | Neurologist & Affiliate Professor | Clinical neuroethics, user experience in neural devices | User consent models, cognitive autonomy |

**Key Publications:**
- Goering, S., Brown, T., & Klein, E. (2021). [Neurotechnology ethics and relational agency](https://onlinelibrary.wiley.com/doi/10.1111/phc3.12734). *Philosophy Compass*, 16(4), e12734.
- Goering, S., Klein, E., et al. (2017). [Staying in the loop: Relational agency and identity in next-generation DBS](https://pubmed.ncbi.nlm.nih.gov/28520532/). *AJOB Neuroscience*, 8(2), 59-70.
- Goering, Brown & Klein (2024). "Brain Pioneers and Moral Entanglement." *Hastings Center Report*.

**Grants:**
- $1.6M NIH: "Human Agency and Brain Computer Interfaces" (2018-2022)
- $1.5M NIH R01: "Caring for BRAIN Pioneers" (2022-2026)

**How ONI Aligns:**
- L14 (Identity & Ethics layer) directly addresses agency concerns raised by Goering/Klein
- Transparency documentation models HITL methodology they advocate
- User consent frameworks influenced by their "relational agency" concept

---

### Harvard Medical School — Center for Bioethics

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Gabriel Lázaro-Muñoz](https://bioethics.hms.harvard.edu/faculty-staff/gabriel-lazaro-munoz)** | Assistant Professor | DBS ethics, pediatric neuroethics, International Brain Initiative ethics lead | Privacy layer design, post-trial device access |

**Key Research:**
- Ethical considerations for multimodal perception + neurotechnology integration (2024)
- Post-trial responsibilities for neural device participants
- Member, UNESCO neurotechnology ethics consultation (2024)

**How ONI Aligns:**
- Privacy scoring in `BCIAnonymizer` addresses his neural data concerns
- Framework supports continued access considerations he advocates
- Design accounts for vulnerable populations (pediatric, psychiatric)

---

### Columbia University — NeuroRights Foundation

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Rafael Yuste](https://en.wikipedia.org/wiki/Rafael_Yuste)** | Professor, Biological Sciences | Co-initiator of BRAIN Initiative, NeuroRights Foundation co-founder, Kavli Institute co-director | Full framework alignment with 5 neurorights |

**Key Publication:**
- Yuste, R., Goering, S., et al. (2017). [Four ethical priorities for neurotechnologies and AI](https://www.nature.com/articles/551159a). *Nature*, 551(7679), 159-163.

**The Five Neurorights (Yuste et al.):**
1. **Mental Privacy** — Brain data cannot be used without consent
2. **Personal Identity** — Technology cannot alter sense of self
3. **Free Will** — Decisions without neurotechnological manipulation
4. **Equal Access** — Fair access to cognitive enhancement
5. **Protection from Bias** — No discrimination based on brain data

**Legislative Impact:**
- Chile constitutional reform (2021) — First nation to protect "mental integrity"
- Colorado HB 24-1058 (April 2024) — First US state neural privacy law
- California SB 1223 (Sept 2024) — Neural data as "sensitive personal information" under CCPA
- Minnesota neural data law (May 2024) — Civil and criminal penalties for violations
- U.S. MIND Act (Sept 2025) — First federal neurotechnology governance bill (Schumer, Cantwell, Markey)
- UNESCO global standard (planned Nov 2025) — International neurotechnology ethics framework

**How ONI Aligns:**
- L14 (Identity) protects personal identity
- `BCIAnonymizer` implements mental privacy at signal level
- Coherence metric detects manipulation attempts (free will protection)
- Open-source framework supports equal access principle

---

### Yale University — Digital Ethics Center

**Emerging leader in BCI cybersecurity threat modeling and regulatory recommendations.**

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Luciano Floridi](https://dec.yale.edu/profile/luciano-floridi)** | Director, Professor | Founding figure in digital ethics, "Treating brainwaves is not an option" (*Nature*, 2018), formerly Oxford Digital Ethics Lab | Philosophical foundation for neural data ethics |
| **[Tyler Schroder](https://dec.yale.edu/tyler-schroder)** | Research Fellow (2024-25) | BCI threat model design, cyber risk analysis for next-gen BCIs | Threat modeling methodology |

**Key Publication:**
- Schroder, T., Sirbu, R., Park, S., Morley, J., Street, S., & Floridi, L. (2025). [Cyber Risks to Next-Gen Brain-Computer Interfaces: Analysis and Recommendations](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5138265). *Neuroethics*, 18(2).

**Key Findings:**
- Designed threat model identifying cyberattack vectors for BCI patients
- Recommend non-surgical device update methods, strong authentication for BCI software modifications
- Call for encryption of data moving to/from the brain, minimized network connectivity
- Warning: "A widespread security breach could affect millions of users simultaneously, leading to mass manipulation of neural data"

**How ONI Aligns:**
- Yale's threat model complements ONI's 14-layer approach at regulatory level
- Their authentication/encryption recommendations align with L8 Neural Gateway design
- Shared concern about AI-mediated attacks on implants (addressed in TARA attack scenarios)

---

### ETH Zurich / TU Munich — Neurorights Theory

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Marcello Ienca](https://www.professoren.tum.de/en/ienca-marcello)** | Professor, Ethics of AI & Neuroscience | Four original neurorights proposal (2017), UNESCO advisor, Council of Europe neural data guidelines | Theoretical foundation for privacy layers |

**Key Publication:**
- Ienca, M., & Andorno, R. (2017). [Towards new human rights in the age of neuroscience and neurotechnology](https://link.springer.com/article/10.1186/s40504-017-0050-1). *Life Sciences, Society and Policy*, 13(1), 5.

**The Four Neurorights (Ienca & Andorno, 2017):**
1. **Cognitive Liberty** — Right to mental self-determination
2. **Mental Privacy** — Protection against unauthorized brain data collection
3. **Mental Integrity** — Protection from harmful neural intrusions
4. **Psychological Continuity** — Protection of personal identity

**How ONI Aligns:**
- Framework operationalizes Ienca's theoretical neurorights as technical controls
- Coherence metric (Cₛ) provides mathematical basis for "integrity" verification
- L8 Neural Gateway implements "mental integrity" as firewall function

---

### Oxford University — Uehiro Centre for Practical Ethics

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Hannah Maslen](https://www.practicalethics.ox.ac.uk/people/dr-hannah-maslen)** | Senior Research Fellow | BrainCom project ethics lead, EU BCI regulation advisor, autonomy in closed-loop systems | Adaptive system design, regulatory preparation |

**Key Publications:**
- Maslen, H., et al. (2024). [Ethical considerations for the use of brain–computer interfaces for cognitive enhancement](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3002899). *PLOS Biology*.
- Rainey, S., Maslen, H., & Savulescu, J. (2020). [When thinking is doing: Responsibility for BCI-mediated action](https://pubmed.ncbi.nlm.nih.gov/31955657/). *AJOB Neuroscience*, 11(1), 46-58.

**Key Insight:**
> "It raises questions about autonomy because it's directly modulating the brain... a person who uses a closed-loop system to manage a mood disorder could find themselves unable to have a negative emotional experience, even in a situation in which it would be considered normal."

**How ONI Aligns:**
- Framework accounts for closed-loop system risks in L13 (Semantic) layer
- User override capabilities preserved at every layer
- Regulatory-ready documentation structure

---

### University of British Columbia — Neuroethics Canada

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Judy Illes](https://neuroethics.med.ubc.ca/)** | Professor, Neurology | WHO consultation on neurotechnologies (2024), UNESCO ethics of neurotechnology (2024), Hastings Center Fellow | International standards alignment |

**How ONI Aligns:**
- Framework designed for international regulatory compliance
- Documentation follows transparency principles she advocates

---

### University of Pennsylvania — Center for Neuroscience & Society

Multi-disciplinary center spanning Medicine, Law, Engineering, and Wharton.

**Research Areas:**
- Ethical, legal, and social implications of neuroscience
- Brain data governance frameworks
- Neurotechnology commercialization ethics

**How ONI Aligns:**
- Addresses legal implications through clear attribution
- Provides technical substrate for policy implementation

---

### University of North Carolina — School of Law

**Legal scholarship on neural data privacy and regulatory frameworks.**

**Key Publication:**
- [Examining the New Frontier of Brainwaves and Data Privacy](https://scholarship.law.unc.edu/cgi/viewcontent.cgi?article=1507&context=ncjolt). *North Carolina Journal of Law & Technology*.

**Research Focus:**
- Analysis of existing privacy law gaps for neural data
- Comparison of state-level neurorights legislation (Colorado, California, Minnesota)
- Recommendations for federal neural data protection

**How ONI Aligns:**
- Legal analysis informs ONI's regulatory-ready documentation
- Framework designed to meet emerging legal standards they identify

---

### Tongji University — Intellectual Property & Neurolaw

**International perspective on neural data regulation from Shanghai.**

**Key Publication:**
- [Regulating neural data processing in the age of BCIs: Ethical concerns and legal approaches](https://pmc.ncbi.nlm.nih.gov/articles/PMC11951885/) (2025). *Frontiers in Neuroscience*.

**Research Focus:**
- Comparative analysis of neural data regulation (EU, US, China)
- Intellectual property implications of brain-derived data
- Cross-border neural data governance

**How ONI Aligns:**
- Informs international deployment considerations
- Framework accounts for varying regulatory regimes

---

## Tier 3: Neural Engineering & BCI Development

These researchers advance the BCI technology that ONI aims to secure.

### Stanford University — Neural Prosthetics Systems Lab

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Krishna Shenoy](https://en.wikipedia.org/wiki/Krishna_Shenoy)** (1968-2023) | Professor (deceased) | BrainGate co-founder, Neuralink co-founder, motor cortex decoding | Signal integrity requirements, L9-L10 design |
| **[Jaimie Henderson](https://nptl.stanford.edu/)** | NPTL Co-Director | Clinical BCI trials, paralysis restoration | Real-world deployment constraints |

**Key Achievements:**
- 90 characters/minute typing via neural signals
- 17+ years of safety data on intracortical BCIs
- Elected to National Academy of Medicine (2022)

**How ONI Can Contribute:**
- Security layer for BrainGate-class devices
- Framework for multi-site clinical trial security standardization

---

### Brown University — BrainGate Consortium

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Leigh Hochberg](https://www.braingate.org/team/krishna-shenoy-ph-d/)** | Associate Professor | BrainGate clinical trial director, speech decoding (97% accuracy) | Clinical translation pathway |
| **[John Donoghue](https://www.brown.edu/news/2021-05-12/handwriting)** | Institute Director | BrainGate founder, Utah array pioneer | Historical context, foundational tech |

**Key Achievements:**
- First wireless high-bandwidth human BCI (2021)
- 97% accuracy speech decoding for ALS patients (2023)
- 17+ years adverse event monitoring data

**How ONI Can Contribute:**
- Wireless BCI security protocols
- Long-term implant integrity monitoring

---

### Carnegie Mellon University — Biomedical Engineering

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Bin He](https://engineering.cmu.edu/directory/bios/he-bin.html)** | Trustee Professor | Bidirectional BCI with ultrasound neuromodulation, non-invasive BCI | Non-invasive security considerations |

**Key Achievement (2024):**
First bidirectional BCI integrating EEG decoding with focused ultrasound stimulation, demonstrating machine learning-enhanced BCI performance.

**How ONI Can Contribute:**
- Bidirectional communication security (both encoding and decoding)
- ML model integrity verification for BCI decoders

---

### Caltech — Andersen Lab / Chen BMI Center

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Richard Andersen](https://www.vis.caltech.edu/)** | Professor | Posterior parietal cortex BCIs, internal speech decoding, sensory feedback | Intent decoding security |

**Key Research:**
- BMI devices that predict internal (unspoken) speech
- Bidirectional BMIs with sensory feedback via stimulation
- FDA-approved clinical studies on sensory restoration

**How ONI Can Contribute:**
- Intent privacy protection (L13 Semantic layer)
- Stimulation safety bounds (bidirectional security)

---

### Johns Hopkins University — APL + Physical Medicine

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Pablo Celnik](https://celniklab.johnshopkins.edu/)** | Professor & Director | Bilateral BCI control, non-invasive brain stimulation, motor learning | Dual-hemisphere security |

**Key Achievements:**
- First bilateral MEA implantation (both brain hemispheres)
- Simultaneous control of two prosthetic arms
- Virtual object perception via BCI (mixed reality integration)

**How ONI Can Contribute:**
- Multi-array synchronization security
- Mixed reality BCI attack surface analysis

---

### Duke University — Nicolelis Lab

| Researcher | Role | Key Contributions | ONI Alignment |
|------------|------|-------------------|---------------|
| **[Miguel Nicolelis](https://en.wikipedia.org/wiki/Miguel_Nicolelis)** | Professor | Brain-to-brain interfaces, exoskeleton control (2014 World Cup), tactile feedback | Multi-subject security |
| **[Mikhail Lebedev](https://sites.google.com/site/lebedevneuro/)** | Senior Research Scientist | BMI signal processing, motor intent decoding | Signal processing security |

**Key Achievement:**
2014 World Cup opening kick by paraplegic patient using brain-controlled exoskeleton with tactile feedback.

**How ONI Can Contribute:**
- Brain-to-brain interface security (if BTBI becomes clinical)
- Exoskeleton command verification

---

### Rice University — Neural Interface Lab

**Opened January 2025** — Emerging research center with focus on novel neural interfaces.

**How ONI Can Contribute:**
- Early security-by-design integration opportunity
- Framework adoption during development phase

---

## Research Gaps ONI Addresses

> 🎯 **[View Interactive Gap Analysis →](https://qinnovates.github.io/ONI/visualizations/03-academic-alignment.html)** — Visualize how ONI bridges existing research gaps.

| Gap in Current Research | ONI's Contribution |
|-------------------------|-------------------|
| No unified security model across BCI types | 14-layer model applicable to invasive, non-invasive, and hybrid BCIs |
| Privacy concepts remain theoretical | `BCIAnonymizer` provides executable implementation |
| No standard threat taxonomy | Kohno CIA model + attack pattern library in TARA |
| Layer-by-layer attack surface undefined | ONI explicitly maps attacks to layers L1-L14 |
| Coherence/integrity unmeasured | Cₛ metric provides quantifiable signal trust |
| Neurorights lack technical enforcement | Framework translates rights to technical controls |

---

## Collaboration Opportunities

### For Graduate Study Applications

| Institution | Program | Faculty Alignment | ONI Contribution |
|-------------|---------|-------------------|------------------|
| **University of Washington** | CSE (Security) | Kohno, Goering, Klein | Extend neurosecurity, neuroethics implementation |
| **UC Berkeley** | EECS (Security) | Song | BCI attack vectors, privacy research |
| **Northeastern** | Khoury CS / Archimedes | Fu | Medical device security, FDA pathway |
| **Harvard** | Bioethics / HMS | Lázaro-Muñoz | Technical substrate for ethics research |
| **Columbia** | Neuroscience | Yuste | Neurorights enforcement mechanisms |
| **Yale** | Digital Ethics | Floridi, Schroder | BCI threat modeling, regulatory frameworks |
| **Stanford** | Bioengineering | Henderson (NPTL) | Clinical security protocols |
| **CMU** | Biomedical Engineering | He | Bidirectional BCI security |
| **Brown** | Neuroscience | Hochberg | BrainGate security layer |

### For Research Partnerships

- **Technical Integration:** ONI could serve as security middleware for BrainGate, NPTL, or Chen BMI Center trials
- **Policy Translation:** Framework provides technical reference for neurorights legislation
- **Standards Development:** Contribute to IEEE, ISO neural device security standards

---

## Citation Practices

When referencing foundational work in ONI publications:

### Required Citations (Direct Implementation)
```
Kohno, T., Denning, T., & Matsuoka, Y. (2009). Neurosecurity: Security and privacy
    for neural devices. Journal of Neurosurgery: Focus, 27(1), E7.

Bonaci, T., Calo, R., & Chizeck, H. (2015). App stores for the brain: Privacy &
    security in brain-computer interfaces. IEEE Technology & Society Magazine,
    34(2), 32-39.
```

### Recommended Citations (Theoretical Foundation)
```
Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of
    neuroscience and neurotechnology. Life Sciences, Society and Policy, 13(1), 5.

Yuste, R., et al. (2017). Four ethical priorities for neurotechnologies and AI.
    Nature, 551(7679), 159-163.

Goering, S., & Klein, E. (2020). Neurotechnology and human agency.
    Philosophy & Technology, 33(3), 375-396.

Schroder, T., Sirbu, R., Park, S., Morley, J., Street, S., & Floridi, L. (2025).
    Cyber risks to next-gen brain-computer interfaces: Analysis and recommendations.
    Neuroethics, 18(2).
```

---

## Integrated Research Log

> Tracking research successfully integrated into ONI. See [RESEARCH_INTEGRATION_WORKFLOW.md](resources/workflows/RESEARCH_INTEGRATION_WORKFLOW.md) for the full integration process.

| Date | Paper/Patent | Authors | Type | ONI Component | Status |
|------|--------------|---------|------|---------------|--------|
| 2026-01 | Neurosecurity (2009) | Kohno, Denning, Matsuoka | MODEL | `NeurosecurityFirewall` — CIA threat model | Complete |
| 2026-01 | BCI Anonymizer Patent | Bonaci, Calo, Chizeck | CODE | `BCIAnonymizer` — privacy filtering | Complete |
| 2026-01 | App Stores for Brain (2015) | Bonaci, Calo, Chizeck | MODEL | Neural PII classification | Complete |
| 2026-01 | Four Neurorights (2017) | Ienca, Andorno | ETHICS | L14 Identity layer principles | Complete |
| 2026-01 | Five Neurorights (2017) | Yuste et al. | ETHICS | Framework-wide alignment | Complete |

### Integration Queue

| Priority | Research Area | Researcher | Target | Type | Status |
|----------|---------------|------------|--------|------|--------|
| P1 | BCI cyber threat model | Schroder/Floridi (Yale) | TARA attack scenarios | MODEL | Queued |
| P1 | Bidirectional BCI security | He (CMU) | L8 firewall rules | CODE | Queued |
| P1 | Synaptic reliability data | Hochberg (Brown) | Coherence validation | VALIDATION | Queued |
| P2 | Intent decoding privacy | Andersen (Caltech) | L13 Semantic layer | MODEL | Planned |
| P2 | Closed-loop autonomy | Maslen (Oxford) | User override mechanisms | MODEL | Planned |
| P3 | DBS pediatric ethics | Lázaro-Muñoz (Harvard) | Vulnerable populations | ETHICS | Backlog |
| P3 | Neural data regulation | Tongji University | International compliance | POLICY | Backlog |

---

## Document Maintenance

Update this document when:
- New significant BCI security/neuroethics publications emerge
- Researchers change institutions
- Legislative developments occur
- New collaboration opportunities identified
- Research integrations completed (update log above)

---

*This document was compiled with AI assistance for research synthesis. All academic claims verified against primary sources. Institution and researcher information current as of January 2026.*

---

## Quick Reference: Key Researchers by Domain

### BCI Security & Cybersecurity
- Tadayoshi Kohno (UW) — Foundational neurosecurity
- Tamara Bonaci (UW) — BCI privacy, anonymization
- Howard Chizeck (UW) — Device security, closed-loop systems
- Dawn Song (UC Berkeley) — BCI side-channel attacks, MacArthur Fellow
- Kevin Fu (Northeastern) — Medical device security, FDA advisor
- Tyler Schroder (Yale) — BCI threat modeling, cyber risk analysis
- Luciano Floridi (Yale) — Digital ethics, neural data philosophy

### Neuroethics & Policy
- Sara Goering (UW) — Agency, disability theory
- Eran Klein (UW) — Clinical neuroethics
- Gabriel Lázaro-Muñoz (Harvard) — DBS ethics, pediatric
- Rafael Yuste (Columbia) — Neurorights, BRAIN Initiative
- Marcello Ienca (TU Munich) — Neurorights theory
- Hannah Maslen (Oxford) — Autonomy, regulation
- Judy Illes (UBC) — International standards

### Neural Engineering
- Leigh Hochberg (Brown) — BrainGate, clinical trials
- Richard Andersen (Caltech) — Intent decoding
- Bin He (CMU) — Bidirectional BCI
- Pablo Celnik (Johns Hopkins) — Bilateral BCIs
- Miguel Nicolelis (Duke) — Exoskeletons, BTBI
