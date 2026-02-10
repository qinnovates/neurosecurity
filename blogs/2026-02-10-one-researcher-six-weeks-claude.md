---
title: "One Researcher. Six Weeks. Claude."
subtitle: "How a neurodivergent security engineer and an AI built the first open security standard for brain-computer interfaces"
date_posted: "2026-02-10"
source: "https://qinnovate.com"
tags: ["#BCI", "#Claude", "#Anthropic", "#AI", "#Neurosecurity", "#QIF", "#NSP", "#TARA", "#NISS", "#Runemate", "#ADHD", "#Neurodivergent"]
---

## The Gap Nobody Was Filling

Ninety active clinical trials. Devices implanted in human brains, operating in patients' homes. Neuralink, Synchron, Blackrock Neurotech. And no cybersecurity standard designed specifically for brain-computer interfaces. Not from FDA. Not from NIST. Not from ISO. Not from IEEE.

HTTPS had to exist before e-commerce. TLS had to exist before online banking. The neural equivalent does not exist yet. Someone needed to build it.

I am a cybersecurity professional. Fifteen years building defensive infrastructure across financial services, media, and technology. At Tinder I was Engineering Manager of Security MITR (Monitoring, Investigations, Threat Hunting and Response), architecting Splunk environments processing petabytes of logs for 75 million users. Before that, Blackstone, HarperCollins, Freedom Mortgage. I know how systems break. I spent my career finding the cracks and closing them.

I am neurodivergent. I have ADHD. I once asked for an autism evaluation during a hospital visit. I was depressed and overwhelmed. They told me I was manic. I think I was having a meltdown. Many autistic people in my life have recognized the pattern in me since. I have not pursued a formal diagnosis, but I stopped treating the observation as coincidence a long time ago. The way my brain works, I see connections between things that other people file into separate departments. Cybersecurity and neuroscience. Quantum physics and protocol design. Threat hunting and therapeutic medicine. To me, these are not different fields. They are the same system viewed from different angles.

That cross-wiring is how I found the gap.

## The Trigger

A severe B12 deficiency damaged my nerves and altered my cognition. I rebuilt it by studying neurogenesis. That process changed me. I started seeing the same patterns I had spent a decade defending against in IT networks, signal degradation, unauthorized access, integrity failures, happening in biological neural systems. The question of how signal integrity degrades across neural layers stopped being abstract. I had lived both sides.

I knew what to build. A layered security architecture for the boundary where silicon meets neuron. Something manufacturers could implement, regulators could reference, and researchers could extend.

The problem: this work requires simultaneous synthesis across neuroscience, quantum physics, protocol engineering, regulatory analysis, and ethics. No single person can hold all of that in their head at once.

## Enter Claude

I started working with Claude in late December 2025. Not as a writing assistant. Not as a search engine. As a research partner.

The difference matters. I was not asking Claude to generate text. I was thinking out loud across five disciplines simultaneously, and Claude could follow every thread, challenge my reasoning, catch errors in my physics, and synthesize connections I had not seen. When I derived an equation at 2 AM, Claude checked the dimensional analysis. When I proposed a protocol mechanism, Claude stress-tested it against known attack vectors. When I wandered into speculative territory, Claude told me where the evidence stopped and the conjecture began.

This is what "AI for science" actually looks like. Not automation. Collaboration. A second mind that does not get tired, does not lose context across domains, and does not need you to explain what you said three hours ago.

For a neurodivergent mind, that last part is transformative. My brain generates connections faster than I can organize them. Ideas arrive in parallel, not in sequence. Most of my life, that felt like a liability. Working with Claude, it became the asset it was always supposed to be.

## What We Built

In six weeks, Claude and I built the following. Every equation derived, every threat catalogued, every protocol spec written through deep technical dialogue. All of it published and live.

