# macshield

> [!CAUTION]
> **ALPHA RELEASE**: This project is in its early stages. **Run at your own risk.** It modifies system-level network and firewall settings.

> [!IMPORTANT]
> **GOAL**: To bring high-level security to those who cannot afford private VPN subscriptions.
> **ZERO TELEMETRY**: All data (fingerprints, logs, signatures) remains strictly on **your device**.
> **LOCAL PHILOSOPHY**: We trust audited, local-first tools and privacy-focused DNS providers over "Free VPNs" that harvest and sell user data.

> [!IMPORTANT]
> **SECURITY & LEGAL DISCLAIMER**
> - **USE AT YOUR OWN RISK**: This software is provided "as is" without warranty.
> - **NO LIABILITY**: The developers/contributors are not liable for any damages.
> - **NOT ANTI-MALWARE**: macshield is a network identity protector, not an antivirus.
> - **NOT FOOL-PROOF**: No security tool offers 100% protection.
> - **VPN COMPATIBILITY**: Some VPN providers may collide with these settings.
> - **PHILOSOPHY**: This tool is an alternative to untrustworthy "Free VPNs". We trust audited privacy-focused DNS (Cloudflare, Google, Quad9) over free VPN services any day.

## Safety & Risks: The Paradox of Defense
Proposing a fix often introduces new issues. By using macshield's "Block All" mode, you are prioritizing security over convenience. 
1. **Service Disruption**: "Block All" mode **will break** AirDrop, Spotify Connect, and local printing.
2. **Connectivity Issues**: Strict firewall settings may interfere with portal logins at certain cafes. If you can't reach a login page, run `macshield relax` temporarily.

## Identity as a Human Asset
**macshield** is a network-aware macOS hardening tool. Its mission is rooted in **Neuroethics** and the protection of **Cognitive Liberty**. Your broadcasted footprint is an extension of your cognitive self. Shielding this identity is a requirement for neuro-privacy.

## Technical Detail: BSSID vs SSID Fingerprinting

To prevent "Evil Twin" attacks, macshield uses a multi-layered fingerprinting approach:

- **SSID (Service Set Identifier)**: This is the human-readable **Name** of the WiFi network (e.g., "Starbucks_WiFi"). These are trivial for an attacker to spoof.
- **BSSID (Basic Service Set Identifier)**: This is the unique **MAC Address** (hardware ID) of the specific wireless router you are talking to.

### How the Defense Works
1. When you `macshield trust` a network, the script captures both the name (SSID) and the hardware ID (BSSID).
2. It computes a SHA256 HMAC of the `{SSID}:{BSSID}` pair, salted with your machine's unique hardware UUID.
3. This is further secured with an **ML-DSA (Post-Quantum)** digital signature.
4. These fingerprints are stored in a **root-locked local directory** (`/Library/Application Support/macshield`), inaccessible to standard users or malicious apps.

**Why this is more secure**: If an attacker sets up a fake "Starbucks_WiFi" hotspot, its BSSID will not match the hardware you originally trusted. macshield will detect this mismatch, recognize the network as **UNTRUSTED**, and keep your firewall and identity masks active.

## Post-Quantum Defense (ML-DSA)

macshield is one of the first open-source security tools to integrate **NIST-standardized Post-Quantum Cryptography**.

### Why Post-Quantum?
Standard signatures (like RSA or ECDSA) can be broken by futuristic quantum computers. By using **ML-DSA (Module-Lattice-based Digital Signature Algorithm)**, macshield ensures that:
- **Forgery Resistance**: Attackers cannot forge "trusted" network records, even with access to quantum computing power.
- **Asymmetric Trust**: Unlike simple passwords or HMACs, ML-DSA uses public-key cryptography to verify the integrity of your local trust store without exposing your private signing key.
- **Future-Proofing**: Your "Home" and "Work" network signatures are protected against "harvest now, decrypt later" strategies.

## What It Does

| Untrusted Network | Trusted Network |
|---|---|
| **Stealth Mode & Block All** | Stealth Mode OFF |
| **Generic Hostname** | Personal Hostname Restored |
| **NetBIOS Disabled** | NetBIOS Enabled |

## Local VPN Context (Phase 0)

For users who cannot afford premium VPNs, we recommend a **Local OpenVPN** strategy:
- **Your Device Only**: Setting up a local OpenVPN client ensures your traffic is tunneled securely through your trusted providers without the overhead of a middleman.
- **Superiority**: A local, self-managed tunnel to a trusted DNS provider is fundamentally more secure than relying on untrusted "Free VPN" apps.

## Future Phases: Router-Level Protection

The ultimate goal of macshield is to expand beyond the workstation:
- **Router/Modem Integration**: In a future phase, we will provide guidance on configuring your router or modem with OpenVPN separately.
- **Network-Wide Shield**: This will protect every device on your home network (IoT, mobile, cameras) at the gateway level, complementary to the workstation-level hardening provided by the current `macshield` tool.

## Quick Start
```bash
cd tools/macshield
chmod +x macshield.sh install.sh
./install.sh
```

---
*Shield your presence. Protect your identity. Defending cognitive liberty.*
