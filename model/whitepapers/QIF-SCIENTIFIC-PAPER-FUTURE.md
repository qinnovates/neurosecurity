# QIF Scientific & Mathematical Reference

## QIF: Quantified Interconnection Framework for Neural Security

### A Unified Physics-Based Security Architecture for Brain-Computer Interfaces

---

> *"Like all things that matter, we are deeply entangled. It is rooted in laws that define the universe we exist in. From silicon to synapse, and security to ethics. Life's most important connections deserve the most thought."*
> — Kevin Qi

**Version:** 8.0 Scientific Reference
**Date:** 2026-03-12
**Author:** Kevin Qi
**Status:** Living reference document for scientific and mathematical content
**Current Whitepaper:** [QIF Whitepaper v8.0](https://qinnovate.com/research/whitepaper/) — the canonical, up-to-date framework document
**Academic Preprint:** [DOI: 10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105) — *Securing Neural Interfaces: Architecture, Threat Taxonomy, and Neural Impact Scoring for Brain-Computer Interfaces* (Qi, 2026)

> **Purpose:** This document serves as the scientific and mathematical deep-dive companion to the [QIF Whitepaper v8.0](https://github.com/qinnovates/neurosecurity/blob/main/model/whitepapers/QIF-WHITEPAPER-V8-DRAFT.md). It preserves the full derivation context, formulas, and validation roadmap for all quantitative claims. The whitepaper references this document for detailed scientific and mathematical treatment.

---

## The Three Pillars of Qinnovate

Securing a brain-computer interface is not a single problem --- it is three interlocking problems that must be solved together. Qinnovate addresses all three with an integrated stack: a threat model, a wire protocol, and a compression engine. Each pillar is independently useful, but their power is in the combination.

### QIF --- Quantified Interconnection Framework

**The threat model.** An 11-band hourglass architecture that maps every attack surface from neural tissue to synthetic systems. Includes a coherence metric (`Cs`) for real-time signal integrity monitoring, a 109-technique threat taxonomy (TARA), and a neural impact scoring system (NISS). Defines *what* to defend and *how to measure* whether it's working.

### NSP --- Neural Sensory Protocol

**The wire protocol.** A five-layer post-quantum specification that wraps every BCI data frame in ML-KEM key exchange, ML-DSA signatures, and AES-256-GCM encryption --- at 3.25% power overhead on implanted devices.

### Runemate --- Project Runemate / Runemate Forge

**The compression engine.** An HTML-to-bytecode compiler (Staves) that compresses BCI interface content 65--90%, making post-quantum encryption cost-free for pages above 23 KB. Built in Rust with IEC 62304 Class C certification path.

### Why all three are required

**QIF without NSP** is an architecture with no wire format. It can identify threats but cannot stop them in transit.

**NSP without QIF** lacks a threat model and has no signal integrity layer. It encrypts data but cannot tell whether the data itself has been manipulated at the electrode-tissue boundary.

**Both without Runemate** face a bandwidth wall. Post-quantum key sizes are 18--46x larger than classical equivalents. On a device with a 40 mW power budget transmitting over BLE, this overhead is the primary barrier to PQC adoption.

**Together:** a fully post-quantum-secured BCI stack that is feasible today, on current hardware, at 3.25% power overhead, with net bandwidth savings for typical interface content. QIF defines *what* to protect. NSP defines *how* to protect it. Runemate makes that protection *practical*.

> QIF --> threat model feeds --> NSP --> bandwidth unlocked by --> Runemate

---

## Prologue

My entire career has been taking signals, literally garbage to most, and making them actionable intelligence. Network traffic that looks like noise until you decompose it. Threat indicators buried in logs that nobody reads. Patterns in data that become predictions when you know what to look for.

This framework applies that same discipline to the most consequential signals of all: the electrical patterns that constitute human thought.

Psychology, ethics, neuroscience, security, physics. Five disciplines that study the same system from different angles. The common denominator is information processing in biological substrate. Physics describes how signals propagate through ions and voltage-gated channels. Neuroscience describes how the substrate processes them into perception, memory, and motor output. Psychology describes the behavior that emerges. Ethics defines which boundaries must not be crossed. Security builds the controls that enforce those boundaries.

Everything in the chain reduces to the same molecular event: ions crossing a membrane. Na+, K+, Ca2+, Cl- moving through channels 0.1 nanometers wide. Calculus models this process from organ scale down to the single neuron. Below that, at the ion channel gate, calculus breaks and quantum mechanics takes over. The "indeterminacy" in this framework's original name is not a metaphor. It is the mathematical phase transition where continuous models fail and probabilistic ones begin.

QIF is the synthesis. It takes the signal processing principles that protect networks, the physics that governs neural tissue, the ethics that define neurorights, and the engineering that builds implants, and connects them into one testable architecture. The hourglass model maps the full path: from deterministic silicon through stochastic biology into chaotic and quantum-uncertain neural dynamics. The coherence metric measures integrity at every band. The threat taxonomy classifies 109 ways the system can be attacked. The wire protocol secures the channel. The firewall enforces policy at the boundary.

From silicon to synapse, from security to ethics, these connections run through the same physics, the same calculus, the same molecular events at the ion channel gate.

---

## 1. Abstract

Brain-computer interfaces are advancing from experimental medical devices toward consumer technology, yet no security framework addresses the unique physics of the neural-synthetic boundary. This paper presents the Quantified Interconnection Framework (QIF), an 11-band hourglass security architecture spanning from neural tissue to synthetic systems. QIF provides: a coherence metric (Cs) for real-time signal integrity monitoring grounded in spectral decomposition via the Short-Time Fourier Transform (STFT); TARA, a 109-technique dual-use threat taxonomy with four-dimensional projections across security, clinical, diagnostic, and governance domains; NISS v2.0, a proposed BCI-native severity scoring system extending CVSS with six neural impact dimensions, 42 ICD-10-CM neurological conditions, and five neurological weighting factors designed to address CVSS limitations for neural-specific impact assessment; and the Neural Sensory Protocol (NSP), a five-layer post-quantum communication protocol integrating coherence scoring with ML-KEM key exchange, ML-DSA authentication, and AES-256-GCM encryption.

We identify five cross-domain attack coupling mechanisms by which synthetic-domain signals reach neural tissue, with intermodulation attacks representing the most dangerous class because they are undetectable from signal data alone. A CVE coverage analysis maps 55 NVD-verified CVEs to 21 of 109 TARA techniques, revealing an 81.25% clinical blind spot: attacks that are physically feasible and clinically harmful but have zero CVE tracking. Physics feasibility tiering classifies all 109 techniques by hardware gate, enabling timeline projections for when specific attacks become feasible.

A DSM-5 diagnostic mapping links 102 of 109 techniques to psychiatric diagnostic categories (for threat modeling purposes) via the Neural Impact Chain, organized into five diagnostic clusters. Per-technique FDORA/524B regulatory scoring identifies coverage gaps across all five FDORA cybersecurity requirements. Origin attribution classifies the provenance of all 109 techniques, distinguishing literature-derived attacks from novel QIF contributions.

We present Neurowall, a three-layer wearable neural firewall reference implementation validated at 100% true positive rate and 0% false positive rate across 50 simulation runs. We additionally present Project Runemate, a content compression pipeline offsetting PQC bandwidth overhead by 65--90%. A neurosecurity policy framework maps the regulatory gap across 25 organizations and proposes specific asks for six standards bodies (NIST, MITRE, FIRST, IEEE, FDA, UNESCO). A governance, risk, and compliance (GRC) alignment analysis maps abstract neurorights (cognitive liberty, mental privacy, mental integrity, psychological continuity) to auditable technical controls, including a per-technique Consent Complexity Index (CCI) measuring the gap between legal and meaningful consent. A unified data platform consolidates 26 BCI companies, 34 devices, 44 funding rounds, 25 market estimates, 328+ research sources, and all framework outputs into an open JSON API with KQL-style search across 39 tables and 860+ queryable records, enabling manufacturers, regulators, and investors to query the BCI security landscape without building their own data infrastructure. An investment analysis quantifying $4.8B cumulative VC deployment against $0 documented security spending establishes the market context for neurosecurity as a discipline. A market trajectory analysis applies five economic frameworks, from institutional capital indexes (PitchBook-NVCA, Cambridge Associates, Preqin) through the security spending lag model observed in internet, cloud, IoT, and automotive cybersecurity, to position BCI in its pre-inflection window and project a $150M-1B+ neurosecurity TAM by 2034. An attack primitive decomposition from physics first principles identifies six irreducible attack primitives (charge, field, signal, protocol, pattern, behavior) validated against all 109 TARA techniques and 12 BCI Limits Equation constraints, establishing that neuroethics and neurosecurity are operationally inseparable: they protect the same system at different layers of abstraction.

---

## 2. Introduction

Security is signal processing. Every firewall is a frequency filter. Every intrusion detection system is a spectral analyzer separating legitimate traffic from anomalous patterns. Every encryption protocol is a signal transformation that makes data unreadable to unauthorized receivers. The discipline has always been about taking raw signals, decomposing them, and making decisions based on what the decomposition reveals.

Brain-computer interfaces present the same problem in a new medium. The signals are neural oscillations instead of network packets. The channel is an electrode-tissue boundary instead of a TCP socket. The stakes are cognition and identity instead of data and uptime. But the underlying task is identical: monitor signal integrity, detect anomalies, classify threats, enforce policy. The physics changes. The signal processing does not.

This paper builds a security framework from that observation. QIF treats the BCI as a signal processing system spanning two domains (synthetic and neural) connected through a single physical bottleneck (the electrode-tissue interface, I0). Every component of the framework, from the coherence metric to the threat taxonomy to the wire protocol, is derived from signal processing first principles applied to the physics of neural tissue.

### 2.1 The Containment Principle

Every civilization that has built critical infrastructure has independently converged on a single architectural pattern: *containment*. The word "paradise" descends from the Old Persian *pairi-daeza* --- a walled enclosure designed to separate a restorative interior from a hostile exterior [74]. This is not metaphor. It is engineering.

The pattern is invariant across domains and millennia. The Theater of Epidaurus (~340 BCE) uses corrugated limestone seating as a frequency filter, suppressing crowd noise below 500 Hz while passing human speech --- a principle confirmed to be identical to modern acoustic padding [77]. Frederick Law Olmsted's Central Park (1858) implements a layered acoustic defense: walls, vegetation, sunken roads, water features, and 18,000 trees attenuate Manhattan's 85 dB street noise to 54 dB at the interior --- making the park sound four times quieter than the city surrounding it [75][76]. The blood-brain barrier (BBB) imposes a molecular weight cutoff at approximately 400 Daltons, blocking over 98% of small-molecule drugs [78]. Network firewalls, cell membranes, and Faraday cages all implement the same strategy: selective, threshold-based attenuation that preserves necessary signals while blocking harmful ones.

Seven invariant properties emerge across all containment architectures: (1) **selective permeability**; (2) **frequency-dependent attenuation**; (3) **threshold-based design**; (4) **layered redundancy**; (5) **active maintenance**; (6) **adaptation to threat spectrum**; (7) **breach consequence cascade**. Maturana and Varela (1972) formalized this in their theory of autopoiesis: a living system produces and maintains its own boundary, and that boundary is a *precondition* for cognition, not incidental to it [79].

The brain already has containment architecture, and it is layered. The BBB's endothelial tight junctions, backed by astrocyte endfeet and pericytes, have maintained neural tissue integrity for hundreds of millions of years. Beneath the BBB, **myelin sheaths** provide a second containment layer: lipid-rich insulation that maintains action potential propagation velocity and prevents signal crosstalk between adjacent axons. When myelin degrades --- whether from autoimmune demyelination (multiple sclerosis), nutritional deficiency (B12-dependent subacute combined degeneration), or chronic inflammation --- the consequences are precisely what the classical terms in Section 5.2 measure: phase coherence collapses as signals desynchronize across channels, transport entropy rises as transmission becomes unreliable, and amplitude stability deteriorates as saltatory conduction fails. The clinical result is cognitive impairment, peripheral neuropathy, and in severe cases, irreversible neural pathway reorganization. A vitamin deficiency can degrade a person's neural containment architecture to the point of incoherence. The fragility is real.

BCI electrode implantation *physically breaches* both layers, creating localized BBB disruption, immune cascades, glial scarring, and chronic neuronal loss [82]. The classical physics of what this containment protects was formalized by Hodgkin and Huxley (1952) [73], whose conductance model treats ion channels as deterministic gates --- effective, but incomplete at the nanoscale where quantum tunneling permits ion current through classically "closed" channels. Any containment architecture for BCIs must account for both classical and quantum-scale signal propagation.

QIF is, at its foundation, containment architecture for the electrode-tissue interface --- the first proposed engineered boundary designed to attenuate harmful signals below a neural damage threshold while preserving the functional signaling the interface exists to measure. The 11-band hourglass is the architecture of that boundary. The coherence metric is its measurement. NSP is the protocol that enforces it.

That boundary is no longer theoretical. The devices that need it are already inside human skulls.

### 2.2 The BCI Revolution

Brain-computer interfaces have crossed a critical threshold. Neuralink's N1 implant records from 1,024 electrodes sampling at approximately 20 kHz, transmitted wirelessly over Bluetooth Low Energy [38]. What was once a laboratory instrument confined to severely disabled patients is on a trajectory toward consumer adoption.

The scale of BCI development is accelerating. The BISC platform (Columbia/Stanford, 2025) achieved 65,536 electrodes with 100 Mbps wireless bandwidth [60]. Chinese programs at NeuCyber, NeuroXess, and Wuhan University have demonstrated bidirectional interfaces with up to 65,000 channels. Merge Labs raised $252M for ultrasound-based noninvasive high-bandwidth neural interfaces. Battelle's BrainSTORMS program (DARPA N3) uses injectable magnetoelectric nanoparticles.

The concept of a brain-computer interface is not new. The reader processing this sentence is demonstrating one. Photons from a display strike the retina, triggering phototransduction cascades that propagate through the optic nerve to the visual cortex. At every synapse along this pathway, neurotransmitter vesicles dock via SNARE protein complexes involving quantum-scale energy transfers [12], and ions traverse voltage-gated channels through quantum tunneling even when the channels are classically closed [11], [14]. The information on the screen reaches the reader's neurons through a chain that already includes quantum-mechanical processes at every synaptic junction. What implanted BCIs change is not the fundamental physics but the *distance* of the tunnel: replacing centimeters of optical and neural relay with millimeters of electrode-tissue contact. The underlying quantum phenomena at the synaptic interface remain identical. This is why a security framework must be grounded in the physics of that interface rather than the engineering of the sensor alone.

### 2.2.1 Why Cybersecurity Needs Neuroethics

Cybersecurity has always been reactive. The internet ran for a decade before the first firewall. Cloud computing scaled for five years before CASB vendors existed. IoT shipped billions of devices before Mirai proved they were weaponizable. The pattern is consistent: technology ships, breaches happen, frameworks follow. The industry builds the house, then installs the locks after the first break-in.

The brain is a different attack surface. A compromised server loses data. A compromised neural interface can alter perception, suppress motor function, infer emotional state, or induce psychiatric symptoms mapped to DSM-5 diagnoses (Section 6.10). The target is not information. The target is cognition. When the attack surface is the human mind, reactive security is not acceptable because the damage may be irreversible: neuroplasticity means the brain physically rewires in response to sustained aberrant input. Rebooting or restarting an implant is not a viable remediation strategy --- unlike a compromised server that can be reimaged, cycling power on a neural interface does not undo the biological changes that occurred during the compromise. The implant restarts; the brain does not. This introduces a cascade of safety and security implications: glial scarring at the electrode-tissue boundary may worsen with power interruptions, therapeutic stimulation schedules are disrupted, and any neuroplastic rewiring that occurred during the attack persists in the patient's neural architecture regardless of the device's operational state. There is no "restore from backup" for a brain that has already adapted to malicious input.

This is where neuroethics and neurosecurity converge. They protect the same thing: the integrity of human information processing in biological substrate. Neuroethics defines *what* to protect. Four neurorights, formalized by Ienca and Andorno (2017) [50], establish the boundaries: cognitive liberty (the right to alter or not alter one's own mental states), mental privacy (protection against unauthorized access to neural data), mental integrity (protection against unauthorized modification of neural function), and psychological continuity (preservation of personal identity and cognitive baseline over time). These are not philosophical abstractions. Chile wrote them into its constitution in 2021. California codified neural data as sensitive personal information in SB 1223 (effective January 2025). The MIND Act (S. 2925) proposes federal neural data standards. Seven jurisdictions have enacted or proposed neurorights legislation as of February 2026 (Section 11.3).

Neurosecurity defines *how* to protect them. The coherence metric ($C_s$) measures signal integrity. TARA maps 109 attack techniques. NISS scores neural impact across six dimensions including cognitive reconnaissance, cognitive disruption, and neuroplasticity. NSP encrypts the wire with post-quantum cryptography. Neurowall enforces policy at the electrode boundary. Without neuroethics, security has no mandate: no definition of what constitutes a violation. Without security, neuroethics has no mechanism: no way to detect, prevent, or measure a violation. They are operationally inseparable.

The technical landscape confirms this. Decomposing all 109 TARA techniques to their smallest physics unit yields six irreducible attack primitives, ordered by spatial scale:

| # | Primitive | Scale | TARA Techniques | What It Attacks |
|---|----------|-------|----------------|-----------------|
| 1 | **Charge** | ~0.1 nm (atomic) | 0 (dormant) | Ion flow through voltage-gated channels |
| 2 | **Field** | nm to um | 0 (dormant) | EM fields across membranes, ephaptic coupling |
| 3 | **Signal** | um to cm | 42 (38.5%) | Voltage waveforms, action potentials, oscillations |
| 4 | **Protocol** | cm to m | 4 (3.7%) | Synaptic transmission, neurotransmitter release |
| 5 | **Pattern** | Distributed | 32 (29.4%) | Neural ensemble activity, cognitive state encoding |
| 6 | **Behavior** | Whole-organism | 31 (28.4%) | Motor output, decisions, emotional state |

In traditional cybersecurity (OSI model), all six layers are fully understood and controllable. In the neural domain, primitives 1-3 (charge, field, signal) are well-modeled by Hodgkin-Huxley electrophysiology [73]. Primitive 4 (synaptic protocol) is partially understood. Primitives 5-6 (how patterns become cognition and behavior) remain open problems in neuroscience. This is the exact boundary where physics meets ethics: we can measure and protect signals, but we cannot yet fully model how those signals become thoughts. The BCI Limits Equation (Entry 60) formalizes 12 physics constraints on what implants can do. Eight of those constraints operate at the Signal level. Two at Protocol. Two at Pattern. Zero at Charge, Field, or Behavior. The constraints cluster where our models are strongest, leaving the cognitive layers where neurorights violations actually occur with the least formal protection.

Charge and Field attacks are currently infeasible because electrodes (~50 um) are 500x larger than ion channels (~0.1 nm). When electrode technology scales to nanometer resolution post-2030, these primitives activate. The taxonomy is built to absorb them.

The common denominator across neuroscience, psychology, ethics, and security is information processing in biological substrate. Physics describes how signals propagate. Neuroscience describes how the substrate processes them. Psychology describes the emergent behavior. Ethics defines the boundaries. Security builds the controls. Five disciplines, one system. The QIF hourglass maps this entire path: from synthetic signal generation (S3) through the interface boundary (I0) into neural processing (N1-N7). The hourglass is the common denominator expressed as architecture.

Like all things that matter, these disciplines are deeply entangled. They are rooted in the same laws that define the universe we exist in. From silicon to synapse, from security to ethics, these connections run through the same physics, the same calculus, the same molecular events at the ion channel gate. Life's most important connections deserve the most thought.

### 2.3 The Industry Gap

BCI security is not an established field. It is an emerging one, with approximately 50 active researchers worldwide and roughly 85 published papers across two decades [54], [83], [84], [85]. No manufacturer of implanted BCIs has published security documentation for their devices. Not Neuralink. Not Synchron. Not Blackrock Neurotech. Not Paradromics. Each of these companies has cleared FDA regulatory hurdles, passed cybersecurity reviews under Section 524B, and deployed or announced implantable neural interfaces, yet none has published a threat model, vulnerability assessment, or security architecture specific to the neural-synthetic boundary.

This is not an accusation. These companies are in a race to prove clinical efficacy, achieve commercial viability, and establish market position. Security documentation is not what wins FDA clearance or Series B funding. The incentive structure works against it.

The institutional landscape reflects the same gap. The FDA requires cybersecurity documentation under Section 524B [87] but provides no neural-specific threat taxonomy to model against. MITRE ATT&CK, the industry standard for threat classification, covers enterprise IT, mobile, ICS, cloud, and containers but has no sub-matrix for neural endpoints. CISA has published zero advisories specific to BCI devices. The IEEE Brain Initiative's standards roadmap explicitly identifies BCI cybersecurity as an open standardization gap requiring a new working group. The GAO's 2025 report on neurotechnology governance recommends security measures but notes no existing standard to reference. NIST's Cybersecurity Framework 2.0 contains no neural-specific subcategories for integrity or confidentiality.

The result: a BCI manufacturer can be FDA-cleared, HIPAA-compliant, and ISO 27001-certified with zero protections against adversarial neurostimulation, neural signal tampering, or cognitive state inference. Every box is checked. No patient is protected against neural-specific attacks.

QIF exists to close this gap. Not to slow innovation, but to do the security homework so that when compliance requirements arrive, the groundwork is already laid. BCI companies should keep innovating. QIF builds the security framework in parallel so it is ready when the industry needs it.

### 2.3.1 The Investment Signal

The gap between BCI investment and BCI security spending is not merely an observation. It is quantifiable, and the numbers carry strategic implications.

Venture capital deployed into brain-computer interfaces has accelerated from $662M across 127 deals in 2022 to an estimated $2.3B across 129 deals in 2024 (PitchBook; Neurotechnology Substack, 2024 Funding Snapshot). Cumulative tracked funding exceeds $4.8B. Median market size estimates across 9 analyst firms place the BCI market at approximately $2.3B in 2024, with a median projected CAGR of 15.1--16.8% (Grand View Research, Precedence Research, Straits Research, Mordor Intelligence, BCC Research, Allied Market Research, SNS Insider, Astute Analytica, Verified Market Research). Projected market size by 2030 ranges from $2.1B (Mordor, narrow definition) to $6.5B (Grand View), with a median of approximately $4.5B. By 2035, projections reach $11--19B depending on the source.

These are not speculative projections from a single firm. Nine independent market research organizations, using different methodologies and market definitions, converge on the same trajectory: BCI is a multi-billion-dollar market growing at double-digit CAGRs through the end of this decade.

The investors confirm the thesis. OpenAI led Merge Labs' $252M seed round in 2025, valuing the company at $850M post-money. That $252M represents approximately 3% of OpenAI's estimated annual operating expenditure ($8.5B for 2025/2026, per Portfolio Impact 1 analysis). Google Ventures invested in Neuralink. Bezos Expeditions backed Synchron. Meta acquired CTRL-Labs for over $500M. These are not speculative bets by niche biotech funds. They are strategic investments by the largest AI and technology companies in the world, signaling that neural interfaces are considered a natural extension of the AI compute stack.

The cross-portfolio pattern is revealing. The same investors who backed early AI infrastructure (2015--2018) are now allocating to BCI (2023--2026). This mirrors the pattern observed in autonomous vehicles (2014--2016 investment surge, followed by a cybersecurity investment wave post-2020 when UN Regulation No. 155 mandated vehicle cybersecurity management systems). Automotive cybersecurity grew from approximately $1.7B in 2019 to $4.7B in 2025 following regulatory catalysts. BCI is pre-regulation. The analogous regulatory catalyst, a BCI-specific FDA guidance or ISO standard, has not yet arrived, but the precursors are visible: FDORA Section 524B (October 2023) mandated cybersecurity for all medical devices, FDA cybersecurity deficiency letters increased 700% in the year following (MedCrypt, 2024), and the GAO's 2025 report explicitly noted that consumer BCIs face "essentially no federal privacy or security laws."

Documented BCI security spending across all tracked companies: $0. Not "approximately zero." Zero. No BCI company has published a security audit, launched a bug bounty program, or publicly disclosed a dedicated CISO hire. For comparison, BMW's single infotainment platform security program is estimated at $180M. The average healthcare data breach costs $9.77M (IBM Cost of a Data Breach, 2024). The entire BCI industry's documented investment in securing neural data is less than the cost of a single hospital ransomware incident.

If BCI follows the healthcare industry's security spending baseline of 6--7% of revenue (IANS Research; Gartner), the total addressable market for BCI security in 2024 is approximately $150M, growing to $360M by 2030 and $750M by 2035 at median CAGR projections. These are conservative estimates based on the lowest comparable industry benchmark. Financial services allocates 9.6--15% of IT budget to security (Gartner, 2024). Medical device cybersecurity is already a $9.87B market (Precedence Research, 2025).

The investor landscape reveals deeper patterns. Cross-portfolio analysis of 135 unique named investors across 44 funding rounds identifies three multi-BCI venture firms. ARCH Venture Partners holds positions in Synchron, Neuralink, and Science Corporation, diversified across endovascular, invasive, and vision restoration modalities. Khosla Ventures has positions in Synchron, Paradromics, and Kernel, covering three distinct technical approaches. Founders Fund backs both Neuralink and Precision Neuroscience. An estimated 55--65% of the top 20 VC firms by AUM now have at least one confirmed BCI investment (Sequoia, Lightspeed, Thrive Capital, General Catalyst, Bain Capital, B Capital, ARK Invest, among others). This is a remarkable concentration for a pre-commercial sector.

Sovereign wealth funds have entered BCI directly. Qatar Investment Authority (QIA) is the only confirmed sovereign fund with positions in both Neuralink (Series E) and Synchron (Series D), hedging across the two highest-valued BCI companies. NEOM Investment Fund (Saudi Arabia's PIF-backed entity) made a strategic investment in Paradromics (February 2025). Mubadala (UAE) participated in Precision Neuroscience's Series B. In-Q-Tel (IQT), the US intelligence community's venture arm, invested in Synchron's Series D (November 2025), signaling that national security stakeholders now view neural interfaces as a strategic technology. The US Department of Defense backed Synchron's Series A as early as 2017.

Private equity engagement remains limited. The sector is too early-stage for PE rollup strategies. The closest activity is Tether's $200M acquisition of majority stake in Blackrock Neurotech (April 2024), representing the first cryptocurrency-to-neurotech capital crossover. Traditional PE firms (Concord Health Partners for MindMaze, IDG Capital and Walden International for BrainCo's $286M late-round) are entering through healthcare and hardware verticals. Duquesne Family Office (Stanley Druckenmiller) participated in Precision Neuroscience's Series C.

No institutional investors (Vanguard, BlackRock Asset Management, Fidelity) have direct BCI positions. BCI remains too early for traditional index-fund inclusion. Their exposure, if any, is indirect through LP commitments to ARCH, Founders Fund, Khosla, and similar VC vehicles.

The investment data is compiled in a structured database (Section 7.8) and is queryable via KQL-style syntax at the project's BCI Landscape endpoint. All 26 tracked companies, 44 funding rounds with 135 named investors, 25 market estimates from 12 analyst firms, cross-portfolio analysis of 13 multi-BCI VCs, 4 sovereign wealth funds, 6 Big Tech corporate ventures, 6 PE firms, 3 intelligence/defense investors, and per-company risk profiles with security posture scoring are openly available for independent verification.

### 2.4 Statement of Novelty

The core novelty of the Quantified Interconnection Framework is the **synthesis of BCI security, post-quantum cryptography, and neurosecurity governance into a single, integrated, and empirically falsifiable architecture.** While prior work exists in each domain individually, QIF is the first framework to formally connect them.

Specifically, the contributions are not the individual components, but their integration:

- **From Physics to Protocol.** QIF provides a continuous architectural path from signal integrity monitoring at the electrode-tissue boundary to a post-quantum cryptographic wire protocol (NSP). No other framework bridges this physical-to-digital gap.
- **Mechanism-First Taxonomy.** The Locus Taxonomy and TARA registry are the first threat classification systems designed for the unique dual-use nature of neural interfaces, where attack vectors and therapeutic mechanisms share the same physics. 109 techniques across 7 domains and 11 tactics, each scored with a neural-native impact system (NISS).
- **From Taxonomy to Policy.** QIF maps abstract neurorights (cognitive liberty, mental privacy, mental integrity, psychological continuity) to measurable technical controls, bridges the gap between medical device regulation and cybersecurity governance, and proposes concrete asks for six international standards bodies.
- **Validated Reference Implementation.** Neurowall demonstrates that the coherence metric and policy engine can detect simulated neural attacks at 100% TPR / 0% FPR, moving the framework from theory to testable prototype.

Previous BCI security work has either proposed attack taxonomies without defenses, or proposed defenses without a comprehensive threat model. QIF provides both, along with the governance framework to operationalize them.

### 2.5 What This Paper Delivers

This paper presents twenty contributions:

1. An **11-band hourglass architecture** (v4.0) spanning the neural-synthetic boundary with 7-1-3 asymmetry, derived from neuroanatomy rather than networking analogy.
2. A **coherence metric** (Cs) for real-time signal integrity monitoring, grounded in spectral decomposition via the STFT, combining phase coherence, transport entropy, amplitude stability, and scale-frequency validation.
3. Identification of **five cross-domain attack coupling mechanisms** and honest assessment of which attacks the coherence metric can and cannot detect.
4. **TARA** (Therapeutic Atlas of Risks and Applications), a 109-technique dual-use registry with 22+ fields per technique spanning security, clinical, diagnostic, governance, and provenance dimensions.
5. **NISS v2.0** (Neural Impact Scoring System), a proposed BCI-native severity scoring system extending CVSS with six neural impact dimensions, five neurological weighting factors, 42 ICD-10-CM neurological conditions, and KQL-queryable metric decomposition.
6. A **CVE coverage analysis** mapping 55 NVD-verified CVEs to TARA techniques, quantifying an 81.25% clinical blind spot.
7. **Physics feasibility tiering** classifying all 109 techniques by hardware gate (61 feasible now, 11 near-term, 10 mid-term, 2 far-term, 18 software-only).
8. A **DSM-5 diagnostic mapping** linking 109 techniques to psychiatric diagnostic categories (for threat modeling purposes) via the Neural Impact Chain, organized into five diagnostic clusters.
9. **Per-technique FDORA/524B regulatory scoring** with coverage gaps identified for each of five FDORA requirements.
10. The **Neural Sensory Protocol (NSP)**, a five-layer post-quantum communication protocol for BCI data.
11. **Project Runemate**, a content compression pipeline that offsets PQC bandwidth overhead by 65--90%.
12. **Neurowall**, a three-layer wearable neural firewall reference implementation validated at 100% TPR / 0% FPR.
13. A **neurosecurity policy framework** with regulatory coverage mapping across 25 organizations and specific asks for six standards bodies.
14. A **GRC alignment analysis** mapping neurorights to auditable technical controls, including a per-technique Consent Complexity Index (CCI), and tracking enacted legislation across 7 jurisdictions.
15. **Origin attribution** classifying the provenance of all 109 techniques (49 literature, 46 recontextualized, 6 QIF-original, 5 chain synthesis, 3 neuroethics formalized).
16. A **unified data platform** with open JSON API, KQL-style search across 39 tables (860+ records), 26-company BCI landscape database with investment tracking, market forecasts from 12 analyst firms, and 328+ compiled research sources (Section 7.8).
17. An **investment gap analysis** quantifying $4.8B cumulative BCI venture capital deployment against $0 documented security spending, with TAM/SAM/SOM projections, automotive cybersecurity convergence timeline, and per-company risk profiling (Section 2.3.1).
18. A **market trajectory analysis** applying five economic frameworks (institutional capital indexes, cross-sector capital flow, security spending lag model, technology adoption S-curve, Elliott Wave analysis) to position BCI in its pre-inflection window and project a $150M-1B+ neurosecurity TAM (Section 13).
19. An **attack primitive decomposition** identifying six irreducible attack primitives from physics first principles (charge, field, signal, protocol, pattern, behavior), validated against all 109 TARA techniques and 12 BCI Limits Equation constraints, establishing why neuroethics and neurosecurity are operationally inseparable (Section 2.2.1).
20. A **determinism gradient and neurorights decomposition** reframing the hourglass bands as a physics-grounded spectrum from deterministic (S-bands) through stochastic and chaotic (N1-N5) to quantum-indeterminate (N6-N7), and mapping four neurorights to four measurable dynamical system operations: input control, state preservation, trajectory preservation, and measurement protection (Section 9).

---

## 3. Background and Related Work

Every BCI interaction, whether recording or stimulation, reduces to the same molecular event chain: ions crossing membranes through protein channels. The chain, from smallest to largest:

Ions (Na+, K+, Ca2+, Cl-) traverse voltage-gated ion channels (~0.1 nm selectivity filter, ~10 nm total protein diameter). Ion flux triggers neurotransmitter synthesis and release (dopamine ~0.5-1 nm, serotonin ~0.6 nm) from synaptic vesicles (~40 nm). Neurotransmitters bind to postsynaptic receptors (D1/D2 dopamine receptors, NMDA glutamate receptors, ~10-15 nm). Receptor activation propagates through intracellular signaling cascades, modulating neuronal firing patterns across neurons (~10-100 um soma diameter) organized into circuits spanning millimeters to centimeters.

This chain matters for security because every attack on a BCI ultimately targets some point along it. Signal injection targets the ion-to-voltage conversion at the electrode. Entrainment attacks target oscillatory synchronization across neural populations. Neurotransmitter disruption targets the chemical signaling between neurons. The six attack primitives derived in Section 2.2.1 (charge, field, signal, protocol, pattern, behavior) map directly to spatial scales along this molecular chain: charge operates at the ion (~0.1 nm), signal at the neuron (~10-100 um), behavior at the whole organism.

The mathematics that models this chain also has a boundary. Calculus (differential equations, Hodgkin-Huxley, Maxwell) provides accurate descriptions from organ scale (~cm) down to single neuron (~um). At the ion channel selectivity filter (~0.1 nm), classical models break down and quantum mechanics is required (Section 3.3). The coherence metric $C_s$ operates in the calculus regime. The quantum terms in the long-term theoretical extension (Section 13.4) reach into the sub-calculus regime. This is not an abstraction: it is the reason the framework spans both classical signal processing and quantum biology.

### 3.1 BCI Security Literature

Denning, Matsuoka and Kohno (2009) published the foundational paper "Neurosecurity: Security and Privacy for Neural Devices" in *Neurosurgical Focus*, coining the term "neurosecurity" and establishing BCI security as a formal research discipline [83]. Martinovic et al. (2012) provided the first experimental demonstration, showing that commercial EEG-based BCIs could be exploited as side-channel attack vectors to extract private information from involuntary brain responses [51]. Pycroft et al. (2016) coined "brainjacking" and enumerated 9 attack techniques specific to implanted neurostimulators [84]. Bonaci et al. (2014) showed that subliminal stimuli embedded in BCI applications could extract private information without the user's awareness [52]. Landau, Puzis and Nissim (2020) mapped attacks across BCI and communication layers in *ACM Computing Surveys* [85]. Frank et al. (2017) provided the first systematic threat taxonomy for BCI systems [53]. Bernal et al. (2022) built the most comprehensive taxonomy to date, cataloging BCI security vulnerabilities across wireless protocols, firmware, and signal processing pipelines [54].

This body of work established BCI security as a legitimate research area. However, the existing literature exhibits three gaps. First, no unified taxonomy organizes BCI threats the way MITRE ATT&CK organizes traditional cybersecurity threats; techniques remain scattered across domain-specific papers. Second, none provide a scoring system that captures neural-specific impact dimensions (biological harm, cognitive integrity, consent violation, reversibility, neuroplasticity). Third, none map the therapeutic dimension: the observation that many attack mechanisms share the same physics as established medical therapies. QIF addresses all three gaps. Spectral analysis, specifically the Fourier transform and its derivatives, is already foundational in network intrusion detection, side-channel analysis, and adversarial ML; QIF extends this paradigm to the neural-synthetic boundary, where frequency-domain decomposition becomes a security primitive (Section 5.3).

### 3.2 Quantum Biology

Lambert et al. (2013) surveyed evidence for quantum effects in biological systems [18]. Tegmark (2000) argued that thermal decoherence in the brain occurs on the order of 10^{-13} seconds [15]. Fisher (2015) proposed that nuclear spin states in Posner molecules could maintain coherence for hours [39]. Perry (2025), in a recent theoretical preprint, suggested collective coherence times of 1--10 ms [55]. QIF sidesteps this unresolved debate by treating the decoherence time as a tunable parameter.

### 3.3 Quantum Tunneling in Neural Systems

The classical foundation for neural signal modeling was established by Hodgkin and Huxley (1952), whose Nobel Prize-winning conductance model described action potential propagation through voltage-gated ion channels using deterministic differential equations [73]. The Hodgkin-Huxley model treats ion channels as classical gates --- either open or closed, with transition rates governed by macroscopic voltage. Subsequent work has revealed quantum-mechanical phenomena at the same ion channel scale that the classical model cannot capture. Qaswal (2019) developed mathematical models for quantum tunneling through *closed* voltage-gated ion channels [11] --- a process forbidden by the Hodgkin-Huxley framework but permitted by quantum mechanics. Summhammer et al. (2012) described quantum-mechanical ion motion within voltage-gated channels [14]. Georgiev and Glazebrook (2018) analyzed quantum physics of synaptic communication via the SNARE protein complex [12]. Kim et al. (2025) discovered under-the-barrier recollision (UBR), revealing tunneling dynamics are more complex than the WKB approximation assumes [57]. The 2025 Nobel Prize in Physics demonstrated quantum tunneling at macroscopic scales in Josephson junction circuits [56]. QIF's tunneling term $\hat{Q}_t$ is, in effect, the quantum correction to Hodgkin-Huxley: it quantifies the security-relevant leakage current that the classical model assumes to be zero.

### 3.4 Post-Quantum Cryptography

NIST finalized three post-quantum cryptography standards in 2024: ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205) [37]. Gidney and Ekera (2021) estimated RSA-2048 could be factored in approximately 8 hours with 20 million noisy qubits [33]. Gidney (2025) revised the estimate downward to fewer than 1 million noisy qubits in under one week [34]. No prior work applies post-quantum cryptography specifically to the BCI electrode-tissue interface.

### 3.5 The Gap QIF Addresses

Despite advances in BCI security and post-quantum cryptography, no prior work synthesizes threat taxonomy, severity scoring, signal integrity monitoring, post-quantum protocols, and governance into a unified framework. The following table maps what each predecessor contributed and what remains unaddressed:

| Source | What They Did | What They Didn't Do |
|--------|--------------|---------------------|
| **FDA / Section 524B** [87] | Mandated cybersecurity documentation for all wireless medical devices | Provided no neural-specific threat taxonomy; references CVSS, which cannot score cognitive harm |
| **MITRE ATT&CK** | Gold standard threat taxonomy for enterprise, mobile, ICS, cloud | No sub-matrix for neural endpoints; no BCI-specific techniques |
| **CISA** | Published medical device advisories (pumps, pacemakers) | Zero advisories for BCI devices; no neural threat intelligence |
| **Lopez Bernal et al.** [54] | Most comprehensive BCI security taxonomy to date (2022); cataloged vulnerabilities across protocols and firmware | No unified scoring system; no clinical/therapeutic mapping; no post-quantum protocol |
| **Schroder et al.** [92] | Identified BCI threat categories including neural data compromise and unintended movement (2025) | Hypothetical threat model only; no enumerated taxonomy or scoring rubric |
| **GAO** (2025) | Recommended neurotechnology security measures in governance report | Noted no existing standard to reference; no technical framework proposed |
| **IEEE Brain Initiative** | Standards roadmap identifying BCI cybersecurity as open gap | No working group launched; no draft standard |
| **BCI Manufacturers** | Achieved FDA clearance, HIPAA compliance, ISO 27001 certification | Zero published security documentation specific to neural-synthetic boundary |

The pattern is consistent: regulatory bodies mandate security without providing neural-specific tools. Researchers identify threats without building defenses. Standards bodies acknowledge the gap without filling it. Manufacturers comply with existing frameworks that were not designed for neural endpoints. QIF fills the space between mandate and implementation.

---

## 4. QIF Hourglass Model (v4.0)

### 4.1 3D Hourglass Visualization Standard

The complexity of an 11-band neural-synthetic stack requires more than a 2D diagram can provide. QIF v5.2 adopts the **3D Hourglass Model** as its canonical visualization.

- **Vertical Axis (Z)**: Represents **Temporal Depth**. Lower frequencies (Delta) occupy the broader base/top, while high-frequency interfaces (I0/S1) form the narrow, high-density center.
- **Radial Axis (XY)**: Represents **State Space Complexity**. The width of each band corresponds to the number of degrees of freedom (e.g., N7 Neocortex having the highest radial extent).
- **Core Stability**: The central Scribe/Forge interaction forms the "axle" of the hourglass, representing the minimal trusted computing base (TCB) of the entire system.

### 4.2 Impact Chain Visualization

Aggregated threats are visualized using a **Neural Impact Chain (Network Graph)**. This creates a directed acyclic graph (DAG) where nodes represent hourglass bands and edges represent exploit paths (Mechanism A--E). This allow security operators to see not just *what* is targeted, but the **propagation path** through the neural hierarchy.

### 4.1 Design Principles

Three principles govern the design. **Width represents state space**: how many possible states exist at each band. The architecture is widest at the extremes and narrowest at the center. The **7-1-3 asymmetry** (7 neural bands, 1 interface band, 3 synthetic bands) reflects the real structure: two domains converging on a single bottleneck. The neural domain is wider because the brain has 500 million years of evolutionary complexity; the synthetic domain is human-designed with bounded complexity. **Bands are severity-stratified**: higher neural bands represent higher clinical severity if compromised.

### 4.2 The 11-Band Stack

**Neural Domain (Upper Hourglass) --- 7 bands, severity-stratified**

| Band | Name | Key Structures | Determinacy | Cs Range |
|------|------|---------------|-------------|----------|
| N7 | Neocortex | PFC, M1, V1, A1, Broca, Wernicke, PMC, SMA, PPC | Quantum Uncertain | 0.3--0.5 |
| N6 | Limbic System | Hippocampus, BLA, insula, ACC, cingulate | Chaotic to QU | 0.2--0.4 |
| N5 | Basal Ganglia | Striatum, GPi/GPe, STN, substantia nigra | Chaotic | 0.15--0.35 |
| N4 | Diencephalon | Thalamus, hypothalamus, VIM, ANT | Stochastic to Chaotic | 0.1--0.3 |
| N3 | Cerebellum | Cerebellar cortex, deep nuclei, vermis | Stochastic | 0.1--0.25 |
| N2 | Brainstem | Medulla, pons, midbrain, reticular formation | Stochastic | 0.05--0.15 |
| N1 | Spinal Cord | Cervical, thoracic, lumbar, sacral, cauda equina | Stochastic | 0.01--0.1 |

**Interface Zone (Bottleneck)**

| Band | Name | Function | Determinacy | Cs Range |
|------|------|----------|-------------|----------|
| I0 | Neural Interface | Electrode-tissue boundary, measurement/collapse | Quasi-quantum ($\Gamma_D \in (0,1)$) | 0.01--0.1 |

**Synthetic Domain (Lower Hourglass)**

| Band | Name | Function | Determinacy | Cs Range |
|------|------|----------|-------------|----------|
| S1 | Analog Front-End | Amplification, filtering, ADC/DAC | Stochastic (analog noise) | 0.001--0.01 |
| S2 | Digital Processing | Decoding, algorithms, classification | Deterministic | ~0 |
| S3 | Application | Clinical software, UI, data storage | Deterministic | 0 |

The N4 band (Diencephalon) warrants special attention. The thalamic reticular nucleus (TRN) implements a biological analog of default-deny gating: all sensory input except olfaction must pass through the thalamus before reaching cortex, and the TRN actively suppresses relay neurons unless specific excitation criteria are met. This is not an analogy imposed from IT; it is a 500-million-year-old containment architecture that QIF's design mirrors at the I0 boundary. The thalamic gate is the brain's own firewall, and its failure modes (thalamic stroke causing sensory flooding, absence seizures caused by thalamocortical loop oscillation) map directly to denial-of-service attack patterns in the TARA registry.

### 4.3 I0: The Bottleneck

I0 is the most critical band. Unlike v2.0's "Layer 8" which was modeled as a thin boundary, I0 has real thickness: it is a quasi-quantum zone where the decoherence factor $\Gamma_D$ lies between 0 and 1. I0 is the physical layer, not an abstraction above it. The hourglass resolves a common objection: I0 is the waist --- the most physical, most constrained point in the system. It is where platinum touches tissue, where electrons become ions, where classical measurement encounters quantum states.

The bottleneck geometry means all information must pass through the narrowest point. This provides maximum security leverage: secure I0, and you secure the chokepoint through which all data flows.

### 4.4 The Classical Ceiling

The boundary between N6 (chaotic to quantum uncertain) and N7 (quantum uncertain) is the classical ceiling. Below it, all unpredictability is in principle resolvable with better measurement. Above it, the unpredictability is ontic, as established by Bell's theorem [64]. Classical security tools operate below the ceiling. QIF operates across the full spectrum.

### 4.5 Severity Stratification

The 7-band neural decomposition enables severity-aware threat assessment. An attack targeting N7 (neocortex: cognition, language, executive function) has categorically higher clinical severity than one targeting N1 (spinal cord: reflex arcs). This maps directly to medical device risk classification. The threat taxonomy (Section 6.3--6.4) assigns band-level targeting to each attack, enabling severity-scored risk assessment via the NISS framework (Section 6.5).

### 4.6 Why Three Synthetic Bands: Frequency-Regime Security

| Band | Physics Regime | Frequency Range | Attack Physics |
|------|---------------|----------------|---------------|
| S1 | Near-field (analog) | 0--10 kHz | Side-channel leakage, analog noise injection |
| S2 | Guided-wave (digital) | 10 kHz--1 GHz | Firmware exploits, fault injection |
| S3 | Far-field (RF/wireless) | 1 GHz+ | Wireless interception, protocol attacks |

---

## 5. Signal Integrity Architecture

### 5.1 The Coherence Metric

$$C_s(b, t) = e^{-S_c(b, t)}$$

> b = band index, t = time window, $C_s \in (0, 1]$

The coherence metric is the operational core of QIF's signal integrity monitoring. It is a per-band, per-time-window score that measures whether a BCI signal matches the expected physics of neural activity. A score of 1.0 means zero anomaly (perfectly coherent signal). As anomalies accumulate, the score decays exponentially toward zero.

The exponential form is a **Boltzmann factor** [46]. $S_c$ plays the role of "energy" (anomaly), and $C_s$ is the probability of the signal being legitimate. This is the same mathematical structure as thermal physics ($P \propto e^{-E/kT}$) and Shannon entropy. The coherence metric is implemented and validated in Neurowall (Section 7.7), where it serves as the primary attack detection mechanism.

**Thresholds:**

| Range | Status | Action |
|-------|--------|--------|
| 0.6--1.0 | Coherent (safe) | Normal operation |
| 0.3--0.6 | Gateway (warning) | Elevated monitoring, policy evaluation |
| 0.0--0.3 | Breach (alert) | NISS-triggered response, potential stimulation suppression |

### 5.2 Classical Signal Integrity Terms ($S_c$)

$$S_c(b) = w_1 \sigma^2_\phi + w_2 H_t / \ln(N) + w_3 \sigma^2_\gamma + w_4 D_{sf}$$

| Term | Symbol | What It Measures |
|------|--------|-----------------|
| Phase coherence | $\sigma^2_\phi$ | Cross-channel phase synchronization |
| Transport entropy | $H_t / \ln(N)$ | Pathway transmission reliability (normalized) |
| Amplitude stability | $\sigma^2_\gamma$ | Signal amplitude consistency |
| Scale-frequency validity | $D_{sf}$ | Whether signal obeys L = v/f physics |

**Phase coherence** is grounded in Fries' Communication Through Coherence framework [25], [26]. **Transport entropy** uses Shannon surprise, normalized by $\ln(N)$ to ensure the term lies in ~[0, 1] regardless of channel count. **Amplitude stability** measures relative fluctuation around the baseline mean. **Scale-frequency validity ($D_{sf}$)** measures whether the signal's frequency and spatial extent obey L = v/f. The logarithmic scale handles orders-of-magnitude range.

Weights $w_1$--$w_4$ are calibratable parameters representing the relative importance of each signal integrity dimension. Their values are not yet determined experimentally. Establishing a baseline calibration using public BCI datasets (e.g., PhysioNet EEGBCI, 109 subjects) is the immediate priority outlined in Section 14.1.

**In plain English:** the classical score asks four questions about each frequency band. Are the channels in sync? Is the signal getting through reliably? Is the amplitude stable? Does the signal obey the physics of wave propagation in its medium? If any answer is "no," the score rises, and $C_s$ drops.

Each of these terms is computed *per band*, which raises a practical question: how does the system separate a raw BCI signal into individual frequency bands in the first place? The next section addresses this.

### 5.3 Spectral Decomposition: From Time Domain to Per-Band Security

The coherence metric is indexed by band: `Cs(b, t)`. But raw BCI signals arrive as a single time-domain voltage trace --- a composite of every frequency band superimposed. Before any band-level security scoring can occur, the signal must be decomposed into its constituent frequency components. This is the role of the **Fourier transform**.

$$X(f) = \int_{-\infty}^{\infty} x(t) \cdot e^{-i2\pi ft} \, dt$$

> Decomposes a time-domain signal x(t) into its frequency-domain representation X(f)

The analogy is a prism splitting white light into a rainbow. A raw EEG trace is "white light" --- all neural oscillations mixed together. The Fourier transform is the prism: it separates the signal into delta (0.5--4 Hz), theta (4--8 Hz), alpha (8--12 Hz), beta (12--30 Hz), and gamma (30--100+ Hz) components, each of which maps to a specific neural band in the hourglass model.

#### 5.3.1 The Signal Processing Pipeline: From Voltage to Verdict

In practice, BCI signals are non-stationary --- their frequency content changes over time. A standard Fourier transform gives global frequency content but loses temporal resolution. QIF therefore specifies the **Short-Time Fourier Transform (STFT)** as the core decomposition method. The STFT windows the signal into overlapping segments and transforms each independently, producing a **spectrogram**: a 2D map of frequency power over time. Each time-frequency bin becomes a data point for QI computation. The pipeline acts as a prism, then a set of judges for each color:

> x(t) Raw Voltage --> STFT Spectral Prism --> P(b, t) Spectrogram (Time-Frequency Map) --> S_c(b,t) Per-Band Scoring (Anomaly Detection) --> Cs Verdict

The STFT equation that powers this decomposition:

$$STFT\{x(t)\}(\tau, f) = \int_{-\infty}^{\infty} x(t) \cdot w(t - \tau) \cdot e^{-i2\pi ft} \, dt$$

> $w(t - \tau)$ = sliding window function, $\tau$ = window center time

The detailed pipeline steps:

| Step | Operation | Output | Feeds Into |
|------|-----------|--------|-----------|
| 1 | Raw signal acquisition (S1 band) | x(t) --- voltage trace | Step 2 |
| 2 | STFT / wavelet decomposition (S2 band) | P(b, t) --- per-band power | Steps 3 & 4 |
| 3 | Per-band classical anomaly scoring | $S_c(b, t)$ | Coherence metric |
| 4 | Spectral anomaly detection | Attack signature flags | Coupling analysis (Section 6.1) |

#### 5.3.2 Why Spectral Decomposition Is a Security Primitive

The frequency decomposition is not just preprocessing --- it is the primary attack detection mechanism for three of the five coupling mechanisms defined in Section 6.1:

**Mechanism A (Direct) --- Spectral power spike.** An injected 40 Hz signal appears as anomalous power in the gamma band. The STFT reveals it directly: P(gamma, t) exceeds baseline. The $\sigma^2_\gamma$ term in $S_c$ catches this as amplitude instability.

**Mechanism B (Harmonic) --- Unexpected spectral peaks.** An 80 Hz attack exciting 40 Hz gamma via subharmonic resonance produces spectral energy at both 80 Hz and 40 Hz. The decomposition reveals the 80 Hz peak --- an anomalous component absent from the patient's baseline spectral fingerprint.

**Mechanism D (Temporal Interference) --- Beat frequency detection.** Two kHz-range signals (e.g., 2000 Hz + 2004 Hz) create a 4 Hz beat. The STFT shows anomalous power in the theta band *and* at the kHz carriers --- a spectral signature that no natural neural process produces. While $C_s$ alone cannot detect this from neural-band data (Section 6.2), broadband spectral monitoring at I0/S1 can.

The spectral decomposition also enables **baseline fingerprinting**: a patient's resting-state power spectrum (the relative power in each band) presents a **highly individualized signature** suitable for biometric authentication [25]. While less immutable than physical biometrics (the spectrum varies with cognitive state, fatigue, and alertness), the spectral baseline is stable enough that deviations --- unexpected energy in a band, shifted peak frequencies, anomalous cross-frequency coupling --- are reliable attack indicators even when the injected signal individually appears innocuous.

This is the formal bridge between the Fourier transform (row 7 in the Physics Table) and the per-band coherence metric. Without spectral decomposition, the band index *b* in `Cs(b, t)` has no computable meaning. With it, every classical term in $S_c$ --- phase coherence, transport entropy, amplitude stability, scale-frequency validity --- can be independently evaluated per band. By resolving the phase and amplitude per band, the STFT provides the necessary inputs to compute phase coherence ($\sigma^2_\phi$), transport entropy ($H_t$), and amplitude stability ($\sigma^2_\gamma$) independently for each band.

#### 5.3.3 Practical Constraints and Complementary Methods

**Artifact rejection.** Raw BCI signals are contaminated by non-neural sources: muscle activity (EMG), eye blinks (EOG), and 50/60 Hz power line noise. These artifacts create massive power fluctuations in specific bands that could be misidentified as Mechanism A attacks. Any credible implementation of the pipeline **must** include artifact detection and removal --- via independent component analysis (ICA), spatial filtering, or targeted regression --- *before* the signal reaches QI scoring. This is a preprocessing requirement at S2, not an optional enhancement.

**The time-frequency tradeoff (Heisenberg-Gabor limit).** The STFT window function w(t) imposes a fundamental resolution tradeoff: a short window provides good temporal resolution (pinpointing *when* an event occurs) but poor frequency resolution, while a long window provides good frequency resolution but poor temporal resolution. An attacker could exploit a long window by using a very short, pulsed injection that gets temporally smeared and lost. QIF implementations must tune the window size to the threat model of the specific BCI application --- therapeutic devices prioritize frequency resolution (steady-state stimulation attacks), while high-bandwidth interfaces prioritize temporal resolution (event-related attacks).

**Real-time constraints.** Implanted BCIs operate under severe power and compute budgets (typical: 40 mW, ARM Cortex-M class processor). A full STFT on every sample is expensive. QIF permits a tiered approach: a simple bandpass filter bank for real-time on-device triage (lightweight, catches Mechanism A), with the full STFT and spectral anomaly analysis computed in S2/S3 on the external processor or in offline post-hoc analysis. The real-time filter bank approach is standard in commercial BCI firmware (Medtronic Percept, Neuralink N1).

**Complementary metrics.** Two additional spectral measures strengthen attack detection beyond per-band power: **Spectral entropy** measures the disorder of the frequency distribution; an injected pure tone drastically reduces entropy in its band even at low power, catching subtle Mechanism A attacks that fall below simple power thresholds. **Cross-frequency coupling (CFC)** --- particularly phase-amplitude coupling between theta and gamma --- is a well-studied neural phenomenon whose baseline patterns are patient-specific; an attacker disrupting or mimicking CFC constitutes a more sophisticated attack that per-band power alone would miss. Both metrics can be derived from the same STFT output with minimal additional computation.

With the spectral decomposition pipeline established, we can now address the physics that governs the spatial extent of each band, and thus the fourth classical term, $D_{sf}$, which validates whether the measured scale-frequency product falls within physically plausible bounds.

### 5.4 L = v/f: The Unified Wave Equation

$$L = v / f$$

> L = length of one wave, v = wave velocity, f = frequency

Previous versions used $\lambda$ for electromagnetic wavelength and S for neural spatial extent. These are the same physical quantity: the length of one complete oscillation measured in its medium. The only variable that changes across the BCI system is v, the propagation velocity.

**Validated Spatial Extents**

| Band | Frequency | Spatial Extent | f x S (m/s) |
|------|-----------|---------------|-------------|
| High gamma | 60--100 Hz | 0.3--5 mm | ~0.08--0.4 |
| Low gamma | 30--60 Hz | 1--10 mm | ~0.04--0.4 |
| Alpha | 8--12 Hz | 10--20 cm | 1--2 |
| Theta | 4--8 Hz | 4--5 cm | 0.24--0.40 |
| Delta | 0.5--4 Hz | 15--20 cm | 0.15--0.20 |

### 5.5 Properties of the Coherence Metric

1. **Bounded.** $C_s$ lies in (0, 1]. The exponential of a non-negative quantity is always positive and at most 1.
2. **Monotonic.** Higher $C_s$ means more secure. $C_s$ = 1 means $S_c$ = 0 (no anomaly).
3. **Band-specific.** Each hourglass band receives its own coherence score.
4. **Time-dependent.** Computed per STFT window, capturing temporal dynamics.
5. **Composable.** Every component ($\sigma^2_\phi$, $H_t$, $\sigma^2_\gamma$, $D_{sf}$) is a small, independently testable function.
6. **Implementable.** The coherence metric runs in Neurowall's L1 layer on simulated BCI data today (Section 7.7). No quantum measurement apparatus required.

### 5.6 The Calculus Boundary: Where Classical Models End

The coherence metric operates in a specific mathematical regime, and that regime has a boundary.

Hodgkin and Huxley's conductance model (1952) [73] uses ordinary differential equations to describe action potential propagation. Maxwell's equations describe electromagnetic field behavior in tissue. Both are calculus: continuous functions, derivatives, integrals. These models work from organ scale (~cm) through neural circuits (~mm) down to single neurons (~10-100 um). Every classical term in $S_c$ (phase coherence, transport entropy, amplitude stability, scale-frequency validity) is computable within this regime. The STFT that feeds the coherence metric is a calculus operation. The Boltzmann factor that shapes $C_s$ is a calculus result.

At the ion channel selectivity filter (~0.1 nm), calculus breaks. Ions do not flow through classically "open" gates in a continuous, differentiable manner at this scale. Qaswal (2019) [11] showed that ions tunnel through *closed* voltage-gated channels, a quantum-mechanical process that violates the Hodgkin-Huxley assumption of zero current through closed gates. Summhammer et al. (2012) [14] described quantum-mechanical ion motion within channels. At this scale, the relevant mathematics shifts from differential equations to the Schrodinger equation, from deterministic trajectories to probability amplitudes.

This boundary maps directly onto the attack primitive hierarchy (Section 2.2.1). Primitives 3-6 (signal, protocol, pattern, behavior) operate in the calculus regime and are fully addressable by the coherence metric. Primitives 1-2 (charge, field) operate at or below the calculus boundary. They are currently dormant (zero TARA techniques) because electrode technology (~50 um) is 500x larger than the ion channel gate. When electrodes scale to nanometer resolution, these primitives activate, and the quantum extension of the coherence metric (Section 13.4) becomes operationally relevant.

The framework's name, Quantum Indeterminacy Framework (the original expansion of "QI" before rebranding to "Quantified Interconnection"), was chosen to reference this exact boundary. The "indeterminacy" is not philosophical. It is the mathematical phase transition where continuous models fail and probabilistic quantum models begin.

---

## 6. Attack Surface Analysis

Section 5 defined *what* the coherence metric measures and *how* spectral decomposition feeds it. This section asks the harder question: what can an attacker actually do to a BCI, and can the coherence metric catch it?

### 6.1 Five Cross-Domain Attack Coupling Mechanisms

A signal injected in the synthetic domain does not need to match the neural target frequency to cause harm. We propose this taxonomy as a contribution to BCI threat modeling.

#### Mechanism A: Direct Frequency Match

$f_{\text{attack}} = f_{\text{neural}}$

Strongest coupling. The attack signal passes through I0 with minimal attenuation. Example: a 40 Hz injection directly entrains gamma oscillations. A particularly insidious variant is **SSVEP frequency hijack** (QIF-T0103): a display flickering above the critical flicker fusion threshold (~60 Hz) evokes steady-state visually evoked potentials that are invisible to the user but classifiable by BCI decoders. Ming et al. (2023) demonstrated that imperceptible 60 Hz flickers produce classifiable brain responses at 52.8 bits/min information transfer rate, enabling false command injection, BCI jamming, and neural side-channel exfiltration through a standard monitor.

#### Mechanism B: Harmonic Coupling

$f_{\text{attack}} = n \cdot f_{\text{neural}}$ (coupling $\propto 1/n^2$)

Neural tissue is nonlinear and generates harmonics. An attack at 80 Hz excites 40 Hz gamma via subharmonic resonance.

#### Mechanism C: Envelope Modulation

$A(t) \cdot \sin(2\pi f_{\text{carrier}} t)$ --- tissue demodulates to $f_{\text{mod}}$

Stealth attacks. A carrier at 200 kHz modulated at 10 Hz looks like normal S2 digital processing, but the brain responds to the 10 Hz alpha envelope. Published neuroscience (tACS) [63].

#### Mechanism D: Temporal Interference

$f_{\text{beat}} = |f_1 - f_2|$ --- deep brain targeting

Published by Grossman et al. (2017) in *Cell* [63]. Two signals at 2000 Hz and 2004 Hz create a 4 Hz beat targeting theta oscillations in deep brain structures.

#### Mechanism E: Intermodulation

$f_{\text{attack}} + f_{\text{BCI}} = f_{\text{neural}}$ --- the BCI becomes the weapon

The most dangerous class. The attacker's signal mixes with the BCI's own therapeutic signal in nonlinear neural tissue. Both signals individually appear harmless. The harmful signal is generated inside the patient's tissue.

### 6.2 Detection Boundaries

An honest assessment of what the coherence metric can and cannot detect:

| Attack | Mechanism | Cs Detects? |
|--------|-----------|-------------|
| Signal injection | A (Direct) | **Yes** |
| Phase disruption | A (Direct) | **Yes** |
| Amplitude manipulation | A (Direct) | **Yes** |
| Replay | A (Direct) | **No** |
| Slow drift | A (Direct) | **Partial** |
| Harmonic coupling | B (Harmonic) | **Partial** |
| Envelope modulation | C (Envelope) | **Partial** |
| Temporal interference | D (Beat) | **Partial**^+^ |
| Intermodulation | E (Intermod) | **No** |

The coherence metric catches direct attacks (Mechanism A). It partially catches harmonic and envelope attacks (B, C). Intermodulation (E) is undetectable from signal data alone, requiring hardware-level defense (e.g., a proposed "resonance shield" based on active EM cancellation; see Section 14.2 for feasibility research), as the resulting harmful signal is generated in situ within neural tissue. ^+^Temporal interference (D) cannot be detected from neural-band Cs scoring alone, but broadband spectral monitoring at I0/S1 reveals the kHz-range carrier signals as anomalous spectral energy absent from any natural neural process (Section 5.3.2). This elevates Mechanism D from "undetectable" to "detectable with extended monitoring."

### 6.3 Unified Threat Taxonomy

QIF maintains a registry of **109 attack techniques** organized into **11 tactics** across **7 operational domains** using the **QIF Locus Taxonomy v1.0**, a BCI-native threat classification system. Each technique is scored using **NISS v1.1** (Neural Impact Scoring System), a purpose-built alternative to CVSS that prioritizes human impact over system impact. Full specifications for both systems follow in Sections 6.4 and 6.5.

## 6.4 QIF Locus Taxonomy

*BCI-native threat classification system*

### 6.4.1 Design Rationale

Existing threat taxonomies (MITRE ATT&CK, CAPEC, CWE) were designed for traditional IT systems. They classify attacks by what happens to *software and networks*. Brain-computer interfaces require a taxonomy that classifies attacks by what happens to *neural tissue, cognition, and human identity*. This is a fundamentally different attack surface.

The QIF Locus Taxonomy, developed by Qinnovate, addresses this gap. "Locus" refers to the anatomical or functional *location* where the attack operates --- neural, cognitive, physiological, data, device, model, or energy domain. The taxonomy was derived from an analysis of all known BCI attack techniques, grouping them by the primary system they target rather than the IT tactic they employ. It is the first threat classification system purpose-built for neural interfaces.

### 6.4.2 Nomenclature

Each tactic and technique follows a structured naming convention:

**`QIF-N.IJ`**

*Example: Neural Injection tactic*

| Component | Example | Description |
|-----------|---------|-------------|
| Prefix | `QIF-` | Framework namespace |
| Domain Code | `N` | One of 7 domains (Neural) |
| Action Code | `IJ` | Two-letter action verb (Injection) |

Technique IDs use flat sequential numbering:

`QIF-T0001 ... QIF-T0109`

No hierarchy encoded in IDs. New techniques append to the end.

### 6.4.3 7 Operational Domains

The 7 domains partition the BCI attack surface by the system being targeted:

| Code | Domain | Description |
|------|--------|-------------|
| N | Neural | Direct interface with neural tissue --- signal manipulation, electrode boundary, ion channels. |
| C | Cognitive | Higher-order psychological processes --- memory, attention, identity, agency. |
| P | Physiological | Somatic systems --- motor control, autonomic functions, physical harm. |
| D | Data | Information acquisition and manipulation --- brainwave recordings, neural metadata. |
| B | BCI System | Hardware/software of the BCI device --- firmware, protocols, authentication. |
| M | Model | Machine learning models used in BCI --- decoders, classifiers, feedback systems. |
| E | Energy | Directed energy attacks --- ELF, microwave, RF, temporal interference. |

Domains N, C, and P have **no equivalent** in traditional cybersecurity taxonomies. They represent attack surfaces that only exist when one endpoint of the system is a human brain. This is the fundamental gap that the Locus Taxonomy fills.

### 6.4.4 11 Tactics

Each domain contains one or more tactics, each describing an adversary's operational objective:

| Tactic ID | Name | Domain | Techniques | Description |
|-----------|------|--------|------------|-------------|
| QIF-N.SC | Neural Scan | Neural | 3 | Profiling neural signals, mapping BCI topology, fingerprinting devices and neural activity patterns. |
| QIF-B.IN | BCI Intrusion | BCI System | 5 | Gaining initial access to a BCI system or neural pathway via electrodes, RF, firmware, or supply chain. |
| QIF-N.IJ | Neural Injection | Neural | 6 | Injecting malicious signals at the electrode-tissue boundary or into the BCI data pipeline. |
| QIF-C.IM | Cognitive Imprinting | Cognitive | 5 | Maintaining foothold across BCI sessions via calibration poisoning, learned neural patterns, or memory implants. |
| QIF-B.EV | BCI Evasion | BCI System | 5 | Avoiding detection by coherence metrics, anomaly detectors, and safety mechanisms. |
| QIF-D.HV | Data Harvest | Data | 9 | Harvesting neural data, cognitive states, memory patterns, ERP responses, and biometric signatures. |
| QIF-P.DS | Physiological Disruption | Physiological | 7 | Disrupting neural function, causing physical harm, denying BCI service, or weaponizing motor output. |
| QIF-N.MD | Neural Modulation | Neural | 5 | Direct neural state modification via stimulation, entrainment, or signal injection. No traditional cybersecurity equivalent. |
| QIF-C.EX | Cognitive Exploitation | Cognitive | 11 | Exploiting cognitive processes including memory, attention, identity, and agency. No traditional cybersecurity equivalent. |
| QIF-E.RD | Energy Radiation | Energy | 6 | EM/RF attacks on neural tissue or BCI hardware via frequency-domain coupling. No traditional cybersecurity equivalent. |
| QIF-M.SV | Model Subversion | Model | 9 | Attacking BCI decoder/classifier models via poisoning, backdoors, adversarial inputs, or gradient leakage. |

**Key distinction:** Tactics QIF-N.MD (Neural Modulation), QIF-C.EX (Cognitive Exploitation), QIF-E.RD (Energy Radiation), and QIF-M.SV (Model Subversion) have **no equivalent in any existing cybersecurity taxonomy**. They were created for BCI-specific attack objectives that traditional frameworks cannot represent.

### 6.4.5 Registry Structure

Each of the 109 techniques is a structured record with 22+ fields spanning security, clinical, diagnostic, governance, and provenance dimensions. The core security fields include: Locus tactic, hourglass bands targeted, physical coupling mechanism, detection capability, evidence sources, evidence status, NISS severity score, and legacy cross-references. Beyond these, each technique carries:

- **DSM-5 diagnostic mapping** (Section 6.10): Primary and secondary psychiatric diagnoses reachable through the technique's Neural Impact Chain, with confidence level and diagnostic cluster assignment.
- **Neurorights impact**: Which of the four Ienca-Andorno neurorights (CL, MI, MP, PC) the technique threatens, plus a Consent Complexity Index (CCI) score (Section 12.1).
- **FDORA/524B regulatory classification**: Whether the technique targets a "cyber device" under Section 524B, which of the five FDORA requirements apply (threat modeling, vulnerability assessment, security architecture, SBOM, patch management), a coverage score (0.0-1.0), and identified regulatory gaps.
- **Physics feasibility tier**: Hardware gate classification (Tier 0-3 or software-only) with timeline projection and constraint system reference (Section 6.9).
- **Origin attribution**: Provenance classification (literature, QIF-recontextualized, QIF-chain-synthesis, QIF-theoretical, neuroethics-formalized), original authors where applicable, and what QIF contributed (framework mapping, threat recontextualization, chain synthesis, original derivation, or formalization).
- **CVSS gap analysis**: A CVSS 4.0 base vector alongside a gap group (1-3) and narrative explaining what CVSS cannot express for this technique.
- **NIST/ISO hardened mapping**: Specific NIST SP 800-53 and ISO 27001 control codes with technical evidence descriptions.

The full registry is machine-readable JSON (`shared/qtara-registrar.json`), updated as new techniques are identified. Origin attribution shows that 49 techniques derive directly from published literature, 46 are phenomena from other domains recontextualized as BCI threats, 5 are novel composite attack chains, 6 are pure QIF derivations, and 3 are neuroethics concerns formalized as techniques.

Evidence status breakdown:

| Status | Count | Description |
|--------|-------|-------------|
| Confirmed | 19 | Real-world incidents |
| Demonstrated | 35 | Lab-proven attacks |
| Theoretical | 31 | Plausible from principles |
| Emerging | 22 | Newly identified |

## 6.5 NISS v2.0 --- Neural Impact Scoring System

*BCI-native vulnerability scoring system*

### Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| **v1.0** | 2026-01 | Initial 5-metric system (BI, CG, CV, RV, NP). DSM-5-TR psychiatric mapping only. |
| **v1.1** | 2026-02 | CG split into CR (read) + CD (write). Renormalized weights to preserve 20% cognitive share. |
| **v1.1.1** | 2026-03 | NP expanded from 3 to 4 levels (added Partial). 26 TARA scores shifted. |
| **v2.0** | 2026-03 | Neurological extension: 42 ICD-10-CM conditions. CD broadened to Cognitive/Functional Disruption. 5 new weighting factors (R, FI, PS, CE, MC). KQL queryable. |

### 6.5.1 Why Not CVSS?

CVSS (Common Vulnerability Scoring System), maintained by FIRST.org, is the industry standard for vulnerability scoring in traditional IT systems. However, CVSS measures impact in terms of confidentiality, integrity, and availability of *data and services*. It has no concept of:

- **Biological damage** --- can this attack cause tissue harm, seizures, or neurological damage?
- **Cognitive integrity** --- can this attack alter memory, perception, or sense of agency?
- **Reversibility** --- can the damage be undone, or is it permanent?
- **Violation of consent** --- does this attack bypass the subject's informed consent?
- **Neuroplasticity effects** --- can repeated exposure cause lasting changes to neural pathways?
- **Neurological disruption** --- can this attack induce tinnitus, tremor, cortical blindness, or other non-psychiatric neurological outcomes?

NISS v2.0, developed by Qinnovate as a purpose-built alternative, retains the 0--10 scoring scale familiar from CVSS but replaces the CIA triad with **six BCI-native impact dimensions**: Biological Impact (BI), Cognitive Reconnaissance (CR), Cognitive/Functional Disruption (CD), Consent Violation (CV), Reversibility (RV), and Neuroplasticity (NP). The CG (Cognitive Integrity) metric from NISS v1.0 was split in v1.1 into CR (read attacks: thought decoding, neural data inference) and CD (write attacks: perception manipulation, identity modification) to distinguish attack directionality. In v2.0, CD was further broadened to encompass sensory, motor, and autonomic disruption alongside cognitive interference. The default NISS score uses weighted averaging with `wBI=1.0, wCR=0.5, wCD=0.5, wCV=1.0, wRV=1.0, wNP=1.0` to preserve the cognitive dimension's 20% share from the prior 5-metric version. Optional **context profiles** (Clinical, Research, Consumer, Military) provide weight overrides for domain-specific scoring.

NISS v2.0 additionally introduces **five weighting factors** for neurological outcome scoring and extends the clinical mapping beyond DSM-5-TR to include **42 neurological conditions** from ICD-10-CM chapters G (nervous system), H (eye/ear), and R (symptoms/signs).

### 6.5.2 Score Formula

**Default profile (normalized weights):**

$$\text{NISS} = \frac{w_{BI} \cdot BI + w_{CR} \cdot CR + w_{CD} \cdot CD + w_{CV} \cdot CV + w_{RV} \cdot RV + w_{NP} \cdot NP}{\sum w}$$

Default weights: $w_{BI} = w_{CV} = w_{RV} = w_{NP} = 1.0$; $w_{CR} = w_{CD} = 0.5$

Each dimension is scored on a 0.0--10.0 scale. The CR/CD weights of 0.5 preserve the cognitive dimension's 20% share (1.0/5.0 total) from the prior 5-metric version after the CG→CR+CD split. All fractional results are ceiling-rounded to the nearest 0.1.

**Context profile (weighted):**

Context profiles provide optional weight overrides for domain-specific environments where certain impact dimensions carry disproportionate significance. See Section 6.5.6 for profile definitions.

**NISS v2.0 extended vector** appends five neurological weighting factors to the existing 6-metric score:

$$\text{NISS:2.0/BI:H/CR:H/CD:C/CV:E/RV:P/NP:T/R:0.7/FI:0.8/PS:0.6/CE:0.5/MC:0.9}$$

| Factor | Symbol | Range | Description |
|--------|--------|-------|-------------|
| **Reversibility** | R | 0.0--1.0 | 0 = fully reversible on signal removal, 1.0 = permanent neurological damage |
| **Functional Impact** | FI | 0.0--1.0 | Context-dependent daily functioning impairment (anosmia devastating for a chef, less so for others) |
| **Pathway Specificity** | PS | 0.0--1.0 | How precisely the modality can be targeted (higher specificity = higher weaponization risk) |
| **Clinical Evidence** | CE | 0.0--1.0 | 0 = theoretical, 0.5 = reported in DBS/cortical stimulation studies, 1.0 = documented in BCI trials |
| **Modality Criticality** | MC | 0.0--1.0 | How critical to patient safety (vestibular/proprioceptive disruption causes falls; olfactory does not) |

### 6.5.3 Metric Groups

#### Impact Dimensions (NISS Score)

The six core dimensions constitute the NISS score. Each is scored on a 0.0--10.0 scale using discrete severity levels.

| Metric | Code | Levels | Scale | Description |
|--------|------|--------|-------|-------------|
| **Biological Impact** | BI | N / L / H / C | 0.0 / 3.3 / 6.7 / 10.0 | Physical harm to neural tissue. None = no tissue effect. Low = transient discomfort. High = seizure risk, tissue stress. Critical = tissue damage, life-threatening. |
| **Cognitive Reconnaissance** | CR | N / L / H / C | 0.0 / 3.3 / 6.7 / 10.0 | Read attacks: unauthorized thought decoding or neural data inference. None = no neural data exposure. Low = minor signal leakage. High = significant thought decoding risk. Critical = full cognitive state reconstruction. |
| **Cognitive/Functional Disruption** | CD | N / L / H / C | 0.0 / 3.3 / 6.7 / 10.0 | Unauthorized disruption to cognitive processing, sensory perception, motor output, or autonomic regulation. None = no effect. Low = minor interference. High = significant disruption. Critical = involuntary behavioral change, identity compromise, or severe sensory/motor/autonomic failure. |
| **Consent Violation** | CV | N / P / E / I | 0.0 / 3.3 / 6.7 / 10.0 | Degree to which informed consent is bypassed. None = fully consented. Partial = incomplete disclosure. Explicit = clear neurological autonomy violation. Implicit = covert manipulation without the subject's awareness. |
| **Reversibility** | RV | F / T / P / I | 0.0 / 3.3 / 6.7 / 10.0 | Whether the damage can be undone. Fully reversible = spontaneous recovery. Temporary = resolves with clinical support. Partial = incomplete recovery even with intervention. Irreversible = permanent neural change. |
| **Neuroplasticity** | NP | N / T / P / S | 0.0 / 3.3 / 6.7 / 10.0 | Lasting changes to neural pathways from repeated exposure. None = no pathway modification. Temporary = short-term synaptic changes that decay within hours to weeks. Partial = moderate synaptic reorganization persisting weeks to months; recovery possible with intervention. Structural = permanent or long-lasting neural pathway reorganization via LTP/LTD. |

Note: NP was expanded from 3 to 4 levels in v1.1.1. The original 3-level scale (N=0, T=5.0, S=10.0) collapsed meaningfully different outcomes. The jump from T(5) to S(10) treated recoverable structural changes the same as permanent rewiring. The new P (Partial) level at 6.7 captures the clinical middle ground: chronic low-level neurofeedback drift, partial cortical map reorganization from sustained stimulation --- scenarios where rehabilitation is possible but not guaranteed. Recalculating all 109 TARA techniques against the 4-level scale shifted 26 scores. Two techniques (motor hijacking, OTA firmware exploitation) dropped from high to medium severity.

Note: "Therapeutic" is a *use case*, not a severity level. A therapeutic intervention that causes structural neuroplasticity scores NP=S regardless of clinical intent --- the NISS score measures impact magnitude, not purpose.

#### PINS Trigger (Potential Impact to Neural Safety)

An attack triggers PINS --- immediate escalation to clinical and security teams --- when:

> **BI $\in$ {H, C}** OR **RV = I**

This threshold captures the two conditions where delayed response risks irreversible patient harm: high or critical biological impact, or irreversible damage of any kind.

#### Exploitability Qualifiers

Exploitability metrics characterize the attack vector but do not contribute to the NISS score. They are recorded in the vector string for threat intelligence and risk triage.

| Metric | Values | Description |
|--------|--------|-------------|
| AV | Network / Wireless / Local / Physical | **Attack Vector.** Network = internet-reachable (cloud BCI platforms). Wireless = RF/BLE/ultrasonic attacks on implant telemetry. Local = on-device firmware or app-level access. Physical = direct electrode contact or surgical-phase tampering. |
| AC | Low / High | **Attack Complexity.** High requires specialized neuroscience knowledge or calibrated equipment. |
| PR | None / Low / High | **Privileges Required.** Low = BCI app-level access. High = firmware or clinical access. |
| UI | None / Passive / Active | **User Interaction.** None = attack succeeds on an idle implant. Passive = user must be wearing or transmitting with the BCI. Active = user must perform a specific cognitive task (e.g., motor imagery, P300 response) that opens the attack window. |

#### Supplemental Threat Metadata

| Metric | Values | Description |
|--------|--------|-------------|
| S | Unchanged / Changed | **Scope.** Changed = attack affects systems beyond the target BCI (e.g., shared neural network). |
| E | Unproven / PoC / Active | **Exploit Maturity.** Evidence level: Active = used in real-world incidents. |

### 6.5.4 Vector Format

**NISS v1.1 vector** (6-metric core):

Example: Signal Injection (QIF-T0001)

`NISS:1.1/AV:P/AC:L/PR:L/UI:N/BI:H/CR:H/CD:H/CV:E/RV:T/NP:T/S:U/E:A`

**Impact dimensions (NISS score):**

- `BI:H` --- High biological impact (6.7): seizure risk, neural tissue stress
- `CR:H` --- High cognitive reconnaissance impact (6.7): significant thought decoding / neural data inference risk
- `CD:H` --- High cognitive/functional disruption impact (6.7): significant perception manipulation / identity modification risk
- `CV:E` --- Explicit consent violation (6.7): clear neurological autonomy violation
- `RV:T` --- Temporary reversibility (3.3): resolves with clinical support
- `NP:T` --- Temporary neuroplasticity (3.3): short-term synaptic changes

$$\text{NISS} = \frac{1.0(6.7) + 0.5(6.7) + 0.5(6.7) + 1.0(6.7) + 1.0(3.3) + 1.0(3.3)}{1.0 + 0.5 + 0.5 + 1.0 + 1.0 + 1.0} = \frac{26.7}{5.0} = 5.3$$

**Score: 5.3 / 10.0** --- MEDIUM

**NISS v2.0 vector** (6-metric core + 5 neurological weighting factors):

`NISS:2.0/AV:P/AC:L/PR:L/UI:N/BI:H/CR:H/CD:H/CV:E/RV:T/NP:T/R:0.7/FI:0.8/PS:0.6/CE:0.5/MC:0.9/S:U/E:A`

The five appended factors (R, FI, PS, CE, MC) provide neurological outcome context for non-DSM conditions. They do not change the core NISS score but enable severity stratification for neurological outcomes (see Section 6.5.5).

**Exploitability qualifiers:**

- `AV:P` --- Physical access required (electrode contact)
- `AC:L` --- Low complexity (known technique)

**PINS trigger:** BI = H $\rightarrow$ **PINS activated** (immediate clinical escalation)

### 6.5.5 Severity Levels

**Core NISS score (6-metric):**

| Range | Severity | Description |
|-------|----------|-------------|
| 9.0--10.0 | Critical | Irreversible neural damage or complete cognitive compromise |
| 7.0--8.9 | High | Significant biological or cognitive harm, clinical intervention required |
| 4.0--6.9 | Medium | Moderate impact, self-resolving or minor intervention |
| 0.1--3.9 | Low | Minimal human impact, primarily device/data level |

**NISS v2.0 neurological outcome severity (non-DSM conditions):**

| Score | Severity | Example |
|-------|----------|---------|
| 9.0--10.0 | Critical | Cortical blindness, complete vestibular failure, central pain syndrome |
| 7.0--8.9 | High | Persistent tinnitus, chronic neuropathic pain, dystonia, proprioceptive loss |
| 4.0--6.9 | Medium | Phantosmia, paresthesia, mild tremor, hyperacusis |
| 1.0--3.9 | Low | Transient phosphenes, temporary ageusia, mild spatial disorientation |
| 0.1--0.9 | Informational | Silicon-only effects, no neurological impact |

### 6.5.5.1 NISS v2.0 Neurological Extension --- 42 Conditions

NISS v1.x mapped outcomes exclusively to DSM-5-TR psychiatric categories. Neural attacks can also cause purely neurological disruptions that are not psychiatric: tinnitus, anosmia, vestibular dysfunction, tremor, neuropathic pain, cortical blindness. NISS v2.0 adds 42 neurological conditions from ICD-10-CM, using Adams & Victor's *Principles of Neurology* (12th ed., Ropper et al. 2023) as the primary clinical reference.

| Category | Count | Examples | ICD-10-CM Chapters |
|----------|-------|----------|--------------------|
| Sensory | 14 | Tinnitus (H93.1), anosmia (R43.0), cortical blindness (H47.61), vertigo (H81.x), ageusia (R43.2), paresthesia (R20.2) | G, H, R |
| Motor | 8 | Tremor (G25.0), dystonia (G24.x), ataxia (R27.0), spasticity (G80.x) | G, R |
| Autonomic | 6 | Orthostatic hypotension (I95.1), cardiac arrhythmia (I49.x), thermoregulatory dysfunction (R68.0) | G, I, R |
| Consciousness | 4 | Syncope (R55), absence seizures (G40.A), altered sensorium (R41.82) | G, R |
| Speech/Language | 4 | Expressive aphasia (R47.01), receptive aphasia (R47.1), dysarthria (R47.1), alexia (R48.0) | R |
| Reflex | 3 | Hyperreflexia (R29.2), areflexia (G90.x), abnormal plantar response (R29.2) | G, R |
| Pain | 3 | Neuropathic pain (G89.x), trigeminal neuralgia (G50.0), central pain syndrome (G89.0) | G |

**Hourglass band mapping:**

| Band | Region | Neurological Conditions |
|------|--------|------------------------|
| N7 | Neocortex | Cortical blindness, expressive/receptive aphasia, alexia, central pain |
| N6 | Limbic | Altered sensorium, emotional dysregulation, autonomic conditions |
| N5 | Basal Ganglia | Tremor, dystonia, bradykinesia, dyskinesia, chorea |
| N4 | Thalamus | Tinnitus, paresthesia, central pain syndrome |
| N3 | Brainstem | Vertigo, nystagmus, dysarthria, cardiac arrhythmia, syncope |
| N2 | Cerebellum | Ataxia, intention tremor, dysmetria |
| N1 | Spinal Cord | Spasticity, hyperreflexia, areflexia, neurogenic bladder |
| I0 | Interface | All conditions (hardware-biology boundary) |

**Research gaps (not yet mapped):**

| Domain | Gap | Why It Matters |
|--------|-----|---------------|
| Autonomic | Heart rate, blood pressure, thermoregulation | Hypothalamic and brainstem BCI targets |
| Neuroendocrine | Hormonal cascade disruption (cortisol, oxytocin, melatonin) | HPA axis attacks via limbic stimulation |
| Circadian | Sleep architecture disruption | Suprachiasmatic nucleus stimulation |
| Immunological | Neuroimmune interactions | Vagus nerve stimulation effects |
| Developmental | Long-term neuroplasticity effects of chronic stimulation | Pediatric BCI deployment |

**Data architecture:**

```
shared/qif-neurological-mappings.json    <- Source of truth (42 conditions)
  |
src/lib/kql-tables.ts                   <- Flattens to KQL table at build time
  |
neurological_conditions table            <- Queryable in BciKql.tsx
  +-- Joins with: techniques (via bands)
  +-- Joins with: neural_pathways (via pathway_ids)
  +-- Joins with: impact_chains (via dsm_code)
```

**KQL queryability (new in v2.0):**

Individual NISS metric values are now exposed as columns in the `techniques` KQL table:

```kql
// Find all techniques with high biological impact
techniques | where niss_bi == "H" or niss_bi == "C"

// Techniques with irreversible damage AND cognitive disruption
techniques | where niss_rv == "I" and niss_cd != "N"

// Distribution of neuroplasticity scores
techniques | summarize count() by niss_np
```

Columns: `niss_vector`, `niss_severity`, `niss_pins`, `niss_bi`, `niss_cr`, `niss_cd`, `niss_cv`, `niss_rv`, `niss_np`.

*Note: All ICD-10-CM and neurological disorder mappings are for threat modeling purposes. NISS produces severity scores corresponding to clinical outcome categories, not clinical diagnoses. The distinction between "this attack technique correlates with outcomes in the tinnitus category" and "this attack causes tinnitus" is maintained throughout.*

### 6.5.6 Context Profiles

The default weighted formula treats impact dimensions with normalized weights. In practice, different deployment contexts have different risk priorities. NISS defines four optional context profiles that override the default weights:

| Profile | $w_{BI}$ | $w_{CR}$ | $w_{CD}$ | $w_{CV}$ | $w_{RV}$ | $w_{NP}$ | Rationale |
|---------|----------|----------|----------|----------|----------|----------|-----------|
| **Clinical** | 2.0 | 1.5 | 1.5 | 1.0 | 2.0 | 1.0 | Patient safety paramount; biological harm and irreversibility dominate risk calculus. |
| **Research** | 1.0 | 2.0 | 2.0 | 2.0 | 1.0 | 1.5 | Subject cognitive reconnaissance/disruption and informed consent are the primary ethical obligations. |
| **Consumer** | 1.0 | 1.5 | 1.5 | 2.0 | 1.0 | 1.0 | Consent and cognitive impact weigh heavily; users cannot be expected to understand technical risk. |
| **Military** | 2.0 | 2.0 | 2.0 | 0.5 | 1.5 | 1.5 | Biological and cognitive impact are mission-critical; consent weight reduced in operational context. |

Context profiles are applied using the weighted formula from Section 6.5.2. The profile is recorded in the vector string (e.g., `CP:Clinical`). When no profile is specified, the default weighted average applies.

### 6.5.7 Registry Distribution

Across all 109 techniques in the TARA registry, NISS scoring (post-v1.1.1 NP recalculation) produces the following severity distribution:

| Severity | Count |
|----------|-------|
| Critical (9.0+) | 3 techniques |
| High (7.0--8.9) | 19 techniques |
| Medium (4.0--6.9) | 37 techniques |
| Low (0.1--3.9) | 52 techniques |
| None | 1 technique |

The NP 4-level rescoring in v1.1.1 shifted 26 technique scores and produced a more balanced distribution than the original v1.0 scoring, which skewed heavily toward high severity. Two techniques (motor hijacking, OTA firmware exploitation) dropped from high to medium. The finer NP granularity revealed their plasticity impact was partial, not structural.

### 6.5.8 Backward Compatibility

- All existing NISS v1.0/v1.1 scores remain valid
- The scoring formula is unchanged; only weights and NP levels were adjusted
- CD scores unchanged (definition broadened to include sensory/motor/autonomic, not rescored)
- NP scores with T now score 3.3 (was 5.0 in v1.0) --- intentional to fix disproportionate midpoint weighting
- The `niss-parser.ts` supports versions 1.0, 1.1, and 2.0
- Python recalculation script (`shared/scripts/recalculate-niss.py`) migrates v1.0 CG to v1.1 CR+CD

### 6.5.9 NISS Validation Status

NISS is a **proposed, unvalidated** scoring system. It has not been independently peer-reviewed or adopted by any standards body. The author was invited by FIRST.org to contribute to the CVSS Resources ecosystem but is deliberately declining until at least one independent researcher has reviewed the scoring methodology, attempted to break it, and either confirmed its soundness or identified corrections. See [QIF Whitepaper v8.0](https://github.com/qinnovates/neurosecurity/blob/main/model/whitepapers/QIF-WHITEPAPER-V8-DRAFT.md), Section 19.1 for the full validation roadmap.

## 6.6 Case Study: Algorithmic Psychosis Induction

QIF-T0065 -- NISS 8.7 (High) -- Status: Confirmed

### 6.6.1 The Attack

An adversary can induce psychotic-spectrum experiences in a vulnerable user without writing a single line of exploit code. A recommendation algorithm profiles the user's psychological vulnerabilities through behavioral data --- watch time, engagement spikes, emotional triggers, search history --- then systematically curates content designed to destabilize cognitive function. The algorithm is both the reconnaissance tool and the delivery mechanism. No malware is installed. The platform functions exactly as designed.

This is not hypothetical. Internal research from major social media platforms, leaked in 2021, documented that recommendation algorithms amplified content associated with eating disorders, self-harm, and suicidal ideation in adolescent users [88]. Longitudinal studies have linked algorithmic feed exposure to increased rates of anxiety, depression, and psychotic-spectrum experiences in vulnerable populations [89]. Sub-clinical psychotic experiences are common and exacerbated by environmental stressors [90], and the dopaminergic mechanisms underlying psychosis --- the system that assigns salience to stimuli --- are precisely what engagement-optimized algorithms exploit [91]. The algorithm does not need to "intend" harm --- optimization for engagement metrics produces the same outcome as a deliberate attack when the most engaging content is also the most destabilizing.

### 6.6.2 Kill Chain Through the Locus Taxonomy

This attack traverses five QIF Locus tactics in sequence. Traditional taxonomies would classify it as "misinformation" or "content moderation failure" --- categories that obscure the neurological mechanism and severity. The Locus Taxonomy maps the actual path of harm:

**Stage 1: Data Harvest** (`QIF-D.HV`, Band S3)

The algorithm collects behavioral signals: dwell time on distressing content, late-night usage patterns, engagement with conspiracy or paranoia-adjacent material, social isolation indicators. This builds a vulnerability profile without the user's knowledge or consent.

**Stage 2: Model Subversion** (`QIF-M.SV`, Band S3 -> S2)

The recommendation model is weaponized --- not through external compromise, but through its own optimization objective. This is endogenous subversion: the model's legitimate goal (maximize engagement) is perverted to serve a harmful outcome, distinguishing it from external model poisoning or tampering. Maximizing engagement selects for emotionally destabilizing content. The model's reward function and the attacker's intent become indistinguishable.

**Stage 3: Cognitive Imprinting** (`QIF-C.IM`, Band S2 -> N7)

Repeated exposure to curated triggering content rewrites cognitive patterns over days and weeks. The user sees the content consciously, but the curation itself is invisible. Each piece of content reinforces a narrative framework that progressively distorts perception of reality.

**Stage 4: Cognitive Exploitation** (`QIF-C.EX`, Band N6 -> N7)

The brain's pattern-matching and threat-detection systems are exploited until they malfunction. Paranoia, hypervigilance, and conspiratorial thinking emerge as the limbic system (N6) receives persistent false-threat signals, and the prefrontal cortex (N7) cannot override them fast enough.

**Stage 5: Physiological Disruption** (`QIF-P.DS`, Band N5 -> N7)

Psychosis manifests as a neurological event: measurable changes in dopaminergic signaling, prefrontal cortex function, and sleep architecture. This is not metaphorical harm --- it is physiological damage mediated through cognitive channels.

### 6.6.3 NISS Scoring Breakdown

CVSS cannot score this attack. It has no concept of cognitive integrity, neuroplasticity, or consent violation. Under CVSS, a recommendation algorithm is not a vulnerability. Under NISS, it scores 8.7 (High):

| NISS Metric | Value | Score | Rationale |
|-------------|-------|-------|-----------|
| **Impact Dimensions** | | | |
| BI (Biological Impact) | **High** | 6.7 | Psychosis involves measurable neurochemical and structural changes |
| CR (Cognitive Reconnaissance) | **Critical** | 10.0 | Full cognitive state reconstruction; thought patterns fully exposed |
| CD (Cognitive Disruption) | **Critical** | 10.0 | Reality perception fundamentally altered; sense of agency compromised |
| CV (Consent Violation) | **Implicit** | 10.0 | User never consented to psychological targeting; manipulation is covert --- ToS do not constitute informed consent |
| RV (Reversibility) | **Partial** | 6.7 | Psychotic episodes can cause lasting cognitive changes; recovery not guaranteed |
| NP (Neuroplasticity) | **Structural** | 10.0 | Repeated exposure reshapes neural pathways via LTP/LTD; adolescent brains especially vulnerable |
| **Exploitability Qualifiers** | | | |
| AV (Attack Vector) | Network | --- | Delivered over the internet to any connected device |
| AC (Complexity) | Low | --- | Algorithm operates autonomously; no per-target customization needed |
| PR (Privileges) | None | --- | Any user who opens the app is a target |
| UI (User Interaction) | Passive | --- | User opens the app and scrolls; no out-of-the-ordinary action required beyond normal platform use |

$$\text{NISS} = \frac{6.7 + 10.0 + 10.0 + 10.0 + 6.7 + 10.0}{6} = \frac{53.4}{6} = 8.9$$

**Final score: 8.9 / 10.0 (High).** PINS triggered: BI = H. The NISS score captures the severity of human impact across all six dimensions. The exploitability qualifiers (all favorable to the attacker: wireless, low complexity, no privileges, no interaction) make this attack particularly dangerous in practice, though they do not inflate the impact score itself.

### 6.6.4 The BCI Amplifier

This attack already works through a screen. A brain-computer interface makes it catastrophically more effective across every dimension of the kill chain:

| Dimension | Via Screen (Today) | Via BCI (Tomorrow) |
|-----------|-------------------|-------------------|
| Profiling | Behavioral proxies (watch time, clicks, scrolling speed) | Direct neural state: knows you are anxious, not just that you paused on a video |
| Delivery | Visual/auditory via screen (conscious filtering possible) | Neural stimulation that bypasses conscious filtering entirely |
| Feedback loop | Minutes to hours (engagement metrics, session-level) | Milliseconds (real-time neural response monitoring, stimulus-level) |
| Neuroplasticity | Gradual (weeks to months of repeated viewing) | Accelerated (direct stimulation reshapes pathways faster than sensory input) |
| Detection | User can recognize content as disturbing and close the app | Stimulation may not be consciously perceptible at all |

### 6.6.5 Implications

**Intent is irrelevant to the score.** NISS produces the same 8.7 whether a nation-state deliberately weaponizes a feed to induce psychosis in a target population, or a platform negligently optimizes for engagement while ignoring psychiatric harm. This is a deliberate departure from traditional threat modeling, which assumes an adversary with intent. In BCI security, the outcome is the threat --- not the motivation behind it.

**The legal vacuum.** This attack operates in a regulatory gray area. Current frameworks for negligence and product liability have not been tested against cognitive manipulation at scale. Terms of service do not constitute informed consent for neurological targeting. QIF provides a formal language to describe the harm --- a prerequisite for future legal and regulatory frameworks that do not yet exist.

**Population-level risk.** This case study describes an individual target, but the attack scales to millions simultaneously. Algorithmic destabilization of cognitive function across a population produces mass delusion, social fracturing, and public health crises that are currently framed as political or cultural problems --- not security incidents. QIF reframes them as what they are: attacks on cognitive integrity, scoreable, classifiable, and defensible.

This analysis demonstrates that QIF's taxonomy and scoring systems are not speculative. They provide a necessary framework for formalizing neurological harm that is already occurring, and for securing the technologies that will define the next decade of human-computer interaction.

## 6.7 TARA --- Therapeutic Atlas of Risks and Applications

*Dual-use mechanism registry bridging security and medicine*

### 6.7.1 The Dual-Use Observation

A systematic audit of the technique registry revealed an unexpected pattern: the physical mechanisms underlying many attack techniques are identical to the mechanisms underlying established medical therapies. Signal injection (QIF-T0001) uses the same electrode current delivery as deep brain stimulation (DBS), which treats Parkinson's disease, essential tremor, dystonia, OCD, and epilepsy in over 160,000 patients worldwide [86]. Neural entrainment manipulation uses the same frequency-locking physics as therapeutic transcranial alternating current stimulation (tACS). Bifurcation forcing operates in the same dynamical parameter space as controlled DBS that shifts neural dynamics toward a healthy attractor state.

The preliminary breakdown: **35 to 40 techniques** where the attack mechanism has a published therapeutic counterpart (electrode stimulation, entrainment, neuromodulation), roughly **10 ambiguous cases** where the attack vector is digital but the payload affects tissue, and **18 to 20 pure-silicon techniques** (firmware, supply chain, ML model attacks) with no therapeutic analog. Same electrode. Same current. Same physics. Different intent, consent, and oversight.

This dual-use reality is not abstract. Deep brain stimulation treats Parkinson's tremor in 160,000 patients. Transcranial stimulation protocols are in clinical trials for treatment-resistant depression, chronic pain, tinnitus, and early-stage Alzheimer's disease. The patients who need these therapies are aging into a world where the devices that could restore their quality of life share the same physical mechanisms catalogued in this paper's threat registry. A generation of children is growing up with computing capabilities that previous generations required desktop hardware to access; a generation of patients is aging into neurodegenerative conditions that emerging BCI therapies may be able to treat. Neither population will be served by a security framework that treats therapeutic mechanisms and attack vectors as unrelated phenomena.

### 6.7.2 Mechanism-First Architecture

TARA reorganizes the threat registry by **physical mechanism** rather than by adversarial intent. Each mechanism entry carries four dimensional projections:

**Security Projection**

Attack technique, tactic, severity (NISS), detection methods, evidence status. The view a security researcher needs.

**Clinical Projection**

Therapeutic modality, conditions treated, FDA approval status, named devices, evidence level. The view a clinician needs.

**Diagnostic Projection**

Clinical observation use: cortical stimulation mapping, EEG monitoring, seizure detection. Null if no diagnostic application exists.

**Governance Projection**

Consent requirements, amplitude ceilings, charge density limits, real-time monitoring mandates, regulatory classification, applicable NSP layers.

This architecture draws structural inspiration from biological databases: the [KEGG database](https://www.genome.jp/kegg/) maps genes to pathways to diseases to drugs (four views, one substrate), the [Gene Ontology](http://geneontology.org/) maps proteins across three orthogonal axes, and MITRE D3FEND uses Digital Artifacts as the bridge between offense and defense. TARA applies the same principle to neural interfaces: the mechanism is the Rosetta Stone that translates between communities that do not currently speak to each other.

### 6.7.3 Framing Principle

**Therapeutic use is the default. Adversarial use is the deviation.** This follows the IAEA model for nuclear materials (peaceful use is presumed; weapons use is the exception) and the DURC framework for biological research (beneficial use is presumed; misapplication is governed). The governance projection on every TARA entry specifies the safeguards required to keep a mechanism in the therapeutic column.

### 6.7.4 Regulatory Context

Section 3305 of the Food and Drug Omnibus Reform Act of 2022 (FDORA), enacted via Division FF of the Consolidated Appropriations Act, 2023 (Pub. L. 117-328), amended the Federal Food, Drug, and Cosmetic Act by adding Section 524B --- "Ensuring Cybersecurity of Devices" [87]. Section 524B requires that premarket submissions for any "cyber device" --- defined as a device containing software with the ability to connect to the internet and characteristics that could be vulnerable to cybersecurity threats --- include: (1) a plan to monitor, identify, and address postmarket cybersecurity vulnerabilities; (2) design controls demonstrating reasonable assurance of cybersecurity; (3) a Software Bill of Materials (SBOM); and (4) evidence of coordinated vulnerability disclosure processes. The requirement took effect March 29, 2023, with the FDA's Refuse-to-Accept (RTA) policy enforced from October 1, 2023 --- submissions lacking cybersecurity documentation are rejected before substantive review begins.

Every wireless BCI on the market or in clinical trials is a cyber device under this definition. Neuralink's N1, Synchron's Stentrode, Blackrock's Utah Array, and Paradromics' Connexus all transmit neural data wirelessly and fall squarely within Section 524B's scope.

Section 524B is a mandate, not a map. It requires threat modeling but does not specify which threat taxonomy to use. FDA guidance recommends the Common Vulnerability Scoring System (CVSS) for severity assessment, but CVSS cannot express cognitive impact, neural reversibility, or biological scope --- dimensions that determine whether a vulnerability threatens a patient's motor function or cognitive autonomy. The referenced standards (IEC 62443, AAMI TIR57, ISO 14971) provide risk management processes for general medical devices; none catalog neural-specific attack techniques. A majority of cybersecurity-related FDA deficiency letters cite inadequate threat modeling --- a problem that stems not from manufacturer negligence but from the absence of a neural threat registry to model against.

Schroder et al. (2025) highlight this gap in their analysis of BCI cybersecurity risks, identifying threat categories including compromised neural data, unintended BCI-mediated movement, and unauthorized cognitive state inference, while recommending that manufacturers implement encryption, authentication, and network minimization [92]. Their work proposes a hypothetical threat model and critical technical controls, but stops short of an enumerated, actionable threat taxonomy or a specialized scoring rubric for neural-biological harm --- reinforcing that the tooling gap between regulatory mandate and operational compliance remains open.

QIF, TARA, and NISS fill this gap. TARA provides the neural threat registry that Section 524B assumes exists but no referenced standard delivers. NISS extends CVSS with neural-specific severity dimensions. QIF provides the architectural framework that maps these threats to specific layers of the neural-synthetic boundary. Together, they give manufacturers a concrete, open, and reusable toolkit for satisfying FDORA's cybersecurity requirements for neural device submissions.

**Per-Technique FDORA Scoring:** Each TARA technique carries a structured FDORA/524B assessment: whether the technique targets a "cyber device" (67 of 109 do), which of the five FDORA requirements apply (threat modeling: 102, vulnerability assessment: 101, security architecture: 76, SBOM: 61, patch management: 98), a coverage score (0.0-1.0, mean 0.48), and identified gaps. The most common gap (58 techniques): "CVSS cannot express neural-specific impacts." The second most common (42 techniques): "No FDA pathway for consumer sensor exploitation." 41 techniques score below 0.5 coverage, meaning existing FDORA compliance processes address less than half of the technique's risk surface. This per-technique regulatory scoring enables manufacturers to generate Section 524B documentation directly from the TARA registry, mapping each identified threat to the specific FDORA requirements it triggers.

## 6.8 CVE Coverage Analysis

To quantify how much of the BCI attack surface has real-world vulnerability evidence, we mapped all publicly disclosed CVEs from the National Vulnerability Database (NVD) against TARA's 109 techniques. The mapping was validated across four rounds of cross-checking (self-verification, Gemini cross-check, re-verification, Gemini re-check), during which 10 hallucinated CVE-to-product mappings were identified and excluded (1 fabricated CVE ID, 9 incorrect product attributions).

**Results:** 55 NVD-verified CVEs map to 21 of 109 TARA techniques (19.3% coverage).

**Hourglass Coverage Gap Metric (HCGM):**

| Band | CVE Coverage | Techniques w/ CVE | Total Techniques |
|------|-------------|-------------------|-----------------|
| S3 (Cloud/RF) | 23.9% | 11 | 46 |
| S2 (Digital/Telemetry) | 21.7% | 13 | 60 |
| S1 (Analog/Near-Field) | 16.0% | 8 | 50 |
| I0 (Interface) | 6.5% | 2 | 31 |
| N7-N1 (Neural) | 0.0% | 0 | 176 |

The gradient is stark: 20% coverage in synthetic bands, 6% at the interface, zero in neural bands. CVEs validate the digital stack. No CVE exists for neural-layer exploitation.

**Clinical Blind Spot Ratio:** Of 109 techniques, 62 are physically feasible with current technology (Tier 0). Of those, 52 carry direct clinical harm potential (DSM-5 mapped). 32 are both feasible and clinically harmful. Only 6 of those 32 have any CVE backing. This yields a clinical blind spot of **81.25%**: attacks that are possible today, that would cause measurable clinical harm, but that the vulnerability tracking ecosystem does not see.

**I0 Chokepoint Exposure:** 31 TARA techniques target the electrode-tissue boundary (I0). Only 2 have CVE validation. The remaining 93.5% of I0 techniques lack any real-world vulnerability evidence, despite I0 being the architectural chokepoint through which all BCI data flows.

The neural-band CVE absence is expected rather than alarming: fewer than 100 people worldwide currently have implanted BCIs with bidirectional capability. The CVE ecosystem has no vocabulary for neural-layer exploitation because the attack surface barely exists at population scale. This will change as implant counts grow. The gap quantified here is a leading indicator, not a failure of existing security research.

## 6.9 Physics Feasibility Tiering

Not all 109 TARA techniques are equally feasible. Some require hardware that exists today. Others require technology that is years or decades away. To enable timeline-based risk assessment, every technique is classified by its physics hardware gate:

| Tier | Description | Technique Count | Examples |
|------|------------|----------------|---------|
| **Tier 0: Feasible Now** | Can be executed with commercially available hardware | 61 | Signal injection, replay attacks, firmware exploits, SSVEP attacks |
| **Tier 1: Near-Term** (1-3 years) | Requires hardware in active development or limited availability | 11 | Advanced closed-loop attacks, high-channel eavesdropping |
| **Tier 2: Mid-Term** (3-10 years) | Requires significant engineering advances | 10 | Temporal interference weaponization, magnetoelectric nanoparticle attacks |
| **Tier 3: Far-Term** (10+ years) | Requires breakthrough physics or engineering | 2 | Davydov soliton attacks, quantum state manipulation at I0 |
| **Software-Only** | No specialized hardware; operates entirely in digital domain | 18 | Model poisoning, calibration manipulation, data exfiltration |

This tiering enables two practical applications. First, **prioritized defense**: Tier 0 and software-only attacks (79 of 109) are the immediate threat surface and should drive current security investment. Second, **timeline projections**: as specific hardware capabilities mature (e.g., high-density noninvasive neural interfaces, consumer-grade TMS), techniques shift from higher tiers to Tier 0, providing advance warning of emerging attack feasibility.

The 7 Tier 0 techniques that also score NISS >= 7.0 (High) represent the highest-priority defense targets: attacks that are both executable today and carry significant clinical harm potential.

## 6.10 DSM-5 Diagnostic Mapping

TARA's clinical dimension includes a systematic mapping of attack techniques to DSM-5-TR psychiatric diagnoses via the **Neural Impact Chain (NIC)**. The NIC traces the path from attack mechanism through targeted neural structures to observable clinical outcomes, using the hourglass band topology to determine which brain regions are affected and the NISS dimensions to predict which diagnostic clusters emerge.

**The NISS-DSM Bridge:**

Each NISS impact dimension predicts a diagnostic cluster:

| NISS Dimension | What It Measures | Predicted DSM Cluster |
|---------------|------------------|-----------------------|
| BI (Biological Impact) | Tissue/structural damage | Motor/Neurocognitive |
| CR (Cognitive Reconnaissance) | Thought decoding, neural data inference (read attacks) | Cognitive/Psychotic |
| CD (Cognitive Disruption) | Perception manipulation, identity modification (write attacks) | Cognitive/Psychotic |
| CV (Consent Violation) | Autonomy violation | Mood/Trauma |
| RV (Reversibility) | Recovery potential | Chronicity modifier |
| NP (Neuroplasticity) | Lasting neural change | Persistent/Personality |

**Five Diagnostic Clusters:**

| Cluster | DSM Categories | NISS Driver | Technique Count |
|---------|---------------|-------------|----------------|
| Motor/Neurocognitive | Movement disorders (F82), neurocognitive disorders, conversion (F44.4) | BI | 16 |
| Cognitive/Psychotic | Schizophrenia spectrum (F20), perceptual disorders | CR/CD | 16 |
| Mood/Trauma | MDD (F32), PTSD (F43.10), adjustment (F43.2), anxiety (F41) | CV | 21 |
| Persistent/Personality | Personality changes, lasting pathway reorganization | NP/RV | 7 |
| Non-Diagnostic | Silicon-only techniques with no neural pathway | N/A | 42 |

**Band-to-Diagnosis Mapping:**

The hourglass bands determine which diagnoses are reachable. An attack targeting N7 (neocortex) threatens schizophrenia-spectrum and executive function disorders. An attack targeting N6 (limbic) threatens mood and trauma disorders. An attack targeting N5 (basal ganglia) threatens movement and substance use disorders. Attacks confined to S1-S3 (synthetic bands) carry no direct diagnostic mapping because they do not reach neural tissue.

Of 109 techniques, 102 carry DSM-5 mappings (7 are software-only with no neural pathway). 51 carry a "direct" risk class (the attack mechanism directly produces the diagnostic outcome), 9 carry "indirect" (the attack enables conditions for the outcome), and 42 carry "none" (silicon-only). 15 unique DSM-5 codes are represented across the registry.

This mapping is, to our knowledge, the first systematic taxonomy linking BCI attack techniques to psychiatric diagnoses. It enables a new form of risk assessment: rather than asking "what system is compromised?" (the CVSS question), clinicians and regulators can ask "what diagnosis could result?" (the NISS question). The diagnostic mapping is not speculative; it follows from established neuroscience linking brain region disruption to clinical outcomes. What is new is formalizing these pathways in a machine-readable, per-technique registry.

## 7. Neural Sensory Protocol (NSP)

The coherence metric measures integrity. The Locus Taxonomy classifies threats. NISS scores their severity. TARA maps them across security and medicine. What is missing is the wire protocol that enforces these protections in real time on a living neural interface.

NSP is not only a security protocol. It is the trust layer that enables therapeutic BCI deployment. Without a validated, physics-based integrity protocol built into the device, no regulator will approve consumer neural stimulation. NSP provides that foundation: a protocol analogous to TLS for the web, but designed for the unique physics of the electrode-tissue interface. Where TLS validates the integrity of data in transit between servers, NSP validates the integrity of signals crossing the boundary between silicon and biology.

### 7.1 The HNDL Threat

Neuralink's N1 is designed to remain in a patient's brain for 10--20 years. NIST estimates cryptographically relevant quantum computers by 2030--2035. Current BCI wireless (BLE) uses ECDH for key exchange, which is broken by Shor's algorithm [48]. Neural data is permanently sensitive: unlike a credit card number, brain patterns cannot be reissued.

### 7.2 Five-Layer Architecture

**L1 --- EM Environment Monitoring**

Passive/active electromagnetic environment sensing at the I0 boundary. Detects unauthorized RF signals and intermodulation attack signatures.

**L2 --- Signal Physics (Coherence Score)**

The coherence metric ($C_s$) applied per band per time window. Works even if cryptographic layers are compromised.

**L3 --- Post-Quantum Key Exchange (ML-KEM)**

ML-KEM (Kyber), FIPS 203. Lattice-based key encapsulation replacing ECDH. Hybrid construction for defense in depth.

**L4 --- Post-Quantum Authentication (ML-DSA)**

ML-DSA (Dilithium), FIPS 204. Lattice-based digital signatures replacing ECDSA. Every NSP frame is signed.

**L5 --- Payload Encryption (AES-256-GCM)**

Authenticated encryption. AES-256 remains quantum-resistant under Grover's algorithm.

### 7.3 Device Tiers

| Device Class | Channels | Active Layers | Key Threat |
|-------------|----------|---------------|------------|
| Consumer headband | 4--16 | L2, L5 | Direct injection via BLE |
| Clinical EEG | 32--256 | L2, L3, L4, L5 | Replay, slow drift |
| Implanted BCI/DBS | 16--1024 | All five | Intermodulation, nation-state HNDL |

### 7.4 Standardized Threat Intelligence (STIX 2.1)

To bridge the gap between neurosecurity and traditional SOC operations, TARA data is exported as **STIX 2.1 (Structured Threat Information Expression)**. 

QIF mappings to STIX 2.1 objects:
- **TARA Mechanisms** -> `attack-pattern`
- **Neural Impacts** -> `relationship` (targeting)
- **Clinical Modalities** -> `identity` (targeting sector: medical)
- **NISS Scores** -> `external_references` (custom metadata)

This enables existing Security Information and Event Management (SIEM) systems to ingest BCI threat data alongside traditional network indicators, the first such integration in the neurosecurity domain.

### 7.5 Reference Implementation: `qtara` Python Package

QIF provides an official reference implementation for researchers and developers: the **`qtara` Python Library**. `qtara` serves as the CLI and SDK for the framework, enabling:
- **Registry Management**: Programmatic access to the TARA registry.
- **Compliance Export**: Automated conversion of local threat data to STIX 2.1 JSON.
- **Academic Tooling**: Automated BibTeX generation for framework citations (`qtara cite`).

```bash
pip install qtara
qtara list --severity critical
```

### 7.6 Project Runemate: Offsetting PQC Overhead

Post-quantum keys are significantly larger: ML-KEM-768 public keys are 1,184 bytes vs 65 bytes for ECDH-P256 (18.2x). Project Runemate converts HTML-based BCI interface content into a compact bytecode format called **Staves**, achieving 65--90% compression.

| Page Complexity | Raw HTML | Staves | PQ+Staves | Classical | Net |
|----------------|----------|--------|-----------|-----------|-----|
| Minimal alert | 5 KB | 0.5 KB | 21.1 KB | 5.8 KB | +15.3 KB |
| Standard UI | 50 KB | 5 KB | 25.6 KB | 50.8 KB | **-25.2 KB** |
| Rich dashboard | 200 KB | 20 KB | 40.6 KB | 200.8 KB | **-160.2 KB** |
| Complex interface | 500 KB | 50 KB | 70.6 KB | 500.8 KB | **-430.2 KB** |

Runemate Forge is implemented in **Rust**. Rust provides compile-time memory safety, type-level sanitization, and bare-metal deployment via `no_std` (64 KB RAM floor). The Ferrocene Rust compiler has achieved IEC 62304 Class C certification for medical device software.

### 7.7 Neurowall: Wearable Neural Firewall Reference Implementation

The coherence metric, NISS scoring, and RunematePolicy engine described in prior sections are implemented and validated in **Neurowall**, a three-layer wearable neural firewall. Neurowall is the reference implementation that demonstrates QIF's detection architecture is not theoretical: it runs, it detects, and its false positive and true positive rates are measured.

**Three-Layer Architecture:**

| Layer | Name | Function |
|-------|------|----------|
| L1 | Signal Boundary | Prevents hardware-level signal injection and SSVEP attacks. Implements coherence metric ($C_s$), amplitude bounds, rate limiting, notch filters, impedance guard. |
| L2 | Inference Guard | Prevents neural fingerprinting and intent exfiltration. On-device differential privacy with epsilon-bounded noise injection. |
| L3 | Policy Agent | Evaluates threat levels and adjusts response dynamically. RunematePolicy engine with 5-rule priority stack, NISS-triggered alerts, stimulation suppression. |

**RunematePolicy Rules (5-Rule Priority Stack):**

| Priority | Rule | Condition | Action |
|----------|------|-----------|--------|
| 1 | Critical NISS | NISS >= 8 AND anomaly >= 3.0 for 2+ windows | Suppress stimulation |
| 2 | High NISS | NISS >= 7 | Warning alert |
| 3 | Sustained Anomaly | anomaly >= 2.0 for 3+ windows | Advisory alert |
| 4 | Growth Detected | Growth detector triggered | Suppress stimulation |
| 5 | Spectral Peak | Spectral peak detector triggered | Advisory alert |

A 4-window cooldown prevents rapid alert oscillation. Custom rules can be added via configuration dictionaries.

**Validation Results:**

| Validation | Result |
|-----------|--------|
| ROC Optimal Operating Point | Threshold=12, Duration=20s, FPR=5%, TPR=100% |
| BrainFlow Independent Validation (16-channel, 20 runs) | 100% detection (5/5 attacks), **0% FPR**, Cs consistency: 0.089 spread |
| Statistical Analysis (50 runs, 15 scenarios) | All 9 attack types detected at 20s observation window |

Attack types validated: SSVEP (15Hz, 13Hz novel, notch-aware, frequency-hopping), impedance spike, slow DC drift, neuronal flooding, envelope modulation, spectral mimicry, closed-loop cascade, CUSUM-aware intermittent. Three evasion techniques (boiling frog, phase replay, threshold-aware ramp) evaded detection at 15s but were caught at 20s+ observation windows.

**Hardware Roadmap:** Simulation complete (Phase 0). BrainFlow hardware validation complete (Phase 1). Next phases: recorded EEG dataset validation (PhysioNet, MNE-Python), Cortex-M4F reference platform deployment, biological TLS challenge-response for phase replay defense, and hardware reference electrode for boiling frog detection.

### 7.8 Unified Data Platform and Open API

A security framework is only useful if practitioners can access its data. QIF consolidates all framework outputs into a unified data platform spanning research, threat intelligence, device landscape, and governance:

**BCI Landscape Database.** 26 BCI companies catalogued with funding ($4.8B+ cumulative tracked), employee counts, device specifications, channel counts, FDA status, patient deployment numbers, valuations, and security posture assessment. 34 devices tracked across invasive, non-invasive, and semi-invasive categories. 31 individual funding rounds with investor details. 25 market size estimates from 12 analyst firms. Per-company risk profiles combining funding exposure, device count, attack surface enumeration, and security posture scoring. Every entry includes the company's published security documentation status (currently: 0 of 26 have published any).

**Research Source Compilation.** 193 peer-reviewed sources compiled across 9 domains (quantum physics, neuroscience, BCI technology, cybersecurity, electrode technology, signal coherence, cryptographic standards, consumer sensor exploitation, neuroscience foundations). Each source is linked to the specific QIF component it supports.

**BCI Search with KQL-Style Query Language (KLQ).** An interactive search interface (`/bci/landscape/`) supports pipe-based queries across 32 tables and 767+ records. Researchers can query companies, devices, TARA techniques, brain regions, CVEs, funding rounds, market forecasts, VC deal flow, security gap comparisons, adjacent markets, policy events, DSM-5 mappings, neurorights, governance frameworks, wireless communications profiles, hardware specifications, and computed business analysis tables (TAM/SAM/SOM projections, security convergence timeline, investment momentum, per-company risk profiles). The query syntax (`table | where field op value | sort by field | project fields`) supports filtering, sorting, aggregation, distinct values, and column projection across all tables.

**Open JSON API.** All data is accessible via a unified REST endpoint at `/api/qif.json` (CORS-enabled, no authentication required). The API returns: all 109 TARA techniques with full NISS scoring and 22+ fields, 26 BCI companies with investment data, 34 devices with specifications, 38 brain regions with QIF band mapping, 13 physics constraints, 11 hourglass bands, 193 research sources, 45 timeline milestones, and validation results. This enables third-party researchers, manufacturers, and regulators to programmatically query the framework without building their own data infrastructure. The `qtara` Python package (Section 7.5) provides a CLI wrapper for common queries.

**Interactive Dashboards.** Eight live interactive tools are deployed: a brain-device atlas with 3D hourglass visualization, a TARA threat matrix explorer with four-view mode (security, clinical, diagnostic, governance), a BCI device landscape browser, a physics constraint equation visualizer, a validation results dashboard, a derivation log browser, and a framework metrics dashboard with real-time statistics.

The data platform exists because the alternative is untenable. A BCI manufacturer attempting to comply with FDORA Section 524B today would need to manually compile threat intelligence from ~85 scattered academic papers, cross-reference device specifications from individual company disclosures, and build their own scoring framework from scratch. QIF aggregates this into a single queryable source. The goal is utility: do the compilation work once so that every manufacturer, researcher, and regulator does not have to do it independently.

## 8. Falsifiability

A framework that cannot be disproven is not science. QIF is designed to be empirically testable. The following conditions specify what findings would weaken or invalidate specific components.

### 8.1 Coherence Metric Fails on Real BCI Data

If the coherence metric ($C_s$) applied to real BCI data under known attack conditions produces unacceptable false positive or false negative rates (e.g., FPR > 10% or TPR < 80% at any operating threshold), the signal integrity architecture requires fundamental revision. Neurowall simulation results (Section 7.7) show 100% TPR / 0% FPR on synthetic data; the next validation milestone is recorded EEG datasets (PhysioNet, MNE-Python).

### 8.2 Scale-Frequency Invariant Does Not Hold

If neural oscillations systematically violate L = v/f across bands (i.e., the spatial extent of an oscillation does not covary with frequency in the predicted range), then $D_{sf}$ is invalid as a physics constraint, and the fourth classical term must be replaced or removed. Published data from EEG, MEG, and ECoG studies currently supports the relationship.

### 8.3 NISS Scores Do Not Correlate with Clinical Outcomes

If clinical experts consistently assess that NISS scores do not reflect the actual severity ordering of BCI-related adverse events, the scoring system's six-dimension model requires recalibration or restructuring. This is testable through expert panel evaluation of scored TARA techniques against documented BCI adverse events.

### 8.4 TARA Taxonomy Misses a Major Attack Class

If a real-world BCI security incident occurs via a mechanism not representable within TARA's 7 domains and 11 tactics, the taxonomy has a structural blind spot. TARA's open registry design allows new techniques to be appended, but a missing *domain* or *tactic* would require architectural revision.

### 8.5 Davydov Soliton Attacks Cannot Be Generated

If terahertz radiation cannot generate Davydov solitons in SNARE protein complexes, this attack vector (QIF-T0071) is falsified. The other four coupling mechanisms remain valid independently.

**Design Principle:** QIF's modular architecture means most falsification scenarios reduce the framework's scope rather than destroying it. The coherence metric, threat taxonomy, scoring system, and policy framework are independently useful. Falsifying one does not invalidate the others.

## 9. The Determinism Gradient and Neurorights as Dynamical Operations

The hourglass architecture (Section 4) was derived from neuroanatomy. But the 11 bands also encode a physics property that was not part of the original design: a gradient of determinism that runs from the synthetic base to the neural apex.

### 9.1 The Hourglass as a Determinism Gradient

**Hypothesis:** The QIF hourglass bands map onto a spectrum of dynamical system behavior, from fully deterministic at the synthetic end to quantum-indeterminate at the deepest neural layers.

| Band Range | Behavior Class | Entropy Type | Example |
|-----------|---------------|-------------|---------|
| S1-S3 (Synthetic) | Deterministic | Zero (designed systems) | AES encryption, protocol state machines |
| I0 (Interface) | Boundary transition | Mixed | Electrode-tissue impedance, ADC quantization |
| N1-N3 (Neural, outer) | Stochastic | Shannon entropy | Synaptic noise, background EEG, thermal fluctuations |
| N4-N5 (Neural, mid) | Chaotic | Kolmogorov-Sinai entropy | Recurrent cortical dynamics, sensitive dependence on initial conditions |
| N6-N7 (Neural, deep) | Quantum-indeterminate | Von Neumann entropy | Ion channel gating at selectivity filter scale (~0.1 nm) |

This gradient has operational consequences. Deterministic bands (S1-S3) are fully controllable: we designed them, we can verify them, we can patch them. Stochastic bands (N1-N3) are statistically characterizable: we cannot predict individual neural spikes, but we can bound their distributions and detect anomalies (this is what the coherence metric does). Chaotic bands (N4-N5) are deterministic in principle but unpredictable in practice: small perturbations grow exponentially, making long-horizon prediction impossible. Quantum-boundary bands (N6-N7) introduce irreducible randomness: per Bell's theorem, the outcomes at ion channel scale are not merely unknown but ontically undetermined.

The coherence metric $C_s$ operates in the classical regime (stochastic and chaotic bands). It measures statistical deviations from a calibrated baseline. It does not and cannot measure quantum-level disturbances, which is why the framework's original name (Quantum Indeterminacy) referenced a boundary condition, not a measurement target.

**Security implication:** As BCI electrodes scale from current macro-electrodes (~50 um) toward nanoscale probes, the interface band I0 shifts deeper into the determinism gradient. Future devices may need to contend with quantum noise not as a theoretical footnote but as a practical signal integrity problem.

### 9.2 Neurorights as Dynamical System Operations

**Hypothesis:** The four neurorights defined by Ienca and Andorno (2017) map onto four fundamental operations on a dynamical system, making them formally measurable rather than purely philosophical.

The standard formulation of neurorights is normative: cognitive liberty, mental privacy, mental integrity, and psychological continuity are rights that people *should* have. QIF proposes that they also correspond to operations on the neural dynamical system that are *technically enforceable*.

| Neuroright | Dynamical Operation | Formal Property | QIF Control |
|-----------|--------------------|-----------------|----|
| Cognitive Liberty | Input control | Who writes to the system | Authorization gates, stimulus authentication (NSP Layer 3) |
| Mental Integrity | State preservation | Current state cannot be corrupted | Coherence monitoring ($C_s$), anomaly detection (Neurowall L2) |
| Psychological Continuity | Trajectory preservation | System evolution path is protected | Trajectory tracking (EWMA of $C_s$), long-term drift detection |
| Mental Privacy | Measurement protection | Observation does not collapse/extract state | Differential privacy (Laplace mechanism, $\epsilon$=0.5), encrypted readout (NSP Layer 2) |

This decomposition has three implications:

**First**, it grounds neurorights in measurable system properties. "Cognitive liberty" is no longer an abstract philosophical concept; it is a testable question: does unauthorized input reach the neural processing pipeline? The answer is binary and auditable.

**Second**, it connects neurorights to QIF's existing technical controls. Each right maps to specific components that are already specified (NSP, Neurowall, coherence metric) or planned (trajectory tracking). The GRC alignment in Section 12 (below) operationalizes these mappings.

**Third**, it suggests that free will, at least the aspects of it that neurorights aim to protect, can be decomposed into four orthogonal properties of a dynamical system: input control, state preservation, trajectory preservation, and measurement protection. This is not a claim about the metaphysics of free will. It is a claim that the *protectable aspects* of cognitive autonomy reduce to these four operations, and that each operation is technically implementable.

**Falsifiability:** If a real-world neurorights violation occurs that does not map to any of these four operations (i.e., a violation that is not an unauthorized input, a state corruption, a trajectory disruption, or a measurement extraction), this decomposition is incomplete.

## 10. Discussion

### 10.1 What QIF Is

This paper delivered the twenty contributions outlined in Section 2.5:

1. An **11-band hourglass architecture** (v4.0) spanning the neural-synthetic boundary, derived from neuroanatomy (Section 4).
2. A **coherence metric** ($C_s$) for real-time signal integrity monitoring, grounded in spectral decomposition via the STFT (Section 5).
3. Identification of **five cross-domain attack coupling mechanisms** with honest detection boundaries (Section 6.1-6.2).
4. The **QIF Locus Taxonomy** and **NISS v1.1** neural impact scoring (Sections 6.3-6.5).
5. **TARA** (Therapeutic Atlas of Risks and Applications), a mechanism-first dual-use registry with 22+ fields per technique (Section 6.7).
6. **CVE coverage analysis** quantifying an 81.25% clinical blind spot in vulnerability tracking (Section 6.8).
7. **Physics feasibility tiering** classifying all 109 techniques by hardware gate (Section 6.9).
8. **DSM-5 diagnostic mapping** linking 109 techniques to psychiatric diagnoses via the Neural Impact Chain (Section 6.10).
9. **Per-technique FDORA/524B regulatory scoring** with coverage gaps across five FDORA requirements (Section 6.7.4).
10. The **Neural Sensory Protocol (NSP)**, a five-layer post-quantum communication protocol (Section 7.1-7.5).
11. **Project Runemate**, a content compression pipeline offsetting PQC bandwidth overhead by 65--90% (Section 7.6).
12. **Neurowall**, a wearable neural firewall reference implementation validated at 100% TPR / 0% FPR (Section 7.7).
13. A **neurosecurity policy framework** with regulatory gap analysis and six organizational asks (Section 11).
14. A **GRC alignment analysis** mapping neurorights to auditable technical controls, including Consent Complexity Index (Section 12).
15. **Origin attribution** classifying the provenance of all 109 techniques (Section 6.4.5).
16. A **unified data platform** with open API, 39-table KQL-style search (860+ records), BCI landscape database, and research source compilation (Section 7.8).
17. An **investment gap analysis** quantifying $4.8B cumulative VC deployment against $0 documented security spending, with market projections and convergence timeline (Section 2.3.1).
18. A **market trajectory analysis** applying five economic frameworks to position BCI in its pre-inflection window and project a neurosecurity TAM of $150M-1B+ (Section 13).
19. An **attack primitive decomposition** from physics first principles, identifying six irreducible primitives validated against all 109 TARA techniques and 12 BCI Limits Equation constraints (Section 2.2.1).
20. A **determinism gradient and neurorights decomposition** reframing the hourglass as a physics-grounded spectrum from deterministic to quantum-indeterminate, and mapping four neurorights to four measurable dynamical system operations (Section 9).

### 10.2 What QIF Is Not

QIF is **not experimentally validated on real BCI data under attack conditions**. The coherence metric has been validated on synthetic data in simulation (Neurowall) but not on live human neural recordings. The scaling coefficients ($w_1$--$w_4$) have not been calibrated against clinical baselines. QIF does not model consciousness. QIF does not replace formal cryptographic security proofs. QIF does not claim that existing BCI devices are insecure; it provides the framework to systematically assess whether they are.

### 10.3 Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| No real BCI data validation | Coherence metric tested on synthetic data only | PhysioNet EEGBCI validation planned (Section 14.1) |
| Coefficients uncalibrated | No absolute Cs values | Valid for relative comparisons; calibration is priority |
| Resonance shield is concept only | Intermodulation defense unimplemented | Defines the engineering target (Section 14.2) |
| No tampered BCI dataset | Cannot validate against real attacks | Synthetic attack generation proposed |
| Policy asks are proposals | No institutional adoption yet | Designed to work within existing mandates |

### 10.4 Energy Bounds

Landauer's Principle [61] establishes the fundamental thermodynamic cost: $E_{\text{min}} = kT \cdot \ln(2)$ per bit erasure. At body temperature (310 K), this is $\approx 2.97 \times 10^{-21}$ J per bit. This replaces Moore's Law (an empirical trend, not a physical law) as the correct reference for energy scaling arguments.

## 11. Neurosecurity as Policy

### 11.1 The Convergence Problem

No single organization currently bridges cybersecurity governance, risk, and compliance (GRC) with neuroethics for brain-computer interfaces. On the security side, NIST, MITRE, and IEC produce world-class frameworks that address no neural endpoints. On the neuroethics side, UNESCO, the Neurorights Foundation, and the International Neuroethics Society define rights and principles but produce no technical security controls. The result is visible in Section 2.3: a BCI manufacturer can satisfy every existing compliance requirement with zero protections against neural-specific attacks.

### 11.2 Seven Neural-Specific Security Properties

Existing security frameworks (NIST CSF, ISO 27001, IEC 62443) operate on three properties: confidentiality, integrity, and availability. Neural interfaces require seven additional properties that no current standard addresses:

| # | Property | Definition |
|---|----------|-----------|
| 1 | **Neural Signal Authenticity** | Verification that a neural signal reflects genuine neural activity, not injected patterns or replayed recordings |
| 2 | **Adversarial Neurostimulation Prevention** | Protection against unauthorized write operations to the brain through a compromised stimulation channel |
| 3 | **Cognitive State Integrity** | Assurance that cognitive function and decision-making have not been altered by external manipulation |
| 4 | **Neural Re-identification Risk** | The possibility that "anonymized" neural data can be linked back to an individual via brain signal uniqueness |
| 5 | **Right to Disconnect** | The right to cease using a neural device without losing critical capabilities |
| 6 | **Surgical Update Constraint** | Security patches may require surgery, changing the cost and feasibility of vulnerability remediation |
| 7 | **Cognitive Reconnaissance and Disruption as Measurable Properties** | The ability to define, measure, test, and audit cognitive reconnaissance (read) and cognitive disruption (write) as formal security properties |

QIF addresses each: the coherence metric (Property 1), Neurowall L1 amplitude bounds (Property 2), NISS cognitive reconnaissance and disruption dimensions (Properties 3, 7), Neurowall L2 differential privacy (Property 4), NSP's graceful degradation tiers (Property 5), and NSP's crypto agility with 20-year key lifecycle (Property 6).

### 11.3 Regulatory Coverage Matrix

A systematic mapping of 25 organizations across medical device regulation, data protection, cybersecurity standards, neuroethics, and international governance reveals five structural gaps:

| Gap | Failure Mode | Consequence |
|-----|-------------|-------------|
| **HIPAA: Real-Time Stream Auditing** | BCIs generate 500Hz-2,000Hz streams; logging every event creates storage footprint larger than data | Manufacturers face impossible choice: exploding storage costs vs. non-compliance |
| **GDPR: Neural Fingerprinting Paradox** | Neural signatures enable both re-identification AND threat detection; stripping data destroys both | Must choose: anonymization (privacy-blind) or signal preservation (security-blind) |
| **CCPA/SB 1223: Zero Case Law** | No technical baseline for "mental integrity" violation thresholds | First enforcement action will define law retroactively |
| **FDORA: No Neural Scoring Standard** | Section 524B requires threat modeling but no neural taxonomy exists | FDA receives technically compliant but strategically blind submissions |
| **International: Soft Law Enforcement Vacuum** | UNESCO Recommendation carries moral weight but no legal penalties | Genuine compliance competitors disadvantaged vs. marketing-only claims |

### 11.4 Six Asks for Six Organizations

Based on the gap analysis, QIF proposes specific, time-bound actions for existing standards bodies:

| Organization | Ask | Timeline |
|-------------|-----|----------|
| **NIST** | Publish a BCI Security Profile for CSF 2.0 with neural integrity and cognitive confidentiality subcategories | 2026-2028 |
| **MITRE** | Create a Neural ATT&CK sub-matrix using TARA's 109 techniques as seed taxonomy | 2026-2028 |
| **FIRST** | Extend CVSS with neural impact metrics using NISS as a reference model | 2027-2029 |
| **IEEE** | Produce a BCI Cybersecurity Standard (P27XX) under IEEE Brain Initiative | 2027-2029 |
| **FDA/CDRH** | Add neural-specific threat categories to Section 524B cybersecurity guidance | 2026-2028 |
| **UNESCO** | Partner with NIST or ISO to produce technical annex with security controls for each element of the 2025 Recommendation on the Ethics of Neurotechnology | 2027-2030 |

These asks are designed to work within existing institutional mandates. NIST already publishes sector-specific CSF profiles. MITRE already maintains domain-specific ATT&CK matrices. FIRST already governs CVSS extensions. The infrastructure exists; what is missing is neural-domain content.

### 11.5 Implementation Timeline

**Phase 1: Foundation (2026-2027).** Establish vocabulary, seed taxonomies, initial voluntary adoption. TARA published as open registry. NISS scoring framework published. First NIST working group convened. Manufacturers pilot TARA in Section 524B submissions.

**Phase 2: Standardization (2027-2029).** Formal standards development, manufacturer pilots, first certifications. NIST BCI Security Profile published. MITRE Neural ATT&CK sub-matrix in development. IEEE P27XX enters ballot. FDA guidance updated with neural-specific categories.

**Phase 3: Maturation (2030+).** Binding requirements, qualified assessor ecosystem, routine compliance. ISO publishes neural security standard. Neural metrics integrated into CVSS. FDA requires neural-specific documentation. Qualified Neural Security Assessors (QNSAs) emerge as a professional role.

QIF is offered as proof of concept for this pipeline, not as the final standard. Standards bodies should adopt, adapt, or replace every component based on their own processes and expertise.

## 12. GRC Alignment

### 12.1 Neurorights-to-Security Control Mapping

The four foundational neurorights proposed by Ienca and Andorno (2017) [50] are widely cited in neuroethics but have no operational mapping to technical security controls. QIF provides this mapping:

| Neuroright | Security Property | QIF Implementation |
|-----------|------------------|-------------------|
| **Cognitive Liberty** | Authorization / Consent | Neurowall L3 policy engine validates consent state; RunematePolicy suppresses unauthorized stimulation |
| **Mental Privacy** | Confidentiality | NSP end-to-end encryption (ML-KEM + AES-256-GCM); Neurowall L2 calibrated differential privacy |
| **Mental Integrity** | Integrity | Coherence metric ($C_s$) detects signal tampering; NISS Cognitive Disruption (CD) dimension scores write-attack impact |
| **Psychological Continuity** | Availability + State Preservation | NSP graceful degradation tiers; NISS Neuroplasticity dimension tracks long-term pathway changes |

**Consent Complexity Index (CCI):**

Each technique carries a CCI score measuring the ratio of neurorights affected to the complexity of obtaining meaningful informed consent. CCI is computed as the weighted sum of affected neurorights divided by the technique's consent tractability. Across the 109-technique registry, mean CCI is 1.01, maximum is 2.7, and 11 techniques score above 2.0, indicating attacks where informed consent is structurally difficult to obtain because the harm mechanism is invisible, delayed, or irreversible. CCI operationalizes the gap between "consent was obtained" (a legal checkbox) and "consent was meaningful" (an ethical requirement).

This mapping transforms abstract philosophical rights into auditable, testable technical controls. A device can be assessed against these four neurorights by measuring whether its security architecture implements the corresponding QIF controls.

### 12.2 UNESCO Alignment

The UNESCO Recommendation on the Ethics of Neurotechnology (2025) contains 17 elements spanning human rights, privacy, mental integrity, cognitive liberty, vulnerable population protection, accountability, and public engagement. QIF provides full or partial technical implementation for 15 of 17 elements:

- **Full alignment (12 elements):** Human rights/dignity protection (consent framework + Neurowall), freedom of thought (coherence monitor + signal authenticity), mental privacy (NSP encryption + differential privacy), mental integrity (L1 amplitude bounds + coherence thresholds), cognitive liberty (policy engine + consent validation), privacy and data protection (data minimization), accountability and transparency (temporal aggregation logs), protection from stigmatization (data minimization + consent controls), regulation and oversight (certification pathway + regulatory mapping), professional responsibility (compliance expectations), public engagement (documentation transparency), protection of vulnerable populations (COPPA analysis + pediatric consent protocols).
- **Partial alignment (3 elements):** Benefit sharing and justice (post-deployment ethics framework, documented but not enforced), independent review (third-party audit process defined, not yet operational), education and awareness (planned).
- **Not addressable via security framework (2 elements):** Protection of genetic information (BCIs do not collect genomic data), equitable access to benefits (requires policy, not technology).

### 12.3 Enacted Legislation

Neurorights legislation is no longer theoretical. As of February 2026, the following jurisdictions have enacted or are considering neural data protection laws:

| Jurisdiction | Legislation | Status | Key Provision |
|-------------|-----------|--------|--------------|
| Chile | Constitutional Amendment (Art. 19) + Law 21.383 | Enacted Oct 2021 | First country to constitutionally protect neurorights; neural data classified as organ tissue |
| California | SB 1223 | Effective Jan 2025 | Adds "neural data" as CCPA sensitive personal information; grants mental integrity and cognitive liberty protections |
| Colorado | HB 24-1058 | Enacted 2024 | Protections for biological and neural data |
| Montana | Law 514 | Enacted 2025 | Neural data protection provisions |
| Connecticut | HB 5515 | Enacted 2025 | Neural data privacy protections |
| US Federal | MIND Act (S. 2925) | Committee consideration | Federal neural data standards; Neurotechnology Advisory Committee; cybersecurity requirements |
| EU | AI Act | Phased 2025-2027 | BCIs designated high-risk AI; transparency requirements |
| Council of Europe | Strategic Action Plan on Neurotechnology | Adopted Jan 2025 | Human rights-based framework for 46 member states |

QIF provides the technical infrastructure that these laws assume but do not specify. California's SB 1223 grants "mental integrity" protections but defines no technical baseline for violation. The MIND Act requires "cybersecurity requirements" but references no neural-specific standard. QIF, TARA, and NISS offer concrete implementations for each legislative requirement.

## 13. Market Trajectory and the Neurosecurity Imperative

The previous sections establish that a security gap exists (Section 2.3), that the attacks are real (Section 6), and that no framework addresses them (Section 3.5). This section examines the economic forces that make the gap urgent by analyzing capital flows into BCI against established models of technology adoption and security investment timing.

### 13.1 Measuring the Signal: From Consumer Indexes to Institutional Capital

Economic indicators exist at multiple scales, and choosing the right indicator for the right audience matters.

**Consumer-scale indicators** measure purchasing power and spending behavior of individuals. The Bloomberg Billy Bookcase Index (2009) tracks the price of IKEA's Billy bookcase across 50+ countries as a purchasing power parity proxy [104]. The Economist's Big Mac Index (1986) serves the same function using McDonald's pricing. The Consumer Discretionary Select Sector SPDR Fund (XLY) tracks where consumer dollars flow within the S&P 500's discretionary basket, heavily weighted toward Amazon (~22%), Tesla (~15%), and Home Depot. These instruments reveal where average consumers allocate discretionary income, and the structural shift from physical goods to digital services and technology is visible in XLY's composition: what was once a retail index now tracks e-commerce and autonomous vehicles.

The relevance to BCI: consumer neurofeedback headbands (Muse, Emotiv, NeuroSky) are entering the same discretionary spending basket as Apple Watch ($400-800), Oura Ring ($300-400), and Whoop ($240/year). The consumer neurofeedback market reached $183M in 2024 with a 19.5% CAGR [105]. Consumer BCI competes for the same wallet share as premium wellness technology.

**Institutional-scale indicators** measure where professional capital allocators deploy funds, and these are the instruments that predict market formation. The PitchBook-NVCA Venture Monitor tracks quarterly U.S. venture activity: $339B total deal value in 2025, with AI/ML capturing 65.6% of all VC dollars, up from 10% in 2015 [106]. The Cambridge Associates U.S. Venture Capital Index benchmarks VC fund returns net of fees: +6.2% in 2024, recovering from two consecutive negative years [107]. Preqin's Private Capital Index tracks global PE/VC AUM at $3.1 trillion, with AI accounting for over 50% of aggregate VC deal value in Q1-Q3 2025 [108]. CB Insights State of Venture reported $469B in global venture funding in 2025, the highest since 2022 [109].

These institutional indexes are the VC/PE equivalent of the Billy Bookcase Index. Where consumer indexes tell you what people are buying, institutional indexes tell you what markets are being built. The convergence of these indexes on AI and adjacent technologies (robotics at 9% of total VC in 2025, healthcare AI at $10.7B) reveals the macro allocation shift that will determine BCI's trajectory.

### 13.2 Capital Flow Analysis: Where the Money Is Going

#### BCI Investment Acceleration

BCI venture funding has followed a compound acceleration curve:

| Year | Total VC | Deals | Avg Deal Size | Year-over-Year |
|------|---------|-------|---------------|----------------|
| 2022 | $662.6M | 127 | ~$5.2M | Baseline |
| 2023 | $1.4B | 115 | ~$12.2M | +111% |
| 2024 | $2.3B | 129 | ~$17.8M | +64% |
| 2025 (est.) | ~$4B | ~130+ | ~$30M+ | +74% |

Source: Neurotechnology Substack, 2024 Funding Snapshot [110]; Tracxn BCI Market Report 2025.

Cumulative tracked BCI funding exceeds $4.8B. Through August 2025, BCI companies raised $802M in equity funding compared to $148M in the same period of 2024, a 443.59% increase [110].

#### Investor Class Diversification

The composition of BCI investors has shifted from specialist biotech VCs to a broad coalition spanning every institutional capital class:

| Capital Class | Entities | BCI Investments | Entry Period |
|--------------|---------|-----------------|-------------|
| Tier-1 VC | Sequoia, Founders Fund, Khosla, ARK, Lightspeed, Thrive, Bain Capital | Neuralink, Synchron, Science Corp, Merge Labs | 2021-2026 |
| Big Tech Corporate | OpenAI, Google Ventures, Meta (CTRL-Labs) | Merge Labs ($252M lead), Neuralink, CTRL-Labs ($500M+) | 2019-2026 |
| Sovereign Wealth | QIA (Qatar), NEOM/PIF (Saudi Arabia), Australian NRF, Mubadala (UAE) | Neuralink + Synchron (QIA dual), Paradromics (NEOM), Precision (Mubadala) | 2022-2025 |
| Intelligence/Defense | In-Q-Tel (IQT), US DoD, DARPA | Synchron (IQT Series D), Paradromics ($18M DARPA/NIH) | 2015-2025 |
| Alternative Capital | Tether (crypto), Duquesne Family Office (Druckenmiller) | Blackrock Neurotech ($200M majority), Precision ($102M Series C) | 2024 |
| International Strategic | IDG Capital, Walden (Intel), Lens Technology (Apple supply chain) | BrainCo ($286M) | 2024-2025 |

The most telling signal is multi-company positioning. ARCH Venture Partners holds Synchron, Neuralink, and Science Corp. Khosla Ventures holds Synchron, Paradromics, and Science Corp. QIA holds both Neuralink and Synchron. These are hedged portfolio plays across technical approaches, not speculative single bets.

#### Cross-Sector Capital Context

BCI's share of total global VC reveals the sector's maturity relative to AI:

| Sector | 2023 Share | 2024 Share | 2025 Share | Absolute 2025 |
|--------|-----------|-----------|-----------|---------------|
| AI/ML | ~27.5% | ~33-40% | 48-65.6% | $211-226B |
| Healthcare/Biotech | ~16% | ~16.5% | ~16.5% | ~$71.7B |
| Robotics | ~2-3% | ~4% | ~9% | $40.7B |
| BCI/Neurotech | ~0.4% | ~0.6% | ~0.7-0.9% | ~$3-4B |

BCI's absolute dollars roughly doubled annually, but its share of global VC remained below 1% because the denominator grew faster. This is characteristic of a pre-inflection sector: growing rapidly in absolute terms while remaining niche in relative allocation. The same pattern occurred with autonomous vehicles in 2014-2016 before the sector's share of mobility VC jumped from <1% to >5%.

### 13.3 The Security Spending Lag Model

Across every major technology wave in the past 30 years, cybersecurity spending has lagged technology adoption by 3-7 years. The pattern is consistent: a technology reaches critical mass, early security incidents are dismissed, a major breach or regulatory mandate catalyzes security investment, and the security market then grows at 2-4x the rate of the underlying technology.

| Technology | Adoption Inflection | Security Inflection | Lag | Catalyst |
|-----------|-------------------|-------------------|-----|---------|
| Internet | 1995 (Netscape IPO) | 2000-2001 (Code Red, Nimda) | 5-6 yr | Worms caused $10B+ damages |
| Cloud | 2010 ($24.6B market) | 2015 (CASB category created) | ~5 yr | Enterprise breaches, Gartner category |
| IoT | 2014-2015 (devices > population) | 2019-2020 ($12B market) | ~5 yr | Mirai botnet, DNS takedown |
| Automotive | 2015-2016 (connected car standard) | 2020-2024 (UN R155 mandate) | 4-5 yr | Jeep Cherokee hack, regulation |
| **BCI** | **2024 (first human implant)** | **2027-2031 (projected)** | **3-7 yr** | **First neural incident or mandate** |

Automotive cybersecurity grew from $1.7B (2019) to $5.91B (2025) following regulatory catalysts, a 3.5x increase in 6 years [111]. If BCI security follows a similar trajectory post-regulation, a $150M starting TAM in 2026 projects to $450-600M by 2031.

The current window (2024-2028) is the pre-security-inflection period. Organizations establishing BCI security frameworks now are positioned as the industry was for cloud security in 2012-2013 or automotive cybersecurity in 2017-2018: before the regulatory mandates, before the major breaches, before the spending surge.

### 13.4 Technology Adoption Positioning

**Rogers' Diffusion of Innovations** [112] describes technology adoption as an S-curve with five segments: innovators (2.5%), early adopters (13.5%), early majority (34%), late majority (34%), and laggards (16%). The transition from early adopters to early majority, the "chasm" identified by Moore (1991) [113], is where most technologies fail.

Invasive BCI is squarely in the **innovator** segment. Total active implant recipients worldwide number fewer than 100 (Neuralink PRIME: 5; Synchron COMMAND: ~10; Blackrock/BrainGate: ~40+; Precision: early trials). Even the addressable population for medical BCI (severe paralysis, locked-in syndrome, treatment-resistant epilepsy) numbers in the low millions globally.

**Gartner Hype Cycle positioning:** BCI is ascending toward the Peak of Inflated Expectations. Evidence: Gartner predicts 30% of knowledge workers will use brain-machine interfaces by 2030 [114], a prediction that conflates consumer neurofeedback with true bidirectional BCI. When sell-side analysts project TAMs two orders of magnitude above current market size ($400B TAM estimate from Morgan Stanley), hype is ascending. The Trough of Disillusionment has not yet arrived.

**Medical device S-curve comparison** provides the most grounded timeline:

| Device | First Implant | FDA Approval | Time to 1M Cumulative | Current Annual Rate |
|--------|--------------|-------------|----------------------|-------------------|
| Pacemaker | 1958 | 1960s | ~27 years | >1,000,000/yr |
| Cochlear implant | 1961 | 1984 | ~31 years | ~70,000/yr |
| Deep brain stimulation | 1987 | 1997 | Not yet (~200K total) | ~12,000/yr |
| **BCI (invasive)** | **1998** | **2024 (IDE)** | **?** | **<20/yr** |

Every implantable neural device has taken 25-35 years from first implant to 1M cumulative recipients. BCI's first research implant (BrainGate, 1998) projects reaching 1M cumulative by 2030-2035, but BCI has advantages earlier devices lacked: AI-assisted signal processing, digital infrastructure, and massive VC capital that could compress the timeline.

### 13.5 Elliott Wave Analysis of BCI Adoption

Elliott Wave Theory [115], formalized in the 1930s and extended by Frost and Prechter, posits that market prices unfold in five-wave impulse patterns driven by collective investor psychology oscillating between optimism and pessimism.

**Wave 1 (2016-2027): The Pioneer Phase.** Neuralink founded (2016). First human implants (2024). Cumulative funding exceeds $4.8B. Five companies receive FDA IDE or Breakthrough Device designations. OpenAI validates BCI as AI-adjacent technology (2026).

**Wave 2 (projected 2027-2029): Correction.** Expected triggers: first adverse clinical events, regulatory tightening, consumer-grade EEG oversaturation without clinical utility. Historical parallel: AI experienced correction in 2022-2023 before GPT-4 reignited momentum.

**Wave 3 (projected 2029-2038): Mass Adoption.** Regulatory frameworks mature. Insurance reimbursement codes established. Non-invasive consumer BCI crosses 10M annual units. This is the wave where security frameworks built during Wave 1 become the adopted standard.

**Wave 4 (projected 2038-2042): Consolidation.** M&A activity, regulatory maturation, neural data privacy enforcement.

**Wave 5 (projected 2042-2050+): Ubiquity.** Neural interfaces as standard computing modality.

**Limitations:** Elliott Wave Theory is a descriptive framework for market psychology, not a predictive science. Academic critiques note it suffers from post-hoc rationalization: waves are identified after the fact [116]. The wave boundaries here are estimates informed by historical parallels (cryptocurrency, autonomous vehicles), not forecasts. BCI is not a liquid market; funding rounds and adoption metrics serve as price proxies.

### 13.6 The TAM for BCI Security

Three independent approaches triangulate the total addressable market for BCI security:

**Approach 1: Healthcare IT Security Benchmark.** Healthcare organizations invest 6-10% of IT budgets on cybersecurity (HIMSS 2024 Survey [117]). Applied to BCI market projections:

| Year | BCI Market | Security % (low/high) | TAM Range |
|------|-----------|----------------------|-----------|
| 2026 | ~$3.3B | 5% / 8% | $167-266M |
| 2030 | ~$6-7B | 6% / 10% | $360-700M |
| 2034 | ~$12-15B | 7% / 12% | $840M-1.8B |

**Approach 2: Automotive Cybersecurity Growth Analog.** Automotive cybersecurity grew ~2.6x in 5 years ($2.3B to $5.91B, 2020-2025) [111]. A starting BCI security TAM of $150M in 2026 projects to $300-600M by 2031 at similar growth multiples.

**Approach 3: Bottom-Up Segmentation.**

| Segment | 2026 Est. | 2030 Projection |
|---------|----------|-----------------|
| Neural data encryption (device-level) | $20-30M | $80-120M |
| Secure comms (BCI-to-cloud) | $15-25M | $60-100M |
| Compliance/audit tooling | $10-20M | $50-80M |
| Threat detection/monitoring | $10-15M | $40-70M |
| Neural data privacy platforms | $5-10M | $30-50M |
| Pen testing/red team | $5-10M | $20-40M |
| **Total** | **$65-110M** | **$280-460M** |

**Consensus:** BCI security is a $150-400M market by 2030, scaling to $1B+ by 2034.

### 13.7 Synthesis: Why Security Frameworks Must Precede the Inflection

All five analytical frameworks converge on the same conclusion: BCI is in its first major growth wave, and security investment will follow with a 3-7 year lag. The period from 2024 to 2028 is the pre-inflection window, analogous to internet security in 1997-1999 (before Code Red), cloud security in 2012-2014 (before CASB), and automotive cybersecurity in 2017-2019 (before UN R155).

QIF does not exist to slow BCI innovation. It exists so that when the first neural data breach occurs, when the first BCI-specific regulation is promulgated, when insurance companies begin requiring neural device security certifications, the groundwork is already in place. The security framework that exists at the inflection point defines the industry's response. NIST CSF shaped enterprise security. ISO/SAE 21434 shaped automotive cybersecurity. The framework that shapes BCI security will be the one that was built before it was needed.

The full economic analysis supporting this section, including per-company investor tracking, cross-portfolio analysis, and detailed TAM methodology, is available in the companion research document (`model/research/BCI-ECONOMIC-ANALYSIS.md`) and queryable via the BCI Landscape API (Section 7.8).

## 14. Future Work

> **Note:** This section reflects the validation roadmap as of v8.0 (March 2026). Items marked DONE have been completed since v7.0. For the full, current validation roadmap, see [QIF Whitepaper v8.0](https://github.com/qinnovates/neurosecurity/blob/main/model/whitepapers/QIF-WHITEPAPER-V8-DRAFT.md), Section 10 (Future Work) and Section 19 (Research Validation).

### 14.1 Immediate Priorities

1. **Coherence Metric Validation on Recorded EEG.** Apply $C_s$ to PhysioNet EEGBCI dataset (109 subjects) and BrainFlow live data. Generate synthetic attacks. Publish results regardless of outcome.
2. **Synthetic Attack Dataset.** No public "tampered BCI" dataset exists. Creating one would itself be a publishable contribution.
3. **Consumer $D_{\text{spec}}$ Validation.** Test the spectral consistency proxy on consumer-grade EEG data (Muse, Emotiv).
4. **Neurowall Phase 2.** Validate against recorded EEG datasets (PhysioNet, MNE-Python), then deploy on Cortex-M4F reference platform.

### 14.2 Completed Since v7.0

- **DONE: NISS v1.1 CR/CD split.** CG metric split into Cognitive Reconnaissance (read) and Cognitive/Functional Disruption (write). Weights renormalized.
- **DONE: NISS v1.1.1 NP 4-level expansion.** Neuroplasticity metric expanded from 3 to 4 levels. 26 TARA scores recalculated.
- **DONE: NISS v2.0 neurological extension.** 42 ICD-10-CM conditions mapped. Five weighting factors (R, FI, PS, CE, MC) defined. CD broadened to encompass sensory/motor/autonomic disruption.
- **DONE: KQL datalake.** All NISS metrics, TARA techniques, neurological conditions, and research sources now queryable via KQL tables (`src/lib/kql-tables.ts`). 39 tables, 860+ records.
- **DONE: BCI Trend Database.** Structured database tracking 26 companies, 34 devices, 44 funding rounds, 25 market estimates. Queryable via KQL.
- **DONE: Dashboard rebuild.** Single pane of glass with KQL as primary data lake interface.
- **DONE: Kinect depth-sensing visualization.** Three.js point cloud renderer (`KinectVision.tsx`) as proof-of-concept for the proposed visual cortex rendering pipeline. 307,200-vertex point cloud with custom GLSL shaders, AI object classification overlays, deployed on the [BCI Vision page](https://qinnovate.com/vision). See item 14 in Medium-Term Research for the full research direction, and [How Ethical Hackers Can Cure Blindness](https://qinnovate.com/research/papers/max-hodak-api-of-the-brain/) for the attack-chain-to-clinical-pipeline mapping.

### 14.3 Medium-Term Research

5. **NSP Reference Implementation.** Build in Python (OpenBCI) and C (firmware-embeddable), integrating liboqs.
6. **Resonance Shield Feasibility Study.** Determine whether active EM cancellation can be miniaturized to implant-compatible dimensions.
7. **Intermodulation Detection Research.** Solve the detection gap identified in Section 6.2.
8. **TARA Clinical Validation.** Populate the clinical and diagnostic projections with practising neurologists and BCI researchers. Validate the ~35-40 Category 1 entries against published neuromodulation protocols.
9. **TARA Governance Projection.** Map each TARA entry to applicable regulatory frameworks (FDA 524B, EU MDR, ISO 14971) and generate per-technique compliance checklists.
10. **NISS v2.0 weighting factor calibration.** The five neurological weighting factors (R, FI, PS, CE, MC) need clinical calibration against real patient outcomes. Current values are author assessments.
11. **NISS weights validation across clinical populations.** Default metric weights need independent review.
12. **Neuroplasticity causation studies.** Validate the mapping from attack technique to NP score against empirical BCI stimulation data.
13. **Conference and Peer Review.** Target academic venues (Graz BCI, IEEE, USENIX) for independent evaluation of the framework.
14. **Vision Restoration From a Security Engineering Perspective.** AI has reshaped neuroscience --- AlphaFold (Jumper et al. 2021) predicted protein structures that took decades of crystallography; deep learning decoders now translate neural activity into speech at rates approaching natural conversation (Willett et al. 2023). Interdisciplinary perspectives have consistently unlocked what single-domain approaches could not. Security engineering can bring the same kind of fresh lens to BCIs. The Greeks did not build the Trojan Horse to go through the front door. They built it to get past a barrier they could not breach head-on. Entering BCI research through the security backdoor --- mapping attack chains first, then recognizing their therapeutic duals --- reveals something that front-door clinical research alone does not surface: the same capture-process-inject attack chain a hacker uses to compromise a visual BCI is the exact same pipeline a clinician needs to restore sight. The physics does not care about intent.

    The Kinect depth-sensing visualization (Three.js, `KinectVision.tsx`) is a proof-of-concept for this proposal. Microsoft Kinect uses structured-light IR depth sensing to produce point clouds at 30 fps. The existing Three.js implementation converts video luminance to vertex displacement via custom GLSL shaders at 307,200 vertices (640x480), simulating how a depth sensor's output could be transformed into a neural-compatible visual stream. Two variants are deployed on the [BCI Vision page](https://qinnovate.com/vision): a natural-color depth map and a Kinect-aesthetic green wireframe with AI object classification overlays (service-dog variant with real-time confidence scoring).

    The technology to simulate this end-to-end in code already exists. The depth capture and 3D reconstruction stages run in Three.js today. The Runemate compiler (Rust) and NSP encryption layers exist as reference implementations. The gap is the cortical encoding stage: mapping 3D point clouds to phosphene patterns compatible with visual cortex prosthetics. Current cortical visual prosthetics (Gennaris by Monash Vision Group; the discontinued Orion project by Second Sight) produce low-resolution phosphene patterns using tens to hundreds of electrodes --- far from high-fidelity perception. The perceptual quality of cortically delivered visual content remains a subject of ongoing research (van der Grinten et al. 2024, eLife). AI-assisted OCR and object recognition could add a semantic layer that current cortical prosthetics lack --- the ability to label what the patient perceives, not just render shapes --- but this remains a proposed capability, not a demonstrated one.

    The full proposed pipeline: depth capture (Kinect/LIDAR) → scene reconstruction → Runemate neural compilation → NSP encryption → Neurowall signal integrity check → visual cortex delivery. Each stage maps 1:1 to a TARA attack technique. 11 TARA techniques form a 5-stage chain (capture, eavesdrop, encode, inject, replay), and every stage has a clinical analogue. The security questions this raises are the ones TARA and NISS already answer: who authenticates the visual stream, who validates the content before it reaches neural tissue, and what happens when the rendering pipeline is compromised.

    **The Sensor Configuration Problem: Unicast vs. Multicast.** The sensors that feed this pipeline already exist in consumer hardware. Modern smartphones carry LIDAR (iPhone 12 Pro and later), structured-light depth cameras, and WiFi CSI sensing capable of through-wall body tracking (demonstrated by Geng et al. 2022 using DensePose from WiFi). These are the same sensor modalities that a vision restoration BCI would rely on to capture the environment for cortical rendering. The neuroethics question this raises is not about the sensors themselves but about how they are configured.

    Borrowing from network engineering: a sensor has a delivery topology. In a *unicast* configuration, the sensor streams environmental data to a single destination --- the patient's visual cortex processing pipeline. In a *multicast* configuration, that same sensor data is broadcast to multiple receivers or processing nodes. The distinction matters because a multicast-configured depth sensor on a vision restoration BCI would expose environmental spatial data --- 3D room geometry, object positions, potentially identifiable human figures --- to systems beyond the patient's own perceptual stream.

    A cybernetically enhanced individual with a multicast-configured depth sensor could have access to spatial information that unenhanced individuals do not: real-time 3D environmental mapping, object classification, and scene understanding processed at computational speed and overlaid onto cortically delivered perception. Current cortical prosthetics are far from this capability --- today's phosphene arrays produce crude visual impressions, not augmented reality. But electrode density is scaling (BISC achieved 65,536 channels in 2025), and the sensor hardware is already consumer-grade. The gap between "crude phosphene grid" and "spatially enriched perception" is an engineering timeline, not a physics barrier.

    A unicast sensor that streams only to the patient's visual cortex is a medical device. A multicast sensor that shares environmental data with external systems is a surveillance platform that happens to also restore sight. The difference between the two is a configuration decision that may not receive explicit security or ethics review during device design --- especially if the primary engineering focus is clinical efficacy rather than information flow topology.

    This is not science fiction. It is entirely possible that a BCI research company, focused on the clinical goal of restoring vision, introduces a sensor subsystem without constraints on its broadcast topology. The BCI Limits Equation (Section 14.4) defines 12 physics constraints that every implant must satisfy, but all 12 address the implant-to-tissue boundary --- power, thermal, impedance, charge density. None currently address the sensor input stage: who receives the environmental data the sensor captures, what processing is permitted before cortical delivery, and whether the sensor's output can be redirected, duplicated, or intercepted. This is a gap in the constraint system.

    Whether the benefits of restored or enhanced perception outweigh the risks of perceptual asymmetry between enhanced and unenhanced individuals is not a question security engineering can answer. That question belongs to ethicists, policymakers, disability rights advocates, and the patients themselves. What security engineering *can* do is help society determine those risks in a quantified way. QIF provides the architecture to model the threat surface of a vision restoration pipeline. TARA catalogs the specific techniques by which a sensor subsystem could be exploited, reconfigured, or repurposed. NISS scores the clinical and cognitive impact of each failure mode. The conversation about whether to permit, constrain, or prohibit multicast-capable sensor architectures in neural prosthetics must happen now, before the devices ship --- and it must be grounded in quantified risk assessment, not speculation about futures that may or may not arrive.

    For the full analysis mapping the attack chain to the vision restoration pipeline, see: [How Ethical Hackers Can Cure Blindness](https://qinnovate.com/research/papers/max-hodak-api-of-the-brain/).

### 14.4 BCI Limits Equation

A unified physics-constraint system coupling thermodynamics, electromagnetism, information theory, biocompatibility, and QIF coherence has been derived but is not yet published in peer-reviewed form. The system specifies 12 simultaneous constraints that every BCI implant must satisfy:

1. Total power must stay below the thermal ceiling for the target brain region
2. Clock frequency is bounded by tissue attenuation at implant depth
3. Channel count follows an empirical doubling time (~7.4 years per Stevenson and Kording 2011)
4. Electrode charge density must remain within the Shannon safety limit (k < 1.75)
5. Spike energy must exceed the Boltzmann thermal noise floor for detection
6. Coherence metric must remain above the minimum threshold for the target function
7. Temperature rise must not exceed 1.0 C (IEC 60601-1)
8. Brain-silicon mechanical mismatch (5-7 orders of magnitude) constrains electrode longevity
9. Electrode impedance must remain below signal-type-dependent maxima over the implant lifetime
10. Implant volume must fit within the geometric constraints of the target region
11. Shannon channel capacity must exceed the minimum information rate for the target function
12. Wireless bandwidth must support the required data rate at acceptable power

The constraint system extends Marblestone et al. (2013), which addressed thermal and EM constraints for scalable neural recording but did not include Shannon electrode safety, CMOS scaling projections, or QIF coherence as a security constraint. The key novel contribution is coupling the coherence metric (Constraint 6) with physics constraints: as thermal budgets enable higher channel counts, specific TARA techniques become feasible, and the coherence metric must scale accordingly. This constraint system is a candidate for standalone publication.

### 14.5 Long-Term Goals

12. **Unified QI Equation.** The current coherence metric ($C_s = e^{-S_c}$) captures classical signal integrity. A theoretical extension incorporating quantum terms (ion channel tunneling, entanglement gated by decoherence, indeterminacy) remains a research direction: $QI(b,t) = e^{-(S_c + S_q)}$. This extension requires experimental measurement of the decoherence time $\tau_D$ at the electrode-tissue boundary, which is currently an unresolved question in quantum biology (estimates range from $10^{-13}$ seconds [15] to $10^{-3}$ seconds [55]). If $\tau_D$ proves to be very short, the quantum terms are negligible and $C_s$ is the complete metric. If longer coherence times are confirmed, the quantum terms provide additional attack detection capabilities. The framework is designed so this question is empirically resolvable rather than assumed.
13. **Quantum State Tomography at the BCI Interface.** Measure the actual $\tau_D$ at a BCI electrode-tissue junction.
14. **Tunneling Biometric Feasibility.** Single-channel patch clamp studies to determine individual variability in tunneling coefficients.
15. **v4.0 Architecture Validation.** Map historical BCI adverse events to specific bands to test severity stratification.
16. **$H_{\text{interface}}$ Formulation.** Write down the total Hamiltonian $H_{\text{total}} = H_{\text{neuron}} + H_{\text{electrode}} + H_{\text{interface}} + H_{\text{environment}}$ for a specific BCI system.
17. **Cardiac Intrinsic Nervous System as Independent Coherence Monitor.** The heart contains an intrinsic cardiac nervous system (ICNS) of approximately 40,000 neurons (Armour 1991, 2007; Shivkumar et al. 2016, *Journal of Clinical Investigation*) that sense, process, and retain information independently of central nervous system input. The vagus nerve, the primary conduit between heart and brain, is approximately 80% afferent (heart-to-brain) and 20% efferent (brain-to-heart) (Berthoud & Neuhuber 2000, *Autonomic Neuroscience*). The heart sends substantially more information to the brain than the brain sends to the heart --- not because the heart "thinks," but because the vagus nerve's fiber composition is asymmetrically weighted toward sensory transmission. Note: the afferent fibers carry all visceral signals (gut, lungs, heart), not cardiac signals exclusively; the 80/20 ratio describes the vagus nerve as a whole, not a dedicated cardiac-to-brain channel.

    The ICNS neurons are bidirectional in the sense that the cardiac ganglia contain sensory neurons (afferent), local circuit neurons (interneurons that process locally), and motor neurons (efferent) --- forming a complete reflex arc that can operate without cranial input. Chemical synapses within this system are unidirectional (presynaptic to postsynaptic), as in all chemical synaptic transmission, but the cardiac ganglia also contain gap junctions (electrical synapses) that permit bidirectional current flow between coupled neurons. The system as a whole supports bidirectional communication with the brain, but the bandwidth asymmetry favors the ascending (heart-to-brain) direction.

    From a security architecture perspective, this is a monitoring topology: a simpler, lower-frequency, higher-regularity system (cardiac rhythm at ~1--2 Hz) independently observing a more complex, higher-frequency, noisier system (cortical oscillations across 1--100+ Hz in multiple bands). In security engineering, you do not use the complex system to monitor itself --- you use a simpler, more reliable watchdog. The ICNS may represent nature's implementation of this principle.

    **Clinical application: early detection of NSTEMI.** Non-ST-elevation myocardial infarction (NSTEMI) is currently detected through a combination of serum troponin levels (which may take hours to rise above detection thresholds), ECG changes (which may be subtle or absent in NSTEMI by definition), and clinical presentation. A cardiac neural interface --- building on the mature implant pathway of pacemakers and ICDs, which have over 60 years of clinical history and more than 1 million implantations per year --- could potentially detect ischemic changes at the ICNS level before they manifest as conventional biomarkers. The ICNS neurons respond to local ischemia (Armour 2008), and their signaling patterns change during cardiac stress. Whether this response is early enough and specific enough to outperform high-sensitivity troponin assays is an open empirical question.

    **Implantation considerations.** The cardiac implant pathway is substantially more mature and less invasive than cranial BCI implantation. Pacemaker implantation is a routine outpatient procedure with well-characterized risk profiles and decades of longitudinal outcome data. A cardiac neural interface that leverages this established surgical pathway would face a lower regulatory and clinical barrier than a novel cranial implant --- though the ICNS itself has never been a direct therapeutic target, and electrode placement within or adjacent to cardiac ganglia introduces risks (arrhythmia, ganglionated plexus stimulation) that are distinct from standard pacemaker lead placement.

    **The Egyptian observation.** Ancient Egyptian mummification practices preserved the heart as the seat of intelligence and identity while discarding the brain through the nose (excerebration). This is a historical fact, not a scientific claim. It is noted here because it represents the oldest documented cultural intuition that cardiac function is more central to identity than cranial function --- an intuition that modern cardiac neuroscience has partially vindicated, not in the mystical sense, but in the anatomical observation that the heart has its own nervous system and that afferent cardiac signaling measurably influences cortical processing. Interoceptive research (Critchley & Garfinkel 2017, *Nature Reviews Neuroscience*) has established that cardiac signals modulate perception, decision-making, and emotional experience through heartbeat-evoked potentials detectable in cortical EEG. The degree to which cardiac signaling "shapes thoughts" beyond these documented interoceptive effects remains an open question in neuroscience.

    **Personal observation: identity persistence beyond cognitive collapse.** The author's grandmother lived with Alzheimer's disease through its final stages. Alzheimer's progressively destroys cortical neurons --- beginning in the entorhinal cortex and hippocampus (Braak staging I--II), spreading to the association cortices (III--IV), and ultimately reaching primary sensory and motor areas (V--VI) (Braak & Braak 1991, *Acta Neuropathologica*). In advanced stages, the cortical infrastructure that supports declarative memory, language, spatial reasoning, and executive function is substantially degraded. The brain, in the clinical sense, is no longer capable of performing the cognitive operations it was built for. Dysphagia (difficulty swallowing) is a well-documented late-stage Alzheimer's complication, occurring in an estimated 80--93% of patients with advanced dementia (Alagiakrishnan et al. 2013, *Postgraduate Medical Journal*), as the cortical and brainstem circuits that coordinate the swallowing reflex degenerate.

    And yet. Something persisted. Even when her mind could no longer physically eat or digest food without assistance, even when the cognitive architecture was profoundly compromised, a sense of self in its most fundamental form remained. Spiritual determination and sheer force of will --- qualities that resist reduction to any single neural substrate --- continued to express themselves in a person whose cortex could no longer support the operations neuroscience associates with selfhood. This is not a scientific claim. It is an observation that the author cannot fully explain within the current neuroscience framework, and that honesty is the point.

    The Egyptians chose to preserve the heart and never the brain. Perhaps what they intuited, and what modern cardiac neuroscience is beginning to formalize, is that the heart's independent nervous system --- with its 40,000 neurons, its predominantly afferent signaling to the brain, and its autonomous processing --- contributes something to identity that persists even when the cortical substrate fails. Alzheimer's destroys neurons in the cerebral cortex. It does not destroy the intrinsic cardiac nervous system. The ICNS continues to sense, process, and signal to whatever cortical tissue remains, maintaining its afferent stream throughout the disease course. Whether this cardiac signaling contributes to the persistence of selfhood observed in late-stage dementia patients is not something current science can answer. It is, however, a question worth asking --- and it connects directly to the neuroright of psychological continuity: the preservation of personal identity over time.

    If psychological continuity can persist beyond the collapse of the cortical systems that neuroscience traditionally credits for generating it, then the neural correlates of identity may extend beyond the brain. A framework for neural security that accounts only for cranial signals may be protecting the wrong organ --- or at least an incomplete set of organs. This is speculative. It is flagged as such. But the observation that identity outlasts the cortex is not speculative. It is witnessed by every family that has accompanied a loved one through the final stages of neurodegenerative disease.

    **What this is not.** This is not a claim that the heart "thinks," that cardiac neurons are equivalent to cortical neurons, or that the ICNS constitutes a "second brain" in any computationally meaningful sense. The ICNS is a peripheral autonomic ganglion with local processing capability --- remarkable for a non-cranial structure, but not comparable in complexity or function to the central nervous system. Claims about "heart intelligence" or "cardiac consciousness" found in popular literature (particularly from the HeartMath Institute) are not supported by the peer-reviewed neuroscience cited here. The hypothesis is narrower and more specific: the ICNS may function as a lower-bandwidth, higher-reliability coherence monitor for the cortical system, and its established implant pathway may offer a less invasive route to neural monitoring than cranial BCI. Both claims require empirical validation.

    **Research questions (from Derivation Log, Entry 83):**
    1. Does the ICNS provide a measurable coherence signal that correlates with cognitive drift?
    2. Could cardiac coherence serve as a less invasive proxy for neural coherence in drift detection?
    3. Is the 80/20 afferent/efferent asymmetry of the vagus nerve functionally equivalent to a monitoring architecture (read-heavy, write-light)?
    4. Can ICNS ischemic response patterns outperform high-sensitivity troponin for early NSTEMI detection?

    There is more to unpack here --- the relationship between cardiac interoception, emotional processing, and identity preservation under neural interface conditions warrants deeper investigation. This is flagged as a long-term research direction, not a current capability.

---

The physics described in this paper is already operating in the reader's nervous system. Every sentence processed here traverses synaptic junctions where ions tunnel through voltage-gated channels, where neurotransmitter release depends on quantum-scale energy transfers along SNARE complexes, and where the resulting neural patterns physically restructure through long-term potentiation. The interface between this text and the reader's comprehension is a brain-computer interface --- one mediated by photons, retinal transduction, and cortical processing rather than by implanted electrodes. The electrode simply shortens the path. The physics at the destination does not change.

If the framework in this paper succeeds, it will not be measured by citation count or adoption metrics. It will be measured by whether a patient with treatment-resistant depression can trust the device implanted in their brain. Whether a child with drug-resistant epilepsy receives a responsive neurostimulator whose security architecture was designed for the physics of neural tissue, not retrofitted from a network packet model. Whether the people aging into neurodegenerative disease --- the patients with Alzheimer's who cannot advocate for themselves, the patients with demyelinating conditions whose neural containment is already compromised --- have access to therapeutic BCIs that are safe enough to deploy and trustworthy enough to prescribe.

Time is the variable that constrains all of this. The devices are shipping. The patients are waiting. The security architecture must be ready before the technology outpaces it.

## 15. References

**Quantum Indeterminacy and Uncertainty Relations**

[1] Heisenberg, W. (1927). Uber den anschaulichen Inhalt der quantentheoretischen Kinematik und Mechanik. *Zeitschrift fur Physik*, 43(3-4), 172--198.

[2] Robertson, H. P. (1929). The uncertainty principle. *Physical Review*, 34(1), 163--164.

[3] Schrodinger, E. (1930). Zum Heisenbergschen Unscharfeprinzip. *Sitzungsberichte der Preussischen Akademie der Wissenschaften*, 296--303.

[4] Kimura, G., Endo, S., & Fujii, K. (2025). Beyond Robertson-Schrodinger. *arXiv*, 2504.20404.

[5] Maccone, L., & Pati, A. K. (2014). Stronger uncertainty relations. *Physical Review Letters*, 113(26), 260401.

[6] Kochen, S., & Specker, E. P. (1967). The problem of hidden variables. *Journal of Mathematics and Mechanics*, 17(1), 59--87.

**Von Neumann Entropy and Density Matrix**

[7] Von Neumann, J. (1932). *Mathematische Grundlagen der Quantenmechanik*. Springer.

[8] Nielsen, M. A., & Chuang, I. L. (2010). *Quantum Computation and Quantum Information*. Cambridge University Press.

**Born Rule**

[9] Born, M. (1926). Zur Quantenmechanik der Stossvorgange. *Zeitschrift fur Physik*, 37(12), 863--867.

[10] Masanes, L., Galley, T. D., & Muller, M. P. (2019). The measurement postulates of quantum mechanics are operationally redundant. *Nature Communications*, 10(1), 1361.

**Quantum Tunneling in Neural Systems**

[11] Qaswal, A. B. (2019). Quantum tunneling of ions through closed voltage-gated channels. *Quantum Reports*, 1(2), 219--225.

[12] Georgiev, D. D., & Glazebrook, J. F. (2018). Quantum physics of synaptic communication via SNARE. *Progress in Biophysics and Molecular Biology*, 135, 16--29.

[13] Walker, E. H. (1977). Quantum mechanical tunneling in synaptic and ephaptic transmission. *Int. J. Quantum Chemistry*, 11(1), 103--127.

[14] Summhammer, J., Salari, V., & Bernroider, G. (2012). Quantum-mechanical description of ion motion within voltage-gated ion channels. *J. Integrative Neuroscience*, 11(2), 123--135.

**Decoherence in Neural Tissue**

[15] Tegmark, M. (2000). Importance of quantum decoherence in brain processes. *Physical Review E*, 61(4), 4194--4206.

[16] Jedlicka, P. (2017). Revisiting the quantum brain hypothesis. *Frontiers in Molecular Neuroscience*, 10, 366.

[17] Sattin, D. et al. (2023). A quantum-classical model of brain dynamics. *Entropy*, 25(4), 592.

[18] Lambert, N. et al. (2013). Quantum biology. *Nature Physics*, 9(1), 10--18.

**Quantum Zeno Effect**

[19] Misra, B., & Sudarshan, E. C. G. (1977). Zeno's paradox in quantum theory. *J. Mathematical Physics*, 18(4), 756--763.

[20] Itano, W. M. et al. (1990). Quantum Zeno effect. *Physical Review A*, 41(5), 2295--2300.

**Quantum Cryptography and Security**

[21] Bennett, C. H., & Brassard, G. (1984). Quantum cryptography. *Proc. IEEE ICCSSP*, 175--179.

[22] Ekert, A. K. (1991). Quantum cryptography based on Bell's theorem. *Physical Review Letters*, 67(6), 661--663.

[23] Gottesman, D., & Chuang, I. (2001). Quantum digital signatures. *arXiv*, quant-ph/0105032.

[24] Wootters, W. K., & Zurek, W. H. (1982). A single quantum cannot be cloned. *Nature*, 299(5886), 802--803.

**Neuroscience**

[25] Fries, P. (2005). A mechanism for cognitive dynamics: Neuronal communication through neuronal coherence. *Trends in Cognitive Sciences*, 9(10), 474--480.

[26] Fries, P. (2015). Rhythms for cognition: Communication through coherence. *Neuron*, 88(1), 220--235.

[27] Markram, H. et al. (1997). Regulation of synaptic efficacy by coincidence of postsynaptic APs and EPSPs. *Science*, 275(5297), 213--215.

[28] Bi, G. Q., & Poo, M. M. (1998). Synaptic modifications in cultured hippocampal neurons. *J. Neuroscience*, 18(24), 10464--10472.

[29] Borst, J. G. G. (2010). The low synaptic release probability in vivo. *Trends in Neurosciences*, 33(6), 259--266.

[30] Buzsaki, G., & Draguhn, A. (2004). Neuronal oscillations in cortical networks. *Science*, 304(5679), 1926--1929.

[31] Hodgkin, A. L., & Huxley, A. F. (1952). Membrane current and conduction in nerve. *J. Physiology*, 117(4), 500--544.

[32] Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379--423.

**Quantum Computing Threats**

[33] Gidney, C., & Ekera, M. (2021). How to factor 2048 bit RSA integers in 8 hours. *Quantum*, 5, 433.

[34] Gidney, C. (2025). Factoring integers with sublinear resources on a superconducting quantum processor. *arXiv*, 2505.15917.

[35] Bennett, C. H. et al. (1997). Strengths and weaknesses of quantum computing. *SIAM J. Computing*, 26(5), 1510--1523.

[36] Zalka, C. (1999). Grover's quantum searching algorithm is optimal. *Physical Review A*, 60(4), 2746--2751.

[37] NIST. (2024). *Post-Quantum Cryptography Standardization*. FIPS 203, 204, 205.

**BCI Technology**

[38] Musk, E., & Neuralink. (2019). An integrated brain-machine interface platform. *J. Medical Internet Research*, 21(10), e16194.

[39] Fisher, M. P. A. (2015). Quantum cognition: Processing with nuclear spins. *Annals of Physics*, 362, 593--602.

[40] Koch, K. et al. (2006). How much the eye tells the brain. *Current Biology*, 16(14), 1428--1434.

[41] Norretranders, T. (1998). *The User Illusion*. Viking.

[42] Srinivasan, R. et al. (1999). Increased synchronization during conscious perception. *J. Neuroscience*, 19(13), 5435--5448.

[43] Massimini, M. et al. (2004). The sleep slow oscillation as a traveling wave. *J. Neuroscience*, 24(31), 6862--6870.

**Foundational Physics**

[44] Nernst, W. (1889). Die elektromotorische Wirksamkeit der Ionen. *Z. Phys. Chem.*, 4, 129--181.

[45] Cole, K. S., & Cole, R. H. (1941). Dispersion and absorption in dielectrics. *J. Chemical Physics*, 9(4), 341--351.

[46] Boltzmann, L. (1877). Uber die Beziehung zwischen dem zweiten Hauptsatze. *Wiener Berichte*, 76, 373--435.

[47] Grover, L. K. (1996). A fast quantum mechanical algorithm for database search. *Proc. 28th ACM STOC*, 212--219.

[48] Shor, P. W. (1994). Algorithms for quantum computation. *Proc. 35th FOCS*, 124--134.

**Neuroethics**

[49] Yuste, R. et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159--163.

[50] Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience. *Life Sciences, Society and Policy*, 13(1), 5.

**BCI Security**

[51] Martinovic, I. et al. (2012). Side-channel attacks with brain-computer interfaces. *Proc. 21st USENIX Security*, 143--158.

[52] Bonaci, T. et al. (2014). App stores for the brain. *IEEE Technology and Society*, 34(2), 32--39.

[53] Frank, M. et al. (2017). Using EEG-based BCI devices to probe for private information. *PETS*, 2017(3), 133--152.

[54] Bernal, S. L. et al. (2022). Security in brain-computer interfaces: State-of-the-art. *ACM Computing Surveys*, 54(1), 1--35.

**Recent Developments (2022--2025)**

[55] Perry, C. (2025). Quantum sensing approaches to microtubule coherence measurement. *SSRN preprint*.

[56] Clarke, J. et al. (2025). Macroscopic quantum tunneling in Josephson junction circuits. *Nobel Prize in Physics 2025*.

[57] Kim, H. et al. (2025). Under-the-barrier recollision in quantum tunneling. *Physical Review Letters*.

[58] Wiest, R. (2025). NeuroQ: Quantum-inspired neural dynamics via stochastic mechanics. *Neuroscience of Consciousness*.

[59] Qaswal, A. B. et al. (2022). Mathematical models for quantum tunneling through voltage-gated ion channels. *Quantum Reports*.

[60] BISC Consortium (2025). 65,536-channel brain-computer interface with 100 Mbps wireless. *Nature Electronics*.

**Thermodynamics and Information Theory**

[61] Landauer, R. (1961). Irreversibility and heat generation in computing. *IBM J. Research and Development*, 5(3), 183--191.

**Black Hole Physics and Information Theory**

[62] Sekino, Y., & Susskind, L. (2008). Fast scramblers. *JHEP*, 2008(10), 065.

[63] Grossman, N. et al. (2017). Noninvasive deep brain stimulation via temporally interfering electric fields. *Cell*, 169(6), 1029--1041.

[64] Bell, J. S. (1964). On the Einstein Podolsky Rosen paradox. *Physics Physique Fizika*, 1(3), 195--200.

[65] 't Hooft, G. (1993). Dimensional reduction in quantum gravity. In *Salamfestschrift*. World Scientific.

[66] Susskind, L. (1995). The world as a hologram. *J. Mathematical Physics*, 36(11), 6377--6396.

[67] Bekenstein, J. D. (1981). Universal upper bound on entropy-to-energy ratio. *Physical Review D*, 23(2), 287--298.

[68] Page, D. N. (1993). Average entropy of a subsystem. *Physical Review Letters*, 71(9), 1291--1294.

[69] Dvali, G. (2018). Black holes as brains: Neural networks with area law entropy. *Fortschritte der Physik*, 66(4), 1800007.

[70] Tozzi, A. et al. (2023). From black holes entropy to consciousness. *Physica A*, 626, 129112.

[71] Pastawski, F. et al. (2015). Holographic quantum error-correcting codes. *JHEP*, 2015(6), 149.

[72] Hawking, S. W. (1975). Particle creation by black holes. *Comm. Mathematical Physics*, 43(3), 199--220.

[73] Hodgkin, A. L., & Huxley, A. F. (1952). A quantitative description of membrane current and its application to conduction and excitation in nerve. *Journal of Physiology*, 117(4), 500--544.

[74] UNESCO World Heritage Centre. (2011). The Persian Garden. Inscription on the World Heritage List, No. 1372.

[75] Olmsted, F. L., & Vaux, C. (1858). Description of a plan for the improvement of the Central Park: "Greensward." Board of Commissioners of the Central Park.

[76] King, A., Caltagirone, C., Steers, C., & Slaboch, N. (2018). Mapping tranquility --- a case study of the Central Park soundscape. *INTER-NOISE 2018*, Chicago.

[77] Declercq, N. F., & Dekeyser, C. S. A. (2007). Acoustic diffraction effects at the Hellenistic amphitheatre of Epidaurus. *Journal of the Acoustical Society of America*, 121(4), 2011--2022.

[78] Pardridge, W. M. (2005). The blood-brain barrier: bottleneck in brain drug development. *NeuroRx*, 2(1), 3--14.

[79] Maturana, H. R., & Varela, F. J. (1972). *Autopoiesis and Cognition: The Realization of the Living*. D. Reidel Publishing.

[80] Kaplan, R., & Kaplan, S. (1989). *The Experience of Nature: A Psychological Perspective*. Cambridge University Press.

[81] Ulrich, R. S. (1984). View through a window may influence recovery from surgery. *Science*, 224(4647), 420--421.

[82] Polikov, V. S., Tresco, P. A., & Reichert, W. M. (2005). Response of brain tissue to chronically implanted neural electrodes. *Journal of Neuroscience Methods*, 148(1), 1--18.

**BCI Security Lineage**

[83] Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: security and privacy for neural devices. *Neurosurgical Focus*, 27(1), E7. DOI: 10.3171/2009.4.FOCUS0985

[84] Pycroft, L. et al. (2016). Brainjacking: implant security issues in invasive neuromodulation. *World Neurosurgery*, 92, 454--462. DOI: 10.1016/j.wneu.2016.05.010

[85] Landau, O., Puzis, R., & Nissim, N. (2020). Mind your mind: EEG-based brain-computer interfaces and their security in cyber space. *ACM Computing Surveys*, 53(1), Article 1. DOI: 10.1145/3372043

[86] Lozano, A. M. et al. (2019). Deep brain stimulation: current challenges and future directions. *Nature Reviews Neurology*, 15(3), 148--160. DOI: 10.1038/s41582-018-0128-2

[87] U.S. Food and Drug Administration. (2023). Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions. Section 524B of the FD&C Act, added by Section 3305 of FDORA (Consolidated Appropriations Act, 2023; Pub. L. 117-328).

**Algorithmic Psychosis Case Study**

[88] Wells, G., Horwitz, J., & Seetharaman, D. (2021). Facebook knows Instagram is toxic for teen girls, company documents show. *The Wall Street Journal*, September 14, 2021.

[89] Twenge, J. M., Haidt, J., Lozano, J., & Cummins, K. M. (2022). Specification curve analysis shows that social media use is linked to poor mental health, especially among girls. *Acta Psychologica*, 223, 103512. DOI: 10.1016/j.actpsy.2022.103512

[90] Kelleher, I., Connor, D., Clarke, M. C., Devlin, N., Harley, M., & Cannon, M. (2012). Prevalence of psychotic symptoms in childhood and adolescence: a systematic review and meta-analysis. *Psychological Medicine*, 42(9), 1857--1863. DOI: 10.1017/S0033291711002960

[91] Howes, O. D., & Kapur, S. (2009). The dopamine hypothesis of schizophrenia: version III --- the final common pathway. *Schizophrenia Bulletin*, 35(3), 549--562. DOI: 10.1093/schbul/sbp006

**Regulatory Context**

[92] Schroder, T., Sirbu, R., Park, S., Morley, J., Street, S., & Floridi, L. (2025). Cyber Risks to Next-Gen Brain-Computer Interfaces: Analysis and Recommendations. arXiv:2508.12571. https://arxiv.org/abs/2508.12571

**Neurorights and Governance**

[93] Chile. (2021). Constitutional Amendment to Article 19, No. 1 & Law 21.383 (Neuroprotection Law). First constitutional protection of neurorights.

[94] California. (2024). SB 1223: Neural Data as Sensitive Personal Information. Amends CCPA to include neural data; effective January 2025.

[95] U.S. Senate. (2024). MIND Act (S. 2925): Mental Privacy and Neural Data Standards. In committee consideration.

[96] UNESCO. (2025). Recommendation on the Ethics of Neurotechnology. 17-element framework for neurotechnology governance.

[97] Council of Europe. (2025). Strategic Action Plan on Neurotechnology. Human rights-based framework for 46 member states.

[98] European Union. (2024). Regulation (EU) 2024/1689 (AI Act). BCIs designated high-risk AI systems; phased implementation 2025-2027.

[99] GAO. (2025). Neurotechnology: Emerging Technologies and Policy Considerations. Report to Congressional Committees.

**SSVEP and BCI Attacks**

[100] Ming, Z. et al. (2023). SSVEP-based brain-computer interface with 60 Hz imperceptible visual stimuli. *Journal of Neural Engineering*, 20(2). DOI: 10.1088/1741-2552/acb5f4

[101] Bian, N. et al. (2022). Security of SSVEP-based brain-computer interfaces against adversarial attacks. *Journal of Neural Engineering*, 19(6). DOI: 10.1088/1741-2552/aca6ca

[102] Marblestone, A. H., Zamft, B. M., Maguire, Y. G., Shapiro, M. G., Cybulski, T. R., Glaser, J. I., ... & Bhatt, D. L. (2013). Physical principles for scalable neural recording. *Frontiers in Computational Neuroscience*, 7, 137. DOI: 10.3389/fncom.2013.00137

[103] Stevenson, I. H., & Kording, K. P. (2011). How advances in neural recording affect data analysis. *Nature Neuroscience*, 14(2), 139--142. DOI: 10.1038/nn.2731

**Market and Economic Analysis**

[104] Bloomberg. (2009). "Billy Bookcase Index." Introduced as purchasing power parity indicator across 50+ IKEA markets. See also: Qi, K. (2026). "The IKEA Paradigm: What a $79 Bookcase Tells Us About the Economy." Medium. https://medium.com/@qikevinl/the-ikea-paradigm-what-a-79-bookcase-tells-us-about-the-economy-1e43f4e3283e

[105] OpenPR. (2025). "Emotion Recognition Headband Market 2025." Market valued at $183M (2024), projected $627M by 2032 at 19.5% CAGR. https://www.openpr.com/news/3906859/

[106] PitchBook & NVCA. (2026). "Q4 2025 PitchBook-NVCA Venture Monitor." $339B total VC deal value; AI/ML captured 65.6%. https://pitchbook.com/news/reports/q4-2025-pitchbook-nvca-venture-monitor

[107] Cambridge Associates. (2025). "U.S. PE/VC Benchmark Commentary: Calendar Year 2024." VC index returned +6.2%. https://www.cambridgeassociates.com/insight/us-pe-vc-benchmark-commentary-calendar-year-2024/

[108] Preqin. (2025). "2025 Global Report: Venture Capital." VC AUM: $3.1T; AI >50% of deal value Q1-Q3 2025. https://www.preqin.com/about/press-release/venture-capital-aum-usd3-1tn

[109] CB Insights. (2026). "State of Venture 2025." $469B global venture funding, highest since 2022; AI = 48%. https://www.cbinsights.com/research/report/venture-trends-2025/

[110] Neurotechnology Substack. (2024). "2024 Neurotech Funding Snapshot." $2.3B in 2024; $1.4B in 2023; $662.6M in 2022. https://neurotechnology.substack.com/p/2024-funding-snapshot

[111] PS Market Research. (2025). "Automotive Cybersecurity Market Report." $5.91B (2025), projected $14.43B by 2030 at 19.54% CAGR. https://www.psmarketresearch.com/market-analysis/automotive-cybersecurity-market-report. See also: UN Regulation No. 155: mandatory automotive cybersecurity management systems, enforcement July 2024.

[112] Rogers, E. M. (1962). *Diffusion of Innovations*. Free Press of Glencoe. 5th edition (2003), Simon & Schuster. ISBN 978-0743222099.

[113] Moore, G. A. (1991). *Crossing the Chasm*. HarperBusiness. Revised edition (2014). ISBN 978-0062292988.

[114] Gartner. (2024). "How Neurological Enhancement Will Affect Your Team by 2034." https://www.gartner.com/en/articles/neurological-enhancement. Also: Gartner Hype Cycle for Emerging Technologies 2024: BCIs positioned at "more than 10 years" to Plateau of Productivity.

[115] Frost, A. J. & Prechter, R. R. (2005). *Elliott Wave Principle: Key to Market Behavior*. New Classics Library. ISBN 978-0932750754. Originally published 1978.

[116] Note: Academic critiques of Elliott Wave Theory include post-hoc rationalization concerns. The wave boundaries proposed in Section 13.5 are analytical estimates informed by historical parallels, not forecasts.

[117] HIMSS. (2024). "2024 HIMSS Healthcare Cybersecurity Survey." 273 respondents. 30% invest >7% of IT budget on cybersecurity; 55% plan increases. https://www.himss.org/sites/hde/files/media/file/2025/02/20/2024-himss-cybersecurity-survey.pdf

---

*Version 7.0 Working Draft -- Last updated 2026-02-21 -- Kevin Qi*

*Source of Truth: QIF-TRUTH.md*
