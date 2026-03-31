# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Current (main branch) | Yes |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. Email: **security@qinnovate.com**
2. Or use GitHub's private vulnerability reporting: [Report a vulnerability](https://github.com/qinnovates/qinnovate/security/advisories/new)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected component (website, data pipeline, API endpoint)
- Potential impact assessment
- Suggested fix (if any)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix deployed (critical) | Within 7 days |
| Fix deployed (high) | Within 30 days |
| Fix deployed (medium/low) | Within 90 days |

### Scope

In scope:
- qinnovate.com website and all subpages
- Client-side JavaScript and WebAssembly components
- Data pipeline scripts and build tools
- API endpoints (if any)
- GitHub Actions workflows

Out of scope:
- Third-party services (CDNs, analytics)
- Social engineering attacks
- Denial of service attacks
- Issues in dependencies (report upstream)

## Security Practices

### Data Handling
- No user data is collected or stored
- All research data is publicly available (CC BY 4.0)
- No authentication system — static site only
- No cookies, no tracking, no analytics that collect PII

### Infrastructure
- Static site hosted on GitHub Pages / Vercel
- HTTPS enforced via hosting provider
- No server-side code execution
- Content Security Policy headers configured
- Dependencies audited via `npm audit` in CI

### Build Security
- Dependencies pinned via `package-lock.json`
- GitHub Actions workflows use pinned action versions
- No secrets in source code (verified via automated scanning)
- Build output is deterministic and reproducible

## Acknowledgments

We appreciate security researchers who help keep this project safe. Responsible reporters will be acknowledged here (with permission).
