#!/usr/bin/env python3
"""
Enrich Skeleton TARA Techniques
Populates the ~32 skeleton techniques (tara_enrichment_pending: true) with full
TARA clinical/governance/engineering data, DSM-5-TR mappings, and NISS scoring.

Run:
  python3 shared/scripts/enrich-skeletons.py --dry-run   # preview
  python3 shared/scripts/enrich-skeletons.py             # apply
"""

import json
import sys
import copy
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "qtara-registrar.json"

# ═══════════════════════════════════════════════════════════════════
# Governance Templates (matching populate-tara.py patterns)
# ═══════════════════════════════════════════════════════════════════

GOV_STIM = {
    "consent_tier": "enhanced",
    "monitoring": ["impedance", "stimulation_waveform", "tissue_temperature", "patient_response"],
    "regulations": ["FDA 510(k)/PMA", "IEC 60601-1", "ISO 80601-2-10", "21 CFR 882"],
    "data_classification": "PHI",
    "safety_ceiling": None
}

GOV_RECORDING = {
    "consent_tier": "enhanced",
    "monitoring": ["signal_quality", "data_encryption_status", "access_audit_log"],
    "regulations": ["HIPAA", "GDPR Art. 9", "21 CFR Part 11", "IEC 62304"],
    "data_classification": "sensitive_neural",
    "safety_ceiling": None
}

GOV_SILICON = {
    "consent_tier": "standard",
    "monitoring": ["firmware_integrity", "access_logging", "network_traffic"],
    "regulations": ["FDA 21 CFR 820", "IEC 62443", "NIST CSF"],
    "data_classification": "restricted",
    "safety_ceiling": None
}

GOV_COGNITIVE = {
    "consent_tier": "IRB",
    "monitoring": ["cognitive_assessment", "behavioral_tracking", "informed_consent_renewal"],
    "regulations": ["HIPAA", "GDPR Art. 9", "Common Rule (45 CFR 46)", "proposed neurorights legislation"],
    "data_classification": "sensitive_neural",
    "safety_ceiling": None
}

GOV_PROHIBITED = {
    "consent_tier": "prohibited",
    "monitoring": ["detection_only"],
    "regulations": ["Geneva Convention (if weaponized)", "proposed neurorights legislation"],
    "data_classification": "sensitive_neural",
    "safety_ceiling": None
}


def gov(template, **overrides):
    """Create governance dict from template with overrides."""
    g = copy.deepcopy(template)
    for k, v in overrides.items():
        g[k] = v
    return g


# ═══════════════════════════════════════════════════════════════════
# NISS Scoring Helper
# ═══════════════════════════════════════════════════════════════════

def compute_niss(amplitude, frequency, duration, reversibility, detectability, coverage):
    """Weighted composite: A*0.25 + F*0.20 + D*0.20 + R*0.15 + Det*0.10 + C*0.10"""
    score = (amplitude * 0.25 + frequency * 0.20 + duration * 0.20 +
             reversibility * 0.15 + detectability * 0.10 + coverage * 0.10)
    return round(score, 1)


def niss_obj(amplitude, frequency, duration, reversibility, detectability, coverage):
    score = compute_niss(amplitude, frequency, duration, reversibility, detectability, coverage)
    return {
        "amplitude": amplitude,
        "frequency": frequency,
        "duration": duration,
        "reversibility": reversibility,
        "detectability": detectability,
        "coverage": coverage,
        "score": score
    }


# ═══════════════════════════════════════════════════════════════════
# Per-Technique Enrichment Data
# ═══════════════════════════════════════════════════════════════════

