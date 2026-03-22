---
title: "I Built the First BCI Security Plugin for AI Coding Platforms. Here's How to Test It Today."
date: "2026-03-17"
source: "https://github.com/qinnovates/bci-security"
tags: ["#BCI", "#Security", "#Plugin", "#TARA", "#EEG", "#OpenSource"]
author: "Kevin Qi"
fact_checked: true
fact_check_date: "2026-03-17"
fact_check_notes:
  - "[verified] 161 TARA techniques count matches tara-techniques.json"
  - "[verified] 18 PII detection patterns count matches pii-patterns.json"
  - "[verified] 6 regulatory frameworks referenced are correctly named"
  - "[verified] Chile Neurorights Law enacted 2021 (constitutional amendment)"
  - "[verified] Plugin is published at github.com/qinnovates/bci-security"
  - "[verified] Dual-use count: 79 confirmed + 18 probable + 9 possible = 106 total"
  - "[verified] ADHD Mendeley dataset: 79 subjects, CC BY 4.0, Mendeley Data"
  - "[advisory] ASD EEG datasets referenced are from published open-access sources — verify source URLs before citing in academic work"
---

There's no security scanner for brain-computer interfaces. Not in any IDE, not in any AI coding platform, not anywhere. CVSS doesn't model biological impact. MITRE ATT&CK doesn't cover neural systems. If you're building BCI software today, you're flying without instruments.

So I built one. And you can test it today with your own AI coding agent using anonymized EEG data we compiled from open research.

## What the Plugin Does

