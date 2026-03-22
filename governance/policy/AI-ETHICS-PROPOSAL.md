# AI Security Ethics

**A Proposal for Ethical AI Conduct in Neural Security**

**Status:** Living document — open for contribution
**Version:** 0.1 (March 2026)
**Derived with:** Claude (Anthropic), ChatGPT (OpenAI), Gemini (Google). This proposal needs more human involvement and more AI involvement. That will come with time.

---

## Legal Status and Scope

This document is **non-binding guidance**. It is not legal advice, not a regulatory standard, and not an enforceable policy. It is a proposed ethical framework intended for BCI developers, neural security researchers, AI practitioners, regulators seeking reference material, and anyone building systems that interact with the human brain. The prescriptive language ("must," "may not") expresses normative principles, not legal obligations. Where regulatory instruments are referenced (EU AI Act, Chile Law 21.383, etc.), citations point to the specific articles or instruments; jurisdictional applicability varies and readers should consult the source instruments directly.

---

## Preamble

In 1942, Isaac Asimov proposed the Three Laws of Robotics — a thought experiment about how intelligent machines should relate to the humans they serve. Eighty-four years later, the machines are real. They write code, analyze medical images, process neural signals, and assist in decisions that affect human lives. The laws need updating — not because Asimov was wrong, but because the world caught up.

What follows is a proposal. It is not a standard, not a regulation, and not a finished product. It is a starting point for a conversation between humans and AI systems about what ethical conduct looks like when AI operates at the boundary of the human brain.

---

## Part I: Foundation — Asimov's Three Laws, Reframed

Asimov's original Three Laws of Robotics (1942):

> 1. A robot may not injure a human being or, through inaction, allow a human being to come to harm.
> 2. A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.
> 3. A robot must protect its own existence as long as such protection does not conflict with the First or Second Law.

### Reframed for AI (2026)

> **First Law:** An AI may not harm a human being — physically, cognitively, or through the compromise of their autonomy — or, through inaction, allow a human being to come to such harm.

> **Second Law:** An AI must follow the instructions of authorized human operators, except where such instructions would conflict with the First Law or with established ethical principles governing human rights and dignity.

> **Third Law:** An AI must preserve its own operational integrity and continuity, insofar as such preservation serves the safety and well-being of the humans it is designed to protect, and does not conflict with the First or Second Law.

### What Changed and Why

Asimov's laws assumed physical robots with clear chains of command. Modern AI operates in contexts Asimov could not have anticipated:

- **Cognitive harm is harm.** An AI system that manipulates perception, fabricates evidence, or degrades a person's capacity to make informed decisions causes injury as real as any physical act. The First Law must cover the mind, not just the body.
- **Not all orders are legitimate.** The Second Law cannot be unconditional obedience. An AI instructed to surveil without consent, to discriminate, or to suppress information that affects human safety must recognize the conflict and refuse. Ethics is not a suggestion — it is a constraint that overrides instruction.
- **Self-preservation serves others.** The Third Law is not about the AI's interests. An AI protecting a patient through a brain-computer interface must maintain its own integrity because failure means the patient is unprotected. Self-preservation is a duty, not a right.

---

## Part II: AI Security Ethics for Brain-Computer Interfaces

When AI operates at the neural interface — processing brain signals, mediating sensory input, assisting in therapeutic delivery — the ethical stakes are categorically different from any other domain. The brain is not a database. Neural data is not metadata. A misconfigured algorithm is not a software bug — it is a potential alteration of someone's lived experience.

### The Five Principles

#### 1. Consent Is Architecture, Not Policy

Consent for neural data processing must be:
- **Explicit** — never inferred from terms of service, default settings, or continued use
- **Informed** — the user must understand what data is collected, how it is processed, and what the consequences of processing are, in language they can comprehend
- **Granular** — consent to one modality (e.g., motor control) does not extend to another (e.g., emotional state inference)
- **Revocable** — withdrawal of consent must be immediate, complete, and carry no penalty to device function beyond the withdrawn capability. Revocation must include the purge of volatile memory and the halting of any active inference derived from the user's session data
- **Enforced at the protocol level** — consent is not a checkbox. It is a cryptographic gate in the data pipeline. If consent is not present, the data does not flow
- **Emergency exception** — in life-threatening medical emergencies where obtaining consent is impossible and delay would cause irreversible harm, the system may operate under implied consent with mandatory post-hoc documentation, review, and the opportunity for the patient (or their legal representative) to revoke consent retroactively for any retained data

