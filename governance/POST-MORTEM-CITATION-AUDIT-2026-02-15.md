# Post-Mortem: Citation Integrity Audit

**Date:** 2026-02-15
**Severity:** High
**Status:** Corrected (Zenodo v1.1 pending publish)
**Author:** Kevin L. Qi

---

## Summary

The Zenodo preprint (DOI: 10.5281/zenodo.18640106, published 2026-02-14) contained multiple citation errors in its bibliography, including **three completely fabricated entries**. These errors were introduced during AI-assisted bibliography construction and were not caught before publication. The errors were identified through a combination of external researcher feedback and two systematic internal audit passes using parallel verification agents.

---

## Timeline

| Date | Event |
|------|-------|
| 2026-02-14 | Preprint published on Zenodo (v1.0) |
| 2026-02-15 | Dr. Tyler Schroder responds to arXiv endorsement request, identifying: wrong arxiv ID for his paper (2501.09566 vs correct 2508.12571), wrong author list (3 vs correct 6), broken transparency link on blog post |
| 2026-02-15 | Full citation audit initiated — 3 parallel verification agents deployed |
| 2026-02-15 | Pass 1 audit reveals 11 errors across 37 bibliography entries |
| 2026-02-15 | Pass 1 corrections applied to paper source, PDF recompiled |
| 2026-02-15 | Cross-AI verification (Claude + Gemini) performed |
| 2026-02-15 | Gemini incorrectly changes Meng DOI to wrong value; caught and reverted |
| 2026-02-15 | Zenodo v1.1 draft saved with corrected files and metadata |
| 2026-02-15 | Pass 2 audit — 3 new parallel agents verify all 37 entries (21 DOIs, 10 URLs, 10 non-DOI refs) |
| 2026-02-15 | Pass 2 reveals 3 additional errors: 2 more fabricated entries + 1 wrong author |
| 2026-02-15 | All Pass 2 corrections applied, PDF recompiled (now 35 bib entries, 36 rendered) |

---

## Findings

### Critical (Fabricated Entries)

| # | BibKey | Issue | Resolution | Pass |
|---|--------|-------|------------|------|
| 1 | `wu2024adversarial` | **Entirely AI-hallucinated.** DOI 10.1109/TNSRE.2024.3377344 returns 404. Title, authors (Wu, Yao, Zhang, Li), and journal do not exist. | Replaced with verified Meng, Jiang & Wu (2023). DOI: 10.1016/j.future.2023.01.028. Confirmed via ScienceDirect. | 1 |
| 12 | `denning2009neurostimulators` | **AI-hallucinated.** Paper does not appear on Tamara Denning's own publication page. The cited venue (USENIX Workshop on Health Security and Privacy, 2009) did not exist until 2010. The content attributed to this entry is covered by `kohno2009neurosecurity`. | Removed entry. Citation changed from `\cite{denning2009neurostimulators,kohno2009neurosecurity}` to `\cite{kohno2009neurosecurity}` in both tex files. | 2 |
| 13 | `landau2020neurorights` | **AI-hallucinated.** No paper by Landau, Limón, and van Est with this title exists in Google Scholar, PubMed, Springer, Semantic Scholar, or any other database. While Rinie van Est is a real researcher, this specific collaboration and paper do not exist. | Removed entry. Was uncited in the paper (dead weight in bib file). | 2 |

### High (Wrong Authors/Identifiers)

| # | BibKey | Issue | Resolution | Pass |
|---|--------|-------|------------|------|
| 2 | `schroder2025cyberrisks` | Wrong arxiv ID (2501.09566 → 2508.12571). Only 3 authors listed; actual paper has 6 (Schroder, Sirbu, Park, Morley, Street, Floridi). | Corrected arxiv ID and full author list. Verified via arxiv.org. | 1 |
| 3 | `kohno2009neurosecurity` | Wrong authors: listed as Kohno, Denning, Chizeck. Actual authors: **Denning, Matsuoka, Kohno**. Chizeck is not an author on this paper. Also was `@inproceedings` but Neurosurgical Focus is a journal. | Corrected to Denning, Matsuoka, Kohno. Changed to `@article`. Added volume/number/pages (27(1), E7). Verified via PubMed (PMID: 19569895). | 1 |
| 4 | `lazaro2020researcher` | Wrong first author: listed Lazaro-Munoz as 1st author, but actual 1st author is Katrina Munoz (14 co-authors). | Corrected author list. In-text citation changed to "Munoz et al." Verified via DOI. | 1 |
| 5 | `goering2021recommendations` | 3rd/4th authors (Dougherty, Widge) from a different paper. Correct: Specker Sullivan, Wexler. | Corrected author list. (WOOT26 bib only.) | 1 |

### Medium (Metadata Errors)

