# Scripts

Site scripts and CI utilities for the Qinnovate project.

## Table of Contents

- [Site Scripts](#site-scripts)
- [Verification Pipeline](#verification-pipeline)

## Site Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `fetch-news.mjs` | Fetches external news items for the news feed page | `npm run fetch-news` |
| `field-journal-to-blog.mjs` | Converts QIF Field Journal entries into blog post markdown files | `node scripts/field-journal-to-blog.mjs` |
| `generate-ethics-md.ts` | Generates ethics markdown from governance source data | `npx ts-node scripts/generate-ethics-md.ts` |
| `sync-agents.mjs` | Syncs agent configuration files across the project | `node scripts/sync-agents.mjs` |
| `check-transparency-sync.sh` | Validates that transparency records are in sync | `bash scripts/check-transparency-sync.sh` |

## Verification Pipeline

Scripts in `verify/` handle citation checking, fact verification, and content auditing. These run in CI via GitHub Actions workflows.

| Script | Description | Usage |
|--------|-------------|-------|
| `verify/run_all.py` | Orchestrator that runs all verification modules based on changed paths | `python scripts/verify/run_all.py` |
| `verify/verify_citations.py` | Resolves DOIs, arXiv IDs, and hyperlinks in paper references | `python scripts/verify/verify_citations.py` |
| `verify/verify_crossrefs.py` | Cross-references internal citations between documents | `python scripts/verify/verify_crossrefs.py` |
| `verify/verify_facts.py` | Validates factual claims against source material | `python scripts/verify/verify_facts.py` |
| `verify/fact_check_field_journal.py` | Fact-checks field journal blog posts (DOIs, URLs, named citations) | `python scripts/verify/fact_check_field_journal.py` |
| `verify/audit_blog_claims.py` | Audits numerical and sourced claims in blog posts | `python scripts/verify/audit_blog_claims.py` |
| `verify/utils.py` | Shared utilities for verification scripts | (library) |

Dead links and unresolvable DOIs block the CI pipeline. Unsourced numerical claims produce advisory warnings.

---

*See `.github/workflows/` for CI integration.*