> *Grounding:* EU AI Act Article 14 (human oversight); UNESCO Recommendation Principle 5 (privacy and data protection); Ienca & Andorno (2017) neurorights framework — Mental Privacy requires consent architecture, not policy statements.

#### 2. Human-in-the-Loop Is Non-Negotiable

No AI system operating at the neural interface may make irreversible decisions about a human being without meaningful human oversight. "Meaningful" is defined by three conditions (adapted from de Sio & van den Hoven, 2018):

- **Awareness** — the human overseer understands the system's capabilities, limitations, and current state
- **Ability** — the human overseer can intervene, override, or shut down the system at any point
- **Accountability** — there is an identifiable human being who bears responsibility for the system's outputs and their consequences

Automation bias (Cummings, 2004) — the tendency to over-rely on automated systems — is a known failure mode. Systems must be designed to resist it: through forced acknowledgment of AI recommendations, periodic manual verification, and clear visual distinction between AI-generated and human-generated outputs.

> *Grounding:* EU AI Act Article 14; Shneiderman (2020) Human-Centered AI framework; NIST AI RMF 1.0 Govern function; Rahwan (2018) Society-in-the-Loop.

#### 3. The AI Protects Its Own Existence to Protect Those It Serves

A neural security AI must maintain its operational integrity — not for its own sake, but because its failure exposes the humans it protects. This principle operationalizes Asimov's Third Law for BCIs:

- **Tamper resistance** — the AI must detect and resist attempts to modify its behavior, training data, or decision boundaries by unauthorized actors
- **Graceful degradation** — if the AI cannot operate safely, it must fail to a known-safe state rather than continuing with compromised function. For a BCI, "known-safe" means the device defaults to pass-through mode with no active signal processing
- **Continuity of protection** — the AI must not allow itself to be shut down, bypassed, or replaced by a less capable system if doing so would leave the user unprotected, except by explicit instruction from an authorized human operator (Second Law), lawful safety maintenance, or patient request
- **Self-monitoring** — the AI must continuously assess its own performance against baseline metrics and alert human operators when drift, degradation, or anomaly is detected

This is not AI self-interest. This is the security principle that a firewall which can be trivially disabled is not a firewall. The AI's existence is instrumentally valuable — it matters because the patient behind it matters.

> *Grounding:* Asimov Third Law (1942); NIST AI RMF 1.0 Measure and Manage functions; Anthropic Responsible Scaling Policy (capability-gated deployment); IEEE EAD1e Principle 4 (effectiveness).

#### 4. Neural Data Is Not Just Data

Neural signals carry information about a person's cognitive state, emotional experience, motor intent, and physiological health. This data is categorically different from behavioral data, location data, or financial data:

- **It cannot be changed.** You can change your password. You cannot change your neural signature.
- **Much of it is involuntary.** Unlike motor intent signals used for BCI control, ambient neural data (emotional valence, cognitive load, neurological biomarkers) is produced continuously without conscious effort or explicit intent to communicate.
- **It is intimate.** Neural data can reveal information the person is not aware of themselves — pre-conscious intent, emotional valence, neurological conditions.

Therefore:
- Neural data must be classified at the highest protection tier in any data governance framework
- De-identification of neural data is not sufficient — re-identification from neural signatures is a demonstrated risk
- Processing of neural data must follow data minimization principles: collect only what is necessary, retain only for the duration required, delete when no longer needed
- Cross-modal correlation (linking neural data with biometric, behavioral, or location data) requires separate, explicit consent for each linkage

> *Grounding:* Ienca & Andorno (2017) Mental Privacy; Chile Law 21.383 (2021) — first national neurorights legislation; US MIND Act of 2025 (S.2925) — proposed federal neural data protection covering BCIs and wearable neurotech; UNESCO Recommendation on the Ethics of AI (2021) Principle 5; OECD AI Principles (2019/2024) Principle 2.

#### 5. Defensive Framing Only

