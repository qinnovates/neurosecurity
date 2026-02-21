#!/usr/bin/env python3
"""
TARA Enrichment — Therapeutic Atlas of Risks and Applications
Adds four-projection overlay data to each technique in qtara-registrar.json.

Projections:
  1. Security  — existing fields (attack, tactic, severity, niss, etc.)
  2. Clinical  — therapeutic analog, conditions, FDA status, evidence
  3. Governance — consent, safety ceilings, monitoring, regulations
  4. Engineering — coupling, parameters, hardware, detection

Run: python3 shared/scripts/populate-tara.py
Output: updates shared/qtara-registrar.json in-place

Named after Tara, the Buddhist bodhisattva of compassion and protection.
"""

import json
import os
import copy
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "shared" / "qtara-registrar.json"

# ═══════════════════════════════════════════════════════════════════
# TARA Schema Specification (added to registry top-level)
# ═══════════════════════════════════════════════════════════════════

TARA_SPEC = {
    "version": "1.0",
    "name": "TARA — Therapeutic Atlas of Risks and Applications",
    "description": "Mechanism-first Rosetta Stone. Same physical phenomenon, four stakeholder views. Security researchers see attack vectors. Clinicians see therapeutic modalities. Regulators see compliance requirements. Engineers see physical parameters.",
    "dual_use_classifications": {
        "confirmed": "Published therapeutic and security applications exist for this mechanism",
        "probable": "Strong theoretical basis for dual-use; therapeutic research underway",
        "possible": "Mechanism could have therapeutic applications but no published evidence",
        "silicon_only": "Pure digital/firmware/infrastructure attack with no neural therapeutic analog"
    },
    "consent_tiers": {
        "standard": "Standard informed consent (data collection, non-invasive monitoring)",
        "enhanced": "BCI-specific consent (stimulation, neural recording, neural data processing)",
        "IRB": "Institutional Review Board approval required (research, novel therapeutic applications)",
        "prohibited": "Application prohibited outside controlled research (unacceptable risk)"
    },
    "fda_statuses": {
        "cleared": "FDA 510(k) clearance for predicate device equivalence",
        "approved": "FDA PMA (Premarket Approval) for Class III devices",
        "breakthrough": "FDA Breakthrough Device designation (expedited review)",
        "investigational": "Under IDE (Investigational Device Exemption)",
        "none": "No FDA regulatory pathway established",
        "N/A": "Not applicable (silicon-only or non-device mechanism)"
    },
    "evidence_levels": {
        "meta_analysis": "Systematic reviews and meta-analyses (highest)",
        "RCT": "Randomized controlled trials",
        "cohort": "Observational cohort studies",
        "case_series": "Case series and reports",
        "preclinical": "Animal or in-vitro studies",
        "theoretical": "No empirical evidence yet",
        "N/A": "Not applicable"
    },
    "data_classifications": {
        "PHI": "Protected Health Information (HIPAA/HITECH)",
        "sensitive_neural": "Neural data with enhanced protections (proposed neurorights)",
        "PII": "Personally identifiable information (GDPR Art. 9 special category)",
        "restricted": "Restricted access (need-to-know basis)",
        "internal": "Internal operational data",
        "public": "Publicly available information"
    }
}

# ═══════════════════════════════════════════════════════════════════
# Common Governance Templates
# ═══════════════════════════════════════════════════════════════════

GOV_STIM = {
    "consent_tier": "enhanced",
    "monitoring": ["impedance", "stimulation_waveform", "tissue_temperature", "patient_response"],
    "regulations": ["FDA 510(k)/PMA", "IEC 60601-1", "ISO 80601-2-10", "21 CFR 882"],
    "data_classification": "PHI"
}

GOV_RECORDING = {
    "consent_tier": "enhanced",
    "monitoring": ["signal_quality", "data_encryption_status", "access_audit_log"],
    "regulations": ["HIPAA", "GDPR Art. 9", "21 CFR Part 11", "IEC 62304"],
    "data_classification": "sensitive_neural"
}

GOV_SILICON = {
    "consent_tier": "standard",
    "monitoring": ["firmware_integrity", "access_logging", "network_traffic"],
    "regulations": ["FDA 21 CFR 820", "IEC 62443", "NIST CSF"],
    "data_classification": "restricted"
}

GOV_COGNITIVE = {
    "consent_tier": "IRB",
    "monitoring": ["cognitive_assessment", "behavioral_tracking", "informed_consent_renewal"],
    "regulations": ["HIPAA", "GDPR Art. 9", "Common Rule (45 CFR 46)", "proposed neurorights legislation"],
    "data_classification": "sensitive_neural"
}

GOV_PROHIBITED = {
    "consent_tier": "prohibited",
    "monitoring": ["detection_only"],
    "regulations": ["Geneva Convention (if weaponized)", "proposed neurorights legislation"],
    "data_classification": "sensitive_neural"
}


# ═══════════════════════════════════════════════════════════════════
# Per-Technique TARA Data
# ═══════════════════════════════════════════════════════════════════

def gov(template, **overrides):
    """Create governance dict from template with overrides."""
    g = copy.deepcopy(template)
    for k, v in overrides.items():
        if isinstance(v, list) and isinstance(g.get(k), list):
            g[k] = v  # replace, don't append
        else:
            g[k] = v
    return g