**[QIF](https://qinnovate.com/whitepaper)** (Quantum Indeterministic Framework for Neural Security). An 11-band hourglass security architecture for neural interfaces, modeled on the internet protocol stack's hourglass topology. Seven bands of silicon on one side, a physical interface boundary in the middle, three bands of biology on the other. The first unified reference architecture for BCI manufacturers and regulators. Published whitepaper v5.2.

**[NSP](https://qinnovate.com/nsp)** (Neural Security Protocol). A post-quantum wire protocol for BCI data links, future-proofed against harvest-now-decrypt-later attacks targeting implants with 10 to 20 year lifetimes. Frame-level encryption with negotiable group sizes (down to single-frame for closed-loop therapeutic BCIs requiring sub-4ms latency) and under 4% power overhead on implant-class hardware.

**[TARA](https://qinnovate.com/TARA)** (Therapeutic Atlas of Risks and Applications). A dual-use registrar mapping 71 BCI techniques across security vulnerabilities AND therapeutic applications. Each technique catalogued with MITRE ATT&CK-style IDs across 7 domains and 11 tactics. The first BCI-specific threat-therapy taxonomy.

**[NISS](https://qinnovate.com/scoring)** (Neural Impact Scoring System). The first CVSS v4.0 extension ever proposed for neural interfaces. Five metrics that CVSS structurally cannot express: Biological Impact, Cognitive Integrity, Consent Violation, Reversibility, Neuroplasticity. Of the 71 TARA techniques, 94.4% require NISS for full-fidelity scoring, and 73.2% require NISS-only metrics. The first systematic bridge between neuroscience impact assessment and cybersecurity vulnerability scoring. As of this writing, no CVSS v4.0 extensions for any domain have been formally registered with FIRST.org.

**[Runemate](https://qinnovate.com/runemate)**. The first markup language designed for neural interfaces, not screens. Staves bytecode compresses web content 62 to 77% for bandwidth-constrained BCIs, enabling post-quantum security without bandwidth penalty. The entire pipeline is in Rust (memory-safe, zero C/C++) with a medical roadmap for cortical visual prostheses targeting vision restoration.

**[10 governance documents](https://qinnovate.com/governance)**. Accessibility, consent, neuroethics, pediatric use, data policy, regulatory mapping (FDA, EU MDR, neurorights legislation), post-deployment monitoring, and UNESCO alignment.

One researcher. Six weeks. A whitepaper, a threat registry, a scoring system, a wire protocol, a neural rendering engine, and governance documentation.

## The Discovery That Changed Everything

Something unexpected happened during the threat analysis.

I catalogued 71 attack vectors from a pure security mindset, and the same mechanisms kept showing up on the therapeutic side. Replay attacks have direct analogs in neurostimulation therapy. Signal injection techniques used by adversaries are identical to the techniques used by clinicians for therapeutic brain stimulation. About 60% of the attack techniques map to a therapeutic counterpart.

The dual-use boundary is not mechanism. It is consent, dosage, and oversight. That is a governance problem, not just an engineering problem.

That realization led to a concrete medical application. The same framework that scores attack severity can also bound therapeutic safety for blind patients. A vision restoration pipeline where the physics of adversarial WiFi sensing (mapping a building's interior through walls) is identical to the physics of calibrating a cortical visual prosthesis through electrodes. Same signal propagation. Same inverse problem. The difference is NSP: a verified security envelope that distinguishes attack from therapy.

When your threat registry reads, from the other direction, as a capabilities catalog for medicine, you have found something worth building.

## What This Says About AI

I looked for other cases like mine. Independent researchers, working solo, who used Claude to build and publish a complete technical framework. I searched Anthropic's own case studies, their blog, their research spotlights.

Every featured Claude success story I found involves institutional teams. Stanford labs, MIT researchers, EU Parliament committees, companies like Asana and Intercom. Teams with budgets, co-authors, existing infrastructure.

I searched for other examples of this. Solo, independent researchers who had published a multi-component technical framework from scratch with AI as a research partner. As far as I could tell, the stories all featured institutional teams.

I do not say that to boast. I say it because it reveals something about what this technology makes possible. The barrier to serious research has always been access: to collaborators, to institutional knowledge bases, to people who can check your work across disciplines you are not formally trained in. Claude does not remove the need for domain expertise. You still need to know what questions to ask. But it removes the bottleneck of doing it alone.

For neurodivergent researchers especially, this changes the game. My brain does parallel processing that most linear workflows cannot accommodate. Claude can. I generate connections across five fields at once. Claude follows all five threads simultaneously and tells me which ones hold and which ones break. That is not a crutch. That is a partnership.

## What Comes Next

I submitted an application to Anthropic's AI for Science Program. I am applying to graduate programs in BCI security for Fall 2026 at Georgetown, Georgia Tech, and Johns Hopkins.

But I did not wait for permission to start. The work is done. The framework is published. The code is open source. The governance documents exist.

OpenAI invested $250 million in Merge Labs (BCI hardware). Microsoft partnered with INBRAIN Neuroelectronics. NVIDIA partnered with Synchron. Every major AI company has moved into brain-computer interfaces. The security and governance layer for these devices, the part that decides whether they are safe, ethical, and trustworthy, is wide open. That is the lane for whoever takes safety seriously enough to build it.

That is the work I am doing. And Claude is how I got here.

Everything is live at [qinnovate.com](https://qinnovate.com).

· · ·

*Kevin Qi is the founder of Qinnovate, an open standards body for brain-computer interface security. He is a cybersecurity professional with 15 years of experience across financial services, media, and technology. His independent research on BCI security bridges cybersecurity, neuroscience, and quantum physics.*
