https://qinnovate.com/governance/rights/# QIF Whitepaper v8.0

## Securing Neural Interfaces: Architecture, Threat Taxonomy, Neural Impact Scoring, and Governance for Brain-Computer Interfaces

> *"The brain doesn't run on ones and zeros. Its security shouldn't either."*
> — Kevin Qi

**Version:** 8.0 (Working Draft)
**Date:** 2026-03-11
**Author:** Kevin Qi
**Predecessor:** QIF Whitepaper v6.3.0
**Status:** DRAFT
**Academic Preprint:** [DOI: 10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)

---

## Author's Note

This paper proposes a secure BCI architecture derived from security engineering and ethics.

It started with a question: what would threat modeling for the human mind look like? That question led me into the world of brain-computer interfaces — and quickly made clear that you cannot build for the brain the way you build for a screen. The technical architecture alone is not enough. To do this right from the design phase, I applied two decades of security instincts and went deep into the disciplines that should inform every decision at this layer: neuroethics, AI ethics, and the emerging fields of neurorights and neuroprivacy.

I believe it is vital for the adoption of BCIs — and in the best interest of every company building them — that we embed ethics and security by design. The last thing we should do in pursuit of cures for the sick and the unable is introduce vulnerabilities to an already vulnerable mind. It is our duty as engineers and architects to understand the full scope in which a clinical remedy may introduce more risk than reward, and to design systems that make that calculus transparent.

That is the mission behind this paper.

The concepts here span neuroscience, security architecture, ethics, law, and clinical medicine. Some are well-established; many are proposed and unvalidated. I have worked to distill them into a single coherent framework, and to be explicit about where the evidence is strong and where the work is still theoretical. Where claims are speculative or unverified, the text says so. Where I do not know the answer, the paper raises the question rather than fabricating a response.

— Kevin Qi

---

## Claims and Disclaimers

### What This Paper Claims

1. **BCI security is an under-addressed problem.** The threat surface of neural interfaces has not received the same architectural rigor as enterprise IT, mobile, or IoT security. The attack techniques cataloged in TARA are derived from published neuroscience, signal processing, and cybersecurity literature.
2. **Security and ethics are inseparable at this layer.** A BCI security architecture that ignores neuroethics will fail its patients. A neuroethics framework that ignores security engineering will remain aspirational. This paper attempts to bridge both.
3. **Designing from a blank slate is possible now, and will not be later.** The window to embed security and ethics into BCI architecture before deployment scale closes that window is finite and narrowing.

### What This Paper Does Not Claim

1. **QIF is not a standard.** It is a proposed framework. It has not been adopted by any standards body (IEEE, ISO, NIST, or otherwise), has not undergone independent peer review, and has not been validated in clinical deployment. All references to QIF components (TARA, NISS, NSP, Runemate, the Coherence Metric) should be read as proposals, not established specifications.
2. **NISS does not measure cognitive harm.** NISS scores physical signal-level disruption corresponding to specific attack techniques. It does not diagnose psychiatric conditions, predict clinical outcomes, or quantify "thought harm." DSM-5-TR category mappings are included for threat modeling purposes only — they are diagnostic category references, not diagnostic claims.
3. **TARA is a defensive catalog.** The threat taxonomy exists to inform defense architecture, not to enable attacks. Every technique is paired with governance constraints and defensive controls. Offensive use is explicitly out of scope.
4. **This paper does not read minds.** Current BCI technology cannot "read thoughts" in any general sense. Decoded outputs are selected from constrained vocabularies, require user cooperation, and depend on individually trained algorithms. Claims about BCI capabilities in this paper reflect published, peer-reviewed research and distinguish between current capabilities and projected future capabilities.
5. **AI-derived content is flagged.** Portions of this paper were drafted with AI assistance (Claude). All technical claims have been reviewed by the author. AI-generated citations were independently verified through Crossref, publisher pages, or institutional records. The preprint history includes a correction for 3 fabricated citations in v1.0 that were AI-generated and not caught before publication. Full AI disclosure is in Section 9.7.
6. **Engineering benchmarks are unverified.** Any quantitative claims about NSP compression ratios, power overhead, latency, or throughput are AI-derived estimates, not empirical measurements. They require independent engineering validation before informing design decisions.

### Epistemic Framework

This paper uses a five-level evidence classification:

| Level | Meaning | Example in This Paper |
|-------|---------|----------------------|
| **Verified** | Peer-reviewed, resolved DOI, reproduced | Published attack techniques, cited neuroscience |
| **Established** | Strong consensus, official documentation | NIST AI RMF, EU AI Act provisions, CVSS methodology |
| **Inferred** | Logical deduction from verified premises | Threat chain mappings, architectural implications |
| **Theoretical** | Author's proposed framework, unvalidated | QIF hourglass, NISS scoring, Coherence Metric (Cs), NSP, Runemate |
| **Unknown** | Insufficient evidence | Explicitly stated as open questions throughout |

Where a claim's classification is not obvious from context, it is flagged inline.

---

## The Proposal

Every transformative technology gets one chance to build its foundation right. The internet did not take that chance. TCP/IP shipped without authentication. HTTP shipped without encryption. DNS shipped without integrity verification. We spent the next four decades bolting on security after the fact — TLS, DNSSEC, OAuth, zero-trust architectures — each one a patch on a foundation that was never designed to be secure. The cost: trillions of dollars, billions of compromised records, and an entire industry dedicated to fixing what should have been built correctly from the start.

Brain-computer interfaces are at that same inflection point. The first cortical implants are in human skulls. The first commercial devices are shipping. And the security architecture is, once again, an afterthought. The difference this time is that the attack surface is not a credit card number or a social security record. It is the human nervous system. There are no rollbacks for neural tissue damage. There is no "change your password" for a compromised sensory cortex.

This is not a warning. It is a proposal.

### The Blank Slate

We are building from a blank slate — and that is the advantage. We have full knowledge of every security failure that preceded us. The goal is to design a BCI security architecture that introduces as little technical debt as possible. Every layer is intentional. Every protocol earns its place. Every abstraction exists because it solves a real problem, not because it was inherited from a system designed for screens, keyboards, and rectangular displays.

The internet's technical debt is well-documented: protocols that assumed trusted peers (BGP hijacking), address spaces that ran out (IPv4 exhaustion), authentication bolted onto an unauthenticated web (the entire OAuth/SAML/FIDO ecosystem). Each of these was a reasonable shortcut at the time. Each became a structural vulnerability at scale. The BCI architecture proposed in this paper makes no such shortcuts. Where the internet added security as middleware, this architecture embeds it at the kernel level. Where the mobile industry centralized control in app stores, this architecture gives patients direct access through a terminal. Where medical devices shipped firmware as proprietary black boxes, this architecture proposes open-source auditability from day one.

### The Vision

QIF proposes a BCI security architecture designed to stand the test of time — not for a product cycle, not for a regulatory window, but for the full span of a human life. Human life expectancy continues to rise as biomedical innovation accelerates. A person implanted at 30 may carry that device for 70 years. The architecture must outlast the company that built it, the protocol standard it launched with, and the threat landscape it was designed against. Second Sight ceased operations in 2020, leaving Argus II patients with unsupported hardware in their eyes. That cannot happen again.

The origin point is medical: restoring vision to the blind, motor function to the paralyzed, relief to those with neurological conditions that have no other treatment path. These are not enhancement use cases. They are people waiting for a technology that works and that they can trust. The security architecture exists to make that trust possible.

### The Direction

The starting point is the patient. Not the manufacturer, not the regulator, not the research institution. The patient — because they are the one whose nervous system is on the line, and because starting anywhere else creates the same power asymmetries that have defined every previous technology platform.

This is an equity decision. The people who need BCIs most urgently — those with severe motor impairment, blindness, locked-in syndrome — are also the most vulnerable to exploitation by closed systems they cannot inspect, modify, or leave. Building patient sovereignty into the architecture from the start is not a feature. It is a prerequisite for equitable access.

This does not mean ignoring manufacturers, regulators, or clinicians. It means designing the architecture so that patient control is the default. The patient can inspect every signal entering their nervous system. The patient can disconnect without asking a cloud service for permission. The patient can switch hardware without being locked into a vendor's ecosystem. These are architectural requirements, not aspirational goals.

### Building With Innovation, Not Against It

The goal is not to slow innovation down. BCI technology is moving fast, and it should. The goal is to build *with* that innovation by proposing the security and governance architecture now — while the slate is still blank — so that when these devices reach scale, the hard questions have already been raised at the forums that matter: IEEE working groups, FDA advisory panels, neuroethics conferences, disability rights organizations, and open standards bodies.

The window for this is finite. Once devices ship at scale with baked-in architectural decisions, changing those decisions becomes exponentially harder. The internet taught us this. The cost of retrofitting security onto a deployed system is orders of magnitude higher than designing it in from the start. We do not have to repeat that lesson.

### What This Paper Does

This paper does three things.

**First, it maps the full attack surface** of brain-computer interfaces — not hypothetically, but technically. 161 attack techniques across 7 domains, scored with a neural-specific severity system (NISS), cataloged in a dual-use registry (TARA) that bridges security and medicine. Every technique that can harm can also heal. The boundary between the two is consent, dosage, and oversight. The Neural Impact Chain traces each attack from physical mechanism through neural band to clinical outcome, mapped to DSM-5-TR diagnostic categories for threat modeling purposes.

**Second, it proposes the architecture.** An 11-band security model (the QIF Hourglass) spanning from quantum physics to social engineering. A post-quantum encrypted wire protocol (NSP). A rendering pipeline (Runemate) that eliminates the browser, the app store, and every unnecessary layer between patient and experience. A passwordless authentication system (PQKC + Biomarker MFA) built on cryptographic identity and biological uniqueness. A five-tier guardrail model distinguishing physics constraints from policy decisions. A neural operating system mapped to the Linux model that has proven itself across five decades. A patient terminal that gives direct, scriptable, auditable control — not through a prescribed interface, but through autodidactic navigation where each patient designs their own way of interacting with the system.

**Third, it raises the questions that society must answer** before these devices are in millions of heads. Who sets the amplitude ceiling for cortical stimulation — the manufacturer who profits, the regulator who lags, or the patient who bears the risk? At what point does a BCI assisting with motor recovery cross the line into autonomous control of the body? If a patient asks their AI to help them quit painkillers, then quit alcohol, then run faster than their body allows — where is the guardrail, and who installed it? A RACI matrix maps 30+ scenarios to six stakeholder categories. Neurorights are operationalized as access control flags. The Open Source Neural Atlas proposes hardware interoperability so patients are never again stranded by a company that quits.

### The Defense Paradox

There is a fundamental truth in security that this paper does not shy away from: **every defense you introduce creates a new attack surface.**

Add encryption, and key management becomes the target. Add authentication, and the auth mechanism becomes the vulnerability. Add a firewall, and the firewall's configuration is what the attacker probes. Add MFA, and the recovery flow is the bypass. This is not a flaw in security engineering — it is the nature of it. Every lock is also a thing that can be picked.

This paradox is inescapable, and anyone who tells you otherwise is selling something. The internet's history is a four-decade case study: SSL was introduced to protect HTTP, and then Heartbleed compromised the SSL implementation itself. Firewalls were introduced to segment networks, and then firewall misconfigurations became MITRE ATT&CK's initial access vector. Password managers were introduced to fix password reuse, and then LastPass was breached — exposing every password the user thought was safe.

This is security through obscurity — the belief that piling on more material solves the problem. It is how armor was built before metallurgy. Ancient and medieval armorers stacked more iron plates, added more padding, bolted on more bulk. The soldier was safer, but slower, heavier, and eventually immobilized by the weight of their own protection. Then we learned to mix iron with carbon and got steel — stronger than iron at a fraction of the weight. Not more material, but the *right* material, engineered at the atomic level. Then Stephanie Kwolek at DuPont spun a liquid crystalline polymer solution into aramid fibers and got Kevlar (1965) — five times stronger than steel by weight, flexible enough to wear as fabric. The progression was not "add more." It was "understand the problem deeper and solve it with precision."

And then we moved beyond carbon entirely. Kevlar is not steel refined further — it is a synthetic polymer, a fundamentally different material class that solved the same problem (stopping a projectile) through a completely different mechanism (energy absorption across woven aramid fibers instead of rigid deflection). The leap from steel to Kevlar was not incremental improvement. It was rethinking the problem from the molecular level up.

The same concept applies here. We are not trying to fabricate steel from iron ore — we are not trying to bolt better security onto architectures designed for screens and keyboards. We are proposing a metaphorical polymer: a fundamentally different material for a fundamentally different problem. AI can be that synthetic polymer — providing the guardrails that industry experts design, enforcing safety bounds with a precision and consistency that static rule sets cannot match, adapting to novel threat patterns in real time while maintaining the invariants that protect the patient.

But the biggest challenge is not building the polymer. It is ensuring the patient remains in full control and that **drift does not occur.**

**Configuration drift** — the slow, silent divergence of a running system from its intended state — is one of the most common failure modes in software. A parameter changes. A threshold adjusts. A default shifts during an update. Each change is small. Each change is reasonable. And over time, the system is no longer what it was designed to be. In enterprise IT, drift causes outages and compliance failures. In a neural device, drift could mean a stimulation parameter that was safe at implantation is no longer safe after eighteen months of incremental adjustments. At wide scale — millions of devices, each drifting independently — this is not a bug. It is a catastrophe.

