---
paths:
  - "paper/**"
  - "qif-framework/QIF-RESEARCH-SOURCES.md"
  - "datalake/research-registry.json"
---

# Citation & Preprint Integrity Protocol

This protocol exists because preprint v1.0 shipped with 3 fabricated citations. Every citation MUST be verified.

## Citation Rules
1. **Never trust AI-generated citations.** Verify every DOI, arXiv ID, author list, and title by resolving the link
2. **Verify method:** Crossref API (`https://api.crossref.org/works/DOI`), arXiv abstract page, or publisher page. Unresolvable DOI = fabricated
3. **Cross-AI validation does NOT substitute for verification.** Only a resolved URL counts
4. **BibTeX entries** must include `note = {Verified YYYY-MM-DD via [source]}` (or `AI-suggested, verified...` if from AI)

## Preprint Version Sync
1. Compile: `cd paper && make deploy`
2. Update version note in `paper/sections/09-limitations.tex`
3. Upload to Zenodo (all-versions DOI: 10.5281/zenodo.18640105)
4. Build site: `npm run build`
5. Commit and push
6. Verify live PDF at `https://qinnovate.com/papers/qif-bci-security-2026.pdf`

## DOI Convention
Always use the all-versions DOI (`10.5281/zenodo.18640105`) in public references. Version-specific DOIs only for historical records.
