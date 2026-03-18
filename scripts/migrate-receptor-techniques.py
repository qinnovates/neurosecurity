#!/usr/bin/env python3
"""
Receptor Expansion Migration Script — 20 New TARA Techniques
Adds techniques from GABA, ACh, Serotonin, and Glutamate receptor research.
Also enriches existing entries (T0136, T0009) with domain_secondary additions.

Built-in delta validation: pre-flight snapshot, post-flight integrity checks.

Usage:
  python3 scripts/migrate-receptor-techniques.py --dry-run
  python3 scripts/migrate-receptor-techniques.py
"""

import json
import sys
import hashlib
import copy
import shutil
from pathlib import Path
from collections import Counter

REGISTRAR_PATH = Path(__file__).parent.parent / "datalake" / "qtara-registrar.json"
BACKUP_PATH = REGISTRAR_PATH.with_suffix(".json.receptor-bak")

# ============================================================================
# 20 NEW TECHNIQUES — Sequential from QIF-T0142
# tara_alias computed dynamically to avoid collisions
# ============================================================================

NEW_TECHNIQUES = [
    # === GABA (7 techniques) ===
    {
        "id": "QIF-T0142", "attack": "SICI-TMS GABA-A cortical inhibition (short-interval paired-pulse)",
        "tactic": "QIF-N.MD", "bands": "I0-N1", "band_ids": ["I0", "N1"],
        "status": "CONFIRMED", "severity": "medium", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["MOT", "AUT"], "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "Paired-pulse TMS: subthreshold conditioning stimulus (70-80% RMT) at ISI 1-5ms activates synaptic GABA-A inhibitory interneurons. Benzodiazepine-sensitive (gamma2 subunit). Distinct from T0009 (RF) and T0010 (ELF) by magnetic induction via contact coil + paired-pulse paradigm targeting GABA-A specifically.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "Diagnostic SICI for ALS, stroke biomarker", "conditions": ["ALS diagnosis", "stroke motor mapping"], "fda_status": "cleared", "evidence_level": "clinical_validated"},
            "governance": {"consent_tier": "enhanced", "data_classification": "PHI", "safety_ceiling": "Conditioning pulse subthreshold 70-80% RMT; ISI 1-5ms"}
        },
        "sources": ["Kujirai 1993 J Physiol 471:501-519 PMID:8392356"]
    },
    {
        "id": "QIF-T0143", "attack": "LICI-TMS GABA-B long-interval cortical inhibition (suprathreshold paired-pulse)",
        "tactic": "QIF-N.MD", "bands": "I0-N1", "band_ids": ["I0", "N1"],
        "status": "CONFIRMED", "severity": "medium", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["AUT", "EMO"], "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "Paired-pulse TMS: suprathreshold conditioning at ISI 50-200ms (peak 80-135ms) activates GABA-B metabotropic receptors. Gi-coupled GIRK K+ channel hyperpolarization. Pharmacologically distinct from SICI: baclofen enhances LICI, benzodiazepines do not. Maps directly to GABA-B IPSP kinetics.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "LICI biomarker for epilepsy, TBI", "conditions": ["epilepsy biomarker", "traumatic brain injury"], "fda_status": "cleared", "evidence_level": "clinical_validated"},
            "governance": {"consent_tier": "enhanced", "data_classification": "PHI", "safety_ceiling": "Suprathreshold CS; standard rTMS safety guidelines"}
        },
        "sources": ["Valls-Sole 1992 PMID:1374989", "McDonnell 2006 PMC8206493"]
    },
    {
        "id": "QIF-T0144", "attack": "cTBS GABAergic LTD interneuron upregulation (theta-burst GABA increase)",
        "tactic": "QIF-N.MD", "bands": "I0-N1", "band_ids": ["I0", "N1"],
        "status": "CONFIRMED", "severity": "high", "ui_category": "DS",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["MOT"], "tara_mode": "D",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "Continuous theta-burst stimulation (50Hz triplets at 5Hz, 40s, 600 pulses, ~80% AMT) induces LTD-like cortical suppression lasting 30-60min with MRS-confirmed GABA increase in M1. Distinct from SICI/LICI (paired-pulse) and T0010 (ELF entrainment). The GABA increase is a neuroplasticity response, not acute receptor activation.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "cTBS for depression, chronic pain, post-stroke", "conditions": ["treatment-resistant depression", "chronic pain", "stroke rehabilitation"], "fda_status": "cleared", "evidence_level": "clinical_validated"},
            "governance": {"consent_tier": "enhanced", "data_classification": "PHI", "safety_ceiling": "Max 40s train; epilepsy absolute contraindication"}
        },
        "sources": ["Huang 2005 Neuron DOI:10.1016/j.neuron.2004.12.033", "Stagg 2009 J Neurophysiol DOI:10.1152/jn.91060.2008 PMID:19339458"]
    },
    {
        "id": "QIF-T0145", "attack": "Anodal tDCS polarity-specific GABA depletion (MRS-measured)",
        "tactic": "QIF-N.MD", "bands": "I0-N1", "band_ids": ["I0", "N1"],
        "status": "CONFIRMED", "severity": "medium", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["MOT", "EMO"], "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "Anodal tDCS (1-2mA, 10-20min, M1) reduces cortical GABA 10-30% (7T MRS, Stagg 2009). Polarity-specific: anodal reduces GABA only; cathodal reduces both GABA and glutamate (coupled). Distinct from T0001 (generic signal injection) by NT-specific polarity asymmetry not captured in T0001.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "Anodal tDCS for stroke motor rehab, depression", "conditions": ["stroke rehabilitation", "depression", "working memory"], "fda_status": "investigational", "evidence_level": "clinical_pilot"},
            "governance": {"consent_tier": "standard", "data_classification": "sensitive_neural", "safety_ceiling": "1-2mA max; 40min/session; no epileptic foci"}
        },
        "sources": ["Stagg 2009 J Neurosci DOI:10.1523/JNEUROSCI.4432-08.2009 PMID:19386916"]
    },
    {
        "id": "QIF-T0146", "attack": "Gamma-tACS PV-interneuron GABA-A modulation (40Hz contact entrainment)",
        "tactic": "QIF-E.RD", "bands": "I0-N1", "band_ids": ["I0", "N1"],
        "status": "DEMONSTRATED", "severity": "medium", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["MOT"], "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "40Hz tACS via contact electrodes drives PV+ fast-spiking GABAergic interneurons phase-locked at gamma. Sustained >10min: duration-dependent GABA-A decrease (SICI-measured, Nowak 2017). Distinct from T0010 (non-contact ELF) and GENUS (sensory, no electrodes).",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "Gamma-tACS for Parkinson's motor restoration", "conditions": ["Parkinson's disease", "motor learning"], "fda_status": "investigational", "evidence_level": "clinical_pilot"},
            "governance": {"consent_tier": "standard", "data_classification": "sensitive_neural", "safety_ceiling": "1-2mA; screen for photosensitive epilepsy"}
        },
        "sources": ["Nowak 2017 J Neurosci DOI:10.1523/JNEUROSCI.0098-17.2017 PMID:28373400"]
    },
    {
        "id": "QIF-T0147", "attack": "FUS thalamic GABAergic suppression (acoustic GABA reduction)",
        "tactic": "QIF-E.RD", "bands": "I0-N2", "band_ids": ["I0", "N1", "N2"],
        "status": "DEMONSTRATED", "severity": "high", "ui_category": "DS",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["SOM", "AUT"], "tara_mode": "D",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "Transcranial focused ultrasound (0.25MHz, 100ms pulses) targeting thalamus reduces extracellular GABA ~20% without glutamate change (Yang 2012, rat microdialysis). Acoustic radiation force activates mechanosensitive channels (Piezo1/TREK). Thalamic reticular nucleus is almost entirely GABAergic — reducing thalamic GABA disrupts thalamocortical gating, sleep oscillations, consciousness. First acoustic NT-specific TARA technique.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "LIFU for essential tremor, disorders of consciousness", "conditions": ["essential tremor", "disorders of consciousness", "epilepsy"], "fda_status": "cleared", "evidence_level": "preclinical_strong"},
            "governance": {"consent_tier": "enhanced", "data_classification": "sensitive_neural", "safety_ceiling": "ISPTA <720 mW/cm2 (FDA diagnostic); MRI guidance for thalamic targeting"}
        },
        "sources": ["Yang 2012 Neuropsychobiology DOI:10.1159/000336001 PMID:22378299"]
    },
    {
        "id": "QIF-T0148", "attack": "GENUS gamma-sensory entrainment of PV+ GABAergic interneurons (non-contact 40Hz)",
        "tactic": "QIF-E.RD", "bands": "N1-N3", "band_ids": ["N1", "N2", "N3"],
        "status": "DEMONSTRATED", "severity": "medium", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["VIS", "AUD"], "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "40Hz visual LED flicker and/or auditory click trains (1hr/day) entrain PV+ fast-spiking GABAergic interneurons via endogenous sensory pathway resonance. Iaccarino 2016 (Nature): 40Hz-specific (not 20Hz, not 80Hz) PV interneuron drive reduces amyloid ~50% in 5XFAD mice, activates microglia. No electrode contact required. Distinct from T0103 (SSVEP hijack targets BCI signal spoofing, not interneuron NT modulation).",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "GENUS for Alzheimer's (MIT/Cognito Therapeutics Phase 2/3)", "conditions": ["Alzheimer's disease", "cognitive impairment"], "fda_status": "investigational", "evidence_level": "clinical_pilot"},
            "governance": {"consent_tier": "standard", "data_classification": "non_sensitive", "safety_ceiling": "Screen for photosensitive epilepsy; 40Hz auditory safe"}
        },
        "sources": ["Iaccarino 2016 Nature DOI:10.1038/nature20587 PMID:27929004"]
    },

    # === ACETYLCHOLINE (5 techniques) ===
    {
        "id": "QIF-T0149", "attack": "Implanted VNS cholinergic cortical manipulation via nucleus basalis",
        "tactic": "QIF-N.MD", "bands": "I0-N3", "band_ids": ["I0", "N1", "N2", "N3"],
        "status": "CONFIRMED", "severity": "high", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["MOT", "EMO", "AUT"], "tara_mode": "M",
        "physics_feasibility": {"tier": 1, "tier_label": "near_term"},
        "tara": {
            "mechanism": "Implanted cervical VNS cuff electrode activates vagal afferents -> NTS -> nucleus basalis of Meynert (NBM) -> cortical ACh release via mAChR. Scopolamine eliminates VNS cortical effects (Nichols 2011). ACh reinforcement selectively consolidates active motor circuits (Bowles 2022). Pre-condition: surgical implant. FDA-approved platform (LivaNova).",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "VNS for epilepsy, depression, stroke rehab", "conditions": ["epilepsy", "treatment-resistant depression", "stroke rehabilitation"], "fda_status": "approved", "evidence_level": "clinical_validated"},
            "governance": {"consent_tier": "IRB", "data_classification": "PHI", "safety_ceiling": "25Hz, 0.5ms PW, max 3.5mA; cardiovascular monitoring"}
        },
        "sources": ["Bowles 2022 DOI:10.1016/j.neuron.2022.06.017 PMID:35858623", "Nichols 2011 DOI:10.1016/j.neuroscience.2011.05.024 PMID:21627982"]
    },
    {
        "id": "QIF-T0150", "attack": "Transcutaneous auricular VNS (tVNS) cholinergic modulation",
        "tactic": "QIF-E.RD", "bands": "I0-N1", "band_ids": ["I0", "N1"],
        "status": "DEMONSTRATED", "severity": "medium", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["EMO", "AUT"], "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "Transcutaneous electrical stimulation of auricular branch of vagus nerve (ABVN) at cymba conchae (100% ABVN innervation). Activates NTS -> cholinergic relay. EEG microstate changes confirmed. P300 modulation demonstrated. Peripheral: alpha7 nAChR anti-inflammatory pathway. No surgery. Wearable ear clip (CE-marked Nemos).",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "tVNS for epilepsy, depression, Alzheimer's", "conditions": ["epilepsy", "depression", "Alzheimer's disease", "PTSD"], "fda_status": "cleared", "evidence_level": "clinical_pilot"},
            "governance": {"consent_tier": "standard", "data_classification": "sensitive_neural", "safety_ceiling": "25Hz, 250us PW, <8mA; cymba conchae"}
        },
        "sources": ["Yap 2020 PMID:33355897 DOI:10.2147/NDT.S251188", "PMID:32992726 PMC7599782"]
    },
    {
        "id": "QIF-T0151", "attack": "TMS cholinergic cortical perturbation via mAChR (40-63ms TEP)",
        "tactic": "QIF-E.RD", "bands": "I0-N1", "band_ids": ["I0", "N1"],
        "status": "EMERGING", "severity": "medium", "ui_category": "EX",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["MEM"], "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "Single-pulse TMS over SMA elicits TMS-evoked potentials (TEPs) suppressed by endogenous mAChR cholinergic tone. Scopolamine increases TEP at 40-63ms and enhances alpha synchronization. Distinct from SICI (GABA-A, ISI 1-5ms). Attack: TMS perturbation reveals/perturbs cholinergic status in BCI user.",
            "dual_use": "probable",
            "clinical": {"therapeutic_analog": "TMS-EEG biomarker for Alzheimer's cholinergic deficit", "conditions": ["Alzheimer's disease", "cholinergic monitoring"], "fda_status": "none", "evidence_level": "preclinical_strong"},
            "governance": {"consent_tier": "enhanced", "data_classification": "sensitive_neural", "safety_ceiling": "<10 single pulses/s; Rossi 2021 safety guidelines"}
        },
        "sources": ["DOI:10.1016/j.pnpbp.2024.111167"]
    },
    {
        "id": "QIF-T0152", "attack": "AChE inhibition BCI signal corruption (organophosphate exposure)",
        "tactic": "QIF-P.DS", "bands": "I0-N3", "band_ids": ["I0", "N1", "N2", "N3"],
        "status": "DEMONSTRATED", "severity": "critical", "ui_category": "DS",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["MOT", "AUT", "SOM"], "tara_mode": "D",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "Organophosphate nerve agents (sarin, VX, novichok) irreversibly phosphorylate AChE -> ACh accumulates -> cholinergic crisis. BCI impact: massive EEG distortion, seizure activity, NMJ fasciculation artifacts. Tokyo subway survivors showed EEG abnormalities 5 years post-exposure (Yanagisawa 2006). DEFENSIVE FRAMING: threat is BCI signal integrity during chemical exposure. Countermeasures: atropine (mAChR antagonist), pralidoxime (AChE reactivator <30min). BCI as diagnostic sensor for exposure detection.",
            "dual_use": "silicon_only",
            "clinical": {"therapeutic_analog": "BCI-guided cholinergic crisis detection and countermeasure", "conditions": ["organophosphate poisoning", "nerve agent exposure"], "fda_status": "none", "evidence_level": "preclinical"},
            "governance": {"consent_tier": "IRB", "data_classification": "PHI", "safety_ceiling": "DEFENSIVE: threat modeling and countermeasure detection only"}
        },
        "sources": ["O'Donnell 2011 DOI:10.1007/s00204-011-0724-z PMID:21695469", "Yanagisawa 2006 DOI:10.1016/j.jns.2006.06.007 PMID:16962140"]
    },
    {
        "id": "QIF-T0153", "attack": "Cholinergic medication status inference from BCI EEG spectral biomarkers",
        "tactic": "QIF-D.HV", "bands": "N1-N2", "band_ids": ["N1", "N2"],
        "status": "THEORETICAL", "severity": "medium", "ui_category": "SE",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["MEM", "IDN"], "tara_mode": "R",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "EEG spectral signatures track cholinergic tone. 14-biomarker mAChR index achieves 88-92% accuracy detecting mAChR antagonist administration (Simpraga 2017). AChEI drugs produce drug-specific alpha/theta/beta patterns (Arjmandi-Rad 2024, 24-study review). Passive BCI data inference attack: infer medication status (donepezil = Alzheimer's diagnosis proxy), disease progression, acute cholinergic changes. No stimulation required.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "EEG pharmacodynamic biomarker monitoring", "conditions": ["Alzheimer's disease", "cholinergic monitoring"], "fda_status": "none", "evidence_level": "clinical_pilot"},
            "governance": {"consent_tier": "IRB", "data_classification": "PHI", "safety_ceiling": "Data-only attack; countermeasure: differential privacy on EEG spectral features"}
        },
        "sources": ["Simpraga 2017 DOI:10.1038/s41598-017-06165-4 PMID:28720796", "Arjmandi-Rad 2024 PMID:37843690"]
    },

    # === SEROTONIN (4 techniques) ===
    {
        "id": "QIF-T0154", "attack": "VNS disynaptic serotonin upregulation (NTS->LC->DRN pathway)",
        "tactic": "QIF-N.MD", "bands": "N1-N4", "band_ids": ["N1", "N2", "N3", "N4"],
        "status": "CONFIRMED", "severity": "medium", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "EMO", "tara_domain_secondary": ["COG"], "tara_mode": "M",
        "physics_feasibility": {"tier": 1, "tier_label": "near_term"},
        "tara": {
            "mechanism": "VNS activates vagal afferents -> NTS -> locus coeruleus (NE, obligate intermediary) -> dorsal raphe nucleus (DRN, 5-HT). LC lesioning completely blocks 5-HT response (Dorr & Debonnel 2006). 14-day latency for serotonin effect (acute NE only). Disynaptic peripheral-to-brainstem cascade distinct from T0009 (EM cortical) and T0136 (photon CCO).",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "VNS for treatment-resistant depression", "conditions": ["treatment-resistant depression"], "fda_status": "approved", "evidence_level": "preclinical_strong"},
            "governance": {"consent_tier": "IRB", "data_classification": "PHI", "safety_ceiling": "20Hz, 500us, 0.25mA; 30s ON/5min OFF"}
        },
        "sources": ["Dorr & Debonnel 2006 PMID:16690723 PMC2702444"]
    },
    {
        "id": "QIF-T0155", "attack": "Transcranial focused ultrasound DRN serotonin release (Piezo1/TRPA1 mechanotransduction)",
        "tactic": "QIF-N.MD", "bands": "I0-N3", "band_ids": ["I0", "N1", "N2", "N3"],
        "status": "EMERGING", "severity": "high", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "EMO", "tara_domain_secondary": ["COG"], "tara_mode": "M",
        "physics_feasibility": {"tier": 2, "tier_label": "mid_term"},
        "tara": {
            "mechanism": "Low-intensity focused ultrasound (1.1MHz, 50% duty cycle, 30min/day x14 days) targets dorsal raphe nucleus with mm spatial precision. Acoustic pressure activates Piezo1 mechanosensitive channels (PNAS 2023) -> Ca2+ influx -> 5-HT release. LC-MS confirmed serotonin increase in DRN (Zeng 2022, PMID:35998565). No RF signature, no surface contact. High severity: precise deep targeting without EM emission.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "tFUS for treatment-resistant depression via DRN", "conditions": ["treatment-resistant depression", "OCD"], "fda_status": "investigational", "evidence_level": "preclinical"},
            "governance": {"consent_tier": "enhanced", "data_classification": "sensitive_neural", "safety_ceiling": "Sub-thermal; MI <1.9 (FDA diagnostic)"}
        },
        "sources": ["Zeng 2022 PMID:35998565", "Duque 2023 DOI:10.1073/pnas.2300291120 PMC10161134"]
    },
    {
        "id": "QIF-T0156", "attack": "High-frequency electroacupuncture dorsal raphe serotonin drive (100Hz peripheral afferent)",
        "tactic": "QIF-N.MD", "bands": "I0-N5", "band_ids": ["I0", "N1", "N2", "N3", "N4", "N5"],
        "status": "CONFIRMED", "severity": "medium", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "EMO", "tara_domain_secondary": ["COG", "SOM"], "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "100Hz electroacupuncture (ST36/SP6, 1-2mA, 0.2ms pulse, 45min) selectively activates serotonergic DRN neurons. pCPA (5-HT synthesis blocker) abolishes effect, confirming serotonin necessity (Lin 2017). Frequency-selective: 100Hz=5-HT (DRN), 2Hz=opioid (enkephalin). Second mechanism: 2Hz at GV20/GV29 downregulates miRNA-16 -> reduces SERT -> increases synaptic 5-HT (Zhao 2019). Peripheral needle -> spinal -> brainstem pathway.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "Electroacupuncture for depression, chronic pain", "conditions": ["depression", "chronic pain", "pain-depression comorbidity"], "fda_status": "none", "evidence_level": "clinical_pilot"},
            "governance": {"consent_tier": "standard", "data_classification": "non_sensitive", "safety_ceiling": "Regulatory gap: EA needles not FDA pre-market approved for every use"}
        },
        "sources": ["Lin 2017 PMID:28672900 PMC5488474", "Zhao 2019 PMID:31929820 PMC6942800"]
    },
    {
        "id": "QIF-T0157", "attack": "Acute tryptophan depletion — serotonin precursor starvation via LAT1 competition",
        "tactic": "QIF-C.EX", "bands": "N4-N7", "band_ids": ["N4", "N5", "N6", "N7"],
        "status": "CONFIRMED", "severity": "medium", "ui_category": "EX",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "EMO", "tara_domain_secondary": ["COG"], "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "65g large neutral amino acid mixture (excluding tryptophan) floods LAT1 BBB transporter -> tryptophan uptake reduced 80-90% within 5-6hrs -> TPH2 substrate starvation -> central 5-HT synthesis crashes. Effects: impaired reward learning, reduced happy face recognition. Resolves in 24hrs. EPISTEMIC FLAG: direct evidence that ATD reduces extracellular 5-HT is inconsistent (Bell 2001, PMID:21339754). First purely metabolic/dietary TARA technique — no device required. Tryptophan competes with tyrosine at LAT1: asymmetric damage to 5-HT vs DA.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "ATD challenge paradigm for depression vulnerability research", "conditions": ["depression vulnerability testing"], "fda_status": "none", "evidence_level": "clinical_validated"},
            "governance": {"consent_tier": "IRB", "data_classification": "non_sensitive", "safety_ceiling": "Reversible within 24hrs; requires food supply access"}
        },
        "sources": ["Booij 2003 PMC3756112", "Bell 2001 PMID:21339754"]
    },

    # === GLUTAMATE (4 techniques) ===
    {
        "id": "QIF-T0158", "attack": "Silent excitatory/inhibitory ratio manipulation (sub-threshold seizure priming)",
        "tactic": "QIF-P.DS", "bands": "I0-N2", "band_ids": ["I0", "N1", "N2"],
        "status": "THEORETICAL", "severity": "high", "ui_category": "DS",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "AUT", "tara_domain_secondary": ["COG", "MOT"], "tara_mode": "M",
        "physics_feasibility": {"tier": 3, "tier_label": "far_term"},
        "tara": {
            "mechanism": "Sub-threshold anodal tDCS (1-2mA, repeated sessions over weeks) drives polarity-dependent shift: GABA down 10-30%, Glu up (dose-dependent). Net: progressive seizure threshold reduction without acute clinical presentation. Attack completed by separate trigger event. Distinct from T0122 (kindling: implanted electrodes, amygdala) and T0026/T0029 (acute superthreshold). Operates sub-threshold, non-invasive, preparatory not direct.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "tDCS research (same parameters, different intent)", "conditions": ["research tool"], "fda_status": "investigational", "evidence_level": "theoretical"},
            "governance": {"consent_tier": "enhanced", "data_classification": "sensitive_neural", "safety_ceiling": "1-2mA repeated; biomarker: Glu/GABA ratio shift measurable by 7T MRS"}
        },
        "sources": ["Cassidy 2020 DOI:10.1038/s41598-020-77111-0", "Nitsche 2003 PMC2343495"]
    },
    {
        "id": "QIF-T0159", "attack": "LIFU astrocytic gliotransmission (acoustic TRPA1->extrasynaptic NMDA)",
        "tactic": "QIF-N.MD", "bands": "I0-N2", "band_ids": ["I0", "N1", "N2"],
        "status": "EMERGING", "severity": "high", "ui_category": "DM",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "COG", "tara_domain_secondary": ["MEM"], "tara_mode": "M",
        "physics_feasibility": {"tier": 2, "tier_label": "mid_term"},
        "tara": {
            "mechanism": "Pulsed LIFU (0.5MHz, <10% duty cycle) activates astrocytic TRPA1 mechanosensitive channels -> Ca2+ influx -> Best1-mediated glutamate release (gliotransmission) -> extrasynaptic NR2B-enriched NMDA receptors -> neuronal depolarization. Distinct: (1) acoustic not EM, (2) astrocyte-first not neuron-first, (3) gliotransmission not synaptic vesicle, (4) extrasynaptic NMDA pool pharmacologically distinct from synaptic. Confirmed: Gu & Han 2019, Current Biology.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "tFUS for depression, OCD, essential tremor", "conditions": ["depression", "OCD", "essential tremor"], "fda_status": "investigational", "evidence_level": "preclinical"},
            "governance": {"consent_tier": "enhanced", "data_classification": "sensitive_neural", "safety_ceiling": "ISPTA <720 mW/cm2; penetration up to 7cm transcranially"}
        },
        "sources": ["Gu & Han 2019 Current Biology DOI:10.1016/j.cub.2019.08.058 PMID:31543454", "Deffieux 2023 Neuron DOI:10.1016/j.neuron.2023.02.002"]
    },
    {
        "id": "QIF-T0160", "attack": "FUS-BBB breach as excitotoxic glutamate priming vector",
        "tactic": "QIF-P.DS", "bands": "I0-N3", "band_ids": ["I0", "N1", "N2", "N3"],
        "status": "THEORETICAL", "severity": "critical", "ui_category": "DS",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "AUT", "tara_domain_secondary": ["COG", "SOM"], "tara_mode": "D",
        "physics_feasibility": {"tier": 3, "tier_label": "far_term"},
        "tara": {
            "mechanism": "High-intensity FUS + IV microbubbles -> acoustic cavitation -> BBB tight junction breach (24-48hr opening) -> perivascular ionic disequilibrium -> EAAT2 transport impaired -> extracellular glutamate elevated -> NMDA overactivation -> excitotoxic Ca2+ overload -> perilesional neuron death. EPISTEMIC FLAG: direct FUS-BBB->glutamate surge link is INFERRED from ischemia literature, not directly demonstrated in FUS-BBB studies. Attack surface: adversarial modification of therapeutic FUS parameters in clinical setting.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "FUS-BBB opening for Alzheimer's drug delivery, glioblastoma", "conditions": ["Alzheimer's disease", "glioblastoma"], "fda_status": "investigational", "evidence_level": "theoretical"},
            "governance": {"consent_tier": "IRB", "data_classification": "PHI", "safety_ceiling": "Requires medical FUS system + IV access; clinical workflow is the attack surface"}
        },
        "sources": ["Lipsman 2018 Nature Communications (FUS-BBB Alzheimer's)", "Timbie 2024 Neurotherapeutics DOI:10.1016/j.neurot.2024.e00038"]
    },
    {
        "id": "QIF-T0161", "attack": "Cortical spreading depression initiation (autonomous glutamate wave)",
        "tactic": "QIF-P.DS", "bands": "I0-N3", "band_ids": ["I0", "N1", "N2", "N3"],
        "status": "EMERGING", "severity": "critical", "ui_category": "DS",
        "classical": "Yes", "quantum": "No",
        "tara_domain_primary": "AUT", "tara_domain_secondary": ["COG", "SOM", "VIS"], "tara_mode": "D",
        "physics_feasibility": {"tier": 2, "tier_label": "mid_term"},
        "tara": {
            "mechanism": "Brief suprathreshold focal stimulation raises local [K+]ext past CSD ignition threshold (~12mM). CaV-dependent NMDA activation required for ignition. Once ignited: SELF-PROPAGATING K+/glutamate positive feedback wave at 2-5mm/min across cortex. Attacker delivers brief burst and withdraws; CSD continues autonomously 1-5min. Aftermath: 5-15min cortical silence (spreading depression). ECT reliably generates postictal CSD in mice AND humans (Lehmkuhl 2025, Nature Communications). Distinct from T0026/T0029: self-propagating after trigger withdrawal.",
            "dual_use": "confirmed",
            "clinical": {"therapeutic_analog": "CSD as migraine intervention target; ECT therapeutic mechanism", "conditions": ["migraine", "ECT mechanism research"], "fda_status": "none", "evidence_level": "preclinical_strong"},
            "governance": {"consent_tier": "IRB", "data_classification": "PHI", "safety_ceiling": "Susceptibility elevated in migraine patients, TBI, cortical hyperexcitability"}
        },
        "sources": ["Lehmkuhl 2025 Nature Communications DOI:10.1038/s41467-025-59900-1", "Enger 2023 PMC10408042"]
    },
]