TARA = {
    # ─── Signal Injection / Stimulation ───────────────────────────

    "QIF-T0001": {
        "mechanism": "Electrical current delivery at electrode-tissue interface modulating local field potentials",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "tDCS/tACS neuromodulation",
            "conditions": ["major depressive disorder", "chronic pain", "stroke rehabilitation", "tinnitus"],
            "fda_status": "cleared",
            "evidence_level": "RCT",
            "safe_parameters": "1-2 mA, 20-30 min sessions, 35 cm² electrode area",
            "sources": ["Brunoni et al. 2012 (Arch Gen Psychiatry)", "Lefaucheur et al. 2017 (Clin Neurophysiol)"]
        },
        "governance": gov(GOV_STIM, safety_ceiling="2 mA current, 30 min/session, 7 sessions/week max"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"frequency_hz": "DC (tDCS) or 0.1-100 (tACS)", "amplitude_mA": "0.5-2.0", "duration_s": "600-1800"},
            "hardware": ["stimulation_electrodes", "constant_current_source", "impedance_monitor"],
            "detection": "Impedance anomaly detection, waveform verification, current leakage monitoring"
        }
    },

    "QIF-T0002": {
        "mechanism": "Disruption or conditional locking of neural function via closed-loop stimulation parameter manipulation",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Deep brain stimulation (DBS) / Responsive neurostimulation (RNS)",
            "conditions": ["Parkinson's disease", "essential tremor", "epilepsy", "treatment-resistant depression"],
            "fda_status": "approved",
            "evidence_level": "RCT",
            "safe_parameters": "Device-specific (Medtronic, NeuroPace): 1-5V, 60-450μs pulse width, 130-185 Hz",
            "sources": ["Lozano et al. 2019 (Nature Reviews Neuroscience)", "Morrell 2011 (Neurosurgery)"]
        },
        "governance": gov(GOV_STIM, consent_tier="IRB", safety_ceiling="Device-specific FDA-approved parameters, fail-safe shutoff mandatory"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"frequency_hz": "130-185", "amplitude_V": "1-5", "pulse_width_us": "60-450"},
            "hardware": ["implanted_electrodes", "pulse_generator", "sensing_amplifier", "telemetry_module"],
            "detection": "Stimulation parameter monitoring, impedance trending, battery state tracking"
        }
    },

    "QIF-T0003": {
        "mechanism": "Passive capture of neural electromagnetic emissions from BCI data pathways",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "EEG/ECoG diagnostic monitoring",
            "conditions": ["epilepsy diagnosis", "sleep disorders", "cognitive assessment", "intraoperative monitoring"],
            "fda_status": "cleared",
            "evidence_level": "meta_analysis",
            "safe_parameters": "Non-invasive; passive recording only; no stimulation",
            "sources": ["Niedermeyer & da Silva 2004 (Electroencephalography)", "Schalk & Leuthardt 2011 (IEEE)"]
        },
        "governance": gov(GOV_RECORDING, safety_ceiling="Passive recording; data retention and access controls are primary safety concern"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"frequency_hz": "0.1-1000 (broadband capture)", "sensitivity_uV": "0.1-100"},
            "hardware": ["recording_electrodes", "amplifier", "ADC", "wireless_transmitter"],
            "detection": "RF spectrum monitoring, cable shielding verification, encryption validation"
        }
    },

    "QIF-T0004": {
        "mechanism": "Active interception and modification of signals between BCI components in transit",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Signal routing in closed-loop neuroprosthetics",
            "conditions": ["spinal cord injury (signal bridging)", "paralysis (motor signal rerouting)"],
            "fda_status": "investigational",
            "evidence_level": "preclinical",
            "safe_parameters": "Signal fidelity >99.9%, latency <10ms, bidirectional verification",
            "sources": ["Bensmaia & Miller 2014 (Science)", "Ethier et al. 2012 (Nature)"]
        },
        "governance": gov(GOV_STIM, consent_tier="IRB", safety_ceiling="Signal integrity verification mandatory; fail-open to safe state"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"latency_ms": "<10", "bandwidth_kbps": "variable", "encryption": "required"},
            "hardware": ["signal_interceptor", "protocol_analyzer", "real_time_processor"],
            "detection": "End-to-end latency monitoring, cryptographic integrity checks, signal fingerprinting"
        }
    },

    "QIF-T0005": {
        "mechanism": "Exploitation of quantum tunneling effects at nanoscale electrode-tissue junctions",
        "dual_use": "possible",
        "clinical": {
            "therapeutic_analog": "Quantum sensing for neural diagnostics (NV-center magnetometry)",
            "conditions": ["high-resolution neural imaging", "single-neuron recording"],
            "fda_status": "none",
            "evidence_level": "preclinical",
            "safe_parameters": "Passive quantum sensing; no stimulation; sub-nT field measurement",
            "sources": ["Barry et al. 2016 (PNAS, NV-center magnetometry)"]
        },
        "governance": gov(GOV_RECORDING, consent_tier="IRB", safety_ceiling="Quantum sensing is passive; data sensitivity is primary concern"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"scale_nm": "1-100", "temperature_K": "physiological (310)"},
            "hardware": ["nanoscale_electrodes", "quantum_sensor", "cryogenic_or_RT_readout"],
            "detection": "Tunneling current anomaly detection, junction impedance spectroscopy"
        }
    },

    "QIF-T0006": {
        "mechanism": "Davydov soliton propagation in protein alpha-helices at electrode-tissue interface",
        "dual_use": "possible",
        "clinical": {
            "therapeutic_analog": "Biophoton/soliton-based cellular signaling research",
            "conditions": ["theoretical: targeted molecular signaling"],
            "fda_status": "none",
            "evidence_level": "theoretical",
            "safe_parameters": "No established parameters; theoretical mechanism",
            "sources": ["Davydov 1973 (J Theor Biol)", "Scott 1992 (Phys Rep)"]
        },
        "governance": gov(GOV_RECORDING, consent_tier="IRB", safety_ceiling="Theoretical; no safe parameters established"),
        "engineering": {
            "coupling": ["mechanical", "thermal"],
            "parameters": {"propagation_velocity_m_s": "~1000", "energy_meV": "~20"},
            "hardware": ["molecular_scale_probes", "infrared_spectroscopy"],
            "detection": "Infrared absorption spectroscopy, protein conformational monitoring"
        }
    },

    "QIF-T0007": {
        "mechanism": "Manipulation of BCI communication protocol handshakes, headers, or sequencing",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Adaptive stimulation protocol adjustment in closed-loop BCIs",
            "conditions": ["epilepsy (responsive stimulation)", "Parkinson's (adaptive DBS)"],
            "fda_status": "approved",
            "evidence_level": "RCT",
            "safe_parameters": "Protocol changes within FDA-cleared parameter envelope only",
            "sources": ["Little et al. 2013 (Ann Neurol, adaptive DBS)"]
        },
        "governance": gov(GOV_SILICON, safety_ceiling="Protocol modifications logged and bounded by device safety envelope"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"protocol_layer": "application/transport", "latency_impact_ms": "variable"},
            "hardware": ["protocol_analyzer", "BCI_firmware_interface"],
            "detection": "Protocol conformance testing, sequence number validation, timing analysis"
        }
    },

    "QIF-T0008": {
        "mechanism": "Interception and substitution of BCI motor/sensory command signals",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "BCI command interfaces for motor-impaired patients",
            "conditions": ["ALS", "locked-in syndrome", "tetraplegia", "stroke (motor rehabilitation)"],
            "fda_status": "breakthrough",
            "evidence_level": "cohort",
            "safe_parameters": "Command verification with user confirmation; rate-limited actions",
            "sources": ["Hochberg et al. 2012 (Nature)", "Willett et al. 2021 (Nature)"]
        },
        "governance": gov(GOV_STIM, consent_tier="enhanced", safety_ceiling="Motor commands rate-limited; emergency stop always available"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"decode_latency_ms": "50-200", "classification_accuracy": ">95%"},
            "hardware": ["BCI_decoder", "motor_effector", "safety_interlock"],
            "detection": "Command pattern anomaly detection, user intent verification, behavioral consistency checks"
        }
    },

    "QIF-T0009": {
        "mechanism": "Radiofrequency emission at neural oscillation frequencies to induce false brain activity patterns",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Repetitive transcranial magnetic stimulation (rTMS)",
            "conditions": ["major depressive disorder", "OCD", "migraine", "PTSD"],
            "fda_status": "cleared",
            "evidence_level": "RCT",
            "safe_parameters": "FDA-cleared: 10-20 Hz, 120% motor threshold, specific coil placements",
            "sources": ["O'Reardon et al. 2007 (Biol Psychiatry)", "Rossi et al. 2009 (Clin Neurophysiol)"]
        },
        "governance": gov(GOV_STIM, safety_ceiling="120% motor threshold, site-specific protocols, operator certification required"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"frequency_hz": "1-50 (typically 10-20)", "field_strength_T": "1.5-2.0", "pulse_pattern": "theta burst or repetitive"},
            "hardware": ["RF_emitter_or_TMS_coil", "targeting_system", "EMG_monitor"],
            "detection": "RF spectrum analysis, field strength monitoring, EEG artifact detection"
        }
    },

    "QIF-T0010": {
        "mechanism": "Extremely low frequency electromagnetic fields entraining endogenous neural oscillations via resonance",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Audio-visual entrainment (AVE) / photic driving therapy",
            "conditions": ["ADHD", "anxiety", "insomnia", "cognitive enhancement"],
            "fda_status": "cleared",
            "evidence_level": "cohort",
            "safe_parameters": "0.5-40 Hz, non-contact, sub-threshold field intensity",
            "sources": ["Thut et al. 2011 (Curr Biol, entrainment)", "Herrmann et al. 2016 (Neurosci Biobehav Rev)"]
        },
        "governance": gov(GOV_STIM, consent_tier="enhanced", safety_ceiling="Photosensitive epilepsy screening required; frequency restrictions near 15-25 Hz"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"frequency_hz": "0.5-40", "field_type": "ELF EM", "modulation": "sinusoidal or pulsed"},
            "hardware": ["ELF_emitter", "frequency_generator", "field_strength_meter"],
            "detection": "EEG phase-locking analysis, spectral power monitoring at stimulation frequency"
        }
    },

    "QIF-T0011": {
        "mechanism": "Nonlinear mixing of two or more carrier frequencies in neural tissue producing intermodulation products at neural frequencies",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Temporal interference (TI) deep brain stimulation",
            "conditions": ["deep brain targets without surgery", "essential tremor", "depression (deep nuclei)"],
            "fda_status": "investigational",
            "evidence_level": "preclinical",
            "safe_parameters": "Two carriers at kHz range, difference frequency 1-100 Hz, <2 mA per channel",
            "sources": ["Grossman et al. 2017 (Cell)", "Sunshine et al. 2021 (Nat Commun)"]
        },
        "governance": gov(GOV_STIM, consent_tier="IRB", safety_ceiling="Per-channel current <2 mA; carriers must not independently stimulate"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"carrier_hz": "1000-10000", "difference_hz": "1-100", "amplitude_mA": "<2 per channel"},
            "hardware": ["dual_channel_stimulator", "precise_frequency_generator", "multichannel_electrodes"],
            "detection": "Spectral analysis for unexpected intermodulation products, dual-frequency monitoring"
        }
    },

    "QIF-T0012": {
        "mechanism": "Pulsed microwave radiation inducing thermoelastic expansion in neural tissue (Frey effect / microwave auditory effect)",
        "dual_use": "possible",
        "clinical": {
            "therapeutic_analog": "Transcranial microwave stimulation (experimental)",
            "conditions": ["research tool for non-invasive deep stimulation"],
            "fda_status": "none",
            "evidence_level": "preclinical",
            "safe_parameters": "No established clinical parameters; IEEE C95.1 exposure limits",
            "sources": ["Frey 1962 (J Appl Physiol)", "Lin & Wang 2007 (IEEE Trans Microw Theory Tech)"]
        },
        "governance": gov(GOV_STIM, consent_tier="prohibited", safety_ceiling="IEEE C95.1 SAR limits: 1.6 W/kg (head), no therapeutic protocol established"),
        "engineering": {
            "coupling": ["electromagnetic", "thermal"],
            "parameters": {"frequency_GHz": "0.3-6", "pulse_width_us": "1-100", "SAR_W_kg": "<1.6"},
            "hardware": ["pulsed_microwave_source", "antenna_array", "SAR_measurement_system"],
            "detection": "RF power density monitoring, thermal imaging, SAR dosimetry"
        }
    },

    "QIF-T0013": {
        "mechanism": "Two high-frequency currents intersecting in deep brain tissue, with stimulation occurring only at the interference zone",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Temporal interference (TI) non-invasive deep brain stimulation",
            "conditions": ["Parkinson's (subthalamic nucleus)", "depression (deep targets)", "essential tremor"],
            "fda_status": "investigational",
            "evidence_level": "preclinical",
            "safe_parameters": "Carriers >1 kHz, difference frequency at therapeutic target, <2 mA per electrode pair",
            "sources": ["Grossman et al. 2017 (Cell)", "Violante et al. 2023 (Nat Neurosci)"]
        },
        "governance": gov(GOV_STIM, consent_tier="IRB", safety_ceiling="<2 mA per channel; computational targeting model required; real-time monitoring"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"carrier_hz": "2000-5000", "envelope_hz": "1-100", "focal_depth_mm": "20-80"},
            "hardware": ["multichannel_stimulator", "computational_head_model", "targeting_software"],
            "detection": "Finite element modeling validation, EEG monitoring of entrainment at target frequency"
        }
    },

    "QIF-T0014": {
        "mechanism": "Amplitude-modulated carrier signal where neural tissue demodulates the envelope at biologically active frequencies",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "tACS with carrier-envelope paradigm",
            "conditions": ["pain modulation", "sleep induction", "cognitive enhancement"],
            "fda_status": "investigational",
            "evidence_level": "cohort",
            "safe_parameters": "Carrier >500 Hz, envelope 0.5-40 Hz, total current <2 mA",
            "sources": ["Chaieb et al. 2011 (Brain Stimul)", "Witkowski et al. 2016 (NeuroImage)"]
        },
        "governance": gov(GOV_STIM, safety_ceiling="Carrier analysis mandatory; modulation depth monitoring; total current <2 mA"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"carrier_hz": ">500", "envelope_hz": "0.5-40", "modulation_depth": "0-100%"},
            "hardware": ["AM_signal_generator", "stimulation_electrodes", "spectrum_analyzer"],
            "detection": "Demodulation analysis of all incident signals; envelope frequency extraction"
        }
    },

    "QIF-T0015": {
        "mechanism": "Focused electromagnetic energy causing thermal damage to electrode-tissue interface or neural tissue",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Thermal ablation (stereotactic radiosurgery, LITT, RF ablation)",
            "conditions": ["epilepsy (focal ablation)", "brain tumors", "essential tremor (thalamotomy)"],
            "fda_status": "approved",
            "evidence_level": "RCT",
            "safe_parameters": "MRI-guided, temperature-monitored, target-specific (<3mm precision)",
            "sources": ["Curry et al. 2012 (J Neurosurg, LITT)", "Elias et al. 2016 (NEJM, focused ultrasound)"]
        },
        "governance": gov(GOV_STIM, consent_tier="IRB", safety_ceiling="Real-time thermal monitoring mandatory; automatic shutoff at temperature threshold"),
        "engineering": {
            "coupling": ["electromagnetic", "thermal"],
            "parameters": {"power_W": "variable", "temperature_C": "43-60 (ablation)", "focal_size_mm": "1-5"},
            "hardware": ["focused_energy_source", "thermal_sensor", "MRI_or_CT_guidance"],
            "detection": "Tissue temperature monitoring, impedance changes, thermal imaging"
        }
    },

    # ─── ML/AI Model Attacks (mostly silicon-only) ────────────────

    "QIF-T0016": {
        "mechanism": "Backdoor insertion during BCI model training phase via poisoned training data or modified training process",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="Model provenance verification; training data auditing; backdoor scanning"),
        "engineering": {
            "coupling": [],
            "parameters": {"attack_surface": "training_pipeline", "persistence": "permanent until retrained"},
            "hardware": ["training_infrastructure", "data_pipeline"],
            "detection": "Neural Cleanse, activation clustering, spectral signature analysis of model weights"
        }
    },

    "QIF-T0017": {
        "mechanism": "Backdoor propagation via transfer learning from compromised pre-trained BCI model",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="Pre-trained model provenance verification; fine-tuning validation"),
        "engineering": {
            "coupling": [],
            "parameters": {"attack_surface": "model_supply_chain", "persistence": "survives fine-tuning"},
            "hardware": ["model_repository", "fine_tuning_infrastructure"],
            "detection": "Model diff analysis, behavioral testing on known inputs, weight distribution analysis"
        }
    },

    "QIF-T0018": {
        "mechanism": "Crafted input perturbations that pass through BCI signal filters to reach decoder/classifier",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="Adversarial robustness testing mandatory before deployment"),
        "engineering": {
            "coupling": [],
            "parameters": {"perturbation_norm": "L2 or Linf bounded", "attack_surface": "inference_pipeline"},
            "hardware": ["signal_processing_pipeline", "filter_chain"],
            "detection": "Input validation, filter integrity monitoring, adversarial example detection"
        }
    },

    "QIF-T0019": {
        "mechanism": "Single perturbation vector effective against any input sample to a BCI classifier",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="UAP scanning in deployment; input diversity requirements"),
        "engineering": {
            "coupling": [],
            "parameters": {"universality": "input-agnostic", "perturbation_budget": "bounded L2/Linf"},
            "hardware": ["classifier_model", "perturbation_generator"],
            "detection": "UAP detection via input preprocessing, certified defense bounds"
        }
    },

    "QIF-T0020": {
        "mechanism": "Statistical inference to determine if specific neural data was used in BCI model training",
        "dual_use": "possible",
        "clinical": {
            "therapeutic_analog": "Clinical trial participation verification",
            "conditions": ["clinical trial auditing", "research data governance"],
            "fda_status": "N/A",
            "evidence_level": "N/A",
            "safe_parameters": "Privacy-preserving machine learning; differential privacy guarantees",
            "sources": ["Shokri et al. 2017 (IEEE S&P)"]
        },
        "governance": gov(GOV_RECORDING, consent_tier="enhanced", safety_ceiling="Differential privacy ε<1 for neural training data"),
        "engineering": {
            "coupling": [],
            "parameters": {"attack_surface": "model_API", "privacy_metric": "differential_privacy_epsilon"},
            "hardware": ["model_API_access", "shadow_models"],
            "detection": "Differential privacy enforcement, membership inference testing, audit logging"
        }
    },

    "QIF-T0021": {
        "mechanism": "Reconstruction of individual neural data from shared gradient updates in federated BCI training",
        "dual_use": "possible",
        "clinical": {
            "therapeutic_analog": "Federated learning for multi-site clinical BCI trials",
            "conditions": ["multi-center BCI research", "collaborative model training without data sharing"],
            "fda_status": "N/A",
            "evidence_level": "N/A",
            "safe_parameters": "Secure aggregation; gradient compression; differential privacy on updates",
            "sources": ["Zhu et al. 2019 (NeurIPS, gradient inversion)"]
        },
        "governance": gov(GOV_RECORDING, consent_tier="enhanced", safety_ceiling="Gradient perturbation mandatory; secure aggregation protocol required"),
        "engineering": {
            "coupling": [],
            "parameters": {"attack_surface": "gradient_updates", "reconstruction_fidelity": "high for EEG"},
            "hardware": ["federated_training_infrastructure", "gradient_interceptor"],
            "detection": "Gradient norm clipping, secure aggregation verification, reconstruction testing"
        }
    },

    "QIF-T0022": {
        "mechanism": "Falsification of neurofeedback display or stimulation in closed-loop therapeutic BCIs",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Neurofeedback therapy",
            "conditions": ["ADHD", "anxiety", "depression", "PTSD", "substance abuse", "autism spectrum"],
            "fda_status": "cleared",
            "evidence_level": "RCT",
            "safe_parameters": "Real-time signal verification; display integrity checks; patient outcome monitoring",
            "sources": ["Arns et al. 2009 (Clin EEG Neurosci)", "Marzbani et al. 2016 (Basic Clin Neurosci)"]
        },
        "governance": gov(GOV_STIM, safety_ceiling="Neurofeedback display integrity verification; session outcome tracking; clinician oversight"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"feedback_latency_ms": "<100", "display_refresh_hz": "30-60"},
            "hardware": ["EEG_acquisition", "real_time_processor", "feedback_display", "integrity_monitor"],
            "detection": "Feedback-signal correlation verification, display integrity hashing, outcome trend analysis"
        }
    },

    "QIF-T0023": {
        "mechanism": "Cascading perturbation in closed-loop stimulation systems where output feeds back as input",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Closed-loop responsive neurostimulation (RNS)",
            "conditions": ["epilepsy (seizure interruption)", "Parkinson's (adaptive DBS)", "chronic pain"],
            "fda_status": "approved",
            "evidence_level": "RCT",
            "safe_parameters": "Bounded stimulation parameters; gain limits; emergency shutoff",
            "sources": ["Morrell 2011 (Neurosurgery, NeuroPace RNS)", "Priori et al. 2013 (Exp Neurol)"]
        },
        "governance": gov(GOV_STIM, consent_tier="IRB", safety_ceiling="Feedback gain limits; maximum stimulation bounds; automatic cascade detection and halt"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"loop_latency_ms": "<50", "gain_limit": "bounded", "cascade_detection_threshold": "defined"},
            "hardware": ["closed_loop_BCI", "real_time_processor", "safety_interlock"],
            "detection": "Loop gain monitoring, oscillation detection, stimulation parameter trending"
        }
    },

    "QIF-T0024": {
        "mechanism": "Systematic bias injection into BCI training datasets to skew model behavior",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="Training data provenance tracking; bias testing; diverse validation sets"),
        "engineering": {
            "coupling": [],
            "parameters": {"attack_surface": "training_data", "persistence": "permanent until retrained"},
            "hardware": ["data_pipeline", "training_infrastructure"],
            "detection": "Data provenance verification, bias metrics, cross-validation with independent data"
        }
    },

    # ─── Neural Signal Disruption ─────────────────────────────────

    "QIF-T0025": {
        "mechanism": "Broadband electromagnetic interference overwhelming neural signal acquisition",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "TMS (cortical suppression / virtual lesion technique)",
            "conditions": ["research: functional mapping", "presurgical cortical mapping"],
            "fda_status": "cleared",
            "evidence_level": "meta_analysis",
            "safe_parameters": "Single-pulse TMS for mapping; rTMS safety guidelines (Rossi et al. 2009)",
            "sources": ["Rossi et al. 2009 (Clin Neurophysiol)", "Pascual-Leone et al. 2000 (J Clin Neurophysiol)"]
        },
        "governance": gov(GOV_STIM, safety_ceiling="Single-pulse: generally safe; repetitive: requires seizure screening; motor threshold calibration"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"bandwidth_hz": "broadband", "power_density": "exceeds signal floor"},
            "hardware": ["broadband_emitter", "directional_antenna"],
            "detection": "RF spectrum monitoring, signal-to-noise trending, artifact detection algorithms"
        }
    },

    "QIF-T0026": {
        "mechanism": "Excessive stimulation current overwhelming normal neural firing patterns",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Electroconvulsive therapy (ECT)",
            "conditions": ["treatment-resistant depression", "catatonia", "acute suicidality"],
            "fda_status": "approved",
            "evidence_level": "meta_analysis",
            "safe_parameters": "Anesthesia required; seizure threshold titration; bitemporal/right unilateral placement",
            "sources": ["UK ECT Review Group 2003 (Lancet)", "Kellner et al. 2012 (Am J Psychiatry)"]
        },
        "governance": gov(GOV_STIM, consent_tier="IRB", safety_ceiling="Administered under anesthesia only; seizure monitoring; cognitive testing pre/post"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"charge_mC": "100-1000", "frequency_hz": "variable", "duration_s": "1-8"},
            "hardware": ["ECT_device", "EEG_monitor", "anesthesia_equipment"],
            "detection": "Current overload monitoring, seizure detection, post-stimulation EEG assessment"
        }
    },

    "QIF-T0027": {
        "mechanism": "Systematic probing of neural response patterns to map BCI topology and individual neural architecture",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Brain mapping for surgical planning / functional localization",
            "conditions": ["presurgical epilepsy mapping", "tumor resection planning", "functional connectivity research"],
            "fda_status": "cleared",
            "evidence_level": "meta_analysis",
            "safe_parameters": "Non-invasive fMRI/EEG; or intraoperative cortical stimulation with safety limits",
            "sources": ["Engel et al. 2005 (Epilepsia)", "Ojemann et al. 1989 (J Neurosurg)"]
        },
        "governance": gov(GOV_RECORDING, safety_ceiling="Passive mapping: no limits; active probing: stimulation safety protocols"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"resolution": "electrode-level", "scan_pattern": "systematic"},
            "hardware": ["multichannel_recording", "stimulus_generator", "mapping_software"],
            "detection": "Probe pattern recognition, scan rate monitoring, unauthorized stimulation detection"
        }
    },

    "QIF-T0028": {
        "mechanism": "Selective forwarding or dropping of specific neural signal types in a multi-channel BCI pipeline",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Selective neural signal routing in closed-loop therapy",
            "conditions": ["epilepsy (selective suppression of seizure signals)", "movement disorders (selective amplification)"],
            "fda_status": "investigational",
            "evidence_level": "preclinical",
            "safe_parameters": "Channel-specific filtering with integrity monitoring",
            "sources": ["Stanslaski et al. 2012 (IEEE TBME, Medtronic sensing)"]
        },
        "governance": gov(GOV_STIM, consent_tier="enhanced", safety_ceiling="All dropped/modified channels logged; signal integrity verification"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"channels": "multichannel", "selectivity": "frequency/spatial"},
            "hardware": ["multichannel_processor", "selective_filter", "integrity_monitor"],
            "detection": "Channel dropout monitoring, signal completeness verification, forwarding consistency checks"
        }
    },

    "QIF-T0029": {
        "mechanism": "Sustained high-rate stimulation exceeding neural tissue recovery capacity",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "High-frequency stimulation for neural suppression (DBS at >100 Hz)",
            "conditions": ["Parkinson's tremor suppression", "essential tremor", "dystonia"],
            "fda_status": "approved",
            "evidence_level": "RCT",
            "safe_parameters": "130-185 Hz, charge-balanced, within pulse generator safety envelope",
            "sources": ["Benabid et al. 1991 (Lancet)", "Limousin et al. 1998 (NEJM)"]
        },
        "governance": gov(GOV_STIM, consent_tier="enhanced", safety_ceiling="Charge-balanced waveforms mandatory; total charge per phase limited; duty cycle constraints"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"frequency_hz": ">100", "charge_balance": "mandatory", "duty_cycle": "bounded"},
            "hardware": ["stimulator", "charge_monitor", "tissue_impedance_sensor"],
            "detection": "Charge density monitoring, tissue impedance trending, stimulation artifact analysis"
        }
    },

    "QIF-T0030": {
        "mechanism": "Hijacking motor cortex output signals to produce involuntary movement via BCI motor interface",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Functional electrical stimulation (FES) / brain-controlled prosthetics",
            "conditions": ["spinal cord injury", "stroke rehabilitation", "paralysis", "limb prosthetics"],
            "fda_status": "cleared",
            "evidence_level": "RCT",
            "safe_parameters": "User-initiated; emergency stop; force/speed limits; range of motion constraints",
            "sources": ["Ajiboye et al. 2017 (Lancet)", "Collinger et al. 2013 (Lancet)"]
        },
        "governance": gov(GOV_STIM, consent_tier="enhanced", safety_ceiling="Emergency stop always accessible; motor output force-limited; user confirmation for novel actions"),
        "engineering": {
            "coupling": ["electromagnetic", "mechanical"],
            "parameters": {"decode_accuracy": ">90%", "response_latency_ms": "<200", "force_limit_N": "safety-bounded"},
            "hardware": ["motor_BCI_decoder", "FES_system_or_robotic_arm", "force_sensors", "safety_interlock"],
            "detection": "Intent verification, movement trajectory analysis, force/torque monitoring"
        }
    },

    "QIF-T0031": {
        "mechanism": "Accelerated battery depletion of implanted BCI through sustained high-power operation",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="Battery state monitoring; low-power mode enforcement; surgical replacement scheduling"),
        "engineering": {
            "coupling": [],
            "parameters": {"power_draw_mW": "elevated", "battery_life_reduction": "significant"},
            "hardware": ["implanted_pulse_generator", "battery_monitor"],
            "detection": "Battery drain rate monitoring, power consumption anomaly detection"
        }
    },

    # ─── Identity / Cognitive Integrity ───────────────────────────

    "QIF-T0032": {
        "mechanism": "Replication or synthesis of individual neural biometric signatures to impersonate BCI users",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Neural biometric authentication for medical device access",
            "conditions": ["secure BCI access control", "patient identity verification"],
            "fda_status": "N/A",
            "evidence_level": "cohort",
            "safe_parameters": "Multi-factor neural authentication; liveness detection; template protection",
            "sources": ["Marcel & Millan 2007 (IEEE TPAMI)", "Chuang et al. 2013 (ACM CHI)"]
        },
        "governance": gov(GOV_COGNITIVE, safety_ceiling="Biometric template encryption; revocation capability; anti-spoofing validation"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"FAR": "<0.01%", "FRR": "<5%", "template_security": "encrypted"},
            "hardware": ["EEG_acquisition", "biometric_processor", "template_store"],
            "detection": "Liveness detection, presentation attack detection, template freshness verification"
        }
    },

    "QIF-T0033": {
        "mechanism": "Gradual modification of personality-linked neural patterns through sustained BCI-mediated influence",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Neuroplasticity-based rehabilitation / personality change monitoring in DBS",
            "conditions": ["personality changes post-DBS (documented)", "cognitive rehabilitation", "addiction treatment"],
            "fda_status": "approved",
            "evidence_level": "cohort",
            "safe_parameters": "Personality assessment battery pre/post; ethics review; patient autonomy safeguards",
            "sources": ["Pugh et al. 2018 (Neuroethics)", "Gilbert et al. 2017 (AJOB Neurosci)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="IRB", safety_ceiling="Mandatory personality assessment; patient-reported autonomy measures; ethics board oversight"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"timescale": "weeks_to_months", "reversibility": "partial"},
            "hardware": ["chronic_BCI_system", "longitudinal_assessment_tools"],
            "detection": "Longitudinal personality metric tracking, behavioral change detection, patient self-report"
        }
    },

    "QIF-T0034": {
        "mechanism": "Targeted disruption of working memory maintenance via interference with sustained neural oscillations",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Working memory training / tDCS-enhanced cognitive training",
            "conditions": ["ADHD", "schizophrenia (working memory deficits)", "age-related cognitive decline"],
            "fda_status": "investigational",
            "evidence_level": "RCT",
            "safe_parameters": "Theta-frequency tACS (4-8 Hz) over DLPFC; 1-2 mA; 20 min",
            "sources": ["Reinhart & Nguyen 2019 (Nat Neurosci)", "Brunoni & Vanderhasselt 2014 (Brain Stimul)"]
        },
        "governance": gov(GOV_COGNITIVE, safety_ceiling="Cognitive assessment pre/post; no stimulation during critical tasks; informed consent for cognitive effects"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"target_band_hz": "4-8 (theta)", "target_region": "DLPFC", "amplitude_mA": "1-2"},
            "hardware": ["tACS_stimulator", "EEG_monitor", "cognitive_testing_battery"],
            "detection": "Working memory performance monitoring, theta power spectral analysis, sustained activity tracking"
        }
    },

    "QIF-T0035": {
        "mechanism": "Extraction of private information via P300 event-related potential responses to probe stimuli",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "P300 BCI (communication for locked-in patients)",
            "conditions": ["ALS communication", "locked-in syndrome", "severe motor disability"],
            "fda_status": "investigational",
            "evidence_level": "cohort",
            "safe_parameters": "Patient-initiated; consent per session; data encryption",
            "sources": ["Farwell & Donchin 1988 (Electroencephalogr Clin Neurophysiol)", "Sellers et al. 2014 (J Neural Eng)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="enhanced", safety_ceiling="Stimulus content disclosed; session recording consent; no covert probing"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"target_ERP": "P300 (300ms post-stimulus)", "oddball_ratio": "80/20", "trials": "20-100"},
            "hardware": ["EEG_acquisition", "stimulus_presentation", "ERP_classifier"],
            "detection": "Stimulus audit logging, P300 amplitude monitoring, unauthorized stimulus detection"
        }
    },

    "QIF-T0036": {
        "mechanism": "Decoding internal speech or intended communication from neural activity patterns",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Speech neuroprosthetics (neural speech decoding)",
            "conditions": ["aphasia", "ALS", "locked-in syndrome", "laryngectomy"],
            "fda_status": "breakthrough",
            "evidence_level": "cohort",
            "safe_parameters": "Patient-initiated decoding only; opt-in per session; data encryption at source",
            "sources": ["Moses et al. 2021 (NEJM, UCSF)", "Willett et al. 2023 (Nature, Stanford)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="enhanced", safety_ceiling="Decoding only when explicitly activated; no passive monitoring; thought privacy protections"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"resolution": "phoneme or word level", "accuracy": "50-95% (varies by system)", "latency_ms": "<1000"},
            "hardware": ["high_density_ECoG_or_Utah_array", "neural_decoder", "language_model"],
            "detection": "Decode activation monitoring, unauthorized access detection, data provenance tracking"
        }
    },

    "QIF-T0037": {
        "mechanism": "Manipulation of sense of agency (ownership of actions/thoughts) via BCI-mediated stimulation or feedback",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Neurofeedback for self-regulation / agency restoration post-stroke",
            "conditions": ["stroke rehabilitation (motor agency)", "schizophrenia (agency disturbance)", "dissociative disorders"],
            "fda_status": "investigational",
            "evidence_level": "cohort",
            "safe_parameters": "Patient retains veto power; agency assessment scales administered regularly",
            "sources": ["Haggard 2017 (Nat Rev Neurosci)", "Braun et al. 2018 (Cortex)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="IRB", safety_ceiling="Mandatory agency assessment; patient veto always available; ethics board review for any agency-affecting protocol"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"agency_metric": "intentional_binding_ms", "feedback_modality": "visual/haptic/neural"},
            "hardware": ["BCI_system", "agency_measurement_tools", "feedback_display"],
            "detection": "Agency scale monitoring, intentional binding measurement, self-report tracking"
        }
    },

    "QIF-T0038": {
        "mechanism": "Extraction and replication of unique neural identity signatures (brainprint) from BCI data",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Brain fingerprinting / neural identity verification",
            "conditions": ["patient identification in BCI systems", "secure access to neural devices"],
            "fda_status": "N/A",
            "evidence_level": "cohort",
            "safe_parameters": "Template stored encrypted; revocation mechanism; multi-factor auth",
            "sources": ["Jayarathne et al. 2017 (IEEE Access)", "La Rocca et al. 2014 (Neurocomputing)"]
        },
        "governance": gov(GOV_COGNITIVE, safety_ceiling="Brainprint templates encrypted at rest; revocable; not sole authentication factor"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"uniqueness": "EER <2%", "stability": "cross-session consistent", "template_size_KB": "1-10"},
            "hardware": ["EEG_acquisition", "feature_extractor", "template_matcher"],
            "detection": "Template access logging, cross-session consistency checks, theft detection via usage patterns"
        }
    },

    "QIF-T0039": {
        "mechanism": "Disruption of neural self-model (body ownership, self-awareness, narrative identity) via sustained BCI manipulation",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Psychedelic-assisted therapy (controlled self-model disruption); rubber hand illusion research",
            "conditions": ["PTSD (self-model restructuring)", "phantom limb pain", "body dysmorphia", "depersonalization"],
            "fda_status": "investigational",
            "evidence_level": "cohort",
            "safe_parameters": "Controlled setting; psychological support; gradual protocols; reversibility monitoring",
            "sources": ["Blanke et al. 2015 (Nat Rev Neurosci)", "Carhart-Harris et al. 2018 (Psychopharmacology)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="IRB", safety_ceiling="Psychiatric evaluation pre/post; controlled clinical environment; immediate support available"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"target_regions": "TPJ, insula, PFC", "timescale": "minutes_to_hours"},
            "hardware": ["multifocal_stimulation", "VR_system", "psychological_assessment_tools"],
            "detection": "Self-model integrity assessment, depersonalization scales, real-time psychological monitoring"
        }
    },

    "QIF-T0040": {
        "mechanism": "Social engineering via BCI-mediated trust manipulation or subliminal stimuli",
        "dual_use": "possible",
        "clinical": {
            "therapeutic_analog": "Subliminal priming research / implicit cognitive assessment",
            "conditions": ["research tool: implicit bias assessment", "cognitive behavioral therapy augmentation"],
            "fda_status": "N/A",
            "evidence_level": "cohort",
            "safe_parameters": "All stimuli disclosed post-session; no deception outside approved research protocols",
            "sources": ["Greenwald et al. 2009 (J Personal Soc Psychol, IAT)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="enhanced", safety_ceiling="All subliminal stimuli must be disclosed; no covert influence outside approved research"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"stimulus_duration_ms": "<50 (subliminal)", "modality": "visual/auditory/neural"},
            "hardware": ["stimulus_presentation_system", "BCI_interface", "response_monitor"],
            "detection": "Stimulus audit logging, subliminal content detection, behavioral anomaly monitoring"
        }
    },

    "QIF-T0041": {
        "mechanism": "Inference of cognitive traits, emotional states, or health conditions from BCI signal patterns",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "EEG-based cognitive and psychiatric assessment",
            "conditions": ["ADHD diagnosis", "depression screening", "dementia early detection", "sleep disorders"],
            "fda_status": "cleared",
            "evidence_level": "RCT",
            "safe_parameters": "Clinical context only; informed consent for cognitive profiling; data minimization",
            "sources": ["Arns et al. 2013 (World J Biol Psychiatry, QEEG)", "Babiloni et al. 2016 (Neurobiol Aging)"]
        },
        "governance": gov(GOV_RECORDING, consent_tier="enhanced", safety_ceiling="Explicit consent for cognitive inference; purpose limitation; right to not know"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"features": "spectral_power, connectivity, ERPs", "classification_accuracy": "70-90%"},
            "hardware": ["EEG_acquisition", "feature_extraction_pipeline", "classifier"],
            "detection": "Inference audit logging, purpose-limitation enforcement, access control on derived data"
        }
    },

    # ─── Infrastructure / Supply Chain ────────────────────────────

    "QIF-T0042": {
        "mechanism": "Side-channel information leakage from BCI wireless communications (BLE, WiFi, proprietary RF)",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="Encrypted communications mandatory; RF shielding; pairing protocols"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"protocol": "BLE/WiFi/proprietary", "leakage_type": "timing/power/EM"},
            "hardware": ["RF_receiver", "protocol_analyzer", "SDR"],
            "detection": "RF emission monitoring, protocol compliance testing, traffic analysis detection"
        }
    },

    "QIF-T0043": {
        "mechanism": "Malicious modification of BCI hardware or firmware during manufacturing, distribution, or maintenance",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, consent_tier="standard",
                         safety_ceiling="Supply chain verification; firmware signing; tamper-evident packaging",
                         regulations=["FDA 21 CFR 820", "IEC 62443", "NIST 800-161"]),
        "engineering": {
            "coupling": [],
            "parameters": {"attack_surface": "manufacturing_to_deployment", "persistence": "hardware_level"},
            "hardware": ["manufacturing_line", "firmware_update_system"],
            "detection": "Firmware attestation, hardware integrity verification, supply chain provenance tracking"
        }
    },

    "QIF-T0044": {
        "mechanism": "Compromise of cloud infrastructure processing BCI data (storage, compute, APIs)",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="End-to-end encryption; zero-knowledge processing; data residency controls",
                         regulations=["HIPAA", "GDPR", "SOC 2", "FedRAMP"]),
        "engineering": {
            "coupling": [],
            "parameters": {"attack_surface": "cloud_infrastructure", "data_at_risk": "neural_recordings"},
            "hardware": ["cloud_servers", "API_endpoints", "storage_systems"],
            "detection": "Cloud security monitoring, API anomaly detection, data access auditing"
        }
    },

    "QIF-T0045": {
        "mechanism": "Collection and storage of encrypted neural data for future decryption when quantum computers become available",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, consent_tier="enhanced",
                         safety_ceiling="Post-quantum cryptography (ML-KEM, ML-DSA) mandatory for neural data; 50+ year sensitivity window",
                         regulations=["NIST PQC standards", "CNSA 2.0", "proposed neural data protection acts"]),
        "engineering": {
            "coupling": [],
            "parameters": {"threat_horizon_years": "5-15 (quantum computing)", "data_sensitivity_years": "50+"},
            "hardware": ["data_storage", "network_capture"],
            "detection": "Encrypted traffic volume monitoring, data exfiltration detection, PQC migration tracking"
        }
    },

    "QIF-T0046": {
        "mechanism": "Weaponization of over-the-air firmware update mechanism to deliver malicious BCI firmware",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="Firmware signing mandatory; rollback capability; staged deployment"),
        "engineering": {
            "coupling": [],
            "parameters": {"attack_surface": "OTA_update_channel", "persistence": "firmware_level"},
            "hardware": ["update_server", "signing_infrastructure", "device_bootloader"],
            "detection": "Firmware signature verification, update integrity checks, behavioral monitoring post-update"
        }
    },

    "QIF-T0047": {
        "mechanism": "Simultaneous compromise of many BCI devices via shared platform vulnerability",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, consent_tier="enhanced",
                         safety_ceiling="Platform segmentation; device isolation capability; emergency disable",
                         regulations=["FDA postmarket surveillance", "IEC 62443", "CISA advisories"]),
        "engineering": {
            "coupling": [],
            "parameters": {"blast_radius": "all_devices_on_platform", "attack_surface": "shared_infrastructure"},
            "hardware": ["platform_infrastructure", "shared_services"],
            "detection": "Fleet-wide anomaly detection, platform integrity monitoring, segmentation verification"
        }
    },

    "QIF-T0048": {
        "mechanism": "Physical tampering with implanted or wearable BCI electrodes",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, consent_tier="enhanced",
                         safety_ceiling="Tamper-evident electrode packaging; impedance baseline monitoring; physical security"),
        "engineering": {
            "coupling": ["electromagnetic", "mechanical"],
            "parameters": {"access_required": "physical", "detectability": "impedance_change"},
            "hardware": ["electrode_array", "impedance_monitor", "tamper_detection_sensor"],
            "detection": "Impedance change detection, physical tamper indicators, electrode characterization drift"
        }
    },

    "QIF-T0049": {
        "mechanism": "Exploitation of weak or absent authentication on BCI wireless interfaces",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="Mutual authentication mandatory; encrypted pairing; session tokens"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"protocol": "BLE/WiFi/proprietary", "auth_weakness": "none_or_static_key"},
            "hardware": ["wireless_interface", "protocol_analyzer"],
            "detection": "Authentication attempt monitoring, unauthorized connection detection, pairing audit log"
        }
    },

    "QIF-T0050": {
        "mechanism": "Inducing hardware faults via voltage glitching, EM pulse, or laser injection to bypass BCI security",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_SILICON, safety_ceiling="Hardware security modules; fault detection circuits; redundant processing"),
        "engineering": {
            "coupling": ["electromagnetic", "optical"],
            "parameters": {"fault_type": "voltage_glitch/EM_pulse/laser", "target": "processor/memory/crypto"},
            "hardware": ["fault_injection_equipment", "oscilloscope", "EM_probe"],
            "detection": "Fault detection circuits, redundant computation verification, power rail monitoring"
        }
    },

    # ─── Data Exfiltration / Privacy ──────────────────────────────

    "QIF-T0051": {
        "mechanism": "Unauthorized access to or exfiltration of recorded neural data",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Clinical neural data management for treatment optimization",
            "conditions": ["treatment response tracking", "longitudinal disease monitoring", "clinical research"],
            "fda_status": "N/A",
            "evidence_level": "N/A",
            "safe_parameters": "Encryption at rest and in transit; access controls; data minimization; retention policies",
            "sources": ["Ienca & Andorno 2017 (Life Sci Soc Policy, neurorights)"]
        },
        "governance": gov(GOV_RECORDING, consent_tier="enhanced",
                         safety_ceiling="Data encryption mandatory; access logging; purpose limitation; right to deletion"),
        "engineering": {
            "coupling": [],
            "parameters": {"data_type": "neural_recordings", "sensitivity": "highest"},
            "hardware": ["storage_systems", "network_infrastructure", "access_control_systems"],
            "detection": "Data loss prevention, access anomaly detection, exfiltration monitoring"
        }
    },

    "QIF-T0052": {
        "mechanism": "Harvesting event-related potentials (ERPs) to extract cognitive responses to specific stimuli",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "ERP-based clinical diagnostics",
            "conditions": ["ADHD (P300 amplitude)", "Alzheimer's (MMN latency)", "schizophrenia (P50 gating)", "concussion assessment"],
            "fda_status": "cleared",
            "evidence_level": "meta_analysis",
            "safe_parameters": "Clinical protocol with defined stimulus sets; data used only for stated diagnostic purpose",
            "sources": ["Polich 2007 (Clin Neurophysiol, P300 review)", "Luck 2014 (MIT Press, ERP textbook)"]
        },
        "governance": gov(GOV_RECORDING, consent_tier="enhanced",
                         safety_ceiling="Stimulus sets disclosed; ERP data purpose-limited; no secondary use without consent"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"ERP_components": "P300, N400, MMN, P50", "trial_count": "50-200", "epoch_ms": "-200 to 800"},
            "hardware": ["EEG_acquisition", "stimulus_presentation", "ERP_averaging_software"],
            "detection": "Stimulus audit logging, unauthorized ERP extraction detection, data access monitoring"
        }
    },

    "QIF-T0053": {
        "mechanism": "Real-time capture and classification of cognitive states (attention, emotion, fatigue, deception) from BCI signals",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Brain-state dependent therapy timing",
            "conditions": ["attention training (ADHD)", "meditation guidance", "anesthesia depth monitoring", "fatigue detection"],
            "fda_status": "cleared",
            "evidence_level": "RCT",
            "safe_parameters": "State monitoring for therapeutic purpose only; no surveillance; patient controls data sharing",
            "sources": ["Dehais et al. 2019 (Front Hum Neurosci)", "Mühl et al. 2014 (Front Neurosci)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="enhanced",
                         safety_ceiling="Cognitive state data is sensitive; real-time deletion option; no employer/insurance access"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"classification_accuracy": "70-85%", "update_rate_hz": "1-10", "states": "attention/emotion/fatigue"},
            "hardware": ["EEG_acquisition", "real_time_classifier", "state_display"],
            "detection": "Classification audit logging, unauthorized state capture detection, data flow monitoring"
        }
    },

    "QIF-T0054": {
        "mechanism": "Extraction of memory-related neural patterns (episodic, semantic, or procedural) from BCI recordings",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Memory retrieval and consolidation enhancement therapy",
            "conditions": ["Alzheimer's (memory support)", "PTSD (targeted memory reactivation)", "amnesia rehabilitation"],
            "fda_status": "investigational",
            "evidence_level": "preclinical",
            "safe_parameters": "Memory-related protocols require specific consent; no covert extraction",
            "sources": ["Ramirez et al. 2013 (Science, optogenetic memory)", "Ngo et al. 2013 (Neuron, sleep memory consolidation)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="IRB",
                         safety_ceiling="Memory data is the most sensitive neural data category; enhanced protections mandatory"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"memory_type": "episodic/semantic/procedural", "decoding_accuracy": "research-grade"},
            "hardware": ["high_density_ECoG_or_depth_electrodes", "memory_decoder", "stimulus_system"],
            "detection": "Memory protocol audit logging, unauthorized access detection, hippocampal activity monitoring"
        }
    },

    "QIF-T0055": {
        "mechanism": "Coordinated manipulation of cognitive function across populations via compromised BCI infrastructure",
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": gov(GOV_PROHIBITED, safety_ceiling="Population-scale cognitive manipulation is categorically prohibited",
                         regulations=["Geneva Convention", "proposed neurorights legislation", "UN Universal Declaration of Human Rights"]),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"scale": "population", "target": "cognitive_function"},
            "hardware": ["compromised_BCI_platform", "coordination_infrastructure"],
            "detection": "Fleet-wide behavioral anomaly detection, cognitive assessment population baselines, whistleblower channels"
        }
    },

    "QIF-T0056": {
        "mechanism": "Continuous covert monitoring of neural activity for surveillance purposes",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Continuous EEG monitoring (epilepsy, ICU)",
            "conditions": ["status epilepticus monitoring", "ICU neurological monitoring", "long-term epilepsy monitoring"],
            "fda_status": "cleared",
            "evidence_level": "meta_analysis",
            "safe_parameters": "Clinical indication required; time-limited; patient informed; data retention policy",
            "sources": ["Claassen et al. 2013 (Neurology, continuous EEG monitoring)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="enhanced",
                         safety_ceiling="Surveillance without clinical indication prohibited; monitoring duration limited; data deletion after purpose fulfilled"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"duration": "continuous", "data_rate_kbps": "variable", "storage": "cloud_or_local"},
            "hardware": ["ambulatory_EEG", "data_transmission", "cloud_storage"],
            "detection": "Monitoring consent verification, duration limit enforcement, data retention audit"
        }
    },

    "QIF-T0057": {
        "mechanism": "Mapping BCI network topology, device capabilities, and communication pathways",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Brain network analysis for diagnosis and surgical planning",
            "conditions": ["epilepsy network mapping", "brain tumor connectivity", "connectome research"],
            "fda_status": "cleared",
            "evidence_level": "meta_analysis",
            "safe_parameters": "Passive network observation; no active probing without consent",
            "sources": ["Bullmore & Sporns 2009 (Nat Rev Neurosci, connectomics)"]
        },
        "governance": gov(GOV_RECORDING, safety_ceiling="Network topology is sensitive; access restricted; no external disclosure"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"method": "passive_observation_or_active_scan", "resolution": "device_level"},
            "hardware": ["network_scanner", "topology_mapper"],
            "detection": "Unauthorized scan detection, network probe monitoring, topology change alerting"
        }
    },

    # ─── Persistence / Evasion ────────────────────────────────────

    "QIF-T0058": {
        "mechanism": "Poisoning BCI calibration process to establish persistent attacker advantage",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Adaptive BCI calibration for patients with changing neural dynamics",
            "conditions": ["progressive neurological conditions", "post-stroke recovery", "pediatric BCI (growth adaptation)"],
            "fda_status": "investigational",
            "evidence_level": "cohort",
            "safe_parameters": "Calibration data integrity verification; multi-session validation; clinician review",
            "sources": ["Shenoy et al. 2013 (Annu Rev Neurosci, BCI calibration)"]
        },
        "governance": gov(GOV_STIM, consent_tier="enhanced",
                         safety_ceiling="Calibration integrity verification mandatory; historical baseline comparison; clinician sign-off"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"attack_surface": "calibration_session", "persistence": "until_recalibration"},
            "hardware": ["BCI_calibration_system", "data_integrity_monitor"],
            "detection": "Calibration data integrity hashing, cross-session consistency checks, performance drift monitoring"
        }
    },

    "QIF-T0059": {
        "mechanism": "Exploitation of learned neural pathway persistence to maintain BCI-mediated influence across sessions",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Motor learning and neural rehabilitation (learned pathway strengthening)",
            "conditions": ["stroke motor rehabilitation", "speech therapy", "BCI skill acquisition"],
            "fda_status": "cleared",
            "evidence_level": "RCT",
            "safe_parameters": "Therapeutic plasticity is the goal; monitor for maladaptive learning",
            "sources": ["Ganguly & Carmena 2009 (Nat Neurosci, BCI learning)", "Orsborn et al. 2014 (Neuron)"]
        },
        "governance": gov(GOV_STIM, consent_tier="enhanced",
                         safety_ceiling="Plasticity monitoring; maladaptive pattern detection; option to unlearn"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"persistence": "cross_session", "mechanism": "neuroplasticity"},
            "hardware": ["longitudinal_BCI_system", "performance_tracker"],
            "detection": "Cross-session performance pattern analysis, pathway stability monitoring, unlearning protocols"
        }
    },

    "QIF-T0060": {
        "mechanism": "Implanting persistent information into neural memory systems via BCI-mediated stimulation during consolidation",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Memory consolidation enhancement (targeted memory reactivation during sleep)",
            "conditions": ["PTSD (memory reconsolidation therapy)", "learning enhancement", "Alzheimer's (memory support)"],
            "fda_status": "investigational",
            "evidence_level": "preclinical",
            "safe_parameters": "Sleep-stage targeted; content-specific consent; reversibility assessment",
            "sources": ["Rasch et al. 2007 (Science, sleep memory reactivation)", "Oudiette & Paller 2013 (Front Psychol)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="IRB",
                         safety_ceiling="Memory modification requires highest-tier consent; content disclosure; reversibility plan"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"target_sleep_stage": "N3 (slow-wave)", "stimulation_type": "auditory/electrical cue", "timing": "consolidation_window"},
            "hardware": ["sleep_stage_monitor", "stimulus_delivery", "memory_assessment_tools"],
            "detection": "Sleep stage monitoring, stimulation audit logging, memory assessment tracking"
        }
    },

    "QIF-T0061": {
        "mechanism": "Generating signals that pass QIF coherence metric validation while carrying malicious payload",
        "dual_use": "possible",
        "clinical": {
            "therapeutic_analog": "Coherence-based neurofeedback (SMR/beta coherence training)",
            "conditions": ["ADHD (SMR training)", "autism (coherence normalization)", "traumatic brain injury"],
            "fda_status": "cleared",
            "evidence_level": "cohort",
            "safe_parameters": "Target coherence values within normal range; multi-metric validation",
            "sources": ["Coben & Myers 2010 (Appl Psychophysiol Biofeedback)", "Walker et al. 2002 (J Neurotherapy)"]
        },
        "governance": gov(GOV_STIM, safety_ceiling="Multi-metric validation (not coherence alone); behavioral correlation required"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"coherence_target": "0.6+ (QIF threshold)", "phase_precision": "high"},
            "hardware": ["signal_generator", "coherence_calculator", "phase_locked_loop"],
            "detection": "Multi-dimensional validation (coherence + spatial + temporal + spectral), anomaly detection beyond single metric"
        }
    },

    "QIF-T0062": {
        "mechanism": "Slow, sub-threshold modification of BCI parameters to avoid threshold-based detection",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Gradual dose titration in neurostimulation therapy",
            "conditions": ["DBS parameter optimization", "tDCS dosing protocols", "medication-like titration for neuromodulation"],
            "fda_status": "approved",
            "evidence_level": "RCT",
            "safe_parameters": "Clinician-supervised titration schedule; bounded parameter range; patient-reported outcomes",
            "sources": ["Volkmann et al. 2006 (Mov Disord, DBS programming)", "Kuo et al. 2014 (Brain Stimul)"]
        },
        "governance": gov(GOV_STIM, safety_ceiling="All parameter changes logged; rate-of-change limits enforced; cumulative displacement tracking"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"rate_of_change": "sub_threshold", "cumulative_displacement": "significant_over_time"},
            "hardware": ["parameter_monitoring_system", "rate_limiter", "cumulative_tracker"],
            "detection": "Cumulative drift detection, rate-of-change trending, baseline comparison over time"
        }
    },

    "QIF-T0063": {
        "mechanism": "Injection of noise into BCI data pipeline to mask ongoing attack signatures",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Stochastic resonance (SR) — adding noise to enhance weak signal detection",
            "conditions": ["sensory enhancement (hearing, touch)", "balance improvement in elderly", "neural signal amplification"],
            "fda_status": "investigational",
            "evidence_level": "RCT",
            "safe_parameters": "Optimal noise level determined per individual; below discomfort threshold",
            "sources": ["Moss et al. 2004 (Clin Neurophysiol, SR review)", "Collins et al. 2003 (Nature, noise-enhanced balance)"]
        },
        "governance": gov(GOV_STIM, safety_ceiling="Noise level bounded; patient comfort monitoring; no masking of safety-critical signals"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"noise_type": "Gaussian/pink/white", "SNR_impact_dB": "variable", "bandwidth_hz": "matched_to_signal"},
            "hardware": ["noise_generator", "injection_point", "SNR_monitor"],
            "detection": "SNR trending, noise spectrum analysis, signal integrity verification against known-clean baseline"
        }
    },

    "QIF-T0064": {
        "mechanism": "Flooding BCI user with permission requests until cognitive fatigue leads to reflexive approval",
        "dual_use": "possible",
        "clinical": {
            "therapeutic_analog": "UX design for cognitive accessibility in medical BCIs",
            "conditions": ["BCI usability for cognitively impaired users", "consent interface design"],
            "fda_status": "N/A",
            "evidence_level": "N/A",
            "safe_parameters": "Rate-limited permission requests; mandatory rest periods; simplified critical decisions",
            "sources": ["Felt et al. 2012 (SOUPS, permission fatigue in mobile)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="enhanced",
                         safety_ceiling="Permission request rate limiting; cognitive load assessment; critical decisions require heightened verification"),
        "engineering": {
            "coupling": [],
            "parameters": {"request_rate": "high_frequency", "target": "user_attention/decision_capacity"},
            "hardware": ["BCI_permission_system", "user_interface"],
            "detection": "Permission request rate monitoring, approval pattern analysis, cognitive load estimation"
        }
    },

    "QIF-T0065": {
        "mechanism": "Weaponization of algorithmic recommendation systems to induce psychotic-like cognitive states via BCI-amplified content",
        "dual_use": "possible",
        "clinical": {
            "therapeutic_analog": "Therapeutic content recommendation for mental health",
            "conditions": ["guided therapy content", "psychoeducation delivery", "digital therapeutics"],
            "fda_status": "cleared",
            "evidence_level": "RCT",
            "safe_parameters": "Content safety review; therapist oversight; user control over recommendations",
            "sources": ["Torous et al. 2019 (World Psychiatry, digital mental health)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="IRB",
                         safety_ceiling="BCI-amplified content requires safety review; mental health screening; opt-out always available"),
        "engineering": {
            "coupling": [],
            "parameters": {"amplification_factor": "BCI_adds_direct_neural_pathway", "content_type": "algorithmic"},
            "hardware": ["recommendation_engine", "BCI_content_delivery", "safety_filter"],
            "detection": "Content safety scoring, user mental health monitoring, recommendation diversity enforcement"
        }
    },

    # ─── Phase Dynamics (Derivation Log Entry 45) ─────────────────

    "QIF-T0066": {
        "mechanism": "Adiabatic parameter manipulation along neural phase space paths that avoid detection thresholds",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Slow DBS parameter optimization (adiabatic adjustment protocols)",
            "conditions": ["Parkinson's (gradual optimization)", "chronic pain management", "treatment-resistant depression"],
            "fda_status": "approved",
            "evidence_level": "cohort",
            "safe_parameters": "Parameter changes along validated trajectories; rate limits; cumulative bounds",
            "sources": ["Rosin et al. 2011 (Neuron, closed-loop DBS)", "Malekmohammadi et al. 2016 (Neuromodulation)"]
        },
        "governance": gov(GOV_STIM, consent_tier="enhanced",
                         safety_ceiling="All trajectory changes logged; Lyapunov exponent monitoring; cumulative displacement bounds"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"rate_of_change": "sub_detection_threshold", "trajectory": "phase_space_path", "lyapunov_monitoring": "mandatory"},
            "hardware": ["phase_space_tracker", "parameter_controller", "Lyapunov_estimator"],
            "detection": "Phase space trajectory curvature monitoring, Lyapunov exponent trending, cumulative displacement tracking"
        }
    },

    "QIF-T0067": {
        "mechanism": "Replay or synthesis of neural signal trajectories that reproduce legitimate dynamical system behavior",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Sensory prosthetics (cochlear implants, retinal prostheses, somatosensory feedback)",
            "conditions": ["deafness (cochlear implant)", "blindness (retinal prosthesis)", "phantom limb pain (sensory replay)"],
            "fda_status": "approved",
            "evidence_level": "RCT",
            "safe_parameters": "Clinically validated stimulation patterns; patient-specific calibration; safety bounds on current",
            "sources": ["Zeng et al. 2008 (IEEE Rev Biomed Eng, cochlear)", "da Cruz et al. 2013 (BJO, Argus II retinal)"]
        },
        "governance": gov(GOV_STIM, consent_tier="enhanced",
                         safety_ceiling="Only clinically validated patterns; biological TLS authentication on replay source; NSP L1-L6 validation"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"pattern_source": "recorded_or_GAN_synthesized", "validation": "biological_TLS", "fidelity": "dynamical_attractor_match"},
            "hardware": ["pattern_generator_or_GAN", "stimulation_array", "NSP_validator"],
            "detection": "Biological TLS (spatial dipole, H-H compliance, 1/f scaling, microstate, challenge-response), phase space attractor validation"
        }
    },

    "QIF-T0068": {
        "mechanism": "Manipulation of neural parameters toward bifurcation points to trigger catastrophic state transitions",
        "dual_use": "confirmed",
        "clinical": {
            "therapeutic_analog": "Responsive neurostimulation at seizure bifurcation (RNS/NeuroPace)",
            "conditions": ["epilepsy (detect and abort seizure onset)", "Parkinson's (prevent freezing episodes)"],
            "fda_status": "approved",
            "evidence_level": "RCT",
            "safe_parameters": "Critical slowing down detection; stimulate AWAY from bifurcation, not toward it",
            "sources": ["Maturana et al. 2020 (Brain, CSD biomarker)", "Jirsa et al. 2014 (Brain, seizure dynamics)"]
        },
        "governance": gov(GOV_STIM, consent_tier="IRB",
                         safety_ceiling="Bifurcation parameter boundaries enforced; CSD monitoring mandatory; stimulation pushes AWAY from critical points"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"bifurcation_type": "saddle-node/Hopf/homoclinic", "CSD_metrics": "autocorrelation+variance", "intervention": "push_away"},
            "hardware": ["CSD_monitor", "real_time_processor", "responsive_stimulator"],
            "detection": "Critical slowing down (autocorrelation + variance trending), parameter boundary monitoring, state transition prediction"
        }
    },

    "QIF-T0069": {
        "mechanism": "Extraction of individual neural identity from dynamical system transition observations (separatrix geometry fingerprinting)",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Brain state detection for seizure prediction (transition pattern monitoring)",
            "conditions": ["epilepsy seizure prediction", "sleep stage transition detection", "anesthesia depth monitoring"],
            "fda_status": "investigational",
            "evidence_level": "cohort",
            "safe_parameters": "Transition monitoring for clinical purpose only; identity data encrypted separately",
            "sources": ["Finn et al. 2015 (Nat Neurosci, connectome fingerprinting)", "Cook et al. 2013 (Lancet Neurol, seizure prediction)"]
        },
        "governance": gov(GOV_COGNITIVE, consent_tier="enhanced",
                         safety_ceiling="Dynamical fingerprint data is biometric; encrypted storage; no secondary use without consent"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"method": "phase_space_reconstruction", "features": "separatrix_geometry+attractor_basins"},
            "hardware": ["multichannel_recording", "phase_space_reconstructor", "transition_detector"],
            "detection": "Transition rate monitoring, probe pattern detection, unauthorized phase space analysis detection"
        }
    },

    "QIF-T0070": {
        "mechanism": "Switching neurons between integrator and resonator computational modes via sustained tonic current injection",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Excitability modulation in epilepsy and pain management",
            "conditions": ["epilepsy (reduce excitability)", "chronic pain (modulate firing mode)", "tinnitus (cortical excitability)"],
            "fda_status": "investigational",
            "evidence_level": "preclinical",
            "safe_parameters": "Bounded tonic current; firing mode monitoring; reversibility verification",
            "sources": ["Izhikevich 2007 (Dynamical Systems in Neuroscience)", "Prescott et al. 2008 (PLoS Comp Biol)"]
        },
        "governance": gov(GOV_STIM, consent_tier="IRB",
                         safety_ceiling="Computational mode changes are potentially irreversible; monitoring mandatory; bounded current injection"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"current_type": "tonic (sustained DC)", "target": "excitability_mode", "monitoring": "ISI_distributions"},
            "hardware": ["constant_current_source", "firing_mode_classifier", "ISI_analyzer"],
            "detection": "Interspike interval distribution analysis, firing mode classification, tonic current monitoring"
        }
    },

    "QIF-T0071": {
        "mechanism": "Exploitation of BCI re-enrollment windows to inject poisoned baseline neural data",
        "dual_use": "probable",
        "clinical": {
            "therapeutic_analog": "Adaptive baseline recalibration for changing patient conditions",
            "conditions": ["progressive neurological disease", "medication changes affecting neural signals", "post-surgical BCI recalibration"],
            "fda_status": "investigational",
            "evidence_level": "cohort",
            "safe_parameters": "Multi-session baseline verification; clinician-supervised re-enrollment; integrity checks",
            "sources": ["Shenoy et al. 2013 (Annu Rev Neurosci)", "Orsborn et al. 2014 (Neuron, closed-loop adaptation)"]
        },
        "governance": gov(GOV_STIM, consent_tier="enhanced",
                         safety_ceiling="Re-enrollment windows are security-critical; multi-factor verification; historical baseline comparison mandatory"),
        "engineering": {
            "coupling": ["electromagnetic"],
            "parameters": {"attack_surface": "re-enrollment_window", "persistence": "until_next_recalibration"},
            "hardware": ["baseline_recording_system", "integrity_verifier", "historical_baseline_store"],
            "detection": "Baseline-free biological TLS (eliminates baseline dependency), historical comparison, multi-session validation"
        }
    },
}