The hardening measures must be absolute. The model is the **golden image** — a concept from OS hardening where a known-good system state is cryptographically signed, immutable, and used as the reference against which every running instance is continuously compared. Any deviation from the golden image is detected, flagged, and corrected or escalated.

QIF applies this at both the software and hardware layers:

| Layer | Golden Image Equivalent | Drift Detection |
|-------|------------------------|-----------------|
| **Hardware (Neurowall kernel)** | Tier 1-2 bounds (amplitude, rate, thermal) are firmware-signed at manufacture. Cannot be modified by software update, patient, or clinician. | Continuous self-check against signed bounds. Any discrepancy triggers hardware-level alert and safe-mode fallback. |
| **Software (NSP + Runemate)** | Cryptographically signed firmware images verified at boot and at runtime. Each update requires multi-party consent (patient + manufacturer signature). | Hash verification of running code against signed image. Drift = integrity violation = alert + rollback to last known-good state. |
| **Configuration (Tier 3-5 parameters)** | Patient's consented configuration is signed and timestamped at each consent event. Every parameter change is logged against the consent baseline. | Continuous comparison of active parameters against consented baseline. Unauthorized changes are blocked. Authorized changes are logged with full audit trail. |
| **Biomarker baseline** | Patient's neural signature calibrated at implantation and periodically recalibrated with clinical oversight. | Baseline drift is expected (aging, medication, neuroplasticity) — but recalibration requires clinical co-signature. Unilateral baseline shift without recalibration triggers soft lock. |

The golden image is not a backup. It is the definition of "correct." Every running state is measured against it. Drift is not tolerated — it is detected, and the system either corrects itself or stops and asks for human intervention. This is how you prevent the slow creep from "working as designed" to "working as drifted" that has caused every major infrastructure failure from Therac-25 to the Boeing 737 MAX MCAS.

But the paradox still applies to what remains. NSP introduces post-quantum encryption — and the key encapsulation mechanism (ML-KEM) is itself a new cryptographic primitive whose implementations will contain bugs. The Neurowall kernel enforces amplitude ceilings — and the bounds-checking logic is code, and code has defects. The biomarker MFA uses neural signatures for continuous authentication — and the baseline calibration process is a window during which the patient's biometric template could be captured.

Think of the stubborn eyelash — half fallen off, half poking at your eyeball. Your first instinct is to reach in with your fingers and pull it out. But your fingers are too blunt for the job. You push the lash deeper into the eye, and now you have two problems: the original irritant and the inflammation your fix just caused. The proper move is not more force. It is a different tool — a saline flush, a cotton swab, something designed for the precision the problem demands. Technique matters more than effort.

Security works the same way. The instinct is to throw another layer at the problem — another firewall rule, another authentication check, another middleware service. But each layer is a finger poking at the eye. The architecture proposed in this paper does not stack defenses for the sake of stacking them. It selects the minimum set of precise tools, each purpose-built for its layer, each doing one thing and doing it without creating the next vulnerability.

This paper names the remaining risks explicitly (see Section 6: Attack Surface Analysis, 161 techniques cataloged). The defense paradox does not invalidate the architecture. It disciplines it. If you cannot eliminate a layer, you minimize its privilege, audit its behavior, and design it so that its failure does not cascade into the layers below it. Defense in depth is not about stacking walls. It is about ensuring that when one wall falls — and it will — the next wall does not depend on the one that broke.

### Design Principles

These principles govern every architectural decision in QIF. Principle #4 is a direct consequence of the Defense Paradox — the fewer layers, the fewer places the paradox can bite.

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | **Zero technical debt by design** | Every protocol earns its place. No inherited assumptions from screen-based computing. No "we'll fix it later." |
| 2 | **Patient-first equity** | The most vulnerable users (severe motor impairment, blindness) are the primary design constraint, not an afterthought. |
| 3 | **Security at the kernel, not the middleware** | Authentication, encryption, and safety bounds are embedded in the architecture, not bolted on as services. |
| 4 | **Minimum viable layers** | Every layer between patient and experience is an attack surface. Fewer layers = fewer vulnerabilities. No browser. No app store. No middleman. |
| 5 | **Outlast the manufacturer** | Open-source, open-standard, hardware-interoperable. The architecture must survive corporate bankruptcy, pivots, and acquisitions. |
| 6 | **Consent is the design constraint** | AI is the tool, the patient steers. Subvocalization preserves agency. If you are not steering, you are cargo. |
| 7 | **Build with innovation, not against it** | The framework enables new capabilities within safety bounds. Guardrails protect without restricting legitimate therapeutic and research advancement. |
| 8 | **Raise the questions now** | Governance, ethics, and rights questions must be in front of standards bodies, regulators, and ethicists before devices reach scale. The cost of retrofitting policy is as high as retrofitting security. |
| 9 | **AI honesty, not AI obscurity** | AI systems integrated into the BCI stack must be honest about what they know and do not know. Hallucination — generating plausible but false output — is a known failure mode of large language models, not a design feature. A neural device that provides incorrect stimulation parameters "because the model was confident" is not a software bug. It is malpractice. The system must say "I don't know" when it does not know. Trust is built through verifiability, not through vigilance against unreliability. |

### AI Ethics: The Regulatory Landscape

If AI is the synthetic polymer providing guardrails for the BCI architecture, then AI itself must be governed. This is not a hypothetical — it is an active area of federal and international policy, and the frameworks already exist.

**United States:**
- **NIST AI Risk Management Framework (AI RMF 1.0)** — Released January 2023, with the Generative AI Profile (NIST AI 600-1) following in 2024. Voluntary but increasingly referenced in legislation as a compliance safe harbor. Covers governance, mapping, measuring, and managing AI risks. The framework's core principle: organizations must identify, assess, and mitigate risks throughout the AI lifecycle.
- **Executive Order: "Ensuring a National Policy Framework for AI"** — December 2025. Establishes eight guiding principles for federal AI policy: safety and security, innovation and competition, equity and civil rights, privacy and civil liberties, transparency, accountability, interoperability, and international leadership.

**International:**
- **UNESCO Recommendation on the Ethics of AI** — Adopted unanimously by all 194 member states in November 2021. The first global normative instrument on AI ethics. Covers 11 policy action areas including proportionality, safety, fairness, sustainability, privacy, human oversight, transparency, responsibility, and accountability.
- **UNESCO First Global Framework on Neurotechnology Ethics** — Adopted November 12, 2025. Directly addresses the governance of devices that read and write neural data. This is the closest existing international instrument to what QIF proposes at the technical level.
- **OECD AI Principles** — Adopted 2019, updated 2024. Endorsed by 46 countries. Five principles: inclusive growth, human-centered values, transparency, robustness, and accountability.
- **EU AI Act** — Entered into force August 2024, fully applicable August 2026. The world's first comprehensive AI law. Classifies AI systems by risk tier — high-risk systems (including medical devices and critical infrastructure) require mandatory risk management, data governance, transparency, and human oversight. Non-compliance: fines up to €35 million or 7% of global annual revenue. Neural interfaces that use AI for stimulation decisions would almost certainly be classified as high-risk under this framework.

**Why this matters for BCI architecture:**

These frameworks converge on the same principles QIF embeds at the technical level: transparency (the patient can inspect), human oversight (the patient steers), safety (the kernel enforces physics), accountability (the audit trail records everything), and fairness (equity as a design constraint, not an afterthought). The difference is that existing AI ethics frameworks are policy documents. QIF operationalizes them as access control flags, kernel-level bounds, capability tokens, and cryptographic consent gates. Policy says "AI should be transparent." QIF says "`runemate log --stream` shows every packet entering the nervous system."

The AI integrated into the BCI stack — whether for adaptive guardrails, content compilation, or therapeutic assistance — must comply with these frameworks. But compliance alone is insufficient. The architecture must make non-compliance technically impossible where safety is concerned (Tiers 1-2) and auditably detectable where governance is concerned (Tiers 3-5). AI ethics principles that exist only as policy can be ignored. AI ethics principles that are enforced by a kernel cannot.

> **Epistemic note:** QIF is a proposed framework, not an adopted standard. It has not been peer-reviewed, independently validated, or endorsed by any standards body, regulatory agency, or clinical institution. The architectural decisions described in this paper are proposals for discussion, not settled engineering. The design principles above are the author's positions — informed by two decades of security operations experience and ongoing neuroethics research — not consensus positions of any community or organization. This paper exists to start the conversation, not to end it.

---

## What Changed in v8.0

v6.3 established the threat model, scoring system, and wire protocol. v8.0 answers the question those tools left open: **who decides what, for whom, and under what authority?**

| v6.3 (What) | v8.0 (Who + How) |
|-------------|-----------------|
| QI equation measures integrity | Five-tier guardrail model defines who sets the thresholds |
| TARA catalogs 161 techniques | Governance RACI maps accountability for every scenario |
| NISS scores severity | Autonomy spectrum classifies when intervention is justified |
| NSP encrypts the wire | Passwordless auth (PQKC + biomarker MFA) defines identity |
| Runemate compresses content | Neural terminal gives patients direct control |
| Hourglass defines architecture | Neural OS maps the full stack to Linux |
| Falsifiability defines science | Governance questions define ethics |

New sections (12-18) address: patient sovereignty, the neural terminal, autonomy guardrails, passwordless security, the Neural OS, vision restoration, and the Open Source Neural Atlas.

---

## Complete Table of Contents

### Preamble (v8.0)

