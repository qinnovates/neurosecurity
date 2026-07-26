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
- [Part VI: Emergency Response — OS Update, Fallback, and Recovery](#part-vi-emergency-response--os-update-fallback-and-recovery)
- [Part VII: Kernel Core Responsibility RACI](#part-vii-kernel-core-responsibility-raci)

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

## Part VI: Emergency Response — OS Update, Fallback, and Recovery

**Status:** Draft. Added 2026-07-25, following an internal 5-panel adversarial review (safety-critical systems/hardware redundancy, GRC/governance architecture, devil's-advocate, NIST standards-process, and neuromodesty/epistemic-integrity lenses, each working independently). Companion to Part II (RACI Matrix), `NEUROSECURITY_POLICY_PROPOSAL.md` §5.1 (NIST engagement), and the `BCI-Security-Best-Practices` research wiki page.

**Scope note.** This Part covers OS/kernel update safety, runtime fallback, and human emergency override for a life-critical BCI — deliberately narrower than general Incident Response. Active-compromise / cyberattack response is already covered by the "Emergency and Edge Cases" table in Part II (row: "Device under active cyber attack," AI System = Responsible via Neurowall). Where an update-triggered event is later determined to be malicious rather than defective, QIF-IR-11 below hands off to that existing row rather than duplicating it.

**Status qualifier (applies to this entire Part).** Every control, threshold, and architecture pattern below is a proposed, unvalidated design — consistent with QIF's overall status. Numeric parameters (timing windows, thresholds) are illustrative examples requiring per-device and per-patient clinical validation, not established constants. "Accountable" denotes RACI process accountability, not a determination of legal liability, which is governed separately by applicable law, contract, and regulatory status.

### VI.1 Architecture Correction: Floor-Promotion, Not Dual Redundancy

An earlier draft of this scenario proposed continuity during a failed update via full dual-redundant kernel execution (two complete OS instances in hot-standby, with a hardware-timed handoff on failure). Internal review found this unsound for this context: it applies a hardware-fault-tolerance pattern — designed to vote between multiple lanes of *identical, already-certified* code — to a *software-version-cutover* problem, where there is no principled way to arbitrate between two genuinely different kernel versions; it introduces state-synchronization/staleness risk on failover; and for an implanted or wearable form factor it roughly doubles active power and heat load against tissue-heating and battery-life constraints that already dominate implant design.

**Corrected architecture — the Safety Floor pattern.** A minimal, low-power, independently-verifiable microcontroller ("the Floor") runs a bounded, formally-tractable safety-critical control loop continuously and is never itself the target of the general-purpose OS update process. The general-purpose OS (Kernel + systemd) sits *on top of* the Floor as an enhancement layer: when healthy, it extends function beyond the Floor's baseline; when it panics, fails a health check, or is mid-revert, control does not "fail over" to a second full OS — it reverts to the Floor's baseline, which was never interrupted. This mirrors the pattern used in implantable cardiac devices: a minimal, extremely conservative pacing kernel that is not itself the subject of routine over-the-air risk, paired with a separately-updatable diagnostics layer.

This reframes "Basic Mobility Mode" (originally an emergency-only last resort) as the **always-on baseline**, not an emergency measure — see VI.4 for why this floor must be defined per modality rather than as one undifferentiated "safe state."

### VI.2 Governance RACI — Emergency Response Controls

Reuses the six-column schema from Part II (Patient, Clinician, Manufacturer, Regulator (FDA/CE), Open Standard (QIF), AI System) for consistency — this Part does not introduce a second, competing RACI schema. Each row is a control (`QIF-IR-NN`) with an illustrative CSF 2.0 function mapping, intended as the near-term gap-analysis input referenced in `NEUROSECURITY_POLICY_PROPOSAL.md` §5.1 — targeted at NIST's OLIR submission process rather than self-convening a Community Profile working group (see VI.5).

| ID | Control | Patient | Clinician | Manufacturer | Regulator | Open Standard (QIF) | AI System | CSF 2.0 Function |
|----|---------|---------|-----------|---------------|-----------|----------------------|-----------|--------------------|
| QIF-IR-01 | Telemetry continuity during update (Floor stays live; OS layer is what updates) | I | C | R | I | C | — | Protect / Detect |
| QIF-IR-02 | Trigger routine (non-critical) OS/kernel update | C/A | C | R | I | — | — | Protect |
| QIF-IR-03 | Trigger critical security patch (active CVE) | C | R/A | R | A (compressed-timeline authority) | C | I | Protect / Respond |
| QIF-IR-04 | Runtime fallback execution (enhancement-layer panic; Floor unaffected) | I | I | R | I | — | — | Respond |
| QIF-IR-05 | Emergency human override (hardware veto trigger) | A | R | I | I | — | I | Respond |
| QIF-IR-06 | Override recovery and re-certification (return to OS control) | C/A | R/A | C | I | — | C | Recover |
| QIF-IR-07 | Override abuse detection and audit (tamper-evident log, lockout after N triggers) | I | C | R | I | — | R | Detect |
| QIF-IR-08 | Consent bootstrap when the BCI is the patient's primary communication channel | A (advance directive) | R | C | I | C | — | Govern |
| QIF-IR-09 | Power-loss-during-write integrity (atomic partition pointer swap) | I | I | R/A | I | C | — | Protect |
| QIF-IR-10 | Fleet-scale rollout governance and circuit breaker | I | I | R/A | C | C | C (anomaly detection) | Govern / Protect |
| QIF-IR-11 | Post-incident root cause and regulatory notification | I | C | R | A | — | I | Recover |
| QIF-IR-12 | Two-person integrity for non-emergency update authorization | I | R (+ independent reviewer) | C | I | — | — | Govern |

**Notes on new/revised rows** (all identified via the internal review, not present in the original draft):
- **QIF-IR-03** gives Regulator "A" for compressed-timeline authority because an unqualified Patient veto over an actively-exploited CVE patch is a safety gap, not a labeling nit — consent is still required and sought, but cannot indefinitely block a patch to a live vulnerability without an escalation path.
- **QIF-IR-06** — emergency override with no defined path back to normal operation was a life-critical gap in the original draft.
- **QIF-IR-07** — the override sits outside OS visibility for tamper-resistance, which also makes it capable of being tripped repeatedly (accidentally, maliciously, or by a coerced caregiver) undetected. The audit log must be written by hardware independent of the OS (write-once/tamper-evident), consistent with `BCI-Security-Best-Practices` item 15.
- **QIF-IR-08** addresses the consent-bootstrapping paradox: if the BCI is the patient's only expressive channel, the moment a critical patch is needed may be the moment they cannot articulate consent through it. Requires an out-of-band consent path (advance directive, physical control, or caregiver-witnessed dual consent for a pre-classified "cannot wait" tier) that does not depend on the subsystem being patched.
- **QIF-IR-10** — every other row is single-patient scoped; nothing halted a bad signed update across a device population in the original draft. Requires staged percentage rollout and an automatic global halt if aggregate fallback rate exceeds a threshold within a window, fed by anonymized aggregate telemetry distinct from per-patient sensory-motor telemetry (QIF-IR-01).
- **QIF-IR-12** — the Clinician/Medic role held Accountable or Responsible on nearly every row in the original draft with no second check. Added an independent-reviewer requirement for non-emergency triggers; does not apply to QIF-IR-05, which must remain fast and unilateral by design.

### VI.3 Technical Execution / Traceability Table

Deliberately **not** a second RACI. Components execute; they do not hold organizational accountability. This table traces each governance control to the component(s) that implement it. If this table and VI.2 ever disagree, VI.2 is authoritative and this table is corrected to match — not the reverse. This avoids maintaining two independently-updated RACI-shaped documents with different natural change cadences (org/regulatory change vs. firmware/kernel release cycles), which drift.

| ID | Floor (Safety MCU) | General-Purpose Kernel | systemd Suite | Bootloader / Firmware | Fleet Telemetry Aggregator |
|----|----------------------|--------------------------|------------------|--------------------------|--------------------------------|
| QIF-IR-01 | R (always-on baseline) | R (enhancement layer) | R (cgroup isolation) | — | — |
| QIF-IR-02 | — | — | R (staging, signed image) | — | — |
| QIF-IR-03 | — | — | R | — | — |
| QIF-IR-04 | R (unaffected by OS panic) | R (panic source) | R (health check) | — | — |
| QIF-IR-05 | R (drops OS access) | — | — | R (immutable trigger path) | — |
| QIF-IR-06 | — | R (re-admitted after check) | R (integrity re-verify) | R (attestation) | — |
| QIF-IR-07 | R (write-once log) | — | — | R (tamper-evident storage) | — |
| QIF-IR-08 | — | — | — | R (out-of-band consent I/O) | — |
| QIF-IR-09 | — | — | R (atomic pointer swap, post-checksum only) | R (power-loss-safe write) | — |
| QIF-IR-10 | — | — | — | — | R |
| QIF-IR-12 | — | — | R (enforces dual-sign gate) | — | — |

### VI.4 Modality-Specific Fail-Safe Floor Specification

A single undifferentiated "safe state" does not fit every sensory-motor pathway — freezing is a defensible floor for motor control, but a frozen visual frame or complete audio silence are each dangerous in ways specific to that modality. Each floor inherits the hardware-enforced amplitude ceiling already established in this document's governance model (Part I, Q1.1, Q3.3) — physical safety bounds are enforced in hardware and cannot be raised by any software layer, including the enhancement OS.

**Motor.** Floor = the always-on MCU stability/posture controller (VI.1). On enhancement-layer failure, control reverts to this floor rather than a full stop — a hard freeze mid-gait is itself a fall risk, so the floor should implement a bounded, conservative stability-hold behavior rather than a rigid lock, pending clinical validation of what "safe" means for a given patient's mobility profile. *Confidence: theoretical, unvalidated — exact floor behavior needs a rehabilitation/gait specialist's input, not only a systems-engineering judgment.*

**Vision.** Floor = fail-dark (no rendered signal) paired with a mandatory cross-modal alert (haptic or audio orientation cue) — never fail-dark silently. A last-known-good frame may substitute for fail-dark only if explicitly time-bounded and flagged to the user as stale; an unflagged frozen frame during motion (e.g., mid-street-crossing) is more dangerous than an announced blackout. True hot redundancy — the floor-promotion pattern from VI.1, extended to a scoped, always-live decode/render pipeline rather than the whole OS — may be justified for vision specifically if fail-dark-plus-alert proves clinically insufficient; this is a modality-specific decision, not inherited automatically from the motor case. *Confidence: theoretical, unvalidated.*

**Auditory.** *(New — extends this framework to hearing-loss-compensation and tinnitus-suppression BCIs, per the project's Wearable Auditory BCI concept: a non-invasive, bone-conduction, glasses-integrated device with an onboard DSP/AI processing layer. The underlying hardware concept is status: draft, confidence 0.5 in the research record — the floor spec below is correspondingly earlier-stage than the motor/vision cases above, not equally mature.)*

Floor = passive analog passthrough: a hard-wired, minimal circuit relaying the ambient microphone signal directly to the bone-conduction transducer, bypassing the DSP/AI processing layer entirely. **Not silence.** For a device compensating hearing loss, losing all processing is equivalent to losing hearing outright — the user loses access to traffic, alarms, and spoken warnings, which is the auditory-domain analog of vision fail-dark being dangerous, not the auditory-domain analog of a "safe" quiet state. Two failure sub-cases specific to this device class:
- **Hearing-loss compensation failure** → revert to passive passthrough (unprocessed but present, not absent).
- **Tinnitus active-cancellation failure** → the anti-phase canceling signal stops and the patient's phantom tone returns. Not itself a safety hazard, but must be signaled cross-modally (haptic or visual) — the audio channel cannot be trusted to announce its own failure, matching the cross-modal alert pattern used for vision.

Amplitude ceiling: even though bone conduction bypasses the eardrum, sustained cochlear-hair-cell overdrive from a runaway DSP is a plausible failure mode and must be bounded by the same hardware-enforced ceiling used elsewhere in this framework, not left to software. *Confidence: theoretical, unvalidated — the underlying hardware concept has not been prototyped beyond personal bone-conduction testing per the research record; this floor spec is a design proposal to validate alongside the hardware, not a retrofit onto an existing shipped device.*

### VI.5 NIST Engagement Path — Correction

Internal review, cross-checked against NIST's own guidance (NIST CSWP 32, "NIST Cybersecurity Framework 2.0: A Guide to Creating Community Profiles," April 2024), found that Community Profiles are convened by trade associations, sector coordinating councils, or regulators — not by NIST on a contributor's behalf, and not typically by an unaffiliated individual. The near-term step in `NEUROSECURITY_POLICY_PROPOSAL.md` §5.1 ("convene a BCI security working group under NIST's Community Profile program") should be revised: the CSF 2.0 function-mapping columns in VI.2 are better targeted at **NIST's OLIR (Online Informative References) Program** (NISTIR 8278A) — a self-service, NIST-reviewed submission process for exactly this kind of control-to-CSF-function mapping — with a formal Community Profile treated as a possible long-term outcome once an institutional co-sponsor (professional society, university, or manufacturer) is willing to convene it, not a self-executable near-term step. Given this is FDA-regulated hardware, AAMI TIR57, ANSI/AAMI SW96, and IEEE 2621 are plausibly a more directly relevant standards chain than NIST CSF alone, and peer-reviewed publication of the underlying threat catalog and scoring methodology is a credibility prerequisite that should precede any standards-body submission, not run parallel to it. This Part deliberately does not extend SP-800-53-style formatting further than the `QIF-IR-NN` ID scheme already in use, to avoid the document appearing pre-reviewed by NIST before any actual submission exists.

---

## Part VII: Kernel Core Responsibility RACI

**Status:** Draft. Added 2026-07-25.

**Purpose.** The Kernel appears as a single undifferentiated "Responsible" actor throughout Parts II and VI, which understates what "the Kernel" actually does and collapses four functions with different threat surfaces and, in practice, different accountable parties into one label. This Part decomposes the Kernel into its four foundational responsibility domains — the standard operating-systems decomposition (hardware abstraction, resource scheduling, memory management, protection/access control) — and assigns governance accountability to each, reusing the six-column schema from Part II.

| ID | Kernel Function | What It Does | Patient | Clinician | Manufacturer | Regulator | Open Standard (QIF) | AI System | Primary Threat Surface | Mapped TARA Technique(s) |
|----|-------------------|----------------|---------|-----------|---------------|-----------|-----------------------|-----------|---------------------------|-----------------------------|
| QIF-K-01 | Hardware Driver | Directly interfaces with electrode arrays, ADC/DAC, actuators/transducers — the only layer that touches physical signal in or out | I | C | R/A | C | C | C (anomaly detection) | Malicious or buggy driver → direct physical signal manipulation | QIF-T0043 (supply chain firmware backdoor), QIF-T0046 (OTA firmware weaponization), QIF-T0048 (electrode compromise/physical tamper), QIF-T0050 (hardware fault injection — voltage/EM glitching), QIF-T0001 (signal injection at electrode-tissue boundary) |
| QIF-K-02 | Resource Management | Schedules CPU/IO cycles (e.g., PREEMPT_RT) and allocates bandwidth across competing processes/threads | I | C | R | I | C | C | Starvation/DoS of the safety-critical control loop by a lower-priority process | No direct match — see Coverage Gap 1 below. QIF-T0029 (Neural DoS / stimulation flood) and QIF-T0031 (battery drain) are the closest catalog entries, but both model physiological/power-layer DoS, not OS-scheduler-layer starvation of the safety-critical thread. |
| QIF-K-03 | Memory Accountant | Allocates, isolates, and tracks memory per process; enforces that one process cannot read or write another's memory | I | I | R/A | I | C | C | Memory-safety bugs → arbitrary code execution or cross-process neural-data exfiltration | No match — see Coverage Gap 2 below. QIF-T0054/T0060/T0034 ("memory extraction," "memory implant," "working memory poisoning") were checked directly against source and confirmed to model *neurocognitive* memory (hippocampal/working-memory circuits), not kernel process memory — not applicable here despite the name overlap. |
| QIF-K-04 | Permissions / Boundaries | Enforces the capability-tier model (Tier 1-5, Part I Q3.1) and process/trust-domain isolation | C | C | R | I | A | C | Privilege escalation / jailbreak past a tier boundary | QIF-T0049 (wireless authentication bypass), QIF-T0050 (hardware fault injection — "can bypass security checks"), QIF-T0061 (coherence mimicry — evades QIF's own detection boundary directly) |

**Notes:**

- **QIF-K-01 (Hardware Driver).** The function with the most direct path to physical harm — a bad driver doesn't corrupt data, it can miswrite a stimulation waveform. Manufacturer holds both R and A because they write and certify the driver; Regulator and QIF are Consulted on driver-level safety requirements — this is where the amplitude ceiling from Part I Q1.1 is actually enforced in code, not just specified on paper.
- **QIF-K-02 (Resource Management).** This is the general case of what QIF-IR-01 (Part VI, telemetry continuity) governs for the update-fallback scenario specifically. A resource-starvation attack — e.g., a log-flush process stealing cycles from the motor driver — doesn't require compromising the driver at all, only winning the scheduler.
- **QIF-K-03 (Memory Accountant).** "Memory accountant" is doing real work as a name, not just usage tracking — it's the boundary that prevents one process's fault or compromise from reading or corrupting another's state. This is why Part IV's Q-SEC-4 proposes formal verification specifically for this class of kernel property (seL4 precedent): memory-safety bugs are the most common root cause of confidentiality/integrity failures in general-purpose kernels, and in a BCI context, a memory-safety bug here is the most plausible software path to unauthorized read or write of live neural signal.
- **QIF-K-04 (Permissions/Boundaries).** Open Standard (QIF) holds Accountable here, not Manufacturer — the Tier 1-5 capability model itself (which tier permits what) is a QIF governance decision (Part I, Q3.1); the Manufacturer's role is to correctly *implement* QIF's tier definitions, not to define them. This is the one row where a manufacturer implementing the boundary incorrectly is a standard-conformance failure, not only a manufacturer defect — relevant once a conformance/certification program (Part V) exists.

**Relationship to TARA.** Mapped against the canonical registry (`datalake/qtara-registrar.json`, 161 techniques / 16 tactics / 8 domains — the `osi-of-mind/tara-threat/` directory holds only PoC writeups, not the catalog itself; `config.py` in `qif-lab/` is the actual source of truth). Two real coverage gaps surfaced in the process of mapping, rather than being assumed in advance:

**Coverage Gap 1 — no technique for OS-scheduler-layer resource starvation (QIF-K-02).** TARA's DoS-adjacent techniques (QIF-T0029 Neural DoS, QIF-T0031 battery drain) model attacks on the physiological/power layer — flooding the neural pathway or draining the battery. None model a distinct and simpler attack: a malicious or merely buggy co-resident process winning the OS scheduler and starving the safety-critical control thread of CPU/IO cycles without touching the neural signal path at all. This is exactly the failure mode QIF-IR-01 (Part VI) and the Floor-Promotion architecture (VI.1) exist to defend against, and it currently has no corresponding entry in the threat catalog.

**Coverage Gap 2 — no technique for kernel memory-safety exploitation (QIF-K-03).** Checked directly against source text: TARA's three "memory"-named techniques (QIF-T0054 memory extraction, QIF-T0060 memory implant, QIF-T0034 working memory poisoning) all model attacks on *neurocognitive* memory — hippocampal activity, long-term potentiation, working-memory circuits — not kernel process memory. There is currently no TARA technique modeling classic memory-safety exploitation (buffer overflow or use-after-free in the kernel/driver → arbitrary code execution or cross-process neural-data exfiltration). This is the exact attack class Part IV's Q-SEC-4 (seL4-style formal verification target) is proposed to defend against — the catalog that should motivate that proposal doesn't yet describe the threat it defends against.

**Recommended follow-up:** add technique candidates for both gaps to `config.py` (BCI System domain, `QIF-B.*` tactics fit best) and regenerate the registry per the As-Code process in `tara-threat/README.md`, rather than hand-editing the JSON.

**Part VI cross-references** (controls with a direct TARA match): QIF-IR-02/QIF-IR-03 (trigger update) → QIF-T0043, QIF-T0046; QIF-IR-05/QIF-IR-07 (override trigger/abuse) → QIF-T0050 (hardware fault injection can "bypass security checks," directly relevant to override-tampering risk); QIF-IR-08 (consent bootstrap) → QIF-T0064 (user consent fatigue / neural permission flooding — relevant if compressed-timeline consent requests under QIF-IR-03 recur often enough to induce reflexive approval). QIF-IR-09 (power-loss-during-write integrity) had no direct TARA match at time of writing. QIF-IR-10 (fleet-scale circuit breaker) was also initially assessed as having no direct match — **correction below (VII.1): QIF-T0047 "Mass BCI compromise (platform attack)" is a real, adjacent existing entry that was missed in the first pass** because it was not surfaced until a full-catalog search was run rather than a keyword sample.

### VII.1 Candidate Techniques — Merged Into Live Catalog (QIF-T0162–T0165)

Added 2026-07-25. The three gaps above were run through a two-wave internal review: three independent SMEs each drafted schema-conformant candidate techniques (grounded in the real catalog schema and the As-Code status/dual_use vocabulary), then an adversarial duplicate/scoping critic and a citation/schema reviewer independently stress-tested the output — the critic with direct tool access to the live 161-entry catalog file, not just the sampled excerpts the generators were given. Full disposition:

| Candidate | Gap | Live ID | Disposition | Notes |
|---|---|---|---|---|
| Control-thread starvation via co-resident process (scheduler/synchronization abuse) | Coverage Gap 1 (K-02) | **QIF-T0162** | **Merged** — tactic corrected to QIF-P.DS per VII.2 | Originally proposed as two entries (priority-inversion blocking vs. RT-privilege/IRQ-quota abuse); the critic applied real ATT&CK precedent (T1499 Endpoint DoS's sub-technique pattern: same tactic + same outcome = one technique, mechanism-variants documented within it, not split) and recommended merging. Both mechanisms — synchronization-primitive blocking and privilege/IRQ-abuse — should be documented as named vectors inside one entry. Status: THEORETICAL. Cites the real, verified 1997 Mars Pathfinder priority-inversion incident (VxWorks) and Sha/Rajkumar/Lehoczky 1990 (IEEE Trans. Computers, DOI 10.1109/12.57058) as a non-BCI analog, not as evidence of a BCI-specific instance. |
| Kernel/driver memory-safety exploitation — code execution / control-loop corruption | Coverage Gap 2 (K-03) | **QIF-T0163** | **Merged** — tactic QIF-B.IN confirmed correct | The critic applied the opposite ATT&CK precedent here on purpose: when one vulnerability class serves genuinely different tactics (execution vs. data harvest), ATT&CK keeps them as separate top-level techniques linked by naming/cross-reference (see T1068/T1203/T1211/T1210, all frequently the same underlying bug class, cataloged separately by tactic). Before forwarding: justify or drop the cross-reference to QIF-T0001 (currently asserted without clear justification), and add an explicit bidirectional cross-reference to the exfiltration variant below. Status: THEORETICAL. |
| Kernel/driver memory-safety exploitation — cross-process neural-data exfiltration | Coverage Gap 2 (K-03) | **QIF-T0164** | **Merged** — tactic QIF-D.HV confirmed correct | Sibling to QIF-T0163, bidirectional cross-reference in place. Status: THEORETICAL, severity medium. |
| OTA firmware write interruption (power-loss partition corruption) | Coverage Gap 3 (QIF-IR-09) | **QIF-T0165** | **Merged, revised** — tactic corrected to QIF-P.DS per VII.2 | Originally proposed at `status: PLAUSIBLE`. The critic checked the real status distribution across all 161 techniques: PLAUSIBLE is used exactly once (QIF-T0100, backed by six peer-reviewed sources), while THEORETICAL is the catalog's actual default for "well-documented general hazard class, no BCI-specific instance" — the exact evidence tier this candidate and its two siblings share. **Downgrade to THEORETICAL** for internal consistency. Also rewrite the mechanism to be explicitly attacker-induced (name the vector — malicious charging accessory, PMIC fault injection, forced reset during the verify-then-commit window) and move the "can also occur non-adversarially" caveat into a segregated notes annotation rather than blending it into the attack narrative. Cites NIST SP 800-193, the AOSP A/B update reference design, and Samuel et al. CCS 2010 (TUF) — all independently verified as real and accurately characterized. |
| Fleet-scale rollout/blast-radius risk | Coverage Gap 4 (QIF-IR-10) | *(enrichment, not a technique)* | **Filed as structured enrichment** | Live now: a structured `deployment_control_gap` field is attached to **both QIF-T0043 and QIF-T0046**, explicitly cross-referenced to **QIF-IR-10** (this document, Part VI) and to **QIF-T0047 "Mass BCI compromise (platform attack)"** — a real existing entry (QIF-P.DS, EMERGING, critical: "coordinated attack exploiting standardized BCI platforms affecting millions simultaneously... monoculture risk") that models a related but mechanistically distinct risk (shared vulnerability across a device monoculture, vs. this gap's absence of staged/canary rollout for a single push). Both entries' `cross_references` were updated to link to T0047, so the two don't independently accumulate overlapping "fleet blast radius" content in isolation. The real-world analog cited (July 19, 2024 CrowdStrike Falcon content-update outage — verified real, ~8.5M Windows endpoints affected by a single unstaged global push) remains valid supporting context for the enrichment, not a BCI-specific claim. |

**Blocking item — resolved (VII.2):** all tactic assignments above (QIF-B.IN for four of the five) were made by generators shown only 5 of the catalog's 16 real tactics — flagged as a likely anchoring artifact and checked against the full 16-tactic list before merge. Two were reclassified to QIF-P.DS; the other two were confirmed correct as filed. See VII.2 for the reasoning.

**Schema hygiene:** all four merged entries include the real schema's nested `governance`/`engineering`/`dsm5` sub-blocks under `tara` (not just `mechanism`/`dual_use`/`clinical`) and correctly nest `dual_use` under `tara.dual_use`. The ad-hoc `reasoning_note`/`clinical_note` field names some drafts used to flag their own uncertainty were not carried into the merged entries — that uncertainty is folded into `notes` on each technique instead.

**Citation integrity:** every sourced claim across all five candidates was independently re-verified this session (Sha/Rajkumar/Lehoczky 1990, the 1997 Mars Pathfinder incident, NIST SP 800-193, Samuel et al. CCS 2010, the July 2024 CrowdStrike outage, Szekeres et al. "SoK: Eternal War in Memory" 2013, four MITRE CWE entries, MITRE ATT&CK T1495) — all confirmed real and accurately characterized. No fabricated or BCI-incident-overclaiming citations found.

**Merged 2026-07-25** as QIF-T0162–QIF-T0165 plus the QIF-T0043/QIF-T0046 enrichment, directly into `datalake/qtara-registrar.json` (not via `populate-tara.py` or `enrich-skeletons.py` — both were confirmed unsafe/superseded for this purpose; see the deprecation note in `populate-tara.py`'s own docstring and `tara-threat/README.md`). Verification chain run and passed: `recalculate-niss.py` reported **zero changes** against the hand-computed vectors in VII.2 — independent confirmation the by-hand NISS math was correct; `backfill-taxonomy.py` classified all four as domain `SIL` (silicon-only) via the `band_ids` check, overriding what tactic alone would have suggested; `npm run health` — 10 checks passed, 0 failures. Registry grew from 161 to 165 techniques; count references updated across the operationally-live docs that track it (root `README.md`, `osi-of-mind/README.md`, `tara-threat/README.md`, `QIF-DATA-MAPPING.md`, `convergence-data.ts`). Two whitepaper drafts (`QIF-WHITEPAPER.md`, `QIF-WHITEPAPER-V8-DRAFT.md`) and one dated historical changelog entry (`QIF-TRUTH.md`) were deliberately left untouched — the former mix current-state and historical narrative with other pre-existing stale numbers in the same sentences (11 tactics/7 domains vs. the real 16/8), and a partial fix would leave them more inconsistent, not less; the latter is a changelog row correctly describing what the registry looked like on 2026-03-15.

### VII.2 Tactic Check and NISS Vectors — Verified Against Live Merge

Resolved 2026-07-25 by checking the four forward candidates against all 16 real tactics (`data['tactics']`) and computing draft NISS 1.1 vectors against the real, verified rubric and formula in `qtara-registrar.json['niss_spec']` — neither was available to the original generators, who were shown only 5 of 16 tactics and no NISS rubric at all.

**Tactic correction.** Two of the four candidates were misclassified. QIF-P.DS's actual definition explicitly reads "disrupting neural function, causing physical harm, **denying BCI service**, or weaponizing motor output" — a materially better fit than QIF-B.IN's "gaining initial access... via electrodes, RF, firmware, or supply chain" for a technique that never breaches anything, only denies service:

- **Control-thread starvation (merged)** and **OTA write interruption** → move from QIF-B.IN to **QIF-P.DS**, alongside their true siblings QIF-T0029 and QIF-T0031 (both already there for the same reason: pure availability attacks with no access-breach step).
- **Memory-safety — execution/control-loop corruption** stays QIF-B.IN — correctly, this one *does* breach a boundary (achieving code execution within the kernel trust domain), which is what B.IN actually models.
- **Memory-safety — exfiltration** stays QIF-D.HV — already the correct fit, no change.

**NISS vectors — verified.** Computed using the real formula (`NISS = Σ(w_i·M_i) / Σw_i`, default weights BI=1.0/CR=0.5/CD=0.5/CV=1.0/RV=1.0/NP=1.0, PINS trigger = BI≥H OR RV==I) and calibrated against five real entries (QIF-T0029, T0031, T0043, T0046, T0047). Filed as the vectors on QIF-T0162–QIF-T0165, then independently re-derived by `recalculate-niss.py` — it reported **"Changed: 0"** against these hand-computed values, confirming the by-hand math matches the canonical implementation exactly. Sub-metric letter grades (e.g., H vs. C on Biological Impact, T vs. P on Reversibility) remain judgment calls a maintainer may want to revisit, but they are no longer provisional — they're what's live:

| Candidate | Tactic | Vector | Score | NISS Severity | PINS | Calibration note |
|---|---|---|---|---|---|---|
| Control-thread starvation | QIF-P.DS | NISS:1.1/BI:N/CR:N/CD:L/CV:N/RV:F/NP:N | 0.4 | low | false | Scored near QIF-T0031 (battery drain, 0.7/low) — comparable profile: a resource-layer DoS with no direct neural interaction. CD:L (not N) reflects that, unlike battery drain, this is immediate rather than gradual/preventable. |
| Memory-safety — execution/control-loop corruption | QIF-B.IN | NISS:1.1/BI:H/CR:N/CD:H/CV:N/RV:T/NP:N | 2.7 | low | **true** | BI:H because corrupted control-loop state has a direct path to dangerous physical actuation (unlike the starvation candidate, which only denies function). This is the only one of the four that trips PINS (BI≥H). |
| Memory-safety — exfiltration | QIF-D.HV | NISS:1.1/BI:N/CR:H/CD:N/CV:I/RV:F/NP:N | 2.7 | low | false | High Cognitive Reconnaissance and full Consent Violation, but the formula's heaviest weights (BI, RV, NP) are all zero for a pure data-read event with no biological harm — this is a structural property of NISS being biologically-weighted, not a scoring error. |
| OTA write interruption | QIF-P.DS | NISS:1.1/BI:L/CR:N/CD:H/CV:P/RV:P/NP:N | 3.4 | low (just under the medium threshold of 4.0) | false | Calibrated between T0043 (backdoor persistence, 4.7/medium) and T0031 (pure resource attack, 0.7/low) — this candidate's core outcome is device bricking/malfunction, not a working malicious payload, so it sits below T0046 (full weaponization, 6.7/medium). |

**On the niss.severity vs. top-level severity divergence** (e.g., a candidate landing on `niss.severity: low` while its top-level `severity` field was drafted as `high`): checked against all five real calibration entries and confirmed this is consistent house style, not an error — QIF-T0001, T0029, T0043, and T0046 all carry a top-level severity one or more tiers above their computed `niss.severity`. The top-level field appears to reflect broader engineering/safety judgment (operational danger, ease of exploitation); `niss.score` is deliberately scoped to biological/cognitive impact specifically. Both fields should be kept, not reconciled to match.

**Resolved (VII.1):** `dual_use` is correctly nested under `tara.dual_use` in all four merged entries, and no ad-hoc field names were carried into the live JSON. Merged directly rather than through `populate-tara.py` (deprecated) or `enrich-skeletons.py` (superseded for this purpose) — see VII.1's closing note for the full verification chain (`recalculate-niss.py`, `backfill-taxonomy.py`, `npm run health`, all passed).

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
- NIST. (2024). "NIST Cybersecurity Framework 2.0: A Guide to Creating Community Profiles." NIST CSWP 32.
- NIST. "National Online Informative References (OLIR) Program: Submission Guidance for OLIR Developers." NISTIR 8278A, Revision 1.
- NIST. (2024). "The NIST Cybersecurity Framework (CSF) 2.0."

---

*This document is a living record of governance questions for brain-computer interfaces. Questions are never deleted — only answered, refined, or superseded. Add new questions at the bottom of the relevant section with a timestamp.*
