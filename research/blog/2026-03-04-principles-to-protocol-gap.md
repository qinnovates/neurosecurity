---
title: "The Principles-to-Protocol Gap: Why Neuroethics Needs Engineering"
subtitle: "46 years of ethical frameworks. Zero technical security specifications. Until now."
date: 2026-03-04
tags: [neuroethics, neurorights, cybersecurity, BCI, QIF]
author: Qinnovate
fact_checked: true
fact_check_date: "2026-03-04"
---

### The field has converged

Since Beauchamp and Childress published *Principles of Biomedical Ethics* in 1979, the neuroethics community has been building the ethical scaffolding for technologies that interface with the human brain. 46 years later, after surveying 23 distinct frameworks from every major research institution and international body, a clear picture emerges.

Every framework converges on the same five themes:

1. **Cognitive Liberty** -- the right to mental self-determination
2. **Mental Privacy** -- protection of neural data from unauthorized access
3. **Mental Integrity** -- freedom from unauthorized manipulation of neural processes
4. **Psychological Continuity** -- the right to maintain personal identity
5. **Equal Access** -- equitable distribution of neurotechnology benefits

Ienca and Andorno named them at ETH Zurich. Yuste's Morningside Group published them in *Nature*. Farahany argued cognitive liberty alone covers most of the territory. UNESCO adopted them globally. Chile wrote them into its constitution. Different framings, same destination.

The convergence is real.

### WHY and WHAT, but never HOW

Here is the problem nobody talks about.

Every one of those 23 frameworks operates at one of two levels:

- **WHY** -- philosophical grounding. Autonomy matters because of human dignity. (Beauchamp & Childress, Savulescu, Morse, Oxford)
- **WHAT** -- rights specification. Cognitive liberty, mental privacy, mental integrity, psychological continuity, equal access. (Ienca, Yuste, Farahany, UNESCO, OECD, WHO)

None operate at the third level:

- **HOW** -- technical enforcement. What does a firewall for neural signals look like? How do you detect unauthorized signal injection? What scoring system quantifies neural harm? What protocol secures BCI communication?

Zero frameworks provide technical specifications. Not one threat model. Not one scoring system. Not one protocol.

### The fire code analogy

Imagine if fire safety consisted only of:

- **The principle:** "Buildings should not burn down"
- **The right:** "People deserve safe buildings"

But nobody had written fire codes, designed sprinkler systems, or specified fire-resistant materials. No NFPA standards. No UL certification. No building inspectors.

That is the current state of neuroethics. The principles are sound. The rights are well-defined. The enforcement mechanism is absent.

Brain-computer interfaces are in human skulls today. Neuralink, Synchron, Blackrock Neurotech, and others have implanted patients in FDA-authorized trials. Over 160,000 deep brain stimulation patients worldwide. 65,536-electrode arrays recording at 100 Mbps. Consumer EEG headsets from dozens of companies, outside any regulatory framework.

The rights without the protocol is an unfulfilled promise.

### QIF fills the gap

The Quantum-Informed Framework for BCI Security is the first attempt at a technical security specification for neural interfaces:

- **NISS** (Neural Impact Scoring System) -- extends CVSS to quantify neural harm across clinical, cognitive, and tissue dimensions
- **TARA Atlas** -- catalogs 109 BCI-specific attack techniques scored for severity and mapped to brain regions
- **Coherence Metric (Cs)** -- real-time detection of signal provenance violations through coherence analysis
- **NSP** (Neural Security Protocol) -- post-quantum secure communication for neural implant data

This is not a replacement for neuroethics. It is the technical enforcement layer that neuroethics has been missing. Principles tell you *why* mental privacy matters. Rights tell you *what* mental privacy means. QIF tells you *how* to detect when someone is reading neural data without authorization and *what to do about it*.

### What the skeptics say (and why they are right)

Not everyone agrees on the urgency, and that sharpens the work:

**Morse's neuromodesty** (2006): Neuroscience claims are routinely overclaimed in legal contexts. QIF measures signal-level interference, not mental states. We score amplitude disruption, not "thought harm."

**Wexler's skepticism** (2024): Legislating neurorights prematurely could block beneficial research. Standards are not legislation. Building the fire code does not close the building.

**Ienca's anti-inflationism** (2021): Multiplying rights dilutes protections. QIF extends two existing rights (Mental Privacy, Mental Integrity) with engineering depth rather than proposing new ones.

These checks are not obstacles. They are guardrails.

### What comes next

The landscape is mapped. The gap is clear. The technical specification exists in draft.

What is needed:

1. **Peer review** of NISS scoring against real neuromodulation adverse events
2. **Protocol validation** of NSP in adversarial conditions
3. **Standards adoption** through FIRST (CVSS SIG) and MITRE (CWE) pathways
4. **Industry engagement** with BCI manufacturers on TARA integration

The full neuroethics landscape survey, with all 23 frameworks compared and 12+ institutions mapped, is available at [/landscape/](/landscape/).

The source bibliography (255+ verified citations) is maintained in the [QIF Research Sources Registry](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-RESEARCH-SOURCES.md).

---

*Written with AI assistance (Claude). Research compilation by 6 parallel agents; all claims and citations verified by the author. Full AI collaboration transparency log at [governance/TRANSPARENCY.md](https://github.com/qinnovates/qinnovate/blob/main/governance/TRANSPARENCY.md).*
