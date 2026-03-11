# NISS Neurological Extension (v1.1)

> **Status:** Proposed (unvalidated). Not adopted by any standards body.
> **Last updated:** 2026-03-11
> **Data file:** `shared/qif-neurological-mappings.json`
> **KQL table:** `neurological_conditions`

## Problem

NISS v1.0 mapped technique outcomes exclusively to DSM-5-TR psychiatric categories. The DSM is a psychiatric manual. It does not cover neurological disruptions: loss of smell, tinnitus, vestibular dysfunction, motor tremor, autonomic dysregulation, cortical blindness, neuropathic pain. These are real clinical outcomes of neural interface attacks that had no representation in the scoring system.

## What Changed

### 42 Neurological Conditions Added

Drawn from ICD-10-CM chapters G (nervous system), H (eye/ear), and R (symptoms/signs), using Adams & Victor's *Principles of Neurology* (12th ed., Ropper et al. 2023) as the primary clinical reference.

| Category | Count | Examples | ICD-10-CM Chapters |
|----------|-------|----------|--------------------|
| Sensory | 14 | Tinnitus (H93.1), anosmia (R43.0), cortical blindness (H47.61), vertigo (H81.x), ageusia (R43.2), paresthesia (R20.2) | G, H, R |
| Motor | 8 | Tremor (G25.0), dystonia (G24.x), ataxia (R27.0), spasticity (G80.x) | G, R |
| Autonomic | 6 | Orthostatic hypotension (I95.1), cardiac arrhythmia (I49.x), thermoregulatory dysfunction (R68.0) | G, I, R |
| Consciousness | 4 | Syncope (R55), absence seizures (G40.A), altered sensorium (R41.82) | G, R |
| Speech/Language | 4 | Expressive aphasia (R47.01), receptive aphasia (R47.1), dysarthria (R47.1), alexia (R48.0) | R |
| Reflex | 3 | Hyperreflexia (R29.2), areflexia (G90.x), abnormal plantar response (R29.2) | G, R |
| Pain | 3 | Neuropathic pain (G89.x), trigeminal neuralgia (G50.0), central pain syndrome (G89.0) | G |

### CD Broadened to Cognitive/Functional Disruption

The CD metric was renamed from "Cognitive Disruption" to "Cognitive/Functional Disruption" to encompass sensory, motor, and autonomic disruption alongside cognitive interference. This is a definitional change only. All existing CD scores remain valid. The scoring formula is unchanged.

Old definition:
> Degree of unauthorized cognitive write access: perception manipulation, identity modification, cognitive coercion

New definition:
> Degree of unauthorized disruption to cognitive processing, sensory perception, motor output, or autonomic regulation

### NP Expanded to 4 Levels

The Neuroplasticity metric was expanded from 3 levels to 4, matching the granularity of other NISS metrics:

| Code | Label | Score | Description |
|------|-------|-------|-------------|
| N | None | 0.0 | No neuroplastic effect |
| T | Temporary | 3.3 | Short-term synaptic changes that decay within hours to weeks |
| P | Partial | 6.7 | Moderate synaptic reorganization persisting weeks to months |
| S | Structural | 10.0 | Long-term or permanent neural pathway changes |

The new P (Partial) level fills the gap between transient synaptic changes and permanent structural remodeling. This matches the 4-point scale used by BI, CR, CD, CV, and RV.

### KQL: Individual NISS Metrics Now Queryable

The `techniques` KQL table now exposes individual NISS metric values as columns:

```kql
// Find all techniques with high biological impact
techniques | where niss_bi == "H" or niss_bi == "C"

// Techniques with irreversible damage AND cognitive disruption
techniques | where niss_rv == "I" and niss_cd != "N"

// Distribution of neuroplasticity scores
techniques | summarize count() by niss_np
```

New columns: `niss_vector`, `niss_severity`, `niss_pins`, `niss_bi`, `niss_cr`, `niss_cd`, `niss_cv`, `niss_rv`, `niss_np`.

## How It Connects to QIF

### Hourglass Band Mapping

Each neurological condition maps to specific QIF hourglass bands based on where the disruption occurs anatomically:

