# QIF-BCI Security Preprint

Academic preprint: *"Quantified Interconnection Framework: An 11-Band Security Architecture for Brain-Computer Interfaces"*

## Table of Contents

- [DOIs](#dois)
- [Version History](#version-history)
- [Building](#building)
- [Structure](#structure)
- [Citation](#citation)

## DOIs

| | DOI |
|---|-----|
| **All versions (always latest)** | [10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105) |
| v1.4 | [10.5281/zenodo.18677997](https://doi.org/10.5281/zenodo.18677997) |
| v1.3 | [10.5281/zenodo.18654573](https://doi.org/10.5281/zenodo.18654573) |
| v1.2 | [10.5281/zenodo.18653372](https://doi.org/10.5281/zenodo.18653372) |
| v1.0 | [10.5281/zenodo.18640106](https://doi.org/10.5281/zenodo.18640106) |

Always cite the **all-versions DOI** in public references. It resolves to the latest version automatically.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.4 | 2026-02-18 | NISS score corrections (arithmetic mean), TMS citation fix (Hallett 2007), dual-use label fix, Sherman & Guillery citation |
| v1.3 | 2026-02-17 | Minor corrections |
| v1.2 | 2026-02-16 | Minor corrections |
| v1.0 | 2026-02-14 | Initial publication: 28 pages, 6 figures, CC-BY 4.0 |

## Building

Requires `pdflatex` and `bibtex`.

```bash
cd paper

# Build PDF
make pdf

# Build and deploy to docs/papers/
make deploy

# Generate figures
make figures

# Clean build artifacts
make clean
```

The `make deploy` target copies the compiled PDF to `docs/papers/qif-bci-security-2026.pdf`, which is served by GitHub Pages.

## Structure

```
paper/
├── main.tex                  # Main LaTeX document
├── main.pdf                  # Compiled preprint
├── references.bib            # Bibliography (all citations verified)
├── Makefile                  # Build configuration
├── arxiv.sty                 # arXiv submission style
├── latex-source.zip          # Source archive for Zenodo
├── sections/                 # Paper sections
│   ├── 01-introduction.tex
│   ├── 02-related-work.tex
│   ├── 03-hourglass.tex
│   ├── 04-tara.tex
│   ├── 05-niss.tex
│   ├── 06-neural-impact-chain.tex
│   ├── 07-governance.tex
│   ├── 08-case-studies.tex
│   ├── 09-limitations.tex
│   └── 10-conclusion.tex
├── figures/                  # Generated figures
└── scripts/                  # Figure generation scripts
```

## Citation

```bibtex
@misc{qi2026qif,
  title   = {Quantified Interconnection Framework: An 11-Band Security
             Architecture for Brain-Computer Interfaces},
  author  = {Kevin Qi},
  year    = {2026},
  doi     = {10.5281/zenodo.18640105},
  url     = {https://doi.org/10.5281/zenodo.18640105},
  note    = {Preprint, CC-BY 4.0}
}
```

---

*28 pages, 6 figures, CC-BY 4.0. Published on [Zenodo](https://doi.org/10.5281/zenodo.18640105).*