| # | BibKey | Issue | Resolution | Pass |
|---|--------|-------|------------|------|
| 6 | `deering1998hourglass` | Wrong entry type (`@article` → `@misc`). Year inconsistency (1998 vs 2001). | Changed to `@misc`. Year set to 2001 (IETF 51). Note clarifies 1998 origin. | 1 |
| 7 | `fda2023cybersecurity` | Generic URL, not direct link to guidance document. | Updated to specific FDA guidance URL. | 1 |
| 8 | `mergelabs2026` | Wrong author list. Pass 1 added Bellan as co-author alongside Conger. Pass 2 found Conger is **not** a co-author — Bellan is the sole byline. | Corrected to Bellan only. Verified via TechCrunch article page. | 1+2 |
| 9 | `lazaro2022posttrial` | Wrong first names: Mai → Michelle (Pham), Kristin → Katrina (Munoz). | Corrected first names. | 1 |
| 10 | `li2015braincomputer` | Wrong first name: Qiongqiong → QianQian. | Corrected. (WOOT26 bib only.) | 1 |
| 11 | `nist800160` | URL pointed to withdrawn document version. | Updated to Rev. 1 URL. (WOOT26 bib only.) | 1 |

### Low (Entry Type Errors)

| # | BibKey | Issue | Resolution | Pass |
|---|--------|-------|------------|------|
| 14 | `rushanan2014sok` | Listed as `@article` but has `booktitle` — IEEE S&P is a conference. BibTeX warning: "empty journal." | Changed to `@inproceedings`. | 2 |

### Cross-AI Introduced Error (Caught in Pass 2)

| # | BibKey | Issue | Resolution | Pass |
|---|--------|-------|------------|------|
| 15 | `meng2023adversarial` | Gemini (Antigravity) changed DOI from correct `10.1016/j.future.2023.01.028` to wrong `10.1016/j.future.2023.03.010` during cross-AI validation. The wrong DOI resolves to an unrelated federated learning paper. This error was baked into the compiled PDF and Zenodo v1.1 draft. | Reverted to correct DOI. Verified via Crossref: `.01.028` = Meng adversarial benchmark (correct); `.03.010` = federated learning paper (wrong). | 2 |

---

## Root Cause Analysis

**Primary cause:** AI-assisted bibliography construction without independent verification.

During the paper development process, large language models (Claude, Gemini, ChatGPT) were used to assist with bibliography generation. The AI tools:

1. **Fabricated complete citations** — three entries (`wu2024adversarial`, `denning2009neurostimulators`, `landau2020neurorights`) were entirely or partially hallucinated. DOIs, authors, titles, and venues were invented. This is a known failure mode of LLMs (bibliographic hallucination). Notably, `denning2009neurostimulators` cited a real research group but fabricated a paper and venue that didn't exist; `landau2020neurorights` used a real researcher's name (van Est) but fabricated a collaboration.
2. **Conflated authors across related papers** — e.g., listing Chizeck as a co-author on the Kohno 2009 paper because he co-authored related work with the same research group.
3. **Generated plausible-but-wrong metadata** — first names, arxiv IDs, and author orderings that were close to correct but wrong in detail.
4. **Cross-AI validation introduced a new error** — Gemini changed the Meng DOI to a wrong value during the verification pass, demonstrating that AI-based verification can introduce errors as well as find them.

**Contributing factors:**
- Single-author paper with no co-author cross-check
- Time pressure to publish (preprint uploaded same day as final compilation)
- Over-reliance on AI outputs for factual data (citations) vs. conceptual work (where AI was used appropriately)
- No systematic DOI/URL verification step in the publication workflow

---

## Cross-AI Verification Results

Two independent verification systems were used:

### Pass 1: Claude (3 parallel agents)
- Verified all 37 bib entries via DOI resolution, Crossref API, PubMed, and arxiv
- Found 11 errors (including the fabricated Wu entry and Kohno author error)
- **Correctly identified** Meng DOI as 10.1016/j.future.2023.01.028
- **Missed** 2 fabricated entries (`denning2009neurostimulators`, `landau2020neurorights`) and 1 wrong author (`mergelabs2026`)

### Pass 1: Gemini (Antigravity)
- Independent review of corrected bibliography
- Confirmed Schroder correction
- **Incorrectly suggested** changing Meng DOI to 10.1016/j.future.2023.03.010 (this resolves to a completely different paper about federated learning)
- Added Transparency Statement to blog post

### Disagreement Resolution
The Meng DOI conflict was resolved by fetching both DOIs:
- `10.1016/j.future.2023.01.028` → "Adversarial robustness benchmark for EEG-based brain-computer interfaces" (CORRECT)
- `10.1016/j.future.2023.03.010` → "Ubiquitous intelligent federated learning privacy-preserving scheme under edge computing" (WRONG PAPER)

### Pass 2: Claude (3 parallel agents, full re-verification)
- Re-verified all entries after Pass 1 corrections
- **21 DOIs verified** via Crossref API — 21/21 PASS
- **10 URLs verified** via HTTP fetch — 10/10 PASS (all alive and correct)
- **10 non-DOI entries verified** via web search, author publication pages, PubMed, arxiv — 7/10 PASS
- Found 3 new errors missed in Pass 1:
  - `denning2009neurostimulators`: fabricated (not on Tamara Denning's pub page; venue didn't exist in 2009)
  - `landau2020neurorights`: fabricated (no trace in any database)
  - `mergelabs2026`: Kate Conger is not a co-author (Bellan sole byline confirmed via TechCrunch)
