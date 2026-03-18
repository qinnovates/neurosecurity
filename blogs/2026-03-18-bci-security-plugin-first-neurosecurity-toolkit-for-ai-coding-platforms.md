---
title: "BCI Security: The First Neurosecurity Toolkit for AI Coding Platforms"
subtitle: "Threat modeling, vulnerability scoring, and neuroethics compliance for brain-computer interfaces. Now available as a plugin."
date_posted: "2026-03-18"
source: "https://github.com/qinnovates/bci-security"
tags: ["#BCI","#Security","#TARA","#NISS","#Plugin","#OpenSource","#Neurosecurity"]
author: "Kevin Qi"
type: "announcement"
fact_checked: true
fact_check_date: "2026-03-18"
fact_check_notes:
  - "All technique counts verified against tara-techniques.json (135 total)"
  - "All framework references verified: GDPR, CCPA, Chile Neurorights (enacted), Mind Act (proposed), UNESCO (non-binding)"
  - "Citation: Schroder et al. 2025 verified via DOI 10.1007/s12152-025-09607-3"
  - "Citation: Kohno et al. 2009 verified via published literature"
  - "'104 out of 135' dual-use count verified: 135 total - 31 null therapeutic_analog = 104"
ai_assisted: true
---

I built a BCI security scanner that runs inside your AI coding agent. Install it, type `/bci-scan --demo`, and you'll see a threat report in 30 seconds. No API keys. No server. No network calls. Everything runs locally.

It's called [BCI Security](https://github.com/qinnovates/bci-security), and to my knowledge, it's the first tool that brings structured neurosecurity analysis into an AI coding platform.

## Why This Exists

Brain-computer interfaces are shipping. Consumer EEG headbands, research electrode arrays, clinical implants, neurostimulation devices. The hardware is moving fast. The security tooling isn't keeping up.

MITRE ATT&CK covers IT infrastructure. CVSS scores threats based on confidentiality, integrity, and availability. Both are essential. But neither was designed for a device connected to a human brain. ATT&CK can't express "cognitive manipulation." CVSS can't score "neuroplastic effects."

That's the gap this plugin fills.

## What It Does

The plugin gives you structured security analysis for BCI systems, directly inside your coding workflow:

**Scan your BCI code for security anti-patterns.** It detects unencrypted neural streams (LSL, BLE without bonding), PII in EDF headers and filenames, hardcoded credentials for BCI cloud services, ML models loaded without integrity verification, and stimulation parameters without safety bounds. Supports Python, JavaScript, C/C++, and MATLAB BCI frameworks (pylsl, brainflow, mne, pyedflib, BCI2000, FieldTrip, EEGLAB, and more).

**Look up threat techniques from a catalog of 135 attacks.** TARA organizes threats the way ATT&CK does: tactics (what the attacker wants), techniques (how they do it). But it covers the domain ATT&CK wasn't built for. Four of TARA's 16 tactics have no ATT&CK equivalent: Cognitive Exploitation, Cognitive Impairment, Biological Integration, Biological Evasion. Those are the categories that only exist when the endpoint is a brain.

**Score severity with neural-specific dimensions.** NISS supplements CVSS with six dimensions: Biological Impact, Coupling Risk, Coherence Disruption, Consent Violation, Reversibility, and Neuroplasticity. A man-in-the-middle attack might be tactically critical but biologically low-impact (NISS 2.7). Signal injection is both (NISS 6.1). The dual scoring tells you something CVSS alone can't.

**Generate compliance reports mapped to real regulation.** GDPR Art.9, CCPA biometric provisions, Chile's Neurorights Law (the first in the world to constitutionalize neural data protection), UNESCO's Recommendation on neurotechnology ethics, and the proposed US Mind Act. The plugin scans your code for 18 PII patterns across 6 categories and maps each finding to specific regulatory articles with remediation roadmaps.

