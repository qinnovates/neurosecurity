# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in macshield, please report it responsibly.

**Email:** Open a private issue or email the maintainer directly (see GitHub profile).

**Do NOT:**
- Open a public GitHub issue for security vulnerabilities
- Post exploit details publicly before a fix is available

**Response time:** We aim to acknowledge reports within 48 hours and provide a fix within 7 days for critical issues.

## Scope

macshield is a local hardening tool. Its security model assumes:

- The attacker is on the same local network (cafe, airport, hotel WiFi)
- The attacker can see broadcast traffic (mDNS, NetBIOS, ICMP)
- The Mac's disk may be stolen (FileVault protects Keychain at rest)

macshield does NOT protect against:
- Root-level compromise of your Mac
- Nation-state adversaries with access to your ISP
- Physical access attacks beyond disk theft
- Traffic analysis (use a VPN for encrypted traffic tunnels)
- It is NOT an anti-malware or antivirus solution.

## Compatibility Notice
macshield modifies system-level DNS and firewall settings. This may collide with the operation of certain enterprise VPNs (e.g., Cisco AnyConnect) or secure tunnels. 

- **Pure bash:** No compiled binaries. Every line is auditable.
- **No network calls:** macshield never phones home, checks for updates, or sends telemetry.
- **Keychain storage:** Trusted network hashes use macOS Keychain (encrypted by Secure Enclave on Apple Silicon, FileVault on Intel).
- **No plaintext SSIDs:** Network names are stored as HMAC-SHA256 hashes with a machine-bound salt (IOPlatformUUID).
- **Minimal sudo surface:** Only 8 specific commands are granted passwordless sudo, validated by `visudo -c`.
