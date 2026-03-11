# QIF Data Mapping: Macro to Micro

> How every QIF tactic maps and relates to each brain region and its components — from the hourglass band down to the molecule.

## The Full Chain

```
TARA Technique (109)
  ↓ band_ids[]
Hourglass Band (11: N7→N1, I0, S1→S3)
  ↓ regions in band
Brain Region (37: prefrontal cortex, amygdala, hippocampus, ...)
  ↓ pathway targets
Neural Pathway (45: nigrostriatal, mesolimbic, corticospinal, ...)
  ↓ neurotransmitter
Neurotransmitter System (18: dopamine, serotonin, GABA, glutamate, ...)
  ↓ synthesis_pathway
Molecular Dependencies (cofactors: BH4, Fe2+, PLP, FAD, SAM, Mg2+, ...)
  ↓ receptors, transporters, enzymes
Receptor Subtypes / Transporters / Degradation Enzymes
```

**Parallel chains (same technique, different projections):**

```
TARA Technique
  ├→ NISS Score → Severity → Neurorights impact (CL, MI, MP, PC, EA)
  ├→ DSM-5-TR Cluster → Psychiatric outcome category (for threat modeling)
  ├→ ICD-11 Chapter 8/22 → Neurological outcome category (v2.0, in progress)
  ├→ CVE Mapping → Real-world validation (55 CVEs, 19% coverage)
  ├→ Dual-Use → Therapeutic analog (FDA status, clinical domain)
  ├→ Governance → Consent tier, regulatory framework
  └→ Device → BCI attack surface → Neurosecurity score
```

---

## Data Files (Source of Truth)

All files in `shared/`. This is the single source of truth — site components, KQL queries, and the whitepaper all derive from these.

### Layer 1: Threat Techniques (Macro)

**`qtara-registrar.json`** — 109 techniques, 16 tactics, 8 domains

