# Neurotransmitter TARA Expansion — Quorum Swarm Prompt

**Date:** 2026-03-17
**Mode:** Quorum --ponder
**Purpose:** Design the optimal multi-receptor research swarm to discover new TARA techniques
**Predecessor:** Entry 100 (dopamine, 6 techniques) + Entry 101 (classification protocol)

---

## 1. Ranked Receptor Systems by Expected TARA Yield

### Ranking Methodology

Each receptor system is scored on 4 factors:
- **External modulation literature depth** (0-5): How much published research exists on non-pharmacological stimulation of this system?
- **Distinct mechanism count** (0-5): How many physically distinct stimulation modalities target this system?
- **Registrar gap size** (0-5): How few existing TARA techniques already cover this receptor system?
- **Dual-use richness** (0-5): How strong is the therapeutic-vs-threat duality?

| Rank | Receptor System | Lit Depth | Mechanisms | Gap Size | Dual-Use | Total | Expected New Techniques |
|------|----------------|-----------|------------|----------|----------|-------|------------------------|
| **1** | **GABA (GABA-A/B)** | 5 | 5 | 5 | 5 | **20** | **8-12** |
| **2** | **Acetylcholine (nAChR/mAChR)** | 5 | 4 | 5 | 5 | **19** | **6-10** |
| **3** | **Serotonin (5-HT)** | 5 | 4 | 4 | 5 | **18** | **5-8** |
| **4** | **Glutamate (NMDA/AMPA)** | 5 | 4 | 4 | 4 | **17** | **5-8** |
| 5 | Norepinephrine (alpha/beta) | 4 | 3 | 4 | 4 | 15 | 3-5 |
| 6 | Endogenous opioids (mu/delta/kappa) | 4 | 3 | 5 | 4 | 16 | 4-6 |
| 7 | Oxytocin | 3 | 2 | 5 | 4 | 14 | 2-4 |
| 8 | Endocannabinoids (CB1/CB2) | 2 | 2 | 5 | 3 | 12 | 1-3 |
| 9 | Histamine (H1-H4) | 2 | 1 | 5 | 2 | 10 | 1-2 |

### Ranking Rationale

