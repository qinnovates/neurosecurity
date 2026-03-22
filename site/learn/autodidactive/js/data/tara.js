// Autodidactive — TARA Threat Atlas Data
// Source: shared/qtara-registrar.json v4.0

export const TARA_STATS = {
  "total_techniques": 109,
  "total_tactics": 16,
  "total_domains": 8,
  "by_tactic": {
    "QIF-N.IJ": 8,
    "QIF-P.DS": 8,
    "QIF-D.HV": 9,
    "QIF-N.MD": 6,
    "QIF-E.RD": 6,
    "QIF-M.SV": 9,
    "QIF-N.SC": 3,
    "QIF-C.EX": 12,
    "QIF-B.IN": 6,
    "QIF-C.IM": 5,
    "QIF-B.EV": 6,
    "QIF-S.RP": 5,
    "QIF-S.HV": 14,
    "QIF-S.FP": 4,
    "QIF-S.CH": 6,
    "QIF-S.SC": 2
  },
  "by_status": {
    "CONFIRMED": 19,
    "EMERGING": 22,
    "DEMONSTRATED": 35,
    "THEORETICAL": 31,
    "PLAUSIBLE": 1,
    "SPECULATIVE": 1
  },
  "by_severity": {
    "high": 60,
    "critical": 29,
    "medium": 17,
    "low": 3
  },
  "by_ui_category": {
    "SI": 13,
    "DS": 8,
    "SE": 20,
    "DM": 15,
    "PS": 7,
    "EX": 19,
    "PE": 9,
    "CI": 18
  },
  "by_niss_severity": {
    "critical": 0,
    "high": 21,
    "medium": 35,
    "low": 52,
    "none": 1
  },
  "niss_cvss_mapping": {
    "pins_flagged": 33,
    "by_gap_group": {
      "1": 12,
      "2": 28,
      "3": 58
    }
  },
  "tara": {
    "version": "1.7",
    "enriched_techniques": 103,
    "dual_use_breakdown": {
      "confirmed": 52,
      "probable": 16,
      "possible": 9,
      "silicon_only": 25
    },
    "techniques_with_clinical_analog": 77,
    "techniques_silicon_only": 25,
    "dsm5": {
      "version": "1.0",
      "techniques_with_dsm5": 102,
      "unique_dsm_codes": 15,
      "cluster_breakdown": {
        "motor_neurocognitive": 16,
        "cognitive_psychotic": 16,
        "mood_trauma": 21,
        "non_diagnostic": 42,
        "persistent_personality": 7
      },
      "risk_class_breakdown": {
        "direct": 51,
        "indirect": 9,
        "none": 42
      }
    },
    "neurorights_mapped": 102
  },
  "neurorights": {
    "version": "1.0",
    "taxonomy": {
      "MP": "Mental Privacy",
      "CL": "Cognitive Liberty",
      "MI": "Mental Integrity",
      "PC": "Psychological Continuity"
    },
    "sources": [
      "Ienca & Andorno 2017 (original 4: MP, CL, MI, PC)",
      "QIF Framework (MI extended with signal dynamics, MP extended with data lifecycle)"
    ],
    "techniques_by_right": {
      "CL": 60,
      "MI": 81,
      "MP": 64,
      "PC": 28
    },
    "cci_stats": {
      "mean": 1.01,
      "max": 2.7,
      "min": 0.1,
      "techniques_above_2": 11
    }
  },
  "regulatory": {
    "version": "1.0",
    "framework": "FDORA Section 3305 / Section 524B",
    "cyber_device_techniques": 67,
    "non_cyber_device_techniques": 35,
    "prong_failure_reasons": {
      "software": 29,
      "network_connectable": 10
    },
    "techniques_per_requirement": {
      "TM": 102,
      "VA": 101,
      "SA": 76,
      "SBOM": 61,
      "PM": 98
    },
    "coverage_stats": {
      "mean": 0.48,
      "min": 0.1,
      "max": 0.8,
      "below_0.5": 41
    },
    "top_gaps": {
      "CVSS cannot express neural-specific impacts": 58,
      "No FDA pathway for consumer sensor exploitation": 42,
      "CVSS partially captures risk; neural dimensions missing": 30,
      "Threat not yet in regulatory threat catalogs": 28,
      "High neural impact": 20,
      "Software-only attack without software lifecycle standard": 13,
      "Consent complexity under-matches neural impact": 11
    }
  },
  "physics_feasibility": {
    "version": "1.0",
    "analysis_date": "2026-02-18",
    "constraint_system_ref": "QIF Derivation Log Entry 60",
    "by_tier": {
      "feasible_now": 61,
      "mid_term": 10,
      "far_term": 2,
      "no_physics_gate": 18,
      "near_term": 11
    },
    "notes": [
      "Tier 0 (feasible_now): Attack hardware exists today",
      "Tier 1 (near_term, 2026-2031): Components exist but integration is new",
      "Tier 2 (mid_term, 2031-2038): Needs 28nm-7nm BCI chips, 10k+ channels, or high-density bidirectional",
      "Tier 3 (far_term, 2038+): Needs nanoscale electrodes or quantum-regime hardware",
      "Tier X (no_physics_gate): Software/platform/network attack, physics does not constrain"
    ]
  },
  "by_origin": {
    "literature": 49,
    "qif_recontextualized": 46,
    "neuroethics_formalized": 3,
    "qif_theoretical": 6,
    "qif_chain_synthesis": 5
  }
};

