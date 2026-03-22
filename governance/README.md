# Governance

Neuroethics, regulatory compliance, and process documents for the QIF framework.

## Structure

```
governance/
├── CHANGELOG.md                 # Project changelog
├── CODE_OF_CONDUCT.md           # Code of conduct (includes former DISCLAIMER.md)
├── CONTRIBUTING.md              # Contribution guidelines
├── SECURITY.md                  # Security policy
├── CONTEXT.md                   # Root project context (AI agent entry point)
├── DECISION-LOG.md              # Auto-generated from derivation log
├── TRANSPARENCY.md              # Auto-generated from derivation log
├── SHIP-LOG.md                  # Feature release tracking
├── SCAFFOLD-LOG.md              # Project initialization decisions
├── MATURITY.md                  # Capability maturity model
├── QIF-GOVERNANCE-QUESTIONS.md  # Who decides what for the brain (RACI)
│
├── policy/                      # Ethics, compliance, and regulatory docs
│   ├── AI-ETHICS-PROPOSAL.md    # AI ethics principles for neural security
│   ├── AI-ETHICS.md             # AI disclosure and human-in-the-loop
│   ├── QIF-NEUROETHICS.md       # Open ethical questions and thesis foundation
│   ├── NEUROSECURITY_GOVERNANCE.md        # Unified governance framework
│   ├── NEUROSECURITY_POLICY_PROPOSAL.md   # 6 asks for 6 organizations
│   ├── NEUROETHICS_LEGISLATION_SURVEY.md  # Global neurorights law mapping
│   ├── INFORMED_CONSENT_FRAMEWORK.md      # BCI consent + pediatric/incapacity
│   ├── POST_DEPLOYMENT_ETHICS.md          # Post-market monitoring
│   ├── DATA_POLICY_FAQ.md                 # Neural data handling, retention
│   └── ACCESSIBILITY.md                   # Inclusive BCI design requirements
│
├── outreach/                    # Standards body engagement
├── processes/                   # Development lifecycle and protocols
└── _archive/                    # Consolidated prior versions (see ../_archive/governance/)
```

## Auto-Generated Files

`DECISION-LOG.md` and `TRANSPARENCY.md` are generated from `model/QIF-DERIVATION-LOG.md`. Do not edit directly. Run:
```bash
npm run governance
```

## Community

See [Code of Conduct](CODE_OF_CONDUCT.md) in this directory.

---

*All governance documents are published under [Apache 2.0](../LICENSE).*
