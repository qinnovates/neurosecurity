---
title: "QIF Research Documents"
status: "active"
---

# QIF Research Documents

Living research documents that feed into the QIF framework, website, and publications. These files are rendered dynamically on the website at build time via Astro content collections.

## Structure

```
research/
  README.md                    ← This file
  ferrocene-exploration.md     ← Compiler qualification research (renders on /runemate)
  techniques/                  ← Per-technique deep dives, mapped to TARA QIF-T numbers
    QIF-T0103-ssvep-frequency-hijack.md
    QIF-T0040-neurophishing.md
    ...
```

## Technique Documents

Each file in `techniques/` maps 1:1 to a TARA technique ID. The filename format is `QIF-TNNNN-slug.md`. These contain:

- Full threat model and attack scenarios
- Research citations with verified DOIs
- Neural Impact Chain (NIC) mapping
- DSM-5-TR diagnostic implications
- Security guardrails and defenses
- Blog post references
- Open research questions

Update these as research progresses. The derivation log captures the discovery sessions; these files capture the refined, citable analysis.

## Adding a New Document

1. Create the markdown file with frontmatter (`title`, `status`, `updated`)
2. The `research` content collection in `src/content.config.ts` auto-discovers all `.md` files here
3. Reference from website pages using `getEntry('research', 'filename-without-extension')`
4. Update this README if it's a new category

## Relationship to Other Documents

| Document | Purpose |
|----------|---------|
| `QIF-DERIVATION-LOG.md` | Raw discovery sessions (Kevin's voice, timestamped) |
| `QIF-RESEARCH-SOURCES.md` | Bibliography of all cited sources |
| `qif-sec-guardrails.md` | Physics-derived defense architecture |
| `research/*.md` | Refined analysis per topic, rendered on website |
| `research/techniques/*.md` | Per-TARA-technique deep dives |