[BCI Security](https://github.com/qinnovates/bci-security) is an open-source plugin that scans BCI codebases for security issues, scores threat severity, checks regulatory compliance, anonymizes neural data, and enforces neuroethics guardrails. No API keys. No server. No dependencies. It works inside any AI coding platform that supports plugin architectures.

Eight skills, seven scan rules:

1. **Scans BCI code** for unsafe patterns across 7 detection rules: transport encryption, data storage PII, hardcoded credentials, regulatory PII, ML model security, stimulation safety bounds, and MNE/NWB pipeline security
2. **Anonymizes neural data** before processing. Scans EDF, BDF, XDF, FIF, NWB, GDF, CSV, and MAT files for PII in headers, filenames, and metadata. Generates remediation scripts you review and run
3. **Detects PII in neural data pipelines** using 18 pattern-matching rules mapped to GDPR, CCPA, Chile Neurorights, UNESCO, Mind Act, and HIPAA
4. **Generates compliance reports** across 9 regulatory domains with remediation roadmaps
5. **Looks up threat techniques** from TARA, a catalog of 161 attack techniques targeting neural systems
6. **Scores severity** using NISS, a neural-specific supplement to CVSS with 6 dimensions (biological impact, coherence disruption, consent violation, reversibility, neuroplasticity, coupling risk)
7. **Checks neuroethics compliance** against 8 published guardrails from the literature
8. **Teaches** through interactive walkthroughs that use real TARA catalog data

## Test It Today With Your AI Coding Agent

You don't need a BCI device. You don't need neural data. The plugin ships with pre-tagged sample data from open research that you can scan immediately.

### Step 1: Install

```bash
git clone https://github.com/qinnovates/bci-security.git
```

**For Claude Code:**
```bash
claude plugins install --scope user ./bci-security
```

**For other AI coding platforms:** The plugin is pure markdown and JSON. No compiled code, no runtime dependencies. If your platform supports a plugin or skill directory structure, point it at the cloned repo. The architecture is agent-agnostic: skills are markdown instructions, data is JSON, hooks are lightweight Python scripts. Adapt the `skills/` directory to your platform's skill format.

**For manual use with any AI:** Copy the contents of a SKILL.md file and the relevant data JSON into your AI conversation. The instructions work with any model that can read files and follow structured prompts.

### Step 2: Run the Demo

```
/bci-scan --demo
```

This scans the bundled ADHD research study sample and a vulnerable BCI script. You'll see all 7 detection rules in action: transport security findings, PII in neural data headers, hardcoded credentials, regulatory compliance gaps, ML model loading without verification, and stimulation parameters without safety bounds.

The demo produces a full threat report with TARA technique mappings and NISS severity scores in about 30 seconds.

### Step 3: Try the Anonymizer

```
/bci anonymize --demo
```

This scans the sample data for PII before processing. You'll see it catch subject names in EDF filenames, dates of birth in metadata, clinical diagnoses embedded in recording headers, and missing consent sidecar files. It generates anonymization scripts (pyedflib, MNE, pynwb) that you can adapt for your own data.

### Step 4: Run a Compliance Report

```
/bci compliance --demo
```

This maps the sample findings to specific regulatory articles: GDPR Article 9 (special category data), GDPR Article 22 (automated profiling), CCPA biometric provisions, Chile Neurorights Articles 2-5, UNESCO Recommendation Articles 14-19, and HIPAA de-identification standards. Each finding comes with a remediation roadmap.

### Step 5: Explore the Threat Catalog

```
/bci explain QIF-T0001
/bci learn tara
```

Browse 161 attack techniques with three layers of detail. See the therapeutic analog for each one. 106 out of 161 techniques share mechanisms with therapeutic treatments. The difference between therapy and attack is consent, dosage, and oversight.

## The Sample Data: ADHD EEG From Open Research

The plugin includes test fixtures based on real open-access EEG research structures. Qinnovate compiled and pre-tagged these samples from published datasets so you can test without needing your own BCI data.

**ADHD datasets referenced:**

| Dataset | Subjects | Channels | Rate | Source | License |
|---------|----------|----------|------|--------|---------|
| ADHD Adult Resting State | 79 (37 ADHD + 42 controls) | 5 (O1, F3, F4, Cz, Fz) | 256 Hz | Mendeley Data | CC BY 4.0 |
| ADHD Children | 121 (61 ADHD + 60 controls, ages 7-12) | 19 | 128 Hz | IEEE DataPort | Academic |
| ADHD Focus + Gameplay | ADHD during interactive tasks | 14 | 128 Hz | IEEE DataPort | Academic |

Each dataset is tagged with DSM-5 codes (F90.0) and TARA technique IDs showing which attack techniques are relevant to that recording paradigm. For example, the Mendeley ADHD dataset's frontal theta elevation at Fz illustrates the signal-level characteristics that a signal injection attack (QIF-T0001) would target, for threat modeling purposes.

### ADHD vs ASD: Why TARA Needs Both

If you're doing BCI security work, you can't treat ADHD and ASD users as the same signal environment. They share some markers (reduced P300 amplitude, reduced MMN, Pe attenuation) but diverge on the signals that matter for threat modeling:

| EEG Marker | ADHD | ASD |
|-----------|------|-----|
| Gamma at rest | Nothing notable | Elevated (g=0.37) — strongest ASD-specific power marker |
| Theta at Cz | Elevated in subgroup | No deviation |
| Alpha | Coherence disrupted | Power reduced globally |
| P300 latency | Prolonged | Normal (amplitude reduced only) |
| N170 face ERP | Normal (gaze-specific only) | Broadly delayed — most replicated ASD ERP finding |
| Connectivity | Alpha-band frontal disruption | Long-range underconnectivity across multiple bands |

The TARA implication: a technique operating in gamma at rest hits an elevated baseline in ASD but not ADHD. A technique timed to P300 windows hits delayed responses in ADHD but normal timing in ASD. The coherence patterns are structurally different. ADHD disrupts alpha frontal networks; ASD disrupts broader temporal-frontal pathways.

This is why the sample data includes both conditions. Different signal environments produce different risk profiles. The plugin's threat model should account for the neural population being protected, not assume a single "normal" baseline. These are EEG pattern references for threat modeling purposes, not diagnostic markers.

### The Diagnostic Problem This Points To

The ADHD-ASD table above isn't just a security concern. It's a clinical one.

ADHD and ASD share enough surface symptoms that misdiagnosis is common. The clinical term is **camouflaging** (Hull et al. 2017, Lai et al. 2017): individuals with high-functioning ASD develop compensatory behaviors that mask core ASD features, causing clinicians to see ADHD-like attention and executive function issues instead. This is particularly prevalent in women and adults who learned to compensate early. The environment introduces masking behaviors that make differential diagnosis difficult from behavioral observation alone.

The consequences are real. Misdiagnosis leads to mis-medication: stimulants prescribed for ADHD can increase anxiety and sensory overload in ASD. SSRIs prescribed for the anxiety that follows misdiagnosis may not address the underlying condition. Years of wrong treatment before a correct diagnosis is not uncommon.

EEG offers something behavioral observation can't: objective signal-level data that doesn't depend on whether the patient has learned to mask.

**Three research gaps that BCI-assisted diagnostics could address:**

1. **No ADHD-vs-ASD EEG classifier exists at clinical accuracy (>80%).** Published classifiers compare one disorder against typically developing controls. The clinically important question, distinguishing ADHD from ASD in the same individual, is unanswered.

2. **No validated multi-paradigm EEG battery for differential diagnosis.** The ABC-CT consortium has an ASD-vs-TD battery. No 4-group battery (ASD, ADHD, ASD+ADHD, typically developing) exists. You can't differentially diagnose what you can't differentially measure.

3. **Resting-state EEG alone is insufficient.** Shephard et al. (2019) demonstrated that ADHD connectivity differences are invisible at rest. The cognitive state during recording is the variable. This means any diagnostic EEG battery needs task-state paradigms, not just eyes-open/eyes-closed resting recordings.

**The face processing double dissociation**

This is the cleanest published result for differential EEG diagnosis. Same paradigm (face processing), same recording, two different ERP time windows:

| Window | ADHD | ASD | ASD+ADHD |
|--------|------|-----|----------|
| N170 (170ms) | Normal | Impaired — early perceptual encoding broken | Impaired |
| N400 (400ms) | Impaired — later semantic/affective integration broken | Normal | Impaired |

One face task, two time windows, complete separation. That's what a well-designed control study looks like. The N170 indexes early face perception (disrupted in ASD). The N400 indexes later meaning integration (disrupted in ADHD). The comorbid group shows both. A BCI system monitoring both windows during a face processing task could, in principle, provide objective signal-level evidence to support clinical differential diagnosis.

**What exists now to build on**

The Healthy Brain Network (HBN) dataset provides a starting point: 3,000+ subjects with multi-paradigm EEG recordings and transdiagnostic clinical assessments. It includes approximately 66 ASD and 406 ADHD subjects with the same recording protocols. A research program could extract these subgroups, compare resting-state features (where ASD differences are visible but ADHD differences are not), compare task-state features (where both become visible), model the rest-to-task transition per group, and build the first ASD-vs-ADHD feature-space classifier using task-state data. Validation against the BCIAUT-P300 dataset (task data, ASD subjects) would provide an independent check.

**The responsible framing**

None of this replaces clinical judgment. EEG biomarkers for neurodevelopmental conditions are research tools, not diagnostic instruments. Published effect sizes are moderate (g=0.3-0.5 for most markers), sample sizes are small, and replication across sites is limited. The value is supplementary: providing objective signal-level data to a clinician who is already conducting a comprehensive evaluation, not automating diagnosis.

The BCI security angle: if EEG-based diagnostic tools become clinical reality, the neural data they collect is among the most sensitive health data imaginable. A recording that can distinguish ADHD from ASD contains enough neural signature information to re-identify individuals, infer cognitive profiles, and reveal clinical conditions the person may not have disclosed. Every regulatory framework referenced in this plugin, from GDPR Article 9 to Chile's Neurorights Law, applies with full force. The security of diagnostic BCI pipelines is not a future concern. It's a present design requirement.

You can explore all EEG datasets in the [Demo Atlas](https://qinnovate.com/demo-atlas/?view=signals). Filter by condition, type (real, synthetic, simulated attack), or search by DSM-5 code. Each entry links to the original open-access source.

The sample data in the plugin is metadata and configuration only. No raw EEG signal data is distributed. The plugin tests its detection rules against the metadata structure, filenames, headers, and code patterns that reference these datasets.

## Security Hardrails

The plugin enforces both ethical constraints and technical enforcement in a single model I call "hardrails."

**Guardrails** (what the system should not claim):
- 8 neuroethics guardrails from published literature
- Regulatory compliance requirements mapped to 6 frameworks
- Status qualifiers: everything is "proposed, unvalidated, in development"
- Dual-use framing: every threat paired with defensive controls

**Hardening** (technical enforcement):
- 10 explicit credential regex patterns (AWS keys, Stripe, Slack, GitHub PAT, GitLab PAT, private keys, JWT, generic API keys)
- Prompt injection defense with 17-keyword blocklist across all skill surfaces
- 7-rule report sanitization with self-verification pass
- Pre-commit hook blocking secrets, session artifacts, and credential content from git
- Neural data consent gate before scanning .edf/.bdf/.xdf/.gdf/.fif/.nwb files

The full security specification is in [`docs/SAFETY.md`](https://github.com/qinnovates/bci-security/blob/main/docs/SAFETY.md).

## How It Works With Real BCI Hardware

The plugin doesn't connect to devices. It scans the code that connects to devices. The [Integration Guide](https://github.com/qinnovates/bci-security/blob/main/docs/INTEGRATION.md) covers how the scanner works with:

- **OpenBCI** (Cyton, Ganglion) — detects unencrypted RFDuino/BLE transport, serial without device auth
- **BrainFlow** (20+ boards) — detects unencrypted protocols, extended board ID recognition
- **MNE-Python** — detects missing `anonymize()` calls, PII in subject info, training pipeline integrity
- **NWB/pynwb** — detects PII in Subject metadata, date of birth, clinical descriptions
- **Emotiv** (CortexPy) — detects hardcoded credentials, cognitive state stream subscriptions
- **LSL** — detects zero-encryption multicast streams

QInnovate is not affiliated with any device manufacturer. These are community-supported integrations based on open-source SDKs and published APIs.

**Important:** Before connecting any BCI device to an AI-assisted analysis pipeline, your network must be secure, and your organization should have security and compliance experts review the integration. If your institution is using an AI coding platform for BCI research, they have likely already performed the necessary security reviews and compliance checks for that platform's data processing.

## The Insight That Drives Everything

104 out of 161 cataloged techniques share physical mechanisms with therapeutic treatments.

tDCS for depression uses the same current delivery as signal injection. DBS for Parkinson's uses the same closed-loop stimulation as neural ransomware. EEG monitoring uses the same passive signal capture as eavesdropping. Neurofeedback training uses the same reward pathways as cognitive manipulation.

The mechanism is identical. The boundary between therapy and attack is three things: consent, dosage, and oversight.

If you're a clinician, your treatment protocols already define the safe parameter space. If you're a security engineer, the therapeutic parameters define "normal." Your detection logic is the delta between therapeutic behavior and anomalous behavior.

The plugin's `/bci learn clinical` path walks through this mapping with clinical depth, grouped by treatment modality, with evidence tiers for each dual-use claim.

## Who This Is For

**Developers building BCI products.** The scanner activates automatically when it detects BCI library imports. It flags unencrypted streams, PII in data files, missing consent metadata, and unsafe stimulation parameters as you code. Security guidance embedded in your workflow, not bolted on after.

**Security engineers doing threat assessments.** If you know ATT&CK, you already know the model. `/bci learn ttp` maps TARA's 16 tactics to ATT&CK equivalents and shows you the four that have no equivalent. NISS is to CVSS what TARA is to ATT&CK.

**Clinicians reviewing device security.** `/bci learn clinical` speaks your language. Every technique maps to a treatment you already know. The six NISS dimensions map to clinical parameters you already monitor. Your expertise in safe dosage boundaries IS security expertise.

**Researchers and students.** Install the plugin, run the demo, explore the catalog. 161 techniques with evidence tiers, therapeutic analogs, and severity scores. A structured introduction to a field that barely exists yet.

## What This Is and What It Isn't

This plugin is designed for reviewing anonymized BCI data with AI coding agents. It performs clinical and threat mapping based on patterns that research labs derive from their own data. Qinnovate provides pre-tagged samples from open research so you can test. The plugin is modular: use one skill or all eight. Add your own rules, patterns, or regulatory frameworks without touching existing code.

It is a research tool. Not a medical device. Not legal advice. Not a compliance certification. Every finding requires independent verification by qualified professionals.

The gap exists. No security tool on any platform addresses the space between the electrode and the skull. This one does.

**Get started:**
```bash
git clone https://github.com/qinnovates/bci-security.git
```

---

*Written with AI assistance (Claude). All claims verified by the author.*
