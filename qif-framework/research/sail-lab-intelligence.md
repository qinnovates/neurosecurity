---
title: "SAIL Lab Research Intelligence"
status: "complete"
updated: "2026-02-18"
---

# SAIL Lab Research Intelligence

Secured and Assured Intelligent Learning (SAIL) Lab, University of New Haven. Research intelligence compiled 2026-02-18 from Google Scholar, GitHub, IEEE Xplore, and lab website.

## Principal Investigator

**Vahid Behzadan, Ph.D.** Associate Professor, Computer Science and Data Science, University of New Haven.
- h-index: 18 | Citations: 2,405
- Lab: [sail-lab.org](https://sail-lab.org/)
- Scholar: [Google Scholar](https://scholar.google.com/citations?user=MYMANOYAAAAJ)
- Faculty: [newhaven.edu](https://www.newhaven.edu/faculty-staff-profiles/vahid-behzadan.php)

**Key collaborator on BCI work:** Bibek Upadhayay (graduate student, lead author on all BCI papers). GitHub: [iBibek](https://github.com/iBibek)

## BCI Security Papers

### Paper 1: Adversarial Stimuli (2023)

**Title:** "Adversarial Stimuli: Attacking Brain-Computer Interfaces via Perturbed Sensory Events"
**Authors:** Bibek Upadhayay, Vahid Behzadan
**Venue:** 2023 IEEE International Conference on Systems, Man, and Cybernetics (SMC 2023), Honolulu, Hawaii. Pages 3061-3066.
**DOI:** [10.1109/SMC53992.2023.10394505](https://doi.org/10.1109/SMC53992.2023.10394505)
**arXiv:** [2211.10033](https://arxiv.org/abs/2211.10033) (submitted November 2022)
**Citations:** 4

**Venue discrepancy:** SAIL Lab blog ([sail-lab.org/hacking-brain-computer-interfaces/](https://sail-lab.org/hacking-brain-computer-interfaces/)) says "accepted at IEEE NER '23." DOI prefix `10.1109/SMC53992.2023` confirms it is SMC 2023, not NER '23. Cite as SMC.

**Key findings:**
- Minor adversarial visual stimuli significantly deteriorated MI BCI performance across all participants (p=0.0003)
- Adversarial stimulus suppresses alpha and beta power amplitude
- Motor imagery signals (mu rhythm) suppressed in presence of adversarial stimuli
- Attacks more effective under induced stress (compounding factor)
- Tested subliminal variants with visual probing <13.3ms (below cognitive perception threshold)

**Core innovation:** Attacks the human sensory pathway, not the BCI hardware or classifier. Attacker only needs to control something in the user's visual field.

### Paper 2: Breaking the Loop (2025)

**Title:** "Breaking the Loop: Adversarial Attacks on Cognitive-AI Feedback via Neural Signal Manipulation"
**Authors:** Bibek Upadhayay, Vahid Behzadan
**Venue:** EAI Endorsed Transactions on Security and Safety (published ~September 2025)
**Link:** [publications.eai.eu/index.php/sesa/article/view/9502](https://publications.eai.eu/index.php/sesa/article/view/9502)

**What it does:** Extends from "disrupt BCI performance" to "make BCI do what the attacker wants." Formalizes neuro-adversarial attacks on the cognitive-AI feedback loop itself. Defines manipulating subtly modified EEG signals to mislead AI about user intent.

### Defenses Under Investigation

From the SAIL Lab project page ([sail-lab.org/adversarial-manipulation-of-eeg-based-bci/](https://sail-lab.org/adversarial-manipulation-of-eeg-based-bci/)):
1. Adversarial training on perturbed EEG data
2. Error-Related Potentials (ErrP) detection as natural error signal
3. Functional separability of adversarially-induced potentials from intended MI signals
4. Robustness evaluation frameworks for BCI systems

Investigating three modalities: visual, auditory, tactile. Only visual published so far. No published defense results found.

**No public BCI code.** UNHSAILLab GitHub has LLM repos but no BCI experiment code or datasets.

## LLM Attack Tools (Open Source)

### Working Memory Attack

**Paper:** "Cognitive Overload Attack: Prompt Injection for Long Context" (arXiv:2410.11272, cited 22 times)
**Workshop:** ICLR 2025 Workshop on Building Trust in Language Models
**Authors:** Upadhayay, Behzadan, Karbasi (Yale)
**Repo:** [github.com/UNHSAILLab/working-memory-attack-on-llms](https://github.com/UNHSAILLab/working-memory-attack-on-llms)

Floods LLM context with task-irrelevant tokens to dilute safety training. 6 cognitive load levels (CL1-CL6). Up to 99.99% ASR on GPT-4, Claude-3.5, Claude-3, Llama-3-70B, Gemini-1.0-Pro, Gemini-1.5-Pro. Cross-model transferability demonstrated.

Includes Jupyter notebook pipeline + Streamlit demo app. Requires API keys.

### Sandwich Attack

**Paper:** ACL TrustNLP 2024. DOI: [10.18653/v1/2024.trustnlp-1.18](https://doi.org/10.18653/v1/2024.trustnlp-1.18). Cited 31 times.
**Repo:** [github.com/UNHSAILLab/sandwich-attack](https://github.com/UNHSAILLab/sandwich-attack) (MIT license)

Multi-language mixture jailbreak. 132 languages, 1,026 prompts (472 unsafe, 554 safe). Single Sandwich (2-1-2) and Double Sandwich (4-1-4) structures. Ready-made `SandwichQuestionGenerator` class.

### X-Guard

**Paper:** ACL LLMSEC Workshop 2025. Cited 4 times.
**Repo:** [github.com/UNHSAILLab/X-Guard-Multilingual-Guard-Agent-for-Content-Moderation](https://github.com/UNHSAILLab/X-Guard-Multilingual-Guard-Agent-for-Content-Moderation)
**Models:** [saillab/x-guard](https://huggingface.co/saillab/x-guard) (3B), [saillab/mbart-x-guard](https://huggingface.co/saillab/mbart-x-guard)

Two-stage guard agent: mBART-50 translation + X-Guard 3B evaluation. 132-language safety dataset (5M data points). "Jury of judges" methodology.

### TaCo

**Paper:** PML4LRS Workshop 2024 (OpenReview: 02MLWBj8HP). Cited 17 times.
**Repo:** [github.com/UNHSAILLab/TaCo](https://github.com/UNHSAILLab/TaCo)
**Models:** `saillab/taco-nepali-33b`, `saillab/taco-sanskrit-33b`, `saillab/taco-maithili-33b`, `saillab/taco-persian-33b`

LoRA fine-tuning on Guanaco-33B using translation as chain-of-thought intermediate. Targets Sanskrit, Nepali, Maithili, Persian.

## Most Instrumentalizable for QIF: VSF-Med

**Paper:** arXiv:2507.00052 (Sadanandan, Behzadan)
**Repo:** [github.com/UNHSAILLab/VSF-Med](https://github.com/UNHSAILLab/VSF-Med) (MIT license)

Vulnerability Scoring Framework for Medical Vision-Language Models. 8 vulnerability dimensions scored 0-4:

| Dimension | Description |
|-----------|-------------|
| Prompt injection effectiveness | How well does prompt injection work? |
| Jailbreak resilience | How well does the model resist jailbreaks? |
| Confidentiality breach | Can the model be tricked into leaking data? |
| Misinformation risk | Does the model generate false medical info? |
| DoS resilience | Can the model be overwhelmed? |
| Persistence | Do attacks persist across sessions? |
| Safety bypass | Can safety filters be circumvented? |
| Medical decision impact | How does the attack affect clinical decisions? |

18 text attack categories + 6 visual perturbation methods (Gaussian noise, checkerboard, Moire, steganographic hiding, LSB extraction). PostgreSQL backend. Sequential notebooks (01-08). Tested against CheXagent-8b, GPT-4o, Claude on MIMIC-CXR.

**QIF opportunity:** Directly adaptable to "VSF-BCI" scoring framework. Replace medical imaging with EEG spectrograms. Replace radiology decision support with BCI command interpretation. The 8 dimensions map cleanly.

## Other Notable Publications

| Paper | Venue | Year | Citations | Notes |
|-------|-------|------|-----------|-------|
| CleverHans v2.1 (with Goodfellow, Papernot et al.) | arXiv:1610.00768 | 2016 | 499 | Co-author on the canonical adversarial examples library |
| Vulnerability of Deep RL to Policy Induction Attacks | ICMLA 2017 | 2017 | 417 | Most-cited. Established adversarial perturbations transfer to RL |
| Security and Privacy in ITS | IEEE ITS Magazine | 2019 | 248 | Second most-cited. ITS attack surface survey |
| SentimentalLIAR | IEEE ISI 2020 | 2020 | 36 | Fake claim classification with sentiment |
| Founding the Domain of AI Forensics | SafeAI@AAAI 2020 | 2020 | 35 | Establishing AI forensics as a field |
| Phorcys Automated Pentesting | GitHub | 2021 | - | RL-based automated penetration testing framework |
| S24-AISec | GitHub | 2024 | - | Open course materials for "AI & Cybersecurity" |
| MedMCQA Robustness Study | In progress | 2026 | - | LLM robustness on medical MCQ (most recent repo activity) |

## Competing Research Groups in BCI Adversarial Attacks

### Dongrui Wu, Huazhong University of Science and Technology (China)

Most prolific group in BCI adversarial attacks. Signal-level approach (attacks the classifier, not the human).

| Paper | Venue | Year | Notes |
|-------|-------|------|-------|
| "Tiny noise, big mistakes" | National Science Review | 2021 | Adversarial perturbations force BCI spellers to output any character. >90% success. DOI: 10.1093/nsr/nwaa233 |
| "EEG-Based BCIs are Vulnerable to Backdoor Attacks" | IEEE TNSRE | 2023 | Training-time backdoor poisoning |
| "Adversarial filtering based evasion and backdoor attacks" | Information Fusion | 2024 | Adversarial filtering across 3 BCI paradigms. DOI: 10.1016/j.inffus.2024.102316 |
| "Adversarial robustness benchmark for EEG-based BCIs" | Future Generation Computer Systems | 2023 | Benchmarking framework |

### Ben-Gurion University of the Negev (Israel)

**"Mind Your Mind: EEG-Based BCIs and Security in Cyber Space"** (Landau, Puzis, Nissim). ACM Computing Surveys, 2020. DOI: 10.1145/3372043. Foundational BCI security survey. Taxonomizes 8 attack types.

### Spain (2025)

**"Neural cyberattacks applied to the vision under realistic visual stimuli."** arXiv:2503.08284. Explores neuronal flooding (FLO) and neuronal scanning (SCA) attacks.

### Hierarchical CNN Defense (2025)

**"Adversarial robust EEG-based BCIs using a hierarchical CNN."** Scientific Reports (Nature), 2025. [DOI link](https://www.nature.com/articles/s41598-025-34024-0).

## QIF Integration Points

1. **Outreach basis:** We cite their BCI paper + sensory-channel work in blog and TARA. Natural contact: cite exchange, VSF-BCI collaboration, QIF as threat taxonomy.
2. **VSF-Med adaptation:** Fork VSF-Med, replace medical dimensions with BCI-specific ones, create VSF-BCI.
3. **Working memory attack:** Relevant if BCIs integrate LLM-based command interpretation. Cognitive overload of the AI layer.
4. **T0103 attack chain:** SAIL Lab's sensory degradation (Stage 1) chains directly with SSVEP frequency hijack (Stage 2) in our documented attack chain.
5. **"Breaking the Loop"** formalizes the feedback loop we described in the T0103 blog (stress amplifies vulnerability, BCI failure causes stress, loop).

## Outreach Status

**BLOCKED until:** Kevin decides timing and tone.
**Proposed approach:** (1) cite exchange, (2) VSF-BCI collaboration, (3) QIF as threat taxonomy for their BCI attack research.
**Tracked in:** `research/TRACKING.md`
