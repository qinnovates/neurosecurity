---
paths:
  - "model/QIF-RESEARCH-SOURCES.md"
  - "src/data/automation-registry.json"
  - "src/data/qif-timeline.json"
  - "paper/references.bib"
  - "datalake/research-registry.json"
---

# Sync Protocols

Three project files must stay in sync with changes. All follow the same pattern: **when a relevant change occurs, update the file, update its metadata (date/counts), and verify with the associated script if one exists.**

## Research Sources (`model/QIF-RESEARCH-SOURCES.md`)
**When:** New citation in `paper/references.bib`, blog references research, NSP cites new RFC/NIST, new TARA technique references research, any new DOI/arXiv/RFC referenced for the first time.
**How:** Add to correct domain section (Quantum Physics, Neuroscience, BCI Technology, Cybersecurity, etc.) using table format `| ID | Citation | URL | Source | QIF Relevance |`. Update header date and Appendix statistics.
**IMPORTANT: Whenever a new citation or source is used anywhere in the project, ALL THREE citation stores must be updated:**
1. `model/QIF-RESEARCH-SOURCES.md` — living catalog with IDs, URLs, and relevance
2. `paper/references.bib` — BibTeX entry for LaTeX/preprint use
3. `datalake/research-registry.json` — structured JSON registry (researchers, institutions, standards, legislation)

## Automation Registry (`src/data/automation-registry.json`)
**Script:** `scripts/update-automation-registry.mjs` | **CI:** `.github/workflows/update-registry.yml` (daily)
**When:** Workflow created/deleted/changed, script added to `scripts/`, hook modified in `.claude/hooks/`, automation status changes.
**How:** Add/modify entry with: id, name, description, trigger, type, source_file, status (`active`/`disabled`/`local_only`/`planned`), dependencies, outputs, category.

## Timeline (`src/data/qif-timeline.json`)
**Script:** `scripts/timeline-check.mjs` (use `--fix` to auto-update, `--dry-run` to preview) | **CI:** `.github/workflows/timeline-check.yml` (on push)
**When:** New version released, discovery/derivation changes framework, cross-AI validation results, preprint published, new tool/page ships, hardware validation, dataset expansion.
**Stats to update:** threat_techniques, bci_devices, brain_regions, physics_constraints, hourglass_bands, tara_tactics, neurorights_mapped, dsm5_diagnoses_mapped, research_sources, derivation_log_entries, field_journal_entries, blog_posts, cross_ai_validations, plus version fields.
