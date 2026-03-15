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

By cloning, forking, downloading, or otherwise using any part of this repository, you acknowledge that you have read, understood, and agree to be bound by this Disclaimer, the project [LICENSE](LICENSE) (Apache 2.0), the [Code of Conduct](governance/CODE_OF_CONDUCT.md), and the [Security Policy](SECURITY.md).

If you do not agree to these terms, do not use this project.

---

## 9. Governing Law

This Disclaimer shall be governed by and construed in accordance with the laws of the State of New Jersey, United States, without regard to its conflict of law provisions. Any dispute arising under this Disclaimer shall be subject to the exclusive jurisdiction of the courts of the State of New Jersey.

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [LICENSE](LICENSE) | Apache License 2.0 — full terms |
| [Code of Conduct](governance/CODE_OF_CONDUCT.md) | Neuroethics-grounded community standards |
| [Security Policy](SECURITY.md) | Vulnerability reporting and disclosure |
| [Transparency Statement](governance/TRANSPARENCY.md) | AI collaboration audit trail |
| [Informed Consent Framework](governance/INFORMED_CONSENT_FRAMEWORK.md) | Consent model for BCI contexts |
| [Neuroethics Legislation Survey](governance/NEUROETHICS_LEGISLATION_SURVEY.md) | Global neural data legislation tracker |
| [QIF Neuroethics Alignment](governance/QIF-NEUROETHICS.md) | How QIF embeds neuroethics principles |

---

*This document does not constitute legal advice. If you are planning to apply any aspect of this research to real devices, real patients, or real clinical environments, consult a qualified attorney and the relevant regulatory authorities in your jurisdiction.*

*Copyright 2024-2026 Kevin Qi / Qinnovate. Licensed under Apache 2.0.*
