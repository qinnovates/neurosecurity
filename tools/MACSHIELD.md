# macshield

> **Not for institutional or clinical use.** If you work in an enterprise, research lab, or clinical setting handling PII, neural recordings, HIPAA-covered data, or any sensitive research data, you must use your organization's corporate VPN, managed devices, and enterprise security policies. macshield is not a substitute for institutional security infrastructure.

macshield is for **students, independent researchers, and individuals** who want baseline device hardening on public WiFi but don't have access to corporate security tools or paid VPN subscriptions. If you're studying at a cafe, working from a hotel, or on campus WiFi, macshield protects you at the network layer that even a VPN can't reach.

**Repository:** [github.com/qinnovates/macshield](https://github.com/qinnovates/macshield)

## What It Does

macshield automatically hardens your Mac when you connect to untrusted WiFi and relaxes protections when you're on a network you've marked as trusted (home, office). Three things happen on untrusted networks:

1. **Hostname randomization** — replaces your real name (e.g., "Kevin's MacBook Pro") with a generic device name so you're not identifiable on the local network
2. **Stealth mode** — silently drops ICMP pings, ARP probes, and port scans from other devices
3. **NetBIOS disabled** — stops broadcasting your device name on ports 137/138

## Why It Exists

VPNs encrypt traffic at Layer 3+, but the attacks above happen at Layer 2 (the local network), below the VPN tunnel. A VPN cannot block ARP spoofing, hostname discovery, or NetBIOS enumeration. In the [QIF security model](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-TRUTH.md), VPNs operate at the **S3 band** (Application); macshield defends at **S1** (Analog Front-End).

Reputable VPNs cost $50-100/year. Free VPNs are often worse than nothing (84% leak traffic, 38% contain malware per UC Berkeley/CSIRO). macshield gives meaningful Layer 2 protection at zero cost.

### Neurorights Alignment

macshield exists because of what the [NeuroRights Foundation](https://neurorightsfoundation.org) and researchers like Yuste, Ienca, and Andorno have been arguing for years: neurotechnology needs rights-aware infrastructure, not just ethics papers. Five neurorights are directly relevant:

- **Fair Access to Mental Augmentation** — Security tools should not be gated behind ability to pay. If BCI devices are going to read and write neural data, the tools that protect those signals must be accessible to everyone, not just funded labs and corporate teams.
- **Mental Privacy** — Your neural data is yours. macshield prevents hostname leaks and network reconnaissance that could identify a BCI user on a public network, the first step in any targeted attack chain.
- **Personal Identity** — Hostname randomization prevents your real name from being broadcast to every device on the local network. Your identity on public WiFi should be your choice.
- **Cognitive Liberty** — You should be free to use neurotechnology without surveillance. Zero telemetry means macshield itself never watches you. No analytics, no network calls, no data collection.
- **Protection from Algorithmic Bias** — macshield is open-source, auditable bash and Rust. No black-box binaries, no opaque ML models deciding what's "safe." You can read every line of code that runs on your machine.

## Key Features

- **Automatic switching** — LaunchAgent detects WiFi changes and applies the right profile
- **HMAC-SHA256 trust fingerprints** — trusted networks stored as hashes in macOS Keychain, not plaintext SSIDs
- **Post-quantum trust signatures** — ML-DSA (CRYSTALS-Dilithium, FIPS 204) protects the trust store from tampering
- **Zero telemetry** — no network calls, no analytics, no phoning home
- **Pure bash + Rust** — fully auditable, no compiled blobs
- **Minimal sudo** — 8 specific commands only, validated by `visudo -c`

## Quick Start

```bash
git clone https://github.com/qinnovates/macshield.git
cd macshield
chmod +x macshield.sh install.sh uninstall.sh
./install.sh
```

See the [full README](https://github.com/qinnovates/macshield) for VPN setup guides, threat model, security architecture, and comparison with other tools.
