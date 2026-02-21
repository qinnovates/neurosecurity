# Cross-Dependency Chains

How data flows through the qinnovate project. When a source file changes, everything downstream updates automatically (via build or CI workflow).

**Last updated:** 2026-02-21

---

## Chain Map

### Chain 1: Threat Registry Pipeline

```
shared/qtara-registrar.json (master registry, 103 techniques)
  │
  ├──► src/lib/threat-data.ts (adapts to TS types)
  │      ├──► src/pages/api/qif.json.ts ──► /api/qif.json (unified endpoint)
  │      ├──► src/pages/api/tara.json.ts ──► /api/tara.json (legacy)
  │      ├──► src/pages/api/stix.json.ts ──► /api/stix.json (STIX 2.1)
  │      ├──► src/pages/TARA/[id].astro ──► /TARA/<id>/ (threat detail pages)
  │      ├──► src/components/TaraExplorer.tsx (TARA explorer UI)
  │      ├──► src/components/dashboard/BciDashboard.tsx (threat profiles)
  │      └──► src/pages/bci/api.astro (API docs page, live stats)
  │
  ├──► shared/qtara/ (Python SDK)
  │      └──► PyPI (qtara package, via publish-pypi.yml)
  │
  └──► scripts/verify/ (citation + fact verification)
```

**Trigger:** Edit `shared/qtara-registrar.json`
**Auto-updates:** All API endpoints, TARA pages, explorer UIs, Python SDK (on push to main)
**Workflows:** `deploy.yml` (rebuild site), `publish-pypi.yml` (republish SDK)

---

### Chain 2: Brain Atlas Pipeline

```
shared/qif-brain-bci-atlas.json (38 regions, device mappings, physics)
  │
  ├──► src/pages/api/qif.json.ts ──► /api/qif.json (brain_atlas section)
  ├──► src/lib/atlas-data.ts ──► Brain atlas components
  ├──► src/lib/bci-data.ts ──► Device specs (merged with atlas)
  │      ├──► src/components/dashboard/BciDashboard.tsx
  │      ├──► src/components/BciExplorer.tsx
  │      └──► src/pages/bci/api.astro (live device count)
  └──► src/lib/brain-view-data.ts ──► 3D brain visualization
```

**Trigger:** Edit `shared/qif-brain-bci-atlas.json`
**Auto-updates:** Unified API, BCI dashboard, BCI explorer, brain visualizations

---

### Chain 3: BCI Device Inventory Pipeline

```
docs/bci-hardware-inventory.json (24 devices)
  │
  └──► src/lib/bci-data.ts (merges with atlas)
         ├──► src/pages/api/qif.json.ts ──► /api/qif.json (devices section)
         ├──► src/components/dashboard/BciDashboard.tsx
         ├──► src/components/BciExplorer.tsx
         └──► src/pages/bci/api.astro
```

**Trigger:** Edit `docs/bci-hardware-inventory.json`
**Auto-updates:** API, dashboard, explorer

---

### Chain 4: Physics Constants Pipeline

```
src/lib/bci-limits-constants.ts (13 constraints, 14 constants)
  │
  ├──► src/pages/api/qif.json.ts ──► /api/qif.json (physics section)
  ├──► src/pages/bci/api.astro (live constraint count)
  └──► src/components/dashboard/BciDashboard.tsx (physics panel)
```

**Trigger:** Edit `src/lib/bci-limits-constants.ts`
**Auto-updates:** API, API docs page, dashboard physics panel

---

### Chain 5: QIF Model Constants Pipeline

```
src/lib/qif-constants.ts (11 bands, coherence thresholds)
  │
  ├──► src/pages/api/qif.json.ts ──► /api/qif.json (hourglass_bands)
  ├──► src/components/HourglassPreview.tsx (interactive hourglass)
  ├──► src/components/TaraExplorer.tsx (band filters)
  ├──► src/components/BciExplorer.tsx (band mapping)
  └──► src/components/dashboard/BciDashboard.tsx (hourglass panel)
```

**Trigger:** Edit `src/lib/qif-constants.ts`
**Auto-updates:** API, all hourglass visualizations, explorer UIs

---

### Chain 6: Timeline + Stats Pipeline