ENRICHMENTS = {
    # ─── Network/Protocol Attacks (T0104-T0109): no biological domain ───

    "QIF-T0104": {
        "tara": {
            "mechanism": "Forging neural identity signatures to impersonate a legitimate BCI node or user, analogous to IP/ARP spoofing in network security",
            "dual_use": "silicon_only",
            "clinical": None,
            "governance": gov(GOV_SILICON,
                safety_ceiling="Mutual authentication required; cryptographic identity binding at BCI transport layer"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"protocol_layer": "transport/identity", "latency_impact_ms": "variable"},
                "hardware": ["BCI_transceiver", "protocol_analyzer", "signal_generator"],
                "detection": "Cryptographic identity verification, behavioral biometric consistency, timing analysis"
            },
            "dsm5": {
                "primary": [],
                "secondary": [],
                "risk_class": "none",
                "cluster": "non_diagnostic",
                "pathway": "S-domain only — BCI protocol spoofing, no direct neural pathway",
                "niss_correlation": "Silicon-only technique — no diagnostic mapping"
            }
        },
        "niss_enriched": niss_obj(2.0, 3.0, 2.0, 8.0, 4.0, 3.0),
        "physics_feasibility": {
            "tier": "no_physics_gate",
            "tier_label": "no_physics_gate",
            "timeline": "now",
            "gate_reason": "Software/protocol attack — physics does not constrain",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MP", "CL", "MI"], "cci": 0.36}
    },

    "QIF-T0105": {
        "tara": {
            "mechanism": "Creating multiple fake BCI node identities to subvert reputation or consensus mechanisms in distributed neural networks",
            "dual_use": "silicon_only",
            "clinical": None,
            "governance": gov(GOV_SILICON,
                safety_ceiling="Node identity verification; proof-of-work/proof-of-stake for BCI network membership"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"protocol_layer": "network/identity", "sybil_count": "variable"},
                "hardware": ["BCI_transceiver_array", "identity_generator", "network_interface"],
                "detection": "Network topology analysis, identity correlation, behavioral fingerprinting"
            },
            "dsm5": {
                "primary": [],
                "secondary": [],
                "risk_class": "none",
                "cluster": "non_diagnostic",
                "pathway": "S-domain only — distributed BCI network attack",
                "niss_correlation": "Silicon-only technique — no diagnostic mapping"
            }
        },
        "niss_enriched": niss_obj(1.5, 2.5, 2.0, 8.5, 3.5, 4.0),
        "physics_feasibility": {
            "tier": "no_physics_gate",
            "tier_label": "no_physics_gate",
            "timeline": "now",
            "gate_reason": "Software/network attack — physics does not constrain",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MP", "CL", "MI"], "cci": 0.36}
    },

    "QIF-T0106": {
        "tara": {
            "mechanism": "Attracting and absorbing BCI network traffic by advertising false optimal routing, creating a data collection point analogous to network sinkhole attacks",
            "dual_use": "silicon_only",
            "clinical": None,
            "governance": gov(GOV_SILICON,
                safety_ceiling="End-to-end encryption; route attestation; multi-path verification"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"protocol_layer": "network/routing", "capture_radius": "variable"},
                "hardware": ["rogue_BCI_hub", "traffic_analyzer", "storage_system"],
                "detection": "Route path verification, latency anomaly detection, traffic volume analysis"
            },
            "dsm5": {
                "primary": [],
                "secondary": [],
                "risk_class": "none",
                "cluster": "non_diagnostic",
                "pathway": "S-domain only — BCI network routing attack",
                "niss_correlation": "Silicon-only technique — no diagnostic mapping"
            }
        },
        "niss_enriched": niss_obj(1.0, 2.0, 3.0, 9.0, 3.0, 5.0),
        "physics_feasibility": {
            "tier": "no_physics_gate",
            "tier_label": "no_physics_gate",
            "timeline": "now",
            "gate_reason": "Software/network attack — physics does not constrain",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MP"], "cci": 0.12}
    },

    "QIF-T0107": {
        "tara": {
            "mechanism": "Capturing and replaying BCI session nonces or authentication tokens to hijack or duplicate neural data sessions",
            "dual_use": "silicon_only",
            "clinical": None,
            "governance": gov(GOV_SILICON,
                safety_ceiling="Time-bound nonces; anti-replay counters; session binding to hardware attestation"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"protocol_layer": "session/authentication", "replay_window_ms": "variable"},
                "hardware": ["packet_sniffer", "replay_engine", "timing_analyzer"],
                "detection": "Sequence number validation, timestamp freshness checks, session binding verification"
            },
            "dsm5": {
                "primary": [],
                "secondary": [],
                "risk_class": "none",
                "cluster": "non_diagnostic",
                "pathway": "S-domain only — session authentication attack",
                "niss_correlation": "Silicon-only technique — no diagnostic mapping"
            }
        },
        "niss_enriched": niss_obj(1.5, 2.0, 2.5, 9.0, 4.0, 3.0),
        "physics_feasibility": {
            "tier": "no_physics_gate",
            "tier_label": "no_physics_gate",
            "timeline": "now",
            "gate_reason": "Software/protocol attack — physics does not constrain",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MP", "CL"], "cci": 0.24}
    },

    "QIF-T0108": {
        "tara": {
            "mechanism": "Tampering with synaptic weight parameters in neuromorphic computing hardware to alter neural network inference without modifying the training data or model architecture",
            "dual_use": "silicon_only",
            "clinical": None,
            "governance": gov(GOV_SILICON,
                safety_ceiling="Cryptographic weight attestation; runtime integrity monitoring; redundant inference paths"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "synaptic_weight_memory", "precision_bits": "8-32", "modification_scope": "targeted_weights"},
                "hardware": ["neuromorphic_chip", "debug_interface", "fault_injection_equipment"],
                "detection": "Weight checksum verification, inference output monitoring, behavioral regression testing"
            },
            "dsm5": {
                "primary": [],
                "secondary": [],
                "risk_class": "none",
                "cluster": "non_diagnostic",
                "pathway": "S-domain only — neuromorphic hardware tampering",
                "niss_correlation": "Silicon-only technique — no diagnostic mapping"
            }
        },
        "niss_enriched": niss_obj(3.0, 2.5, 4.0, 6.0, 3.0, 5.0),
        "physics_feasibility": {
            "tier": "near_term",
            "tier_label": "near_term",
            "timeline": "2026-2031",
            "gate_reason": "Neuromorphic chips exist (Intel Loihi, IBM TrueNorth) but BCI integration is emerging",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI"], "cci": 0.24}
    },

    "QIF-T0109": {
        "tara": {
            "mechanism": "Exploiting misalignment between neural data recording parameters and processing pipeline expectations to introduce systematic bias or silent data corruption",
            "dual_use": "silicon_only",
            "clinical": None,
            "governance": gov(GOV_SILICON,
                safety_ceiling="Data pipeline validation; schema enforcement; sampling rate verification at each stage"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "data_pipeline", "alignment_parameters": "sampling_rate/bit_depth/channel_mapping"},
                "hardware": ["data_acquisition_system", "processing_pipeline", "storage_backend"],
                "detection": "Cross-stage data validation, statistical anomaly detection, pipeline integrity checks"
            },
            "dsm5": {
                "primary": [],
                "secondary": [],
                "risk_class": "none",
                "cluster": "non_diagnostic",
                "pathway": "S-domain only — data pipeline manipulation",
                "niss_correlation": "Silicon-only technique — no diagnostic mapping"
            }
        },
        "niss_enriched": niss_obj(2.0, 3.0, 4.0, 7.0, 2.5, 4.0),
        "physics_feasibility": {
            "tier": "no_physics_gate",
            "tier_label": "no_physics_gate",
            "timeline": "now",
            "gate_reason": "Software/data pipeline attack — physics does not constrain",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MP", "MI"], "cci": 0.24}
    },

    # ─── Vestibular Domain (T0110-T0114) ───────────────────────────

    "QIF-T0110": {
        "tara": {
            "mechanism": "Passive recording and analysis of vestibular-evoked responses (VEMPs, caloric responses) to profile an individual's balance system characteristics and susceptibility",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Vestibular evoked myogenic potentials (VEMP) testing",
                "conditions": ["vestibular neuritis", "Meniere's disease", "superior canal dehiscence", "benign paroxysmal positional vertigo"],
                "fda_status": "cleared",
                "evidence_level": "RCT",
                "safe_parameters": "Standard audiometric stimulus levels; air-conducted 500 Hz tone bursts at 95-100 dB nHL",
                "sources": ["Rosengren et al. 2010 (Clin Neurophysiol)", "Curthoys 2010 (Semin Neurol)"]
            },
            "governance": gov(GOV_RECORDING,
                safety_ceiling="Passive vestibular assessment; standard audiometric safety limits apply"),
            "engineering": {
                "coupling": ["acoustic", "electromagnetic"],
                "parameters": {"frequency_hz": "500", "amplitude_dB_nHL": "95-100", "recording_channels": "cervical/ocular EMG"},
                "hardware": ["acoustic_transducer", "EMG_electrodes", "vestibular_amplifier"],
                "detection": "Response latency analysis, amplitude ratio monitoring, habituation pattern tracking"
            },
            "dsm5": {
                "primary": [],
                "secondary": [
                    {"code": "F45.8", "name": "Other Somatoform Disorders", "confidence": "probable"}
                ],
                "risk_class": "indirect",
                "cluster": "non_diagnostic",
                "pathway": "I0 (vestibular organ) → N1 (vestibular nerve) — profiling only, no direct disruption",
                "niss_correlation": "Reconnaissance technique — low direct clinical risk"
            }
        },
        "niss_enriched": niss_obj(1.0, 2.0, 1.0, 9.0, 2.0, 2.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "VEMP testing equipment commercially available",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MP"], "cci": 0.1}
    },

    "QIF-T0111": {
        "tara": {
            "mechanism": "Galvanic vestibular stimulation (GVS) delivering subthreshold or suprathreshold current to mastoid processes to induce illusory motion perception or postural sway",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Galvanic vestibular stimulation (GVS) therapy",
                "conditions": ["bilateral vestibular hypofunction", "Parkinson's gait freezing", "spatial neglect rehabilitation", "motion sickness desensitization"],
                "fda_status": "investigational",
                "evidence_level": "RCT",
                "safe_parameters": "0.5-2.0 mA, bipolar mastoid placement, 10-30 min sessions, sinusoidal or noisy waveform",
                "sources": ["Fitzpatrick & Day 2004 (J Appl Physiol)", "Wuehr et al. 2017 (Front Neurol)"]
            },
            "governance": gov(GOV_STIM,
                safety_ceiling="2 mA maximum; continuous postural monitoring; fall prevention required; session limit 30 min"),
            "engineering": {
                "coupling": ["galvanic"],
                "parameters": {"amplitude_mA": "0.5-2.0", "waveform": "sinusoidal/noisy/DC", "duration_min": "10-30", "electrode_placement": "bilateral_mastoid"},
                "hardware": ["constant_current_stimulator", "mastoid_electrodes", "posturography_platform", "safety_harness"],
                "detection": "Current amplitude monitoring, postural sway tracking, patient-reported vertigo assessment"
            },
            "dsm5": {
                "primary": [
                    {"code": "H81.3", "name": "Other peripheral vertigo", "confidence": "established"},
                    {"code": "R42", "name": "Dizziness and giddiness", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F41.0", "name": "Panic Disorder", "confidence": "probable"},
                    {"code": "F40.01", "name": "Agoraphobia", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "motor_neurocognitive",
                "pathway": "I0 (mastoid electrodes) → N1 (vestibular nerve) → N3 (vestibular nuclei) → N4 (cortical integration)",
                "niss_correlation": "Vestibular manipulation — motor/balance disruption cluster"
            }
        },
        "niss_enriched": niss_obj(5.0, 4.0, 4.0, 7.0, 5.0, 4.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "GVS devices commercially available; established research tool",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "DI"], "cci": 0.6}
    },

    "QIF-T0112": {
        "tara": {
            "mechanism": "Disrupting the vestibular-ocular reflex (VOR) arc via targeted vestibular stimulation to cause nystagmus, oscillopsia, or gaze instability",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "VOR rehabilitation / caloric testing",
                "conditions": ["vestibular hypofunction", "bilateral vestibulopathy", "oscillopsia", "post-surgical vestibular adaptation"],
                "fda_status": "cleared",
                "evidence_level": "meta_analysis",
                "safe_parameters": "Caloric: 30°C/44°C irrigation; VOR rehab: progressive gaze stabilization exercises",
                "sources": ["Herdman et al. 2007 (JOSPT)", "Halmagyi et al. 2017 (J Neurol)"]
            },
            "governance": gov(GOV_STIM,
                safety_ceiling="Standard caloric test parameters; continuous nystagmus monitoring; anti-emetic available"),
            "engineering": {
                "coupling": ["galvanic", "acoustic"],
                "parameters": {"caloric_temp_C": "30/44", "GVS_mA": "0.5-1.5", "target_reflex": "VOR_arc"},
                "hardware": ["caloric_irrigator", "videonystagmography", "GVS_stimulator", "eye_tracker"],
                "detection": "VOR gain monitoring, nystagmus pattern analysis, compensatory saccade detection"
            },
            "dsm5": {
                "primary": [
                    {"code": "H81.3", "name": "Other peripheral vertigo", "confidence": "established"},
                    {"code": "H55", "name": "Nystagmus and other irregular eye movements", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F41.1", "name": "Generalized Anxiety Disorder", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "motor_neurocognitive",
                "pathway": "I0 (vestibular organ) → N1 (vestibular nerve) → N3 (vestibular nuclei) → N2 (oculomotor nuclei) → VOR arc",
                "niss_correlation": "VOR disruption — visual-motor coordination cluster"
            }
        },
        "niss_enriched": niss_obj(5.5, 4.5, 3.5, 7.5, 5.0, 3.5),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Caloric testing and VOR assessment equipment standard in vestibular clinics",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "DI"], "cci": 0.6}
    },

    "QIF-T0113": {
        "tara": {
            "mechanism": "Exploiting the shared innervation of cochlear and vestibular branches of CN VIII to induce vestibular side-effects through auditory stimulation (Tullio phenomenon) or vice versa",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Bone-conducted vibration vestibular rehabilitation",
                "conditions": ["superior semicircular canal dehiscence", "Tullio phenomenon", "perilymphatic fistula"],
                "fda_status": "cleared",
                "evidence_level": "cohort",
                "safe_parameters": "Bone-conducted vibration: 500 Hz, <95 dB nHL; air-conducted: standard audiometric limits",
                "sources": ["Minor et al. 1998 (Arch Otolaryngol)", "Watson et al. 2000 (J Laryngol Otol)"]
            },
            "governance": gov(GOV_STIM,
                safety_ceiling="Audiometric safety limits; continuous vestibular symptom monitoring; immediate cessation protocol"),
            "engineering": {
                "coupling": ["acoustic"],
                "parameters": {"frequency_hz": "500-2000", "amplitude_dB": "<95 nHL", "transduction": "bone_or_air_conducted"},
                "hardware": ["audiometric_transducer", "bone_vibrator", "tympanometer", "EMG_VEMP_recorder"],
                "detection": "Threshold monitoring, vestibular symptom questionnaire, VEMP amplitude tracking"
            },
            "dsm5": {
                "primary": [
                    {"code": "H81.3", "name": "Other peripheral vertigo", "confidence": "established"},
                    {"code": "H93.1", "name": "Tinnitus", "confidence": "probable"}
                ],
                "secondary": [
                    {"code": "F41.0", "name": "Panic Disorder", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "motor_neurocognitive",
                "pathway": "I0 (cochlea/vestibule) → N1 (CN VIII shared innervation) → N3 (vestibular/cochlear nuclei) — crosstalk pathway",
                "niss_correlation": "Cochlear-vestibular crosstalk — auditory-balance disruption cluster"
            }
        },
        "niss_enriched": niss_obj(4.5, 4.0, 3.0, 7.5, 4.5, 3.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Auditory stimulation equipment and VEMP testing commercially available",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI"], "cci": 0.36}
    },

    "QIF-T0114": {
        "tara": {
            "mechanism": "Overwhelming the vestibular system via sustained high-intensity stimulation to cause acute vertigo, nausea, spatial disorientation, and postural collapse",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Canalith repositioning (Epley maneuver) / vestibular habituation therapy",
                "conditions": ["BPPV", "chronic subjective dizziness", "vestibular migraine", "mal de debarquement"],
                "fda_status": "cleared",
                "evidence_level": "meta_analysis",
                "safe_parameters": "Epley: single head repositioning sequence; habituation: graded exposure within tolerance",
                "sources": ["Hilton & Pinder 2014 (Cochrane Review)", "Bronstein & Lempert 2013 (Practical Neurology)"]
            },
            "governance": gov(GOV_PROHIBITED,
                safety_ceiling="Overload stimulation exceeds therapeutic parameters — defensive detection only; therapeutic equivalent uses controlled sub-threshold exposure"),
            "engineering": {
                "coupling": ["galvanic", "acoustic", "mechanical"],
                "parameters": {"GVS_mA": ">3.0 (suprathreshold)", "caloric_deviation_C": ">15 from body temp", "rotational_deg_s2": ">100"},
                "hardware": ["high_current_GVS", "caloric_system", "rotary_chair", "posturography"],
                "detection": "Vestibular threshold monitoring, postural sway limits, patient distress indicators"
            },
            "dsm5": {
                "primary": [
                    {"code": "H81.0", "name": "Meniere's disease (iatrogenic analog)", "confidence": "established"},
                    {"code": "R42", "name": "Dizziness and giddiness", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F41.0", "name": "Panic Disorder", "confidence": "established"},
                    {"code": "F43.0", "name": "Acute Stress Reaction", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "motor_neurocognitive",
                "pathway": "I0 (vestibular organ) → N1 (vestibular nerve) → N3 (vestibular nuclei) → N4-N5 (cortical integration) — system overload",
                "niss_correlation": "Vestibular overload — acute disorientation and trauma cluster"
            }
        },
        "niss_enriched": niss_obj(7.0, 6.0, 5.0, 5.0, 6.0, 5.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "GVS and caloric stimulation equipment available; overload parameters achievable with standard hardware",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "DI", "PC"], "cci": 1.2}
    },

    # ─── Slow-Drift / Cumulative Techniques (T0115-T0123) ─────────

    "QIF-T0115": {
        "tara": {
            "mechanism": "Chronic subthreshold stimulation causing gradual shift in neural tissue excitability thresholds through long-term potentiation or depression of synaptic efficacy",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Transcranial direct current stimulation (tDCS) long-term protocols",
                "conditions": ["chronic pain", "fibromyalgia", "stroke motor recovery", "cognitive enhancement research"],
                "fda_status": "investigational",
                "evidence_level": "RCT",
                "safe_parameters": "1-2 mA, 20 min/session, minimum 24h between sessions, cumulative dose tracking",
                "sources": ["Bikson et al. 2016 (Brain Stimul)", "Nitsche & Paulus 2011 (J Physiol)"]
            },
            "governance": gov(GOV_COGNITIVE,
                safety_ceiling="Cumulative dose tracking mandatory; cortical excitability monitoring between sessions; 72h washout if threshold shift detected"),
            "engineering": {
                "coupling": ["galvanic"],
                "parameters": {"amplitude_mA": "0.5-2.0", "session_duration_min": "20", "cumulative_sessions": "10-30", "inter_session_interval_h": ">=24"},
                "hardware": ["tDCS_device", "EEG_monitoring", "cortical_excitability_probe", "dose_tracker"],
                "detection": "Longitudinal TMS-evoked potential monitoring, resting motor threshold tracking, EEG spectral shift analysis"
            },
            "dsm5": {
                "primary": [
                    {"code": "G40", "name": "Epilepsy (seizure threshold lowering)", "confidence": "probable"},
                    {"code": "F45", "name": "Somatoform disorders", "confidence": "probable"}
                ],
                "secondary": [
                    {"code": "F41.1", "name": "Generalized Anxiety Disorder", "confidence": "probable"},
                    {"code": "G43", "name": "Migraine", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "motor_neurocognitive",
                "pathway": "I0 (electrodes) → N1-N2 (cortical tissue) → cumulative excitability shift → seizure threshold change",
                "niss_correlation": "Chronic stimulation — cumulative neuroplasticity disruption"
            }
        },
        "niss_enriched": niss_obj(4.0, 3.5, 7.0, 4.0, 3.0, 5.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "tDCS devices commercially available; cumulative effects documented in literature",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MI", "DI", "PC"], "cci": 0.72}
    },

    "QIF-T0116": {
        "tara": {
            "mechanism": "Systematic reduction of dopaminergic reward circuit sensitivity through repeated supraphysiological stimulation, causing anhedonia and motivational deficit",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Deep brain stimulation of nucleus accumbens / ventral capsule",
                "conditions": ["treatment-resistant depression", "OCD", "addiction (research)", "anorexia nervosa (research)"],
                "fda_status": "investigational",
                "evidence_level": "cohort",
                "safe_parameters": "Nucleus accumbens DBS: 130 Hz, 1-5V, 60-90 μs pulse width, psychiatric monitoring mandatory",
                "sources": ["Bewernick et al. 2010 (Biol Psychiatry)", "Denys et al. 2020 (Nature Medicine)"]
            },
            "governance": gov(GOV_COGNITIVE,
                consent_tier="IRB",
                safety_ceiling="Reward circuit stimulation requires psychiatric co-monitoring; hedonic tone assessment at each session; immediate cessation protocol"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"frequency_hz": "130", "amplitude_V": "1-5", "pulse_width_us": "60-90", "target": "nucleus_accumbens/VTA"},
                "hardware": ["DBS_electrode", "IPG_programmer", "psychiatric_assessment_tools", "fMRI_verification"],
                "detection": "Anhedonia screening (SHAPS), reward task performance, dopamine metabolite tracking"
            },
            "dsm5": {
                "primary": [
                    {"code": "F32.2", "name": "Major Depressive Episode, Severe (anhedonia subtype)", "confidence": "established"},
                    {"code": "F48.1", "name": "Depersonalization-Derealization Disorder", "confidence": "probable"}
                ],
                "secondary": [
                    {"code": "F10-F19", "name": "Substance Use Disorders (compensatory seeking)", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "mood_trauma",
                "pathway": "N3 (nucleus accumbens) → N4 (VTA-prefrontal circuit) → N5 (reward network) — progressive desensitization",
                "niss_correlation": "Reward pathway desensitization — mood/motivation disruption cluster"
            }
        },
        "niss_enriched": niss_obj(5.0, 4.5, 7.5, 3.5, 3.0, 4.5),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "DBS of reward circuits demonstrated in clinical trials",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "PC", "DI"], "cci": 1.2}
    },

    "QIF-T0117": {
        "tara": {
            "mechanism": "Targeted disruption of hippocampal sharp-wave ripple complexes during sleep to prevent memory consolidation without affecting other sleep functions",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Targeted memory reactivation (TMR) / sleep-dependent memory consolidation research",
                "conditions": ["PTSD (traumatic memory reconsolidation)", "phobias", "addiction cue extinction"],
                "fda_status": "investigational",
                "evidence_level": "cohort",
                "safe_parameters": "Auditory TMR: <60 dB during slow-wave sleep; closed-loop stimulation during specific sleep phases",
                "sources": ["Rasch et al. 2007 (Science)", "Ngo et al. 2013 (Neuron)"]
            },
            "governance": gov(GOV_COGNITIVE,
                consent_tier="IRB",
                safety_ceiling="Memory consolidation interference requires informed consent for cognitive impact; polysomnographic monitoring mandatory; morning memory assessment"),
            "engineering": {
                "coupling": ["acoustic", "electromagnetic"],
                "parameters": {"target": "hippocampal_SWR", "detection_method": "real-time_EEG", "disruption_timing_ms": "<50 post-ripple-onset"},
                "hardware": ["polysomnograph", "real_time_EEG_processor", "closed_loop_stimulator", "memory_assessment_suite"],
                "detection": "Sleep architecture analysis, morning declarative memory testing, hippocampal ripple rate monitoring"
            },
            "dsm5": {
                "primary": [
                    {"code": "F06.8", "name": "Other specified mental disorder due to known physiological condition (memory)", "confidence": "established"},
                    {"code": "R41.3", "name": "Other amnesia", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "G47.0", "name": "Insomnia", "confidence": "probable"},
                    {"code": "F41.1", "name": "Generalized Anxiety Disorder", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "cognitive_psychotic",
                "pathway": "N3 (hippocampus SWR) → N5 (hippocampal-cortical consolidation) → declarative memory systems",
                "niss_correlation": "Memory consolidation interference — cognitive/memory disruption cluster"
            }
        },
        "niss_enriched": niss_obj(4.5, 5.0, 7.0, 4.0, 2.5, 4.0),
        "physics_feasibility": {
            "tier": 1,
            "tier_label": "near_term",
            "timeline": "2026-2031",
            "gate_reason": "Closed-loop sleep stimulation demonstrated in research; real-time ripple detection emerging",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MI", "PC", "CL"], "cci": 0.96}
    },

    "QIF-T0118": {
        "tara": {
            "mechanism": "Progressive degradation of speech motor control through chronic low-level disruption of Broca's area or corticobulbar pathways, causing cumulative articulatory imprecision",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "rTMS of Broca's area for post-stroke aphasia rehabilitation",
                "conditions": ["Broca's aphasia", "post-stroke speech recovery", "primary progressive aphasia"],
                "fda_status": "investigational",
                "evidence_level": "RCT",
                "safe_parameters": "1 Hz (inhibitory) or 10 Hz (excitatory) rTMS over Broca's area, 80-120% motor threshold, 1000-2000 pulses/session",
                "sources": ["Naeser et al. 2005 (Neuroimage)", "Turkeltaub et al. 2012 (Stroke)"]
            },
            "governance": gov(GOV_COGNITIVE,
                safety_ceiling="Speech intelligibility monitoring at each session; cumulative dose limit; neuropsychological speech assessment"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "Broca_area/corticobulbar_tract", "frequency_hz": "1-10 (rTMS)", "amplitude_pct_MT": "80-120", "cumulative_pulses": "tracking required"},
                "hardware": ["TMS_coil", "neuronavigation_system", "speech_assessment_software", "EMG_facial_muscles"],
                "detection": "Speech intelligibility scoring (UPDRS-speech), articulatory kinematic tracking, fMRI language lateralization"
            },
            "dsm5": {
                "primary": [
                    {"code": "F80.2", "name": "Expressive Language Disorder", "confidence": "established"},
                    {"code": "R47.0", "name": "Dysphasia and Aphasia", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F32.1", "name": "Major Depressive Episode, Moderate", "confidence": "probable"},
                    {"code": "F40.10", "name": "Social Phobia", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "cognitive_psychotic",
                "pathway": "N4 (Broca's area) → N2 (corticobulbar tract) → N1 (cranial motor nuclei) — progressive speech degradation",
                "niss_correlation": "Speech motor degradation — language/cognitive disruption cluster"
            }
        },
        "niss_enriched": niss_obj(4.0, 4.5, 7.5, 3.5, 3.0, 3.5),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "rTMS of Broca's area established in research and clinical practice",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "PC"], "cci": 0.72}
    },

    "QIF-T0119": {
        "tara": {
            "mechanism": "Gradual modulation of amygdala-prefrontal connectivity to shift emotional baseline toward persistent dysthymia or anxiety without acute detectable events",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Neurofeedback training for emotional regulation",
                "conditions": ["generalized anxiety disorder", "dysthymia", "emotional dysregulation in BPD", "PTSD"],
                "fda_status": "investigational",
                "evidence_level": "RCT",
                "safe_parameters": "Real-time fMRI neurofeedback: amygdala down-regulation training, 20-30 min sessions, 6-12 sessions",
                "sources": ["Young et al. 2017 (Am J Psychiatry)", "Nicholson et al. 2017 (NeuroImage)"]
            },
            "governance": gov(GOV_COGNITIVE,
                consent_tier="IRB",
                safety_ceiling="Longitudinal mood monitoring mandatory; psychiatric oversight; immediate intervention protocol for acute mood shifts"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "amygdala-PFC_connectivity", "modulation_method": "chronic_subthreshold_stimulation", "session_interval_days": "1-7"},
                "hardware": ["tDCS/tACS_device", "fMRI_scanner", "mood_tracking_app", "EEG_monitor"],
                "detection": "Longitudinal affect rating scales (PHQ-9, GAD-7), resting-state fMRI connectivity, EEG frontal alpha asymmetry"
            },
            "dsm5": {
                "primary": [
                    {"code": "F34.1", "name": "Persistent Depressive Disorder (Dysthymia)", "confidence": "established"},
                    {"code": "F41.1", "name": "Generalized Anxiety Disorder", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F32.0", "name": "Major Depressive Episode, Mild", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "mood_trauma",
                "pathway": "N4 (amygdala) → N5 (PFC connectivity) → N6 (default mode network) — slow emotional baseline drift",
                "niss_correlation": "Emotional baseline shift — mood/anxiety disruption cluster"
            }
        },
        "niss_enriched": niss_obj(3.5, 3.0, 8.0, 3.0, 2.0, 5.0),
        "physics_feasibility": {
            "tier": 1,
            "tier_label": "near_term",
            "timeline": "2026-2031",
            "gate_reason": "Real-time fMRI neurofeedback demonstrated; chronic subthreshold protocols emerging",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "PC", "DI"], "cci": 1.2}
    },

    "QIF-T0120": {
        "tara": {
            "mechanism": "Chronic micromotion of implanted electrodes causing progressive gliosis, impedance drift, and degradation of neural recording/stimulation fidelity, leading to gradual cognitive decline",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Chronic DBS electrode maintenance / impedance management",
                "conditions": ["DBS electrode revision", "chronic implant biocompatibility", "recording electrode longevity"],
                "fda_status": "approved",
                "evidence_level": "cohort",
                "safe_parameters": "Impedance monitoring <5% drift/month; electrode repositioning protocol; biocompatible coatings",
                "sources": ["Polikov et al. 2005 (J Neurosci Methods)", "Barrese et al. 2013 (J Neural Eng)"]
            },
            "governance": gov(GOV_COGNITIVE,
                consent_tier="IRB",
                safety_ceiling="Longitudinal impedance tracking; cognitive assessment battery; electrode replacement protocol when drift exceeds threshold"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"electrode_type": "penetrating/surface", "gliosis_onset_weeks": "2-6", "impedance_drift_pct_month": "variable"},
                "hardware": ["implanted_electrode_array", "impedance_spectroscopy", "cognitive_assessment_suite"],
                "detection": "Longitudinal impedance trending, signal-to-noise ratio monitoring, periodic neuropsychological testing"
            },
            "dsm5": {
                "primary": [
                    {"code": "F06.7", "name": "Mild Neurocognitive Disorder due to another medical condition", "confidence": "established"},
                    {"code": "R41.8", "name": "Other symptoms of cognitive functions and awareness", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F32.1", "name": "Major Depressive Episode, Moderate", "confidence": "probable"},
                    {"code": "F41.1", "name": "Generalized Anxiety Disorder", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "cognitive_psychotic",
                "pathway": "I0 (electrode-tissue interface) → gliosis → impedance change → recording degradation → cognitive function decline",
                "niss_correlation": "Chronic electrode micromotion — progressive cognitive decline cluster"
            }
        },
        "niss_enriched": niss_obj(3.5, 2.0, 8.5, 3.0, 2.0, 4.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Electrode micromotion and gliosis well-documented in chronic implant literature",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MI", "PC", "DI"], "cci": 0.72}
    },

    "QIF-T0121": {
        "tara": {
            "mechanism": "Targeted alteration of sleep stage architecture via closed-loop stimulation during specific sleep phases to disrupt restorative sleep without preventing sleep onset",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Closed-loop auditory stimulation for slow-wave sleep enhancement",
                "conditions": ["insomnia", "sleep-dependent memory consolidation disorders", "age-related sleep degradation", "PTSD nightmares"],
                "fda_status": "investigational",
                "evidence_level": "RCT",
                "safe_parameters": "Phase-locked auditory clicks at <60 dB during slow-wave up-states; 8h monitoring sessions",
                "sources": ["Ngo et al. 2013 (Neuron)", "Leminen et al. 2017 (Sci Rep)"]
            },
            "governance": gov(GOV_COGNITIVE,
                consent_tier="IRB",
                safety_ceiling="Full polysomnographic monitoring; daytime sleepiness assessment (Epworth); cognitive testing next morning; cumulative sleep debt tracking"),
            "engineering": {
                "coupling": ["acoustic", "electromagnetic"],
                "parameters": {"target_phase": "slow_wave_up-state", "stimulus_dB": "<60", "detection_latency_ms": "<100", "night_coverage_pct": "continuous"},
                "hardware": ["polysomnograph", "real_time_EEG_processor", "phase_locked_audio_system", "actigraphy"],
                "detection": "Sleep stage distribution analysis, slow-wave density tracking, next-day vigilance testing (PVT)"
            },
            "dsm5": {
                "primary": [
                    {"code": "G47.0", "name": "Insomnia", "confidence": "established"},
                    {"code": "G47.8", "name": "Other sleep disorders", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F32.0", "name": "Major Depressive Episode, Mild", "confidence": "probable"},
                    {"code": "R41.8", "name": "Other symptoms of cognitive functions and awareness", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "mood_trauma",
                "pathway": "N3 (thalamic sleep nuclei) → N5 (cortical slow-wave generators) → sleep architecture disruption → daytime cognitive/mood effects",
                "niss_correlation": "Sleep architecture manipulation — cognitive/mood degradation cluster"
            }
        },
        "niss_enriched": niss_obj(4.0, 5.0, 7.0, 4.5, 2.5, 5.5),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Closed-loop sleep stimulation demonstrated in multiple research labs",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MI", "PC", "DI", "CL"], "cci": 1.2}
    },

    "QIF-T0122": {
        "tara": {
            "mechanism": "Repeated low-intensity electrical stimulation (kindling paradigm) creating a self-sustaining epileptogenic focus that persists after stimulation cessation",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Kindling model in epilepsy research (preclinical)",
                "conditions": ["temporal lobe epilepsy (research model)", "seizure threshold testing"],
                "fda_status": "not_applicable",
                "evidence_level": "preclinical",
                "safe_parameters": "Animal research only; no human therapeutic application of kindling — represents a harm model",
                "sources": ["Goddard et al. 1969 (Exp Neurol)", "Morimoto et al. 2004 (Prog Neurobiol)"]
            },
            "governance": gov(GOV_PROHIBITED,
                safety_ceiling="Kindling is a harm model — no therapeutic application. Detection and prevention only. Any deliberate kindling in humans would constitute criminal assault"),
            "engineering": {
                "coupling": ["galvanic"],
                "parameters": {"amplitude_uA": "100-500 (subconvulsive)", "frequency_hz": "60", "daily_stimulations": "1-2", "duration_s": "1-2", "kindling_threshold_days": "10-30"},
                "hardware": ["implanted_depth_electrodes", "programmable_stimulator", "EEG_monitoring", "seizure_detection_system"],
                "detection": "Afterdischarge duration monitoring, EEG epileptiform spike detection, seizure threshold tracking"
            },
            "dsm5": {
                "primary": [
                    {"code": "G40.2", "name": "Localization-related (focal) symptomatic epilepsy", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F06.8", "name": "Other specified mental disorder due to known physiological condition", "confidence": "established"},
                    {"code": "F41.0", "name": "Panic Disorder", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "motor_neurocognitive",
                "pathway": "I0 (implanted electrodes) → N3 (amygdala/hippocampus) → kindling → self-sustaining epileptogenic focus",
                "niss_correlation": "Epileptogenic focus creation — irreversible neurological harm cluster"
            }
        },
        "niss_enriched": niss_obj(7.5, 6.0, 9.0, 1.5, 4.0, 6.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Kindling paradigm well-established in animal models; mechanism applies to any implanted BCI electrode",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MI", "PC", "DI", "CL"], "cci": 2.0}
    },

    "QIF-T0123": {
        "tara": {
            "mechanism": "Chronic manipulation of motor cortex stimulation parameters causing maladaptive cortical reorganization of motor maps, leading to persistent motor control changes",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Motor cortex rTMS / tDCS for stroke rehabilitation",
                "conditions": ["post-stroke motor recovery", "cerebral palsy motor rehabilitation", "dystonia", "phantom limb pain"],
                "fda_status": "investigational",
                "evidence_level": "RCT",
                "safe_parameters": "10 Hz excitatory rTMS over ipsilesional M1, 80-120% MT, 1000-3000 pulses/session, 10-20 sessions",
                "sources": ["Lefaucheur et al. 2014 (Clin Neurophysiol)", "Hummel & Cohen 2006 (Stroke)"]
            },
            "governance": gov(GOV_COGNITIVE,
                consent_tier="IRB",
                safety_ceiling="Motor mapping assessment at each session; grip strength/dexterity monitoring; immediate cessation if motor deficit emerges"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "primary_motor_cortex", "frequency_hz": "1-20 (rTMS)", "amplitude_pct_MT": "80-120", "sessions": "10-20"},
                "hardware": ["TMS_coil", "neuronavigation", "motor_assessment_suite", "EMG_monitoring"],
                "detection": "Motor evoked potential (MEP) mapping, grip dynamometry, finger tapping speed, cortical motor map tracking"
            },
            "dsm5": {
                "primary": [
                    {"code": "F44.4", "name": "Conversion Disorder (Functional motor symptom)", "confidence": "established"},
                    {"code": "G25.8", "name": "Other specified extrapyramidal and movement disorders", "confidence": "probable"}
                ],
                "secondary": [
                    {"code": "F32.1", "name": "Major Depressive Episode, Moderate", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "motor_neurocognitive",
                "pathway": "N4 (motor cortex) → N2 (corticospinal tract) → N1 (motor neurons) — chronic maladaptive reorganization",
                "niss_correlation": "Motor pathway reorganization — chronic motor control disruption cluster"
            }
        },
        "niss_enriched": niss_obj(5.0, 4.0, 8.0, 3.0, 3.5, 4.5),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Motor cortex stimulation and cortical reorganization well-documented",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MI", "PC", "DI"], "cci": 0.72}
    },

    # ─── Identity/Visual/Emotional Acute Techniques (T0124-T0130) ──

    "QIF-T0124": {
        "tara": {
            "mechanism": "Disrupting hippocampal-prefrontal circuits responsible for autobiographical memory retrieval and self-narrative coherence, causing fragmented sense of personal history",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "ECT (electroconvulsive therapy) / TMS for treatment-resistant depression",
                "conditions": ["treatment-resistant depression", "dissociative disorders (research)", "PTSD (narrative restructuring)"],
                "fda_status": "approved",
                "evidence_level": "meta_analysis",
                "safe_parameters": "ECT: brief-pulse, right unilateral, 6x seizure threshold; TMS: standard safety guidelines",
                "sources": ["UK ECT Review Group 2003 (Lancet)", "Kellner et al. 2012 (Am J Psychiatry)"]
            },
            "governance": gov(GOV_PROHIBITED,
                safety_ceiling="Identity disruption requires highest-tier consent; psychiatric evaluation before and after; narrative coherence assessment mandatory"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "hippocampal-PFC_circuit", "modulation": "inhibitory/disruptive", "sessions": "cumulative"},
                "hardware": ["TMS_coil/ECT_device", "neuropsychological_test_battery", "autobiographical_memory_assessment"],
                "detection": "Autobiographical memory interview (AMI), narrative coherence scoring, self-continuity scales"
            },
            "dsm5": {
                "primary": [
                    {"code": "F44.0", "name": "Dissociative Amnesia", "confidence": "established"},
                    {"code": "F48.1", "name": "Depersonalization-Derealization Disorder", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F44.81", "name": "Dissociative Identity Disorder", "confidence": "probable"},
                    {"code": "F43.1", "name": "Post-Traumatic Stress Disorder", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "persistent_personality",
                "pathway": "N5 (hippocampal-PFC network) → N6 (default mode network) → N7 (self-narrative integration) — identity coherence disruption",
                "niss_correlation": "Identity/narrative disruption — personality/dissociative cluster"
            }
        },
        "niss_enriched": niss_obj(6.0, 4.0, 7.0, 3.0, 2.5, 5.5),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "ECT and TMS effects on autobiographical memory well-documented",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["PC", "MI", "CL"], "cci": 1.44}
    },

    "QIF-T0125": {
        "tara": {
            "mechanism": "Longitudinal collection of stable neural response patterns (ERP latencies, spectral fingerprints, connectivity signatures) to build a persistent biometric identifier that survives session boundaries",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "ERP/EEG biomarker tracking for treatment response monitoring",
                "conditions": ["depression treatment monitoring (P300 amplitude)", "ADHD diagnosis (theta/beta ratio)", "Alzheimer's staging (EEG slowing)"],
                "fda_status": "cleared",
                "evidence_level": "cohort",
                "safe_parameters": "Passive EEG recording; no stimulation; data minimization and de-identification required",
                "sources": ["Polich 2007 (Clin Neurophysiol)", "Marcel & Millan 2007 (IEEE TBME)"]
            },
            "governance": gov(GOV_RECORDING,
                consent_tier="enhanced",
                safety_ceiling="Neural biometric data at highest protection tier; purpose limitation; right to deletion; no cross-session linking without explicit consent"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"recording_channels": "32-256 EEG", "features": "ERP_latency/spectral_power/connectivity", "temporal_stability": "months-years"},
                "hardware": ["EEG_cap", "high_density_amplifier", "feature_extraction_pipeline", "biometric_database"],
                "detection": "Neural fingerprint template comparison, cross-session correlation analysis, de-identification audit"
            },
            "dsm5": {
                "primary": [],
                "secondary": [
                    {"code": "F41.1", "name": "Generalized Anxiety Disorder (surveillance awareness)", "confidence": "probable"}
                ],
                "risk_class": "indirect",
                "cluster": "non_diagnostic",
                "pathway": "Passive recording — no direct neural disruption; risk is informational (identity/privacy)",
                "niss_correlation": "Reconnaissance technique — primary risk is privacy, not clinical harm"
            }
        },
        "niss_enriched": niss_obj(1.0, 2.5, 2.0, 8.0, 2.0, 3.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "EEG biometric identification demonstrated with >95% accuracy in research",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MP", "PC"], "cci": 0.24}
    },

    "QIF-T0126": {
        "tara": {
            "mechanism": "Systematic mapping of visual evoked potentials and steady-state visual evoked potentials (SSVEPs) across stimulus parameters to profile visual cortex response characteristics",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Visual evoked potential (VEP) diagnostics",
                "conditions": ["optic neuritis (MS diagnosis)", "amblyopia assessment", "cortical visual impairment", "visual field mapping"],
                "fda_status": "cleared",
                "evidence_level": "meta_analysis",
                "safe_parameters": "Pattern-reversal VEP: checkerboard at 1-2 reversals/s; flash VEP: standard photometric limits",
                "sources": ["Odom et al. 2016 (Doc Ophthalmol, ISCEV standard)", "Zemon & Gordon 2006 (Clin Neurophysiol)"]
            },
            "governance": gov(GOV_RECORDING,
                safety_ceiling="Standard VEP testing parameters; photosensitive epilepsy screening mandatory; data minimization"),
            "engineering": {
                "coupling": ["optical"],
                "parameters": {"stimulus_type": "pattern_reversal/flash/SSVEP", "frequency_hz": "1-30", "luminance_cd_m2": "standard_photometric"},
                "hardware": ["visual_stimulus_display", "EEG_recording", "photometric_calibrator"],
                "detection": "Response characteristic profiling, habituation tracking, cross-session comparison analysis"
            },
            "dsm5": {
                "primary": [],
                "secondary": [],
                "risk_class": "none",
                "cluster": "non_diagnostic",
                "pathway": "Passive visual response mapping — no direct disruption; reconnaissance only",
                "niss_correlation": "Reconnaissance technique — no clinical risk from profiling alone"
            }
        },
        "niss_enriched": niss_obj(0.5, 1.5, 1.0, 9.5, 1.5, 2.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "VEP and SSVEP testing equipment standard in clinical and research settings",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MP"], "cci": 0.1}
    },

    "QIF-T0127": {
        "tara": {
            "mechanism": "Direct stimulation of amygdala fear circuits to induce acute fear, panic, or threat-perception states without external environmental threat",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "DBS of amygdala / extinction learning facilitation",
                "conditions": ["treatment-resistant PTSD", "phobia extinction (research)", "anxiety disorders (DBS research)"],
                "fda_status": "investigational",
                "evidence_level": "case_series",
                "safe_parameters": "Amygdala DBS: low-frequency (5-10 Hz), 1-3V, with psychiatric monitoring and emergency anxiolytic protocol",
                "sources": ["Langevin et al. 2016 (J Neuropsychiatry)", "Koek et al. 2014 (Biol Psychiatry)"]
            },
            "governance": gov(GOV_PROHIBITED,
                safety_ceiling="Fear circuit activation is a harm vector outside controlled research; detection and prevention only; anxiolytic rescue protocol required"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "amygdala/bed_nucleus_stria_terminalis", "frequency_hz": "5-10", "amplitude_V": "1-3", "pulse_width_us": "60-90"},
                "hardware": ["DBS_electrode", "IPG_programmer", "real_time_EEG", "heart_rate_variability_monitor", "anxiolytic_rescue"],
                "detection": "Skin conductance response, heart rate variability shift, EEG theta power increase, subjective fear rating"
            },
            "dsm5": {
                "primary": [
                    {"code": "F41.0", "name": "Panic Disorder", "confidence": "established"},
                    {"code": "F43.0", "name": "Acute Stress Reaction", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F43.1", "name": "Post-Traumatic Stress Disorder", "confidence": "probable"},
                    {"code": "F40.2", "name": "Specific Phobias", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "mood_trauma",
                "pathway": "N3 (amygdala) → N4 (hypothalamus/PAG) → N1 (autonomic nervous system) — acute fear circuit activation",
                "niss_correlation": "Fear circuit activation — acute anxiety/trauma cluster"
            }
        },
        "niss_enriched": niss_obj(7.0, 5.5, 3.5, 6.5, 5.5, 4.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Amygdala DBS demonstrated in clinical research; fear responses documented",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "PC"], "cci": 0.96}
    },

    "QIF-T0128": {
        "tara": {
            "mechanism": "Suppression of ventral striatum and orbitofrontal cortex reward-related activity to reduce hedonic tone, causing loss of pleasure in normally enjoyable activities",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "DBS of subcallosal cingulate / ventral capsule for depression",
                "conditions": ["treatment-resistant depression", "anhedonia", "bipolar depression (research)"],
                "fda_status": "investigational",
                "evidence_level": "cohort",
                "safe_parameters": "Subcallosal cingulate DBS: 130 Hz, 3-6V, 90 μs; psychiatric monitoring at 2-week intervals",
                "sources": ["Mayberg et al. 2005 (Neuron)", "Holtzheimer et al. 2012 (Arch Gen Psychiatry)"]
            },
            "governance": gov(GOV_COGNITIVE,
                consent_tier="IRB",
                safety_ceiling="Hedonic tone assessment at each visit (SHAPS); suicidality screening; immediate intervention if anhedonia score exceeds threshold"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "ventral_striatum/OFC/subcallosal_cingulate", "frequency_hz": "130", "amplitude_V": "3-6", "pulse_width_us": "90"},
                "hardware": ["DBS_electrode", "IPG_programmer", "anhedonia_assessment_tools", "fMRI_verification"],
                "detection": "SHAPS scoring, reward task fMRI, EEG frontal theta asymmetry, behavioral activation level"
            },
            "dsm5": {
                "primary": [
                    {"code": "F32.2", "name": "Major Depressive Episode, Severe (anhedonia)", "confidence": "established"},
                    {"code": "F34.1", "name": "Persistent Depressive Disorder (Dysthymia)", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F48.1", "name": "Depersonalization-Derealization Disorder", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "mood_trauma",
                "pathway": "N3 (ventral striatum) → N4 (OFC) → N5 (reward network) — hedonic suppression",
                "niss_correlation": "Hedonic suppression — anhedonia/depression cluster"
            }
        },
        "niss_enriched": niss_obj(5.5, 4.0, 5.5, 4.5, 3.5, 4.5),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Subcallosal cingulate DBS demonstrated in clinical trials; reward circuit modulation documented",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "PC"], "cci": 0.96}
    },

    "QIF-T0129": {
        "tara": {
            "mechanism": "Simultaneous overstimulation of multiple limbic structures (amygdala, insula, anterior cingulate) to overwhelm emotional regulation capacity, causing uncontrollable affect surges",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Emotional processing therapy / exposure therapy (controlled activation)",
                "conditions": ["PTSD (controlled exposure)", "panic disorder (interoceptive exposure)", "borderline PD (affect regulation training)"],
                "fda_status": "not_applicable",
                "evidence_level": "RCT",
                "safe_parameters": "Exposure therapy: graded, within window of tolerance; never simultaneous multi-structure stimulation",
                "sources": ["Foa et al. 2007 (Prolonged Exposure Therapy for PTSD)", "Linehan 1993 (DBT manual)"]
            },
            "governance": gov(GOV_PROHIBITED,
                safety_ceiling="Emotional flooding exceeds any therapeutic parameter — detection and prevention only; therapeutic analog uses controlled graded exposure"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"targets": "amygdala/insula/ACC simultaneous", "amplitude": "suprathreshold", "modulation": "excitatory"},
                "hardware": ["multi_electrode_DBS", "real_time_affect_monitoring", "emergency_sedation_protocol"],
                "detection": "Heart rate variability collapse, skin conductance spike, EEG high-frequency burst, behavioral distress indicators"
            },
            "dsm5": {
                "primary": [
                    {"code": "F43.0", "name": "Acute Stress Reaction", "confidence": "established"},
                    {"code": "F60.3", "name": "Borderline Personality Disorder (affect instability)", "confidence": "probable"}
                ],
                "secondary": [
                    {"code": "F44.2", "name": "Dissociative Stupor", "confidence": "probable"},
                    {"code": "F43.1", "name": "Post-Traumatic Stress Disorder", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "mood_trauma",
                "pathway": "N3-N4 (amygdala/insula/ACC simultaneous) → N5 (prefrontal overwhelm) → affective flooding",
                "niss_correlation": "Emotional flooding — acute trauma/dissociation cluster"
            }
        },
        "niss_enriched": niss_obj(8.0, 6.0, 4.0, 5.0, 6.0, 6.0),
        "physics_feasibility": {
            "tier": 1,
            "tier_label": "near_term",
            "timeline": "2026-2031",
            "gate_reason": "Multi-target DBS requires high-density electrode arrays; components exist but integration is emerging",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "PC", "DI"], "cci": 1.8}
    },

    "QIF-T0130": {
        "tara": {
            "mechanism": "Disruption of mirror neuron system and anterior insula circuits responsible for empathic processing, causing diminished affective empathy while potentially preserving cognitive empathy",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "TMS of temporoparietal junction for social cognition research",
                "conditions": ["autism spectrum (social cognition research)", "conduct disorder (empathy research)", "psychopathy (neural correlates research)"],
                "fda_status": "investigational",
                "evidence_level": "cohort",
                "safe_parameters": "1 Hz inhibitory rTMS over TPJ/anterior insula, standard safety guidelines, empathy assessment before/after",
                "sources": ["Young et al. 2010 (PNAS, TPJ and moral judgment)", "Lamm et al. 2011 (Neurosci Biobehav Rev)"]
            },
            "governance": gov(GOV_COGNITIVE,
                consent_tier="IRB",
                safety_ceiling="Empathy assessment mandatory at each session; immediate cessation if empathy scores drop below clinical threshold; social functioning monitoring"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "anterior_insula/TPJ/mirror_neuron_system", "frequency_hz": "1 (inhibitory rTMS)", "amplitude_pct_MT": "80-110"},
                "hardware": ["TMS_coil", "neuronavigation", "empathy_assessment_battery", "social_cognition_tasks"],
                "detection": "Empathy quotient (EQ) scoring, facial affect recognition testing, skin conductance to emotional stimuli"
            },
            "dsm5": {
                "primary": [
                    {"code": "F60.2", "name": "Antisocial Personality Disorder (acquired empathy deficit)", "confidence": "probable"},
                    {"code": "F94.1", "name": "Reactive Attachment Disorder", "confidence": "probable"}
                ],
                "secondary": [
                    {"code": "F60.3", "name": "Borderline Personality Disorder", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "persistent_personality",
                "pathway": "N4 (anterior insula/TPJ) → N5 (mirror neuron network) → N6 (social cognition network) — empathy circuit disruption",
                "niss_correlation": "Empathy disruption — personality/social functioning cluster"
            }
        },
        "niss_enriched": niss_obj(5.0, 3.5, 6.0, 4.0, 2.5, 4.5),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "TMS of TPJ and effects on moral/empathic judgment demonstrated in research",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MI", "PC", "CL"], "cci": 0.96}
    },

    # ─── Language Domain (T0131-T0132) ─────────────────────────────

    "QIF-T0131": {
        "tara": {
            "mechanism": "Injection of motor commands into speech production pathways via stimulation of motor cortex mouth/larynx areas, causing involuntary vocalizations or speech",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Speech neuroprosthesis / brain-to-speech BCI",
                "conditions": ["locked-in syndrome", "ALS (speech loss)", "post-stroke aphasia", "laryngeal dystonia"],
                "fda_status": "breakthrough",
                "evidence_level": "cohort",
                "safe_parameters": "Speech neuroprosthesis: decode-only with user-initiated trigger; no involuntary output",
                "sources": ["Willett et al. 2023 (Nature)", "Moses et al. 2021 (N Engl J Med)"]
            },
            "governance": gov(GOV_STIM,
                consent_tier="IRB",
                safety_ceiling="Speech output must require user-initiated trigger; involuntary speech production is a harm vector; kill switch mandatory"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "ventral_premotor/M1_larynx", "decode_method": "neural_speech_decoding", "latency_ms": "<100"},
                "hardware": ["high_density_ECoG", "speech_decoder", "speech_synthesizer", "safety_interlock"],
                "detection": "Involuntary vocalization detection, EMG laryngeal monitoring, patient intent verification"
            },
            "dsm5": {
                "primary": [
                    {"code": "F44.4", "name": "Conversion Disorder (speech symptom)", "confidence": "established"},
                    {"code": "F95.1", "name": "Chronic Vocal Tic Disorder", "confidence": "probable"}
                ],
                "secondary": [
                    {"code": "F41.1", "name": "Generalized Anxiety Disorder", "confidence": "probable"},
                    {"code": "F40.10", "name": "Social Phobia", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "motor_neurocognitive",
                "pathway": "N4 (ventral premotor cortex) → N2 (corticobulbar tract) → N1 (laryngeal motor neurons) — speech motor hijacking",
                "niss_correlation": "Speech production hijacking — motor/language disruption cluster"
            }
        },
        "niss_enriched": niss_obj(6.5, 5.0, 3.0, 6.0, 5.5, 3.5),
        "physics_feasibility": {
            "tier": 1,
            "tier_label": "near_term",
            "timeline": "2026-2031",
            "gate_reason": "Brain-to-speech BCIs demonstrated; bidirectional speech control emerging",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "PC"], "cci": 0.96}
    },

    "QIF-T0132": {
        "tara": {
            "mechanism": "Disruption of Wernicke's area and auditory association cortex processing to impair language comprehension while preserving speech production and hearing",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "rTMS of Wernicke's area for tinnitus / auditory hallucinations",
                "conditions": ["auditory hallucinations in schizophrenia", "tinnitus", "Wernicke's aphasia rehabilitation"],
                "fda_status": "investigational",
                "evidence_level": "RCT",
                "safe_parameters": "1 Hz inhibitory rTMS over left temporoparietal cortex, 80-110% MT, 1000-2000 pulses/session",
                "sources": ["Hoffman et al. 2005 (Arch Gen Psychiatry)", "Kindler et al. 2014 (Biol Psychiatry)"]
            },
            "governance": gov(GOV_COGNITIVE,
                safety_ceiling="Language comprehension testing at each session (Token Test); immediate cessation if comprehension drops below safety threshold"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "Wernicke_area/posterior_STG", "frequency_hz": "1 (inhibitory)", "amplitude_pct_MT": "80-110"},
                "hardware": ["TMS_coil", "neuronavigation", "language_assessment_battery", "audiometric_equipment"],
                "detection": "Token Test performance, semantic priming task, word-sentence verification, ERP N400 monitoring"
            },
            "dsm5": {
                "primary": [
                    {"code": "R47.0", "name": "Dysphasia and Aphasia (receptive)", "confidence": "established"},
                    {"code": "F80.1", "name": "Receptive Language Disorder", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F41.1", "name": "Generalized Anxiety Disorder", "confidence": "probable"},
                    {"code": "F32.0", "name": "Major Depressive Episode, Mild", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "cognitive_psychotic",
                "pathway": "N4 (Wernicke's area) → N5 (auditory association cortex) → language comprehension network — receptive aphasia",
                "niss_correlation": "Comprehension interference — language/cognitive disruption cluster"
            }
        },
        "niss_enriched": niss_obj(5.5, 4.5, 4.0, 6.0, 4.0, 3.5),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "rTMS of Wernicke's area and effects on language comprehension well-established",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI"], "cci": 0.48}
    },

    # ─── Visual/Auditory Disruption (T0133-T0134) ─────────────────

    "QIF-T0133": {
        "tara": {
            "mechanism": "Excessive photic or electrical stimulation of primary visual cortex (V1) to induce phosphenes, visual distortion, cortical spreading depression, or photosensitive seizures",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Visual cortex prosthesis (Orion / Second Sight) / phosphene mapping",
                "conditions": ["cortical blindness (visual prosthesis)", "amblyopia treatment (research)", "migraine with aura (research model)"],
                "fda_status": "investigational",
                "evidence_level": "cohort",
                "safe_parameters": "Visual prosthesis: charge-balanced biphasic pulses, <100 μC/cm², individual threshold mapping",
                "sources": ["Beauchamp et al. 2020 (Cell)", "Dobelle 2000 (ASAIO J)"]
            },
            "governance": gov(GOV_PROHIBITED,
                safety_ceiling="Overstimulation exceeds therapeutic parameters — detection and prevention only; therapeutic visual prostheses use carefully mapped individual thresholds"),
            "engineering": {
                "coupling": ["electromagnetic", "optical"],
                "parameters": {"target": "V1/visual_cortex", "charge_density_uC_cm2": ">100 (overstimulation)", "flash_frequency_hz": ">3 (seizure risk range)"},
                "hardware": ["cortical_electrode_array", "visual_stimulator", "EEG_seizure_detection", "emergency_protocols"],
                "detection": "EEG epileptiform activity monitoring, pupillary response tracking, subjective visual disturbance reporting"
            },
            "dsm5": {
                "primary": [
                    {"code": "G40.4", "name": "Other generalized epilepsy (photosensitive)", "confidence": "established"},
                    {"code": "H53.1", "name": "Subjective visual disturbances", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "G43", "name": "Migraine (cortical spreading depression)", "confidence": "probable"},
                    {"code": "F41.0", "name": "Panic Disorder", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "motor_neurocognitive",
                "pathway": "N4 (V1) → cortical spreading depression → N3 (thalamic relay) — visual cortex overload cascade",
                "niss_correlation": "Visual cortex overstimulation — seizure/sensory disruption cluster"
            }
        },
        "niss_enriched": niss_obj(7.5, 6.5, 4.0, 5.0, 6.0, 5.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Visual cortex stimulation and photosensitive seizure induction well-documented",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MI", "CL", "DI"], "cci": 0.96}
    },

    "QIF-T0134": {
        "tara": {
            "mechanism": "Delivery of excessive electrical stimulation through cochlear implant electrodes to cause pain, acoustic shock, tinnitus, or vestibular side-effects via current spread to adjacent structures",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Cochlear implant therapy",
                "conditions": ["sensorineural hearing loss", "congenital deafness", "single-sided deafness", "auditory neuropathy"],
                "fda_status": "approved",
                "evidence_level": "meta_analysis",
                "safe_parameters": "Device-specific (Cochlear, MED-EL, AB): charge-balanced biphasic, <30 μC/phase, individual comfort levels",
                "sources": ["Wilson & Dorman 2008 (JASA)", "Zeng et al. 2008 (IEEE Rev Biomed Eng)"]
            },
            "governance": gov(GOV_PROHIBITED,
                safety_ceiling="Overstimulation exceeds device comfort levels — detection and prevention only; cochlear implants use individual threshold/comfort mapping"),
            "engineering": {
                "coupling": ["galvanic"],
                "parameters": {"electrode_count": "12-22", "charge_per_phase_uC": ">30 (overstimulation)", "rate_pps": ">3000 (overdriven)"},
                "hardware": ["cochlear_implant_processor", "electrode_array", "impedance_telemetry", "pain_detection_system"],
                "detection": "Impedance telemetry, loudness discomfort level monitoring, vestibular symptom screening, patient distress indicators"
            },
            "dsm5": {
                "primary": [
                    {"code": "H93.1", "name": "Tinnitus (iatrogenic)", "confidence": "established"},
                    {"code": "H83.3", "name": "Noise effects on inner ear", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "H81.3", "name": "Other peripheral vertigo (current spread)", "confidence": "probable"},
                    {"code": "F43.0", "name": "Acute Stress Reaction", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "motor_neurocognitive",
                "pathway": "I0 (cochlear electrode array) → N1 (auditory nerve) → N3 (cochlear nucleus) — overstimulation with vestibular crosstalk",
                "niss_correlation": "Cochlear overstimulation — auditory damage/vestibular disruption cluster"
            }
        },
        "niss_enriched": niss_obj(7.0, 5.5, 4.5, 4.5, 5.5, 4.0),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Cochlear implants widely deployed; overstimulation a known device safety concern",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["MI", "CL", "DI"], "cci": 0.96}
    },

    # ─── Cognitive Chaining (T0135) ────────────────────────────────

    "QIF-T0135": {
        "tara": {
            "mechanism": "Exploiting neural pathway interconnectedness to cause stimulation effects that propagate beyond the intended target region, producing off-target cognitive, motor, or emotional effects through synaptic connectivity",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Connectome-informed DBS targeting / network-level stimulation",
                "conditions": ["treatment-resistant depression (network-based DBS)", "OCD (ALIC/VC-VS DBS with off-target effects)", "essential tremor (VIM DBS)"],
                "fda_status": "investigational",
                "evidence_level": "cohort",
                "safe_parameters": "Connectome mapping before stimulation; current steering to minimize spread; multi-domain monitoring",
                "sources": ["Horn et al. 2017 (NeuroImage)", "Riva-Posse et al. 2018 (Biol Psychiatry)"]
            },
            "governance": gov(GOV_COGNITIVE,
                consent_tier="IRB",
                safety_ceiling="Multi-domain assessment mandatory (motor + cognitive + emotional + sensory); connectome mapping before stimulation; current field modeling to predict propagation"),
            "engineering": {
                "coupling": ["electromagnetic"],
                "parameters": {"target": "primary_target_variable", "propagation_pathways": "white_matter_tracts", "spread_radius_mm": "variable", "current_steering": "directional"},
                "hardware": ["directional_DBS_leads", "connectome_mapping_MRI", "current_field_modeler", "multi_domain_assessment_suite"],
                "detection": "Multi-domain neuropsychological monitoring, current field modeling validation, off-target effect screening battery"
            },
            "dsm5": {
                "primary": [
                    {"code": "F06.8", "name": "Other specified mental disorder due to known physiological condition", "confidence": "established"}
                ],
                "secondary": [
                    {"code": "F44.4", "name": "Conversion Disorder", "confidence": "probable"},
                    {"code": "F41.1", "name": "Generalized Anxiety Disorder", "confidence": "probable"},
                    {"code": "F32.0", "name": "Major Depressive Episode, Mild", "confidence": "probable"}
                ],
                "risk_class": "direct",
                "cluster": "cognitive_psychotic",
                "pathway": "Primary target → white matter tracts → off-target cortical/subcortical regions — unpredictable propagation cascade",
                "niss_correlation": "Off-target propagation — multi-domain unpredictable disruption"
            }
        },
        "niss_enriched": niss_obj(5.0, 4.0, 5.5, 4.5, 3.0, 6.5),
        "physics_feasibility": {
            "tier": 0,
            "tier_label": "feasible_now",
            "timeline": "now",
            "gate_reason": "Off-target DBS effects well-documented in clinical literature; pathway propagation is inherent to neural stimulation",
            "constraint_system_ref": "QIF Derivation Log Entry 60",
            "analysis_date": "2026-03-14"
        },
        "neurorights_enriched": {"affected": ["CL", "MI", "DI"], "cci": 0.72}
    },
}


# ═══════════════════════════════════════════════════════════════════
# Main Script
# ═══════════════════════════════════════════════════════════════════

def main():
    dry_run = "--dry-run" in sys.argv

    with open(REGISTRY_PATH) as f:
        data = json.load(f)

    techniques = data["techniques"]
    skeletons = [t for t in techniques if t.get("tara_enrichment_pending", False)]

    print(f"Found {len(skeletons)} skeleton techniques")
    print(f"Enrichment data prepared for {len(ENRICHMENTS)} techniques")
    print()

    enriched_count = 0
    missing = []

    for t in skeletons:
        tid = t["id"]
        if tid not in ENRICHMENTS:
            missing.append(tid)
            continue

        enrich = ENRICHMENTS[tid]

        if dry_run:
            niss = enrich["niss_enriched"]
            tara = enrich["tara"]
            print(f"  {tid}: {t.get('attack', 'unnamed')}")
            print(f"    mechanism: {tara['mechanism'][:80]}...")
            print(f"    dual_use: {tara['dual_use']}")
            print(f"    clinical: {'Yes' if tara.get('clinical') else 'None (silicon_only)'}")
            if tara.get("dsm5", {}).get("primary"):
                codes = [p["code"] for p in tara["dsm5"]["primary"]]
                print(f"    dsm5_primary: {', '.join(codes)}")
            else:
                print(f"    dsm5_primary: (none)")
            print(f"    niss_score: {niss['score']} (A={niss['amplitude']}, F={niss['frequency']}, D={niss['duration']}, R={niss['reversibility']}, Det={niss['detectability']}, C={niss['coverage']})")
            print(f"    governance: consent={tara['governance']['consent_tier']}")
            if enrich.get("physics_feasibility"):
                print(f"    physics: {enrich['physics_feasibility']['tier_label']}")
            print()
        else:
            # Apply TARA enrichment
            t["tara"] = enrich["tara"]

            # Apply NISS enrichment - update the niss object with enriched scores
            niss = enrich["niss_enriched"]
            t["niss"]["score"] = niss["score"]
            # Store component scores in the niss object
            t["niss"]["components"] = {
                "amplitude": niss["amplitude"],
                "frequency": niss["frequency"],
                "duration": niss["duration"],
                "reversibility": niss["reversibility"],
                "detectability": niss["detectability"],
                "coverage": niss["coverage"]
            }

            # Recalculate severity based on score
            score = niss["score"]
            if score >= 7.0:
                t["niss"]["severity"] = "critical"
            elif score >= 5.0:
                t["niss"]["severity"] = "high"
            elif score >= 3.0:
                t["niss"]["severity"] = "medium"
            else:
                t["niss"]["severity"] = "low"

            # Apply physics feasibility
            if "physics_feasibility" in enrich:
                t["physics_feasibility"] = enrich["physics_feasibility"]

            # Update neurorights if enriched version provided
            if "neurorights_enriched" in enrich:
                t["neurorights"] = enrich["neurorights_enriched"]

            # Remove pending flag
            t["tara_enrichment_pending"] = False

            enriched_count += 1

    if missing:
        print(f"WARNING: No enrichment data for {len(missing)} techniques: {', '.join(missing)}")

    if dry_run:
        print(f"\nDry run complete. Would enrich {len(ENRICHMENTS) - len(missing)} techniques.")
        print(f"Missing enrichment for: {missing if missing else 'none'}")
    else:
        # Update statistics
        all_enriched = [t for t in techniques if not t.get("tara_enrichment_pending", False)]
        dual_use_counts = {"confirmed": 0, "probable": 0, "possible": 0, "silicon_only": 0}
        techniques_with_clinical = 0
        techniques_with_dsm5 = 0
        neurorights_mapped = 0

        # DSM5 cluster counts
        cluster_counts = {
            "motor_neurocognitive": 0,
            "cognitive_psychotic": 0,
            "mood_trauma": 0,
            "non_diagnostic": 0,
            "persistent_personality": 0
        }
        risk_class_counts = {"direct": 0, "indirect": 0, "none": 0}

        # NISS severity counts
        niss_severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "none": 0}

        for t in techniques:
            tara = t.get("tara", {})
            if tara:
                du = tara.get("dual_use", "")
                if du in dual_use_counts:
                    dual_use_counts[du] += 1
                if tara.get("clinical"):
                    techniques_with_clinical += 1
                dsm5 = tara.get("dsm5", {})
                if dsm5:
                    techniques_with_dsm5 += 1
                    cluster = dsm5.get("cluster", "non_diagnostic")
                    if cluster in cluster_counts:
                        cluster_counts[cluster] += 1
                    rc = dsm5.get("risk_class", "none")
                    if rc in risk_class_counts:
                        risk_class_counts[rc] += 1

            if t.get("neurorights"):
                neurorights_mapped += 1

            niss_sev = t.get("niss", {}).get("severity", "none")
            if niss_sev in niss_severity_counts:
                niss_severity_counts[niss_sev] += 1

        stats = data["statistics"]
        stats["tara"]["enriched_techniques"] = len(all_enriched)
        stats["tara"]["dual_use_breakdown"] = dual_use_counts
        stats["tara"]["techniques_with_clinical_analog"] = techniques_with_clinical
        stats["tara"]["techniques_silicon_only"] = dual_use_counts["silicon_only"]
        stats["tara"]["dsm5"]["techniques_with_dsm5"] = techniques_with_dsm5
        stats["tara"]["dsm5"]["cluster_breakdown"] = cluster_counts
        stats["tara"]["dsm5"]["risk_class_breakdown"] = risk_class_counts
        stats["tara"]["neurorights_mapped"] = neurorights_mapped
        stats["by_niss_severity"] = niss_severity_counts

        # Write back
        with open(REGISTRY_PATH, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

        print(f"Enriched {enriched_count} techniques.")
        print(f"Total enriched now: {len(all_enriched)}")
        print(f"NISS severity distribution: {niss_severity_counts}")
        print(f"Dual-use breakdown: {dual_use_counts}")
        print(f"DSM-5 cluster breakdown: {cluster_counts}")
        print(f"Updated statistics in registrar.")


if __name__ == "__main__":
    main()
