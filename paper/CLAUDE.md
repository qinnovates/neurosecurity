# paper/ -- Academic Publications (Preprint)

## Structure
- `main.tex` -- Root LaTeX document
- `sections/` -- Paper sections (01-intro through 09-limitations)
- `references.bib` -- BibTeX bibliography (must sync with QIF-RESEARCH-SOURCES.md and research-registry.json)
- `Makefile` -- Build pipeline (`make deploy` compiles and copies to site)
- `figures/` -- Paper figures

## Conventions
- Every citation MUST be verified via DOI resolution (see `.claude/rules/citation-integrity.md`)
- BibTeX entries must include `note = {Verified YYYY-MM-DD via [source]}`
- AI disclosure lives in Section 9.7
- All-versions DOI: `10.5281/zenodo.18640105` (use this in public references)

## Build
```bash
cd paper && make deploy
```
This compiles LaTeX and copies the PDF to the site's static directory.