export const TARA_TECHNIQUES = [
  {"id": "QIF-T0001", "name": "", "tactic": "QIF-N.IJ", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["I0\u2013N1"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0002", "name": "", "tactic": "QIF-P.DS", "description": "", "status": "EMERGING", "severity": "critical", "bands": ["N3\u2013N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0003", "name": "", "tactic": "QIF-D.HV", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["I0\u2013S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0004", "name": "", "tactic": "QIF-D.HV", "description": "", "status": "DEMONSTRATED", "severity": "critical", "bands": ["I0\u2013S2"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0005", "name": "", "tactic": "QIF-N.IJ", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["I0\u2013N1"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0006", "name": "", "tactic": "QIF-N.IJ", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["I0\u2013N1"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0007", "name": "", "tactic": "QIF-N.IJ", "description": "", "status": "DEMONSTRATED", "severity": "medium", "bands": ["S1\u2013S2"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0008", "name": "", "tactic": "QIF-N.IJ", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["S2\u2013N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0009", "name": "", "tactic": "QIF-N.MD", "description": "", "status": "EMERGING", "severity": "high", "bands": ["S1\u2013S2\u2192N4\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0010", "name": "", "tactic": "QIF-E.RD", "description": "", "status": "CONFIRMED", "severity": "critical", "bands": ["S1\u2192N4\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0011", "name": "", "tactic": "QIF-E.RD", "description": "", "status": "THEORETICAL", "severity": "critical", "bands": ["S2\u2192N4\u2013N6"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0012", "name": "", "tactic": "QIF-E.RD", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["S3\u2192N2,N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0013", "name": "", "tactic": "QIF-E.RD", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S2\u2192N4\u2013N6"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0014", "name": "", "tactic": "QIF-E.RD", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2013S2\u2192any N"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0015", "name": "", "tactic": "QIF-E.RD", "description": "", "status": "CONFIRMED", "severity": "critical", "bands": ["S3\u2192I0"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0016", "name": "", "tactic": "QIF-M.SV", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S2"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0017", "name": "", "tactic": "QIF-M.SV", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S2"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0018", "name": "", "tactic": "QIF-M.SV", "description": "", "status": "DEMONSTRATED", "severity": "medium", "bands": ["S1\u2013S2"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0019", "name": "", "tactic": "QIF-M.SV", "description": "", "status": "DEMONSTRATED", "severity": "medium", "bands": ["S1\u2013S2"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0020", "name": "", "tactic": "QIF-M.SV", "description": "", "status": "EMERGING", "severity": "medium", "bands": ["S2\u2013S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0021", "name": "", "tactic": "QIF-M.SV", "description": "", "status": "EMERGING", "severity": "medium", "bands": ["S2\u2013S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0022", "name": "", "tactic": "QIF-M.SV", "description": "", "status": "EMERGING", "severity": "high", "bands": ["S2\u2192N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0023", "name": "", "tactic": "QIF-M.SV", "description": "", "status": "EMERGING", "severity": "critical", "bands": ["S2\u2192I0\u2192N5\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0024", "name": "", "tactic": "QIF-M.SV", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S2"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0025", "name": "", "tactic": "QIF-P.DS", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["I0\u2192N2\u2013N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0026", "name": "", "tactic": "QIF-P.DS", "description": "", "status": "THEORETICAL", "severity": "critical", "bands": ["I0\u2192N4\u2013N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0027", "name": "", "tactic": "QIF-N.SC", "description": "", "status": "THEORETICAL", "severity": "medium", "bands": ["I0\u2192N4\u2013N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0028", "name": "", "tactic": "QIF-N.MD", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["I0\u2013S1"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0029", "name": "", "tactic": "QIF-P.DS", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["I0\u2192N4\u2013N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0030", "name": "", "tactic": "QIF-N.MD", "description": "", "status": "THEORETICAL", "severity": "critical", "bands": ["I0\u2192N5\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0031", "name": "", "tactic": "QIF-P.DS", "description": "", "status": "THEORETICAL", "severity": "medium", "bands": ["S1\u2013S2"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0032", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "EMERGING", "severity": "high", "bands": ["N3\u2013N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0033", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "THEORETICAL", "severity": "critical", "bands": ["N6\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0034", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["N6\u2013N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0035", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0036", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "DEMONSTRATED", "severity": "critical", "bands": ["N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0037", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "THEORETICAL", "severity": "critical", "bands": ["N5\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0038", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "EMERGING", "severity": "high", "bands": ["N6\u2013N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0039", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "THEORETICAL", "severity": "critical", "bands": ["N6\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0040", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "EMERGING", "severity": "high", "bands": ["S3\u2192N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0041", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["N6\u2013N7\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0042", "name": "", "tactic": "QIF-N.SC", "description": "", "status": "CONFIRMED", "severity": "medium", "bands": ["S1\u2013S2"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0043", "name": "", "tactic": "QIF-B.IN", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["S2\u2013S3"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0044", "name": "", "tactic": "QIF-B.IN", "description": "", "status": "CONFIRMED", "severity": "medium", "bands": ["S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0045", "name": "", "tactic": "QIF-D.HV", "description": "", "status": "CONFIRMED", "severity": "critical", "bands": ["S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0046", "name": "", "tactic": "QIF-C.IM", "description": "", "status": "EMERGING", "severity": "high", "bands": ["S2\u2013S3"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0047", "name": "", "tactic": "QIF-P.DS", "description": "", "status": "EMERGING", "severity": "critical", "bands": ["S2\u2013S3"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0048", "name": "", "tactic": "QIF-B.IN", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["I0"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0049", "name": "", "tactic": "QIF-B.IN", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["S2\u2013S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0050", "name": "", "tactic": "QIF-B.IN", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2013S2"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0051", "name": "", "tactic": "QIF-D.HV", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["N1\u2013S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0052", "name": "", "tactic": "QIF-D.HV", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["N6\u2013N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0053", "name": "", "tactic": "QIF-D.HV", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["N6\u2013N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0054", "name": "", "tactic": "QIF-D.HV", "description": "", "status": "THEORETICAL", "severity": "critical", "bands": ["N6\u2013N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0055", "name": "", "tactic": "QIF-P.DS", "description": "", "status": "EMERGING", "severity": "critical", "bands": ["S3\u2192N4\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0056", "name": "", "tactic": "QIF-D.HV", "description": "", "status": "EMERGING", "severity": "high", "bands": ["N6\u2013N7\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0057", "name": "", "tactic": "QIF-N.SC", "description": "", "status": "CONFIRMED", "severity": "low", "bands": ["S2\u2013S3"], "dualUse": "", "niss_severity": "none"},
  {"id": "QIF-T0058", "name": "", "tactic": "QIF-C.IM", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2013S2"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0059", "name": "", "tactic": "QIF-C.IM", "description": "", "status": "THEORETICAL", "severity": "medium", "bands": ["S1\u2013S2\u2192N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0060", "name": "", "tactic": "QIF-C.IM", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["N6\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0061", "name": "", "tactic": "QIF-B.EV", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["I0\u2013S1"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0062", "name": "", "tactic": "QIF-B.EV", "description": "", "status": "THEORETICAL", "severity": "medium", "bands": ["S1\u2192N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0063", "name": "", "tactic": "QIF-B.EV", "description": "", "status": "THEORETICAL", "severity": "medium", "bands": ["I0\u2013S1"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0064", "name": "", "tactic": "QIF-B.EV", "description": "", "status": "EMERGING", "severity": "medium", "bands": ["S2\u2013S3\u2192N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0065", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "CONFIRMED", "severity": "critical", "bands": ["S3\u2192S2\u2192N5\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0066", "name": "", "tactic": "QIF-B.EV", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["I0\u2192N1\u2013N7"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0067", "name": "", "tactic": "QIF-N.IJ", "description": "", "status": "DEMONSTRATED", "severity": "critical", "bands": ["S1\u2192I0\u2192N1\u2013N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0068", "name": "", "tactic": "QIF-N.MD", "description": "", "status": "EMERGING", "severity": "critical", "bands": ["I0\u2192N1\u2013N5"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0069", "name": "", "tactic": "QIF-D.HV", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["N3\u2013N7\u2192I0\u2192S1"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0070", "name": "", "tactic": "QIF-N.MD", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["I0\u2192N1\u2013N4"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0071", "name": "", "tactic": "QIF-C.IM", "description": "", "status": "EMERGING", "severity": "high", "bands": ["S1\u2192S2\u2192I0"], "dualUse": "", "niss_severity": "high"},
  {"id": "QIF-T0072", "name": "", "tactic": "QIF-S.RP", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0073", "name": "", "tactic": "QIF-S.RP", "description": "", "status": "EMERGING", "severity": "critical", "bands": ["S1\u2192I0\u2192N1\u2013N3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0074", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "EMERGING", "severity": "critical", "bands": ["N3\u2013N7\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0075", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0076", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "THEORETICAL", "severity": "medium", "bands": ["S1\u2192S2"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0077", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "EMERGING", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0078", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0079", "name": "", "tactic": "QIF-S.FP", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0080", "name": "", "tactic": "QIF-S.RP", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0081", "name": "", "tactic": "QIF-S.RP", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0082", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0083", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0084", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0085", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "DEMONSTRATED", "severity": "critical", "bands": ["S1\u2192S2\u2192N3\u2192N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0086", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "DEMONSTRATED", "severity": "medium", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0087", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0088", "name": "", "tactic": "QIF-S.FP", "description": "", "status": "CONFIRMED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0089", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "DEMONSTRATED", "severity": "critical", "bands": ["S1\u2192S2\u2192N1\u2192N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0090", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "DEMONSTRATED", "severity": "critical", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0091", "name": "", "tactic": "QIF-S.FP", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0092", "name": "", "tactic": "QIF-S.HV", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2192S2\u2192N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0093", "name": "", "tactic": "QIF-S.FP", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0094", "name": "", "tactic": "QIF-S.RP", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0095", "name": "", "tactic": "QIF-S.CH", "description": "", "status": "EMERGING", "severity": "critical", "bands": ["S1\u2192S2\u2192S3\u2192I0\u2192N1\u2192N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0096", "name": "", "tactic": "QIF-S.CH", "description": "", "status": "EMERGING", "severity": "critical", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0097", "name": "", "tactic": "QIF-S.CH", "description": "", "status": "THEORETICAL", "severity": "critical", "bands": ["S1\u2192S2\u2192S3\u2192N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0098", "name": "", "tactic": "QIF-S.CH", "description": "", "status": "EMERGING", "severity": "critical", "bands": ["S1\u2192S2\u2192S3"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0099", "name": "", "tactic": "QIF-S.CH", "description": "", "status": "THEORETICAL", "severity": "critical", "bands": ["S1\u2192S2\u2192S3\u2192I0\u2192N1\u2192N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0100", "name": "", "tactic": "QIF-S.CH", "description": "", "status": "PLAUSIBLE", "severity": "low", "bands": ["S3\u2192S1\u2192I0\u2192N1\u2192N4\u2192N7"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0101", "name": "", "tactic": "QIF-S.SC", "description": "", "status": "DEMONSTRATED", "severity": "medium", "bands": ["S3\u2192S2\u2192S1"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0102", "name": "", "tactic": "QIF-S.SC", "description": "", "status": "SPECULATIVE", "severity": "low", "bands": ["S3\u2192S2"], "dualUse": "", "niss_severity": "low"},
  {"id": "QIF-T0103", "name": "", "tactic": "QIF-C.EX", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["S3\u2192N7"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0104", "name": "", "tactic": "QIF-N.IJ", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["I0-N1"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0105", "name": "", "tactic": "QIF-N.IJ", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["I0-N1"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0106", "name": "", "tactic": "QIF-P.DS", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["I0-N2"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0107", "name": "", "tactic": "QIF-N.MD", "description": "", "status": "THEORETICAL", "severity": "high", "bands": ["I0-N1"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0108", "name": "", "tactic": "QIF-B.IN", "description": "", "status": "DEMONSTRATED", "severity": "high", "bands": ["N3-N5"], "dualUse": "", "niss_severity": "medium"},
  {"id": "QIF-T0109", "name": "", "tactic": "QIF-B.EV", "description": "", "status": "THEORETICAL", "severity": "medium", "bands": ["N3-N5"], "dualUse": "", "niss_severity": "low"},
];