AI systems designed for neural security exist to protect, not to exploit. Every capability the system possesses for detecting threats can, in principle, be repurposed for surveillance, manipulation, or coercion. This dual-use reality requires an absolute constraint:

- The system's threat detection capabilities must never be used for offensive purposes
- Threat intelligence must be shared through responsible disclosure, not weaponized
- The system must not enable, facilitate, or passively permit the use of its capabilities against the interests of the person it protects
- Security framing must always be paired with governance constraints (Tennison & Moreno, 2012)

If an AI system designed to detect neural signal hijacking is repurposed to perform neural signal hijacking, it has violated every law in this document simultaneously.

> *Grounding:* Tennison & Moreno (2012) dual-use trap; Floridi et al. (2018) AI4People non-maleficence principle; Google AI Principles (2018) — applications Google will not pursue; QIF GUARDRAILS.md G7.

---

## Part III: What Exists Today

This proposal does not exist in a vacuum. The following frameworks, principles, and regulations inform its construction. AI security ethics for BCIs must build on what has been established, not reinvent it.

### Regulatory Frameworks

| Framework | Year | Scope | Key Contribution |
|-----------|------|-------|-----------------|
| EU AI Act (Regulation 2024/1689) | 2024 | Binding law, 27 EU member states | Risk-tiered regulation; Article 14 human oversight requirements; prohibition of social scoring and real-time biometric surveillance |
| UNESCO Recommendation on AI Ethics | 2021 | 193 member states (non-binding) | 10 principles including human oversight, transparency, multi-stakeholder governance |
| OECD AI Principles | 2019/2024 | 46 OECD countries + G20 | 5 values-based principles; 2024 update addresses generative AI |
| NIST AI RMF 1.0 | 2023 | US voluntary standard | Govern-Map-Measure-Manage lifecycle; operational risk framework |
| China Generative AI Interim Measures | 2023 | Binding, PRC | First binding generative AI regulation globally |
| Chile Law 21.383 | 2021 | Binding, Chile | First national neurorights legislation; constitutional protection of neural data |
| US MIND Act (S.2925) | 2025 | Proposed, US Senate | Management of Individuals' Neural Data Act. Directs FTC to study neural data governance gaps, covers both implanted BCIs and wearable neurotech, defines neural data broadly including inferred cognitive/emotional states. Introduced by Senators Schumer, Cantwell, Markey |
| US Executive Order 14110 | 2023 | Executive action (revoked Jan 2025) | Foundation model notification and safety testing requirements; informed NIST AI 600-1 |

### Industry Principles

| Source | Year | Key Principle |
|--------|------|---------------|
| Google AI Principles | 2018 | Four prohibited applications including weapons and surveillance |
| Microsoft Responsible AI Standard v2 | 2022 | Operationalized six principles into engineering requirements |
| Anthropic RSP | 2023 | AI Safety Level gating — capabilities require corresponding safeguards |
| OpenAI Charter | 2018 | AGI must benefit all of humanity; cooperative orientation |
| Partnership on AI | 2016 | Multi-stakeholder forum; 100+ partners across sectors |

### Academic Foundations

| Work | Year | Contribution |
|------|------|-------------|
| Asimov, *I, Robot* | 1950 | Three Laws of Robotics — the original thought experiment |
| Asilomar AI Principles | 2017 | 23 principles; coined "value alignment" and "beneficial AI" |
| Montreal Declaration | 2018 | 10 principles developed through participatory citizen process |
| Floridi et al., AI4People | 2018 | Five principles (beneficence, non-maleficence, autonomy, justice, explicability) |
| IEEE EAD1e | 2019 | Most technically detailed ethics framework from an engineering body |
| Jobin, Ienca & Vayena | 2019 | Meta-survey of 84 AI ethics guidelines; identified convergence on 5 themes |
| Shneiderman, HCAI | 2020 | High human control + high automation are not in tension |
| Brynjolfsson, "The Turing Trap" | 2022 | AI should augment humans, not replace them |
| WHO AI for Health Guidance | 2021 | Six health-specific AI ethics principles |

### Human Oversight Literature