| Band | Region | Neurological Conditions |
|------|--------|------------------------|
| N7 | Neocortex | Cortical blindness, expressive/receptive aphasia, alexia, central pain |
| N6 | Limbic | Altered sensorium, emotional dysregulation, autonomic conditions |
| N5 | Basal Ganglia | Tremor, dystonia, bradykinesia, dyskinesia, chorea |
| N4 | Thalamus | Tinnitus, paresthesia, central pain syndrome |
| N3 | Brainstem | Vertigo, nystagmus, dysarthria, cardiac arrhythmia, syncope |
| N2 | Cerebellum | Ataxia, intention tremor, dysmetria |
| N1 | Spinal Cord | Spasticity, hyperreflexia, areflexia, neurogenic bladder |
| I0 | Interface | All conditions (hardware-biology boundary) |

### Neural Pathway Dependencies

Neurological conditions are caused by disruption to specific neural pathways. The `shared/qif-neural-pathways.json` atlas contains 39 pathways. Each neurological condition in the mapping references its dependent pathways:

- **Anosmia** depends on the olfactory pathway (olfactory bulb -> piriform cortex)
- **Tinnitus** depends on the auditory pathway (cochlear nerve -> auditory cortex)
- **Vertigo** depends on the vestibular pathway (vestibular nerve -> vestibular nuclei -> cerebellum)
- **Tremor** depends on the nigrostriatal pathway (substantia nigra -> striatum)
- **Cortical blindness** depends on the visual pathway (optic nerve -> LGN -> V1)

This creates a chain: **TARA technique -> QIF band -> neural pathway -> neurological condition -> NISS metric**.

### Impact Chain

The full attack-to-outcome chain:

```
TARA Technique (e.g., QIF-T0045: Sensory Channel Injection)
  -> Targets band N3 (Brainstem) + N4 (Thalamus)
  -> Disrupts vestibular pathway + auditory pathway
  -> Causes vertigo (H81.x), tinnitus (H93.1)
  -> NISS scores: BI:L, CD:H (sensory disruption), RV:T, NP:T
  -> DSM cluster: Somatic/Neurological
  -> ICD-10-CM: H81.x, H93.1
```

### NISS Metric Mapping

Each neurological condition identifies which NISS metric it primarily affects:

| NISS Metric | Primary Conditions |
|-------------|-------------------|
| BI (Biological Impact) | Seizures, cardiac arrhythmia, tissue damage |
| CD (Cognitive/Functional Disruption) | All sensory, motor, speech, and autonomic conditions |
| CR (Cognitive Reconnaissance) | Conditions enabling neural data extraction |
| RV (Reversibility) | Conditions where permanence varies (partial hearing loss, neuroplastic changes) |
| NP (Neuroplasticity) | Conditions involving synaptic reorganization (tinnitus, phantom pain, dystonia) |

CD is the primary metric for most neurological conditions because it captures the functional disruption dimension.

## Data Architecture

```
shared/qif-neurological-mappings.json    <- Source of truth (42 conditions)
  |
  v
src/lib/kql-tables.ts                   <- Flattens to KQL table at build time
  |
  v
neurological_conditions table            <- Queryable in BciKql.tsx
  |
  +-- Joins with: techniques (via bands)
  +-- Joins with: neural_pathways (via pathway_ids)
  +-- Joins with: impact_chains (via dsm_code)
```

The JSON file is the storage layer. KQL is the query interface. Everything is read-only at build time (static site generation). There is no live database and no runtime mutation.

## Backward Compatibility

- All existing NISS scores remain valid
- The scoring formula is unchanged
- CD scores are not affected (definition broadened, not changed)
- NP scores with T or S remain valid at their new numeric values (T: 5.0 -> 3.3, S: 10.0 unchanged)
- Existing techniques with NP:T will score slightly lower due to the T value change from 5.0 to 3.3. This is intentional: the old 3-level scale gave Temporary a disproportionate midpoint weight

## References

- Ropper AH, Samuels MA, Klein JP, Prasad S. (2023). *Adams and Victor's Principles of Neurology.* 12th ed. McGraw Hill. ISBN: 978-1264264520.
- CMS/NCHS. (2026). *ICD-10-CM Tabular List of Diseases and Injuries.* Federal Register.
- APA. (2022). *Diagnostic and Statistical Manual of Mental Disorders.* 5th ed., text revision (DSM-5-TR).

## Running the Recalculation

After modifying NP values or any NISS metric, run the recalculation script to update all technique scores:

```bash
# Dry run first
python3 shared/scripts/recalculate-niss.py --dry-run

# Apply changes
python3 shared/scripts/recalculate-niss.py
```

This updates `shared/qtara-registrar.json` with recalculated scores, severity labels, and PINS flags.
