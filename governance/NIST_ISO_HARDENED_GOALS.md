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
- **Cognitive Liberty** → Verified by `firewall.log` reject counts for unauthenticated neural signals (NIST AC-3).
- **Mental Privacy** → Verified by `anonymizer.log` differential privacy logs (NIST SC-28).

### 2. Bridging the "Scoring Standard Gap"
NIST/ISO controls provide the infrastructure for risk management, while TARA (Threat Assessment for Neural Assets) provides the specific threat taxonomy. The goal is to make TARA the "CVSS for Brains" that regulators can trust by anchoring it in established NIST/ISO methodologies.

### 3. Automated Regulatory-as-Code (RaC)
In future phases, the hardened mapping will allow BCI devices to self-report compliance status to a secure enclave, using the NIST/ISO codes as the "reporting dialect."

## Implementation Note

The `hardened_mapping` field has been added to the `qtara-registrar.json` for key techniques (e.g., QIF-T0001, QIF-T0002) to demonstrate this architecture in practice.
