# Site Consolidation, Verification & Transparency Audit

## Context

Qinnovate (qinnovate.com) is an Astro 5.x site with 226 pages across neurosecurity research, BCI security tools, governance documents, and blog posts. The site grew organically and has significant overlap between pages. A visitor should understand the project's scope, credibility, and limitations within 5 minutes.

**Terminology (mandatory):**
- "Neurosecurity" = the research discipline (cite Denning, Matsuoka & Kohno 2009)
- "BCI security" = the applied engineering domain
- "Neuroethics" = foundational scholarship that informs QIF, not what QIF is
- "Governance" = full-stack policy (all 11 bands), never "neurogovernance"
- QIF, NISS, TARA, NSP, Neurowall, Runemate = all "proposed" and "unvalidated"

**Source files:**
- Site pages: `src/pages/` (Astro components)
- Data: `shared/` (JSON registries, source of truth)
- Framework docs: `qif-framework/`
- Governance: `governance/`
- Blog posts: `blogs/`
- Tools: `tools/neurowall/`, `qif-framework/nsp/`, `qif-framework/runemate/`

---

## Task 1: Consolidation Audit

**Deliverable:** A page-by-page map of the current site with a proposed consolidated structure.

### Steps

1. List every route in `src/pages/` with a one-line description of what it contains.
2. For each page, identify:
   - What unique content does this page have that exists nowhere else?
   - What content overlaps with other pages? (Name the specific pages and sections.)
   - Who is the audience? (Security engineer, researcher, regulator, general visitor)
3. Propose a consolidated site map where:
   - A first-time visitor can understand QIF's purpose, scope, and credibility in under 5 minutes
   - No content appears in more than one place (single source of truth)
   - Pages are grouped by audience intent, not by internal project structure
   - The total page count is reduced by at least 30%
4. For each proposed merge or deletion, state:
   - What moves where
   - What gets deleted (and why it's safe to delete)
   - What becomes a section within a larger page vs. its own route

### Output format

```
## Current: [page route]
- Unique content: [what's only here]
- Overlaps with: [page routes + specific sections]
- Audience: [who]
- Recommendation: KEEP | MERGE INTO [target] | DELETE | DEMOTE TO SECTION

## Proposed Site Map
[tree structure with max 2 levels of nesting]
```

---

## Task 2: Citation & Claim Verification

**Deliverable:** A verified/unverified status for every external claim on the site.

### Steps

1. Scan all pages in `src/pages/`, `blogs/`, `qif-framework/`, and `governance/` for:
   - Named researchers or institutions (e.g., "Denning et al.", "IEEE", "OECD")
   - Specific statistics or numerical claims (e.g., "$8 billion by 2032", "94.4%")
   - DOIs, URLs, or paper titles
   - "First", "only", "no other", "never before" priority claims
   - Dates tied to events (e.g., "Chile 2021", "FDA approved")
2. For each claim found, attempt to verify:
   - Resolve any DOI via Crossref API (`https://api.crossref.org/works/[DOI]`)
   - Check author names, titles, venues, and years against the resolved source
   - For statistics, trace to the original source (not a secondary citation)
   - For priority claims, search for counterexamples
3. Classify each claim:
   - **VERIFIED** — DOI resolves, authors match, claim is accurate
   - **PARTIALLY VERIFIED** — source exists but claim overstates or simplifies
   - **UNVERIFIED** — cannot confirm from available sources
   - **INCORRECT** — source contradicts the claim
   - **PRIORITY CLAIM** — uses "first/only/no other" language (flag regardless of accuracy)

### Output format

```
| File | Line | Claim | Source | Status | Fix |
|------|------|-------|--------|--------|-----|
```

---

## Task 3: Validation Status & AI Transparency Audit

**Deliverable:** A page-by-page audit of what's tested, what's not, and where AI disclosure is missing.

### Steps

#### 3A: Validation Status

1. Read `VALIDATION.md` to understand what has been tested and at what tier.
2. Scan every page for claims about QIF components (Cs metric, NISS scores, NSP power overhead, Neurowall detection rates, TARA mappings, DSM-5-TR correlations).
3. For each claim, check:
   - Is it listed in VALIDATION.md as tested? At what tier?
   - Does the page clearly state whether the claim is simulation-only, analytical, or hardware-validated?
   - If untested, does the page say so?
4. Flag any page where:
   - A tested result is presented without stating it's simulation-only
   - An untested claim is presented as if validated
   - The word "validated" appears without specifying the validation tier
   - Hardware performance is implied but only simulation exists

#### 3B: AI Transparency

1. Scan every page in `src/pages/` for:
   - Does the page or its associated content acknowledge AI assistance?
   - For pages presenting research findings: is there a link to the Transparency Statement (`governance/TRANSPARENCY.md`)?
   - For pages presenting the whitepaper: is there a link to the Derivation Log?
2. Scan every blog post in `blogs/` for:
   - Does it end with the AI disclosure footer: "*Written with AI assistance (Claude). All claims verified by the author.*"
   - If the post makes research claims, does it link to sources?
3. Check `governance/TRANSPARENCY.md` itself:
   - Is the AI systems table current?
   - Are all cross-AI validation sessions logged?
4. Propose a site-wide AI transparency standard:
   - What should appear on every page (footer? banner? metadata?)
   - What should appear only on research pages
   - What should appear only on blog posts

### Output format

```
## Validation Gaps
| File | Claim | VALIDATION.md Status | Page Says | Gap |
|------|-------|---------------------|-----------|-----|

## AI Transparency Gaps
| File | Has Disclosure | Type Needed | Missing Element |
|------|---------------|-------------|-----------------|

## Proposed Transparency Standard
[specification]
```

---

## Constraints

- Read files before making claims about their content. Do not guess.
- Do not edit any files. This is an audit. Output findings only.
- If you cannot verify a claim, say "UNVERIFIED" — do not fill the gap with plausible content.
- Apply neuromodesty checks to your own output: no causal overclaims, no diagnostic claims, no priority claims.
- Use the terminology rules above. Flag any violations found in site content.
