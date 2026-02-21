# Neurosim

> **QIF Module — Neurosim**
> **Status:** v0.1 (Initial)
> **Date:** 2026-02-21
> **Parent Framework:** [QIF v4.0 Hourglass](../../qif-framework/README.md) / [Neurowall](../neurowall/README.md)

Neurosim is a neural signal simulation toolkit for testing BCI security defenses. It generates synthetic attack signals mapped to the QIF TARA registry and validates detection pipelines.

## Components

| Directory | Description |
| :--- | :--- |
| [qif-attack-simulator/](./qif-attack-simulator/) | Attack signal generators organized by QIF-T technique ID. Each generator produces synthetic EEG with a specific attack pattern for testing against Neurowall's 3-layer pipeline. |

## Relationship to Neurowall

Neurosim generates attack signals. Neurowall detects them. They are separate tools:

- **Neurowall** (`tools/neurowall/`) owns the detection pipeline: L1 signal boundary, L2 differential privacy, L3 coherence monitor, NISS scoring, NSP transport.
- **Neurosim** (`tools/neurosim/`) owns the attack generation: TARA-mapped signal generators, NIC chain metadata, scenario orchestration.

The existing `neurowall/test_nic_chains.py` serves as the integration test harness that wires Neurosim generators to the Neurowall pipeline.
