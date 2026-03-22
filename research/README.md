# Research

Unified directory for all QIF research output: blog posts, the academic paper, and clinical reference notes.

## Structure

```
research/
  blog/           # 71 posts (field journals + technical articles)
  paper/          # LaTeX preprint (Zenodo-published)
    figures/
    sections/
    scripts/
    references.bib
    main.tex
  clinical/       # Clinical neuroscience research notes
    qeeg-research.md
```

## Blog Posts

71 posts including field journal entries and technical articles. Published at [qinnovate.com/news](https://qinnovate.com/news/).

Posts with `type: case-study` in frontmatter route to `/research/papers/[slug]/`.

## Academic Paper

LaTeX preprint published on Zenodo (DOI: [10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)).

Source in `paper/main.tex`. Build with `make` in the `paper/` directory.

## Clinical Notes

Research notes on clinical neuroscience relevant to QIF threat modeling. All DSM-5-TR references are for threat modeling purposes, not clinical claims.