# Enrichments to existing techniques (domain_secondary additions)
ENRICHMENTS = {
    "QIF-T0136": {
        "add_domain_secondary": ["SER", "COG"],  # serotonin + ACh via same CCO mechanism
        "add_sources": ["Mohammed 2023 DOI:10.1007/s43630-023-00497-z (5-HT + NE restoration via CCO)"]
    },
    "QIF-T0009": {
        "add_sources": ["Indirect corticothalamic-raphe 5-HT pathway (rTMS DLPFC -> DRN serotonin)"]
    }
}


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_pre(registrar: dict) -> dict:
    techs = registrar["techniques"]
    snapshot = {
        "count": len(techs),
        "ids": sorted([t["id"] for t in techs]),
        "hash": hashlib.sha256(json.dumps(registrar, sort_keys=True).encode()).hexdigest(),
    }
    print(f"  PRE: {snapshot['count']} techniques")
    return snapshot


def validate_post(registrar: dict, pre: dict) -> bool:
    techs = registrar["techniques"]
    ok = True
    expected = pre["count"] + len(NEW_TECHNIQUES)
    if len(techs) != expected:
        print(f"  FAIL: Expected {expected}, got {len(techs)}")
        ok = False
    else:
        print(f"  PASS: Technique count {len(techs)}")

    ids = [t["id"] for t in techs]
    dupes = [i for i, c in Counter(ids).items() if c > 1]
    if dupes:
        print(f"  FAIL: Duplicate IDs: {dupes}")
        ok = False
    else:
        print(f"  PASS: No duplicate IDs")

    aliases = [t.get("tara_alias") for t in techs if t.get("tara_alias")]
    alias_dupes = [a for a, c in Counter(aliases).items() if c > 1]
    if alias_dupes:
        print(f"  FAIL: Duplicate aliases: {alias_dupes}")
        ok = False
    else:
        print(f"  PASS: No duplicate aliases ({len(aliases)} unique)")

    removed = set(pre["ids"]) - set(ids)
    if removed:
        print(f"  FAIL: IDs removed: {removed}")
        ok = False
    else:
        print(f"  PASS: All original IDs preserved")

    stats = registrar.get("statistics", {})
    if stats.get("total_techniques") == len(techs):
        print(f"  PASS: statistics.total_techniques = {len(techs)}")
    else:
        print(f"  WARN: statistics mismatch")

    return ok


