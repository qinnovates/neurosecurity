---
title: "One Researcher. One AI. A Missing Standard."
subtitle: "How human-AI collaboration produced the first open security framework for brain-computer interfaces"
date_posted: "2026-02-10"
source: "https://qinnovate.com"
tags: ["#BCI", "#Claude", "#Anthropic", "#AI", "#Neurosecurity", "#QIF", "#NSP", "#TARA", "#NISS", "#Runemate"]
---

## The Gap Nobody Was Filling

Ninety active clinical trials. Devices implanted in human brains, operating in patients' homes. Multiple companies with devices in human patients. And no cybersecurity standard designed specifically for brain-computer interfaces. Not from FDA. Not from NIST. Not from ISO. Not from IEEE.

HTTPS had to exist before e-commerce. TLS had to exist before online banking. The neural equivalent does not exist yet. Someone needed to build it.

I am a cybersecurity professional. Fifteen years building defensive infrastructure across financial services, media, consumer tech, and biotech. I have led security engineering and threat hunting teams, architecting SIEM environments processing petabytes of logs for tens of millions of users. I know how systems break. I spent my career finding the cracks and closing them.

The longer you work across domains, the more you notice that cybersecurity, neuroscience, quantum physics, and protocol design are not separate fields. They are the same system viewed from different angles. Threat hunting and therapeutic medicine follow identical patterns. That cross-domain perspective is how I found the gap.

## The Trigger

A severe B12 deficiency damaged my nerves and altered my cognition. I rebuilt it by studying neurogenesis. That process changed me. I started seeing the same patterns I had spent a decade defending against in IT networks, signal degradation, unauthorized access, integrity failures, happening in biological neural systems. The question of how signal integrity degrades across neural layers stopped being abstract. I had lived both sides.

I knew what to build. A layered security architecture for the boundary where silicon meets neuron. Something manufacturers could implement, regulators could reference, and researchers could extend.

The problem: this work requires simultaneous synthesis across neuroscience, quantum physics, protocol engineering, regulatory analysis, and ethics. No single person can hold all of that in their head at once.

## Human-AI Collaboration

I started working with Claude as a research partner. Not a writing assistant. Not a search engine. A collaborator that could hold the full problem space in memory while I worked through it.

The difference matters. I was not asking an AI to generate text. I was thinking out loud across five disciplines simultaneously, and Claude could follow every thread, challenge my reasoning, catch errors in my physics, and synthesize connections I had not seen. When I derived an equation, Claude checked the dimensional analysis. When I proposed a protocol mechanism, Claude stress-tested it against known attack vectors. When I wandered into speculative territory, Claude told me where the evidence stopped and the conjecture began.

This is what "AI for science" actually looks like. Not automation. Collaboration. A second mind that does not get tired, does not lose context across domains, and does not need you to explain what you said three hours ago.

For cross-disciplinary work, that changes the calculus entirely. Research that spans multiple fields normally requires a team. Human-AI collaboration makes it possible to generate ideas across five fields at once, test them in real time, and keep every thread alive without losing coherence.

## What We Built

Every equation derived, every threat catalogued, every protocol spec written through deep technical dialogue between a human researcher and an AI. All of it published and live.

