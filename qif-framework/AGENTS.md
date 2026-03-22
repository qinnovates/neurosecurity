# qif-framework/ -- QIF Specification & Implementations

## Structure
- `QIF-DERIVATION-LOG.md` -- Single source of truth for all framework decisions (see `.claude/rules/derivation-log.md`)
- `QIF-FIELD-JOURNAL.md` -- Personal/experiential observations (raw voice only, AI cannot write)
- `QIF-RESEARCH-SOURCES.md` -- Living research catalog with IDs, URLs, relevance
- `nsp/` -- Neural Sensory Protocol (Rust + spec)
  - `nsp-core/` -- PQ-secure Rust implementation
- `runemate/forge/` -- Runemate DSL compiler (Rust)
- `archive/oni-framework/` -- Legacy ONI 14-layer model

## Conventions
- All architectural changes must align with the 11-band hourglass model
- New techniques must be scored with NISS
- Derivation log entries follow the 3-question filter (see `.claude/rules/derivation-log.md`)
- QIF, NISS, TARA are all proposed/unvalidated -- label as such in outward-facing text

## Generated Files
`governance/DECISION-LOG.md` and `governance/TRANSPARENCY.md` are GENERATED from the derivation log. Do not edit them directly. Run `npm run governance` after new entries.
