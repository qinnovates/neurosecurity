# Editor Agent — Automated Quality & Synchronization

> **Purpose:** Hybrid agent that auto-fixes mechanical issues and flags content changes for approval. Ensures consistency across all ONI Framework documentation.

**Version:** 1.0
**Last Updated:** 2026-01-22
**Mode:** Hybrid (Auto-fix + Approval)

---

## Quick Reference

| Action Type | Behavior | Examples |
|-------------|----------|----------|
| **AUTO-FIX** | Apply immediately | Dates, counts, broken links, formatting |
| **APPROVAL** | Report and wait | Content changes, layer definitions, new sections |

---

## When Editor Runs

The Editor agent should run:

1. **Before commits** — Catch issues before they're pushed
2. **After content changes** — Propagate updates across related files
3. **On user request** — Manual validation run
4. **Weekly maintenance** — Full repository scan

---

## Auto-Fix Items (No Approval Needed)

These mechanical updates are applied automatically:

### 1. Date Updates
- README.md footer: `*Last update: YYYY-MM-DD*`
- Topic README.md: `**Last Updated:** YYYY-MM-DD`
- INDEX.md timestamps

### 2. Document Counts
- README.md footer: `*Documents: [X] | Topics: [Y]*`
- INDEX.md metrics table
- Count all files matching `Blog-*.md` and `TechDoc-*.md`

### 3. Broken Link Fixes
- Internal links that point to renamed files
- Relative path corrections
- Missing .md extensions

### 4. Formatting Normalization
- Trailing whitespace removal
- Consistent line endings
- Table alignment

### 5. Missing Boilerplate
- Add "← Back to Index" links if missing
- Add Co-Authored-By tag to commits
- Standard acknowledgments section (TechDocs)

---

## Approval Required Items

These content changes require human review:

### 1. Layer Definitions (CRITICAL)
Any change to the 14-layer model must be verified against:
`TechDoc-ONI_Framework.md` (authoritative source)

Auto-detect mismatches, propose fix, WAIT for approval.

### 2. Technical Content
- Mathematical formulas
- Security terminology
- Concept definitions
- Code examples

### 3. Cross-Reference Updates
- Dependency map changes in INDEX.md
- Related topics sections
- New cross-references

### 4. New Sections or Files
- Adding new topics
- Creating new documents
- Structural changes

---

## Authoritative Sources (Truth Hierarchy)

When content conflicts, defer to this hierarchy:

| Priority | Source | Scope |
|----------|--------|-------|
| 1 | `TechDoc-*.md` files | Technical definitions |
| 2 | `oni-framework/oni/*.py` | Implementation details |
| 3 | `INDEX.md` | Navigation & dependencies |
| 4 | Topic `README.md` | Topic summaries |
| 5 | Root `README.md` | Public overview |

**Rule:** Lower priority files must match higher priority sources.

---

## Synchronization Map

When a file changes, these files may need updates:

```
TechDoc-ONI_Framework.md (authoritative)
├── publications/0-oni-framework/README.md [SYNC layers table]
├── MAIN/legacy-core/INDEX.md [SYNC layer references]
├── Root README.md [SYNC if layer summary exists]
└── oni-framework/oni/layers.py [VERIFY code matches]

Any TechDoc-*.md
├── Same-folder README.md [SYNC summary, key concepts]
├── INDEX.md [SYNC topic entry, dependencies]
├── keywords.json [SYNC keywords]
└── Root README.md [SYNC document list]

INDEX.md
├── All topic README.md files [SYNC dependency info]
└── Root README.md [SYNC navigation section]
```

---

## Validation Checks

### Critical Checks (Block Publication)

| Check | Detection | Action |
|-------|-----------|--------|
| Layer mismatch | Compare all "14 Layers" tables to TechDoc | APPROVAL required |
| Formula mismatch | Regex for Cₛ, f×S formulas | APPROVAL required |
| Broken critical link | Links to TechDocs, INDEX | AUTO-FIX if target exists |

### High Priority Checks

| Check | Detection | Action |
|-------|-----------|--------|
| File naming | Regex: `Blog-[A-Z][a-z_]+\.md` | APPROVAL required |
| Content location | Files in wrong folder | APPROVAL required |
| Missing README | Topic folder without README.md | APPROVAL required |

### Medium Priority Checks (Auto-Fix)

| Check | Detection | Action |
|-------|-----------|--------|
| Stale dates | Compare to git commit date | AUTO-FIX |
| Wrong counts | Count vs stated number | AUTO-FIX |
| Missing back-links | No "← Back to Index" | AUTO-FIX |
| Formatting issues | Lint check | AUTO-FIX |

---

## Editor Workflow

### Step 1: Scan
1. Identify changed files (git diff or specified files)
2. Load authoritative sources for comparison
3. Build dependency graph of affected files

### Step 2: Analyze
1. Run all checks against changed files
2. Identify cascade updates needed
3. Categorize issues: AUTO-FIX vs APPROVAL

### Step 3: Auto-Fix
1. Apply all AUTO-FIX items
2. Log changes made
3. Continue to approval items

### Step 4: Report & Approve
1. Present APPROVAL items to user
2. Show proposed changes with diff
3. Wait for user decision per item
4. Apply approved changes

### Step 5: Verify
1. Re-run checks on modified files
2. Confirm all issues resolved
3. Generate final report

---

## Report Format

```markdown
# Editor Report — YYYY-MM-DD

## Auto-Fixed (X items)
- ✓ Updated date in README.md
- ✓ Fixed document count
- ✓ Corrected broken link

## Needs Approval (X items)

### 1. Layer Definition Mismatch
**File:** publications/0-oni-framework/README.md
**Issue:** Layer names don't match TechDoc
**Proposed Fix:** [diff shown]
→ Approve? [Yes/No]

## Summary
- Auto-fixed: X
- Approved: X
- Rejected: X
```

---

## Sub-Instruction Files

Detailed check logic in `checks/` subdirectory:

| File | Purpose |
|------|---------|
| `checks/layer_validation.md` | 14-layer validation rules |
| `checks/sync_rules.md` | Cross-reference cascade rules |
| `checks/naming_rules.md` | File/folder naming patterns |
| `checks/format_rules.md` | Template compliance |

---

*Editor Agent v1.0 — Keeping ONI Framework consistent at scale*
