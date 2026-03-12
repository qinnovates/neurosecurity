---
title: "AI Ethics: Principles, Frameworks, and the Governance of Artificial Intelligence"
---

# AI Ethics: Principles, Frameworks, and the Governance of Artificial Intelligence

> **A comprehensive reference for understanding AI ethics — its origins, core principles, global regulatory landscape, key institutions, open problems, and direct implications for brain-computer interface security architecture.**

**Author:** Kevin Qi
**Date:** 2026-03-11
**Status:** Living Document
**Companion to:** QIF-WHITEPAPER-V8-DRAFT.md, QIF-GOVERNANCE-QUESTIONS.md, QIF-NEUROETHICS.md
**See also:** [AI-instructions.md](../AI-instructions.md) — operational AI conduct principles that govern how AI systems behave within this project

---

## Table of Contents

- [Part I: The Principles That Started It All](#part-i-the-principles-that-started-it-all)
  - [The Origin Story](#the-origin-story)
  - [The Core Principles (Cross-Framework Convergence)](#the-core-principles)
- [Part II: Global Regulatory Landscape](#part-ii-global-regulatory-landscape)
  - [International Frameworks](#international-frameworks)
  - [United States Federal](#united-states-federal)
  - [European Union](#european-union)
  - [National Frameworks](#national-frameworks)
  - [Industry Self-Regulation](#industry-self-regulation)
  - [Medical and Health AI](#medical-and-health-ai)
- [Part III: Key Concepts in AI Ethics](#part-iii-key-concepts-in-ai-ethics)
  - [Algorithmic Bias and Fairness](#1-algorithmic-bias-and-fairness)
  - [Explainability and Interpretability](#2-explainability-and-interpretability-xai)
  - [AI Alignment](#3-ai-alignment)
  - [Hallucination](#4-hallucination)
  - [The Black Box Problem](#5-the-black-box-problem)
  - [Autonomous Decision-Making](#6-autonomous-decision-making)
  - [Data Privacy and AI](#7-data-privacy-and-ai)
  - [Dual-Use](#8-dual-use)
  - [Environmental Impact](#9-environmental-impact)
- [Part IV: Open Problems for BCI + AI](#part-iv-open-problems-for-bci--ai)
  - [Neurorights](#neurorights)
  - [Disability, Accessibility, and the Right to Repair](#disability-accessibility-and-the-right-to-repair)
  - [Neural Data as the Most Intimate Data](#10-neural-data-as-the-most-intimate-data)
  - [AI-Mediated Perception](#11-ai-mediated-perception)
  - [Adaptive Algorithms and Drift](#12-adaptive-algorithms-and-drift)
  - [Consent for AI Learning from Neural Patterns](#13-consent-for-ai-learning-from-neural-patterns)
  - [AI as Intermediary for Thought](#14-ai-as-intermediary-for-thought-subvocalization)
- [Part V: Research Centers and Institutions](#part-v-research-centers-and-institutions)
  - [Academic Institutions](#academic-institutions)
  - [Government and Intergovernmental Bodies](#government-and-intergovernmental-bodies)
  - [Civil Society and Think Tanks](#civil-society-and-think-tanks)
- [Part VI: Key Controversies and Turning Points](#part-vi-key-controversies-and-turning-points)
- [Part VII: Seminal Papers](#part-vii-seminal-papers)
- [Part VIII: Why This Matters for QIF](#part-viii-why-this-matters-for-qif)

---

## Part I: The Principles That Started It All

### The Origin Story

AI ethics did not start with a policy document. It started with a science fiction writer, a mathematician, and a computer scientist who each saw something dangerous in the machines they were helping to create.

#### 1942 — Asimov's Three Laws of Robotics

Isaac Asimov published "Runaround" in *Astounding Science Fiction* (March 1942), introducing the Three Laws:

1. A robot may not injure a human being or, through inaction, allow a human being to come to harm.
2. A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.
3. A robot must protect its own existence as long as such protection does not conflict with the First or Second Law.

These laws are fiction, not engineering. But they are foundational because Asimov spent the next four decades writing stories that demonstrated exactly how rule-based AI ethics produces irresolvable edge cases. Every story is a proof by counterexample: the laws sound clean and the failures are always in the gaps between them. The same insight haunts modern AI alignment research.

#### 1948/1950 — Wiener's Cybernetics and "The Human Use of Human Beings"

Norbert Wiener — the MIT mathematician who founded cybernetics while designing antiaircraft targeting systems during WWII — published *Cybernetics: Or Control and Communication in the Animal and the Machine* in 1948, establishing the mathematical foundations of feedback systems. Two years later, *The Human Use of Human Beings* (1950) translated those ideas into their moral implications: automation could harm society through dehumanization, and the humans who design feedback systems bear moral responsibility for their outcomes. Written half a century before the algorithm age, it directly anticipated the accountability and human-in-the-loop principles that every modern framework now espouses.

> Wiener, N. (1948). *Cybernetics: Or Control and Communication in the Animal and the Machine*. MIT Press.
> Wiener, N. (1950). *The Human Use of Human Beings: Cybernetics and Society*. Houghton Mifflin.

#### 1976 — Weizenbaum's "Computer Power and Human Reason"

Joseph Weizenbaum created ELIZA in 1966 — the first chatbot, a simple pattern-matching program that mimicked a Rogerian therapist. He was shaken when users formed genuine emotional attachments to a program he knew was empty. His 1976 book argued that there are things computers *ought not* to be made to do even if they can — and that delegating morally significant decisions to machines is a form of moral abdication. The first major insider critique of the AI field.

> Weizenbaum, J. (1976). *Computer Power and Human Reason: From Judgment to Calculation*. W.H. Freeman.

#### 1980 — Winner's "Do Artifacts Have Politics?"

Before algorithmic bias had a name, political scientist Langdon Winner argued that technologies are never neutral — they embed social and political choices. His examples: Robert Moses designed Long Island overpasses too low for buses, effectively excluding public-transit-dependent communities (predominantly Black and poor). Winner's framework — that artifacts carry politics — is the intellectual ancestor of modern algorithmic fairness research. Every AI system embeds value choices in its architecture. The question is whether those choices are deliberate and disclosed.

> Winner, L. (1980). "Do Artifacts Have Politics?" *Daedalus*, 109(1), 121-136.

#### 2017 — The Asilomar AI Principles

The modern AI ethics movement consolidated at the Beneficial AI Conference in January 2017, organized by the Future of Life Institute (founded by MIT physicist Max Tegmark, Skype co-founder Jaan Tallinn, and physicist Anthony Aguirre). One hundred researchers from AI, economics, law, ethics, and philosophy produced 23 principles covering research issues, ethics and values, and longer-term concerns. Named deliberately after the 1975 Asilomar Conference on Recombinant DNA — scientists voluntarily pausing dangerous research.

Signed by 1,797 AI/robotics researchers and 3,923 others, including Demis Hassabis, Yoshua Bengio, and Yann LeCun.

The 23 principles cover:

**Research Issues (1-5):** Goal of beneficial intelligence, funding for safety research, science-policy link, cooperative culture, race avoidance.

**Ethics and Values (6-18):** Safety, failure transparency, judicial transparency, responsibility, value alignment, human values, personal privacy, liberty, shared benefit, shared prosperity, human control, non-subversion, AI arms race avoidance.

**Longer-term (19-23):** Capability caution, importance of planning, catastrophic risk mitigation, recursive self-improvement safeguards, common good as the standard for superintelligence.

> URL: https://futureoflife.org/open-letter/ai-principles/

#### 2018 — The Montreal Declaration for Responsible AI

Launched December 4, 2018, after one year of consultations involving 100+ ethicists and tech professionals plus broad citizen engagement. Ten principles: well-being, respect for autonomy, protection of privacy and intimacy, solidarity, democratic participation, equity, diversity and inclusion, prudence, responsibility, and sustainable development. Notable for its participatory, citizen-inclusive drafting process.

> URL: https://montrealdeclaration-responsibleai.com/

#### 2019 — IEEE Ethically Aligned Design (First Edition)

The most technically detailed of the major ethics frameworks. Three years of global expert consultation. Eight general principles: human rights, well-being, data agency, effectiveness, transparency, accountability, awareness of misuse, and competence. Covers specific domains including embedding values in design, autonomous weapons, personal data, mixed-reality, and AI and the law.

> URL: https://ethicsinaction.ieee.org/

#### 2019 — The Beijing AI Principles

China's entry into AI governance. Released May 25, 2019 by the Beijing Academy of Artificial Intelligence (BAAI) with Peking University, Tsinghua University, and industry signatories including Baidu, Alibaba, and Tencent. Fifteen principles covering R&D, use, and governance. Significant as the first major non-Western government-adjacent AI ethics framework.

> URL: https://www-pre.baai.ac.cn/news/beijing-ai-principles-en.html

#### 2020 — The Vatican's Rome Call for AI Ethics

Signed February 28, 2020, by IBM, Microsoft, FAO, the European Parliament, and Italy's Minister of Innovation, under the sponsorship of Pope Francis. Six principles: transparency, inclusion, responsibility, impartiality, reliability, security/privacy. Notable as the first significant faith-institution entry into AI governance — framing AI ethics as human dignity, not just risk management.

> URL: https://www.romecall.org/the-call/

---

### The Core Principles

Across 84+ frameworks analyzed (Jobin, Ienca & Vayena 2019), the same principles converge. The table below maps the five most widely adopted frameworks:

| Principle | UNESCO (2021) | OECD (2019) | NIST AI RMF (2023) | EU AI Act (2024) | IEEE EAD (2019) |
|-----------|:---:|:---:|:---:|:---:|:---:|
| **Transparency / Explainability** | Yes | Yes | Yes | Yes | Yes |
| **Fairness / Non-discrimination** | Yes | Yes | Yes | Yes | Yes |
| **Accountability** | Yes | Yes | Yes | Yes | Yes |
| **Safety / Robustness** | Yes | Yes | Yes | Yes | Yes |
| **Privacy** | Yes | Yes | Yes | Yes | Yes |
| **Human Oversight** | Yes | Yes | Yes | Yes | Yes |
| **Beneficence / Do No Harm** | Yes | Yes | Yes | Yes | Yes |
| **Autonomy Preservation** | Yes | Yes | Partial | Yes | Yes |

**The convergence is real. The divergence is in implementation.** Every framework agrees on what to value. They disagree sharply on how to enforce it — voluntary vs. binding, self-regulation vs. government mandates, principle-based vs. rule-based. This is the gap QIF addresses for neural interfaces: operationalizing principles as kernel-level enforcement.

**Key tensions identified across frameworks** (Jobin et al. 2019; Mittelstadt 2019):
- Transparency vs. privacy (explaining AI decisions may expose training data)
- Individual autonomy vs. collective safety
- Innovation vs. precautionary principle
- Principles converge globally on *what* to value but diverge on *how* to implement

---

## Part II: Global Regulatory Landscape

### International Frameworks

#### UNESCO Recommendation on the Ethics of AI (2021)

The first global normative instrument on AI ethics. Adopted unanimously by all 194 member states on November 23, 2021.

**Four Core Values:** (1) Human rights and dignity, (2) Peaceful, just, interconnected societies, (3) Diversity and inclusiveness, (4) Environment and ecosystem flourishing.

**Ten Core Principles:** Proportionality and do no harm; Safety and security; Fairness and non-discrimination; Sustainability; Privacy and data protection; Human oversight and determination; Transparency and explainability; Responsibility and accountability; Awareness and literacy; Multi-stakeholder and adaptive governance.

**Eleven Policy Areas:** Ethical impact assessment, governance and stewardship, data policy, development cooperation, environment, gender, culture, education and research, communication and information, economy and labour, health and social well-being.

**Enforcement:** Voluntary. UNESCO conducts readiness assessments and implementation reviews.

> URL: https://www.unesco.org/en/artificial-intelligence/recommendation-ethics
> Full text: https://unesdoc.unesco.org/ark:/48223/pf0000380455

#### UNESCO First Global Framework on Neurotechnology Ethics (November 2025)

Adopted November 12, 2025 at the 43rd session of the General Conference. Directly addresses the governance of devices that read and write neural data. The closest existing international instrument to what QIF proposes at the technical level.

> URL: https://www.unesco.org/en/articles/unesco-adopts-first-ever-global-framework-ethics-neurotechnology

#### OECD AI Principles (2019, updated 2024)

Endorsed by 47 countries. Basis for the G20 AI Principles.

**Five Values-Based Principles:** (1) Inclusive growth, sustainable development, and well-being, (2) Respect for rule of law, human rights, and democratic values, (3) Transparency and explainability, (4) Robustness, security, and safety, (5) Accountability.

**Five Recommendations for Governments:** Invest in AI R&D, foster digital ecosystems, shape enabling policy, build human capacity, cooperate internationally.

**2024 Update:** Strengthened language on safety, privacy, IP rights, information integrity, and general-purpose/generative AI.

> URL: https://oecd.ai/en/ai-principles

#### Council of Europe Framework Convention on AI (2024)

**The first legally binding international treaty on AI.** Adopted May 17, 2024; entered into force November 1, 2025. Signed by 47 Council of Europe member states plus 11 non-member negotiating states including the US, Canada, Japan, Australia, and Israel.

Core obligations: legislative/administrative measures ensuring AI is consistent with human rights, democracy, and rule of law. Risk-based, graduated obligations. Requires procedural safeguards (right to explanation, human review, challenge mechanisms), discrimination prevention, data protection, transparency, and remedy for affected persons.

> URL: https://www.coe.int/en/web/artificial-intelligence/the-framework-convention-on-artificial-intelligence
> Full text: https://rm.coe.int/1680afae3c

#### G7 Hiroshima AI Process (2023)

International Code of Conduct for organizations developing advanced AI. Eleven key actions including red-teaming, vulnerability reporting, watermarking, content authentication, and technical standards for interoperability.

> URL: https://digital-strategy.ec.europa.eu/en/library/hiroshima-process-international-code-conduct-advanced-ai-systems

**Enforcement Taxonomy:**

| Framework | Binding? | Enforcement Mechanism | Penalties |
|-----------|----------|----------------------|-----------|
| UNESCO AI (2021) | No | Readiness assessments, peer review | None |
| UNESCO Neurotech (2025) | No | General Conference reporting | None |
| OECD AI Principles (2019) | No | Country reviews, AI Policy Observatory tracking | None |
| Council of Europe Convention (2024) | **Yes** | Treaty obligations, domestic implementation | Varies by signatory |
| G7 Hiroshima Code of Conduct (2023) | No | Voluntary compliance, peer pressure | None |
| EU AI Act (2024) | **Yes** | National supervisory authorities, EU AI Office | Up to 7% global revenue |
| China GenAI Measures (2023) | **Yes** | Cyberspace Administration of China | Service shutdown, fines |

---

### United States Federal

#### NIST AI Risk Management Framework 1.0 (January 2023)

The most comprehensive US federal AI governance instrument. Voluntary but increasingly referenced as a compliance safe harbor in legislation.

**Four Core Functions:**
- **GOVERN** — Policies, accountability, culture, organizational context
- **MAP** — Identify and categorize system context and risks
- **MEASURE** — Analyze and assess risks using quantitative/qualitative methods
- **MANAGE** — Allocate resources and implement risk response plans

**Seven Properties of Trustworthy AI:** Accountable, explainable, interpretable, fair with managed bias, privacy-enhanced, reliable, safe, secure and resilient, transparent.

> URL: https://www.nist.gov/itl/ai-risk-management-framework
> PDF: https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf

#### NIST AI 600-1: Generative AI Profile (July 2024)

Companion to AI RMF 1.0, addressing 12 risk categories specific to generative AI: CBRN, confabulation (hallucination), data privacy, data provenance, harmful bias, human-AI configuration, information integrity, information security, intellectual property, obscene content, societal impacts, and value chain integration. 200+ specific suggested actions.

> PDF: https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf

#### Blueprint for an AI Bill of Rights (October 2022)

Five principles: (1) Safe and effective systems, (2) Algorithmic discrimination protections, (3) Data privacy, (4) Notice and explanation, (5) Human alternatives, consideration, and fallback. Non-binding. Superseded in practice by the Trump administration's policy direction.

> URL: https://bidenwhitehouse.archives.gov/ostp/ai-bill-of-rights/

#### Executive Orders

**Biden EO 14110** (October 2023): The most comprehensive US federal AI directive. Required red-teaming results shared with government, watermarking standards, privacy-preserving techniques in procurement. 50+ agencies, 100+ actions. **Revoked January 20, 2025.**

**Trump EO 14179** (January 2025): Revoked Biden EO. Policy goal: "sustain and enhance America's global AI dominance." Directed development of an AI Action Plan.

**Trump National Policy Framework EO** (December 2025): Establishes uniform federal standard to preempt conflicting state AI laws. Contains preemption carve-outs for: protecting children, preventing censorship, respecting copyright, and safeguarding communities (these are areas where the federal framework explicitly limits state regulatory action).

---

### European Union

#### EU AI Act (2024)

**The world's first comprehensive AI law.** Entered into force August 1, 2024. Fully applicable August 2, 2026.

**Risk Tier Structure:**

| Tier | Requirements | Timeline |
|------|-------------|----------|
| **Unacceptable (Prohibited)** | Banned outright: subliminal manipulation, exploitation of vulnerabilities, social scoring, real-time biometric surveillance (with exceptions), emotion recognition in workplace/education, predictive policing from biometrics, facial recognition scraping | February 2, 2025 |
| **High Risk** | Conformity assessment, risk management, data governance, technical documentation, logging, transparency, human oversight, accuracy/robustness/cybersecurity | August 2, 2026 |
| **Limited Risk** | Transparency obligations: chatbots must disclose they are AI, deepfakes must be labeled | August 2, 2026 |
| **Minimal Risk** | No mandatory obligations | — |
| **GPAI Models** | Technical documentation, training data summaries, copyright compliance; systemic-risk GPAI (>10^25 FLOPs): adversarial testing, incident reporting, cybersecurity | August 2, 2025 |

**High-risk domains (Annex III):** Critical infrastructure, education, employment, essential services, law enforcement, migration, justice administration, biometric identification.

**Penalties:** Up to €35M or 7% of global annual revenue (prohibited practices); €15M or 3% (high-risk violations); €7.5M or 1.5% (incorrect information).

**BCI relevance:** Neural interfaces that use AI for stimulation decisions would almost certainly be classified as high-risk under this framework.

> URL: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai

#### EU AI HLEG Ethics Guidelines for Trustworthy AI (2019)

The conceptual foundation for the EU AI Act. Seven key requirements: (1) Human agency and oversight, (2) Technical robustness and safety, (3) Privacy and data governance, (4) Transparency, (5) Diversity, non-discrimination, and fairness, (6) Societal and environmental well-being, (7) Accountability.

> URL: https://digital-strategy.ec.europa.eu/en/library/ethics-guidelines-trustworthy-ai

---

### National Frameworks

| Country | Framework | Date | Status | Key Feature |
|---------|-----------|------|--------|-------------|
| **China** | New Generation AI Governance Principles | 2019 | Non-binding | 8 principles; harmony, controllability, agile governance |
| **China** | Generative AI Interim Measures | Aug 2023 | Binding | First country with binding GenAI regulation; content alignment requirements |
| **Singapore** | Model AI Governance Framework (2nd ed.) | 2020 | Voluntary | AI Verify: first government-developed AI governance testing toolkit |
| **Japan** | Social Principles of Human-Centric AI | 2019 | Non-binding | 7 principles; dignity, diversity, sustainability |
| **South Korea** | Framework Act on AI | Jan 2026 | Binding | First comprehensive AI law in Asia-Pacific |
| **Canada** | Directive on Automated Decision-Making | 2019 | Binding (federal) | 4-level algorithmic impact assessment; Canada also launched CAISI (Nov 2024) |
| **Australia** | AI Ethics Principles | 2019 | Voluntary | 8 principles including contestability; moving toward mandatory guardrails |
| **Brazil** | AI Bill (PL 2338/2023) | Pending | Proposed | EU AI Act-influenced risk tiers; passed Senate Dec 2024, awaiting Chamber |
| **India** | NITI Aayog Responsible AI Principles | 2021 | Non-binding | 7 principles; emphasis on inclusive growth and digital sovereignty |
| **African Union** | AU AI Continental Strategy | 2024 | Non-binding | Pan-African AI governance; emphasizes Ubuntu ethics (communal well-being over individualism) |

---

### Industry Self-Regulation

| Organization | Framework | Date | Key Feature |
|-------------|-----------|------|-------------|
| **Google** | AI Principles | 2018 | 7 principles + 4 prohibited uses; published after Project Maven controversy |
| **Microsoft** | Responsible AI Standard v2 | 2022 | 6 principles; binding internal standard with engineering requirements |
| **Anthropic** | Responsible Scaling Policy (RSP) v3.0 | 2023–present | AI Safety Levels (ASL 1-4) modeled on biosafety levels; ASL-3 activated for Claude Opus 4 |
| **Partnership on AI** | Tenets | 2016 | 100+ members; ethics, fairness, transparency, collaboration |
| **Asilomar** | 23 AI Principles | 2017 | 1,797 researcher signatures; race avoidance, common good |
| **IEEE** | Ethically Aligned Design | 2019 | 8 principles; most technically detailed framework |

---

### Medical and Health AI

#### WHO Guidance on Ethics and Governance of AI for Health (2021)

Six core principles: (1) Protect autonomy, (2) Promote well-being and safety, (3) Ensure transparency and explainability, (4) Foster responsibility and accountability, (5) Ensure inclusiveness and equity, (6) Promote responsive and sustainable AI.

> URL: https://www.who.int/publications/i/item/9789240029200

#### FDA AI/ML-Based Software as Medical Device (SaMD) Framework

Core regulatory concept: **Predetermined Change Control Plan (PCCP)** — manufacturers pre-specify the types of modifications the AI can undergo and the methodology for assessing risks. Allows AI devices to learn and adapt within predetermined guardrails without new regulatory submissions for each update.

Ten Good Machine Learning Practice (GMLP) principles finalized by IMDRF in January 2025 (harmonized across FDA, Health Canada, UK MHRA, TGA Australia, and others).

> URL: https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-software-medical-device

---

## Part III: Key Concepts in AI Ethics

### 1. Algorithmic Bias and Fairness

Algorithmic bias occurs when a model systematically produces unfair outcomes for a group defined by a protected characteristic. Bias enters through six pathways: **historical** (training data reflects past discrimination), **representation** (undersampled groups), **measurement** (biased proxy labels), **aggregation** (one model for heterogeneous populations), **evaluation** (benchmark doesn't represent deployment population), **deployment** (model used beyond its training distribution).

**The Impossibility Theorems.** Kleinberg, Mullainathan, and Raghavan (2016) proved that no classifier can simultaneously satisfy calibration, balance for the negative class, and balance for the positive class — unless base rates are identical across groups or the classifier is perfect. Chouldechova (2017) independently proved the same incompatibility. These are not engineering failures. They are mathematical facts about the structure of fairness.

**Critical scholars:** Ruha Benjamin (*Race After Technology*, 2019) introduced the concept of the "New Jim Code" — technology that reproduces existing inequities under the guise of objectivity. Safiya Umoja Noble (*Algorithms of Oppression*, 2018) documented racial and gender bias in search engine results. Virginia Eubanks (*Automating Inequality*, 2018) traced how automated systems target and punish poor communities. Cathy O'Neil (*Weapons of Math Destruction*, 2016) cataloged how opaque algorithmic models amplify inequality at scale. Abeba Birhane (Trinity College Dublin / Mozilla) has argued that large-scale datasets inherently encode societal biases and that the dataset auditing paradigm is insufficient.

**Key cases:** COMPAS recidivism algorithm (ProPublica 2016), Gender Shades facial recognition disparity (Buolamwini & Gebru 2018), Amazon hiring tool downranking "women's" (2018).

**BCI relevance:** NISS scoring is a fairness-adjacent problem. If impact scoring uses population-level data, aggregation bias may systematically underestimate risk to atypical users with altered neural baselines.

### 2. Explainability and Interpretability (XAI)

**Interpretability** is a property of the model itself (a decision tree is inherently interpretable). **Explainability** is a property of a post-hoc method (LIME or SHAP attaches an explanation to an opaque model). Post-hoc explanations can be unfaithful — describing an approximation that diverges from the actual computation.

**LIME** (Ribeiro et al. 2016): fits a locally linear model around a specific prediction. Model-agnostic but unstable.

**SHAP** (Lundberg & Lee 2017): Shapley values from cooperative game theory. The unique allocation satisfying efficiency, symmetry, linearity, and dummy axioms. Provides both local and global explanations.

**The accuracy-interpretability tradeoff** is real but overstated. Rudin (2019) argues that for tabular data with engineered features, interpretable models achieve performance within percentage points of black-box models.

**BCI relevance:** If the Neural Firewall blocks a stimulation pattern but cannot explain why, it is clinically problematic and likely non-compliant with GDPR Article 22. QIF must specify explainability requirements for all automated blocking decisions.

### 3. AI Alignment

The problem of ensuring AI pursues goals that are actually beneficial to humans, not proxy goals that happen to be easy to specify. Stuart Russell frames it: the dominant paradigm — specify a fixed objective, train to maximize it — is fundamentally unsafe at scale because we cannot fully specify human values.

**Reward hacking:** optimizer finds and exploits gaps between the reward signal and the true objective. **Specification gaming:** agent satisfies the literal specification while violating the intent (60+ documented examples, Krakovna et al. 2020). **Goodhart's Law:** "When a measure becomes a target, it ceases to be a good measure."

**BCI relevance:** If a BCI's adaptive AI optimizes a proxy metric (patient-reported comfort), it may drift from the actual clinical objective (accurate sensory representation). This is Goodhart's Law applied to a medical device. NSP's requirement for explicit reconsent on learned behavioral updates is a corrigibility mechanism.

### 4. Hallucination

LLMs generate text by predicting the next most probable token. Hallucination is the generation of plausible-sounding but factually incorrect output. **It is not intentional.** The model has no representation of truth — only token probability.

Three causes: (1) **Knowledge gaps** — correct answer absent in training data, model fills with statistically plausible completion, (2) **Compulsive completion** — autoregressive architecture optimizes for fluency over factual consistency, (3) **RLHF misalignment** — human raters prefer confident responses over hedged ones, training models to sound confident when they are not.

**Mitigations:** RAG (grounding in retrieved documents), chain-of-thought prompting, Constitutional AI (self-critique against principles), calibration training.

**BCI relevance:** A neural device that provides incorrect stimulation parameters because an AI was "confident" is not a software bug — it is malpractice. The system must say "I don't know" when it does not know. See Design Principle #9 in QIF-WHITEPAPER-V8-DRAFT.md.

### 5. The Black Box Problem

Deep neural networks are deterministic but cognitively opaque — millions to billions of parameters in nonlinear composition with no closed-form decision boundary. GDPR Article 22 gives data subjects the right not to be subject to decisions "based solely on automated processing." The AI Act (2024) goes further, requiring conformity assessments and human oversight for high-risk systems.

**BCI relevance:** A Neurowall system that blocks stimulation based on an opaque classifier but cannot articulate which signal features triggered the block is both clinically problematic and legally exposed. Minimum requirement: the system must report which features deviated from baseline and by how much.

### 6. Autonomous Decision-Making

Three levels: **Human-in-the-loop (HITL)** — human approves each action, **Human-on-the-loop (HOTL)** — system acts autonomously, human can override, **Human-out-of-the-loop (HOOTL)** — fully autonomous.

**Automation bias** (Parasuraman & Manzey 2010): overreliance on automated systems, accepting AI recommendations without critical examination. Having a human "in the loop" does not guarantee meaningful oversight if automation bias reduces them to a rubber stamp.

**BCI relevance:** The NSP specification must encode which decisions require HITL (blocking decisions affecting therapy), HOTL (logging and alerting), and HOOTL (emergency amplitude cutoffs). The five-tier guardrail model operationalizes this.

### 7. Data Privacy and AI

**Model memorization:** Carlini et al. (2021) demonstrated that GPT-2 can reproduce verbatim training data including personal information. For medical AI trained on patient records, this is a HIPAA and patient safety issue.

**Differential privacy:** Mathematical guarantee that computation output is approximately the same whether or not any individual's data was included (Dwork et al. 2006). Applied to BCIs via federated learning with DP-protected model updates.

**Data poisoning:** Corrupting training data to cause malicious behavior. For BCIs, the attack surface is the calibration phase — injecting adversarial examples during calibration so the model classifies attacks as normal. A TARA-relevant attack vector.

**BCI relevance:** NSP should specify calibration integrity requirements: authenticated sessions, data provenance, anomalous pattern detection. Federated learning with DP is the recommended architecture for multi-patient neural learning.

### 8. Dual-Use

The same capability serves beneficial and harmful applications. The same computer vision that detects cancer can target faces for surveillance. QIF's TARA threat catalog exists to inform defense — but stripped of context, it is an offensive capability roadmap. Every threat description must be paired with a defensive control and governance constraint (Guardrail G7: Dual-Use Trap, from Tennison & Moreno 2012).

**Lethal Autonomous Weapons Systems (LAWS):** UN General Assembly adopted a resolution with 166 votes in favor (December 2024). The Campaign to Stop Killer Robots (270+ NGOs) advocates a preemptive ban.

### 9. Environmental Impact

Strubell, Ganesh, and McCallum (2019) quantified the carbon cost: training a single large transformer emits approximately 626,155 lbs CO2 equivalent (this figure has been disputed by Google's Jeff Dean and others as reflecting worst-case NAS pipeline costs rather than typical training; the precise number is contested but the order-of-magnitude concern is well-established). GPT-3: ~500-552 metric tons. Microsoft's AI products consumed 6.4M cubic meters of water in fiscal 2023 (34% increase YoY).

**BCI relevance:** An on-device Neural Firewall must be lightweight (compressed, quantized) for both power budget and environmental accountability. NSP's low-power design goal aligns with this.

---

## Part IV: Open Problems for BCI + AI

### Neurorights

Neurorights are proposed legal protections for the human mind in an era of neurotechnology. The concept was formalized by Rafael Yuste (Columbia University) and Sara Goering (University of Washington) in a 2017 *Nature* commentary calling for five new rights: (1) mental privacy, (2) personal identity, (3) free will, (4) fair access to cognitive enhancement, and (5) protection from algorithmic bias in neurotechnology.

**Epistemic note:** Whether neurorights require entirely new legal instruments or can be covered by extending existing human rights frameworks is actively debated (see Ienca 2021, Bublitz 2022 — anti-inflationism). QIF takes a pragmatic position: regardless of the legal mechanism, the technical architecture must enforce the protections these rights describe.

**Legislative milestones:** Chile amended its constitution in 2021 (the first country to constitutionally protect neurorights). Colorado (2024) and California (2024) classified neural data as sensitive personal information under state privacy law. Spain's Digital Rights Charter (2021) includes cognitive liberty provisions.

### Disability, Accessibility, and the Right to Repair

BCIs exist because disabled people need them. Any security framework that increases cost, complexity, or barriers to access for the primary patient population has failed its mission. Three critical tensions:

1. **The cochlear implant controversy.** The Deaf community has long debated cochlear implants as a technology that frames deafness as a deficit to be fixed rather than an identity to be respected. BCI security frameworks must not repeat this mistake — the patient's autonomy includes the right to refuse, modify, or remove the device.
2. **Crip technoscience** (Hamraie & Fritsch, 2019): disabled people should be designers of the technologies that affect their bodies, not passive recipients. QIF's patient-first design principle aligns with this, but the framework must go further — disability communities should be represented in standards governance.
3. **Right to repair.** Neural devices that lock patients into vendor-controlled ecosystems create a dependency that is ethically distinct from other medical devices — the device mediates cognition. The UN Convention on the Rights of Persons with Disabilities (CRPD), Article 12, recognizes equal legal capacity for persons with disabilities. A BCI architecture that restricts the patient's ability to inspect, modify, or replace their own device may conflict with CRPD principles.

**BCI relevance:** QIF's open architecture and patient audit rights are not just security features. They are accessibility features. Security through vendor lock-in is antithetical to disability justice.

### 10. Neural Data as the Most Intimate Data

Behavioral data reveals what you do. Genomic data reveals your heritage. **Neural data reveals what you are thinking and feeling in real time.** Three properties make it categorically different:

1. **Locus internus** — accesses the sphere historically protected as the last refuge of cognitive freedom
2. **Involuntary disclosure** — BCIs are always on; users cannot choose which thoughts to shield from recording electrodes
3. **Unforeseen inference** — data collected for motor decoding contains information usable for emotional state, neurological condition, political attitude

A 2024 Neurorights Foundation audit found that **96.7% of consumer neurotechnology companies reserve the right to share neural data with third parties.**

**Emerging legal landscape:** Chile's 2021 constitutional amendment (first). Colorado (2024) and California (2024) defined neural data as sensitive personal information. EU GDPR classifies biometric data as Article 9 special category. The trajectory is toward neural data as a distinct regulatory category above standard biometric data.

### 11. AI-Mediated Perception

When a cochlear implant's AI decides which frequencies to emphasize, the patient hears what the algorithm's model says they should hear. The AI is not a passive conduit — it is an active shaper of perceived reality. Errors in AI-mediated perception are not just technical failures; they are alterations of subjective experience.

**BCI relevance:** QIF's threat model must include AI pipeline compromise as a class distinct from direct signal attacks. NISS should score AI pipeline attacks on the same severity scale as electromagnetic attacks. AI model updates to deployed BCIs must be treated as safety-critical software updates.

### 12. Adaptive Algorithms and Drift

Adaptive BCIs continuously update their models as the patient's neural patterns evolve. This is clinically necessary — a non-adaptive BCI fails within weeks. But the model the patient consented to use is not the model running six months later.

**The consent gap:** If algorithm characteristics change through adaptive learning, the consent basis is eroded. Algorithmic drift constitutes a consent violation if the behavioral envelope shifts beyond what the patient agreed to.

**BCI relevance:** Drift is a TARA attack surface. An adversary who can influence calibration data can steer model drift without triggering threshold-based detectors. NSP's reconsent requirement for model updates is the architectural response. The coherence metric (Cs) should be evaluated as a time series, with drift rate as an anomaly signal.

### 13. Consent for AI Learning from Neural Patterns

When a BCI's AI learns from a patient's neural patterns, the resulting model is a learned representation of that patient's neural architecture. Who owns it? The patient who generated the data? The manufacturer who designed the algorithm? The hospital?

No jurisdiction has answered this definitively. The secondary use problem: a learned model of Patient A's neural mapping could train Patient B's decoder (beneficial) or build a population-level neural fingerprint database (deeply problematic).

**BCI relevance:** Derived neural models should be technically constrained to the generating patient with cryptographic separation preventing secondary use. NSP should include a model portability prohibition: derived models may not be transferred without explicit reconsent.

### 14. AI as Intermediary for Thought (Subvocalization)

Subvocal speech decoding captures motor commands to laryngeal muscles during silent rehearsal. Current capabilities: AlterEgo (MIT, 92% on limited vocabulary from EMG), Willett et al. (Stanford, 62 words/min on 125K-word vocabulary from motor cortex), Chang/Metzger et al. (UCSF, 1,024-word vocabulary with 74% accuracy for facial expression classification), EEG-based (60-80% on constrained tasks).

**The inner speech leakage problem:** The motor cortex targeted for speech decoding is active during inner monologue not intended for output. Kunz, Willett et al. (2025) decoded participants' internal counting during a separate task — they did not intend to communicate the numbers (Kunz et al., "A neural speech decoding framework leveraging deep learning and speech synthesis," *Cell*, August 14, 2025). This is unprecedented: no prior technology could systematically breach the boundary between thought and expression.

**BCI relevance:** Subvocalization interception is a high-severity TARA technique. NSP must include a "subvocal privacy gate" as mandatory for speech BCI systems claiming NSP compliance.

---

## Part V: Research Centers and Institutions

### Academic Institutions

| Institution | Center | Focus | Key People |
|-------------|--------|-------|------------|
| MIT | Media Lab — Ethics and Governance of AI | AI and justice, information quality | Cynthia Breazeal |
| Stanford | HAI (Human-Centered AI Institute) | Interdisciplinary AI; annual AI Index Report | Fei-Fei Li, John Etchemendy |
| Oxford | Oxford Internet Institute (OII) | AI governance, platform governance, compute sovereignty | Vili Lehdonvirta |
| Oxford | Martin AI Governance Initiative (AIGI) | Frontier AI risk, international regulation | — |
| Cambridge | Leverhulme Centre for the Future of Intelligence | Algorithmic transparency, feminist AI, consciousness | Stephen Cave |
| Harvard | Berkman Klein Center | AI and law, AI global governance | Oren Bar-Gill, Cass Sunstein |
| NYU | AI Now Institute | Bias, rights, labor, corporate power | Amba Kak, Kate Crawford |
| Montreal | MAIEI (Montreal AI Ethics Institute) | AI ethics literacy, responsible AI | Founded by Abhishek Gupta (d. 2024) |
| Montreal | Mila (Quebec AI Institute) | Responsible AI, algorithmic bias, climate/health | Yoshua Bengio |
| UK | Alan Turing Institute | Responsible innovation, fairness, explainability | National AI institute |
| UK | Ada Lovelace Institute | Public attitudes, AI in social care | Nuffield Foundation |
| Berlin | Max Planck — Center for Humans and Machines | Machine behavior, collective intelligence | Iyad Rahwan |
| Munich | TUM Institute for Ethics in AI (IEAI) | Ethics of autonomous driving, digital ethics | Christoph Lutge |
| Toronto | Schwartz Reisman Institute | AI safety, alignment, fairness, human rights | Roger Grosse, David Duvenaud |
| CMU | K&L Gates Initiative in Ethics and Computational Technologies | Ethics and policy | Alex John London, Hoda Heidari |
| Princeton | Center for Information Technology Policy (CITP) | AI policy, privacy, digital infrastructure | — |
| UC Berkeley | Center for Human-Compatible AI (CHAI) | Value alignment, provably beneficial AI | Stuart Russell |
| Georgia Tech | ML@GT and ETHICx | Algorithmic fairness, bias in CV, human rights | Swati Gupta, Judy Hoffman |

**Note:** Oxford's Future of Humanity Institute (FHI), founded by Nick Bostrom, **closed April 16, 2024** due to administrative conflict with the Faculty of Philosophy.

### Government and Intergovernmental Bodies

| Body | Focus | Status |
|------|-------|--------|
| **OECD AI Policy Observatory** | 900+ national policies tracked; OECD AI Principles | Active |
| **UNESCO AI Ethics** | Recommendation implementation; readiness assessments | Active |
| **EU AI Office** (est. 2024) | EU AI Act enforcement, GPAI oversight | Active |
| **UK AI Security Institute** (formerly AI Safety Institute) | Pre-deployment frontier model testing; Inspect toolkit | Active |
| **US CAISI** (formerly US AI Safety Institute, renamed June 2025) | AI security standards; operates within NIST | Active |
| **Singapore IMDA / AI Verify** | First government AI governance testing toolkit | Active |
| **Japan AI Safety Institute (J-AISI)** | AI safety research and evaluation | Active |
| **Canada CAISI** (launched Nov 2024, administered by CIFAR) | AI safety research coordination | Active |

### Civil Society and Think Tanks

| Organization | Focus | Notable |
|-------------|-------|---------|
| **Partnership on AI** | Multi-stakeholder research; 140+ members | Founded by Amazon, Apple, Google, Meta, IBM, Microsoft |
| **Center for AI Safety (CAIS)** | Catastrophic/societal-scale risk | "Statement on AI Risk" signed by hundreds of leaders |
| **Future of Life Institute** | Existential risk, alignment, interpretability | AI Safety Index; Asilomar organizer |
| **EFF** | Civil liberties, surveillance, facial recognition | Exposed Flock Safety ALPR mass surveillance |
| **AlgorithmWatch** | Algorithmic accountability, investigative journalism | Berlin/Zurich; UNESCO-recognized |
| **Data & Society** | AI on the Ground, labor futures, trust | NYU-affiliated |
| **Algorithmic Justice League** | Bias auditing, facial recognition | Founded by Joy Buolamwini; Gender Shades study |
| **Google DeepMind — Responsibility and Safety** | Technical safety, AGI safety, ethics | Frontier Safety Framework |

---

## Part VI: Key Controversies and Turning Points

### ProPublica COMPAS Investigation (2016)

Northpointe's COMPAS recidivism algorithm incorrectly flagged Black defendants as future criminals at roughly twice the rate of white defendants. Northpointe showed the model was calibrated (equal accuracy among those flagged). Both were right — they were using different fairness metrics. This catalyzed the impossibility theorems and the entire subfield of algorithmic fairness.

> Angwin, J., Larson, J., Mattu, S., & Kirchner, L. (2016). "Machine Bias." *ProPublica*.
> URL: https://www.propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing

### Cambridge Analytica (2018)

87 million Facebook users had data harvested without consent via a personality quiz, used for psychographic political targeting. FTC imposed a $5 billion fine. Directly accelerated GDPR enforcement, triggered Congressional hearings, and made "data ethics" a recognized discipline.

### Timnit Gebru Firing at Google (December 2020)

Google ended Gebru's employment after she refused to withdraw "On the Dangers of Stochastic Parrots" or remove Google employee names. 2,700 Google employees and 4,300+ academics signed a letter condemning the dismissal. The defining case study for corporate capture of AI ethics research. Led to the founding of the Distributed AI Research Institute (DAIR) in 2021.

### Deepfakes (2017–present)

GAN-based face-swap technology. Three ethical problems: non-consensual synthetic pornography (99% of victims are women), political disinformation (synthetic Zelenskyy "surrender" video, March 2022), and collapse of evidentiary value of video recordings.

### ChatGPT Launch (November 2022)

Fastest-growing consumer application in history. Created immediate urgency for AI governance. Impacts: EU AI Act added an entire GPAI tier, Italy temporarily banned ChatGPT (March 2023), UK held the first AI Safety Summit at Bletchley Park (November 2023), US issued Biden EO 14110 (October 2023). The moment AI ethics moved from academic field to live policy emergency.

---

## Part VII: Seminal Papers

| Paper | Authors | Year | Venue | DOI | Key Contribution |
|-------|---------|------|-------|-----|-----------------|
| A Unified Framework of Five Principles for AI in Society | Floridi & Cowls | 2019 | Harvard Data Science Review | [10.1162/99608f92.8cd550d1](https://doi.org/10.1162/99608f92.8cd550d1) | Meta-analysis synthesizing AI ethics into 5 principles from bioethics |
| The global landscape of AI ethics guidelines | Jobin, Ienca & Vayena | 2019 | Nature Machine Intelligence | [10.1038/s42256-019-0088-2](https://doi.org/10.1038/s42256-019-0088-2) | Analyzed 84 frameworks; identified convergence and divergence |
| The Ethics of AI Ethics | Hagendorff | 2020 | Minds and Machines | [10.1007/s11023-020-09517-8](https://doi.org/10.1007/s11023-020-09517-8) | Meta-critique; principles without enforcement = "ethics washing" |
| Principles alone cannot guarantee ethical AI | Mittelstadt | 2019 | Nature Machine Intelligence | [10.1038/s42256-019-0114-4](https://doi.org/10.1038/s42256-019-0114-4) | AI ethics vs. medical ethics analogy; diffuse accountability problem |
| On the Dangers of Stochastic Parrots | Bender, Gebru et al. | 2021 | ACM FAccT | [10.1145/3442188.3445922](https://doi.org/10.1145/3442188.3445922) | LLMs as statistical pattern matchers, not language understanders |
| Fair prediction with disparate impact | Chouldechova | 2017 | Big Data | [10.1089/big.2016.0047](https://doi.org/10.1089/big.2016.0047) | Impossibility of simultaneous fairness metrics |
| Inherent trade-offs in fair risk scores | Kleinberg, Mullainathan & Raghavan | 2017 | ITCS | [arXiv:1609.05807](https://arxiv.org/abs/1609.05807) | Formal proof: calibration + error balance cannot coexist |
| Gender Shades | Buolamwini & Gebru | 2018 | FAccT | [proceedings.mlr.press](https://proceedings.mlr.press/v81/buolamwini18a.html) | Intersectional facial recognition disparity (up to 34.7% error) |
| "Why Should I Trust You?" (LIME) | Ribeiro, Singh & Guestrin | 2016 | KDD | [10.1145/2939672.2939778](https://doi.org/10.1145/2939672.2939778) | Local interpretable model-agnostic explanations |
| A unified approach to interpreting model predictions (SHAP) | Lundberg & Lee | 2017 | NeurIPS | [arXiv:1705.07874](https://arxiv.org/abs/1705.07874) | Shapley-value framework for feature attribution |
| Survey of hallucination in NLG | Ji et al. | 2023 | ACM Computing Surveys | [10.1145/3571730](https://doi.org/10.1145/3571730) | Comprehensive taxonomy of hallucination causes |
| Energy and policy considerations for deep learning | Strubell, Ganesh & McCallum | 2019 | ACL | [arXiv:1906.02243](https://arxiv.org/abs/1906.02243) | Carbon cost of training large models |
| Extracting training data from LLMs | Carlini et al. | 2021 | USENIX Security | [arXiv:2012.07805](https://arxiv.org/abs/2012.07805) | Demonstrated verbatim data extraction from GPT-2 |
| Calibrating noise to sensitivity (Differential Privacy) | Dwork et al. | 2006 | TCC | [10.1007/11681878_14](https://doi.org/10.1007/11681878_14) | Foundational DP framework |
| Ethical significance of user-control in speech BCIs | van Stuijvenberg et al. | 2024 | Frontiers in Human Neuroscience | [10.3389/fnhum.2024.1420334](https://doi.org/10.3389/fnhum.2024.1420334) | Inner speech leakage and privacy gate requirements |
| Do Artifacts Have Politics? | Winner | 1980 | Daedalus | [JSTOR](https://www.jstor.org/stable/20024652) | Technologies embed political choices; foundational to algorithmic fairness |
| Race After Technology | Benjamin | 2019 | Polity Press | ISBN 978-1509526406 | "New Jim Code": technology reproducing racial inequity under objectivity guise |
| Algorithms of Oppression | Noble | 2018 | NYU Press | ISBN 978-1479837243 | Racial and gender bias in search engine results |
| Automating Inequality | Eubanks | 2018 | St. Martin's Press | ISBN 978-1250074317 | Automated systems targeting and punishing poor communities |
| Building and auditing fair algorithms (Birhane) | Birhane et al. | 2023 | FAccT | [10.1145/3593013.3594049](https://doi.org/10.1145/3593013.3594049) | Dataset auditing insufficient; relational ethics needed |
| A high-performance speech neuroprosthesis | Willett et al. | 2023 | Nature | [10.1038/s41586-023-06377-x](https://doi.org/10.1038/s41586-023-06377-x) | 62 words/min on 125K-word vocabulary from motor cortex |
| A high-performance neuroprosthesis for speech decoding and avatar control | Metzger et al. | 2023 | Nature | [10.1038/s41586-023-06443-4](https://doi.org/10.1038/s41586-023-06443-4) | 1,024-word vocabulary; 74% for facial expression classification |

---

## Part VIII: Why This Matters for QIF

AI ethics is not adjacent to BCI security. It is foundational to it.

Every AI ethics principle maps directly to a QIF architectural decision:

| AI Ethics Principle | QIF Implementation |
|---|---|
| **Transparency** | `runemate log --stream` — every packet entering the nervous system is auditable |
| **Fairness** | NISS scoring must account for population bias; TARA must represent diverse neural baselines |
| **Accountability** | Full audit trail of every consent decision, parameter change, and stimulation event |
| **Safety** | Neurowall kernel enforces Tier 1-2 bounds; physics and biology, not policy |
| **Privacy** | Mental Privacy (MP) as ACL flag; neural data never exported without explicit consent |
| **Human Oversight** | Five-tier guardrail model; patient steers, AI assists; HITL/HOTL/HOOTL encoded in NSP |
| **Explainability** | Neural Firewall must report which features triggered any blocking decision |
| **Alignment** | Proxy metric optimization (Goodhart's Law) addressed by reconsent requirements for learned updates |
| **Hallucination** | Design Principle #9: "AI honesty, not AI obscurity" — the system says "I don't know" when it doesn't know |
| **Consent** | Dynamic consent for adaptive algorithms; model portability prohibition; drift detection as anomaly signal |

**Where QIF sits relative to existing frameworks:** Most AI ethics frameworks are policy-level documents — they prescribe what AI systems *should* do but leave implementation to developers. QIF proposes a different layer: translating those principles into technical enforcement mechanisms. Whether technical enforcement can fully substitute for policy enforcement is an open question. The hypothesis is that architectural constraints (mandatory audit logging, amplitude bounds, consent gates) provide a compliance floor that policy alone cannot guarantee — but this remains to be validated through independent review and real-world deployment.

The regulatory landscape is converging. The Council of Europe Framework Convention (November 2025) is the first binding international AI treaty. The EU AI Act is enforceable law with penalties up to 7% of global revenue. The UNESCO Neurotechnology Ethics Framework (November 2025) directly addresses neural devices. The FDA's PCCP framework governs how AI in medical devices can learn and adapt. These instruments will define the legal environment any BCI security framework operates within.

QIF is designed to be compatible with these frameworks by default — not because compliance is the sole goal, but because the principles they encode (transparency, safety, human oversight, accountability, fairness) are the same principles that inform trustworthy neural device design. An architecture designed from these principles is more likely to be ready when regulation catches up to the technology. One designed without them may need to be rebuilt.

That is the blank slate argument. The opportunity to embed these principles at the architectural level exists now, before deployment scale makes retrofitting prohibitively difficult.

## Operational AI Conduct Principles

This document covers the academic and regulatory landscape of AI ethics. For the operational principles that govern how AI systems actually behave within this project — Asimov's Three Laws reframed for AI, consent as architecture, human-in-the-loop as non-negotiable, neural data at the highest protection tier, and defensive framing only — see **[AI-instructions.md](https://github.com/qinnovates/qinnovate/blob/main/AI-instructions.md)**.

That document translates the frameworks surveyed here into enforceable conduct rules for any AI agent operating on this codebase.

---

> **Epistemic note:** This document compiles AI ethics research for reference purposes. All citations have been verified through Crossref, publisher pages, or institutional records as noted. Framework descriptions are drawn from primary source documents. This is a living document that will be updated as new frameworks, papers, and regulatory instruments emerge. QIF's relationship to these frameworks is that of a proposed technical implementation, not a peer-reviewed contribution to the AI ethics literature itself.

---

*Last updated 2026-03-11 — Kevin Qi*
