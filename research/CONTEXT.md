# Research Directory

This directory contains all QIF research output merged from previously separate `blogs/`, `paper/`, and `clinical/` directories.

- `blog/` — Markdown posts with YAML frontmatter. Published to `/news/` on the site.
- `paper/` — LaTeX source for the Zenodo preprint. Has its own Makefile and build scripts.
- `clinical/` — Reference notes on clinical neuroscience for threat modeling. Not clinical claims.

All DSM-5-TR references use the qualifier "for threat modeling purposes." All QIF claims use "proposed framework" status. See `rules/epistemic-integrity.md` for the full constraint set.

Blog posts with `type: case-study` frontmatter route to `/research/papers/[slug]/`, not `/news/`.
