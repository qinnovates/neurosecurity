---
title: "Code of Conduct"
description: "Neuroethics-grounded community standards for contributors and collaborators"
order: 1
---

# Code of Conduct

## Preamble

The brain is the seat of identity. Before it is a research subject, before it is an attack surface, before it is an engineering problem — it is a person. Every standard published by this organization, every threat model, every equation exists because someone's cognitive autonomy deserves protection.

This Code of Conduct reflects that reality. We build security standards for the most intimate technology humanity has ever created. The way we treat each other in this community must be worthy of the thing we are trying to protect.

## Equal Standing

Every person who engages with this project — whether contributing code, opening an issue, asking a question, or reading the documentation — holds equal standing in this community.

We do not discriminate on the basis of age, body size, disability, ethnicity, sex characteristics, gender identity or expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, sexual identity or orientation, neurodivergence, cognitive ability, or any other dimension of human difference.

Neurotechnology will not affect all people equally. Historically marginalized communities face disproportionate risk from surveillance technologies, from unequal access to protective standards, and from exclusion in the design process. We recognize this. Equal standing in our community means actively working to ensure that the standards we develop serve everyone — not just those with the resources to participate in their creation.

## Principles

### Cognitive Liberty

Every individual possesses the right to mental self-determination. This principle governs both our framework and our community: no contributor should feel coerced in their participation, pressured to adopt a position, or penalized for independent thought. In our research, we do not develop, promote, or endorse tools designed to override cognitive autonomy without informed consent.

### Mental Privacy

Neural data is not ordinary data. It is the substrate of thought itself. We treat it as a special category requiring the highest protection — and we extend the same principle to our contributors. Private information, whether physical, electronic, or neural, is never disclosed without explicit permission. We do not build toward surveillance of mental states.

### Mental Integrity

The right to protection from unauthorized alteration of neural function is foundational. In our community, this translates to intellectual honesty: we do not misrepresent findings, manipulate data, or present unverified hypotheses as established fact. Research into attack vectors is conducted solely for defensive purposes, documented transparently, and subject to responsible disclosure.

### Psychological Continuity

The right to maintain one's personal identity — memory, personality, sense of self — deserves protection in both technology and community. We create space for contributors to grow and change their views without being defined by past positions. We do not develop capabilities intended to alter identity without clinical justification and informed consent.

These four principles are recognized in international neuroethics scholarship (Ienca & Andorno, 2017; Yuste et al., 2017) and codified in the [UNESCO Recommendation on the Ethics of Neurotechnology (2025)](/governance/UNESCO_ALIGNMENT/). They are not aspirational for this project. They are operational.

## Conduct

### What We Expect

- Treat every contributor as an intellectual equal, regardless of their background or credentials
- Engage with ideas on their merits — critique arguments, not people
- Cite sources and acknowledge uncertainty honestly
- Welcome newcomers and help them orient to the project
- Respect cognitive diversity — different minds approach problems differently, and that makes the work stronger
- Maintain the boundary between security research and harmful application

### What We Will Not Tolerate

- Harassment, intimidation, or discrimination of any kind
- Sexualized language, imagery, or unwelcome advances
- Personal attacks, insults, or deliberately inflammatory commentary
- Disclosure of private information without explicit consent
- Weaponization of framework knowledge — using QIF threat models, attack surface documentation, or security research to target real BCI users or systems
- Misrepresentation of research — presenting hypotheses as validated findings, fabricating results, or omitting uncertainty from claims

### Medical and Accessibility Considerations

