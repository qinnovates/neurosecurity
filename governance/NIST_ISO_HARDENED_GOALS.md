---
title: "NIST/ISO Hardened Goals for Neural Security"
description: "Strategic goals for integrating NIST SP 800-53 and ISO/IEC 27001 controls into QIF"
order: 12
---

# NIST/ISO Hardened Goals for Neural Security

This document outlines the strategic goals for integrating NIST SP 800-53 and ISO/IEC 27001 controls into the Quantified Interconnection Framework (QIF) as a "hardened" validation layer.

## The Objective

The primary goal is to provide a standardized, machine-verifiable bridge between high-level ethical frameworks (like UNESCO Neurorights or the CCPA Neurorights Act) and low-level technical evidence (like firewall logs and encryption headers).

## Why "Hardened"?

The term **"Hardened Mapping"** distinguishes typical documentation-only compliance from **Evidence-Based Compliance**.

1.  **Auditable Evidence**: Instead of simply claiming "we protect mental privacy," the hardened mapping specifies exactly which log file (`anonymizer.log`) and which filter count confirms the privacy enforcement.
2.  **Machine-Readable Registry**: By embedding NIST/ISO codes directly into the `qtara-registrar.json`, the QIF framework enables automated compliance auditing tools to "crawl" the neuro-attack surface and verify control coverage.
3.  **Cross-Jurisdictional Stability**: Framework codes from NIST and ISO provide a stable taxonomy that remains relevant regardless of whether the governing law is CCPA, GDPR, or a future federal MIND Act.

## Key Goals

### 1. Standardizing Technical Evidence
Assign specific, traceable log signatures to every neuroright. For example:
- **Cognitive Liberty** → Verified by **Temporal Aggregation Logs (TALs)** logging reject counts for unauthenticated neural signals (NIST AC-3).
- **Mental Privacy** → Verified by **TALs** recording differential privacy metrics (NIST SC-28).

### 2. Bridging the "Scoring Standard Gap"
NIST/ISO controls provide the infrastructure for risk management, while TARA (Threat Assessment for Neural Assets) provides the specific threat taxonomy. The goal is to make TARA the "CVSS for Brains" that regulators can trust by anchoring it in established NIST/ISO methodologies.

### 3. Automated Regulatory-as-Code (RaC)
In future phases, the hardened mapping will allow BCI devices to self-report compliance status to a secure enclave, using the NIST/ISO codes as the "reporting dialect."

## Hardened Policy Matrix (NISS-to-NIST/ISO Mapping)

To ensure technical accountability, QIF enforces a mandatory mapping between **Neural Impact Severity** and **Hardened Controls**. This ensures that high-risk neural vulnerabilities are met with proportional, auditable technical evidence.

| NISS Metric/Threshold | Mandatory Hardened Control | Technical Evidence (Example) | Requirement Level |
| :--- | :--- | :--- | :--- |
| **PINS Flag = True** | **NIST SI-4 (Information System Monitoring)** | Real-time neural telemetry stream via **TAL**. | **CRITICAL** |
| **Biological Impact (BI) &ge; H** | **NIST AC-3 (Access Control)** | **TAL - Neural Firewall**: Deny/Permit by band. | **MANDATORY** |
| **Mental Privacy (MP) &ge; H** | **NIST SC-28 (Protection of Info at Rest)** | **TAL - Anonymizer**: Differential privacy logs. | **MANDATORY** |
| **Cognitive Integrity (CG) &ge; H** | **NIST SI-7 (Software/Firmware Integrity)** | cryptographically signed neural stimulation staves. | **MANDATORY** |
| **Consent Violation (CV) = Implicit**| **ISO/IEC 27001 A.18.1.1 (Compliance)** | Formal audit log of real-time consent handshake. | **MANDATORY** |
| **NISS Score &ge; 7.0 (High)** | **ISO/IEC 27001 A.12.4.1 (Logging)** | Comprehensive system/neural audit log (TAL) retention. | **MANDATORY** |

## Neural Regulatory-as-Code (RaC) Integration

By anchoring NISS scores in NIST/ISO controls, QIF moves from an assessment tool to an **Enforcement Platform**.

- **Detection-to-Evidence**: When the **Neural Firewall** detects an attack (e.g., T0001: Signal Jamming), it does not just block it; it tags the event with the corresponding NIST AC-3 control ID for the compliance report in the **TAL**.
- **Automated Auditing**: Regulators can query the framework for "Evidence of NIST SC-28 compliance" and receive a pre-filtered log of all differentially private neural transfers via the **Temporal Aggregation Log**.

## Implementation Note

The `hardened_mapping` field has been added to the `qtara-registrar.json` for key techniques (e.g., QIF-T0001, QIF-T0002) to demonstrate this architecture in practice.
