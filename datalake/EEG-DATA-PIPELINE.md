# EEG Sample Data Pipeline

## Overview

QIF maintains a curated registry of EEG datasets for BCI security research and component testing. These datasets serve as training and validation data for tools like the Spectrum/Signal Analyzer, Neurowall, and the KQL-based threat intelligence engine.

**This pipeline is a research tool, not a clinical instrument.** All clinical inferences produced by QIF components require independent clinical validation before use in any diagnostic or treatment context.

## Why We Built This

BCI security research needs real neural signal data to test threat detection, anomaly classification, and signal analysis components. However, raw EEG data is sensitive (neural data sits at the highest protection tier in QIF's governance model), and most clinical datasets carry restrictive licenses.

Our approach:
1. **Source openly licensed datasets** with verified redistribution rights
2. **Augment with synthetic data** generated through BrainFlow and custom generators for privacy-safe testing
3. **Tag everything in the KQL data lake** with full provenance, licensing, and condition metadata
4. **Simulate attack scenarios** mapped to TARA techniques for security validation

## Data Sources

### Real Clinical Datasets

| Dataset | Source | License | Subjects | Conditions | Redistributable |
|---------|--------|---------|----------|------------|-----------------|
| ADHD Adult Resting State | [Mendeley Data](https://data.mendeley.com/datasets/6k4g25fhzg/1) | CC BY 4.0 | 79 (37 ADHD + 42 control) | ADHD, resting-state | Yes |
| ADHD/Control Children | IEEE DataPort | Academic | 121 (61 ADHD + 60 control) | ADHD, pediatric | No |
| FOCUS: ADHD Gameplay | IEEE DataPort | Academic | N/A | ADHD, cognitive task | No |
| CHB-MIT Scalp EEG | [PhysioNet](https://physionet.org/content/chbmit/1.0.0/) | ODC-BY | 22 | Epilepsy, seizure | Yes |
| Sleep-EDF Expanded | [PhysioNet](https://physionet.org/content/sleep-edfx/1.0.0/) | ODC-BY | 197 | Sleep staging | Yes |
| Motor Movement/Imagery | [PhysioNet](https://physionet.org/content/eegmmidb/1.0.0/) | ODC-BY | 109 | Motor imagery, BCI | Yes |
| UCI EEG (Alcoholism) | [UCI ML Archive](https://archive.ics.uci.edu/dataset/121/eeg+database) | CC BY 4.0 | 122 | Alcoholism/substance use | Yes |
| DEAP Emotion | QMUL | Academic | 32 | Emotion, arousal | No |
| SEED Emotion | SJTU | Academic | 15 | Emotion classification | No |

### License Verification Process

Before including any dataset, we verify licensing through:

1. **Publisher page review** — Read the dataset's license declaration on the hosting platform
2. **License text verification** — Confirm the specific license variant (CC BY 4.0, ODC-BY, etc.) and its terms
3. **Redistribution rights check** — Determine whether we can include the data in our repository or only reference it
4. **Attribution requirements** — Document what attribution is required and generate `ATTRIBUTION.json` and `ATTRIBUTION.md` per dataset

**Example: Mendeley ADHD Dataset.** The dataset at `data.mendeley.com/datasets/6k4g25fhzg/1` (Nasrabadi et al.) is published under CC BY 4.0, which explicitly permits redistribution, commercial use, and derivative works with attribution. We verified this by:
- Reading the license declaration on the Mendeley Data page
- Confirming CC BY 4.0 terms at [creativecommons.org/licenses/by/4.0](https://creativecommons.org/licenses/by/4.0/)
- Generating attribution files stored alongside any downloaded data

### Synthetic & Augmented Data

| Dataset | Generator | Purpose |
|---------|-----------|---------|
| QIF-Lab Healthy Baseline | `qif-lab/src/synthetic_data.py` | Multi-band EEG synthesis (delta through gamma) for baseline testing |
| BrainFlow Synthetic Board | BrainFlow SDK `SYNTHETIC_BOARD` | Real-time synthetic data generation with realistic spectral content |
| Neurowall SSVEP Attack | `tools/neurowall/sim.py` | SSVEP injection at 15Hz/10.9Hz for firewall testing (maps to QIF-T0001) |
| Neurosim Signal Injection | `tools/neurosim/qif-attack-simulator/` | SSVEP, impedance, flooding, replay attacks (maps to QIF-T0001, T0014, T0023, T0026) |
| Neurosim Evasion | `tools/neurosim/.../evasion.py` | DC drift, boiling frog, envelope modulation (maps to QIF-T0014) |
| Neurosim Feedback Cascade | `tools/neurosim/.../feedback.py` | Closed-loop cascade exploiting neurofeedback cycle (maps to QIF-T0023) |

Synthetic data is generated using models trained on statistical properties of publicly available EEG datasets. The generators produce data with realistic spectral characteristics (appropriate power distributions across frequency bands) without containing or reconstructing any individual's neural data.

## KQL Data Lake Integration

All datasets are registered in `shared/eeg-samples.json` and surfaced through the KQL query engine via `src/lib/kql-tables.ts`. This allows unified querying across all data sources:

```kql
eeg_samples
| where conditions contains "adhd"
| project name, source, license, subjects, sampling_rate_hz, redistributable
```

Each entry includes:
- **Provenance fields**: `source`, `source_url`, `license`, `redistributable`
- **Clinical metadata**: `conditions`, `dsm5_code`, `paradigm`
- **Technical specs**: `channels`, `channel_names`, `sampling_rate_hz`, `format`
- **Security mappings**: `tara_id` (links attack simulation data to TARA techniques)

## Spectrum/Signal Analyzer Application

The tagged datasets feed into QIF's Spectrum/Signal Analyzer components, which perform spectral analysis across frequency bands to identify patterns associated with different neurological conditions.

### ADHD Pattern Analysis

Using the Mendeley ADHD dataset (37 ADHD + 42 control, 5 channels, 256 Hz), the analyzer examines:
- **Theta/beta ratio** — elevated theta (4-8 Hz) relative to beta (13-30 Hz) power is a commonly studied EEG biomarker associated with ADHD in the literature (Arns et al. 2013, Snyder & Hall 2006)
- **Alpha asymmetry** — frontal alpha power differences between hemispheres
- **Spectral entropy** — complexity measures across frequency bands
- **Event-related patterns** — differences during cognitive challenge vs. resting state

**Status: Research exploration, not a validated diagnostic tool.** The analyzer produces a pattern-match confidence score indicating how closely a given EEG recording's spectral profile resembles the statistical distribution of the ADHD group in the training data. This score:

- Is NOT a diagnostic confidence score
- Does NOT predict or diagnose ADHD or any other condition
- Reflects statistical similarity to a reference distribution, not clinical significance
- Requires clinical validation before any clinical interpretation

### Potential Clinical Research Value

We believe this approach — combining tagged, openly licensed EEG datasets with spectral analysis and condition-referenced confidence scoring — could be a useful research tool for clinical investigators studying neurodevelopmental conditions.

**ADHD and Autism Spectrum Disorder (ASD) present significant diagnostic overlap.** Both conditions share features including executive function differences, sensory processing variations, attention regulation challenges, and social communication patterns. The DSM-5-TR recognizes that ADHD and ASD frequently co-occur, and differential diagnosis remains a clinical challenge (Antshel & Russo 2019, Lau-Zhu et al. 2019).

**A particularly underrecognized challenge is masking in high-functioning individuals.** People with ASD — especially those diagnosed late in life — often develop compensatory strategies (sometimes called "camouflaging" or "masking") that suppress visible traits during clinical observation and formal testing (Hull et al. 2017, Lai et al. 2017). This camouflaging:

- Can reduce the sensitivity of behavioral assessment instruments
- Is more prevalent in women and individuals with higher adaptive functioning
- May lead to missed or delayed diagnoses, particularly when ADHD is the presenting concern
- Creates a need for objective physiological measures that are less susceptible to behavioral compensation

EEG-based analysis could potentially complement behavioral assessment by providing physiological markers that are less influenced by conscious or unconscious masking behaviors. However, this is a research hypothesis that requires rigorous clinical investigation.

### What This Needs

This pipeline and the associated analysis tools are in early development. Before any clinical application, the following are required:

1. **Independent clinical validation** — Replication by clinical researchers with appropriate IRB oversight
2. **Larger, diverse datasets** — Current ADHD datasets are limited in size and demographic diversity
3. **Clinician review** — All pattern associations and confidence scores must be reviewed by psychiatrists and neuropsychologists
4. **Sensitivity/specificity analysis** — Formal receiver operating characteristic (ROC) analysis against clinical gold-standard diagnoses
5. **Population-specific calibration** — Separate validation for pediatric vs. adult, gender-stratified, and culturally diverse populations
6. **Ethical review** — Assessment of risks including false positives, false negatives, and potential for over-reliance on automated scoring
7. **Masking-specific studies** — Targeted investigation of whether EEG markers remain detectable in individuals who mask effectively during behavioral testing

## Download & Setup

```bash
# List all available datasets
npm run eeg:list

# Download a specific dataset
npm run eeg:download -- --dataset adhd-mendeley-resting

# Download all redistributable datasets
npm run eeg:download -- --all

# Dry run (show what would be downloaded)
npm run eeg:download -- --all --dry-run
```

Downloads are saved to `model/qif-lab/data/<dataset-id>/` with `ATTRIBUTION.json` and `ATTRIBUTION.md` generated per dataset. Large data files (`.edf`, `.mat`, `.bdf`) are gitignored.

## File Reference

| File | Purpose |
|------|---------|
| `shared/eeg-samples.json` | Dataset registry (source of truth) |
| `shared/scripts/download-eeg-samples.py` | Download script with attribution generation |
| `src/lib/kql-tables.ts` | KQL table builder (includes `eeg_samples` table) |
| `model/qif-lab/data/` | Downloaded data directory (gitignored) |
| `.gitignore` | Excludes `.edf`, `.mat`, `.bdf` data files |

## Citation

If using this pipeline or the associated datasets in research, please cite both QIF and the original dataset authors:

- **QIF Framework**: Qi, K. (2026). *QIF: A Unified Security Framework for Brain-Computer Interfaces.* Zenodo. DOI: 10.5281/zenodo.18640105
- **Mendeley ADHD Dataset**: Nasrabadi, A.M. et al. (2020). *EEG data for ADHD / Control children.* Mendeley Data. DOI: 10.17632/6k4g25fhzg.1
- **BrainFlow**: Parfenov, A. et al. (2020). *BrainFlow: An Open-Source SDK for Biosensor Applications.* [brainflow.org](https://brainflow.org)

## Disclaimer

This documentation describes a research data pipeline for BCI security testing. No component of this system is a medical device, diagnostic instrument, or clinical decision support tool. All references to DSM-5-TR diagnostic categories are for threat modeling purposes and do not constitute diagnostic claims. EEG pattern analysis produces statistical correlations, not clinical diagnoses. Clinical validation by qualified professionals is required before any clinical application.