```
shared/derivation-timeline.json (milestones + current_stats)
  │
  ├──► prebuild (copied to docs/data/)
  ├──► src/pages/api/qif.json.ts ──► /api/qif.json (timeline, current_stats)
  └──► src/data/qif-timeline.json (project-level stats)
         └──► scripts/timeline-check.mjs ──► staleness warnings

src/data/qif-timeline.json
  └──► timeline-check.yml (CI: warns if stats are stale)
```

**Trigger:** Edit `shared/derivation-timeline.json`
**Auto-updates:** API timeline section, prebuild copies to `docs/data/`
**Manual check:** `node scripts/timeline-check.mjs --dry-run`

---

### Chain 7: Field Journal Pipeline

```
qif-framework/QIF-FIELD-JOURNAL.md (raw entries)
  │
  └──► field-journal-blog.yml (CI, on push)
         ├──► scripts/field-journal-to-blog.mjs ──► blogs/*.md (new posts)
         └──► scripts/verify/fact_check_field_journal.py (gate)
                └──► blogs/*.md (fact_checked: true/false injected)
                       ├──► src/pages/publications/[...slug].astro (blog pages)
                       ├──► src/pages/news.astro (field journal section)
                       └──► src/pages/rss.xml.ts ──► /rss.xml
```

**Trigger:** Edit `qif-framework/QIF-FIELD-JOURNAL.md`, push to main
**Auto-updates:** Blog posts generated, fact-checked, committed, deployed
**Workflow:** `field-journal-blog.yml`

---

### Chain 8: News Feed Pipeline

```
RSS feeds (13 external sources)
  │
  └──► update-news.yml (daily cron 17:00 UTC)
         └──► scripts/fetch-news.mjs
                └──► src/data/external-news-cache.json
                       ├──► src/pages/news.astro (industry news section)
                       └──► deploy.yml (triggered by push)
```

**Trigger:** Daily schedule (automatic)
**Auto-updates:** News page, site rebuild if cache changed
**Workflow:** `update-news.yml` (calls `fetch-news.mjs`)

---

### Chain 9: Changelog Pipeline

```
git log (commit messages with prefix tags)
  │
  └──► changelog.yml (CI, on push to main, skips auto:/chore:)
         └──► scripts/changelog-update.mjs
                ├──► CHANGELOG.md (tier 1+: appended entries)
                ├──► blogs/*-changelog-summary.md (tier 2+: blog draft)
                └──► dist/release-meta.json (tier 3: GitHub Release)
```

**Trigger:** Push to main (non-auto/chore commits)
**Auto-updates:** CHANGELOG.md, blog drafts, GitHub Releases
**Workflow:** `changelog.yml`

---

### Chain 10: Glossary Pipeline (manual)

```
qif-framework/QIF-TRUTH.md (equations, principles, terms)
  │
  └──► src/lib/glossary-constants.ts (MUST be manually synced)
         └──► src/components/GlossaryPanel.tsx
                └──► Glossary tooltips across site
```

**Trigger:** Edit `QIF-TRUTH.md`
**MANUAL:** Must also update `glossary-constants.ts` (per CLAUDE.md rule)
**No automation.** This is a known gap.

---

### Chain 11: Research Sources Pipeline (manual)

```
paper/references.bib
blogs/*.md
qif-framework/nsp/
TARA techniques
  │
  └──► qif-framework/QIF-RESEARCH-SOURCES.md (MUST be manually synced)
```

**Trigger:** Any new citation referenced anywhere in the project
**MANUAL:** Must update `QIF-RESEARCH-SOURCES.md` (per CLAUDE.md rule)
**Planned automation:** `planned-research-sources-sync` in automation registry

---

### Chain 12: Verification Pipeline

```
paper/ + blogs/ + shared/qtara-registrar.json + qif-framework/
  │
  └──► verify-citations.yml (CI, on PR or push to main)
         └──► scripts/verify/run_all.py
                ├──► verify_citations.py (DOIs, arXiv, hyperlinks)
                ├──► verify_facts.py (factual claims)
                ├──► verify_crossrefs.py (internal cross-references)
                └──► audit_blog_claims.py (blog numerical claims)
                       └──► verify-report.json (artifact)
```

**Trigger:** PR or push touching paper/, blogs/, shared/, qif-framework/
**Auto-updates:** Verification report artifact
**Workflow:** `verify-citations.yml`

