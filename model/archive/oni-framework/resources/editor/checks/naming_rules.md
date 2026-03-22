# Naming Convention Rules

> Sub-instruction file for Editor Agent — validates file and folder naming

---

## Folder Naming

### Rule: Lowercase with Hyphens

**Pattern:** `^[a-z0-9]+(-[a-z0-9]+)*$`

**Examples:**
| Correct | Incorrect |
|---------|-----------|
| `coherence-metric` | `Coherence-Metric` |
| `neural-firewall` | `neural_firewall` |
| `scale-frequency` | `ScaleFrequency` |
| `0-oni-framework` | `ONI-Framework` |

**Exception:** `0-oni-framework` prefix for sorting (numbers allowed)

---

## File Naming

### Blog Posts

**Pattern:** `Blog-[A-Z][a-zA-Z_]+\.md$`

**Format:** `Blog-[Topic_Name].md`

| Correct | Incorrect |
|---------|-----------|
| `Blog-ONI_Framework.md` | `blog-oni-framework.md` |
| `Blog-Coherence_Metric.md` | `Blog-Coherence-Metric.md` |
| `Blog-Neural_Firewall.md` | `Blog_Neural_Firewall.md` |

### Technical Documents

**Pattern:** `TechDoc-[A-Z][a-zA-Z_]+\.md$`

**Format:** `TechDoc-[Topic_Name].md`

| Correct | Incorrect |
|---------|-----------|
| `TechDoc-ONI_Framework.md` | `techdoc-oni-framework.md` |
| `TechDoc-Scale_Frequency.md` | `TechDoc-Scale-Frequency.md` |

### Detailed Technical Documents

**Pattern:** `TechDoc-[A-Z][a-zA-Z_]+_Detailed\.md$`

**Format:** `TechDoc-[Topic_Name]_Detailed.md`

### README Files

**Pattern:** `README\.md$`

- Every topic folder must have `README.md`
- Main wiki uses `INDEX.md` (exception)

### Template Files

**Pattern:** `[A-Z]+_TEMPLATE(_[A-Z]+)?\.md$`

| Correct | Incorrect |
|---------|-----------|
| `TECHDOC_TEMPLATE_APA.md` | `techdoc-template.md` |
| `BLOG_TEMPLATE.md` | `Blog_Template.md` |
| `README_TEMPLATE.md` | `readme_template.md` |

---

## Topic Name Transformation

**Rule:** Folder name → File topic name

| Folder | Topic Name (in filename) |
|--------|-------------------------|
| `coherence-metric` | `Coherence_Metric` |
| `neural-firewall` | `Neural_Firewall` |
| `scale-frequency` | `Scale_Frequency` |
| `0-oni-framework` | `ONI_Framework` |

**Transformation:**
1. Remove leading numbers and hyphen (`0-`)
2. Split on hyphens
3. Capitalize each word
4. Join with underscores

---

## Location Rules

### Content Files (publications/ only)

| File Type | Allowed Location |
|-----------|-----------------|
| `Blog-*.md` | `MAIN/legacy-core/publications/[topic]/` |
| `TechDoc-*.md` | `MAIN/legacy-core/publications/[topic]/` |
| Topic `README.md` | `MAIN/legacy-core/publications/[topic]/` |

### Infrastructure Files (resources/ only)

| File Type | Allowed Location |
|-----------|-----------------|
| `*_TEMPLATE*.md` | `MAIN/legacy-core/resources/templates/` |
| Process docs | `MAIN/legacy-core/resources/processes/` |
| Scripts | `MAIN/legacy-core/resources/pipeline/scripts/` |
| Editor files | `MAIN/legacy-core/resources/editor/` |

### Root Level Files

| File | Location |
|------|----------|
| `README.md` | Repository root |
| `CLAUDE.md` | Repository root |
| `TRANSPARENCY.md` | Repository root |
| `INDEX.md` | `MAIN/legacy-core/` only |

---

## Validation Checks

### Check 1: Folder Names
```bash
# Find incorrectly named folders
find MAIN/legacy-core/publications -type d | grep -E "[A-Z]|_"
```

### Check 2: Blog File Names
```bash
# Find incorrectly named blogs
find MAIN/legacy-core/publications -name "Blog-*.md" | grep -vE "Blog-[A-Z][a-zA-Z_]+\.md"
```

### Check 3: TechDoc File Names
```bash
# Find incorrectly named techdocs
find MAIN/legacy-core/publications -name "TechDoc-*.md" | grep -vE "TechDoc-[A-Z][a-zA-Z_]+\.md"
```

### Check 4: Misplaced Files
```bash
# Templates in wrong location
find MAIN/legacy-core/publications -name "*TEMPLATE*"

# Content in wrong location
find MAIN/legacy-core/resources -name "Blog-*" -o -name "TechDoc-*"
```

---

## Action Protocol

### For Naming Violations

**Severity: HIGH — Requires Approval**

1. **Detect** — File/folder doesn't match pattern
2. **Report** — Show current name and expected pattern
3. **Propose** — Suggest corrected name
4. **Wait** — Require user approval (may affect links)
5. **Rename** — Use `git mv` to preserve history
6. **Update Links** — Fix all references to old name

### For Location Violations

**Severity: HIGH — Requires Approval**

1. **Detect** — File in wrong directory
2. **Report** — Show current and expected location
3. **Propose** — Suggest move operation
4. **Wait** — Require user approval
5. **Move** — Use `git mv`
6. **Update Links** — Fix all references

---

## Quick Reference Regex

```
Folder:     ^[a-z0-9]+(-[a-z0-9]+)*$
Blog:       ^Blog-[A-Z][a-zA-Z_]+\.md$
TechDoc:    ^TechDoc-[A-Z][a-zA-Z_]+(_Detailed)?\.md$
Template:   ^[A-Z]+_TEMPLATE(_[A-Z]+)?\.md$
README:     ^README\.md$
INDEX:      ^INDEX\.md$
```

---

*Naming Rules v1.0*
