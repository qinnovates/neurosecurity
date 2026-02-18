---
title: "Ethical Neurosecurity Code of Ethics"
description: "Adapted from EC-Council CEH and (ISC)² codes of ethics for neurosecurity. v0.0.1 (Draft)."
order: 0
---

# Ethical Neurosecurity Code of Ethics

> **Version 0.0.1** (Draft) | February 2026 | Kevin L. Qi | [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)

> **Canonical source:** [`src/data/code-of-ethics.ts`](../src/data/code-of-ethics.ts) — edit that file to update both this document and the [website](https://qinnovate.com/security/#ethics).

This code adapts the structure and principles of the EC-Council Certified Ethical Hacker (CEH) Code of Ethics and the (ISC)² Code of Ethics for the neurosecurity domain. Ethical hacking already solved many governance problems for traditional systems. We are taking those lessons and applying them where the stakes are highest: the human brain.

## Preamble

Neurotechnology is advancing faster than the rules protecting the people who use it. Brain-computer interfaces are entering clinical trials, consumer EEG devices are shipping to millions, and silent speech decoding is accurate enough to worry about. The security community that protects these systems needs its own ethical foundation.

Ethical hackers protect servers, networks, and applications. Ethical neurosecurity researchers protect brains. The principles are the same: get authorization before you test, report what you find, do not cause harm, protect what you access. But the consequences are different. A compromised server can be reimaged. A compromised brain may not recover. That difference demands a code of ethics written specifically for this work.

This code is open. It builds on decades of work in cybersecurity ethics, bioethics, neurorights, and human rights law. Anyone working in neurosecurity, whether in research, clinical settings, industry, or government, is invited to adopt, critique, and improve it.

## The Four Canons

*Adapted from (ISC)² Code of Ethics. These are the highest-level obligations.*

### Canon I: Protect cognitive sovereignty

Protect the individual's right to mental privacy, psychological continuity, and freedom of thought. Neural data belongs to the person it came from. Not the device manufacturer. Not the researcher. Not the state.

*Sources: Chile Neurorights Law, Yuste's 5 Neurorights, Ienca & Andorno (Right to Cognitive Liberty), OECD Principle 9, UNESCO UDBHR Art. 5*

### Canon II: Act with integrity and transparency

Be honest about your methods, your findings, and your limitations. Disclose conflicts of interest. Disclose dual-use potential of any technique you publish. Never misrepresent your qualifications or the scope of your testing.

*Sources: (ISC)² Canon 2, CEH Clauses 7/10, CREST Code of Ethics (Integrity/Objectivity), Belmont Report (Respect for Persons), Helsinki Art. 23*

### Canon III: Provide competent and careful service

Only perform neurosecurity work within your competence. Neural systems are not servers. Understand the biology before you test the security. When you are out of your depth, say so and bring in the right expertise.

*Sources: (ISC)² Canon 3, CEH Clause 3, Nuremberg Code Point 8, CREST (Competence), PTES Pre-Engagement*

### Canon IV: Advance and protect the field

Contribute to the neurosecurity community through responsible research, open collaboration, and knowledge sharing. Mentor newcomers. Hold each other accountable. The field is too young and too important to get wrong.

*Sources: (ISC)² Canon 4, CEH Clause 9, OECD Principles 4/5, Asilomar Principles 3/4, IEEE Neuroethics (Agency & Identity)*

## The Principles

*Adapted from the EC-Council CEH Code of Ethics and mapped across neurorights, bioethics, digital ethics, and international law.*

### 1. Obtain informed neural consent before any testing

Never access, probe, or test a neural interface without explicit written authorization from the device user and the system owner. For BCIs, the device user IS the person whose brain is connected. Informed consent must include what neural data will be collected, how it will be used, and when it will be deleted. The person must understand what you might learn about their cognitive state in the process.

*Sources: CEH Clause 14 (authorized testing) + Nuremberg Code Point 1 (voluntary consent) + Belmont Report (informed consent) + Helsinki Art. 25-32 + Colorado HB24-1058 (affirmative opt-in) + California SB 1223 + OECD Principle 7*

### 2. Do no neural harm

Never perform any test that risks irreversible damage to neural tissue or cognitive function. A penetration test on a server can be rolled back. A penetration test that causes seizures, memory loss, or personality changes cannot. If there is any doubt about whether a technique could cause lasting harm, do not use it. This is the irreversibility threshold, and there is no equivalent in traditional security.

*Sources: CEH Clause 13 (don't compromise systems) + Nuremberg Code Points 4-5 (avoid suffering, no a priori reason for harm) + Belmont Report (beneficence) + Helsinki Art. 16-18 + Ienca & Andorno (Right to Mental Integrity) + OECD Principle 2 (safety)*

### 3. Protect neural data as the most sensitive category of personal information

Neural data can reveal thoughts, emotions, intentions, psychiatric conditions, and cognitive patterns that the person may not even be aware of themselves. Treat it with more care than you would treat medical records, biometric data, or financial information. Encrypt it in transit and at rest. Minimize what you collect. Delete it when the engagement ends. Never share it without explicit consent. A [Neurorights Foundation audit](https://perseus-strategies.com/wp-content/uploads/2024/04/FINAL_Consumer_Neurotechnology_Report_Neurorights_Foundation_April-1.pdf) in 2024 found that 96.7% of consumer neurotech companies reserve the right to transfer brain data to third parties. Do not be one of them.

*Sources: CEH Clause 1 (confidentiality) + GDPR Article 9 (special categories) + Colorado HB24-1058 + California SB 1223 + Chile Neurorights (neurodata as organ) + OECD Principle 7 + CoE Convention 108+ (neural data as special category) + Helsinki Art. 24*

### 4. Never engage in or support malicious neural activities

Do not develop, distribute, or use tools designed to attack neural interfaces without authorization. Do not collaborate with actors seeking to weaponize neurotechnology for surveillance, coercion, or cognitive manipulation. Do not build neuroweapons. Do not assist in the extraction of thoughts, emotions, or memories without consent. Mexico's GLNN bill (introduced 2024, published in [The Lancet Psychiatry](https://www.thelancet.com/journals/lanpsy/article/PIIS2215-0366(24)00286-4/abstract))00286-4/abstract) proposes criminal penalties of 3-12 years for mental manipulation and unauthorized probing of neuronal activity. The severity is appropriate.

*Sources: CEH Clause 12 (no malicious hackers) + Budapest Convention Art. 2-6 (illegal access, interception, data interference) + Mexico GLNN (criminal penalties) + EU AI Act Art. 5(1)(a) (subliminal manipulation prohibition) + IEEE Neuroethics (Authority/Power)*

### 5. Maintain a neural safety cutoff at all times

Any neurosecurity test involving active neural interfaces must have an immediate stop mechanism. If the subject reports discomfort, cognitive changes, or unusual sensations, halt all testing immediately. The subject's right to terminate participation is absolute and cannot be overridden by research goals, contractual obligations, or project timelines. This applies during testing and for a monitoring period after.

*Sources: Nuremberg Code Point 9 (subject's right to terminate) + Point 10 (scientist's duty to terminate) + Helsinki Art. 18 (stop when risks outweigh benefits) + PTES Rules of Engagement (emergency stop) + EU Trustworthy AI Requirement 1 (human oversight)*

### 6. Handle involuntary cognitive disclosures with care

During neurosecurity work, you may inadvertently learn things about a person's cognitive state, emotional patterns, psychiatric conditions, or inner thoughts that they did not consent to reveal. This is different from finding a password in a pentest. If you discover cognitive or health information incidentally, treat it as privileged. Do not record it. Do not report it unless the person gives explicit consent or there is an immediate safety risk. The person's right to mental privacy does not disappear because you found a vulnerability.

*Sources: Yuste Neurorights (mental privacy) + Ienca & Andorno (Right to Mental Privacy) + Chile Neurorights + GDPR Art. 9 (health data) + Helsinki Art. 24 (privacy/confidentiality) + Montreal Declaration Principle 3 (privacy and intimacy)*

### 7. Report all vulnerabilities through responsible disclosure

Report every neural security vulnerability you discover to the device manufacturer or responsible party through coordinated disclosure. Give them reasonable time to patch before any public disclosure. When you do publish, always include defensive countermeasures alongside the attack vector. Never publish a neural exploit without a corresponding defense. The dual-use potential of every technique in the TARA registry is exactly why this matters.

*Sources: CEH Clause 2 (disclose dangers) + CREST Code of Conduct (responsible disclosure) + OECD Principle 9 (anticipate misuse) + Asilomar Principle 5 (race avoidance) + PTES Phase 7 (reporting)*

### 8. Advocate for equitable access and protection from bias

Neurosecurity protections should not be a luxury. If a neural interface is secure for one population but vulnerable for another due to algorithmic bias, training data gaps, or economic barriers, that is a security failure. Work to ensure that the people who need neural interfaces the most, typically patients with severe disabilities, are not the ones left with the weakest protections. Test across diverse populations. Flag biased models. Push for open security standards that anyone can audit.

*Sources: Yuste Neurorights (equal access + protection from bias) + Belmont Report (justice) + Helsinki Art. 13 + UNESCO UDBHR Art. 10-11 + OECD Principle 3 (inclusivity) + Chile Neurorights + EU Trustworthy AI Requirement 5*

### 9. Stay within scope, stay within the law

All neurosecurity testing must operate within clearly defined scope boundaries documented in writing before work begins. Define exactly which devices, interfaces, and neural data streams are in-scope. Everything else is off-limits. Comply with all applicable laws, including neural data privacy statutes (Colorado HB24-1058, California SB 1223, the MIND Act when enacted), medical device regulations, and international cybercrime law (Budapest Convention). Unauthorized access to a neural interface is not a grey area. It is a crime against a person's brain.

*Sources: CEH Clauses 14/19 (authorized testing, legal compliance) + PTES Pre-Engagement (scope/rules of engagement) + Budapest Convention Art. 2-5 + Tallinn Manual Rules 1-4 (sovereignty) + Colorado/California neural data laws + Mexico GLNN*

### 10. Preserve personal identity and psychological continuity

Never perform any action that alters a person's sense of self, personality, memories, or cognitive patterns without their explicit, informed consent. This includes neuromodulation, stimulation parameter changes, or any technique that could affect psychological continuity. The right to personal identity means that who you are before a neurosecurity assessment is who you should be after it. If a vulnerability you discover could be exploited to alter someone's identity, report it with the highest severity.

*Sources: Ienca & Andorno (Right to Psychological Continuity) + Yuste Neurorights (personal identity) + Chile Neurorights + IEEE Neuroethics (Agency & Identity) + CoE DH-BIO (mental integrity) + UNESCO UDBHR Art. 3 (human dignity)*

### 11. Maintain competence across both security and neuroscience

Neurosecurity sits at the intersection of cybersecurity, neuroscience, bioethics, and clinical medicine. Stay current in all of them. Understand the biology of what you are testing. Know the difference between cortical oscillation bands. Understand how neural signals propagate. Know what a seizure looks like. If you only know the security side, partner with someone who knows the neuroscience. If you only know the neuroscience, partner with someone who knows the security. Neither half is optional.

*Sources: CEH Clauses 3/9/25 (competence, continuous learning) + (ISC)² Canon 3 + CREST (Competence) + OECD Principle 4 (scientific collaboration) + Nuremberg Code Point 8 (qualified persons)*

### 12. Accept accountability for your work

You are responsible for the consequences of your neurosecurity work. Document everything. Maintain audit trails. If something goes wrong during testing, report it immediately. If your published research is used to cause harm, engage with the response. Accountability is not optional in a field where the target is a human brain. The (ISC)² requires members to report ethics breaches by other members. We adopt the same standard here. If you see someone violating this code, say something.

*Sources: (ISC)² (obligation to report violations) + EU Trustworthy AI Requirement 7 (accountability) + UNESCO AI Principle 8 + Asilomar Principle 9 (responsibility) + Helsinki Art. 23 (ethics committee oversight) + NIST CSF Govern function*

## Framework Cross-Reference

How each principle maps to existing ethics frameworks. This code does not exist in a vacuum. It stands on the shoulders of decades of work in cybersecurity ethics, bioethics, neurorights, and international law.

| Principle | CEH / (ISC)² | Bioethics | Neurorights | Digital / Intl Law |
|-----------|-------------|-----------|-------------|-------------------|
| 1. Neural Consent | CEH #14 | Nuremberg 1, Belmont, Helsinki 25-32 | Chile, Colorado, California, OECD 7 | GDPR Art. 9, PTES |
| 2. No Neural Harm | CEH #13 | Nuremberg 4-5, Belmont, Helsinki 16-18 | Ienca (Mental Integrity), OECD 2 | EU AI Act Art. 5 |
| 3. Data Protection | CEH #1 | Helsinki 24 | Chile (neurodata = organ), OECD 7 | GDPR Art. 9, CoE 108+ |
| 4. No Malicious Activity | CEH #12 | Nuremberg 4 | Mexico GLNN, IEEE (Authority) | Budapest Conv. Art. 2-6 |
| 5. Safety Cutoff | — | Nuremberg 9-10, Helsinki 18 | — | PTES ROE, EU Trust. AI 1 |
| 6. Cognitive Disclosure | CEH #1 | Helsinki 24 | Yuste (mental privacy), Ienca | Montreal Decl. 3 |
| 7. Responsible Disclosure | CEH #2 | — | OECD 9 (anticipate misuse) | CREST, Asilomar 5 |
| 8. Equitable Access | — | Belmont (justice), Helsinki 13 | Yuste (equal access, bias), Chile, OECD 3 | EU Trust. AI 5, UNESCO 10-11 |
| 9. Scope & Legal | CEH #14, #19 | — | Colorado, California, Mexico GLNN | Budapest Conv., Tallinn, PTES |
| 10. Identity Preservation | — | UNESCO UDBHR Art. 3 | Ienca (Psych. Continuity), Yuste, Chile | IEEE (Agency/Identity) |
| 11. Cross-Domain Competence | CEH #3, #9, #25 | Nuremberg 8 | OECD 4 | CREST (Competence) |
| 12. Accountability | (ISC)² (report) | Helsinki 23 | UNESCO AI 8 | EU Trust. AI 7, NIST Govern, Asilomar 9 |

---

**Version 0.0.1** (Draft) · February 2026 · Written by Kevin L. Qi · [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)

This code is a living document. If you work in neurosecurity and see something missing, [open an issue](https://github.com/qinnovates/qinnovate/issues) or submit a pull request. The point is to get this right, not to get it first.