**[QIF](https://qinnovate.com/whitepaper)** (Quantified Interconnection Framework (QIF)for Neural Security). An 11-band hourglass security architecture for neural interfaces, modeled on the internet protocol stack's hourglass topology. Seven bands of silicon on one side, a physical interface boundary in the middle, three bands of biology on the other. The first unified reference architecture for BCI manufacturers and regulators. Published whitepaper v5.2.

**[NSP](https://qinnovate.com/nsp)** (Neural Security Protocol). A post-quantum wire protocol for BCI data links, future-proofed against harvest-now-decrypt-later attacks targeting implants with 10 to 20 year lifetimes. Frame-level encryption with negotiable group sizes (down to single-frame for closed-loop therapeutic BCIs requiring sub-4ms latency) and under 4% power overhead on implant-class hardware.

**[TARA](https://qinnovate.com/TARA)** (Therapeutic Atlas of Risks and Applications). A dual-use registrar mapping 71 BCI techniques across security vulnerabilities AND therapeutic applications. Each technique catalogued with MITRE ATT&CK-style IDs across 7 domains and 11 tactics. The first BCI-specific threat-therapy taxonomy.

**[NISS](https://qinnovate.com/scoring)** (Neural Impact Scoring System). The first CVSS v4.0 extension ever proposed for neural interfaces. Five metrics that CVSS structurally cannot express: Biological Impact, Cognitive Integrity, Consent Violation, Reversibility, Neuroplasticity. Of the 71 TARA techniques, 94.4% require NISS for full-fidelity scoring, and 73.2% require NISS-only metrics. The first systematic bridge between neuroscience impact assessment and cybersecurity vulnerability scoring. As of this writing, no CVSS v4.0 extensions for any domain have been formally registered with FIRST.org.

**[Runemate](https://qinnovate.com/runemate)**. The first markup language designed for neural interfaces, not screens. Staves bytecode compresses web content 62 to 77% for bandwidth-constrained BCIs, enabling post-quantum security without bandwidth penalty. The entire pipeline is in Rust (memory-safe, zero C/C++) with a medical roadmap for cortical visual prostheses targeting vision restoration.

**[10 governance documents](https://qinnovate.com/governance)**. Accessibility, consent, neuroethics, pediatric use, data policy, regulatory mapping (FDA, EU MDR, neurorights legislation), post-deployment monitoring, and UNESCO alignment.

MITRE ATT&CK covers enterprise, mobile, cloud, and industrial control systems. It does not cover brain-computer interfaces. CVSS scores vulnerabilities across every domain in information security. It has no metrics for biological tissue, cognitive integrity, or consent violation. No one had mapped these frameworks into living neural systems before. TARA and NISS are the first.

One researcher and one AI. A whitepaper, a threat registry, a scoring system, a wire protocol, a neural rendering engine, and governance documentation.

## The Discovery That Changed Everything

Something unexpected happened during the threat analysis.

I catalogued 71 attack vectors from a pure security mindset, and the same mechanisms kept showing up on the therapeutic side. Replay attacks have direct analogs in neurostimulation therapy. Signal injection techniques used by adversaries are identical to the techniques used by clinicians for therapeutic brain stimulation. About 60% of the attack techniques map to a therapeutic counterpart.

The dual-use boundary is not mechanism. It is consent, dosage, and oversight. That is a governance problem, not just an engineering problem.

That realization led to a concrete medical application. The same framework that scores attack severity can also bound therapeutic safety for blind patients. A vision restoration pipeline where the physics of adversarial WiFi sensing (mapping a building's interior through walls) is identical to the physics of calibrating a cortical visual prosthesis through electrodes. Same signal propagation. Same inverse problem. The difference is NSP: a verified security envelope that distinguishes attack from therapy.

When your threat registry reads, from the other direction, as a capabilities catalog for medicine, you have found something worth building.

## What This Says About Human-AI Collaboration

The barrier to serious cross-disciplinary research has always been access: to collaborators, to institutional knowledge bases, to people who can check your work across disciplines you are not formally trained in. Most documented cases of AI-assisted research involve institutional teams — university labs, corporate R&D groups, parliamentary committees. Teams with budgets, co-authors, existing infrastructure.

Human-AI collaboration does not remove the need for domain expertise. You still need to know what questions to ask. But it removes the bottleneck of doing it alone. An independent researcher with deep experience in one field can now synthesize across five, with an AI partner that tracks every thread, challenges every assumption, and distinguishes evidence from conjecture in real time.

That is not automation replacing human thinking. It is collaboration amplifying it.

## What Comes Next

The framework is published. The code is open source. The governance documents exist.

OpenAI invested $250 million in Merge Labs (BCI hardware). Microsoft partnered with INBRAIN Neuroelectronics. NVIDIA partnered with Synchron. Every major AI company has moved into brain-computer interfaces. The security and governance layer for these devices, the part that decides whether they are safe, ethical, and trustworthy, is wide open. That is the lane for whoever takes safety seriously enough to build it.

That is the work. And human-AI collaboration is what made it possible.

Everything is live at [qinnovate.com](https://qinnovate.com).

· · ·

*Kevin Qi is the founder of Qinnovate, an open standards body for brain-computer interface security. He is a cybersecurity professional with 15 years of experience across financial services, media, consumer tech, and biotech. His independent research on BCI security bridges cybersecurity, neuroscience, and quantum physics.*