> **This section is a draft and needs broader community input.** The author has personal experience with how biological conditions (B12 deficiency leading to neurological symptoms) can affect cognition and behavior in ways that may resemble code of conduct violations. This lived experience informs but should not solely define the policy. If you have perspective on this, please [open a discussion](https://github.com/qinnovates/qinnovate/discussions).

We are building a framework to protect brains. Some of the people in this community have brains that work differently, whether from neurological conditions, psychiatric diagnoses, neurodivergence, medication effects, nutritional deficiencies, or the very BCI devices we study. A code of conduct for a neurosecurity project that does not account for this would be hypocritical.

**How we handle potential violations when medical context may be a factor:**

1. **Private outreach first. Always.** If a community member's behavior appears to violate this code, moderators will reach out privately before any public action. The question is "are you okay?" before "you broke a rule."
2. **Disclosure is never required.** No one is obligated to share a diagnosis, condition, or medical history. If someone chooses to share context, it is treated as confidential.
3. **Good faith is the standard, not credentials.** We do not require proof of a condition, ethics coursework, or institutional affiliation. The question is whether the person is willing to engage constructively and work toward preventing recurrence.
4. **Accommodations over exclusion.** Where possible, we will work with the individual to find ways to participate that work for them and the community. Different communication channels, a check-in system, adjusted expectations for response tone, whatever helps.
5. **Safety remains non-negotiable.** Accommodations do not extend to actions that endanger the safety of others, involve weaponization of security research, or cause ongoing harm that the person is unwilling to address. Medical context is a mitigating factor in how we respond, not a blanket exception.

This is one of the hardest problems in community governance and we do not pretend to have it figured out. The intersection of neurotechnology, disability, and ethics enforcement is genuinely new territory. We would rather get it right slowly than get it wrong fast.

## Dual-Use Responsibility

This framework documents how brain-computer interfaces can be attacked. That knowledge exists so they can be defended. Every contributor shares responsibility for maintaining this boundary.

When contributing threat research or attack analysis:

1. Document the defense alongside the threat. A vulnerability without a mitigation path is incomplete work.
2. Follow responsible disclosure for real devices. Report vulnerabilities to manufacturers before public discussion.
3. Label confidence levels honestly. Use the project's uncertainty tags — Verified, Inferred, Unverified, Hypothesis — so readers know what is established and what is not.
4. Consider who benefits. If a contribution disproportionately advantages attackers over defenders, it needs revision or discussion with maintainers before merging.

## BCI Security Testing Ethics

The human brain is fragile, non-replaceable, and the seat of a person's identity. Security research on neural interfaces carries risks that do not exist in conventional IT security. All contributors must adhere to the following:

### Testing Environments

All BCI security testing MUST be conducted in **simulated, bench-top, or controlled laboratory environments**. Testing on devices connected to living tissue requires full IRB/ethics board approval and regulatory clearance. See [DISCLAIMER.md](/DISCLAIMER.md) Section 4 for the complete testing environment matrix and requirements.

### Ethical Hacking Principles (Adapted for BCI)

These principles adapt the EC-Council CEH Code of Ethics and OWASP Testing Guide for brain-computer interface contexts:

1. **Obtain written authorization** before testing any system. For BCI devices, authorization must come from the system owner AND the device user/patient where applicable.
2. **Define scope explicitly.** Neural data and biological interfaces are out of scope unless specifically authorized with ethics approval.
3. **Minimize harm.** Use the least invasive technique. If a vulnerability can be demonstrated in simulation, do not escalate to hardware.
4. **Never exfiltrate neural data.** Neural data encountered during testing must not be copied, stored, or transmitted beyond the minimum necessary for the finding.
5. **Stop immediately** if any test produces unexpected interaction with biological systems.
6. **Report defensively.** Every vulnerability must be paired with a mitigation or defensive control.

### Responsible Disclosure

When security research leads to the discovery of a real vulnerability:

1. Report to the affected vendor first, using their published disclosure policy
2. If no vendor policy exists, use [CISA Coordinated Vulnerability Disclosure](https://www.cisa.gov/coordinated-vulnerability-disclosure-process)
3. Allow a minimum 90-day window before public disclosure
4. Never publish exploit code targeting devices connected to human subjects without vendor coordination and a deployed mitigation
5. Follow ISO/IEC 29147 (vulnerability disclosure) and ISO/IEC 30111 (vulnerability handling) where applicable

### Regulatory Compliance

Any application of this research to real devices or patients must comply with all applicable regulations including FDA device cybersecurity guidance, EU MDR, HIPAA, GDPR, applicable neural data laws (Colorado HB 24-1058, California SB 1223, Montana SB 163), and relevant computer fraud statutes (CFAA, Computer Misuse Act, EU Directive 2013/40). See [DISCLAIMER.md](/DISCLAIMER.md) Section 5 for the full regulatory reference matrix.

### No Unauthorized Testing

This project does not grant authorization to test any third-party BCI device, system, or network. The threat models and techniques are for **defensive research and education only**.

## AI Transparency

This project uses artificial intelligence in research and development. The same standards of honesty we apply to human contributions apply to AI-assisted work:

- Disclose AI involvement using `Co-Authored-By` tags in commits
- Never present AI-generated content as independently verified without human validation
- Document the human-AI decision boundary in significant contributions via the project's [Transparency](/governance/TRANSPARENCY/) audit trail
- Apply the same verification rigor to AI-generated claims as to any other source

## Enforcement

Report violations to the maintainer via [GitHub Security Advisories](https://github.com/qinnovates/qinnovate/security/advisories/new) or the contact methods in the About page. All reports will be investigated promptly, fairly, and confidentially.

Maintainers may remove, edit, or reject contributions that violate this Code, and may temporarily or permanently restrict participation by individuals who engage in harmful conduct. For contributions touching neuroethics-sensitive areas, maintainers will consult the project's [governance documents](/governance/) before making decisions.

## Scope

This Code applies in all project spaces — issues, pull requests, discussions, documentation, and any public context where an individual represents the project. We encourage anyone who forks or builds upon the QIF framework to adopt equivalent ethical commitments.

## Attribution

Adapted from the [Contributor Covenant v1.4](https://www.contributor-covenant.org/version/1/4/code-of-conduct.html), with neuroethics principles grounded in:

- Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5.
- Yuste, R., Goering, S., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159-163.
- UNESCO. (2025). *Recommendation on the Ethics of Neurotechnology*.
- Lázaro-Muñoz, G., et al. (2020). Researcher Perspectives on Ethical Considerations in Adaptive Deep Brain Stimulation Trials. *Frontiers in Human Neuroscience*, 14, 578695.

---

*Version 1.0 — Last Updated: 2026-02-10*
# Disclaimer, Terms of Use & Responsible Research Policy

**Effective Date:** 2026-03-11
**Last Updated:** 2026-03-11
**Maintainer:** Kevin Qi ([QInnovate](https://github.com/qinnovates))

---

## 1. Project Status & Disclaimer

**By accessing, cloning, forking, or using any part of this repository, you acknowledge and agree to the following:**

This project — including the Quantified Interconnection Framework (QIF), Threat Assessment for Risk Analysis (TARA), Neural Impact Severity Score (NISS), Neural Sensory Protocol (NSP), Runemate, Neurowall, the Coherence Metric (Cs), and all associated specifications, tools, data, and documentation — is **early-stage research in active development**.

### What This Project Is

- An open-source research portfolio exploring the intersection of BCI security and neuroethics
- A proposed threat modeling methodology for neural interfaces
- A collection of theoretical specifications informed by security engineering and neuroethics scholarship
- A work-in-progress that will expand, evolve, and change as new ideas and evidence emerge

### What This Project Is Not

- A validated, peer-reviewed, or adopted standard
- A clinical, diagnostic, or medical tool or device
- Production-ready software suitable for deployment on real neural interfaces or medical devices
- A substitute for professional security assessment, medical advice, or legal counsel

**Nothing in this repository constitutes a claim that these tools, frameworks, or specifications have been built, deployed, tested on human subjects, or validated by independent domain experts.** This is an active investigation into what the author believes needs to exist — conducted in public, revised constantly, and open to critique.

---

## 2. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

THIS PROJECT AND ALL ASSOCIATED MATERIALS ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, COMPLETENESS, OR RELIABILITY.

THE AUTHOR(S) AND CONTRIBUTOR(S) SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES ARISING OUT OF OR IN CONNECTION WITH THE USE OR INABILITY TO USE THIS PROJECT, INCLUDING BUT NOT LIMITED TO:

- Damages arising from the application of any threat model, scoring methodology, or security framework described herein
- Damages arising from the use of any specification, protocol, or tool in a clinical, medical, or production environment
- Damages arising from reliance on any data, analysis, or recommendation contained in this repository
- Personal injury, bodily harm, neurological harm, or any harm to human subjects
- Loss of data, revenue, profits, or business opportunities

**YOU ASSUME ALL RISK** associated with the use of this project. If you choose to apply any concept, specification, or tool from this repository to real systems, real devices, or real people, you do so entirely at your own risk and under your own legal and ethical responsibility.

This limitation of liability applies regardless of the legal theory under which damages are sought, whether in contract, tort (including negligence), strict liability, or otherwise, even if the author(s) have been advised of the possibility of such damages.

---

## 3. No Medical, Clinical, or Diagnostic Use

This project references psychiatric diagnostic categories (DSM-5-TR), neuroanatomical regions, clinical outcomes, and therapeutic analogs **exclusively for threat modeling purposes**. These references:

- Are not diagnostic claims
- Are not clinical recommendations
- Are not validated for clinical use
- Do not constitute medical advice

Any reference to clinical conditions, psychiatric outcomes, or neurological impact is a **research-based categorization for security threat modeling**, not a clinical assessment. If you have concerns about neurological health, consult a qualified medical professional.

---

## 4. BCI Security Testing Ethics

This section adapts principles from the EC-Council Certified Ethical Hacker (CEH) Code of Ethics, the OWASP Testing Guide, and the FIRST Ethics Guidelines for responsible security research in the context of brain-computer interfaces.

### 4.1. The Cardinal Rule

**The human brain is not a test environment.**

Brains are fragile, non-replaceable, and the seat of a person's identity, memory, and autonomy. Unlike conventional IT systems, neural interfaces interact with living tissue where security failures can cause irreversible harm — not data loss, but damage to cognition, motor function, perception, or psychological continuity.

All security research conducted in connection with this project must respect this reality absolutely.

### 4.2. Testing Requirements

**All BCI security testing MUST be conducted in one of the following environments:**

| Environment | Description | Requirements |
|------------|-------------|--------------|
| **Simulated** | Software-based emulation of BCI signals and protocols | No human subjects. Synthetic data only. |
| **Bench-top** | Physical hardware testing on isolated devices not connected to living tissue | Device must be disconnected from any biological interface. |
| **Controlled laboratory** | Institutional research facility with ethics oversight | Requires IRB/ethics board approval (see Section 4.3). |
| **Clinical trial** | Formally approved human-subjects research | Requires full regulatory approval (see Section 5). |

**Under no circumstances** shall any contributor, user, or derivative-work author:

- Test exploits, attacks, or security tools on BCI devices while connected to a human subject without full regulatory and ethics approval
- Conduct unauthorized access to any neural interface, neural data stream, or BCI control system
- Develop or deploy tools intended to alter, disrupt, or intercept neural signals without explicit authorization from the device owner, the subject, and the relevant ethics and regulatory authorities
- Use threat models or attack techniques from this project to target real BCI users or systems

### 4.3. Institutional Review & Ethics Approval

Any research involving human subjects, human-derived neural data, or devices connected to living tissue must be approved by the appropriate institutional review body:

| Jurisdiction | Review Body | Key Requirements |
|-------------|------------|------------------|
| United States | Institutional Review Board (IRB) | 45 CFR 46 (Common Rule), 21 CFR 50/56 (FDA) |
| European Union | Research Ethics Committee (REC) | EU Clinical Trials Regulation 536/2014, GDPR Art. 9 |
| United Kingdom | NHS Health Research Authority | UK GDPR, Mental Capacity Act 2005 |
| Canada | Research Ethics Board (REB) | TCPS 2 (Tri-Council Policy Statement) |
| International | WHO Ethics Review Committee | Declaration of Helsinki, ICH-GCP |

Research that does not involve human subjects (simulation, bench-top hardware testing, data analysis of publicly available datasets) does not require IRB approval but must still comply with Section 4.2 testing environment requirements.

### 4.4. Ethical Hacking Principles (Adapted for BCI)

Contributors performing security research on BCI systems shall:

1. **Obtain written authorization** before testing any system. Authorization must come from the system owner and, where applicable, the device user/patient.
2. **Define scope explicitly.** Document exactly what systems, signals, and interfaces are in scope before testing begins. Neural data and biological interfaces are out of scope unless specifically authorized with ethics approval.
3. **Minimize harm.** Use the least invasive technique that achieves the research objective. If a vulnerability can be demonstrated in simulation, do not escalate to hardware testing.
4. **Document everything.** Maintain detailed records of methodology, findings, and any unintended effects. Follow the project's [Transparency Statement](governance/TRANSPARENCY.md) for audit trail requirements.
5. **Report defensively.** Every vulnerability disclosure must include a defensive recommendation or mitigation strategy. A threat without a defense is incomplete work.
6. **Never exfiltrate neural data.** Neural data encountered during testing must not be copied, stored, transmitted, or analyzed beyond the minimum necessary for the security finding. Neural data is the substrate of thought and is treated as the highest-sensitivity data category.
7. **Stop immediately** if any test produces unexpected interaction with biological systems, if a device connected to a subject behaves anomalously, or if there is any indication of risk to a human subject.

---

## 5. Regulatory Compliance

Any application of this research to real devices, real patients, or real clinical environments must comply with all applicable regulations. This is a non-exhaustive reference list:

### 5.1. Medical Device & Cybersecurity Regulations

| Regulation | Jurisdiction | Scope |
|-----------|-------------|-------|
| FDA 21 CFR 820 | United States | Quality System Regulation for medical devices |
| FDA Premarket Cybersecurity Guidance (2023) | United States | Cybersecurity requirements for premarket submissions |
| FDA Postmarket Cybersecurity Guidance (2016) | United States | Ongoing cybersecurity management for marketed devices |
| PATCH Act (Section 524B, FD&C Act) | United States | Mandatory cybersecurity requirements for connected devices |
| FDORA (2022) | United States | FDA Omnibus Reform Act — SBOM requirements |
| EU MDR 2017/745 | European Union | Medical Device Regulation |
| EU IVDR 2017/746 | European Union | In Vitro Diagnostic Regulation |
| EU AI Act (2024) | European Union | High-risk AI system requirements (BCIs classified as high-risk) |
| IEC 62443 | International | Industrial automation and control system security |
| IEC 80001-1 | International | Risk management for IT-networks incorporating medical devices |
| ISO 14971 | International | Risk management for medical devices |
| ISO 13485 | International | Quality management systems for medical devices |

### 5.2. Data Protection & Neural Data

| Regulation | Jurisdiction | Relevance |
|-----------|-------------|-----------|
| HIPAA | United States | Protected health information, including neural data in clinical contexts |
| Colorado HB 24-1058 | Colorado, US | Neural data classified as sensitive personal data |
| CCPA/CPRA (SB 1223) | California, US | Neural data included in sensitive personal information |
| Montana SB 163 | Montana, US | Neural data covered under Genetic Information Privacy Act |
| GDPR Article 9 | European Union | Special categories of personal data (health, biometric) |
| Chile Constitutional Amendment (2021) | Chile | Constitutional neuroprotection |

### 5.3. Research Ethics & Human Subjects

| Standard | Issuing Body | Scope |
|---------|-------------|-------|
| Declaration of Helsinki | World Medical Association | Ethical principles for medical research involving human subjects |
| Belmont Report | US National Commission | Ethical principles: respect for persons, beneficence, justice |
| Common Rule (45 CFR 46) | US HHS | Federal policy for protection of human subjects |
| ICH E6(R3) Good Clinical Practice | ICH | International standard for clinical trial conduct |
| Nuremberg Code (1947) | International | Foundational informed consent requirements |
| UNESCO Recommendation on Neurotechnology Ethics (2025) | UNESCO | First intergovernmental framework for neurotechnology governance |
| OECD Recommendation on Responsible Innovation in Neurotechnology (2019) | OECD | Principles for neurotechnology governance |

### 5.4. Security Testing & Vulnerability Disclosure

| Framework | Issuing Body | Scope |
|----------|-------------|-------|
| ISO/IEC 29147:2018 | ISO/IEC | Vulnerability disclosure |
| ISO/IEC 30111:2019 | ISO/IEC | Vulnerability handling processes |
| NIST SP 800-53 Rev. 5 | NIST | Security and privacy controls |
| NIST Cybersecurity Framework 2.0 | NIST | Risk management framework |
| FIRST PSIRT Services Framework | FIRST | Product security incident response |
| OWASP Testing Guide v4 | OWASP | Security testing methodology |
| EC-Council CEH Code of Ethics | EC-Council | Ethical hacking principles |

---

## 6. Responsible Vulnerability Disclosure

### 6.1. If You Discover a Vulnerability

If your use of this project's threat models, tools, or methodologies leads to the discovery of a real vulnerability in a real BCI device or system:

1. **Do NOT publicly disclose** the vulnerability before coordinating with the affected vendor
2. **Report to the vendor first** using their published security contact or vulnerability disclosure policy
3. **If no vendor policy exists**, report via [CISA Coordinated Vulnerability Disclosure](https://www.cisa.gov/coordinated-vulnerability-disclosure-process) or contact the project maintainer for guidance
4. **Allow a minimum 90-day disclosure window** for the vendor to develop and deploy a patch
5. **Document your disclosure timeline** and methodology for transparency
6. **Never publish exploit code** targeting devices connected to human subjects without explicit vendor coordination and a deployed mitigation

### 6.2. Reporting Vulnerabilities in This Project

See [SECURITY.md](SECURITY.md) for the project's own vulnerability reporting process.

### 6.3. No Unauthorized Testing

This project does not grant authorization to test any third-party BCI device, system, or network. The threat models, attack techniques, and security tools described herein are for **defensive research and education only**. Any security testing of real systems requires explicit written authorization from the system owner and compliance with all applicable laws, including but not limited to:

- Computer Fraud and Abuse Act (CFAA) — United States
- Computer Misuse Act 1990 — United Kingdom
- Directive 2013/40/EU — European Union
- Criminal Code Section 342.1 — Canada

---

## 7. Indemnification

By using this project, you agree to indemnify, defend, and hold harmless the author(s), contributor(s), and maintainer(s) from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or in connection with:

- Your use or misuse of any material in this repository
- Your violation of any applicable law, regulation, or third-party right
- Your application of any concept, tool, or specification from this project to real systems, devices, or human subjects
- Any harm, injury, or damage resulting from your use of this project

---

## 8. Acceptance

By cloning, forking, downloading, or otherwise using any part of this repository, you acknowledge that you have read, understood, and agree to be bound by this Disclaimer, the project [LICENSE](LICENSE) (Apache 2.0), the [Code of Conduct](CODE_OF_CONDUCT.md), and the [Security Policy](SECURITY.md).

If you do not agree to these terms, do not use this project.

---

## 9. Governing Law

This Disclaimer shall be governed by and construed in accordance with the laws of the State of New Jersey, United States, without regard to its conflict of law provisions. Any dispute arising under this Disclaimer shall be subject to the exclusive jurisdiction of the courts of the State of New Jersey.

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [LICENSE](LICENSE) | Apache License 2.0 — full terms |
| [Code of Conduct](CODE_OF_CONDUCT.md) | Neuroethics-grounded community standards |
| [Security Policy](SECURITY.md) | Vulnerability reporting and disclosure |
| [Transparency Statement](governance/TRANSPARENCY.md) | AI collaboration audit trail |
| [Informed Consent Framework](governance/policy/INFORMED_CONSENT_FRAMEWORK.md) | Consent model for BCI contexts |
| [Neuroethics Legislation Survey](governance/policy/NEUROETHICS_LEGISLATION_SURVEY.md) | Global neural data legislation tracker |
| [QIF Neuroethics Alignment](governance/policy/QIF-NEUROETHICS.md) | How QIF embeds neuroethics principles |

---

*This document does not constitute legal advice. If you are planning to apply any aspect of this research to real devices, real patients, or real clinical environments, consult a qualified attorney and the relevant regulatory authorities in your jurisdiction.*

*Copyright 2024-2026 Kevin Qi / Qinnovate. Licensed under Apache 2.0.*
