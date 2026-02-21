# Blogs

Blog posts and field journal entries published on [qinnovate.com](https://qinnovate.com).

## Table of Contents

- [Structure](#structure)
- [Frontmatter Schema](#frontmatter-schema)
- [Field Journal Pipeline](#field-journal-pipeline)
- [Fact-Check Gate](#fact-check-gate)
- [Writing a New Post](#writing-a-new-post)

## Structure

Posts are markdown files named `YYYY-MM-DD-slug.md`. Two categories:

- **Blog posts:** Technical/security articles (e.g., `2026-02-18-the-invisible-flicker-attack-...md`)
- **Field journal entries:** Raw personal observations from Kevin's research journal, prefixed with `field-journal-NNN` (e.g., `2026-02-21-field-journal-018-...md`)

Currently 42 posts (18 field journal entries, 24 technical posts).

## Frontmatter Schema

```yaml
---
title: "Post Title"
subtitle: "Optional subtitle"
date_posted: "YYYY-MM-DD"
source: "https://github.com/qinnovates/qinnovate/blob/main/..."  # optional
tags: ["#Tag1", "#Tag2"]
author: "Kevin Qi"
fact_checked: false          # set to true after verification
fact_check_date: "YYYY-MM-DD"  # date of last fact-check
fact_check_notes:            # array of advisory notes
  - "[advisory] Description of flagged claim"
---
```

Fields `fact_checked`, `fact_check_date`, and `fact_check_notes` are optional with defaults defined in `src/content.config.ts`.

## Field Journal Pipeline

Field journal entries originate in `qif-framework/QIF-FIELD-JOURNAL.md` and are automatically converted to blog posts via CI:

1. Kevin writes a raw entry in `QIF-FIELD-JOURNAL.md`
2. Push to `main` triggers the `field-journal-blog.yml` workflow
3. `scripts/field-journal-to-blog.mjs` generates the blog markdown with frontmatter
4. The fact-check gate runs before committing (see below)
5. If the gate passes, the post is committed to `blogs/`

Manual conversion: `node scripts/field-journal-to-blog.mjs`

## Fact-Check Gate

Before a blog post is committed by CI, `scripts/verify/fact_check_field_journal.py` runs:

- **Errors (block publish):** Dead DOIs, unresolvable arXiv refs, broken hyperlinks
- **Warnings (advisory):** Unsourced numerical claims, unverified named citations, flagged standards references

Use `--inject` to write `fact_checked`, `fact_check_date`, and `fact_check_notes` into frontmatter.

```bash
# Check all posts
python scripts/verify/fact_check_field_journal.py

# Check specific posts
python scripts/verify/fact_check_field_journal.py --posts blogs/2026-02-21-*.md

# Inject results into frontmatter
python scripts/verify/fact_check_field_journal.py --inject
```

## Writing a New Post

1. Create `blogs/YYYY-MM-DD-slug.md` with the frontmatter schema above
2. Write content in markdown
3. Run `python scripts/verify/fact_check_field_journal.py --posts blogs/YYYY-MM-DD-slug.md` to verify
4. Set `fact_checked: true` after reviewing results
5. Commit and push

Blog posts include a footer: "Written with AI assistance (Claude). All claims verified by the author."

---

*All posts are published under [Apache 2.0](../LICENSE).*
