# QIF Governance Questions: Who Decides What for the Brain?

> **Living document.** These are the governance, ethical, and architectural questions that must be answered before neural interfaces can be deployed responsibly. Each question ties back to neurorights, neuroethics, and the QIF security architecture. The RACI matrix at the end maps accountability for every scenario class.

**Author:** Kevin Qi
**Date:** 2026-03-11
**Status:** Active Draft
**Companion to:** QIF-WHITEPAPER-V8-DRAFT.md, QIF-NEUROETHICS.md, NEUROSECURITY_GOVERNANCE.md

---

## Table of Contents

- [Part I: Governance Questions](#part-i-governance-questions)
  - [1. Who Governs What](#1-who-governs-what)
  - [2. Boundaries and Limitations](#2-boundaries-and-limitations)
  - [3. Terminal and Patient Control](#3-terminal-and-patient-control)
  - [4. Escalation and Scope Creep](#4-escalation-and-scope-creep)
  - [5. Open Source vs Proprietary](#5-open-source-vs-proprietary)
  - [6. The Open Source Neural Atlas](#6-the-open-source-neural-atlas)
  - [7. AI as Bridge](#7-ai-as-bridge)
  - [8. Long-term Maintenance and Abandonment](#8-long-term-maintenance-and-abandonment)
  - [9. Dual-Use and Military Applications](#9-dual-use-and-military-applications)
  - [10. Consent for Evolving Capabilities](#10-consent-for-evolving-capabilities)
- [Part II: RACI Matrix](#part-ii-raci-matrix)
- [Part III: Neuroethics and Neurorights Mapping](#part-iii-neuroethics-and-neurorights-mapping)
- [Part IV: Security Architecture Questions](#part-iv-security-architecture-questions)
- [Part V: The Open Source Neural Atlas Proposal](#part-v-the-open-source-neural-atlas-proposal)

---

## Part I: Governance Questions

### 1. Who Governs What

The fundamental question is not "should BCIs be regulated" — it is "who decides what, for whom, and under what authority?"

#### Q1.1: Who sets the amplitude ceiling?

The tissue damage threshold is a physics constraint. But who translates that physics into a specific number in the kernel?

| Candidate | Argument For | Argument Against |
|-----------|-------------|-----------------|
| Manufacturer | Has the engineering data, test results | Commercial incentive to set limits permissively |
| Regulatory body (FDA/CE) | Independent, evidence-based | Slow to update, may not understand neural specifics |
| Clinician | Knows the individual patient's anatomy | Varies by clinician, no standardization |
| Patient | Their body, their risk tolerance | May not understand the physics |
| Open standard (QIF) | Transparent, auditable, consensus-driven | No enforcement authority |

**Proposed answer:** The amplitude ceiling should be set by clinical evidence (peer-reviewed safe stimulation parameters), encoded in an open standard, validated by a regulatory body, and customizable within the evidence-based range by the clinician. The patient should be able to inspect the limit but not override Tier 1 bounds. The manufacturer implements but does not set the standard.

#### Q1.2: Who decides what neural domains the BCI can access?

A motor cortex BCI was consented for M1. Can it access prefrontal cortex? Limbic system? Who authorizes the expansion?

- **Current medical device model:** The FDA clears a device for a specific indication. Off-label use is the clinician's discretion.
- **QIF model (proposed):** Each neural domain requires separate consent (Tier 4). The device's capability system enforces domain boundaries. Expansion requires patient consent + clinician co-sign + capability grant.
- **Open question:** Should the patient be able to expand scope without a clinician? What if they are in a country without BCI-specialized clinicians? What if the manufacturer's gateway refuses to compile content for an unauthorized domain?

#### Q1.3: Who governs the AI that assists the patient?

If a neural terminal uses AI (subvocalization commands → AI processing → Runemate compilation), who governs the AI's behavior?

- Can the AI refuse a patient's request? Under what criteria?
- If the AI suggests a stimulation pattern, who is liable if it causes harm?
- Should the AI have its own capability restrictions independent of the patient's session?
- If the patient says "increase contrast beyond recommended levels," should the AI comply, warn, or refuse?

#### Q1.4: Who governs firmware updates?

Firmware updates change the behavior of an implanted device. Who decides when, how, and whether to update?

| Model | Description | Risk |
|-------|------------|------|
| **Manufacturer-pushed** | Like smartphone updates | Patient loses control; untested changes reach neural tissue |
| **Patient-initiated** | Patient chooses when to update | Patient may defer critical security patches |
| **Clinician-gated** | Clinician approves before patient installs | Access bottleneck; what if clinician is unavailable? |
| **Multi-party signed** (QIF proposed) | Manufacturer signs + patient approves. Critical patches require clinician notification but not gate | Balance of safety and sovereignty |

#### Q1.5: Who governs data export and sharing?

Neural data is the most intimate data that can exist. Who controls its export?

- Can the manufacturer access the patient's neural data for "quality improvement"?
- Can a researcher request data for a study? Under what consent framework?
- Can law enforcement compel neural data disclosure? Under what legal standard?
- Can the patient export their own data to switch providers? In what format?
- If the patient dies, who inherits access to their neural data?

### 2. Boundaries and Limitations

#### Q2.1: Where is the boundary between therapeutic and enhancement?

A patient receives a BCI for Parkinson's tremor management. The same device could improve reaction time in healthy tissue. Where is the line?

| Dimension | Therapeutic | Enhancement | Gray Zone |
|-----------|------------|-------------|-----------|
| **Intent** | Restore lost function | Improve beyond baseline | Optimize existing function |
| **Target** | Damaged tissue/pathways | Healthy tissue/pathways | Subclinical deficits |
| **Outcome** | Return to population norm | Exceed population norm | Improve within normal range |
| **Consent complexity** | Informed by medical need | Informed by desire | Informed by...what? |
| **Regulatory path** | FDA medical device | FDA...unclear | No framework exists |

**The question QIF raises:** If the five-tier guardrail model puts enhancement at Tier 5 (policy layer, evolving), who writes the policy? Clinicians? Ethicists? Legislators? The patients themselves?

#### Q2.2: What is the boundary for motor vs cognitive intervention?

If we accept lane-keep assist for gait (motor, Level 2), at what point does "cognitive lane-keep" become acceptable?

Scenarios that need boundaries:

1. **Seizure prevention.** The BCI detects pre-ictal patterns and intervenes to prevent a seizure. This is autonomous (the patient did not initiate), but medically necessary. **Acceptable?** Likely yes — analogous to a cardiac defibrillator.
2. **Mood stabilization.** The BCI detects a depressive episode onset and adjusts stimulation to stabilize mood. The patient consented to this in advance. **Acceptable?** Debatable — who defines "normal" mood?
3. **Impulse control.** The BCI detects neural patterns associated with substance craving and intervenes. **Acceptable?** Deeply contested — this is the system overriding the patient's current will based on a prior consent.
4. **Thought suggestion.** The AI detects the patient is struggling with a problem and suggests a solution via stimulation. **Acceptable?** Almost certainly not in current ethical frameworks — but where is the line between "suggestion" and "information delivery"?

#### Q2.3: What is the boundary for "safe enough to deploy"?

Current cortical visual prostheses produce tens of phosphenes. Runemate's pipeline assumes hundreds to thousands of electrodes. At what point is the technology mature enough that the governance framework matters practically, not just theoretically?

**Timeline question:** Is it irresponsible to build the governance framework before the technology exists? Or is it irresponsible NOT to?

**QIF's position:** The internet was built without security. TCP/IP shipped in 1983; the Morris worm hit in 1988. The framework must precede the technology, because retrofitting governance after deployment is orders of magnitude harder than designing it in advance.

#### Q2.4: What is the boundary for interoperability?

If a patient switches from Manufacturer A to Manufacturer B, can they bring their calibration data, electrode maps, and personal configurations? Or are they locked in?

This is the vendor lock-in question applied to neural devices — and it is qualitatively different from switching phone platforms. Switching a BCI manufacturer means:
- Explanting and reimplanting hardware (major surgery)
- Recalibrating to a new system (weeks to months of adaptation)
- Losing personal configurations that represent months of tuning
- Potentially losing access to content compiled for the previous platform

### 3. Terminal and Patient Control

#### Q3.1: Should the patient have root access?

The Unix analogy: should the patient have `sudo`?

| Position | Argument |
|----------|---------|
| **Yes (full root)** | It is their body, their device. Cognitive liberty demands unrestricted access. |
| **No (capability-gated)** | Root access can cause tissue damage. The kernel protects the hardware. |
| **Conditional** | Root access with safety bounds. The patient can do anything that does not exceed Tier 1-2 limits. |

**QIF's position:** Capability-based access with Tier 1-2 kernel enforcement. The patient has maximum freedom within physics-safe bounds. This is the "conditional" model — not because the patient's autonomy is limited, but because the tissue has material constraints.

#### Q3.2: Should the terminal support scripting and automation?

If the patient can script their BCI, they can create automated responses — e.g., "if I detect pre-seizure patterns, automatically reduce stimulation intensity." This is patient-authored autonomy. Is it different from manufacturer-authored autonomy?

**The question:** Is a patient-written script that runs autonomously a violation of "the patient must steer"? Or is authoring the script itself the steering act?

**Proposed answer:** Authoring is steering. The patient designed the automation, consented to its execution, and can revoke it at any time. The script runs within the patient's capability token. This is analogous to a cron job — automated, but authored and authorized by the user.

#### Q3.3: Can the terminal be used to jailbreak the device?

If the terminal gives the patient command-line access, can they circumvent safety limits? Should the architecture make this impossible, or should it make it possible but auditable?

**Precedent:** iPhone jailbreaking. Legal (DMCA exemption), but voids warranty. The manufacturer cannot prevent it entirely; they can only make it difficult.

**For neural devices:** A jailbreak that removes amplitude ceilings could cause tissue damage. This is not a warranty issue — it is a safety issue. But does the patient have the right to take that risk with their own body?

**QIF's position:** Tier 1-2 limits are enforced in hardware (Neurowall kernel) and cannot be circumvented by software. This is not a policy restriction — it is a physical fuse. The patient can modify everything in software above Tier 2, but the hardware safety floor is absolute.

### 4. Escalation and Scope Creep

#### Q4.1: The addiction-to-enhancement pipeline

The escalation scenario (walk → quit painkillers → quit alcohol → run faster) reveals a general pattern:

```
Medical need → Therapeutic use → Therapeutic expansion → Enhancement request
     |               |                    |                      |
 Clear consent   Consent extends    New domain, new consent   No framework
```

Every BCI deployment should anticipate this pipeline and build consent gates at each transition.

#### Q4.2: What if the patient disagrees with the clinician?

The patient wants to expand their BCI to help with anxiety. The clinician says the evidence is insufficient. The patient says it is their brain.

Who wins?

| Position | Precedent |
|----------|----------|
| Clinician decides | Current medical ethics (beneficence, non-maleficence) |
| Patient decides | Autonomy principle, right to refuse treatment — but right to demand treatment? |
| Shared decision | Informed consent model — patient decides after clinician provides evidence |
| Third-party arbiter | Ethics committee, regulatory body, patient advocate |

#### Q4.3: What happens when the BCI becomes part of identity?

If a patient has used a BCI for 10 years and their perceptual experience is shaped by its configuration, is removing or significantly altering the BCI a violation of psychological continuity (PC)?

This is not hypothetical — deep brain stimulation patients have reported that turning off their device changes their personality, mood, and sense of self. The device becomes part of who they are.

**Implications:**
- Forced firmware updates that change the perceptual experience may violate PC
- Device decommission by the manufacturer may violate PC
- Even the patient's own request to remove the device may require careful psychological evaluation

#### Q4.4: What if the patient is a minor?

A child receives a cortical prosthesis for congenital blindness at age 5. At age 15, they want to modify their visual experience in ways their parents and clinician did not consent to. At age 18, they want full root access.

Who consents at each stage? How does consent transfer? What if the 18-year-old wants to undo a configuration their 5-year-old self was given?

### 5. Open Source vs Proprietary

#### Q5.1: Does open source make more sense for neural devices?

| Factor | Open Source | Proprietary | Assessment |
|--------|-----------|-------------|------------|
| **Transparency** | Anyone can audit the code | Black box; trust the manufacturer | Open source wins — patients deserve to see what runs in their skull |
| **Security** | More eyes → more bugs found (Linus's Law) | Dedicated security team, faster patches | Draw — both models have successes and failures |
| **Interoperability** | Open standards → device portability | Vendor lock-in | Open source wins — patients should not be locked to one manufacturer |
| **Support** | Community-driven; may lack dedicated support | Dedicated support team, SLA | Proprietary wins — unless AI bridges the gap (see Q7) |
| **Regulatory** | No single entity to hold accountable | Clear liability chain | Proprietary wins for current regulatory frameworks |
| **Longevity** | Code outlasts companies | Company goes bankrupt → device orphaned (Second Sight) | Open source wins — dramatically |
| **Innovation** | Community-driven, diverse contributions | Focused R&D, IP-driven | Draw — different innovation models |
| **Funding** | Grants, community, foundation model | VC, revenue, IP licensing | Proprietary wins in current market |

#### Q5.2: The Second Sight precedent

Second Sight Medical Products manufactured the Argus II retinal prosthesis — one of the first FDA-approved artificial vision devices. In 2020, they ceased operations. Patients with implanted Argus II devices were left with hardware in their eyes and no manufacturer to support it.

This is the nightmare scenario for proprietary neural devices:
- No firmware updates
- No replacement parts
- No technical support
- No pathway to migrate to another device
- The device that IS the patient's vision is now unsupported

Open source would not have prevented the company's failure. But it would have allowed:
- Independent developers to maintain the software
- Other manufacturers to produce compatible hardware
- Patients to continue receiving updates
- The knowledge to survive the company

#### Q5.3: The funding problem

Open source neural devices face a real funding challenge. Medical device development costs hundreds of millions of dollars. Who pays for open-source neural device R&D?

| Model | Precedent | Viability for Neural Devices |
|-------|----------|------------------------------|
| **Government grants** | NIH, DARPA, NSF | Funds research, not ongoing support |
| **Foundation model** | Linux Foundation, Apache Foundation | Viable for software, unclear for hardware |
| **Consortium** | RISC-V, OpenBCI | Promising — shared R&D costs across manufacturers |
| **Hybrid** | Red Hat model (open source + paid support) | Most realistic path — open standard, proprietary implementations |
| **Public utility** | CERN, Internet infrastructure | Possible if neural interfaces become essential infrastructure |

### 6. The Open Source Neural Atlas

**Proposal:** An open hardware specification for neural interfaces that allows interchangeable components — so patients are never locked to a single manufacturer's ecosystem.

#### What it would define:

1. **Electrode array connector standard.** A physical and electrical interface specification that any manufacturer's electrode array can connect to any manufacturer's processing unit. Think USB-C for the brain.
2. **Signal protocol standard.** A common wire format for electrode signals — so a processing unit from Manufacturer A can interpret signals from Manufacturer B's electrodes. This is NSP's role in the QIF stack.
3. **Firmware interface standard.** A defined API between the hardware and the software running on it — so patients can choose their operating system (Runemate/Scribe or alternatives) independently of their hardware.
4. **Calibration data portability.** A standard format for patient calibration data — electrode-to-cortex mappings, stimulation parameters, personal configurations — that can be exported and imported across manufacturers.
5. **Content format standard.** Staves bytecode as the universal neural content format — so content compiled for one device works on any compliant device.

#### Why it is too early — and why it matters now:

**Too early because:**
- Current electrode technology is rapidly evolving (Utah arrays → flexible polymers → neural dust)
- Standardizing hardware now could lock in inferior technology
- The security risks of interchangeable neural components have not been analyzed
- No regulatory framework exists for interoperable implantable devices
- The patient population is too small for market forces to drive standardization

**Matters now because:**
- Second Sight proved that proprietary lock-in kills devices when companies die
- Standardization takes decades (TCP/IP: 1974 proposal → 1983 adoption → 1990s ubiquity)
- The discussion must precede the technology, or the technology will precede the discussion
- Early architectural decisions constrain all future options
- If we wait until BCIs are common, the proprietary ecosystems will be entrenched

#### Security implications of interoperability:

| Risk | Description | Mitigation |
|------|------------|------------|
| **Supply chain** | Counterfeit components in the neural stack | Hardware attestation, PUF-based identity |
| **Compatibility attacks** | Malicious component claims compliance | Conformance testing, certification body |
| **Update fragmentation** | Different manufacturers patch at different rates | Coordinated disclosure, minimum patch SLA |
| **Signal spoofing** | A rogue processing unit sends harmful patterns | NSP authentication, Neurowall enforcement |
| **Calibration poisoning** | Malicious calibration data imported from another system | Cryptographic signing of calibration datasets |

### 7. AI as Bridge

#### Q7.1: Can AI solve the open-source support problem?

The biggest argument against open source for medical devices is support. If a patient's neural device has a problem at 3 AM, who answers the phone?

AI can bridge this gap:

1. **Diagnostic assistance.** The terminal's AI can analyze device logs, identify anomalies, and suggest corrective actions — the same way a sighted user might Google an error message, but integrated into the device itself.
2. **Natural language interface.** Patients who are not technically sophisticated can interact with their device through natural language (subvocalization). The AI translates intent into terminal commands.
3. **Automated monitoring.** Continuous biomarker monitoring can detect problems before the patient notices them, and alert the patient and/or clinician.
4. **Community knowledge base.** An open-source community builds a knowledge base of common issues and solutions. The AI searches this knowledge base on behalf of the patient.

**The catch:** The AI itself needs to be governed. If the AI is proprietary (e.g., a cloud-based LLM), the patient is again dependent on a single provider. If the AI is local (on-device or on the gateway), it needs to be small enough to run on constrained hardware and good enough to be medically reliable.

#### Q7.2: Should AI have its own consent framework?

If the AI can suggest changes to the patient's stimulation parameters, should the AI require its own capability tokens? Should the AI be able to escalate its own permissions?

**Proposed answer:** No. The AI is a tool within the patient's session. It operates under the patient's capability token and cannot escalate. The patient steers; the AI assists. This is the steering argument applied to the AI itself.

### 8. Long-term Maintenance and Abandonment

#### Q8.1: What is the minimum support commitment?

If a company implants a neural device, how long must they support it?

- The device's expected operational lifetime? (10-20 years for current implants)
- The patient's lifetime?
- Some fixed period (5 years? 10 years?)
- Until a successor device is available?

**Precedent:** No medical device manufacturer is currently required to support a device for the patient's lifetime. Pacemaker manufacturers support devices for 5-10 years. But pacemaker patients can switch to a competitor's device at the next battery replacement. Neural device patients may not have that option.

#### Q8.2: What happens to the source code when a company dies?

If the company that made the patient's neural device goes bankrupt, what happens to:

- The firmware source code?
- The calibration algorithms?
- The encryption keys?
- The patient's data?
- The regulatory certification?

**Proposed requirement:** Source code escrow. Any company that implants a neural device must place the source code, calibration algorithms, and encryption key management procedures in escrow with an independent trustee. If the company ceases operations, the escrow is released under an open-source license.

#### Q8.3: Who pays for maintenance after the company is gone?

Even if the source code is escrowed, someone has to maintain it. Security patches, compatibility updates, regulatory compliance — these are ongoing costs. Who bears them?

- The patient? (Unacceptable — they did not choose for the company to fail)
- Insurance? (No current framework)
- Government? (Public health mandate?)
- Open-source community? (No guaranteed SLA)
- Successor company? (No obligation)

### 9. Dual-Use and Military Applications

#### Q9.1: Should military BCIs follow the same governance?

DARPA's Next-Generation Nonsurgical Neurotechnology (N3) program funds BCI development for military applications — enhanced communication, accelerated learning, human-machine teaming.

If a governance framework like QIF exists for therapeutic BCIs, should it also apply to military BCIs?

| Position | Argument |
|----------|---------|
| **Yes, same framework** | A neuron is a neuron. The safety constraints are the same. |
| **No, different framework** | Military personnel operate under different consent models (orders, not informed consent). Mission requirements may justify higher risk. |
| **Same safety, different consent** | Tier 1-2 hardware safety is universal. Tier 3-5 consent and policy differ. |

#### Q9.2: Can a therapeutic BCI be weaponized?

If a patient's BCI is connected to a gateway, and the gateway is compromised, can the BCI be used to harm the patient? This is TARA's entire threat model.

But what about the reverse? Can a BCI be used to harm others? If a motor cortex BCI controls a robotic arm, and the arm injures someone, is the patient responsible? The AI? The manufacturer?

### 10. Consent for Evolving Capabilities

#### Q10.1: How do you consent to a device that changes?

A BCI is implanted with Capability Set A. Two years later, a firmware update adds Capability Set B. The patient consented to A, not B.

Traditional informed consent is a snapshot. It assumes the device's capabilities are fixed at the time of implantation. Neural devices violate this assumption.

**Proposed model:** Continuous consent. Each capability expansion triggers a new consent event. The patient must affirmatively opt in to new capabilities. Default is deny — new capabilities are available but not activated until the patient consents.

#### Q10.2: What if the patient cannot consent?

If the BCI is the patient's communication system, and the BCI needs a critical security update, but the update requires rebooting the device (temporarily removing the patient's ability to communicate), who consents?

This is a Catch-22: the consent mechanism depends on the device that needs to be updated.

**Proposed protocol:**
1. Advance directive: the patient pre-authorizes critical security updates that require brief interruption.
2. Clinician co-sign: a clinician can authorize the update on the patient's behalf if the advance directive covers the scenario.
3. Emergency override: for active security incidents (the device is under attack), the Neurowall kernel can apply a minimal security patch without consent, limited to Tier 1-2 safety measures, with full audit trail.

---

## Part II: RACI Matrix

**R** = Responsible (does the work), **A** = Accountable (owns the decision), **C** = Consulted, **I** = Informed

### Hardware and Safety

| Scenario | Patient | Clinician | Manufacturer | Regulator (FDA/CE) | Open Standard (QIF) | AI System |
|----------|---------|-----------|-------------|-------------------|--------------------|----|
| Set amplitude ceiling (Tier 1) | I | C | R | A | C | — |
| Set seizure threshold (Tier 2) | C | R | C | A | C | — |
| Update biological safety params | C/A | R | C | I | C | — |
| Hardware recall decision | I | I | R | A | — | — |
| Electrode array design | — | C | R/A | A | C | — |

### Therapeutic Operations

| Scenario | Patient | Clinician | Manufacturer | Regulator | Open Standard | AI System |
|----------|---------|-----------|-------------|-----------|--------------|-----------|
| Set therapeutic stimulation bounds (Tier 3) | C | R/A | C | I | C | — |
| Adjust contrast/brightness within range | R/A | I | — | — | — | C |
| Expand to new neural domain (Tier 4) | A | R | — | I | C | — |
| Create patient-authored automation script | R/A | I | — | — | — | C |
| Override clinician-set range (within Tier 2) | A | C | — | — | — | I |

### Software and Firmware

| Scenario | Patient | Clinician | Manufacturer | Regulator | Open Standard | AI System |
|----------|---------|-----------|-------------|-----------|--------------|-----------|
| Firmware update (routine) | A | I | R | I | — | — |
| Firmware update (critical security) | I | C | R | A | — | — |
| Firmware update (capability expansion) | A | C | R | I | — | — |
| Choose operating system (open source) | R/A | C | — | I | C | — |
| AI model update on device | A | I | R | I | — | — |

### Data and Privacy

| Scenario | Patient | Clinician | Manufacturer | Regulator | Open Standard | AI System |
|----------|---------|-----------|-------------|-----------|--------------|-----------|
| Export personal neural data | R/A | I | C | — | C | — |
| Share data for research | A | C | — | I | — | — |
| Law enforcement data request | C | C | C | A | — | — |
| Manufacturer telemetry collection | A (consent) | I | R | A | — | — |
| Post-mortem data access | — | C | C | A | — | — |
| Transfer data to new device | R/A | C | R | I | C | — |

### Autonomy and Enhancement

| Scenario | Patient | Clinician | Manufacturer | Regulator | Open Standard | AI System |
|----------|---------|-----------|-------------|-----------|--------------|-----------|
| Therapeutic use within indication | A | R | C | I | — | C |
| Off-label therapeutic expansion | A | R/A | I | I | — | C |
| Cognitive enhancement request | A | C | I | ? | — | C |
| Motor enhancement beyond body limits | I (denied) | C | I | I | — | — |
| Seizure auto-intervention (Level 3) | A (advance directive) | R | C | A | C | R |
| Mood stabilization (autonomous) | A (consent) | R/A | C | ? | C | C |
| AI-suggested stimulation change | A (approve/deny) | I | — | — | — | R (propose) |

### Emergency and Edge Cases

| Scenario | Patient | Clinician | Manufacturer | Regulator | Open Standard | AI System |
|----------|---------|-----------|-------------|-----------|--------------|-----------|
| Device under active cyber attack | I | I | C | I | C | R (Neurowall) |
| Manufacturer goes bankrupt | A (continued use) | C | — | A (escrow release) | R (maintain) | — |
| Patient becomes incapacitated | — | R/A | I | I | — | C |
| Pediatric → adult consent transfer | A (at 18) | C | I | I | C | — |
| Patient wants to jailbreak (Tier 3-5) | R/A | C | I | I | — | — |
| Patient wants to jailbreak (Tier 1-2) | I (denied) | I | I | I | — | — |
| Cross-border data sovereignty conflict | C | C | C | A (jurisdiction) | C | — |

---

## Part III: Neuroethics and Neurorights Mapping

Every governance question maps back to one or more neurorights. This table makes the connection explicit.

### The Five Neurorights Applied

| Neuroright | Core Principle | Governance Questions It Addresses |
|-----------|---------------|----------------------------------|
| **Mental Privacy (MP)** | The right to keep neural data private | Q1.5 (data export), Q8.2 (source code escrow), Q9.2 (weaponization via data), Q10.2 (consent for data access) |
| **Cognitive Liberty (CL)** | The right to freedom of thought and mental self-determination | Q1.2 (domain access), Q2.2 (motor vs cognitive), Q3.1 (root access), Q4.2 (patient vs clinician), Q4.3 (identity) |
| **Mental Integrity (MI)** | The right to be protected from unauthorized mental manipulation | Q1.1 (amplitude ceiling), Q2.1 (therapeutic vs enhancement), Q4.1 (escalation), Q9.1 (military) |
| **Psychological Continuity (PC)** | The right to preservation of personal identity | Q4.3 (device as identity), Q1.4 (firmware updates), Q8.1 (support commitment), Q10.1 (evolving capabilities) |
| **Equal Access (EA)** | The right to equitable access to mental augmentation | Q2.4 (interoperability), Q5.1 (open vs proprietary), Q6 (Neural Atlas), Q5.3 (funding) |

### Neuroethics Literature Mapping

| Ethicist / Source | Key Contribution | QIF Governance Question |
|-------------------|-----------------|------------------------|
| **Yuste et al. (2017)** — Nature 551:159-163 | "Four ethical priorities for neurotechnologies and AI." Proposed neurorights framework | Foundation for all 5 neurorights in RACI |
| **Ienca & Andorno (2017)** — Life Sci Soc Policy 13:5 | Proposed 4 specific neurorights: CL, MP, MI, PC | Tier 4-5 consent model, neurorights as ACL flags |
| **Goering et al. (2021)** — Science 373:988-990 | DBS and agency: patients report personality changes with device on/off | Q4.3 (device as identity), PC |
| **Kellmeyer (2022)** — Cambridge Handbook of RAI | "Mental privacy" and "mental integrity" lack agreed operational definitions | Q1.2 (domain access), why ACL flags need technical specification |
| **Davidoff (2020)** — Rutgers J Bioethics 11:9-20 | Agency and accountability: BCIs capture ~1.5% of neurons, insufficient for true agency attribution | Q3.2 (scripting), Q9.2 (weaponization responsibility) |
| **Lázaro-Muñoz et al. (2020)** | 74% of aDBS researchers identify informed consent as pressing challenge | Q10.1 (evolving consent), Q10.2 (Catch-22) |
| **Wexler (2019)** | Brain reading limits: decoded outputs selected from known lists, require cooperation | Q2.2 boundaries, why cognitive "lane-keep" is not yet feasible |
| **Tennison & Moreno (2012)** | Dual-use trap: security framing enables surveillance | Q9.1 (military), Q9.2 (weaponization) |
| **Morse (2006/2011)** | Brain Overclaim Syndrome: neural correlates ≠ causation | G1 guardrail, why NISS measures physics not psychology |
| **Chile Constitution (2021)** | First country to constitutionalize neurorights | Precedent for Tier 5 policy evolution |
| **Second Sight (2020)** | Company ceased operations, Argus II patients orphaned | Q8.1 (support), Q8.2 (escrow), Q5.2 (precedent) |

### Unresolved Tensions in Neuroethics

These are tensions that the literature has identified but not resolved. QIF does not claim to resolve them either — but naming them is the first step.

1. **Autonomy vs. Safety.** The patient's right to modify their own device (CL) vs. the risk of self-harm (MI). QIF's resolution: Tier 1-2 kernel limits are absolute; above that, the patient decides.

2. **Privacy vs. Research.** The patient's right to keep neural data private (MP) vs. society's interest in advancing neuroscience. QIF's resolution: opt-in data sharing with differential privacy, never compelled.

3. **Innovation vs. Standardization.** Open standards enable interoperability (EA) but may constrain innovation. QIF's resolution: standardize interfaces (NSP, Staves), not implementations. Manufacturers innovate within a compatible ecosystem.

4. **Individual vs. Collective.** One patient's jailbreak could produce knowledge that helps others (open source). But a jailbreak that fails could produce fear that harms the entire field. QIF's resolution: Tier 1-2 limits prevent hardware damage; software experimentation above that is the patient's right.

5. **Present vs. Future Consent.** A patient consents today to capabilities that will exist tomorrow. How do you consent to the unknown? QIF's resolution: continuous consent with capability-by-capability opt-in.

6. **Access vs. Security.** Making BCIs more accessible (EA) inherently expands the attack surface. More patients = more targets = more risk. QIF's resolution: security by design (NSP, Neurowall), not security by exclusion.

---

## Part IV: Security Architecture Questions

### Q-SEC-1: Does open source provide more transparency and control?

**Yes.** The arguments:

1. **Transparency.** Every line of code is auditable. A patient, their advocate, a security researcher, or a regulator can verify exactly what runs on the device. Proprietary devices are black boxes by definition.

2. **Control.** The patient (or the community) can modify, patch, fork, and maintain the software independently of the manufacturer. This is not just a convenience — it is a survival mechanism (Second Sight).

3. **Security.** Open-source security software (Linux, OpenSSL, WireGuard) has a strong track record. Vulnerabilities are found faster because more people are looking. The "security through obscurity" model has been repeatedly disproven.

4. **Interoperability.** Open standards enable device portability. A patient is not locked to one manufacturer's ecosystem.

**However**, the cons are real:

1. **Support gap.** No guaranteed SLA. If the patient has a problem at 3 AM, the open-source community may not respond. This is where AI bridges the gap (Q7.1).

2. **Funding.** Open-source neural device R&D needs a funding model that does not exist yet. The hybrid model (open standard, paid implementation support) is the most realistic path.

3. **Regulatory uncertainty.** Current FDA/CE frameworks assume a single responsible entity. Open-source challenges this model. A certification body for open-source neural devices would need to be created.

4. **Quality assurance.** Medical devices require rigorous QA. Open-source contributions must meet the same bar as commercial code. This requires a governance model (e.g., Linux Foundation-style, with a technical steering committee and a code review process).

### Q-SEC-2: How does passwordless auth work in practice?

See QIF-WHITEPAPER-V8-DRAFT.md Section 15. PQKC + Biomarker MFA + Capability-based access. The key insight: the patient does not authenticate — the device authenticates to the gateway, and the patient is continuously verified via biomarkers.

### Q-SEC-3: What is the attack surface of interoperable neural hardware?

See Section 6 (Open Source Neural Atlas) > Security implications table. The key risks are supply chain (counterfeit components), compatibility attacks (malicious component claims compliance), and calibration poisoning (malicious calibration data).

### Q-SEC-4: Should the kernel be formally verified?

For Tier 1-2 safety enforcement, formal verification (mathematical proof that the code satisfies safety properties) is arguably necessary. Precedent: the seL4 microkernel is formally verified and used in defense/aerospace applications.

**Proposed:** Neurowall kernel should target formal verification for:
- Amplitude bounds enforcement (provably correct)
- Rate limiting (provably correct)
- Thermal monitoring (provably correct)
- Capability token validation (provably correct)

This is achievable for a kernel of Neurowall's scope (~2,000-5,000 lines of Rust). seL4's verification covered ~10,000 lines of C.

---

## Part V: The Open Source Neural Atlas Proposal

### What It Is

The Open Source Neural Atlas (OSNA) is a proposed open hardware specification for neural interfaces that enables:

1. **Hardware interchangeability.** Electrode arrays, processing units, and communication modules from different manufacturers can be combined in a single system.
2. **Software portability.** The operating system (Runemate/Scribe or alternatives) runs on any compliant hardware.
3. **Data portability.** Calibration data, personal configurations, and content libraries transfer between devices.
4. **Manufacturer independence.** The patient is never locked to a single vendor.

### Why It Matters

- **Second Sight proved** that proprietary lock-in is an existential risk to patients.
- **TCP/IP, USB, and RISC-V proved** that open standards enable ecosystems that no single company could build.
- **GDPR data portability rights** establish precedent — but do not yet cover neural data specifically.

### Timeline Honesty

This proposal is far from implementation. The security risks of interchangeable neural hardware are too high today for such a device. Electrode technology is evolving too rapidly to standardize connectors. The patient population is too small for market-driven standardization.

But the discussion must start now:

- Standardization takes decades (TCP/IP: 9 years from proposal to adoption, 20+ years to ubiquity)
- Early architectural decisions constrain all future options
- If proprietary ecosystems entrench before the standard exists, the standard may never be adopted
- The patients who need this most (those with legacy devices from defunct companies) cannot wait for the market to solve it

### The Hybrid Path

The most realistic path is a hybrid model:

1. **Open standard** defines interfaces, protocols, and data formats (this is QIF + NSP + Staves)
2. **Certified implementations** are built by manufacturers who compete on quality, support, and innovation — within the standard
3. **Source code escrow** ensures continuity if a manufacturer fails
4. **Formal certification body** (like Wi-Fi Alliance or Bluetooth SIG) verifies compliance
5. **AI-assisted support** bridges the gap between open-source community and 24/7 medical device support needs

### Pros and Cons: Full Evaluation

| Dimension | Open Source / OSNA | Proprietary / Closed | Assessment |
|-----------|--------------------|---------------------|------------|
| **Patient control** | Full visibility and modification rights | Manufacturer controls | OSNA: patients see and control what runs in their body |
| **Security transparency** | Auditable by anyone | "Trust us" model | OSNA: more eyes, faster vulnerability discovery |
| **Innovation speed** | Community-driven, diverse | Focused, IP-incentivized | Draw: different innovation models, both valuable |
| **Support quality** | Variable, community-dependent | Dedicated team, SLA-backed | Proprietary wins — unless AI fills the gap |
| **Regulatory fit** | No precedent for open-source Class III devices | Well-understood liability model | Proprietary wins today; frameworks will evolve |
| **Funding model** | Grants, consortia, hybrid | VC, revenue, IP | Proprietary wins in current market |
| **Longevity** | Code survives company failure | Code dies with company | OSNA wins — critically important |
| **Interoperability** | By design | Only if commercially beneficial | OSNA wins — patient portability as a right |
| **Liability** | Distributed, unclear | Single responsible entity | Proprietary wins for legal clarity |
| **Cost to patient** | Lower marginal cost | Higher cost, IP premium | OSNA wins long-term |

**Conclusion:** Neither model is strictly superior. The hybrid path — open standards with certified implementations — captures the benefits of both while mitigating the risks of each. The key insight: openness and quality are not in conflict. They require different governance structures, but the patient benefits from both.

> **Epistemic note:** The Open Source Neural Atlas is a proposed concept within QIF. No open hardware standard for implantable neural devices currently exists. The regulatory, safety, and practical challenges described here are real and unresolved. This proposal is intended to start a conversation, not to prescribe a solution. The timeline for practical implementation depends on advances in electrode technology, regulatory frameworks, and the neural device market — all of which are uncertain.

---

## References

- Yuste, R., et al. (2017). "Four ethical priorities for neurotechnologies and AI." *Nature*, 551, 159-163. DOI: 10.1038/551159a
- Ienca, M. & Andorno, R. (2017). "Towards new human rights in the age of neuroscience and neurotechnology." *Life Sciences, Society and Policy*, 13(5). DOI: 10.1186/s40504-017-0050-1. PMID: 28444626
- Goering, S., et al. (2021). "Recommendations for responsible development and application of neurotechnologies." *Science*, 373(6562), 988-990.
- Kellmeyer, P. (2022). "Neurorights: A Human-Rights Based Approach for Governing Neurotechnologies." *Cambridge Handbook of Responsible Artificial Intelligence*.
- Davidoff, E.J. (2020). "Agency and Accountability: Ethical Considerations for Brain-Computer Interfaces." *Rutgers Journal of Bioethics*, 11, 9-20. PMC: PMC7654969
- Lázaro-Muñoz, G., et al. (2020). Informed consent challenges in adaptive deep brain stimulation research.
- Morse, S.J. (2006). "Brain Overclaim Syndrome and Criminal Responsibility." *Ohio State Journal of Criminal Law*, 3, 397-412.
- Morse, S.J. (2011). "Lost in Translation? An Essay on Law and Neuroscience." *Law and Neuroscience: Current Legal Issues*, 13.
- Tennison, M.N. & Moreno, J.D. (2012). "Neuroscience, ethics, and national security: The state of the art." *PLoS Biology*, 10(3), e1001289.
- Wexler, A. (2019). "Separating Neuroethics from Neurohype." *Nature Biotechnology*, 37, 988-990.

---

*This document is a living record of governance questions for brain-computer interfaces. Questions are never deleted — only answered, refined, or superseded. Add new questions at the bottom of the relevant section with a timestamp.*
