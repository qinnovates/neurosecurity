# ML Research Labs

Reproducible ML and security research from the TARA threat registry. Each lab is a self-contained proof-of-concept demonstrating a real vulnerability in neural interface or consumer sensor technology.

These labs exist to:
1. Prove that theoretical TARA threats are exploitable in practice
2. Provide reproducible evidence for responsible disclosure
3. Support CVE/CWE filings with working code
4. Advance the field of neurosecurity through transparent research

## Labs

| ID | Name | Target | Status | Key Result |
|----|------|--------|--------|------------|
| [T0079](t0079-anc-ear-fingerprint/) | ANC Ear Canal Fingerprinting | Consumer ANC earbuds (AirPods, Sony WF) | PoC Complete | 97.5% identification, 3.33% EER |
| [LSL-CVE](../poc/lsl-cve/) | Lab Streaming Layer Exfiltration | liblsl (all versions) | CVE Filed | Zero-auth neural data access |

## How to Use

Each lab contains:
- A detailed writeup explaining the threat model and attack
- References to prior academic work establishing feasibility
- Methodology section with signal processing details
- Results from synthetic and/or real-world testing
- Responsible disclosure status and next steps

The actual code lives in the [Mindloft tools repo](https://github.com/qinnovates/mindloft/tree/main/tools/ml-research-labs/) — these writeups document the research methodology and findings for the standards community.

## Responsible Disclosure

All vulnerabilities are disclosed following coordinated disclosure practices:
1. Vendor notification (90-day window)
2. CWE/CVE filing where applicable
3. Academic publication for peer review
4. Public disclosure after vendor response or window expiry