**Check your writing for neuroethics overclaims.** Paste a draft paper, blog post, or marketing copy. The neuromodesty checker scans against 8 published guardrails from the neuroethics literature (Morse, Poldrack, Racine, Ienca, Kellmeyer, Wexler, Tennison, Vul/Eklund). "BCI reads your thoughts" violates two of them. The checker tells you which ones and suggests corrections.

**Learn the framework interactively.** Six guided learning paths walk you through TARA, NISS, neuroethics, and the therapy-attack boundary using real data from the technique catalog. Not slides. Not documentation. Interactive walkthroughs where you query, filter, and reason about threats hands-on.

Full documentation: [github.com/qinnovates/bci-security](https://github.com/qinnovates/bci-security)

## The Insight That Drives Everything

104 out of 135 cataloged techniques share physical mechanisms with therapeutic treatments.

tDCS for depression uses the same current delivery as signal injection. DBS for Parkinson's uses the same closed-loop stimulation as neural ransomware. EEG monitoring uses the same passive signal capture as eavesdropping. Neurofeedback training uses the same reward pathways as cognitive manipulation.

The mechanism is identical. The boundary between therapy and attack is three things: consent, dosage, and oversight.

If you're a clinician, your treatment protocols already define the safe parameter space. If you're a security engineer, the therapeutic parameters define "normal." Your detection logic is the delta between therapeutic behavior and anomalous behavior.

The plugin's `/bci learn clinical` path walks through this mapping with clinical depth, grouped by treatment modality, with evidence tiers for each dual-use claim.

## Who This Is For

**Developers building BCI products.** The scanner activates automatically when it detects BCI library imports. It flags unencrypted streams, PII in data files, missing consent metadata, and unsafe stimulation parameters as you code. Security guidance embedded in your workflow, not bolted on after.

**Security engineers doing threat assessments.** If you know ATT&CK, you already know the model. `/bci learn ttp` maps TARA's 16 tactics to ATT&CK equivalents and shows you the four that have no equivalent. NISS is to CVSS what TARA is to ATT&CK.

**Clinicians reviewing device security.** `/bci learn clinical` speaks your language. Every technique maps to a treatment you already know. The six NISS dimensions map to clinical parameters you already monitor. Your expertise in safe dosage boundaries IS security expertise.

**Researchers and students.** Install the plugin, run the demo, explore the catalog. 135 techniques with evidence tiers, therapeutic analogs, and severity scores. A structured introduction to a field that barely exists yet.

## What's Next

This is active development. I'm building out the full neurotech security stack, and this plugin will grow with it:

- More detection rules as new BCI frameworks and protocols emerge
- Expanded TARA coverage as new research surfaces attack techniques
- Deeper clinical mappings as the therapy-attack boundary gets more formally defined
- Additional compliance frameworks as neurorights legislation expands globally
- Cross-platform support beyond Claude Code

The plugin is pure markdown and JSON. No compiled code, no runtime dependencies. You can clone the repo and adapt it to any AI coding platform that supports plugin systems. The architecture is agent-agnostic by design.

## Try It

```bash
claude plugins marketplace add https://github.com/qinnovates/bci-security.git
claude plugins install bci-security
```

Restart Claude Code. Then:

```
/bci-scan --demo
```

Thirty seconds. That's all it takes to see what BCI security analysis looks like inside your coding workflow.

Everything is open source. Apache 2.0 for code, CC BY 4.0 for data. Use it in commercial products, research, or derivative works. Contributions welcome.

**Important context:** This plugin is built on the QIF framework, which is proposed, unvalidated, and not independently peer-reviewed. TARA and NISS are research tools, not adopted standards. Every clinical reference is for threat modeling purposes only. Compliance mappings are simplified and require legal review. This is not a medical device.

[Full documentation and source on GitHub](https://github.com/qinnovates/bci-security)

---

*Written with AI assistance (Claude). All claims verified by the author.*
