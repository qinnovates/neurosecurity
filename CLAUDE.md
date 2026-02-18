# Qinnovate Project Guide
## Commands
- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Updates**: `npm run fetch-news`
- **Type Check**: `npm run type-check`
- **Sync Context**: `npm run sync` (Refreshes this file)

## Multi-Agent Protocol (Shared Memory)
- **Source of Truth:** The `_memory/` directory is the SHARED synchronization point for all agents (Claude, Antigravity, etc.).
- **Read/Write:** Agents MUST check `_memory/daily/<date>.md` and `_memory/antigravity_context.md` before starting work.
- **Protocol:**
  1. Read latest daily log.
  2. Read active context files.
  3. Append updates to daily log.
  4. Respect file locks if noted.
- **Location:** If `_memory` is a symlink (e.g., to Google Drive), treat it transparently as the local `_memory/` path.
- **SECURITY:** NEVER store API keys, credentials, or PII in memory logs. Redact sensitive data before writing.


## Project Structure
- `src/`: Astro website source
  - `pages/`: Routes
    - `api/`: Data endpoints (e.g. tara.json)
    - `TARA/[id].astro`: Dynamic Threat Pages
  - `components/`: React/Astro components
  - `layouts/`: Page layouts
  - `lib/`: Utility functions and constants
- `qif-framework/`: QIF security specification docs
- `governance/`: Policy, ethics, and process documents
  - `processes/`: Standards development lifecycle
- `shared/`: Shared data (Source of Truth)
  - `archive/`: Deprecated/merged data files
- `scripts/`: RSS fetcher, TARA tools, utilities
  - `forms/`: Consulting form & Apps Script handler
- `archive/`: Legacy projects (e.g. oni-framework)
- `docs/`: Built site / GitHub Pages output

## Tech Stack
- Framework: Astro 5.x
- UI: React 19, TailwindCSS 4
- Language: TypeScript

## Guidelines
- Use Semantic HTML.
- Follow Tailwind v4 conventions.
- Update `shared/` JSON files for data changes, which are copied to `docs/data` during build.
- Documentation is a primary product; keep markdown clean and standard.

## Cross-AI Validation Protocol
After ANY cross-AI validation session (Gemini review, multi-model cycle, independent peer review),
append a row to `governance/TRANSPARENCY.md` > Cross-AI Validation Sessions table BEFORE ending
the session. Format: `| Date | Topic | AI Systems | Human Decision | Derivation Log Ref |`
This applies to all agents (Claude, Antigravity, etc.) working in this repo.

## Auto-Track Protocol (Academic Transparency)