def run(dry_run=False):
    print(f"{'DRY RUN' if dry_run else 'LIVE'}: Receptor Expansion — 20 New Techniques")
    print()

    with open(REGISTRAR_PATH) as f:
        registrar = json.load(f)

    print("=== PRE-FLIGHT ===")
    pre = validate_pre(registrar)
    orig_hash = file_hash(REGISTRAR_PATH)
    print()

    reg = copy.deepcopy(registrar)

    # Compute domain-mode counters from current state
    dm_counts = Counter()
    for t in reg["techniques"]:
        alias = t.get("tara_alias", "")
        if alias and alias.startswith("TARA-"):
            parts = alias.split("-")
            if len(parts) >= 4:
                try:
                    dm_counts[f"{parts[1]}-{parts[2]}"] = max(dm_counts[f"{parts[1]}-{parts[2]}"], int(parts[3]))
                except ValueError:
                    pass

    # Add 20 new techniques with dynamically computed aliases
    print("=== ADDING 20 NEW TECHNIQUES ===")
    existing_ids = {t["id"] for t in reg["techniques"]}
    added = 0
    for tech in NEW_TECHNIQUES:
        if tech["id"] in existing_ids:
            print(f"  SKIP {tech['id']}: exists")
            continue
        domain = tech.get("tara_domain_primary", "")
        mode = tech.get("tara_mode", "")
        if domain and mode:
            key = f"{domain}-{mode}"
            dm_counts[key] += 1
            tech["tara_alias"] = f"TARA-{key}-{dm_counts[key]:03d}"
        reg["techniques"].append(tech)
        added += 1
        print(f"  + {tech['id']}: {tech['attack'][:60]}... -> {tech.get('tara_alias', 'N/A')}")
    print(f"  Added {added} techniques")
    print()

    # Enrich existing entries
    print("=== ENRICHING EXISTING ENTRIES ===")
    for tech in reg["techniques"]:
        tid = tech["id"]
        if tid in ENRICHMENTS:
            enr = ENRICHMENTS[tid]
            if "add_domain_secondary" in enr:
                existing = tech.get("tara_domain_secondary", []) or []
                for d in enr["add_domain_secondary"]:
                    if d not in existing:
                        existing.append(d)
                        print(f"  {tid}: added domain_secondary '{d}'")
                tech["tara_domain_secondary"] = existing
            if "add_sources" in enr:
                existing_src = tech.get("sources", []) or []
                for s in enr["add_sources"]:
                    if s not in existing_src:
                        existing_src.append(s)
                tech["sources"] = existing_src
                print(f"  {tid}: added {len(enr['add_sources'])} source(s)")
    print()

    # Update statistics
    print("=== UPDATE STATISTICS ===")
    stats = reg.get("statistics", {})
    stats["total_techniques"] = len(reg["techniques"])
    reg["statistics"] = stats
    print(f"  total_techniques = {stats['total_techniques']}")
    print()

    # Post-flight
    print("=== POST-FLIGHT ===")
    ok = validate_post(reg, pre)

    if dry_run:
        print("\nDRY RUN complete. No files modified.")
        return ok

    if not ok:
        print("\nVALIDATION FAILED. Aborting.")
        return False

    print("\n=== WRITING ===")
    shutil.copy2(REGISTRAR_PATH, BACKUP_PATH)
    print(f"  Backup: {BACKUP_PATH}")
    with open(REGISTRAR_PATH, "w") as f:
        json.dump(reg, f, indent=2, ensure_ascii=False)
    new_hash = file_hash(REGISTRAR_PATH)
    print(f"  Written. Hash: {new_hash[:16]}... (was {orig_hash[:16]}...)")

    # Verify re-read
    with open(REGISTRAR_PATH) as f:
        verify = json.load(f)
    if len(verify["techniques"]) == len(reg["techniques"]):
        print(f"  PASS: Re-read verification ({len(verify['techniques'])} techniques)")
    else:
        print(f"  FAIL: Re-read mismatch")
        return False

    print("\nDone. Run: npm run prebuild && npm run health && npm run build")
    return True


if __name__ == "__main__":
    success = run("--dry-run" in sys.argv)
    sys.exit(0 if success else 1)