| Field | Links To | Cardinality |
|-------|----------|-------------|
| `id` (QIF-T####) | Primary key | 1 |
| `band_ids[]` | `qif-brain-bci-atlas.json → qif_bands[].id` | 1:N |
| `niss.vector` | NISS scoring formula | 1:1 |
| `niss.severity` | Severity classification | 1:1 |
| `dsm5.cluster` | `qif-dsm-mappings.json → diagnostic_clusters` | N:1 |
| `dsm5.primary[]` | DSM-5-TR codes (F##.#) | 1:N |
| `clinical.therapeutic_analog` | Dual-use therapeutic equivalent | 1:1 |
| `clinical.fda_status` | FDA approval status | 1:1 |
| `governance.consent_tier` | `qif-ethics-controls.json → consent_tiers` | N:1 |
| `neurorights.affected[]` | Neurorights impacted (CL, MI, MP, PC) | 1:N |
| `status` | CONFIRMED / DEMONSTRATED / EMERGING / THEORETICAL / PLAUSIBLE / SPECULATIVE | 1:1 |

### Layer 2: Hourglass Architecture

**`qif-brain-bci-atlas.json`** — 11 bands, 37 brain regions, 24 BCI devices

| Field | Links To | Cardinality |
|-------|----------|-------------|
| `qif_bands[].id` (N7-N1, I0, S1-S3) | ← `qtara-registrar.json → band_ids[]` | 1:N |
| `brain_regions[].name` | Anatomical brain region | 1 |
| `brain_regions[].band` | Parent hourglass band | N:1 |
| `brain_regions[].severity_if_compromised` | Impact classification | 1:1 |
| `devices[].name` | BCI hardware | 1 |
| `devices[].brain_regions_targeted[]` | Regions this device interfaces with | 1:N |
| `devices[].band_exposure[]` | Hourglass bands this device touches | 1:N |

### Layer 3: Neural Pathways

**`qif-neural-pathways.json`** — 45 named circuits

| Field | Links To | Cardinality |
|-------|----------|-------------|
| `id` | Primary key (e.g., `nigrostriatal`) | 1 |
| `origin` / `target` | Brain region names | N:1 |
| `neurotransmitter` | `qif-neurotransmitters.json → id` | N:1 |
| `dsm_conditions[]` | DSM-5-TR codes (F##.#) | 1:N |
| `disruption_effects[]` | Clinical outcomes if pathway disrupted | 1:N |
| `bci_relevance` | HIGH / MEDIUM / LOW | 1:1 |
| `category` | neurotransmitter / sensory / motor / limbic / cortical / cerebellar | 1:1 |

### Layer 4: Neurotransmitter Systems

**`qif-neurotransmitters.json`** — 18 systems (dopamine, serotonin, GABA, glutamate, norepinephrine, acetylcholine, endorphin, histamine, ...)

| Field | Links To | Cardinality |
|-------|----------|-------------|
| `id` | Primary key (e.g., `dopamine`) | 1 |
| `synthesis_pathway` | Precursor → enzyme → product chain | 1:1 |
| `synthesis_cofactors[]` | Molecular dependencies (BH4, Fe2+, PLP, ...) | 1:N |
| `receptors[]` | Receptor subtypes (D1, D2, 5-HT1A, ...) | 1:N |
| `transporters[]` | Reuptake proteins (DAT, SERT, NET, ...) | 1:N |
| `degradation_enzymes[]` | MAO-A, MAO-B, COMT, AChE, ... | 1:N |
| `genes[]` | HGNC gene nomenclature | 1:N |
| `dsm_conditions[]` | DSM-5-TR codes with mechanism detail | 1:N |

### Layer 5: Molecular Dependencies (Micro)

Embedded within `qif-neurotransmitters.json`. Each neurotransmitter's synthesis pathway specifies:

```
Precursor amino acid (e.g., L-tyrosine)
  + Enzyme (e.g., tyrosine hydroxylase, TH)
  + Cofactors (e.g., BH4, Fe2+, O2)
  → Intermediate (e.g., L-DOPA)
  + Enzyme (e.g., DOPA decarboxylase, DDC)
  + Cofactor (e.g., PLP / vitamin B6)
  → Neurotransmitter (e.g., dopamine)
```

**Why this matters for security:** A BCI attack that disrupts neural activity at a specific brain region doesn't just affect "the brain" — it disrupts specific pathways that depend on specific neurotransmitters whose synthesis requires specific molecular cofactors. Understanding the full chain lets TARA map the cascade: technique → band → region → pathway → transmitter → molecular dependency → clinical outcome.

---

## Clinical Outcome Mappings

### Currently Mapped: DSM-5-TR (Psychiatric)

**`qif-dsm-mappings.json`** — 68 diagnoses in 5 clusters

| Cluster | Example Conditions | Count |
|---------|-------------------|-------|
| Cognitive/Psychotic | Schizophrenia (F20.x), Delirium (F05), Psychotic disorder (F06.2) | ~12 |
| Mood/Trauma | MDD (F32.x), Bipolar (F31.x), PTSD (F43.10), GAD (F41.1), OCD (F42.x) | ~15 |
| Motor/Neurocognitive | Parkinson's (G20), MS (G35), Epilepsy (G40.x), Alzheimer's (G30.x), ALS (G12.21) | ~10 |
| Persistent/Personality | BPD (F60.x), Depersonalization (F48.1) | ~5 |
| Non-Diagnostic | Silicon-only attacks (no clinical outcome) | ~6 |

### In Progress (v2.0): ICD-11 + Neurology (Non-Psychiatric)

Conditions that BCI attacks can induce but DSM-5-TR does not cover:

| Sensory Modality | Conditions | ICD-11 Codes | Neural Substrate |
|-----------------|------------|-------------|-----------------|
| **Olfactory** | Phantosmia, anosmia, parosmia | AB30, MB40.1 | Olfactory bulb, piriform cortex |
| **Gustatory** | Phantom taste, ageusia, dysgeusia | MB40.0 | Insular cortex, nucleus tractus solitarius |
| **Vestibular** | Vertigo, spatial disorientation, loss of balance | AB31, MB45 | Vestibular nuclei, cerebellum |
| **Somatosensory** | Phantom pain, paresthesia, proprioceptive confusion | MG30, 8B82 | S1, posterior parietal, thalamus |
| **Auditory** | Tinnitus, hyperacusis, auditory hallucination | AB32, MC40 | Auditory cortex, inferior colliculus |
| **Visual** | Cortical blindness, phosphenes, prosopagnosia | 9D90, MB49 | V1, fusiform gyrus, LGN |
| **Motor** | Dystonia, tremor, ataxia | 8A02, 8A04, 8A03 | Basal ganglia, cerebellum, motor cortex |
| **Pain** | Central pain syndrome, neuropathic pain | MG30.1, 8B82 | Thalamus, ACC, insula |

### Not Yet Mapped (Research Needed)

| Domain | Gap | Why It Matters |
|--------|-----|---------------|
| **Autonomic** | Heart rate, blood pressure, thermoregulation disruption | Hypothalamic and brainstem BCI targets |
| **Neuroendocrine** | Hormonal cascade disruption (cortisol, oxytocin, melatonin) | HPA axis attacks via limbic stimulation |
| **Circadian** | Sleep architecture disruption | Suprachiasmatic nucleus stimulation |
| **Immunological** | Neuroimmune interactions | Vagus nerve stimulation effects |
| **Developmental** | Long-term neuroplasticity effects | Chronic stimulation in developing brains |

---

## NISS v2.0: Extended Severity Weighting

NISS v1.1 maps to DSM-5-TR only. NISS v2.0 adds:

### Non-DSM Clinical Weighting Factors

For each sensory/neurological outcome, NISS v2.0 scores:

| Factor | Weight Range | Description |
|--------|-------------|-------------|
| **Reversibility (R)** | 0.0–1.0 | 0 = fully reversible on signal removal, 1 = permanent damage |
| **Functional Impact (FI)** | 0.0–1.0 | Context-dependent daily functioning impairment |
| **Pathway Specificity (PS)** | 0.0–1.0 | How precisely the modality can be targeted (higher = more targetable = higher risk) |
| **Clinical Evidence (CE)** | 0.0–1.0 | 0 = theoretical, 0.5 = reported in DBS/stim studies, 1.0 = documented in BCI trials |
| **Modality Criticality (MC)** | 0.0–1.0 | How critical the modality is to patient safety (vestibular/proprioceptive > olfactory for fall risk) |

**Extended NISS Vector (v2.0):**
```
NISS:2.0/BI:H/CR:H/RE:M/SC:L/DSM:F32.x/ICD:AB32/R:0.7/FI:0.8/PS:0.6/CE:0.5/MC:0.9
```

### Severity Scale for Non-DSM Outcomes

| Score | Severity | Non-DSM Example |
|-------|----------|----------------|
| 9.0–10.0 | Critical | Cortical blindness, complete vestibular failure, central pain syndrome |
| 7.0–8.9 | High | Persistent tinnitus, chronic neuropathic pain, dystonia |
| 4.0–6.9 | Medium | Phantosmia, paresthesia, mild tremor, hyperacusis |
| 1.0–3.9 | Low | Transient phosphenes, temporary ageusia, mild spatial disorientation |
| 0.1–0.9 | Informational | Silicon-only effects, no neurological impact |

---

## Join Paths for KQL

These are the query patterns used in the BCI KQL engine (`/research/landscape/`).

### Technique → Full Clinical Chain
```kql
techniques
| join kind=inner (brain_atlas_bands) on band_id
| join kind=inner (brain_regions) on band_id
| join kind=leftouter (neural_pathways) on region_name
| join kind=leftouter (neurotransmitters) on neurotransmitter_id
| join kind=leftouter (dsm_mappings) on dsm_code
| project technique_id, technique_name, band, region, pathway, neurotransmitter,
         synthesis_cofactors, receptors, dsm_condition, severity
```

### Device → Threat Exposure → Clinical Risk
```kql
devices
| mv-expand tara_attack_surface
| join kind=inner (techniques) on $left.tara_attack_surface == $right.id
| join kind=inner (neurosecurity_scores) on device_name
| summarize techniques=count(), avg_severity=avg(niss_score),
           dsm_clusters=make_set(dsm_cluster) by device_name, overall_score
| order by overall_score desc
```

### Neurotransmitter → All Attack Vectors
```kql
neural_pathways
| where neurotransmitter == "dopamine"
| join kind=inner (brain_regions) on $left.origin == $right.name
| join kind=inner (brain_atlas_bands) on band_id
| join kind=leftouter (techniques) on band_id
| project pathway_name, origin, target, technique_id, technique_name, severity
| order by severity desc
```

### Coverage Gap Analysis (What's Not Yet Mapped)
```kql
brain_regions
| join kind=leftanti (neural_pathways) on $left.name == $right.origin
| project region_name, band, severity_if_compromised
| order by severity_if_compromised desc
// Regions with no pathway mapping = unmapped attack surface
```

---

## Visualization Components (Site)

| Component | What It Shows | Data Sources |
|-----------|-------------|-------------|
| `HourglassVisualization.tsx` | 11-band stack with technique counts per band | qtara-registrar, brain-bci-atlas |
| `BrainVisualization.tsx` | 3D brain with region hotspots, security/clinical/governance views | brain-bci-atlas, neural-pathways |
| `TaraVisualization.tsx` | Full threat atlas with filtering, sorting, NISS scores | qtara-registrar |
| `ClinicalDashboard.tsx` | DSM-5-TR diagnostic mapping | dsm-mappings, qtara-registrar |
| `BciDashboard.tsx` | 6-panel device explorer (specs, threats, brain, hourglass, risk, clinical) | All files |
| `BciKql.tsx` | In-browser KQL query engine over all datasets | All files |
| **TBD: NeurotransmitterPathwayViz** | Synthesis chains, cofactors, receptors, disruption effects | neural-pathways, neurotransmitters |
| **TBD: SensoryModalityMap** | Non-DSM neurological outcomes by sensory modality | ICD-11 mappings (v2.0) |
| **TBD: MolecularDependencyGraph** | Cofactor → enzyme → transmitter → pathway → region | neurotransmitters |

---

## How To Show This

The mapping is best visualized as a **drill-down flow** — start at any level and navigate deeper:

```
[Pick a TARA Technique] → QIF-T0042 (SSVEP Frequency Hijack)
  ↓ click band
[Hourglass Band] → N6 (Limbic) + N7 (Neocortex)
  ↓ click region
[Brain Region] → Visual cortex (V1), Lateral geniculate nucleus (LGN)
  ↓ click pathway
[Neural Pathway] → Retino-geniculo-striate pathway
  ↓ click neurotransmitter
[Neurotransmitter] → Glutamate
  ↓ expand molecular
[Molecular] → Synthesis: glutamine → glutaminase → glutamate
              Cofactors: PLP (B6), Mg2+
              Receptors: NMDA, AMPA, mGluR
              Degradation: glutamate dehydrogenase
  ↓ click clinical
[Clinical Outcomes]
  DSM-5-TR: Visual hallucinations (F16.x), Seizure disorder (G40.x)
  ICD-11: Phosphenes, cortical blindness (9D90), photosensitive epilepsy
  NISS: 7.2 (High) — R:0.6/FI:0.8/PS:0.9/CE:0.7/MC:0.8
```

This drill-down can be implemented as a linked dashboard where clicking any node navigates to the next level — or as a single-page explorer with expandable panels.

---

*Source of truth: `shared/` directory*
*Last updated: 2026-03-11*
*Maintained by: Kevin Qi*
