# Formatting Rules

> Sub-instruction file for Editor Agent — validates document structure and formatting

---

## TechDoc Formatting (APA 7th Edition)

### Required Structure

```markdown
# [Title]

**Author:** [Name]
**Affiliation:** [Institution]
**Date:** [YYYY-MM-DD]

---

## Abstract

[Abstract text]

**Keywords:** [keyword1], [keyword2], ...

---

## 1. Introduction

## 2. [Section]

## 3. [Section]

...

## N. Conclusion

---

## References

[APA format references]

---

## Acknowledgments

[Standard acknowledgment text]
```

### Section Numbering

- Main sections: `## 1. Title`
- Subsections: `### 1.1 Subtitle`
- Sub-subsections: `#### 1.1.1 Sub-subtitle`

### Table Formatting

**Rule:** Numbers bold, titles italic

```markdown
**Table 1**

*Title of the Table in Italics*

| Column 1 | Column 2 |
|----------|----------|
| Data | Data |
```

**Wrong:**
```markdown
Table 1: Title here    # Missing bold/italic
*Table 1* Title        # Number should be bold
```

### Reference Format (APA)

```
Author, A. A. (Year). Title of work. Publisher.
Author, A. A., & Author, B. B. (Year). Title of article. Journal Name, Volume(Issue), pages. https://doi.org/xxx
```

---

## Blog Formatting

### Required Front Matter

```markdown
---
title: "[Title]"
date_posted: "Day, DD Mon YYYY HH:MM:SS +0000"
original_url: "https://medium.com/@author/slug"
tags: [tag1, tag2, tag3]
---
```

### Required Footer

```markdown
---

**Sub-Tags:** tag1, tag2, tag3

*Originally published [Day, DD Mon YYYY HH:MM:SS +0000] on [Medium](url)*
```

### Section Breaks

Use horizontal rules between major sections:
```markdown
---
```

### Pull Quotes (Optional)

```markdown
> **Key insight or memorable quote**
```

---

## README.md Formatting (Topic)

### Required Sections

```markdown
# [Topic Name] — Index

> **[One-line description]**

**Status:** [Draft|Published|Updated]
**Last Updated:** YYYY-MM-DD
**ONI Layers:** [L1-L14 | specific layers]

---

## Summary

[2-3 paragraph summary]

---

## Dependencies

**This topic builds on:**

| Topic | Relationship |
|-------|--------------|

**Topics that build on this:**

| Topic | Relationship |
|-------|--------------|

---

## Documents

| Type | Document | Description |
|------|----------|-------------|

---

## Key Concepts

| Concept | Definition |
|---------|------------|

---

## Related Topics

| Topic | Connection |
|-------|------------|

---

## Keywords

**Primary:** ...
**Technical:** ...

---

## Future Work

- [ ] Item 1
- [ ] Item 2

---

← Back to [Index](../../INDEX.md)
```

---

## INDEX.md Formatting

### Required Sections

- Navigation header
- Topic tables by category
- Dependency map
- Cross-reference matrix
- Metrics summary
- Roadmap

### Topic Table Format

```markdown
| Topic | Status | Layers | Documents |
|-------|--------|--------|-----------|
| [Topic](path) | Published | L1-L14 | 2 |
```

---

## Common Formatting Rules

### Headers

- H1 (`#`): Document title only, once per file
- H2 (`##`): Major sections
- H3 (`###`): Subsections
- H4 (`####`): Minor divisions

### Links

**Internal (relative):**
```markdown
[Display Text](../folder/file.md)
[Back to Index](../../INDEX.md)
```

**External:**
```markdown
[Display Text](https://example.com)
```

### Code Blocks

````markdown
```language
code here
```
````

### Lists

**Unordered:**
```markdown
- Item 1
- Item 2
  - Nested item
```

**Ordered:**
```markdown
1. First
2. Second
3. Third
```

**Task lists:**
```markdown
- [ ] Uncompleted
- [x] Completed
```

---

## Auto-Fix Rules

### Trailing Whitespace
**Action:** AUTO-FIX — Remove trailing spaces/tabs

### Missing Final Newline
**Action:** AUTO-FIX — Add single newline at end

### Inconsistent Line Endings
**Action:** AUTO-FIX — Convert to LF (Unix)

### Table Alignment
**Action:** AUTO-FIX — Align table columns

### Duplicate Blank Lines
**Action:** AUTO-FIX — Reduce to single blank line

---

## Approval Rules

### Missing Required Sections
**Action:** APPROVAL — Propose section with template

### Wrong Section Order
**Action:** APPROVAL — Propose reorder

### Missing Front Matter
**Action:** APPROVAL — Propose front matter block

### Incorrect Table Format
**Action:** APPROVAL — Propose reformatted table

---

## Validation Checks

### Check 1: TechDoc Structure
```
- Has Abstract section
- Has numbered sections
- Has References section
- Has Acknowledgments section
- Tables use bold numbers, italic titles
```

### Check 2: Blog Structure
```
- Has YAML front matter
- Has required front matter fields
- Has Sub-Tags footer
- Has Originally published footer
```

### Check 3: README Structure
```
- Has Summary section
- Has Dependencies section
- Has Key Concepts section
- Has back link to Index
```

### Check 4: General
```
- Single H1 per file
- No skipped header levels (H1 → H3)
- All links valid
- Code blocks have language specified
```

---

*Format Rules v1.0*