- [Author's Note](#authors-note) — Origin, mission, and epistemic commitment
- [Claims and Disclaimers](#claims-and-disclaimers) — What this paper does and does not claim; evidence classification
- [The Proposal](#the-proposal) — Why this paper exists
  - [The Blank Slate](#the-blank-slate) — Learning from the internet's mistakes, zero tech debt
  - [The Vision](#the-vision) — Architecture for a human lifetime, curing ailments as origin
  - [The Direction](#the-direction) — Patient-first equity
  - [Building With Innovation, Not Against It](#building-with-innovation-not-against-it) — Raise questions now for broader forums
  - [What This Paper Does](#what-this-paper-does) — Three deliverables: attack surface, architecture, governance questions
  - [The Defense Paradox](#the-defense-paradox) — Every defense creates new attack surface; minimize, don't stack
  - [Design Principles](#design-principles) — 9 principles governing every decision
  - [AI Ethics: The Regulatory Landscape](#ai-ethics-the-regulatory-landscape) — NIST AI RMF, UNESCO, OECD, EU AI Act, and why policy must become architecture

### Existing Sections (from v6.3, updated)

- [The Three Pillars](#the-three-pillars-of-qinnovate)
- [1. Abstract](#1-abstract)
- [2. Introduction](#2-introduction) — The Containment Principle, BBB as precedent
- [3. Background and Related Work](#3-background-and-related-work)
- [4. QIF Hourglass Model (v4.0)](#4-qif-hourglass-model-v40)
  - 4.1 3D Hourglass Visualization Standard
  - 4.2 The 11-Band Stack (7 Neural + I0 + 3 Synthetic)
  - 4.3 I0: The Bottleneck
  - 4.4 The Classical Ceiling
  - 4.5 Severity Stratification
  - 4.6 Frequency-Regime Security
- [5. The Unified QI Equation](#5-the-unified-qi-equation)
  - 5.1 QI(b,t) = e^{-S(b,t)}
  - 5.2 Classical Terms (phase coherence, transport entropy, amplitude stability, scale-frequency)
  - 5.3 Quantum Terms (indeterminacy, entanglement, tunneling)
  - 5.4 Spectral Decomposition via STFT
- [6. Attack Surface Analysis](#6-attack-surface-analysis)
  - 6.1 Five Cross-Domain Attack Coupling Mechanisms (A-E)
  - 6.2 Detection Boundaries (honest assessment)
  - 6.3 Unified Threat Taxonomy (161 techniques, 11 tactics, 7 domains)
  - 6.4 QIF Locus Taxonomy (BCI-native classification)
  - 6.5 NISS v1.1 — Neural Impact Scoring System
  - 6.6 Case Study: Algorithmic Psychosis Induction
  - 6.7 TARA — Therapeutic Atlas of Risks and Applications
    - Dual-use observation, mechanism-first architecture, regulatory context (FDORA/524B)
  - 6.8 Beyond DSM-5-TR: Sensory and Neurological Weighting (v8.0)
    - Olfactory, somatosensory, gustatory, vestibular disruption
    - Neurological disorders absent from DSM but present in medical literature (ICD-11, neurology)
    - Expanded NISS weighting for sensory modality attacks
  - 6.9 The Neuroplasticity Metric (NP) — Why Neural Attacks Compound (v8.0)
    - NP:S = the attack rewires the victim; no analogue in traditional cybersecurity
    - NP as discriminator between acute response vs longitudinal rehabilitation
    - Connection to NISS v2.0 Reversibility and Functional Impact weighting
- [7. Neural Sensory Protocol (NSP)](#7-neural-sensory-protocol-nsp)
  - 7.1 HNDL Threat, 7.2 Five-Layer Architecture, 7.3 Device Tiers
  - 7.4 STIX 2.1 Export, 7.5 qtara Python Package
  - 7.6 Project Runemate (compression offset)
- [8. Falsifiability](#8-falsifiability) — 5 testable predictions
- [9. Discussion](#9-discussion) — What QIF is and is not, limitations
- [10. Future Work](#10-future-work) — Validation priorities
- [11. References](#11-references) — 92 citations

### New Sections (v8.0)

- [12. The Neural Terminal](#12-the-neural-terminal)
  - 12.1 Why Not a Browser (attack surface analysis)
  - 12.2 Why Not an App Store (centralized control, forced updates, supply chain)
  - 12.3 The Terminal as Interface (parameter access, scriptability, auditability, offline)
  - 12.4 Autodidactic Navigation (patient-designed interaction paradigms)
- [13. Patient Self-Sovereignty](#13-patient-self-sovereignty)
  - 13.1 The Four Rights (repair, inspect, customize, disconnect)
  - 13.2 Subvocalization and Intent (AI as tool, not driver)
  - 13.3 The Steering Argument (consent as the design constraint)
  - 13.4 Protecting Creativity (agency, choosing, the muscle that atrophies)
- [14. Autonomy Guardrails](#14-autonomy-guardrails)
  - 14.1 The Autonomy Spectrum (SAE J3016 mapping to BCIs, Levels 0-5)
  - 14.2 The Escalation Problem (walk → quit painkillers → quit alcohol → run faster)
  - 14.3 Ghost in the Shell (kernel protects hardware, not software)
  - 14.4 The Five-Tier Guardrail Model
  - 14.5 Operationalized: The Addiction Scenario
  - 14.6 Motor vs. Cognitive Neurons (same architecture, different consent)
- [15. Passwordless Security Architecture](#15-passwordless-security-architecture)
  - 15.1 Why Passwords Fail for Neural Devices
  - 15.2 Factor 1: Post-Quantum Key Cryptography (ML-KEM-768, ML-DSA-65)
  - 15.3 Factor 2: Biomarker MFA (EEG signature, evoked potentials, coherence profile)
  - 15.4 Continuous Authentication (not a gate — a field)
  - 15.5 Capability-Based Access Control (patient, clinician, firmware sessions)
  - 15.6 Neurorights as ACL Flags (MP, CL, MI, PC, EA operationalized)
- [16. Neural OS Architecture](#16-neural-os-architecture)
  - 16.1 The Linux Mapping (Kernel=Neurowall, Drivers=NSP, Userspace=Runemate, Shell=Terminal, Perms=Neurorights)
  - 16.2 CLI Security Analysis (no new attack surface)
  - 16.3 Why Open Source (auditability, no lock-in, longevity, right to fork)
- [17. Vision Restoration Pipeline](#17-vision-restoration-pipeline)
  - 17.1 Runemate + NSP for Vision (HTML → Staves → NSP → Neurowall → V1)
  - 17.2 Multimodal Content Delivery (visual + auditory + haptic)
- [18. Governance](#18-governance)
  - 18.1 RACI Matrix for BCI Scenarios (30+ scenarios, 6 stakeholder categories)
  - 18.2 Neuroethics and Neurorights Mapping (5 rights → governance questions)
  - 18.3 Open Source Neural Atlas Proposal (interoperable hardware standard)
  - 18.4 Open Questions (30+ governance questions for society)

- [19. Research Validation: Field Evidence](#19-research-validation-field-evidence)
  - 19.1 NISS and the Standards Community (CVSS SIG invitation, deliberate restraint)
  - 19.2 Preprint and Publication Status (Zenodo DOI, citation fabrication transparency)

### Appendices (v8.0)

- [A. Visualization Index](#appendix-a-visualization-index)
- [B. Data Assets](#appendix-b-data-assets)
- [C. Companion Documents](#appendix-c-companion-documents)

---

## How Everything Connects

The whitepaper tells a single story. Here is how every component fits:

```
THE QIF STORY (v8.0)
═══════════════════

Problem:    BCIs are shipping without security architecture.
            The internet was built this way. We know how that went.

Framework:  QIF Hourglass (11 bands) — defines WHAT to protect
                │
                ├── QI Equation — MEASURES integrity per band
                │
                ├── 5 Attack Mechanisms (A-E) — HOW attacks propagate
                │
                ├── Locus Taxonomy (7 domains, 11 tactics) — CLASSIFIES threats
                │   └── 161 techniques cataloged
                │
                ├── NISS v1.1 — SCORES severity (neural-specific, not CVSS)
                │
                ├── TARA — BRIDGES security ↔ medicine (dual-use registry)
                │   ├── Security projection (attack technique, severity)
                │   ├── Clinical projection (therapeutic modality, FDA status)
                │   ├── Diagnostic projection (clinical observation use)
                │   └── Governance projection (consent, limits, regulation)
                │
                ├── Case Study: Algorithmic Psychosis — DEMONSTRATES the chain
                │   └── Neural Impact Chain: mechanism → band → clinical outcome
                │       └── DSM-5-TR mapping (for threat modeling, not diagnosis)
                │
                └── Falsifiability — 5 conditions that would weaken/invalidate

Protocol:   NSP (5 layers) — ENFORCES protection on the wire
                │
                ├── L1: EM Environment Monitoring
                ├── L2: Signal Physics (QI Score)
                ├── L3: Post-Quantum Key Exchange (ML-KEM)
                ├── L4: Post-Quantum Authentication (ML-DSA)
                └── L5: Payload Encryption (AES-256-GCM)

Application: Runemate — MAKES PQ security practical
                │
                ├── Forge (gateway compiler, Rust std)
                ├── Scribe (on-device interpreter, Rust no_std)
                ├── Staves (bytecode format, 67.8% compression)
                └── TARA safety validation at compile time

Interface:  Neural Terminal — GIVES patients control        ← NEW in v8.0
                │
                ├── No browser (eliminates web attack surface)
                ├── No app store (eliminates middleman)
                ├── Autodidactic navigation (patient designs their own UX)
                ├── Right to repair, inspect, customize, disconnect
                └── Subvocalization input (AI as tool, patient steers)

Security:   Passwordless Auth — IDENTIFIES without passwords  ← NEW in v8.0
                │
                ├── PQKC (hardware-bound keypair, ML-KEM + ML-DSA)
                ├── Biomarker MFA (continuous, passive, unique)
                ├── Capability-based access (not root, not sudo)
                └── Neurorights as ACL flags (MP, CL, MI, PC, EA)

Guardrails: Five-Tier Model — BOUNDS autonomy               ← NEW in v8.0
                │
                ├── Tier 1: Hardware safety (physics, immutable)
                ├── Tier 2: Biological safety (clinical, immutable)
                ├── Tier 3: Therapeutic bounds (configurable)
                ├── Tier 4: Behavioral scope (consent-gated)
                └── Tier 5: Enhancement limits (policy, evolving)

Architecture: Neural OS — THE FULL STACK                     ← NEW in v8.0
                │
                ├── Neurowall = Kernel (Tier 1-2 enforcement)
                ├── NSP = Drivers (encrypted wire protocol)
                ├── Runemate = Userspace (content compilation)
                ├── Terminal = Shell (patient CLI)
                ├── Neurorights = Permissions (ACL flags)
                └── Open Source Neural Atlas = interoperable hardware (proposed)

Governance: RACI Matrix — WHO DECIDES                        ← NEW in v8.0
                │
                ├── 30+ scenarios mapped to 6 stakeholder categories
                ├── Neurorights tied to specific governance questions
                ├── Unresolved tensions named (autonomy vs safety, privacy vs research...)
                └── The Steering Argument: if you're not driving, you're cargo
```

### Cross-References to Existing QIF Documents

| Document | What It Contains | Whitepaper Section |
|----------|-----------------|-------------------|
| `QIF-WHITEPAPER.md` | v6.3 full text (Sections 1-11, 92 refs) | Sections 1-11 (carried forward) |
| `RUNEMATE.md` | Full Runemate spec (2960 lines, 19 sections) | Section 7.6, Section 16, Section 17 |
| `NSP-PROTOCOL-SPEC.md` | Full NSP specification | Section 7 |
| `GUARDRAILS.md` | 8 neuroethics guardrails | Section 14 (expanded) |
| `QIF-NEUROETHICS.md` | 12 open ethical questions | Section 18.4 (expanded) |
| `qif-sec-guardrails.md` | Physics-derived 4-layer security | Section 14.4 (integrated) |
| `QIF-GOVERNANCE-QUESTIONS.md` | 30+ governance questions, RACI | Section 18 |
| `governance/INFORMED_CONSENT_FRAMEWORK.md` | Consent protocols, pediatric | Section 14.5 |
| `governance/NEUROSECURITY_GOVERNANCE.md` | Unified governance framework | Section 18 |
| `governance/TRANSPARENCY.md` | Human-AI collaboration audit | Appendix C |
| `governance/MATURITY.md` | Validation status and roadmap | Section 10 |
| `governance/NEUROETHICS_LEGISLATION_SURVEY.md` | Regulatory landscape | Section 18.4 |

### Cross-References to Site Pages and Visualizations

| Page Route | What It Shows | Whitepaper Section |
|-----------|--------------|-------------------|
| `/` (index) | QIF overview, hourglass hero | Section 4 |
| `/vision/` | BCI Vision toggle, full framework overview | All sections |
| `/guardrails/` | 8 guardrails, interactive | Section 14 |
| `/guardrails/nsp/` | NSP protocol details | Section 7 |
| `/guardrails/runemate/` | Runemate + terminal + Neural OS + security arch | Sections 12-17 |
| `/threat-models/` | TARA overview | Section 6.7 |
| `/threat-models/tara/` | Full TARA technique browser | Section 6.3-6.7 |
| `/threat-models/analysis/` | Neural Impact Chain analysis | Section 6.6 |
| `/threat-models/scoring/` | NISS scoring details | Section 6.5 |
| `/TARA/[id]` | Individual technique pages (161) | Section 6.4 |
| `/whitepaper/` | Whitepaper page | This document |
| `/research/` | Research hub | Appendix C |

### Cross-References to Data Assets

| Data File | Contents | Whitepaper Section |
|-----------|---------|-------------------|
| `shared/qtara/tara_data.json` | 161 techniques, full registry | Section 6.3-6.7 |
| `shared/dsm5_niss_mappings.json` | DSM-5-TR → NISS mappings | Section 6.6 |
| `shared/niss_severity_data.json` | NISS scoring data | Section 6.5 |
| `src/data/qif-timeline.json` | Framework milestone timeline | All sections |
| `src/data/automation-registry.json` | CI/CD and automation inventory | Appendix B |
| `shared/research-registry.json` | Research citation registry | Section 11 |
| `shared/qif-guardrails.json` | Guardrails data (source of truth) | Section 14 |

---

## Appendix A: Visualization Index

Visualizations that exist on the site and can be referenced/embedded in the whitepaper:

| Visualization | Location | Shows |
|--------------|----------|-------|
| 3D Hourglass | `/` hero section, `/vision/` | 11-band architecture, band widths, I0 bottleneck |
| Brain Atlas | `/vision/` BCI section | 8 neural bands mapped to brain anatomy, technique counts per region |
| TARA Technique Browser | `/threat-models/tara/` | Searchable/filterable 161-technique registry |
| Neural Impact Chain | `/threat-models/analysis/` | DAG showing attack propagation through bands |
| NISS Scoring | `/threat-models/scoring/` | Severity scoring breakdown |
| Neuroethics Timeline | `/vision/` | Key neuroethics milestones |
| PQ Overhead Chart | `/guardrails/runemate/` | Classical vs PQ+Staves bandwidth |
| Autonomy Spectrum | `/guardrails/runemate/#autonomy` | 5-level lane-keep mapping |
| Five-Tier Guardrails | `/guardrails/runemate/#autonomy` | Hardware→Policy tier table |
| Neural OS Stack | `/guardrails/runemate/#neural-os` | Linux mapping visualization |
| Security Auth Flow | `/guardrails/runemate/#security-arch` | PQKC + Biomarker MFA diagram |
| Biomarker Table | `/guardrails/runemate/#security-arch` | 4 biomarker types for MFA |
| Capability Examples | `/guardrails/runemate/#security-arch` | Patient/Clinician/Firmware sessions |

## Appendix B: Data Assets

| Asset | Format | Records | Location |
|-------|--------|---------|----------|
| TARA Registry | JSON | 161 techniques | `shared/qtara/tara_data.json` |
| DSM-5-TR Mappings | JSON | 45 diagnoses mapped | `shared/dsm5_niss_mappings.json` |
| NISS Scores | JSON | 109 severity records | `shared/niss_severity_data.json` |
| Research Registry | JSON | 100+ sources | `shared/research-registry.json` |
| Guardrails | JSON | 8 guardrails | `shared/qif-guardrails.json` |
| QIF Timeline | JSON | 50+ milestones | `src/data/qif-timeline.json` |
| BCI Devices | JSON | 12+ devices profiled | `src/data/bci-devices.json` (if exists) |
| Automation Registry | JSON | 20+ automations | `src/data/automation-registry.json` |

## Appendix C: Companion Documents

| Document | Lines | Purpose |
|----------|-------|---------|
| `qif-framework/RUNEMATE.md` | 2960 | Full Runemate specification |
| `qif-framework/NSP-PROTOCOL-SPEC.md` | — | Full NSP protocol spec |
| `qif-framework/GUARDRAILS.md` | 200 | 8 neuroethics → neurosecurity guardrails |
| `qif-framework/QIF-NEUROETHICS.md` | 564 | 12 open ethical questions |
| `qif-framework/QIF-GOVERNANCE-QUESTIONS.md` | 631 | 30+ governance questions, RACI matrix |
| `qif-framework/qif-sec-guardrails.md` | 425 | Physics-derived security architecture |
| `qif-framework/QIF-DERIVATION-LOG.md` | — | Decision and derivation journal |
| `qif-framework/QIF-FIELD-JOURNAL.md` | — | Personal/experiential observations |
| `qif-framework/QIF-RESEARCH-SOURCES.md` | — | Living research citation catalog |
| `governance/INFORMED_CONSENT_FRAMEWORK.md` | 446 | Consent protocols (incl. pediatric) |
| `governance/NEUROSECURITY_GOVERNANCE.md` | — | Unified governance framework |
| `governance/TRANSPARENCY.md` | 275 | Human-AI collaboration audit trail |
| `governance/MATURITY.md` | 165 | Validation status and roadmap |
| `governance/NEUROETHICS_LEGISLATION_SURVEY.md` | — | Global regulatory landscape |
| `governance/POST_DEPLOYMENT_ETHICS.md` | — | Post-deployment monitoring |
| `governance/ACCESSIBILITY.md` | — | Inclusive design requirements |

---

## Table of Contents

- [12. The Neural Terminal](#12-the-neural-terminal)
  - [12.1 Why Not a Browser](#121-why-not-a-browser)
  - [12.2 Why Not an App Store](#122-why-not-an-app-store)
  - [12.3 The Terminal as Interface](#123-the-terminal-as-interface)
  - [12.4 Autodidactic Navigation](#124-autodidactic-navigation)
- [13. Patient Self-Sovereignty](#13-patient-self-sovereignty)
  - [13.1 The Four Rights](#131-the-four-rights)
  - [13.2 Subvocalization and Intent](#132-subvocalization-and-intent)
  - [13.3 The Steering Argument](#133-the-steering-argument)
  - [13.4 Protecting Creativity](#134-protecting-creativity)
- [14. Autonomy Guardrails](#14-autonomy-guardrails)
  - [14.1 The Autonomy Spectrum](#141-the-autonomy-spectrum)
  - [14.2 The Escalation Problem](#142-the-escalation-problem)
  - [14.3 Ghost in the Shell](#143-ghost-in-the-shell)
  - [14.4 The Five-Tier Guardrail Model](#144-the-five-tier-guardrail-model)
  - [14.5 Operationalized: The Addiction Scenario](#145-operationalized-the-addiction-scenario)
  - [14.6 Motor vs. Cognitive Neurons](#146-motor-vs-cognitive-neurons)
- [15. Passwordless Security Architecture](#15-passwordless-security-architecture)
  - [15.1 Why Passwords Fail for Neural Devices](#151-why-passwords-fail-for-neural-devices)
  - [15.2 Factor 1: Post-Quantum Key Cryptography](#152-factor-1-post-quantum-key-cryptography)
  - [15.3 Factor 2: Biomarker MFA](#153-factor-2-biomarker-mfa)
  - [15.4 Continuous Authentication](#154-continuous-authentication)
  - [15.5 Capability-Based Access Control](#155-capability-based-access-control)
  - [15.6 Neurorights as ACL Flags](#156-neurorights-as-acl-flags)
- [16. Neural OS Architecture](#16-neural-os-architecture)
  - [16.1 The Linux Mapping](#161-the-linux-mapping)
  - [16.2 CLI Security Analysis](#162-cli-security-analysis)
  - [16.3 Why Open Source](#163-why-open-source)
- [17. Vision Restoration Pipeline](#17-vision-restoration-pipeline)
  - [17.1 Runemate + NSP for Vision](#171-runemate--nsp-for-vision)
  - [17.2 Multimodal Content Delivery](#172-multimodal-content-delivery)

---

## 12. The Neural Terminal

### 12.1 Why Not a Browser

Web browsers are rendering engines built for screens. They parse HTML into a Document Object Model (DOM), execute JavaScript in a sandboxed runtime, apply CSS stylesheets through a cascade algorithm, composite visual layers, and rasterize the result onto a pixel grid. This pipeline — which evolved from Tim Berners-Lee's original WorldWideWeb (1990) through Mosaic, Netscape, and the modern Chromium/WebKit duopoly — assumes a rectangular display with fixed pixel density, a pointing device, and a keyboard.

None of these assumptions hold for a cortical visual prosthesis.

A cortical implant drives an electrode array on the surface of the primary visual cortex (V1). The "pixels" are phosphenes — perceived spots of light induced by electrical stimulation of cortical tissue. Their arrangement is not a rectangular grid but a retinotopic map that varies between individuals based on cortical folding patterns. The "rendering engine" cannot be a browser because there is no DOM to parse, no CSS to cascade, no pixel grid to rasterize onto. The content must be compiled directly into electrode-addressable stimulation patterns — a fundamentally different pipeline.

Beyond architectural mismatch, browsers carry an attack surface that is unnecessary and dangerous for neural devices:

| Attack Surface | Browser Risk | Neural Consequence |
|---------------|-------------|-------------------|
| **JavaScript engine** (V8/SpiderMonkey) | Memory corruption, type confusion, JIT spray | Arbitrary code execution on a device connected to neural tissue |
| **DOM parsing** | XSS, DOM clobbering, mutation XSS | Injected content could manipulate stimulation patterns |
| **Extension model** | Malicious extensions, permission escalation | Third-party code with access to neural data streams |
| **Network stack** | MITM, certificate spoofing, DNS poisoning | Compromised content delivered directly to the brain |
| **Compositor** | Screen capture, overlay attacks | Irrelevant — no screen exists |
| **Cookie/storage** | Tracking, fingerprinting, session hijacking | Neural usage patterns as surveillance data |

Each layer of the browser stack represents a class of vulnerabilities accumulated over three decades of web development. These vulnerabilities exist because browsers must execute arbitrary code from arbitrary sources — a requirement that is antithetical to the security needs of an implanted medical device.

Runemate eliminates the browser entirely. Content is compiled from a declarative, non-Turing-complete DSL (Staves) into compact bytecode, validated against TARA safety bounds at compile time, encrypted via NSP, and delivered directly to the on-device interpreter (Scribe). There is no arbitrary code execution. There is no third-party extension model. There is no DOM.

### 12.2 Why Not an App Store

App stores introduce three categories of risk that are unacceptable for neural devices:

**Centralized control.** A patient's perceptual experience would be subject to a platform's content policies, review timelines, and commercial decisions. If the app store operator decides to remove a perceptual application, the patient loses a component of their sensory experience. This is qualitatively different from losing access to a mobile app — it is the digital equivalent of confiscating a prosthetic limb.

**Forced updates.** App stores routinely push updates that users cannot decline. For a neural device, an untested update to a stimulation pattern could alter a patient's visual field, auditory processing, or haptic sensation without their informed consent. The patient must have the ability to inspect, approve, and roll back every change to the software that drives their sensory experience.

**Additional attack surface.** The app store itself is a target. Supply chain attacks — where malicious code is injected into a legitimate application during the distribution pipeline — have compromised npm, PyPI, and the Chrome Web Store. An app store for neural content adds a distribution layer that does not need to exist. If the content is compiled locally or on a trusted gateway, and delivered via an authenticated protocol (NSP), the distribution problem is solved without introducing a third-party intermediary.

### 12.3 The Terminal as Interface

The terminal is the proposed primary interface for neural devices. It provides:

1. **Direct parameter access.** Stimulation parameters (contrast, brightness, refresh rate, spatial resolution, electrode mapping) are exposed as named configuration values, not hidden behind a graphical settings menu designed for a display the patient may not have.

2. **Scriptability.** Patients can automate perceptual adjustments, create macros for common tasks, and build personal workflows. A patient who prefers spatial audio cues for navigation can script that behavior once and invoke it with a single command.

3. **Auditability.** Every packet entering the nervous system is logged and inspectable. `runemate log --stream` provides real-time visibility into what content is being delivered and what stimulation patterns are being generated — the neural equivalent of `tcpdump`.

4. **Offline operation.** `runemate --offline` ensures the device functions without a network connection, without a cloud service, and without phoning home. The terminal makes this verifiable — the patient can confirm that no outbound connections are active.

5. **Troubleshooting.** When something goes wrong — a rendering artifact, a calibration drift, an unexpected stimulation pattern — the patient has the tools to investigate. They are not dependent on a manufacturer's support queue to diagnose a problem with their own sensory system.

### 12.4 Autodidactic Navigation

Traditional interfaces impose a navigation paradigm: menus, scroll, tap, swipe. These paradigms were designed for fingers on glass. They do not translate to a cortical interface where input may arrive via motor cortex BCI, subvocalization, or eye tracking.

The terminal provides primitives — commands, pipes, scripts — and lets the patient compose their own navigation model. One patient might prefer spatial audio landmarks. Another might use haptic pulses as navigation anchors. A third might develop a completely novel interaction pattern that no UX designer anticipated.

This is not a design limitation. It is a design principle. The terminal does not force someone new to the system to learn a prescribed way of navigating. Instead, it adapts — autodidactically — to how the user thinks and moves. The user teaches the system, not the other way around.

The same philosophy made Linux the foundation of every server, every supercomputer, and every Android phone: give people the tools, and they build what they need.

---

## 13. Patient Self-Sovereignty

### 13.1 The Four Rights

When a device IS the patient's sensory system, the conventional user-vendor relationship is inadequate. The patient is not a "user" in the consumer technology sense — they are a person whose perception depends on the correct, continuous, and trustworthy operation of an implanted system. This relationship demands four operational rights:

**Right to repair.** When a cortical implant is the patient's visual system, they cannot wait for a manufacturer's scheduled update to fix a rendering artifact in their field of vision. A terminal lets them adjust stimulation parameters, recalibrate electrode mappings, and verify that firmware updates have not altered their perceptual baseline.

**Right to inspect.** Every packet entering the patient's nervous system should be auditable. The patient must be able to examine what content is being delivered, what patterns are being generated, and what safety bounds are active. Opacity is not acceptable for a device that directly interfaces with neural tissue.

**Right to customize.** Sighted users choose dark mode, font sizes, and color schemes. A patient with a cortical prosthesis should be able to adjust contrast curves, phosphene brightness, temporal refresh rates, and spatial resolution — not through a settings menu designed by someone who can see, but through direct parameter control that reflects the patient's subjective perceptual experience.

**Right to disconnect.** The device must function without a network connection, without a cloud service, and without phoning home. An implanted medical device that requires continuous internet connectivity to operate is a device that can be remotely disabled — by a network outage, a server decommission, or a corporate bankruptcy. The terminal makes disconnected operation verifiable.

### 13.2 Subvocalization and Intent

In a neural OS, the patient controls AI through subvocalization — thinking commands rather than typing them. Motor cortex BCI captures intended speech or motor commands before they reach the muscles, enabling silent, private interaction with the system.

The AI is the tool. It processes, suggests, retrieves, compiles, renders. But the decision to act, the consent to a thought becoming an action, the creative impulse that initiates a query or dismisses a suggestion — that is the human. That is what the terminal architecture protects.

Without this boundary, AI does not augment human capability. It replaces it. The patient becomes a passenger in their own perceptual system — receiving whatever the algorithm decides to deliver, with no mechanism to inspect, reject, or redirect.

The distinction is operational:

- **A tool:** "Show me what's on this webpage." Patient initiates. AI compiles. Runemate delivers. Every interaction begins with patient intent. Every delivery requires patient consent.
- **A feed:** Content streams continuously, selected by an algorithm, with no patient-initiated gate. The user receives. The user does not choose.

The terminal ensures the first model. The absence of a terminal enables the second.

### 13.3 The Steering Argument

If we do not have free will through consent and agency, then who is driving the car if we are not steering?

This is not a philosophical abstraction. It is a design constraint. A neural interface that delivers content without patient-initiated consent is a system where the patient is cargo, not the driver. The difference between a tool and a cage is whether the person holding it chose to pick it up.

Neural interfaces must be steering wheels, not conveyor belts. The terminal is the steering column — the mechanical linkage between the patient's intent and the system's behavior. Remove it, and the patient is along for the ride.

### 13.4 Protecting Creativity

Creativity requires agency — the ability to combine ideas in unexpected ways, to follow a thought that no algorithm would predict, to say "no, show me something else." If the AI drives and the patient rides, creativity does not diminish — it atrophies. Not because AI cannot generate, but because the human loses the practice of choosing. And a capacity that is not exercised degrades.

This is particularly acute for neural interfaces because the input channel (motor cortex, subvocalization) is also a neural pathway. If the AI is both reading the patient's intent and generating the patient's experience, the boundary between "what I thought" and "what the system suggested" becomes ambiguous. The terminal provides a clean separation: the patient composes commands, the system executes them. Intent flows in one direction. Content flows in the other. The boundaries are explicit.

Neurorights (MP, CL, MI, PC, EA) are the formal expression of this principle. But the terminal is what makes them enforceable. Without a CLI, neurorights are policy. With a CLI, they are access control.

---

## 14. Autonomy Guardrails

### 14.1 The Autonomy Spectrum

Assistive autonomy exists on a spectrum. The automotive industry has standardized this spectrum (SAE J3016), and the mapping to neural interfaces is instructive:

| Level | Automotive | Neural Equivalent | Control Model |
|-------|-----------|-------------------|---------------|
| 0 | No automation | Raw BCI, no correction | Patient 100% |
| 1 | Driver assistance | Gait correction for nerve damage | Patient steers, system nudges |
| 2 | Partial automation | Active motor pattern stabilization | System steers, patient can override |
| 3 | Conditional automation | AI manages routine motor function | System steers, patient supervises |
| 4 | High automation | AI manages cognitive support functions | System operates within bounded domain |
| 5 | Full automation | AI modifies thought/behavior patterns autonomously | System drives, patient is cargo |

Levels 1-2 are clearly therapeutic. Level 5 is clearly a violation of cognitive liberty. The design challenge — and the ethical battleground — is Levels 3-4: systems that operate autonomously within a bounded domain, with the patient in a supervisory role.

Lane-keep assist is Level 1. The system nudges; the driver can override instantly. Lane-keep control is Level 2. The system actively steers; the driver must exert force to override. For a nerve-damage patient whose BCI corrects their gait, Level 2 is appropriate — the system compensates for damaged motor pathways, and the patient retains the ability to override (e.g., to stop, turn, sit down).

The question is: what happens when the same architecture is applied to cognitive function?

### 14.2 The Escalation Problem

Consider a patient with spinal nerve damage who receives a BCI for motor restoration. The following escalation is medically plausible:

**Step 1: Walk assistance.** Motor cortex (M1) stimulation corrects gait instability. This is Level 2 autonomy — the system compensates for damaged nerve pathways. The consent is specific: "help me walk in a straight line." The outcome is measurable: gait symmetry, step consistency, fall prevention. The neural territory is motor cortex.

**Step 2: Quit prescribed painkillers.** The patient was prescribed opioids after the accident that caused their nerve damage. They want to stop. They ask the BCI to help manage withdrawal. This request crosses from motor cortex to limbic/prefrontal circuits — from muscle control to emotion regulation. The neuron is still a neuron, but the territory changed. The system that corrected a gait is now being asked to modulate a craving.

**Step 3: Quit alcohol.** The patient developed an alcohol dependency during recovery. They ask the BCI to help. This is still therapeutic, but the system is now modifying behavioral patterns, not motor patterns. The BCI has become a governor for decision-making — a fundamentally different function than the walking assistance it was originally consented for.

**Step 4: Run faster than the body allows.** The patient, now mobile and sober, asks the BCI to enhance their running performance by overriding fatigue signals in motor cortex. This crosses from therapeutic to enhancement, and from safe to dangerous — the stimulation pattern that overrides fatigue can also exceed the musculoskeletal system's structural limits. The tendons, joints, and bones have not been upgraded alongside the neural interface.

Each step is individually reasonable. A clinician could justify each one. Together, they are a ramp from assistive tool to autonomous controller. And the patient initiated every step.

### 14.3 Ghost in the Shell

The title references Masamune Shirow's 1989 manga (and Mamoru Oshii's 1995 film), which posed the question directly: if a human consciousness (the "ghost") runs on a cybernetic body (the "shell"), and the shell has rules the ghost cannot override, is the ghost free?

This is not science fiction when applied to neural interfaces. If the kernel — Neurowall — has immutable safety rules that the patient cannot override, then the patient's consciousness operates within constraints set by the system's designers. The manufacturer, the regulator, the clinician — some combination of these entities decided what the patient is and is not allowed to do with their own neural device.

The resolution proposed here is: **the kernel protects the hardware, not the software.**

A seatbelt does not control where you drive. It prevents the physics of a crash from killing you. The immutable kernel layer works the same way:

- **Amplitude ceiling.** The electrical current delivered to neural tissue cannot exceed the tissue damage threshold. This is a physics constraint — exceeding it destroys neurons. The limit is not a policy choice; it is a material property of cortical tissue.
- **Rate limiting.** Stimulation pulses cannot fire faster than the neural refractory period allows. This is a biological constraint — neurons that have not recovered from the previous pulse cannot respond to the next one. Exceeding this rate does not produce stronger stimulation; it produces tissue damage.
- **Thermal bounds.** The electrode array cannot heat beyond the safe operating temperature of brain tissue (~41°C). This is a thermodynamic constraint — exceeding it causes protein denaturation and cell death.

These are not cognitive restrictions. They do not say "you cannot think that." They say "the signal cannot physically exceed what your tissue can survive." The ghost is free. The shell has material limits.

But the escalation scenario in Section 14.2 breaks this clean separation. When the patient asks to quit alcohol, the relevant "tissue" is the reward circuit. The "safe amplitude" for modifying dopaminergic pathways in the ventral tegmental area (VTA) or nucleus accumbens (NAc) is not a settled question — it is an active area of neuroscience research with conflicting results across studies. And "run faster than body allows" puts the motor cortex in conflict with the musculoskeletal system, which has its own damage thresholds that the neural kernel cannot measure.

### 14.4 The Five-Tier Guardrail Model

The proposed resolution is a five-tier guardrail model that separates immutable physical safety from configurable therapeutic and policy decisions:

| Tier | Domain | Immutable? | Authority |
|------|--------|-----------|-----------|
| **1. Hardware safety** | Amplitude, rate, thermal limits | Yes — kernel (Neurowall) | Physics and biology. Not negotiable. Cannot be overridden by patient, clinician, or manufacturer. |
| **2. Biological safety** | Tissue damage thresholds, seizure thresholds, inflammation markers | Yes — kernel (Neurowall) | Clinical evidence, periodically updated. Changes require clinician signature AND patient co-signature. |
| **3. Therapeutic bounds** | Stimulation dosage, session duration, target neural region, success criteria, exit conditions | No — configurable | Clinician sets defaults within evidence-based ranges. Patient can adjust within the clinician-defined range. |
| **4. Behavioral scope** | Which neural domains the BCI is authorized to influence (motor, limbic, prefrontal, sensory) | No — consent-gated | Patient decides. Each domain requires separate, explicit informed consent. Consent is revocable. |
| **5. Enhancement limits** | Applications beyond therapeutic need (performance enhancement, cognitive augmentation, sensory expansion) | No — policy layer | Patient + clinician + regulatory framework. No consensus exists. This tier will evolve with law, ethics, and technology. |

The kernel (Neurowall) enforces Tiers 1-2. These limits cannot be overridden by the patient, the clinician, the manufacturer, or a software update. They are derived from the physical and biological properties of neural tissue.

Tiers 3-5 live in the capability system, where consent is explicit, domain-scoped, time-bounded, and revocable. The patient can expand their BCI's scope — but only through a deliberate, auditable consent process, never through scope creep.

### 14.5 Operationalized: The Addiction Scenario

Applying the five-tier model to the escalation scenario in Section 14.2:

The patient's walk-assist BCI was consented under Tier 4 for motor cortex (M1) only. When they say "help me quit painkillers":

1. **Domain recognition.** The system identifies that the request targets limbic/prefrontal circuits — outside the consented motor scope. The capability `modify.limbic` is not in the patient's current session.

2. **Consent gate.** The system presents a Tier 4 consent request. The patient must explicitly authorize the new domain. The clinician must co-sign, establishing evidence-based therapeutic bounds (Tier 3): stimulation parameters, session duration, success criteria, and exit conditions.

3. **Separate capability grant.** The new consent creates a separate, time-bounded capability: `modify.limbic [duration: 90d] [bounds: clinician-defined] [exit: criteria-met OR patient-revoked]`. This capability is independent of the motor cortex consent and can be revoked without affecting walking assistance.

4. **Audit trail.** Every consent decision, parameter change, and stimulation event is logged. The patient's future self, their clinician, their advocate, or a regulatory auditor can review the complete history.

When the patient then says "help me run faster than my body allows":

5. **Kernel enforcement (Tier 1).** The requested stimulation pattern would drive motor cortex activation beyond the musculoskeletal system's structural limits. The Neurowall kernel rejects the command — not because a policy prohibits enhancement, but because the physics would damage the patient's body. The amplitude, rate, or duration exceeds tissue-safe thresholds.

6. **Tier 5 flag.** Separately, the system flags this as an enhancement request (Tier 5), noting that no regulatory framework currently governs BCI-mediated performance enhancement. The patient is informed; the decision is logged; the request is denied on Tier 1 grounds regardless of Tier 5 status.

The patient's cognitive liberty is preserved — they can ask anything. The system's response is determined by the tier hierarchy: physics first, biology second, therapeutics third, consent fourth, policy fifth.

### 14.6 Motor vs. Cognitive Neurons

The escalation problem raises a fundamental question: if we allow assistive control over motor neurons (gait correction), how do we prevent the same architecture from being applied to cognitive neurons (thought modification)?

The honest answer is: we cannot prevent it architecturally. A neuron is a neuron. The Hodgkin-Huxley model (1952) [73] describes the same ion channel dynamics in motor cortex and prefrontal cortex. An electrode that can stimulate M1 to correct a gait can, with different parameters and different placement, stimulate dorsolateral prefrontal cortex (DLPFC) to modify executive function.

The constraint must be organizational, not physical:

- **Tier 4 (Behavioral Scope)** requires separate consent for each neural domain. Motor consent does not grant limbic access. The patient cannot accidentally authorize cognitive modification by consenting to motor assistance.
- **Tier 3 (Therapeutic Bounds)** ensures that even within a consented domain, the stimulation is bounded by clinical evidence. A clinician cannot authorize parameters outside the evidence-based range.
- **Tier 2 (Biological Safety)** ensures that regardless of consent or clinical authorization, the stimulation cannot exceed tissue-safe thresholds. This protects the patient from errors, not from malice.

The distinction between motor and cognitive neurons is not architectural — it is procedural. The five-tier model enforces that distinction through consent gates, not through hardware limitations. This is an honest acknowledgment that the technology capable of restoring movement is the same technology capable of modifying thought. The guardrails must be as robust as the capability they constrain.

> **Epistemic note:** The five-tier guardrail model is a proposed framework within QIF. The specific thresholds for Tiers 1-3 are subjects of active neuroscience research and clinical debate — particularly for limbic and prefrontal stimulation, where safe parameters are not established. No clinical validation of this model has been performed. The operational neurorights (Tier 5) reference Yuste et al. (2017) and Ienca & Andorno (2017), whose proposals are under active academic and legal debate. This model is a starting point for the conversation, not a settled standard.

---

## 15. Passwordless Security Architecture

### 15.1 Why Passwords Fail for Neural Devices

Passwords assume a user who can type, a device with a keyboard, and a transmission channel that can be secured. None of these assumptions hold for implanted neural devices:

- The patient may lack the motor function to type (the device may have been implanted because of motor impairment).
- The device has no keyboard and no screen for password entry.
- A password transmitted wirelessly to an implanted chip is a password that can be intercepted, replayed, or brute-forced.
- Password reset requires a recovery mechanism. For an implanted device, "account lockout" could mean losing sensory function.

The security architecture must be passwordless by design — not as a convenience feature, but as a medical necessity.

### 15.2 Factor 1: Post-Quantum Key Cryptography

The NSP handshake establishes a session using ML-KEM-768 (NIST FIPS 203, finalized August 2024) for key encapsulation and ML-DSA-65 (NIST FIPS 204, finalized August 2024) for digital signatures. The device's identity is a hardware-bound keypair provisioned at implantation and stored in a secure enclave on the implanted processor.

```
Patient Device ──── ML-KEM-768 encapsulation ────► Gateway
     │                                                │
     └──── ML-DSA-65 signature ──────────────────────►│
           (hardware-bound keypair,                   │
            provisioned at implantation)              │
                                                      │
     ◄──── Encrypted session key ─────────────────────┘
           (AES-256-GCM-SIV, key-committed)
```

There is no password to remember, no token to carry, and no credential to phish. The device proves its identity through a cryptographic challenge-response that requires possession of the hardware key — which cannot be extracted from the secure enclave without physical access to the implanted chip.

Post-quantum algorithms are specified because the device's operational lifetime (10-20 years for current-generation implants) exceeds the projected timeline for cryptographically relevant quantum computers. A device implanted today must be secure against threats that emerge in 2036-2046.

### 15.3 Factor 2: Biomarker MFA

The second authentication factor is the patient themselves. Neural biomarkers — unique patterns in electrophysiological signals — are as individual as fingerprints and as difficult to forge.

| Biomarker | Signal Characteristics | Stability | Spoofing Resistance |
|-----------|----------------------|-----------|-------------------|
| **Resting-state EEG signature** | Alpha rhythm (8-13 Hz) spectral profile, individually unique peak frequency and amplitude distribution | Stable across sessions over months-years (Näpflin et al., 2007) | Requires real-time generation of patient-specific spectral patterns |
| **Evoked potentials** | P300 latency/amplitude, N170 face-selective response, SSVEP frequency response | Stimulus-locked, consistent within individual | Requires knowledge of patient's specific response to specific stimuli |
| **Motor cortex signature** | Movement-related cortical potential (MRCP) patterns during intended movement | Consistent within individual, adapts with training | Behavioral biometric, continuous, difficult to replicate passively |
| **Cross-channel coherence profile** | Phase synchrony patterns across electrode channels at rest | Structural, determined by individual cortical connectivity | Tied to physical connectome, cannot be replicated without patient's brain |

This is not a login ceremony. It is continuous, passive verification that the person using the device is the person it was calibrated for. The biomarker check runs continuously in the background, consuming minimal additional processing because the neural signals are already being read for the device's primary function.

If biomarker drift exceeds the patient's baseline envelope (as established during calibration), the device can:
- **Soft lock:** Restrict access to sensitive operations (parameter changes, firmware updates, data export) while maintaining basic perceptual function.
- **Alert:** Notify the patient and/or clinician of the discrepancy.
- **Audit:** Log the event for later review.

The device does not shut down. A biomarker anomaly might indicate a medical event (seizure, medication change, fatigue), not a security threat. The response is proportional: restrict sensitive operations, maintain basic function, alert and log.

### 15.4 Continuous Authentication

Traditional authentication is a gate: prove your identity once, then operate freely until the session expires. For a neural device, this model is insufficient. The device should continuously verify that the person using it is the person it was calibrated for — not through repeated login prompts, but through passive biometric monitoring that is already occurring as part of the device's normal operation.

The continuous authentication model:

1. **Session establishment.** PQKC handshake + initial biomarker verification. This is the "login" — but it happens automatically when the device powers on and detects the patient's neural signature.
2. **Continuous verification.** Biomarker coherence is checked against the patient's baseline envelope at regular intervals (proposed: every 30 seconds). No patient action required.
3. **Graceful degradation.** If verification fails, the device does not shut down. It restricts capabilities proportional to the confidence deficit. Basic perceptual function continues.
4. **Re-verification.** If the patient returns to baseline (e.g., after waking from anesthesia, recovering from a seizure), full capabilities are automatically restored. No manual re-authentication needed.

### 15.5 Capability-Based Access Control

The terminal does not grant root. It uses capability-based security (Dennis & Van Horn, 1966), where each session, script, and command has explicitly declared capabilities:

**Patient session** — full perceptual control, no firmware access:
```
capabilities: [perceive.visual, perceive.auditory, perceive.haptic,
               config.contrast, config.refresh, config.spatial,
               log.read, device.status]
```

**Clinician session** — calibration access, audit trail:
```
capabilities: [calibrate.electrodes, calibrate.thresholds,
               log.read, log.export, device.diagnostics]
```

**Firmware update** — one-time, cryptographically signed:
```
capabilities: [firmware.apply]
requires: [device.owner.approval, manufacturer.signature]
```

No command can exceed its declared capabilities. Capability escalation requires multi-party cryptographic consent — not a password prompt, not a sudo command, but a signed authorization from the required parties (patient, clinician, manufacturer, depending on the operation).

### 15.6 Neurorights as ACL Flags

The five proposed neurorights (Yuste et al., 2017; Ienca & Andorno, 2017) map to access control flags enforced at the protocol level:

| Neuroright | ACL Flag Namespace | Operational Definition |
|-----------|-------------------|----------------------|
| Mental Privacy (MP) | `privacy.*` | Controls whether neural data can be read, recorded, exported, or shared. Default: deny all except device-local processing. |
| Cognitive Liberty (CL) | `liberty.*` | Controls whether stimulation patterns can be externally imposed without patient initiation. Default: deny — all stimulation requires patient intent. |
| Mental Integrity (MI) | `integrity.*` | Controls whether device parameters can be modified without explicit patient consent. Default: deny — parameter changes require patient confirmation. |
| Psychological Continuity (PC) | `continuity.*` | Controls whether changes can alter the patient's baseline perceptual experience beyond a defined threshold. Default: warn and require consent for changes exceeding 10% of baseline. |
| Equal Access (EA) | `access.*` | Controls whether content or capabilities can be restricted by a content provider, manufacturer, or third party. Default: deny — the patient determines what content they access. |

These are not philosophical concepts in this architecture. They are ACL flags enforced at the Neurowall kernel level. A content provider that attempts to modify stimulation parameters without the `integrity.write` capability receives a permission denial — not a policy discussion.

> **Epistemic note:** Neurorights as a legal and philosophical concept are under active academic debate. The operational definitions above are QIF-specific mappings for threat modeling and access control purposes. They are not settled legal standards, and the specific ACL implementation has not been validated against real clinical or regulatory requirements. The threshold values (e.g., "10% of baseline" for psychological continuity) are proposed defaults, not evidence-based thresholds.

---

## 16. Neural OS Architecture

### 16.1 The Linux Mapping

Runemate is the userspace layer of a proposed neural operating system. The architecture maps directly to the Unix/Linux model that has proven itself across five decades of systems engineering:

| Linux Component | Neural OS Component | Function |
|----------------|--------------------|-----------|
| **Kernel** | **Neurowall** | Zero-trust enforcement at I0 (hardware-biology boundary). Amplitude bounds, rate limiting, thermal monitoring, DoS detection, integrity verification. Cannot be bypassed by userspace. |
| **Device drivers** | **NSP** | Encrypted communication layer. ML-KEM key exchange, ML-DSA authentication, AES-256-GCM-SIV session encryption, frame-level integrity verification. Handles the wire protocol between gateway and implant. |
| **Userspace** | **Runemate** | Content compilation, rendering pipeline, multimodal delivery (visual, auditory, haptic). The Forge compiles on the gateway; the Scribe interprets on-device. |
| **Shell (bash/zsh)** | **Terminal** | Patient CLI. Inspect device state, configure parameters, script automation, troubleshoot issues, compose custom navigation patterns. |
| **File permissions** | **Neurorights** | MP, CL, MI, PC, EA as capability-based ACL flags on every operation. |
| **Package manager** | **Staves registry** (proposed) | Verified, signed content packages. Each package declares its required capabilities. |
| **System logs** | **`runemate log`** | Auditable record of every packet delivered to the nervous system, every consent decision, every parameter change. |
| **Process isolation** | **Capability tokens** | Each session, command, and script runs within its declared capability set. No command can escalate beyond its token. |

### 16.2 CLI Security Analysis

A reasonable objection: does adding a CLI to a neural device introduce new attack surface?

No. The CLI does not expand the attack surface beyond what already exists.

Runemate already executes bytecode — the Scribe interpreter processes arbitrary compiled content on-device. The execution surface already exists. A CLI is a structured, capability-gated interface to that same execution engine. It is a *subset* of what the interpreter can do, constrained by explicit capability tokens.

The Rust `no_std` runtime eliminates the class of vulnerabilities that make traditional shells dangerous:

- **No buffer overflows.** Rust's borrow checker enforces memory safety at compile time. There is no `strcpy`, no `sprintf`, no unchecked array index.
- **No heap corruption.** The `no_std` runtime uses a fixed-size arena allocator with bounds checking. There is no `malloc`/`free` cycle to abuse.
- **No shell injection.** There is no `exec()`, no `system()`, no string interpolation into command invocations. Commands are parsed through the same recursive descent parser that handles Staves bytecode — same security properties, same input validation, same bounds checking.
- **No arbitrary code execution.** The Staves DSL is non-Turing-complete. The CLI parses a fixed command grammar. Neither can execute arbitrary instructions.

A capability-based shell is strictly less powerful than the bytecode interpreter it sits on top of. It can do only what the capability token authorizes, which is always a subset of what the interpreter can process. The CLI adds visibility and control without adding capability.

### 16.3 Why Open Source

The same reasons Linux won:

1. **Auditability.** Anyone can read the code that runs inside a patient's skull. No black boxes. A patient, their advocate, or an independent security researcher can verify every line of code in the stack.

2. **No vendor lock-in.** A patient's perceptual system should not be tied to a single manufacturer's proprietary stack. If the manufacturer goes bankrupt, pivots, or makes decisions the patient disagrees with, the patient's sensory system continues to function.

3. **Community security.** More eyes on the code means more vulnerabilities found before they reach patients. The Linux kernel receives security patches from thousands of contributors. A neural device's kernel should benefit from the same model.

4. **Longevity.** Implants outlast companies. The average corporate lifespan of an S&P 500 company is 21 years (Innosight, 2021). A neural implant may operate for 20-30 years. Open-source code outlasts both corporations and their proprietary formats.

5. **Right to fork.** If the maintainers make decisions a patient disagrees with, the patient (or their advocate) can fork the stack and run their own version. This is not theoretical — it is the mechanism by which patients retain ultimate control over their own neural device.

---

## 17. Vision Restoration Pipeline

### 17.1 Runemate + NSP for Vision

The pipeline for restoring vision to a patient with a cortical visual prosthesis:

```
Internet Content          The Forge (Gateway)           NSP Wire              The Scribe (Implant)
─────────────────    ──────────────────────────    ───────────────    ─────────────────────────────
                     ┌─────────────────────────┐
  HTML/media    ──►  │ 1. Parse semantic content│
                     │ 2. Extract visual intent │
                     │ 3. Compile to Staves     │
                     │ 4. TARA safety check     │──► REJECT if unsafe
                     │ 5. Compress (67.8%)      │
                     │ 6. NSP encrypt (PQ)      │
                     └────────────┬────────────┘
                                  │
                          Encrypted Staves
                           bytecode (341 B
                           avg per frame)
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │ Neurowall inspection   │──► REJECT if bounds exceeded
                     │ (amplitude, rate, DoS) │
                     └────────────┬───────────┘
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │ 7. Decrypt + verify    │
                     │ 8. Decode bytecode     │
                     │ 9. Retinotopic map     │──► V1 electrode coordinates
                     │10. Stimulate cortex    │
                     └────────────────────────┘
                                  │
                                  ▼
                         Patient perceives
                         visual content
```

The Forge compiler on the gateway converts internet content (HTML, images, video) into semantic visual intent — not pixel data, but structural content: "heading, paragraph, image with these edges, link." This intent is compiled into Staves bytecode, validated against TARA safety bounds (ensuring no stimulation pattern exceeds tissue-safe thresholds), compressed (67.8% average reduction in v1.0 benchmarks), and encrypted via NSP for transmission.

On-device, the Scribe interpreter decrypts the bytecode, applies a retinotopic coordinate transform (mapping visual content positions to V1 electrode locations based on the patient's individual cortical geometry), and generates stimulation patterns that the patient perceives as visual content.

The same pipeline handles auditory content (tonotopic mapping to primary auditory cortex, A1) and haptic content (somatotopic mapping to primary somatosensory cortex, S1). A single Staves file can contain all three modalities, synchronized to the same timestamp.

### 17.2 Multimodal Content Delivery

This means a blind patient can browse a website, watch a video, read a meme, listen to music, or build with AI — the same content sighted users access, compiled into a format their visual cortex can interpret. No browser required. No app store. No middleman. Just a compiler, a protocol, and a terminal.

The patient sees what they choose to see, hears what they choose to hear, and feels what they choose to feel. The choice is theirs. The terminal is how they exercise it.

> **Epistemic note:** Cortical visual prostheses are an active area of research (Second Sight Orion, Gennaris/Monash Vision Group, CORTIVIS/Miguel Hernandez University). Current devices produce low-resolution phosphene patterns (tens to hundreds of electrodes), not the high-fidelity perception described in the pipeline above. The pipeline is a proposed architecture — the retinotopic coordinate transforms, stimulation patterns, and perceptual quality are subjects of ongoing research. The compression ratio (67.8%) is from the v1.0 Forge benchmark on text-based content; visual content compression has not been benchmarked. Clinical efficacy of the described pipeline is unknown and requires independent validation.

---

## 18. Governance

### 18.1 RACI Matrix

See `QIF-GOVERNANCE-QUESTIONS.md` Part II for the complete RACI matrix covering 30+ scenarios across:
- Hardware and Safety (amplitude ceilings, seizure thresholds, recalls)
- Therapeutic Operations (stimulation bounds, domain expansion, patient scripts)
- Software and Firmware (routine updates, security patches, OS choice)
- Data and Privacy (export, research sharing, law enforcement, post-mortem)
- Autonomy and Enhancement (off-label expansion, cognitive enhancement, AI suggestions)
- Emergency and Edge Cases (cyber attack, manufacturer bankruptcy, incapacitation)

Six stakeholder categories: **Patient**, **Clinician**, **Manufacturer**, **Regulator**, **Open Standard (QIF)**, **AI System**.

### 18.2 Neuroethics and Neurorights Mapping

Every governance question maps to one or more of the five proposed neurorights:

| Neuroright | Governance Questions |
|-----------|---------------------|
| Mental Privacy (MP) | Data export, source code escrow, law enforcement access, telemetry consent |
| Cognitive Liberty (CL) | Domain access authorization, root access, patient vs clinician authority |
| Mental Integrity (MI) | Amplitude ceilings, therapeutic vs enhancement, escalation prevention |
| Psychological Continuity (PC) | Device as identity, firmware updates, support commitment, evolving capabilities |
| Equal Access (EA) | Interoperability, open vs proprietary, Neural Atlas, funding models |

These map directly to the ACL flags defined in Section 15.6 and the guardrails defined in `GUARDRAILS.md`.

### 18.3 Open Source Neural Atlas

A proposed open hardware specification for neural interfaces enabling:
1. Hardware interchangeability (electrode arrays, processing units, communication modules)
2. Software portability (OS choice independent of hardware)
3. Data portability (calibration data, configurations, content libraries)
4. Manufacturer independence (no vendor lock-in)

**Why it matters now:** Second Sight's 2020 closure left Argus II patients with unsupported hardware in their eyes. Open standards prevent this. TCP/IP took 9 years from proposal to adoption — the discussion must precede the technology.

**The hybrid path:** Open standard (QIF + NSP + Staves) + certified implementations + source code escrow + formal certification body + AI-assisted support. See `QIF-GOVERNANCE-QUESTIONS.md` Part V for full evaluation.

### 18.4 Open Questions

QIF raises 30+ governance questions that society must answer. They are documented in `QIF-GOVERNANCE-QUESTIONS.md` and `QIF-NEUROETHICS.md`. Key unresolved tensions:

1. **Autonomy vs. Safety** — Patient's right to modify vs. risk of self-harm
2. **Privacy vs. Research** — Neural data privacy vs. advancing neuroscience
3. **Innovation vs. Standardization** — Open standards vs. constraining innovation
4. **Individual vs. Collective** — One patient's experiment vs. field reputation
5. **Present vs. Future Consent** — Consenting to capabilities that don't exist yet
6. **Access vs. Security** — More patients = more targets = more risk

These are not QIF's questions to answer. They are society's. QIF provides the technical framework that makes the answers enforceable.

---

## 6.8 Beyond DSM-5-TR: Sensory and Neurological Weighting

The current NISS scoring maps attack outcomes to DSM-5-TR diagnostic categories for threat modeling purposes. This mapping is useful but incomplete. DSM-5-TR is a psychiatric classification system. It was not designed to capture the full spectrum of neurological disruption that a BCI attack could produce.

Consider what is missing:

**Sensory modality disruption.** A BCI attack that corrupts olfactory processing — causing phantosmia (phantom smells), anosmia (loss of smell), or parosmia (distorted smell) — has no primary DSM-5-TR diagnostic category. The same is true for gustatory hallucinations, vestibular disruption (vertigo, spatial disorientation, loss of balance), and somatosensory attacks (phantom pain, numbness, proprioceptive confusion). These are clinically documented neurological conditions with established medical literature, ICD-11 codes, and known neural pathway correlates. They are not psychiatric disorders. DSM-5-TR does not cover them because it is not intended to.

But a BCI that interfaces with sensory cortex — as vision restoration, cochlear implants, and somatosensory feedback systems already do — creates attack surfaces at each of these modalities. If an attacker can inject signals into primary somatosensory cortex (S1), the result is not a psychiatric condition. It is a neurological one: phantom sensation, proprioceptive disruption, or neuropathic pain. The clinical literature on these outcomes exists in neurology, not psychiatry.

**Neurological disorders absent from DSM.** Conditions like tinnitus, central pain syndrome, cortical blindness, prosopagnosia (face blindness), spatial neglect, and movement disorders (dystonia, tremor, ataxia) are well-characterized in neurology and have known neural substrates. A BCI attack targeting the relevant circuits could induce or exacerbate any of them. NISS must be able to score these outcomes with the same rigor as the DSM-5-TR mapped conditions.

**v8.0 expansion.** NISS v2.0 will extend the clinical outcome mapping beyond DSM-5-TR to include:

| Source | Coverage | What It Adds |
|--------|----------|-------------|
| **ICD-11 Chapter 8** (Diseases of the nervous system) | Neurological disorders with known neural substrates | Tinnitus, neuropathic pain, vestibular disorders, movement disorders, sensory processing disorders |
| **ICD-11 Chapter 22** (Symptoms and signs involving the nervous system) | Symptom-level outcomes | Anosmia, phantosmia, paresthesia, proprioceptive dysfunction, spatial disorientation |
| **Published neurology literature** | Mechanism-level evidence | Cortical stimulation studies documenting sensory disruption as a known side effect of therapeutic BCI use |

Each sensory modality will receive a weighting factor in NISS v2.0 reflecting five dimensions:

| Factor | Symbol | Range | Description |
|--------|--------|-------|-------------|
| **Reversibility** | R | 0.0–1.0 | 0 = fully reversible on signal removal, 1 = permanent neurological damage |
| **Functional Impact** | FI | 0.0–1.0 | Context-dependent daily functioning impairment. Anosmia is disabling for a chef; less so for others. Vestibular failure is life-threatening for anyone. |
| **Pathway Specificity** | PS | 0.0–1.0 | How precisely the modality can be targeted. Higher specificity = higher weaponization risk. Olfactory bulb stimulation is specific; diffuse cortical stimulation is not. |
| **Clinical Evidence** | CE | 0.0–1.0 | 0 = theoretical, 0.5 = reported in DBS/cortical stimulation studies, 1.0 = documented in BCI clinical trials |
| **Modality Criticality** | MC | 0.0–1.0 | How critical the modality is to patient safety. Vestibular/proprioceptive disruption causes falls. Olfactory disruption does not. |

The extended NISS v2.0 vector appends these factors to the existing scoring:

```
NISS:2.0/BI:H/CR:H/RE:M/SC:L/DSM:F32.x/ICD:AB32/R:0.7/FI:0.8/PS:0.6/CE:0.5/MC:0.9
```

**Severity scale for non-DSM neurological outcomes:**

| Score | Severity | Example |
|-------|----------|---------|
| 9.0–10.0 | Critical | Cortical blindness, complete vestibular failure, central pain syndrome |
| 7.0–8.9 | High | Persistent tinnitus, chronic neuropathic pain, dystonia, proprioceptive loss |
| 4.0–6.9 | Medium | Phantosmia, paresthesia, mild tremor, hyperacusis |
| 1.0–3.9 | Low | Transient phosphenes, temporary ageusia, mild spatial disorientation |
| 0.1–0.9 | Informational | Silicon-only effects, no neurological impact |

**What is not yet mapped (research gaps):**

| Domain | Gap | Why It Matters |
|--------|-----|---------------|
| Autonomic | Heart rate, blood pressure, thermoregulation | Hypothalamic and brainstem BCI targets |
| Neuroendocrine | Hormonal cascade disruption (cortisol, oxytocin, melatonin) | HPA axis attacks via limbic stimulation |
| Circadian | Sleep architecture disruption | Suprachiasmatic nucleus stimulation |
| Immunological | Neuroimmune interactions | Vagus nerve stimulation effects |
| Developmental | Long-term neuroplasticity effects of chronic stimulation | Pediatric BCI deployment |

These gaps are acknowledged, not deferred. They represent the frontier of where NISS must expand as the clinical evidence base grows and as BCI devices target deeper brain structures.

This is not scope creep. It is scope correction. A scoring system for neural impact that only measures psychiatric outcomes is like a vulnerability scanner that only checks web applications — it misses the network, the firmware, and the physical layer. The brain is not just a mind. It is also a body interface. NISS must score both.

*Note: All ICD-11 and neurological disorder mappings are for threat modeling purposes. NISS produces severity scores corresponding to clinical outcome categories, not clinical diagnoses. The distinction between "this attack technique correlates with outcomes in the tinnitus category" and "this attack causes tinnitus" is maintained throughout.*

---

## 6.9 The Neuroplasticity Metric (NP) — Why Neural Attacks Compound

Traditional cybersecurity scoring assumes attacks are discrete events. A SQL injection either succeeds or fails. A buffer overflow either executes or does not. The damage is bounded by the moment of exploitation.

Neural attacks break this assumption. The brain is a learning system. It rewires itself in response to sustained input. An attack that delivers malicious stimulation patterns over time does not just cause momentary disruption — it causes the brain to *adapt* to the malicious pattern, creating lasting neural pathway changes that persist after the attack ends. The attack literally rewires the victim.

NISS v1.1 captures this through the Neuroplasticity metric (NP), one of six scoring dimensions:

| NISS Metric | What It Measures | Analogue in Traditional Security |
|-------------|------------------|----------------------------------|
| BI (Biological Impact) | Tissue damage severity | Physical destruction (hardware) |
| CR (Cognitive Reconnaissance) | Unauthorized neural read access | Data exfiltration |
| CD (Cognitive Disruption) | Unauthorized neural write access | Data manipulation |
| CV (Consent Violation) | Neural data consent breach | Privacy violation |
| RV (Reversibility) | Can the damage be undone? | Recovery time |
| **NP (Neuroplasticity)** | **Does the attack rewire the brain?** | **No analogue** |

NP values (expanded from 3 to 4 levels in v1.1.1):

| Value | Score | Meaning |
|-------|-------|---------|
| N (None) | 0.0 | No lasting neural pathway changes |
| T (Temporary) | 3.3 | Temporary plasticity changes that resolve over days to weeks |
| P (Partial) | 6.7 | Partial structural changes; some pathway reorganization, recovery possible with intervention |
| S (Structural) | 10.0 | Permanent or long-lasting neural pathway reorganization |

The original 3-level scale (N/T/S) collapsed meaningfully different outcomes. The jump from T(5) to S(10) treated recoverable structural changes the same as permanent rewiring. The new P (Partial) level captures the clinical middle ground: chronic low-level neurofeedback drift, partial cortical map reorganization from sustained stimulation — scenarios where rehabilitation is possible but not guaranteed.

Recalculating all 161 TARA techniques against the 4-level scale shifted 26 scores. Two techniques (motor hijacking, OTA firmware exploitation) dropped from high to medium severity — the finer NP granularity revealed their plasticity impact was partial, not structural. Final severity distribution: 19 high, 37 medium, 52 low, 1 none.

**NP weight is 1.0** — equal to Biological Impact and Reversibility — because structural neuroplasticity represents a category of harm that no other metric captures: the attack persists in the victim's biology after the device is removed.

### Why NP Has No Traditional Analogue

A firewall breach does not make future breaches easier by physically restructuring the target network. A neural attack with NP:S does exactly that. The brain adapts to the malicious pattern through Hebbian learning ("neurons that fire together wire together"), making the attack's effects self-reinforcing. Examples:

- **Maladaptive neurofeedback** (QIF-T0107): False feedback trains the brain to maintain pathological states. The patient's own neuroplasticity is weaponized against them.
- **Neural nonce replay**: Persistent attack patterns survive system resets by exploiting learned neural pathways. The brain becomes the persistence mechanism.
- **Chronic stimulation attacks**: Prolonged malicious stimulation reshapes cortical maps, causing the brain to reorganize around the attack pattern.

For these techniques, "turn it off" is not sufficient remediation. The damage persists after the device is removed because the damage is encoded in the biology, not the technology.

### NP in NISS v2.0

In the proposed NISS v2.0 extension (Section 6.8), NP feeds directly into two of the five new weighting factors:
- **Reversibility (R):** NP:S implies R approaches 1.0 (irreversible)
- **Functional Impact (FI):** NP:S scales with exposure duration — longer exposure means deeper rewiring

NP is also the primary discriminator between attacks that require *acute* response (stop the stimulation) versus attacks that require *longitudinal* rehabilitation (retrain the brain). This distinction is critical for clinical threat modeling, where the treatment plan depends on whether the damage is in the device or in the patient.

*Note: NP is a proposed metric within an unvalidated scoring system. The claim that specific attacks cause structural neuroplasticity is grounded in the neuroscience literature on maladaptive plasticity (Pascual-Leone et al. 2005, Merzenich et al. 2014) but has not been validated in the specific context of BCI attack scenarios. The mapping from attack technique to NP score is the author's assessment, not an empirically calibrated measurement.*

---

## 19. Research Validation: Field Evidence

This framework was not built in isolation from real systems. During the initial research pass that led to QIF, the author discovered a previously undisclosed vulnerability in a widely deployed, open-source data transport protocol used by nearly all BCI research platforms. The protocol operates bidirectionally — it both reads from and writes to the endpoint — and the vulnerability exists at the endpoint layer, where no authentication, encryption, or integrity verification is enforced. Any device on the local network can inject arbitrary data streams indistinguishable from legitimate neural signals.

The author performed responsible disclosure to the protocol's maintainers. The maintainers acknowledged the finding and characterized the lack of security as "by design" — the protocol was built for laboratory convenience, not adversarial environments. The disclosure resulted in maintainer discussions about developing a secure variant of the protocol. The protocol's name is withheld here as the underlying architecture remains unchanged in production deployments.

This single finding validates the core thesis of this paper: the most widely used BCI infrastructure was never designed with security in mind, and the transition from laboratory to clinical deployment does not magically add the security properties that were never there. The vulnerability is not exotic. It is the kind of basic endpoint exposure that would fail a first-year penetration test in enterprise IT. That it persists in a protocol handling neural data underscores how far behind the BCI ecosystem is on security fundamentals.

### 19.1 NISS and the Standards Community

The Neural Impact Scoring System (NISS) proposed in Section 6.5 attracted attention from the FIRST.org community responsible for maintaining CVSS (Common Vulnerability Scoring System), the global standard for vulnerability severity scoring. The author was invited to contribute NISS to the CVSS Resources repository as a domain-specific extension for neural interface vulnerabilities.

The author declined — temporarily. NISS is currently a single-author derivation. The mathematical model has not been independently reviewed, replicated, or stress-tested by another researcher. Contributing it to a standards resource repository before that independent validation would be premature and would risk lending unearned authority to unvalidated math.

This is a deliberate choice. The scoring system works — it produces severity distributions that align with clinical intuition and surface the 81.25% gap in CVE coverage for neural-specific impacts. But "works" and "validated" are not the same thing. The author will contribute NISS to the CVSS ecosystem after at least one independent researcher has reviewed the scoring methodology, attempted to break it, and either confirmed its soundness or identified corrections.

The invitation itself is validation that the problem NISS addresses is recognized by the standards community. The restraint in accepting it is validation that this project prioritizes rigor over recognition.

### 19.2 Preprint and Publication Status

The academic preprint of this framework is published on Zenodo (DOI: [10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105), v1.4 as of February 2026, CC-BY 4.0). arXiv submission is pending endorsement.

The preprint history includes a transparency note: v1.0 shipped with 3 fabricated citations that were AI-generated and not caught before publication. These were corrected in v1.1 and the incident is disclosed in the paper's AI collaboration section. This is mentioned not as a disclaimer but as evidence that the verification protocol described in this paper (Section 9.7) exists because the author learned the hard way that AI-generated citations cannot be trusted without independent resolution.

---

## Integration Status

### What v8.0 Adds to the Story

v6.3 asked: *What are the threats, how do we measure them, and how do we defend against them?*

v8.0 asks: *Who decides, who controls, and who is accountable?*

The new sections (12-18) complete the arc:

| v6.3 Contribution | v8.0 Extension |
|-------------------|---------------|
| 11-band hourglass (Section 4) | Neural OS maps each band to a system layer (Section 16) |
| QI equation (Section 5) | Five-tier model defines who sets the thresholds QI measures against (Section 14) |
| 5 attack mechanisms (Section 6.1) | Terminal eliminates 3 attack surface layers (browser, app store, window manager) (Section 12) |
| Locus Taxonomy + 161 techniques (Section 6.3-6.4) | RACI maps accountability for detecting and responding to each technique (Section 18.1) |
| NISS scoring (Section 6.5) | Autonomy spectrum defines when intervention is justified based on severity (Section 14.1) |
| Algorithmic Psychosis case study (Section 6.6) | Escalation scenario extends the case study pattern to motor→cognitive creep (Section 14.2) |
| TARA dual-use registry (Section 6.7) | Governance projection gets neurorights ACL enforcement (Section 15.6) |
| NSP 5-layer protocol (Section 7) | Passwordless auth (PQKC + biomarker MFA) replaces password-based identity (Section 15) |
| Runemate compression (Section 7.6) | Vision restoration pipeline shows the full content→cortex pathway (Section 17) |
| Falsifiability (Section 8) | Governance questions are the ethical equivalent — what would change the framework (Section 18.4) |
| Future work (Section 10) | Open Source Neural Atlas is the hardware interoperability target (Section 18.3) |
| NISS maps to DSM-5-TR only | v8.0 extends to ICD-11, neurology, sensory modalities — smell, touch, vestibular, pain (Section 6.8) |
| Threat model (theoretical) | Field evidence validates it: real vulnerability found, responsibly disclosed (Section 19) |
| NISS scoring (proposed math) | Standards community recognized it; author held back until independently validated (Section 19.1) |

### Visualization Assets Available

All diagrams referenced in the whitepaper exist as interactive visualizations on qinnovate.com. See Appendix A for the complete index. These can be rendered as static figures for the preprint PDF or referenced as live interactive versions.

### Data Assets Available

All data referenced in the whitepaper exists as machine-readable JSON in the repository. See Appendix B for the complete index. The `qtara` Python package provides programmatic access.

### Next Steps for v8.0

1. Merge new sections into main `QIF-WHITEPAPER.md`
2. Update abstract and discussion to reflect expanded scope
3. Add new references from governance research
4. Render updated visualizations for preprint PDF
5. Update Zenodo preprint (DOI: 10.5281/zenodo.18640105)
6. Update site whitepaper page

---

## Appendix C: Version History (v7.0 → v8.0)

This appendix documents all major changes between v7.0 (February 21, 2026) and v8.0 (March 11, 2026). The derivation log entries referenced below are in `QIF-DERIVATION-LOG.md`.

### v7.0 → v7.1 (February 21–26)

**NISS v1.1 — Metric Split and Normalization**
- Split the original CG (Cognitive) metric into two: **CR (Cognitive Reconnaissance)** and **CD (Cognitive Disruption)**, separating unauthorized neural read access from unauthorized neural write access. The original CG conflated passive surveillance with active manipulation — a distinction that matters for both threat modeling and governance response. (Entries 80–81)
- Renormalized all 161 TARA technique scores against the new 6-metric vector (BI, CR, CD, CV, RV, NP). Published as preprint v1.5 on Zenodo.

**Attack Primitive Decomposition**
- Derived the five fundamental attack mechanisms from physics first principles rather than observed exploits. Every technique in the TARA registry decomposes into combinations of these primitives. (Entry 74)

**CVE-to-TARA Mapping**
- Mapped existing CVE entries with neural interface relevance to TARA technique IDs. Identified an 81.25% coverage gap — the vast majority of BCI-relevant attack surfaces have no CVE representation. (Entry 71)

**Wearable Neural Firewall Design**
- First architecture sketch of the Neurowall as a wearable device operating at the I0 (hardware-biology) boundary. Zero-trust enforcement: amplitude bounds, rate limiting, thermal monitoring, DoS detection. (Entry 70)

**Market Trajectory Analysis**
- Applied 5 economic frameworks (TAM/SAM/SOM, Porter's Five Forces, technology adoption lifecycle, regulatory impact modeling, investment flow analysis) to the BCI market. Estimated neurosecurity market emergence timeline. (Entry 73)

### v7.1 → v7.2 (February 27 – March 4)

**Endogenous Attack Chain Validation**
- Proved that the TARA taxonomy applies to endogenous (body-originating) threats, not just exogenous (device-originating) ones. Endogenous attacks — the body attacking itself through the same neural pathways — validate that the threat model is grounded in biology, not just technology. (Entry 82)

**Cognitive Authenticity Resolution**
- Resolved the Cognitive Authenticity (CA) vs Mental Integrity (MI) debate. CA is an engineering extension of MI, not a competing concept. "Unaltered" (CA) maps to "self-originating" (MI) when the measurement target is the neural signal's origin rather than its content. (Entry 83)

**Privacy-Preserving Neural Data Architecture**
- Designed the data protection layer: homomorphic encryption for on-device computation, differential privacy for aggregate research, data fiduciaries for governance, consent provenance chains for audit. (Entry 84)

**Neurogovernance Research Compilation**
- Added 8 new citations from governance literature. Established the governance layer as a first-class concern spanning all 11 hourglass bands. (Changelog 2026-03-04)

**Ferritin Magnetoreceptor Correction**
- **Retracted** a claim about ferritin-based magnetoreception in neural tissue. The original claim was AI-derived and not supported by the literature on closer examination. Corrected in the derivation log as a transparency measure. (Entry 79)

### v7.2 → v7.3 (March 5–8)

**Epistemic Reckoning and Research Compilation**
- Complete audit of all claims in the framework. Identified and flagged every claim that lacked sufficient evidence. Established the 5-level evidence classification (Verified, Established, Inferred, Theoretical, Unknown) and formalized the neuromodesty checks. (Entries 85–86)

**Triple-Sync Citation Protocol**
- After discovering citation drift between `QIF-RESEARCH-SOURCES.md`, `references.bib`, and `research-registry.json`, established a mandatory triple-sync protocol: every new citation must be added to all three stores simultaneously. (Entry 85)

**Framework Page Rewrite**
- Rewrote the public-facing framework description page to be guardrail-compliant. Removed overclaims, added epistemic qualifiers, aligned all language with the neuromodesty checks. (Entry 87)

**S-Band Relabel**
- Relabeled the S-band (silicon) layers to reflect physics regime and spatial scale rather than implementation specifics. Closed the "host compute gap" — the previously unnamed compute layer between the device radio and the cloud. (Entry 88)

### v7.3 → v8.0 (March 9–11)

**Whitepaper v8.0 Working Draft — Major Structural Expansion**
- Added Sections 12–18 (Runemate CLI, NSP post-quantum protocol, governance model, neural OS architecture, vision restoration pipeline, neurorights ACL mapping). The v8.0 question shifted from "What are the threats?" to "Who decides, who controls, and who is accountable?"

**Section 6.8: Beyond DSM-5-TR**
- Extended NISS clinical outcome mapping beyond psychiatric categories (DSM-5-TR) to include neurological disorders (ICD-11 Chapter 8), sensory modality disruption (olfactory, gustatory, vestibular, somatosensory), and proposed 5 new NISS v2.0 weighting factors (Reversibility, Functional Impact, Pathway Specificity, Clinical Evidence, Modality Criticality).

**Section 6.9: Neuroplasticity Metric (NP)**
- Elevated NP from a field in the NISS vector to a documented standalone concept. NP captures a category of harm with no analogue in traditional cybersecurity: the attack rewires the victim's brain through Hebbian learning, persisting in biology after the device is removed.

**KQL-First Architecture**
- Established the KQL query engine as the universal data access layer for all site dashboards. Pattern: `shared/*.json → kql-tables.ts → dashboards`. All dashboards consume data through KQL queries rather than direct JSON imports. (Entry 90)

**KQL Security Hardening**
- Added 4 defense-in-depth limits to the in-browser KQL engine: query length (4096 chars), operation count (12), result row cap (50,000), execution timeout (2 seconds). The engine was already fundamentally safe (no eval, no database, client-side only), but hardening prevents abuse at the input boundary.

**Clinical Drill-Down (7-Level Semantic Zoom)**
- Built the clinical visualization pathway: Technique → Band → Region → Pathway → Neurotransmitter → Receptor → Molecular Dependencies. Enables clinical users to trace from a TARA threat technique down to the specific molecules involved.

**Data Lake Expansion**
- Expanded coverage to 24 BCI companies, 38 brain regions with functions and connections, 74 intel feed sources (up from 50), 18 neurotransmitter systems with synthesis pathways and cofactors, 38 neural pathways with clinical relevance annotations.

**Intel Feed Cadence Update**
- Updated the threat intelligence feed schedule with source-specific refresh cadences. Expanded from 50 to 74 sources across CVE/NVD, academic preprints, regulatory filings, and industry news.

**Site Architecture Revamp**
- Restructured navigation (renamed Governance group to Neuroethics, reordered pages). Added ethics disclaimers, consent gates for experimental features, and security hardening across the site.

**Hodak Clinical Validation**
- Max Hodak (Neuralink co-founder, Science Corp CEO) published findings aligning with TARA's neurotransmitter-to-clinical-outcome mappings, providing independent clinical validation of the framework's threat-to-impact chain. Documented as a case study.

**Neurological Mapping Expansion**
- Added molecular-level drill-down capability: neurotransmitter → synthesis pathway → cofactors → receptors → molecular dependencies. Clinical users can trace from dopamine depletion through phenylalanine hydroxylase to iron and BH4 cofactor requirements.

**NP Metric Expanded to 4 Levels**
- Added P (Partial, 6.7) between T (Temporary, 3.3) and S (Structural, 10.0). The original 3-level scale collapsed recoverable structural changes and permanent rewiring into the same bucket. Recalculated all 161 TARA techniques — 26 scores changed, 2 severity shifts. Updated across: niss-parser.ts, recalculate-niss.py, 05-niss.tex, scoring.astro, whitepaper/index.astro, both registrar copies.

**NISS Neurological Extension Documentation**
- Published `NISS-NEUROLOGICAL-EXTENSION.md`: 42 neurological conditions across 7 categories, CD broadening rationale, NP expansion rationale, impact chain documentation (technique → band → pathway → condition → NISS metric), data architecture, backward compatibility, KQL query examples.

**KQL Column Expansion**
- Techniques table now exposes 8 new columns for direct NISS metric querying: niss_vector, niss_severity, niss_pins, niss_bi, niss_cr, niss_cd, niss_cv, niss_rv, niss_np. Previously required parsing the vector string.

### Derivation Log Entries (v7.0 → v8.0)

| Entry | Date | Topic |
|-------|------|-------|
| 69 | 2026-02-21 | NIST/ISO hardened compliance mapping |
| 70 | 2026-02-21 | Wearable neural firewall design |
| 71 | 2026-02-21 | CVE-to-TARA mapping + hourglass coverage gap |
| 73 | 2026-02-21 | Market trajectory analysis — 5 economic frameworks |
| 74 | 2026-02-21 | Attack primitive decomposition from physics |
| 75 | 2026-02-21 | Common denominator across disciplines |
| 76 | 2026-02-21 | Calculus boundary — where continuous math fails |
| 77 | 2026-02-22 | Thesis statement |
| 78 | 2026-02-23 | Determinism gradient and free-will decomposition |
| 79 | 2026-02-24 | Ferritin magnetoreceptor correction (retracted) |
| 80 | 2026-02-25 | NISS v1.1: CG split into CR + CD |
| 81 | 2026-02-26 | NISS v1.1: CR/CD weight normalization |
| 82 | 2026-02-27 | Endogenous attack chain validation |
| 83 | 2026-02-28 | Cognitive Authenticity resolved as MI extension |
| 84 | 2026-03-05 | Privacy-preserving neural data architecture |
| 85 | 2026-03-06 | Research registry + triple-sync citation protocol |
| 86 | 2026-03-07 | Epistemic reckoning: research compilation complete |
| 87 | 2026-03-08 | Framework page rewrite: guardrail-compliant prose |
| 88 | 2026-03-09 | S-band relabel: physics regime + spatial scale |
| 89 | 2026-03-10 | Vision: neuroethics to BCI vision arc |
| 90 | 2026-03-11 | Data lake sprint: KQL-first, security, clinical drill-down, v8 |

*20 derivation log entries across 19 days. 3 corrections/retractions documented transparently.*

---

*Version 8.0 Working Draft — Last updated 2026-03-11 — Kevin Qi*
