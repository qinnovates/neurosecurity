# Qinnovate Security Tools

> [!IMPORTANT]
> **Practical BCI security begins at the workstation.** The neural data of our patients begins its digital journey on our devices. If the assets of those working on this initiative are compromised, the neuro-privacy of our subjects is inherently at risk.
>
> These tools are designed to harden the "outer layer" of the Qinnovate initiative, protecting the digital identity and local footprint of the researchers and developers who handle sensitive neural data.

This directory contains accessible, open-source security tools designed to protect digital identity and cognitive liberty.

## Table of Contents

- [Mission: The Neuroethics of Identity](#mission-the-neuroethics-of-identity)
- [A Note on Security Fallacies](#a-note-on-security-fallacies-the-wegner-schneier-fallacy--schneiers-law)
- [Tools](#tools)

| Tool | Language | Status | Description |
|------|----------|--------|-------------|
| [neurowall](./neurowall) | Python | v0.5 | Neural firewall neckband with NSP + PQC |
| [macshield](./macshield) | Bash | Active | macOS workstation hardening for public WiFi |

> **autodidactive** (adaptive learning platform) has moved to the private [mindloft](https://github.com/qinnovates/mindloft) repository under `education/`.

> [!WARNING]
> **For enterprise/corporate researchers:** If you are working with PII, sensitive data, or neural recordings in a professional capacity, use your organization's corporate VPN, managed devices, and enterprise security policies. These tools are not a substitute for enterprise security infrastructure. macshield is designed for individuals, students, and independent researchers who lack access to corporate resources. **Qinnovates is not liable for any security compromises resulting from the use of these tools in lieu of proper enterprise security controls.**

## Mission: The Neuroethics of Identity
In the age of ubiquitous surveillance, our digital identity, the hostnames we broadcast, the networks we touch, and the footprints we leave, is an extension of our cognitive self.

These tools empower individuals to:
1. Shield their presence in public spaces.
2. Reclaim control over their digital broadcasting.
3. Secure their privacy without relying on centralized, jurisdictional intermediaries.

## A Note on Security Fallacies (The Wegner-Schneier Fallacy / Schneier's Law)
In security engineering, we often encounter **Schneier's Law** (and the related **Wegner-Schneier Fallacy**): "Anyone can design a security system that they themselves cannot break."

Proposing a fix, like local hardening, carries the inherent risk of the **Peltzman Effect** (Risk Compensation). If a user feels "perfectly safe" because of a tool, they may take greater risks elsewhere. Furthermore, every defense introduces new complexity that could, in itself, become a point of failure.

Our approach is **Transparency over Obscurity**. We don't promise total invisibility; we promise a reduced attack surface and the education necessary to understand the tools you are running.

## Tools
- **[neurowall](./neurowall)**: Neural firewall neckband. Behind-the-neck wearable that grounds OpenBCI electrodes while running the full NSP + Runemate + PQC security stack on-device.
- **[macshield](./macshield)**: Network-aware macOS hardening to protect identity on public WiFi.

---
*Democratizing security. Protecting identity. Defending cognitive liberty.*