When ANY of these occur during a session, you MUST:
1. Append an entry to `qif-framework/QIF-DERIVATION-LOG.md` (if it's a framework insight)
2. Append an entry to `qif-framework/QIF-FIELD-JOURNAL.md` (if it's a personal/experiential observation)
3. Note it in the daily memory log with tag [DECISION] or [DERIVATION]

**Triggers:**
- New hypothesis formulated or existing one revised
- Cross-AI validation performed (Gemini, GPT, etc.)
- Literature gap identified or confirmed
- A claim is corrected (especially AI hallucination caught)
- Framework architecture changes (bands, scoring, protocols)
- A "Not Claimed" or "Established vs Hypothesis" boundary shifts
- User says "remember this," "this is important," "lightbulb," or equivalent
- New attack technique or therapeutic mapping discovered

**Entry must include:**
- Date and approximate time
- Which AI system(s) were involved and their role
- What the human decided (the human decision is ALWAYS documented)
- What was accepted vs rejected from AI suggestions
- Classification: VERIFIED / INFERRED / HYPOTHESIS

**Research Commit Messages:**
For research-significant commits (derivation log entries, hypothesis docs, papers, blog posts), use this extended format:
```
[Action] [Scope]: Brief description

AI-Collaboration:
  Model: [model name]
  Role: [co-derivation | literature search | writing assist | code generation | peer review]
  Cross-AI: [other model — role] (if applicable)
  Human-Decided: [list key human decisions]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
This is NOT required for routine code changes — only for research-significant commits.

## Citation & Preprint Integrity Protocol (MANDATORY)

This protocol exists because the Zenodo preprint v1.0 shipped with 3 fabricated citations and 3 wrong author lists — all AI-hallucinated. Dr. Schroder caught one publicly. We cannot afford a repeat.

### Citation Rules
1. **NEVER trust AI-generated citations.** Every DOI, arxiv ID, author list, and title MUST be verified by resolving the link before any publication.
2. **Verify method:** Run Crossref API (`https://api.crossref.org/works/DOI`), fetch the arxiv abstract page, or visit the publisher page. If the DOI doesn't resolve, the citation is fabricated.
3. **Cross-AI validation does NOT substitute for verification.** Gemini, GPT, etc. can also hallucinate citations. Only a resolved URL counts as verified.
4. **When adding a new reference to the LaTeX paper (`paper/references.bib`):**
   - Resolve the DOI or URL and confirm: title, all authors (first and last), year, journal/venue
   - Add a `note = {Verified YYYY-MM-DD via [source]}` field to the BibTeX entry
   - If the reference came from AI suggestion, add `note = {AI-suggested, verified YYYY-MM-DD via [source]}`

### Preprint Version Sync Protocol
When a new version of the preprint is compiled and ready for release:
1. **Compile:** `cd paper && make deploy` (builds PDF + copies to `docs/papers/`)
2. **Update LaTeX version note** in `paper/sections/09-limitations.tex` (revision description)
3. **Upload to Zenodo** as a new version (use all-versions DOI 10.5281/zenodo.18640105)
4. **Build site:** `npm run build` (prebuild auto-copies latest PDF)
5. **Commit and push** — GitHub Pages deploys automatically
6. **Verify the live PDF** at `https://qinnovate.com/papers/qif-bci-security-2026.pdf` contains the changes

### DOI Convention
- **Always use the all-versions DOI** (`10.5281/zenodo.18640105`) in public references — it automatically resolves to the latest version.
- **Never hardcode version-specific DOIs** in public-facing pages (site, README, whitepaper). Version-specific DOIs are only for historical records (post-mortems, sent emails).

## AI Disclosure & Publication Compliance (MANDATORY)

This section ensures compliance with AI disclosure policies across all target venues. These rules apply to ALL papers, preprints, blog posts, and public documents.

### Publisher Policies (as of Feb 2026)

| Venue | AI Authorship | Disclosure Location | Key Requirement |
|-------|--------------|---------------------|-----------------|
| **arXiv** | Prohibited | Field norms (dedicated section recommended) | Author takes full responsibility; name tools and roles. CS review/survey ban (Oct 2025) |
| **ACM** (WOOT, CCS) | Prohibited | Acknowledgements | "Commensurate with proportion of new text generated"; AI cannot be cited |
| **IEEE** (Graz BCI, ICBC) | Prohibited | Acknowledgements | Name AI system, identify sections used, describe level of use |
| **USENIX/WOOT** | Prohibited | Paper body + HotCRP attestation | No fully AI-generated sections; written attestation required |
| **Springer/Nature** | Prohibited | Methods section | AI images prohibited; copy editing exempt |
| **Elsevier** | Prohibited | Dedicated section above References | Template statement: "During preparation... used [TOOL] for [REASON]" |
| **Wiley** | Prohibited | Methods OR Acks OR dedicated | IP ownership check required; no AI photos |
| **Science/AAAS** | Prohibited | Cover letter + Acks + Methods | NEAR-BAN on AI text; full prompts required |
| **AAAI** | Prohibited | Paper body | AI text banned unless it's the experiment |
| **NeurIPS** | Prohibited | Experimental setup | Post-acceptance revocation possible |
| **ICML** | Prohibited | Paper body | Immediate rejection for undisclosed AI |
| **ICLR** | Prohibited | Paper body + submission form | Desk rejection; reviewer cross-enforcement |
| **ICMJE** | Prohibited | Acks (writing) / Methods (data) | Medical journal standard; AI cannot be cited |
| **COPE** | Prohibited | Transparent (not prescribed) | Evolving enforcement framework |
| **Zenodo** | N/A (repository) | No specific policy | Apply strictest target venue policy regardless |

**Full policy details with URLs:** See skill `ai-disclosure-compliance` and its `references/venue-policies.md`.

### Pre-Publication AI Disclosure Checklist

Before ANY paper submission, preprint upload, or public post, verify:

1. **AI tools are NOT listed as authors.** Co-Authored-By in git commits is fine; author lists in papers are not.
2. **Disclosure section exists** in the paper (Section 9.7 "AI Tool Disclosure" in our preprint).
3. **Tools are named with versions:** e.g., "Claude 4 (Anthropic), Gemini 2.0 (Google), ChatGPT 4o (OpenAI)"
4. **Sections where AI was used are identified** (IEEE requirement): literature review, code generation, writing assistance, cross-validation — mapped to specific paper sections.
5. **Level of use is described** (IEEE requirement): e.g., "draft text substantially rewritten by author" vs "code generated and reviewed."
6. **Proportion is stated** (ACM requirement): e.g., "less than 15% of text retained verbatim from AI output."
7. **Human-originated contributions are explicitly stated:** architecture, methodology, scoring, clinical mappings, conclusions.
8. **Author responsibility statement is included:** "The author takes full responsibility for all content in this paper, irrespective of how it was generated."
9. **Transparency log URL is provided:** Link to `governance/TRANSPARENCY.md`.
10. **Citation fabrication history is disclosed:** Our v1.0 had 3 fabricated citations; this must be acknowledged in every version.

### Venue-Specific Notes

- **ACM venues (WOOT):** Authors cannot post to ResearchGate, Academia.edu, Mendeley, or Sci-Hub. arXiv and Zenodo are allowed. Post the DOI of the published version alongside the preprint.
- **IEEE venues:** "The use of AI systems for editing and grammar enhancement is common practice and generally outside the intent of the policy" — but must still be disclosed if substantial.
- **USENIX/WOOT:** No fully AI-generated sections. Written attestation required in HotCRP. OSDI '26: "submission of work wholly or largely generated by AI constitutes fraud."
- **arXiv:** Three requirements: (1) AI cannot be author, (2) disclose significant use with tools named, (3) author responsibility statement. Oct 2025: CS review/survey papers now require prior peer-review acceptance.
- **Science/AAAS:** STRICTEST policy. AI-generated prose in the body is PROHIBITED. Full prompts must be disclosed in Methods. One of only ~4 publishers with an actual ban vs disclosure.
- **ICLR/ICML (2026):** Desk rejection for undisclosed AI use. ICLR has cross-enforcement: reviewers who fail to disclose risk desk rejection of their own papers.
- **NeurIPS:** Jan 2026 report found 100+ AI-hallucinated citations in accepted NeurIPS 2025 papers.
- **Zenodo:** No AI-specific policy, but apply the strictest target venue policy regardless.
- **No government mandate:** Neither US federal law nor EU regulation currently mandates AI disclosure in academic papers. Publisher policies are the only binding framework.

### Blog Posts & Public Content

For blog posts on qinnovate.com, include a footer: "Written with AI assistance (Claude). All claims verified by the author." This is lighter than paper-level disclosure but maintains transparency.

## Standards & Governance (Scale)
- **QIF (Security)**: All architectural changes must align with the 11-band hourglass model.
- **TARA (Threats)**: New techniques must be scored with NISS (Neural Impact Scoring System).
- **Governance**: Refer to `governance/` for ethics, consent, and regulatory compliance.
- **Scale**: This is a standards body. Changes affect the industry. Verification is critical.

