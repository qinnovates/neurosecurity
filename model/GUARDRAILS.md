# QIF Guardrails: Neuroethics + Neurosecurity

**Status:** Active
**Last Updated:** 2026-03-05
**Data Source:** `shared/qif-guardrails.json` (single source of truth)
**Enforcement:** `rules/epistemic-integrity.md`

---

## Why This Exists

QIF operates at the intersection of neuroscience and cybersecurity — two fields where overclaiming causes real harm. Published researchers have established constraints on what neuroscience can and cannot claim. QIF translates each constraint into a specific scope limit on its security tools.

**Two guardrail types, always paired:**

| Type | Question It Answers | Source |
|------|-------------------|--------|
| **Neuroethics** | What does the published literature say you *cannot* claim? | Morse, Poldrack, Racine, Ienca, Kellmeyer, Wexler, Tennison, Vul/Eklund |
| **Neurosecurity** | How does QIF scope itself in response? | NISS, TARA, NSP, Cs component bounds |

Every neuroethics constraint maps to a neurosecurity scope limit. They are different domains but inseparable — the neurosecurity guardrail IS the operationalization of the neuroethics one.

---

## The Eight Guardrails

### Overclaim & Scope

#### G1: Neuromodesty (Morse 2006/2011)

> "Brain Overclaim Syndrome": neural correlates do not prove causation or eliminate agency.

| | |
|---|---|
| **Neuroethics constraint** | Neuroscience findings are routinely overclaimed when applied to law and policy. |
| **Violation** | "Brain activity X proves cognitive state Y" |
| **Correct form** | "Brain activity X is associated with / correlates with cognitive state Y" |
| **QIF scope limit** | We score signal-level interference, not mental states. NISS measures physical amplitude disruption, not "thought harm." |
| **Components bound** | NISS, TARA |

#### G4: Anti-Inflationism (Ienca 2021, Bublitz 2022)

> Existing human rights may cover neural data without inventing new neurorights.

| | |
|---|---|
| **Neuroethics constraint** | Don't assume new rights are needed without showing the gap. |
| **Violation** | "We need 15 new neurorights for BCI security" |
| **Correct form** | "We extend Mental Privacy and Mental Integrity with technical depth, not new rights" |
| **QIF scope limit** | We extend Mental Privacy and Mental Integrity with technical depth, not new rights. Five rights, not fifteen. |
| **Components bound** | QIF (framework level) |

---

### Methodology

#### G2: Reverse Inference Fallacy (Poldrack 2006)

> Brain region activation does not uniquely identify a cognitive process.

| | |
|---|---|
| **Neuroethics constraint** | Signal detection does not entail mental-state identification. |
| **Violation** | "Activation of X means the person is experiencing Y" |
| **Correct form** | "Activation of X is associated with multiple cognitive processes including Y" |
| **QIF scope limit** | TARA catalogs physical interference patterns, not cognitive content. |
| **Components bound** | TARA, Cs |

#### G5: Conceptual Underspecification (Kellmeyer 2022)

> "Mental privacy" and "mental integrity" lack agreed operational definitions.

| | |
|---|---|
| **Neuroethics constraint** | Never use philosophically contested terms as if they're settled concepts. |
| **Violation** | "NISS protects mental privacy" (as if the term is well-defined) |
| **Correct form** | "NISS measures operationally defined properties: signal amplitude, frequency, coherence" |
| **QIF scope limit** | We define operationally measurable properties (signal amplitude, frequency, coherence) rather than philosophically contested mental states. |
| **Components bound** | NISS, Cs |

#### G8: Statistical Inflation (Vul et al. 2009, Eklund et al. 2016)

> Neuroimaging studies have high false-positive rates.

| | |
|---|---|
| **Neuroethics constraint** | Never cite fMRI correlations as strong evidence without noting methodological limitations. |
| **Violation** | "Neuroimaging study X proves that BCI attack Y causes Z" |
| **Correct form** | "Neuroimaging study X suggests..., noting [methodological limitations]" |
| **QIF scope limit** | Claims citing neuroimaging findings as ground truth must account for demonstrated validity failures in the underlying methods. |
| **Components bound** | NISS, TARA |

---

### Framing

#### G3: Neurorealism Triad (Racine & Illes 2005)