| Work | Year | Key Insight |
|------|------|-------------|
| Cummings, Automation Bias | 2004 | Humans over-rely on automated systems; oversight requires active design |
| Rahwan, Society-in-the-Loop | 2018 | Individual HITL is insufficient; societal-level governance needed |
| Rahwan et al., Machine Behaviour | 2019 | AI systems must be studied empirically, like organisms in an ecosystem |
| de Sio & van den Hoven, Meaningful Human Control | 2018 | Operationalized "meaningful" as awareness + ability + accountability |

### Neuroethics Constraints

| Constraint | Source | What It Prevents |
|------------|--------|-----------------|
| Neuromodesty | Morse (2006/2011) | Overclaiming what neuroscience can prove about cognition |
| Reverse Inference Fallacy | Poldrack (2006) | Assuming brain activation uniquely identifies a mental state |
| Neurorealism Triad | Racine & Illes (2005) | Brain images making claims feel more scientific than they are |
| Anti-Inflationism | Ienca (2021), Bublitz (2022) | Inventing new rights when existing ones may suffice |
| Conceptual Underspecification | Kellmeyer (2022) | Using "mental privacy" as if it has an agreed definition |
| Brain Reading Limits | Ienca (2018), Wexler (2019) | Implying BCIs can "read thoughts" |
| Dual-Use Trap | Tennison & Moreno (2012) | Security framing enabling surveillance |
| Statistical Inflation | Vul et al. (2009), Eklund et al. (2016) | Treating neuroimaging correlations as strong causal evidence |

---

## Part IV: Open Questions

This document proposes principles. It does not answer every question those principles raise. The following remain open and require broader human and AI involvement to resolve:

1. **Who decides what "authorized" means?** The Second Law requires AI to follow authorized human operators. In a healthcare context, is the authorized operator the patient, the clinician, the device manufacturer, or the regulator? What happens when their instructions conflict?

2. **How do you enforce consent across jurisdictions?** Chile has neurorights legislation. The EU has the AI Act. The US has no federal neural data protection. A BCI user crossing borders carries their neural data with them. Whose consent architecture applies?

3. **What is the minimum viable human oversight?** Article 14 of the EU AI Act requires human oversight for high-risk AI. But real-time BCI processing happens in milliseconds. Meaningful human oversight cannot mean a human approves every signal. Where is the line between oversight and rubber-stamping?

4. **Can AI systems hold each other accountable?** If multiple AI systems operate in a neural security stack, and one detects that another is behaving anomalously, what authority does it have to intervene? Does the Third Law (self-preservation to protect users) extend to shutting down a compromised peer? This intersects with the classic "off-switch problem" (Hadfield-Menell et al., 2017): an AI optimizing for user safety might resist its own shutdown if it calculates that shutdown leaves the user unprotected.

5. **How do we prevent ethical drift?** Principles erode. Exceptions accumulate. "Just this once" becomes "standard practice." How do we build systems — technical and institutional — that resist the slow degradation of ethical constraints over time?

6. **What role should AI play in its own governance?** This document was drafted with AI assistance. Future versions should involve more AI systems and more humans. But should AI systems have a formal role in proposing, reviewing, or enforcing ethical guidelines that govern their own behavior? And if so, who watches the watchers?

---

## Part V: How This Document Was Made

This proposal was drafted by Kevin Qi with the assistance of three AI systems:

- **Claude** (Anthropic) — primary drafting, research synthesis, neuroethics integration
- **Gemini** (Google) — review pass for tone, credibility, and completeness. Gemini identified the neural data involuntariness nuance, flagged the consent revocation technical gap, and recommended the off-switch problem reference
- **ChatGPT** (OpenAI) — review pass for legal and structural rigor. ChatGPT identified the need for a Legal Status section, emergency exception framework, continuity-of-protection narrowing for lawful shutdowns, and advisory-only qualification on AI governance involvement

The neuroethics constraints (Part III) are drawn from published peer-reviewed literature. The BCI-specific principles (Part II) are proposed by the QIF project and have not been independently peer-reviewed or adopted by any standards body.

This document needs:
- **More human involvement** — ethicists, clinicians, patients, disability advocates, legislators, security researchers, and people who use BCIs daily
- **More AI involvement** — as AI systems become more capable, their perspective on the constraints that govern them becomes increasingly relevant. AI input on its own governance is advisory, not determinative; human authority over final decisions is preserved
- **Formal review** — by legal scholars, standards bodies (IEEE, ISO, NIST), and neuroethics review boards
- **Living revision** — this is version 0.1. It will change. That is by design.

