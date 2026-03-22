# model/ -- QIF Model: Specifications, Research & Implementations

## Structure
- `QIF-DERIVATION-LOG.md` -- Source of truth (113 entries). Stays at root due to script dependencies
- `QIF-FIELD-JOURNAL.md` -- First-person observations (raw voice, AI cannot write)
- `QIF-RESEARCH-SOURCES.md` -- 340+ verified citations. Stays at root due to sync scripts
- `GUARDRAILS.md` -- Neuroethics constraints (G1-G8)
- `VALIDATION.md` -- Validation framework
- `specs/` -- NSP, Runemate, NISS, guardrails specifications
- `whitepapers/` -- v6.3, v8.0 draft, wiki, truth
- `logs/` -- Neurorights derivation log
- `framework/` -- 9-document architecture series
- `nsp/` -- NSP Rust implementation
- `runemate/` -- Runemate Rust compiler
- `research/` -- Research methodology
- `qif-lab/` -- Python equation testing
- `tara-threat/` -- TARA threat catalog

## Conventions
- All changes must align with the 11-band hourglass model
- QIF, NISS, TARA are proposed/unvalidated -- label as such in outward-facing text
- `governance/DECISION-LOG.md` and `governance/TRANSPARENCY.md` are generated from the derivation log. Run `npm run governance` after new entries

See README.md for details.
