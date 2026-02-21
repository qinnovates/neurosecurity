# macshield

macshield has its own repository: **[github.com/qinnovates/macshield](https://github.com/qinnovates/macshield)**

A local security hardening tool for macOS that automatically protects your Mac on public WiFi. Covers Layer 2 attacks (hostname leaks, ARP probes, port scans, NetBIOS enumeration) that VPNs cannot block. In the [QIF security model](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-TRUTH.md), these attacks operate at the **S1 band** (Analog Front-End), below the VPN tunnel at **S3** (Application).

Features: automatic network-aware switching, HMAC-SHA256 trust fingerprinting, post-quantum trust store signatures (ML-DSA/FIPS 204), zero telemetry, pure bash + Rust.