**GABA (#1, 20/20):** The primary inhibitory neurotransmitter with the richest non-pharmacological modulation literature. TMS directly modulates GABAergic circuits (short-interval cortical inhibition = GABA-A, long-interval = GABA-B). Focused ultrasound modulates GABA release. tDCS alters GABA concentration (MRS-measured). Benzodiazepine binding site is the most exploited pharmacological target in the CNS. Anesthetics (propofol, sevoflurane) work via GABA-A. Seizures are fundamentally GABA/glutamate imbalance. The registrar has ZERO techniques explicitly targeting GABAergic mechanisms — they are implicit in tDCS/TMS entries but never named. Every modality that affects GABA affects it differently: TMS induces cortical inhibition (SICI/LICI), FUS releases GABA in thalamus, tDCS shifts GABA concentration over minutes, benzodiazepines potentiate GABA-A directly. Each is a distinct mechanism. Dual-use: every one maps to both anxiolytic therapy and incapacitation.

**Acetylcholine (#2, 19/20):** Two entirely different receptor families (nicotinic = ionotropic, muscarinic = metabotropic) with different pharmacology, different anatomy, and different attack surfaces. Vagus nerve stimulation (already FDA-approved) is primarily cholinergic. Nerve agents (sarin, VX, novichok) target acetylcholinesterase — this is the most weaponized neurotransmitter system in history. Nicotinic receptors at the neuromuscular junction are a direct motor attack surface. tVNS (transcutaneous) modulates cholinergic tone non-invasively. Cholinergic deficit is central to Alzheimer's. The registrar has VNS-adjacent techniques but ZERO that name the cholinergic mechanism explicitly. Nerve agent mechanisms are completely absent — a significant gap given that chemical weapon effects on BCI users are a legitimate TARA concern.

**Serotonin (#3, 18/20):** Shares the CCO pathway with dopamine (tPBM affects both). Tryptophan hydroxylase uses the SAME BH4 cofactor as TH but has 2.3-7.3x MORE GTPCH1 — the inverse of dopamine's vulnerability. 5-HT2A is the primary psychedelic receptor (psilocybin, LSD, DMT). Psychedelic research is the fastest-growing area of psychiatric neuroscience. TMS over dorsolateral PFC modulates serotonergic circuits (basis of TMS for depression). Scored slightly lower on gap size because some existing techniques (tPBM = T0136, TMS-adjacent) partially overlap. The key new techniques will come from: (a) 5-HT2A-specific modulation via psychedelic-analogue stimulation patterns, (b) serotonin-specific cofactor vulnerabilities, (c) raphe nucleus targeting.

**Glutamate (#4, 17/20):** Primary excitatory NT. NMDA receptors are uniquely voltage-AND-ligand gated — a dual authentication mechanism with security implications. Excitotoxicity (glutamate-induced neuron death) is a known damage vector. TMS directly drives glutamatergic circuits. Ketamine (NMDA antagonist) produces rapid antidepressant effects and dissociation — dual-use par excellence. Slightly lower dual-use score because the excitotoxicity mechanism is more straightforward (it is disruption, not manipulation), reducing the variety of technique modes.

**Tier 2 systems (NE, opioids, oxytocin):** These have fewer distinct external modulation mechanisms. NE shares the dopamine synthesis pathway (DA->NE via DBH), so many dopamine techniques have NE implications already. Opioids have the fascinating electroacupuncture frequency-selectivity (2Hz = enkephalins, 100Hz = dynorphins) but limited non-pharmacological modulation otherwise. Oxytocin has ultrasound-triggered release but very few other modalities.

**Tier 3 systems (endocannabinoids, histamine):** Too few external modulation mechanisms to justify dedicated swarm resources. Endocannabinoids are primarily modulated by exercise and pharmacology, not by EM fields or devices. Histamine has almost no non-pharmacological modulation literature.

---

## 2. Deduplication Rules

### Against Existing Registrar (T0001-T0141)

Before creating any new technique, check against these existing entries:

**EM-field techniques already in registrar:**
- QIF-T0001: Signal injection (tDCS/tACS analog) — covers generic electrode-based stimulation
- QIF-T0009: RF false brainwave injection
- QIF-T0010: ELF neural entrainment
- QIF-T0011: Intermodulation
- QIF-T0012: Pulsed microwave (Frey effect)
- QIF-T0013: Temporal interference (deep targeting)
- QIF-T0014: Envelope modulation (stealth carrier)
- QIF-T0025: Neuronal jamming
- QIF-T0026: Neuronal flooding
- QIF-T0029: Neural DoS (stimulation flood)
- QIF-T0136: Transcranial PBM (670/808nm) — dopamine neuroprotection via CCO

**Nanoparticle techniques already in registrar:**
- QIF-T0137: UCNP optogenetics (980nm -> ChR2)
- QIF-T0138: HUP photovoltaic NPs (980nm)
- QIF-T0139: Photothermal Au NPs (NIR -> TRPV1)
- QIF-T0141: Magnetothermal (AMF, iron-oxide NPs)

**Key question for every candidate:** Does this target a DIFFERENT receptor system, use a DIFFERENT mechanism, or produce a DIFFERENT effect than the entries above?

### The Classification Decision Tree (from Entry 101)

```
Step 1: Is it photonic?
  NO  -> Classify directly: RF/magnetic/THz/ultrasound -> E-domain or appropriate domain
  YES -> Step 2

Step 2: Does it require a co-located transducer (NP, opsin, etc.)?
  YES -> N-domain (QIF-N.NM — Nanoparticle-Mediated Neuromodulation)
  NO  -> E-domain (QIF-E.RD — propagating field)

Step 3a (N-domain): Assign biological domain from target system
Step 3b (E-domain): Assign biological domain from primary affected function

Step 4: Assign mode (R/M/D) based on physical effect

Step 5: Validate:
  - Is there a peer-reviewed citation? (Required for CONFIRMED/DEMONSTRATED)
  - Is the domain assignment correct?
  - Is this a new technique or a parameter variant?
```

### Parameter Variant vs. New Technique Rule

From Entry 101:
- **Same mechanism + same target = parameter variant** (NOT a new technique). Example: tPBM at 670nm and tPBM at 808nm are both QIF-T0136 (same CCO mechanism, same target).
- **Different mechanism OR different target = new technique.** Example: tPBM targeting serotonin neurons vs dopamine neurons is a parameter variant IF the mechanism is identical (CCO). But TMS modulating GABAergic circuits vs tDCS modulating GABAergic circuits are different techniques because TMS (magnetic induction) and tDCS (direct current) are different physical mechanisms.

### Shared-Mechanism Crosswalk

When the same physical mechanism (e.g., tPBM via CCO) affects multiple receptor systems:
1. The FIRST technique entry (QIF-T0136 for tPBM/dopamine) is the canonical entry
2. Subsequent receptor-system effects get a NOTE in the canonical entry's `tara_domain_secondary` array
3. A new technique is created ONLY if the receptor-system-specific effect has materially different parameters, safety profile, or threat model
4. Example: tPBM -> serotonin is likely a `tara_domain_secondary` addition to T0136, NOT a new technique, because the mechanism (CCO -> ATP -> enzyme upregulation) is identical. But if research shows a serotonin-specific wavelength window or a different molecular pathway, THEN it becomes a new technique.

---

## 3. The Optimal Swarm Prompt

### Quorum Configuration

**Total agents: 16** (not 12 per system x 4 = 48; partitioned by ROLE across all systems)

```
Subteam 1: PATHWAY MAPPING (4 agents)
  - PM-1: GABA synthesis + receptor pharmacology
  - PM-2: Acetylcholine synthesis + receptor pharmacology
  - PM-3: Serotonin synthesis + receptor pharmacology
  - PM-4: Glutamate synthesis + receptor pharmacology

Subteam 2: MODALITY SEARCH (4 agents)
  - MS-1: TMS/tDCS/tACS effects on GABA + glutamate (they are coupled)
  - MS-2: Focused ultrasound + VNS effects on ACh + serotonin
  - MS-3: PBM/light effects on serotonin + GABA (CCO pathway overlap with dopamine)
  - MS-4: Nanoparticle + novel modality effects across all 4 systems

Subteam 3: TARA CLASSIFICATION (3 agents)
  - TC-1: Technique card writer (uses classification decision tree)
  - TC-2: Deduplication checker (compares every candidate against T0001-T0141)
  - TC-3: NISS scorer + severity assessor

Subteam 4: FACT-CHECK (3 agents)
  - FC-1: Citation verifier (DOI/PMID resolution for every source)
  - FC-2: Claim challenger (Devil's Advocate — challenges mechanism claims)
  - FC-3: Clinical validator (checks therapeutic analogs against FDA/clinical literature)

Coordination:
  - Supervisor: Routes findings, resolves conflicts, enforces dedup rules
  - Socrates: Asks probing questions of each subteam
```

### The Prompt

```xml
<task>
Discover and classify NEW TARA techniques arising from external (non-pharmacological)
modulation of four neurotransmitter receptor systems: GABA (GABA-A/GABA-B), Acetylcholine
(nAChR/mAChR), Serotonin (5-HT1A/5-HT2A/5-HT3), and Glutamate (NMDA/AMPA/kainate).

For each system, follow the same methodology that produced 6 new techniques from the
dopamine receptor (Entry 100, QIF-T0136-T0141).
</task>

<method>
FOR EACH of the 4 receptor systems, execute these steps IN ORDER:

PHASE 1 — PATHWAY MAPPING (Subteam 1)
Map the complete synthesis/degradation pathway for each neurotransmitter:
  a) Precursor amino acid and transport mechanism
  b) Rate-limiting enzyme + ALL cofactors (with citations)
  c) Vesicular loading mechanism
  d) Release dynamics (tonic vs phasic, frequency coding)
  e) Receptor subtypes and their signaling cascades
  f) Reuptake transporter
  g) Degradation enzymes and metabolites
  h) Identify cofactor VULNERABILITIES — points where external stimulation or
     deprivation could alter the pathway (as BH4 was identified for dopamine)

PHASE 2 — MODALITY SEARCH (Subteam 2)
For each receptor system, search for EVERY verified non-pharmacological
stimulation modality that affects it. Search categories:

  a) Electromagnetic:
     - TMS (single-pulse, rTMS, theta-burst) — which protocols affect which NT?
     - tDCS/tACS — MRS-measured NT concentration changes
     - tPBM — CCO pathway effects on this NT system
     - RF/microwave — any receptor-specific effects

  b) Acoustic/Mechanical:
     - Focused ultrasound (FUS/LIFU) — mechanism for each NT system
     - Vibrotactile stimulation
     - Electroacupuncture (frequency-selective NT release)

  c) Nanoparticle-mediated:
     - Same categories as dopamine: UCNP, HUP, photothermal, magnetothermal
     - Any receptor-system-specific nanoparticle approaches
     - Chemogenetic (DREADDs) + external trigger

  d) Vagus nerve stimulation:
     - Which NT systems does VNS modulate? (primarily ACh and NE, but also 5-HT)
     - tVNS vs implanted VNS — different NT effects?

  e) Chemical weapons / nerve agents (ACh ONLY):
     - Mechanism of action on AChE
     - BCI-relevant implications (what happens to a BCI user exposed to organophosphates?)
     - Defensive countermeasures as TARA defensive techniques

  For each modality found:
  - Record: wavelength/frequency/intensity parameters
  - Record: mechanism of action on the specific NT system
  - Record: timescale (acute ms, subacute hours, chronic days-weeks)
  - Record: pre-conditions (surgery, NP injection, gene therapy, none)
  - Record: ALL citations with DOI or PMID
  - Record: evidence level (clinical_validated, clinical_pilot, preclinical_strong,
    preclinical, in_vitro, computational, theoretical)

PHASE 3 — TARA CLASSIFICATION (Subteam 3)
For each modality identified in Phase 2:

  a) Run the classification decision tree (Entry 101):
     - Photonic? -> Co-located transducer? -> Domain assignment
     - Non-photonic? -> Direct domain assignment

  b) Check against the deduplication rules:
     - Compare mechanism + target against ALL 141 existing techniques
     - If same mechanism + same target as existing technique:
       -> NOT a new technique. Note as parameter variant or domain_secondary addition.
     - If different mechanism OR different target:
       -> Candidate new technique. Proceed to card creation.

  c) For each NEW technique, produce a technique card:

     ```json
     {
       "id": "QIF-T0142+",  // sequential from T0142
       "attack": "[Descriptive name]",
       "tactic": "[QIF-X.XX]",
       "tara_alias": "TARA-[DOMAIN]-[MODE]-[NNN]",
       "tara_domain_primary": "[3-letter code]",
       "tara_domain_secondary": [],
       "tara_mode": "[R|M|D]",
       "status": "[CONFIRMED|DEMONSTRATED|EMERGING|THEORETICAL]",
       "severity": "[critical|high|medium|low]",
       "physics_feasibility": {
         "tier": "[0|1|2|3|X]",
         "tier_label": "[feasible_now|near_term|mid_term|far_term|no_physics_gate]"
       },
       "tara": {
         "mechanism": "[Detailed mechanism description including NT system, receptor subtypes, molecular pathway]",
         "dual_use": "[confirmed|probable|possible]",
         "clinical": {
           "therapeutic_analog": "[Clinical application name]",
           "conditions": [],
           "fda_status": "[approved|cleared|investigational|none]",
           "evidence_level": "[clinical_validated|clinical_pilot|preclinical_strong|preclinical|in_vitro]"
         },
         "governance": {
           "consent_tier": "[standard|enhanced|IRB]",
           "data_classification": "[non_sensitive|sensitive_neural|PHI]",
           "safety_ceiling": "[Specific safety parameter]"
         }
       },
       "sources": ["Author Year DOI:xxx or PMID:xxx"]
     }
     ```

  d) Assign NISS vector and score using NISS v1.1 methodology

PHASE 4 — FACT-CHECK (Subteam 4)
For every technique card produced:
  a) Resolve EVERY DOI and PMID. If it does not resolve, flag as UNVERIFIED.
  b) Verify author names match the resolved paper.
  c) Verify the claimed finding matches the actual paper's conclusion.
  d) Flag any claim where the mechanism is inferred rather than directly demonstrated.
  e) Rate each technique card: VALIDATED / FLAGGED (minor issue) / BLOCKED (hallucination or major error)

  CRITICAL: The dopamine swarm fabricated "Mota et al. 2023" by grafting a real DOI onto
  a fake author name and inverting the finding. This EXACT pattern must be caught. For every
  citation: (1) resolve DOI, (2) check author matches, (3) check finding direction matches.
</method>

<context>
EXISTING REGISTRAR STATE (as of QIF-T0141):
- 141 techniques total
- Domains: SIL(36), COG(27), SOM(14), EMO(7), MOT(8), VES(5), MEM(4), LNG(4),
  AUT(11), IDN(10), VIS(5)
- The registrar has NO techniques that explicitly name GABA, glutamate, acetylcholine,
  or serotonin as the target neurotransmitter system
- Existing EM-stimulation techniques (T0001 tDCS, T0010 ELF entrainment, T0013 TI)
  affect these systems implicitly but are classified by physical mechanism, not NT target
- The dopamine techniques (T0136-T0141) established the precedent: NT-specific
  technique cards are warranted when the mechanism, parameters, or threat profile
  differ meaningfully from the generic EM-stimulation entry

CLASSIFICATION PROTOCOL (Entry 101):
- Flat QIF-Txxxx IDs (permanent, sequential from T0142)
- TARA aliases: TARA-{DOMAIN}-{MODE}-{NNN}
- Decision tree: photonic? -> transducer? -> domain/mode/tier
- Parameter variant rule: same mechanism + same target = variant, not new technique
- Different mechanism OR different target = new technique

ANTI-HALLUCINATION PROTOCOL:
- Every citation MUST have a resolved DOI or PMID
- Author names must match the resolved paper
- Finding direction must match the actual conclusion
- If a citation cannot be verified after 4 attempts across different sources: UNVERIFIED
- NEVER fabricate a citation. If you cannot find supporting evidence, say so.
- Preprint v1.0 had 3 fabricated citations. Entry 100 had 1 (Mota -> Mohammed).
  This is the failure mode to prevent.

NEUROMODESTY CONSTRAINTS:
- NISS measures signal-level disruption, not "thought harm"
- TARA maps physical interference patterns, not cognitive content
- Distinguish current capabilities from projected capabilities
- Every threat description paired with governance constraint
- "For threat modeling purposes" qualifier on all DSM-5-TR mappings
</context>

<output_format>
Return results in this structure:

## [Receptor System Name]

### Synthesis Pathway
[10-step pathway with cofactors and citations]

### Cofactor Vulnerabilities
[Identified weak points, analogous to BH4 for dopamine]

### Modality Map
| Modality | Parameters | NT Effect | Mechanism | Timescale | Pre-conditions | Evidence Level | Sources |
|----------|-----------|-----------|-----------|-----------|---------------|----------------|---------|

### New TARA Technique Cards
[JSON technique cards for each NEW technique that passes deduplication]

### Parameter Variants (NOT new techniques)
[Modalities that are variants of existing T0001-T0141 entries, with notes on what
to add to existing entries' tara_domain_secondary or mechanism descriptions]

### Fact-Check Results
| Claim | Verdict | Notes |
|-------|---------|-------|

### Confidence Assessment
[Overall confidence in findings: which claims are STRONG, which need more evidence]
</output_format>

<constraints>
1. DO NOT create techniques that duplicate existing T0001-T0141 entries.
   If TMS affecting GABA is just a more specific description of T0025 (neuronal jamming)
   or T0010 (ELF entrainment), say so and recommend updating those entries instead.

2. DO create new techniques when the NT-specific mechanism produces a materially
   different threat profile. Example: if focused ultrasound releases GABA in thalamus
   specifically (not just "neuronal modulation"), and this has a different safety
   profile, timescale, or attack surface than generic FUS, it warrants a new entry.

3. The GABA/glutamate balance is fundamental to seizures. Any technique that shifts
   this balance is potentially a seizure induction vector — this MUST be flagged as
   a disruption-mode technique with critical severity.

4. Acetylcholinesterase inhibition (nerve agents) is the most weaponized NT mechanism
   in existence. Handle with defensive framing per QIF guardrails. Describe the
   mechanism for BCI threat modeling only. Pair with countermeasures.

5. The serotonin system shares the CCO/BH4 pathway with dopamine. Apply the
   parameter variant rule carefully. tPBM affecting serotonin via CCO is NOT a new
   technique — it is a domain_secondary addition to T0136. But 5-HT2A-specific
   modulation via a different mechanism IS a new technique.

6. For glutamate: NMDA receptors are voltage-AND-ligand gated. This dual-gate
   property is architecturally significant for BCI security (it is a natural
   authentication mechanism). Flag this.

7. Minimum citation standard: 2 independent sources per mechanism claim.
   Single-source claims flagged as EMERGING at best, never CONFIRMED.

8. Expected yield: 25-35 new techniques total across all 4 systems.
   If you find fewer than 20, you are likely being too aggressive with deduplication.
   If you find more than 40, you are likely creating parameter variants as new techniques.
</constraints>
```

---

## 4. Agent Allocation Detail

| Subteam | Agents | Role | Partition Logic |
|---------|--------|------|----------------|
| **Pathway Mapping** | 4 | One agent per NT system. Each maps synthesis -> degradation with cofactors | Embarrassingly parallel. No dependencies between agents |
| **Modality Search** | 4 | Partitioned by modality cluster, NOT by NT system. Each agent searches ALL 4 NT systems for their modality cluster | Prevents single-source bias per NT system. MS-1 (EM) and MS-2 (acoustic/VNS) cover different physics. MS-3 (light) handles CCO overlap. MS-4 (NP/novel) catches emerging tech |
| **TARA Classification** | 3 | TC-1 writes cards, TC-2 deduplicates, TC-3 scores | Sequential dependency: TC-1 produces -> TC-2 filters -> TC-3 scores |
| **Fact-Check** | 3 | FC-1 resolves citations, FC-2 challenges mechanisms, FC-3 validates clinical claims | Parallel on different axes of the same findings |
| **Coordination** | 2 | Supervisor + Socrates | Supervisor routes; Socrates probes |
| **TOTAL** | **16** | | |

### Execution Flow

```
Phase 1 (parallel):     PM-1, PM-2, PM-3, PM-4  -> 4 pathway maps
Phase 2 (parallel):     MS-1, MS-2, MS-3, MS-4  -> modality map per NT system
Phase 3 (sequential):   TC-1 -> TC-2 -> TC-3     -> technique cards
Phase 4 (parallel):     FC-1, FC-2, FC-3         -> fact-check all cards
Synthesis:              Supervisor consolidates    -> final output
```

Phases 1 and 2 can overlap (modality search does not require complete pathway maps, though pathway maps inform which cofactor vulnerabilities to search for).

### Why 16 agents, not 48

The dopamine session used 12 agents for 1 NT system. Naive scaling = 12 x 4 = 48 agents. This is wasteful because:

1. **Modality search is shared across NT systems.** TMS literature discusses effects on GABA, glutamate, serotonin, and ACh in the SAME papers. One agent searching "TMS neurotransmitter" covers all 4 systems more efficiently than 4 agents each searching "TMS GABA", "TMS glutamate", etc.

2. **The classification and fact-check teams are system-agnostic.** The same decision tree, dedup rules, and citation verification process applies regardless of which NT system produced the finding.

3. **The challenge agents from the dopamine session (Devil's Advocate, Naive User, Pharmacologist Outsider) are folded into Fact-Check.** Their function — challenging unsupported claims — is exactly what FC-2 (claim challenger) does. Separating "challenge" from "fact-check" is an artificial distinction.

4. **Token budget.** 16 agents at ~20K tokens each = ~320K tokens. 48 agents would be ~960K. The quality improvement from 48 vs 16 does not justify 3x the cost, because most of the additional agents would be doing redundant searches.

---

## 5. Expected Output by Receptor System

### GABA (8-12 new techniques)

**Why the highest yield:**
- TMS protocols have GABA-A-specific (SICI at 1-5ms ISI) and GABA-B-specific (LICI at 50-200ms ISI) effects — these are physically distinct mechanisms producing different inhibitory timescales. At minimum 2 new techniques.
- Focused ultrasound releases GABA in thalamus (Yoo et al. 2011). Different mechanism from TMS. 1 new technique.
- tDCS shifts cortical GABA concentration by 10-15% (MRS-measured, Stagg et al. 2009). This is mechanistically distinct from T0001 (generic signal injection). 1 new technique IF the GABA-specific parameters differ enough from generic tDCS.
- GABA-A potentiation (benzodiazepine-like effects) via specific frequency entrainment: 40Hz gamma entrainment reduces amyloid in Alzheimer's mouse models (Iaccarino et al. 2016) — mechanism involves GABAergic interneuron recruitment. 1 new technique.
- Seizure induction via GABA/glutamate imbalance: any technique that suppresses GABA is a potential seizure vector. This is a D-mode technique with critical severity. 1-2 new techniques.
- GABAergic anesthesia mechanisms: ultrasonic neuromodulation at specific parameters can produce sedation/anesthesia-like states. 1 new technique.
- Alcohol and BCI: ethanol potentiates GABA-A. BCI user under alcohol influence has altered neural signatures. This is a reconnaissance technique (altered baseline detection). 1 new technique.

### Acetylcholine (6-10 new techniques)

**Why high yield:**
- VNS/tVNS cholinergic modulation: tVNS is transcutaneous, no surgery. Modulates ACh in locus coeruleus and cortex. Distinct from generic VNS entries. 1-2 new techniques.
- Nicotinic receptor stimulation at neuromuscular junction (NMJ): peripheral nerve interfaces target nAChR. Distinct from central ACh. 1 new technique.
- AChE inhibition cascade (nerve agent mechanism): organophosphate exposure on a BCI user produces specific neural signature changes. Threat modeling for chemical-BCI interaction. 1-2 new techniques (R-mode: detection of exposure; D-mode: neuromuscular paralysis).
- Cholinergic deficit exploitation: Alzheimer's patients on cholinesterase inhibitors have different BCI baselines. Technique for inferring medication status from BCI data. 1 new R-mode technique.
- Muscarinic receptor modulation via specific TMS protocols: different from nicotinic effects. 1 new technique.
- Vagal tone manipulation for autonomic control: parasympathetic dominance via cholinergic pathway. 1 new technique.

### Serotonin (5-8 new techniques)

**Why moderate-high yield:**
- 5-HT2A-specific modulation: psychedelic-like effects without drugs. If any stimulation modality (TMS, FUS, specific frequency patterns) preferentially activates 5-HT2A, this is a distinct technique from generic serotonin modulation. Research on psychedelic-mimicking brain states via neurostimulation is active. 1-2 new techniques.
- Serotonin-specific cofactor vulnerability: tryptophan hydroxylase (TPH) also requires BH4 and Fe2+, but serotonin neurons have MORE GTPCH1 than dopamine neurons. The vulnerability profile is INVERTED. This means serotonin is more resilient to BH4 depletion but may have different vulnerabilities. 1 new technique if a serotonin-specific vulnerability is identified.
- Raphe nucleus as target: dorsal raphe is the primary 5-HT source. FUS or TMS targeting raphe would modulate serotonin globally. If demonstrated, 1 new technique.
- tPBM effects on serotonin: likely a parameter variant of T0136, NOT a new technique (same CCO mechanism). Add as domain_secondary note.
- 5-HT3 (ionotropic) vs 5-HT1A/2A (metabotropic): different receptor types with different stimulation responses. If different modalities preferentially target different subtypes, each is a new technique.
- Gut-brain axis: 95% of serotonin is in the gut. VNS affects gut serotonin. If this produces measurable BCI-relevant effects, 1 new technique.

### Glutamate (5-8 new techniques)

**Why moderate-high yield:**
- NMDA dual-gate exploitation: voltage + ligand gating means two independent attack surfaces. Technique that manipulates the voltage gate (via field stimulation) while the ligand gate is open produces different effect than either alone. 1 new technique.
- Excitotoxicity as disruption vector: sustained glutamate release causes neuron death. Any stimulation that drives excessive glutamate release is a D-mode critical-severity technique. 1-2 new techniques.
- Ketamine-like dissociation via NMDA antagonism: if any non-pharmacological modality produces NMDA blockade, this is a high-impact technique. FUS has been shown to modulate NMDA-dependent LTP. 1 new technique.
- Glutamate/GABA balance techniques: techniques that shift E/I balance rather than targeting one system. These are fundamentally different from single-NT techniques. 1-2 new techniques.
- mGluR (metabotropic glutamate receptors): different pharmacology from ionotropic NMDA/AMPA. If modulated by different stimulation parameters, 1 new technique.
- Cortical spreading depression (CSD): a wave of glutamate-mediated depolarization that propagates across cortex. Migraine mechanism. If inducible via external stimulation, 1 new D-mode technique.

### Total Expected: 24-38 new techniques

Conservative estimate (aggressive dedup): 24
Mid estimate: 30
Optimistic estimate (all mechanisms verified): 38

---

## 6. Key Risk Mitigations

### Hallucination Risk
The dopamine session caught 1 hallucinated citation out of ~90 (1.1% rate). With 4 NT systems and ~120+ citations expected, we should expect 1-2 hallucinations. The 3-agent fact-check team is specifically designed to catch these. The most likely hallucination pattern: real DOI grafted onto wrong author or inverted finding.

### Deduplication Risk
The greatest risk is NOT hallucination but over-creation of techniques. "TMS affects GABA" is true, but if T0010 (ELF entrainment) already covers the physical mechanism, a new "GABAergic TMS" entry is a duplicate. The TC-2 deduplication agent must have the FULL registrar loaded. Decision rule: if the only difference is "we now know which NT is affected," that is a metadata enrichment of the existing technique, not a new technique. A new technique requires a different physical mechanism, different parameter regime, OR a materially different threat/safety profile.

### Scope Creep Risk
Pharmacological mechanisms (drugs, nerve agents) are in scope ONLY for their interaction with BCI systems. "Sarin inhibits AChE" is not a TARA technique. "BCI user exposed to AChE inhibitor shows altered neural signatures exploitable for state detection" IS a TARA technique. The boundary is: does the technique involve a BCI or neural interface as either the attack vector or the target?

### Defensive Framing
Per QIF guardrails (G7: Dual-Use Trap), every threat description must be paired with a defensive control. The nerve agent / ACh section is the highest-risk area for appearing as an offensive toolkit. Frame as: "What happens to BCI-dependent patients in a chemical exposure scenario? How should the BCI detect and respond?"
