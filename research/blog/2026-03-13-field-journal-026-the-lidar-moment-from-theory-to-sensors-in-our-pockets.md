---

title: "Field Journal #026: The LiDAR Moment — From Theory to Sensors in Our Pockets"
subtitle: "From the QIF Field Journal"
date_posted: "2026-03-13"
source: "https://github.com/qinnovates/neurosecurity/blob/main/osi-of-mind/QIF-FIELD-JOURNAL.md#entry-026"
tags: ["#FieldJournal","#QIF","#TARA","#Neurorights","#BCI"]
author: "Qinnovate LLC"
fact_checked: true
fact_check_date: "2026-10-31"
fact_check_notes:
  - "[advisory] Unsourced numerical claim: \"...eing eye dog as the first thing to detect isn't ran...\""
  - "[advisory] Unsourced numerical claim: \"...object that matters most to a blind person usin...\""
  - "[advisory] Unsourced numerical claim: \"...because this is the first time the theoretical wor...\""
  - "[advisory] Unsourced numerical claim: \"...rd.  Like how Apple only uses on-device for Face...\""
  - "[advisory] Unsourced numerical claim: \"...and this compute is only enabled as a playbook that...\""
  - "[advisory] Unsourced numerical claim: \"...book that kicks off only if criteria are met, s...\""
  - "[advisory] Unsourced numerical claim: \"...facial recognition only for the missing person,...\""
  - "[advisory] Unsourced numerical claim: \"...erson, pre-screened first by height, weight, and...\""
  - "[advisory] Unsourced numerical claim: \"...facial scan happens only after AI identifies a hig...\""
  - "[advisory] Unsourced numerical claim: \"...c data. Period. The only thing that leaves the dev...\""
  - "[advisory] Unsourced numerical claim: \"...because this is the first time the theoretical wor...\""
---

**Date:** 2026-03-13, ~02:00 (kept me up)
**State:** Couldn't sleep. The idea hit and wouldn't let go.
**Mood:** That electric feeling when a path opens up that wasn't there before.

What if instead of using Xbox Kinect sensors, I build an app using Xcode? We all have LiDAR in our pockets now. iPhones have depth sensors that can capture spatial data in real time. I can get the depth and spatial data, strip out any sensitive telemetry like location metadata and device identifiers, and use this to show my idea of using AI to help render colors and identify a seeing eye dog — while the raw sensors can still show the environment as a failsafe in the event one system fails, another takes over as backup.

Building fail-safes is a vital guardrail for BCIs. You can't have a vision prosthesis that goes dark when the AI crashes. The raw depth data is the backup. Always on, always showing something, even if the AI classification layer fails. The dog is always visible in the depth map even if the classifier can't identify it as a dog. That's defense in depth — same principle I've been building into QIF from the start.

I think this work will also help me go from theoretical concept to the next step. Using actual sensors we have right now, today, in hardware people already own — and proving how the pipeline works with TARA guiding me through the threat model. No grant needed. No lab access needed. Just an iPhone and Xcode.

The seeing eye dog as the first thing to detect isn't random. It's the one object that matters most to a blind person using a prosthesis. If the prosthesis can't show them where their dog is, nothing else matters. And if an attacker can make the dog disappear from the visual field — that's a safety-critical failure that anyone can understand. You don't need to know what mIoU means to understand "the patient lost track of their guide dog."

This is the bridge from theoretical to tangible. Same architecture as the neurosecurity appliance — sensor, process, classify, strip PII, export clean — just built with photons instead of neurons. Prove it works here, then translate it to the clinical context.

**Attempt to explain:** I think the reason I couldn't sleep is because this is the first time the theoretical work felt like it could become something you can hold in your hand and demo to someone. Every other part of QIF lives in papers and dashboards. This lives on a phone. That changes how people receive it.

And looking further down the road — I think it'd be useful to see what Amber Alerts of the future would look like. If BCI patients can choose to opt in to fight against human trafficking. That is my dream. Not forced. Not default. Not surveillance. A choice — the patient's choice — to use their prosthesis to help find missing children. Consent as architecture, all the way through. The same technology that restores someone's vision could, if they volunteer, help restore someone's child. That's the world I want to build toward.

Like how Apple only uses on-device for Face ID to match your face, everything stays on device unless a match to a missing child is observed — and this compute is only enabled as a playbook that kicks off only if criteria are met, starting with user consent to participate in this "BCI Knight's Watch" feature (yeah, Game of Thrones reference — the Night's Watch guards the wall, BCI Knight's Watch guards the children): 1) an Amber Alert was received which triggers this playbook, 2) your phone or device knows you are in the location where this alert applies, 3) facial recognition only for the missing person, pre-screened first by height, weight, and physical match using LiDAR depth data before any face scan even happens, 4) facial scan happens only after AI identifies a high confidence rate based on the physical profile match — and nothing is stored that is not COPPA compliant. That last part is crucial for Amber Alerts. You're dealing with children's data. COPPA is non-negotiable. The device never stores a child's biometric data. Period. The only thing that leaves the device is the patient's own location if they choose to report. The patient is always the human in the loop.

**Attempt to explain:** I think the reason I couldn't sleep is because this is the first time the theoretical work felt like it could become something you can hold in your hand and demo to someone. Every other part of QIF lives in papers and dashboards. This lives on a phone. That changes how people receive it.

**Connected to:** QIF architecture (sensor → process → classify → export), TARA techniques (T0001 signal injection, T0010 replay, T0025 data poisoning — all testable on this pipeline), neurosecurity appliance vision (same pattern, different layer), privacy-by-design (strip telemetry at capture, not after), defense in depth (raw depth as failsafe behind AI classification), Open Neural Atlas (this could become the mobile companion), consent-as-architecture (Amber Alert opt-in model), neurorights (cognitive liberty = the right to choose what your prosthesis does).

---

*This entry is part of the [QIF Field Journal](https://github.com/qinnovates/neurosecurity/blob/main/osi-of-mind/QIF-FIELD-JOURNAL.md), a living, append-only research journal documenting first-person observations at the intersection of neurosecurity, BCI engineering, and neurorights. The journal exists because neural privacy is a right, not a feature. This research works toward protecting cognitive identity at the neural interface.*

[Read this entry in context](https://github.com/qinnovates/neurosecurity/blob/main/osi-of-mind/QIF-FIELD-JOURNAL.md#entry-026)