> Brain images create three biases: neuro-realism, neuro-essentialism, neuropolicy.

| | |
|---|---|
| **Neuroethics constraint** | Check all three biases in every neural claim. |
| **Violation** | "BCI threats reveal that brain data reveals identity" |
| **Correct form** | "Neural signals are partial, noisy representations, not transparent read-outs of selfhood" |
| **QIF scope limit** | Documentation must not frame BCI threats as identity exposure. Neural signals are partial, noisy representations. |
| **Components bound** | TARA, NISS |

#### G6: Brain Reading Limits (Ienca 2018, Wexler 2019)

> Current BCIs cannot "read thoughts."

| | |
|---|---|
| **Neuroethics constraint** | Decoded outputs are selected from known lists, require cooperation, and need algorithm training. |
| **Violation** | "Attackers can read victims' thoughts via BCI" |
| **Correct form** | "Current BCIs can decode from limited option sets with trained algorithms and user cooperation" |
| **QIF scope limit** | Threat models must distinguish between current capabilities and projected future capabilities. We catalog what is technically possible, not what is science fiction. |
| **Components bound** | TARA |

#### G7: Dual-Use Trap (Tennison & Moreno 2012)

> Security framing of neurotech risks enabling surveillance.

| | |
|---|---|
| **Neuroethics constraint** | Always pair threat descriptions with governance constraints. |
| **Violation** | "Here's how to attack a BCI" (without defensive framing) |
| **Correct form** | "Here's how this attack works, and here's the defensive control" |
| **QIF scope limit** | The framework specifies defensive clinical protections. Offensive applications are explicitly out of scope. The threat catalog exists to inform defense, not enable attack. |
| **Components bound** | TARA, QIF |

---

## Component-Specific Bounds

### NISS (Neural Impact Scoring System)

**Does:** Measures physical signal disruption — amplitude deviation, frequency shift, coherence degradation.

**Does NOT:**
- Predict psychiatric diagnoses (corresponds to diagnostic categories, for threat modeling)
- Measure "thought harm" or mental states (G1)
- Claim clinical diagnostic validity (G8)

**Bound by:** G1 (Neuromodesty), G3 (Neurorealism), G5 (Underspecification), G8 (Statistical Inflation)
**Status:** Proposed, unvalidated, in development

### TARA (Threat Analysis & Risk Assessment Atlas)

**Does:** Catalogs physical interference patterns, maps attack techniques to signal-level effects.

**Does NOT:**
- Catalog cognitive content or mental states (G2)
- Claim attacks that exceed current BCI capabilities without flagging as projected (G6)
- Enable offensive applications — defensive framing only (G7)

**Bound by:** G1 (Neuromodesty), G2 (Reverse Inference), G6 (Brain Reading Limits), G7 (Dual-Use Trap)
**Status:** Proposed, unvalidated, in development

### NSP (Neural Security Protocol)

**Does:** Specifies post-quantum cryptographic protections for neural data in transit and at rest.

**Does NOT:**
- Constitute legislation or regulatory mandate
- Claim adoption by any standards body
- Guarantee protection beyond the protocol's technical scope

**Bound by:** G4 (Anti-Inflationism)
**Status:** Draft specification, not adopted

### Cs (Coherence Metric)

**Does:** Detects anomalous signal patterns via phase variance, temporal entropy, gain fluctuation, spectral drift.

**Does NOT:**
- Read intent or identify thoughts (G2)
- Uniquely identify cognitive processes from signal activation (G5)
- Serve as a clinical diagnostic instrument

**Bound by:** G2 (Reverse Inference), G5 (Underspecification)
**Status:** Proposed, validated on EEG data, not independently replicated

---

## Relationship to Other Documents

| Document | Role |
|----------|------|
| `shared/qif-guardrails.json` | Structured data (single source of truth) |
| `rules/epistemic-integrity.md` | Enforcement rules for all AI output |
| `qif-sec-guardrails.md` | Physics-derived security architecture (4 layers) |
| `/bci/guardrails` page | Site visualization of security layers |
| `/landscape` page | Site visualization of rigor checks |

---

*Good science requires active skepticism. These published critiques constrain how BCI security research should be framed. QIF treats each as a guardrail, not an obstacle.*