---

### Chain 13: Security Audit Pipeline

```
qif-framework/ + governance/ (Python files)
  │
  └──► security-audit.yml (CI, push/PR/weekly/manual)
         └──► .github/security-audit/scripts/audit.py
                └──► security-results.sarif ──► GitHub Security tab
```

**Trigger:** Push to main/develop (Python paths), PR, weekly schedule, manual
**Auto-updates:** SARIF results uploaded to GitHub Security
**Workflow:** `security-audit.yml`

---

### Chain 14: PyPI Publish Pipeline

```
shared/qtara-registrar.json + shared/qtara/
  │
  └──► publish-pypi.yml (CI, on push to main)
         ├──► shared/scripts/sync-package-data.py (syncs registry into package)
         ├──► python -m build ──► wheel + sdist
         ├──► PyPI (qtara package)
         └──► GitHub Release (qtara-vX.Y.Z)
```

**Trigger:** Edit `shared/qtara-registrar.json` or `shared/qtara/**`, push to main
**Auto-updates:** PyPI package, GitHub Release
**Workflow:** `publish-pypi.yml`

---

### Chain 15: Agent Context Pipeline (manual)

```
package.json + tsconfig.json + src/
  │
  └──► scripts/sync-agents.mjs (npm run sync)
         └──► CLAUDE.md (project structure, commands, tech stack sections)
```

**Trigger:** Manual (`npm run sync`)
**Auto-updates:** CLAUDE.md auto-generated sections

---

## Dependency Summary Table

| Source File | Downstream Count | Auto? | Workflows |
|-------------|-----------------|-------|-----------|
| `shared/qtara-registrar.json` | 10+ | Yes | deploy, publish-pypi, verify-citations |
| `shared/qif-brain-bci-atlas.json` | 6 | Yes | deploy |
| `docs/bci-hardware-inventory.json` | 5 | Yes | deploy |
| `src/lib/bci-limits-constants.ts` | 3 | Yes | deploy |
| `src/lib/qif-constants.ts` | 5 | Yes | deploy |
| `shared/derivation-timeline.json` | 3 | Yes | deploy, timeline-check |
| `qif-framework/QIF-FIELD-JOURNAL.md` | 4 | Yes | field-journal-blog |
| `qif-framework/QIF-TRUTH.md` | 2 | **No** | (glossary sync is manual) |
| `qif-framework/QIF-RESEARCH-SOURCES.md` | 0 | **No** | (planned) |
| `git log` | 3 | Yes | changelog |
| RSS feeds (external) | 2 | Yes | update-news (daily cron) |
| `paper/references.bib` | 1 | Partial | verify-citations |

---

## Known Gaps (manual sync required)

| Gap | What to Sync | Where | Rule |
|-----|-------------|-------|------|
| Glossary | New QIF-TRUTH.md entries | `src/lib/glossary-constants.ts` | CLAUDE.md: "QIF Glossary Sync" |
| Research Sources | New citations anywhere | `qif-framework/QIF-RESEARCH-SOURCES.md` | CLAUDE.md: "Research Sources Sync" |
| API docs (this file) | New endpoints or data changes | `docs/docs/api.md` | Update when API routes change |
| Timeline stats | Stale counters | `src/data/qif-timeline.json` | `timeline-check.yml` warns only |

---

## How Builds Propagate

```
Source file changed
  │
  ├──► git push to main
  │      ├──► deploy.yml ──► npm run build ──► GitHub Pages (API endpoints regenerated)
  │      ├──► changelog.yml ──► CHANGELOG.md + blog drafts
  │      ├──► verify-citations.yml (if paper/blogs/framework touched)
  │      ├──► field-journal-blog.yml (if QIF-FIELD-JOURNAL.md touched)
  │      ├──► publish-pypi.yml (if qtara-registrar.json or qtara/ touched)
  │      └──► security-audit.yml (if Python files touched)
  │
  └──► Scheduled jobs (no push needed)
         ├──► update-news.yml (daily 17:00 UTC)
         ├──► security-audit.yml (weekly Sunday midnight)
         └──► update-registry.yml (daily midnight)
```

Every push to main triggers at minimum: `deploy.yml` (full site rebuild) and `changelog.yml` (changelog update). Additional workflows activate based on which files changed.
