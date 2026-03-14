# Cross-AI Review Prompt: TARA Domain Taxonomy Reframe

Copy-paste the prompt below into both Gemini and ChatGPT. The full taxonomy document follows the prompt.

---

## PROMPT (paste this + the document below into Gemini AND ChatGPT)

```
You are reviewing a proposed taxonomy reframe for TARA (Threat Assessment and Risk Analysis), a catalog of 109 brain-computer interface (BCI) threat techniques within QIF, a proposed neurosecurity framework.

The current taxonomy organizes techniques by ATTACK METHOD (16 tactic categories like "Neural Injection," "Data Harvest," "Cognitive Exploitation"). The proposed reframe organizes techniques by BIOLOGICAL DOMAIN (11 domains: Vision, Audition, Somatosensory, Vestibular, Motor, Affect, Cognition, Memory, Language, Autonomic, Identity) + a 12th domain for Silicon-only (no biological target), crossed with 3 INTERACTION MODES (Reconnaissance, Manipulation, Disruption).

The goal: security researchers and clinicians share one taxonomy. Same technique, two views. The boundary between "attack" and "therapy" is consent, dosage, and oversight — not the technique itself.

Please review the attached taxonomy proposal and answer these specific questions:

1. COMPLETENESS: Are the 11 biological domains complete? Is there a neural functional system that BCIs could affect that is NOT covered by any of these domains? Consider: olfaction, gustation, interoception, nociception, thermoception, chronoception, social cognition, empathy, creativity, consciousness/arousal. Should any of these be separate domains or are they adequately covered by the existing 11?

2. MODE SUFFICIENCY: Is the R/M/D (Reconnaissance/Manipulation/Disruption) mode taxonomy sufficient? Should there be a fourth mode? Candidates:
   - "Enhancement" (augmentation beyond baseline — distinct from manipulation which alters existing function)
   - "Protection" (defensive techniques — or does this belong in a separate controls catalog?)
   - "Monitoring" (passive observation without extraction intent — or is this just low-impact Reconnaissance?)

3. SCALABILITY: Does this taxonomy scale to 500+ techniques without structural changes? What about 1,000+? Identify any structural bottlenecks.

4. DOMAIN ASSIGNMENTS: Review the technique-to-domain mappings. Flag any that seem clearly misassigned. Pay special attention to:
   - COG (29 techniques) — is it too broad? Should it be split?
   - EMO (1 technique) — is it too narrow? Are EMO techniques hiding in COG?
   - SIL (35 techniques) — should silicon-only techniques be in this taxonomy at all?

5. GAP ANALYSIS: The audit found these empty domain-mode cells:
   - VES (all modes) — now being filled with 5 proposed GVS-based techniques
   - EMO-M, EMO-D — empty despite DBS for depression being a major clinical application
   - LNG-M, LNG-D — empty despite speech BCIs (Willett, Chang) and DBS dysarthria
   - VIS-D, AUD-D, MEM-D — no disruption techniques for these senses
   Are there additional gaps not identified? Are any gaps acceptable (i.e., no realistic technique exists)?

6. DUAL-USE ETHICS: Does organizing attacks and therapies in the same taxonomy create ethical risks? Could this taxonomy be misused to accelerate weaponization? Does the framing adequately prevent that, or does it need additional safeguards?

7. NAMING CONVENTION: Is TARA-XXX-X-NNN (e.g., TARA-VIS-M-002) clear and unambiguous? Any collision risks? Any improvements to the ID format?

8. COMPARISON: How does this compare to existing threat taxonomies (MITRE ATT&CK, STRIDE, OWASP)? What can be learned from their evolution? Are there structural mistakes those frameworks made that this proposal should avoid?

9. MISSING TECHNIQUES: Based on the BCI security and neurostimulation literature, are there known attack vectors or clinical effects NOT captured by any of the 109 techniques? Suggest specific additions.

10. OVERALL ASSESSMENT: Rate the proposal on a scale of 1-5 for:
    - Completeness (coverage of the threat/clinical landscape)
    - Clarity (would a security researcher AND a clinician understand it?)
    - Scalability (can it grow without breaking?)
    - Dual-use balance (does it serve both communities equally?)

Format your response as structured sections matching the 10 questions above. Be specific and cite examples where possible. If you identify issues, propose solutions.
```

---

## DOCUMENT TO ATTACH

Paste the full contents of `docs/research/tara-domain-taxonomy-proposal.md` after the prompt above.