- Also caught Gemini's incorrect Meng DOI change that had been applied to the bib file

**Lesson:** A single verification pass is insufficient. Even the first AI-assisted audit missed fabricated entries that a second pass caught. Cross-AI validation catches different errors but can also introduce new ones. Human verification of disagreements is essential. Multiple independent passes are necessary for high-confidence bibliography integrity.

---

## Corrections Applied

### Files Modified

| File | Changes |
|------|---------|
| `paper/references.bib` | 15 corrections across 2 passes: 11 (Pass 1) + 4 (Pass 2). Removed 2 fabricated entries, fixed 1 wrong DOI, fixed 1 wrong author, fixed 1 entry type. Final: 35 entries. |
| `paper/woot26/references.bib` | Same corrections applied |
| `paper/sections/02-related-work.tex` | "Denning, Kohno, and Chizeck" → "Denning, Matsuoka, and Kohno"; "Wu et al." → "Meng et al."; removed `denning2009neurostimulators` from citation; Schroder description updated; Lazaro-Munoz citation split |
| `paper/woot26/sections/02-related-work.tex` | Same text corrections |
| `paper/sections/09-limitations.tex` | Added AI Tool Disclosure subsection (Section 9.8); transparency URL changed to GitHub |
| `blogs/2026-02-13-...` | AI Transparency Statement updated: credits Kevin L. Qi as author with Claude and Gemini as AI assistants; link → GitHub |
| `src/pages/governance/[...slug].astro` | Added "View source on GitHub" link to all governance pages |
| `src/pages/governance/index.astro` | Added "View source on GitHub" link |
| `src/components/Footer.astro` | Added "Governance (GitHub)" link |

### Zenodo v1.1 Draft
- Corrected 3 reference strings (Denning/Matsuoka/Kohno, Meng, Schroder)
- Uploaded recompiled main.pdf and latex-source.zip
- Version set to 1.1
- Publication date: 2026-02-15
- **Status: Saved as draft, needs re-upload with Pass 2 corrections before publishing**

---

## Process Improvements Implemented

### New Hard Rules (added to MEMORY.md)

1. **Citation Verification (MANDATORY):** Never trust AI-generated citations. Every DOI must be resolved, every author list verified against the actual publication, every arxiv ID confirmed. Use Crossref API or PubMed for verification. This applies to ALL future papers.

2. **QIF Hourglass-First Layout (MANDATORY):** Unrelated to citations but added during this session.

### Workflow Changes

1. **Pre-publication checklist:** Before any future Zenodo/arXiv upload, run a systematic verification of all bibliography entries using at least two independent methods (DOI resolution + source database lookup).

2. **Multi-pass verification:** A single verification pass is insufficient. The first pass missed 2 fabricated entries that a second pass caught. Run at minimum 2 independent verification passes before publishing.

3. **Cross-AI validation protocol:** When using multiple AI systems for verification, treat disagreements as requiring human resolution — do not automatically accept either system's output. Gemini introduced a new error (wrong Meng DOI) during the verification process itself.

4. **Author publication page check:** For any paper without a DOI, verify the paper exists on at least one author's own publication page. This would have immediately caught `denning2009neurostimulators` (not on Tamara Denning's page).

5. **AI Disclosure:** All future papers will include an AI Tool Disclosure section per arXiv policy, explicitly noting that AI was used and describing the human verification process.

---

## Follow-Up Actions

| Action | Status | Owner |
|--------|--------|-------|
| Pass 1: Fix 11 citation errors in paper source | Done | Kevin |
| Pass 2: Fix 4 additional errors (2 fabricated, 1 DOI revert, 1 author, 1 entry type) | Done | Kevin |
| Recompile PDF (final: 35 bib entries, 36 rendered, 0 BibTeX warnings) | Done | Kevin |
| Update Zenodo references metadata | Done | Kevin |
| Re-upload corrected PDF + zip to Zenodo v1.1 draft | Pending | Kevin |
| Publish Zenodo v1.1 | Pending | Kevin |
| Reply to Dr. Schroder acknowledging errors and corrections | Pending | Kevin |
| Email Prof. Kohno apologizing for author misattribution | Pending | Kevin |
| Commit and push all local changes | Pending | Kevin |
| Log cross-AI validation to governance/TRANSPARENCY.md | Pending | Kevin |
| Add AI Disclosure section to paper | Done | Kevin |
| Fix governance links to point to GitHub | Done | Kevin |
| Update blog AI Transparency Statement | Done | Kevin |
| Rebuild and deploy website | Pending | Kevin |

---

## Disclosure

This post-mortem itself was written with AI assistance (Claude). The factual content (error descriptions, DOI verification results, timeline) was human-verified. The document structure and prose were AI-assisted.