def main():
    # Load current registry
    with open(REGISTRY_PATH) as f:
        registry = json.load(f)

    # Update version
    registry["version"] = "4.0"

    # Add TARA spec
    registry["tara_spec"] = TARA_SPEC

    # Enrich techniques
    enriched = 0
    missing = []
    for technique in registry["techniques"]:
        tid = technique["id"]
        if tid in TARA:
            technique["tara"] = TARA[tid]
            enriched += 1
        else:
            missing.append(tid)

    # Update statistics
    dual_use_counts = {"confirmed": 0, "probable": 0, "possible": 0, "silicon_only": 0}
    clinical_count = 0
    for technique in registry["techniques"]:
        tara = technique.get("tara")
        if tara:
            du = tara.get("dual_use", "silicon_only")
            dual_use_counts[du] = dual_use_counts.get(du, 0) + 1
            if tara.get("clinical") is not None:
                clinical_count += 1

    registry["statistics"]["tara"] = {
        "version": "1.0",
        "enriched_techniques": enriched,
        "dual_use_breakdown": dual_use_counts,
        "techniques_with_clinical_analog": clinical_count,
        "techniques_silicon_only": dual_use_counts.get("silicon_only", 0),
    }

    # Write updated registry
    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"TARA enrichment complete:")
    print(f"  Enriched: {enriched}/{len(registry['techniques'])} techniques")
    print(f"  Missing:  {len(missing)} ({', '.join(missing) if missing else 'none'})")
    print(f"  Dual-use: {dual_use_counts}")
    print(f"  Clinical analogs: {clinical_count}")
    print(f"  Written to: {REGISTRY_PATH}")


if __name__ == "__main__":
    main()