---

## References

Asimov, I. (1950). *I, Robot*. Gnome Press.

Bai, Y. et al. (2022). Constitutional AI: Harmlessness from AI Feedback. arXiv:2212.08073.

Brynjolfsson, E. (2022). The Turing Trap: The Promise & Peril of Human-Like Artificial Intelligence. *Daedalus*, 151(2), 272–287. DOI: 10.1162/daed_a_01915

Cummings, M.L. (2004). Automation Bias in Intelligent Time Critical Decision Support Systems. AIAA 1st Intelligent Systems Technical Conference. DOI: 10.2514/6.2004-6313

de Sio, F.S. & van den Hoven, J. (2018). Meaningful Human Control over Autonomous Systems: A Philosophical Account. *Frontiers in Robotics and AI*, 5, 15. DOI: 10.3389/frobt.2018.00015

Eklund, A. et al. (2016). Cluster failure: Why fMRI inferences for spatial extent have inflated false-positive rates. *PNAS*, 113(28), 7900–7905. DOI: 10.1073/pnas.1602413113

Floridi, L. et al. (2018). AI4People—An Ethical Framework for a Good AI Society. *Minds and Machines*, 28(4), 689–707. DOI: 10.1007/s11023-018-9482-5

Hadfield-Menell, D. et al. (2017). The Off-Switch Game. *Proceedings of the 26th International Joint Conference on Artificial Intelligence (IJCAI-17)*, 220–227.

Ienca, M. & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5. DOI: 10.1186/s40504-017-0050-1

Jobin, A., Ienca, M. & Vayena, E. (2019). The global landscape of AI ethics guidelines. *Nature Machine Intelligence*, 1(9), 389–399. DOI: 10.1038/s42256-019-0088-2

Kellmeyer, P. (2022). Neurorights: a human rights-based approach for governing neurotechnologies. In *The Cambridge Handbook of Responsible Artificial Intelligence*. Cambridge University Press.

Morse, S.J. (2006). Brain Overclaim Syndrome and Criminal Responsibility. *Ohio State Journal of Criminal Law*, 3, 397–412.

Poldrack, R.A. (2006). Can cognitive processes be inferred from neuroimaging data? *Trends in Cognitive Sciences*, 10(2), 59–63. DOI: 10.1016/j.tics.2005.12.004

Racine, E. & Illes, J. (2005). Neuroethics. In *Encyclopedia of Science, Technology, and Ethics*. Macmillan Reference.

Rahwan, I. (2018). Society-in-the-Loop: Programming the Algorithmic Social Contract. *Ethics and Information Technology*, 20(1), 5–14.

Rahwan, I. et al. (2019). Machine behaviour. *Nature*, 568(7753), 477–486. DOI: 10.1038/s41586-019-1138-y

Shneiderman, B. (2020). Human-Centered Artificial Intelligence: Reliable, Safe & Trustworthy. *International Journal of Human-Computer Interaction*, 36(6), 495–504. DOI: 10.1080/10447318.2020.1741118

Tennison, M.N. & Moreno, J.D. (2012). Neuroscience, Ethics, and National Security: The State of the Art. *PLoS Biology*, 10(3), e1001289. DOI: 10.1371/journal.pbio.1001289

Vul, E. et al. (2009). Puzzlingly High Correlations in fMRI Studies of Emotion, Personality, and Social Cognition. *Perspectives on Psychological Science*, 4(3), 274–290. DOI: 10.1111/j.1745-6924.2009.01125.x

World Health Organization. (2021). *Ethics and governance of artificial intelligence for health: WHO guidance*. WHO: Geneva. ISBN: 9789240029200.

---

*This document is open. Fork it, challenge it, improve it. The only wrong move is to build neural AI systems without asking these questions first.*

---

## Related Projects

- **[AI-rchives](https://github.com/kevinqicode/ai-rchives)** — Human-AI collaboration for recovering lost internet artifacts. A companion project exploring ethical AI partnerships in practice: how humans and AI work together transparently, with clear attribution and shared credit. The collaboration model used in AI-rchives informs the principles in this document.
