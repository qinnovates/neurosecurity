# governance/ -- Policy, Ethics & Process Documents

## Structure
- `DECISION-LOG.md` -- GENERATED from derivation log (do not edit directly)
- `TRANSPARENCY.md` -- GENERATED from derivation log (do not edit directly)
- `SHIP-LOG.md` -- Manual feature shipping log
- `policy/` -- Neuroethics, AI ethics, consent, accessibility, governance proposals
- `processes/` -- Standards development lifecycle documents
- `outreach/` -- Standards body engagement (FIRST/CVSS, MITRE CWE)
- `scripts/` -- Governance generation scripts

## Regenerating
```bash
npm run governance
```
This rebuilds DECISION-LOG.md and TRANSPARENCY.md from `model/QIF-DERIVATION-LOG.md`.

See README.md for details.
