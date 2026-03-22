# Synchronization Rules

> Sub-instruction file for Editor Agent — defines what updates cascade to which files

---

## Cascade Dependency Map

```
┌─────────────────────────────────────────────────────────────┐
│                  CANONICAL SOURCE (outside repo)              │
│  QIF-TRUTH.md  (qinnovates/mindloft/drafts/ai-working/)      │
│  See: PROPAGATION.md for full protocol                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTHORITATIVE SOURCES (in repo)            │
│  TechDoc-*.md  →  oni/*.py  →  INDEX.md  →  README.md        │
│     (truth)       (impl)       (nav)        (public)          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DEPENDENT FILES                            │
│  Topic README.md  ←  keywords.json  ←  Root README.md        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL (lowest priority)                 │
│  Blog posts (qinnovates.github.io/blogs/)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Sync Rules by File Type

### When QIF-TRUTH.md Changes (HIGHEST PRIORITY)

| Changed In | Update Required | Auto-Fix? |
|------------|-----------------|-----------|
| Layer definitions | All TechDocs, ONI_LAYERS.md, layers.py | NO |
| Equations | All TechDocs referencing that equation, whitepaper | NO |
| Validated claims | All TechDocs citing those values | NO |
| Framework identity | brand.json, README.md, qif/README.md | NO |
| Blog Sync Status | (self-tracking in Section 6) | N/A |

> **Protocol:** Follow PROPAGATION.md Change Protocol (10-step checklist).
> **Direction:** QIF-TRUTH.md → repo docs → blogs. Never backwards.

### When TechDoc Changes

| Changed In | Update Required | Auto-Fix? |
|------------|-----------------|-----------|
| Layer definitions | Topic README.md layers table | NO |
| Key concepts | Topic README.md concepts table | NO |
| Formula | All files referencing formula | NO |
| Abstract | INDEX.md topic summary | NO |
| Keywords | keywords.json | YES |
| References | None (self-contained) | N/A |

### When Topic README.md Changes

| Changed In | Update Required | Auto-Fix? |
|------------|-----------------|-----------|
| Status | INDEX.md status column | YES |
| Last Updated | (self) date footer | YES |
| Summary | INDEX.md if significantly different | NO |
| Dependencies | INDEX.md dependency map | NO |
| Future Work | None | N/A |

### When INDEX.md Changes

| Changed In | Update Required | Auto-Fix? |
|------------|-----------------|-----------|
| Topic added | Root README.md topics list | NO |
| Dependency map | Topic README.md dependency sections | NO |
| Metrics | (self) — auto-calculate | YES |
| Navigation | Root README.md nav section | NO |

### When Root README.md Changes

| Changed In | Update Required | Auto-Fix? |
|------------|-----------------|-----------|
| Document list | (verify count matches) | YES |
| Navigation | (verify links work) | YES |
| Content | None (end of chain) | N/A |

---

## Auto-Sync Operations

These updates happen automatically:

### 1. Date Propagation
```
When: Any file modified
Update: That file's "Last Updated" field
Format: YYYY-MM-DD
```

### 2. Count Synchronization
```
When: Files added/removed from publications/
Update:
  - README.md footer counts
  - INDEX.md metrics table
Method: Count Blog-*.md and TechDoc-*.md files
```

### 3. Link Repair
```
When: File renamed or moved
Update: All files linking to old path
Method: Find/replace old path → new path
```

### 4. Keywords Sync
```
When: New publication added
Update: keywords.json
Method: Extract from document's Keywords section
```

---

## Manual-Sync Operations (Approval Required)

### 1. Layer Table Sync
```
Trigger: TechDoc-ONI_Framework.md layer change
Affected: All files with "14 Layers" table
Action: Show diff, require approval
```

### 2. Concept Definition Sync
```
Trigger: Key concept changed in TechDoc
Affected: Topic README.md, INDEX.md
Action: Flag inconsistency, propose update
```

### 3. Dependency Map Sync
```
Trigger: New topic or dependency added
Affected: INDEX.md, related topic README.md files
Action: Show proposed additions, require approval
```

### 4. Navigation Structure Sync
```
Trigger: New section or major reorganization
Affected: INDEX.md, README.md, topic README.md
Action: Generate update plan, require approval
```

---

## Sync Detection Queries

### Find Layer References
```bash
grep -rn "L[0-9]\{1,2\}" MAIN/legacy-core/publications/ --include="*.md"
grep -rn "14.*[Ll]ayer" MAIN/legacy-core/ --include="*.md"
```

### Find Formula References
```bash
grep -rn "Cₛ\|C_s\|coherence.*score" MAIN/legacy-core/ --include="*.md"
grep -rn "f.*×.*S\|f \* S\|frequency.*scale" MAIN/legacy-core/ --include="*.md"
```

### Find Broken Links
```bash
# Extract all markdown links and verify targets exist
grep -oE "\[.*\]\(.*\.md\)" MAIN/legacy-core/ --include="*.md" -r
```

### Find Stale Dates
```bash
# Compare Last Updated to git log
git log -1 --format="%ci" -- <file>
```

---

## Conflict Resolution

When authoritative source and dependent file conflict:

1. **Authoritative wins** — TechDoc > README > INDEX
2. **Report conflict** — Show both versions
3. **Propose fix** — Update dependent to match authoritative
4. **Log resolution** — Add to TRANSPARENCY.md if significant

---

## Batch Sync Operations

For major updates affecting multiple files:

### Full Repository Sync
```
1. Read all TechDoc-*.md files (authoritative)
2. Build truth map of: layers, formulas, concepts
3. Scan all dependent files
4. Generate sync report
5. Apply auto-fixes
6. Queue approval items
```

### Topic-Level Sync
```
1. Read TechDoc for specific topic
2. Compare to topic README.md
3. Check INDEX.md entry
4. Verify keywords.json
5. Report discrepancies
```

---

*Sync Rules v1.0*
