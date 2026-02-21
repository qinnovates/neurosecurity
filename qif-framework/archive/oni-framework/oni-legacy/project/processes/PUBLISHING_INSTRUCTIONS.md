# ONI Framework Publishing Instructions

## Overview

This document provides standardized instructions for Claude to follow when extracting, formatting, and uploading new content publications to the ONI Framework repository.

**Important:**
- The `publications/` folder is for **content only**
- All templates, processes, and scripts live in `MAIN/legacy-core/resources/`

---

## Repository Structure

```
ONI/
├── README.md                           # Main documentation
├── CLAUDE.md                           # Claude AI instructions
├── AGENTS.md                           # Ralph Loop learnings
├── ABOUT.md                            # Author bio
├── LICENSE                             # Apache 2.0
│
├── .github/
│   ├── .gitignore                      # Git ignore rules
│   ├── workflows/                      # CI/CD pipelines
│   └── security-audit/                 # Security scanning
│
└── MAIN/legacy-core/
    ├── INDEX.md                        # Central hub
    ├── CONTRIBUTING.md                 # Contribution guidelines
    ├── RELATED_WORK.md                 # Prior BCI security research
    │
    ├── governance/                     # Ethics & transparency
    │   ├── TRANSPARENCY.md
    │   └── NEUROETHICS_ALIGNMENT.md
    │
    ├── project/                        # Project management
    │   ├── prd.json                    # Task tracker
    │   └── processes/                  # This folder
    │       ├── PUBLISHING_INSTRUCTIONS.md
    │       └── PROCESS_IMPROVEMENTS.md
    │
    ├── visualizations/                 # Interactive demos
    │
    ├── publications/                   # CONTENT ONLY
    │   ├── 0-oni-framework/
    │   ├── coherence-metric/
    │   ├── neural-firewall/
    │   ├── neural-ransomware/
    │   ├── quantum-encryption/
    │   └── scale-frequency/
    │
    └── resources/                      # NON-CONTENT (infrastructure)
        ├── templates/                  # Formatting templates
        ├── editor/                     # Editor Agent
        ├── agents/                     # PM Agent
        └── pipeline/                   # Research pipeline
```

---

## Folder Purposes

| Folder | Purpose | What Goes Here |
|--------|---------|----------------|
| `governance/` | **Ethics & transparency** | TRANSPARENCY.md, NEUROETHICS_ALIGNMENT.md |
| `project/` | **Project management** | prd.json, processes/ |
| `publications/` | **Content only** | Blog posts, technical documents |
| `visualizations/` | **Interactive demos** | Web apps, visualizations |
| `resources/templates/` | Formatting templates | APA template, Blog template |
| `resources/pipeline/` | Research pipeline | Scripts, incoming papers, processed research |

---

## File Naming Conventions

### Publications (Content)
| Type | Format | Example |
|------|--------|---------|
| Blog Posts | `Blog-[Topic_Name].md` | `Blog-Coherence_Metric.md` |
| Technical Documents | `TechDoc-[Topic_Name].md` | `TechDoc-Neural_Ransomware.md` |
| Detailed TechDocs | `TechDoc-[Topic_Name]_Detailed.md` | `TechDoc-Coherence_Metric_Detailed.md` |

### Templates
| Type | Format | Example |
|------|--------|---------|
| TechDoc Templates | `[TYPE]_TEMPLATE_[FORMAT].md` | `TECHDOC_TEMPLATE_APA.md` |
| Post Templates | `[TYPE]_TEMPLATE.md` | `BLOG_TEMPLATE.md` |

### Pipeline Research
| Type | Format | Example |
|------|--------|---------|
| Incoming | `YYYY-MM-DD_[source]_[title].md` | `2026-01-21_arxiv_neural-security.md` |
| Processed | Same, moved to processed/ | After review and integration |

### Folder Names
- Use lowercase with hyphens
- Descriptive of the topic
- Examples: `coherence-metric`, `neural-firewall`, `scale-frequency`

---

## Content Types

### 1. Blog Posts (`Blog-*.md`)
**Location:** `MAIN/legacy-core/publications/[topic]/`
**Template:** `MAIN/legacy-core/resources/templates/BLOG_TEMPLATE.md`

**Characteristics:**
- Conversational tone
- Uses storytelling and analogies
- Shorter paragraphs for web readability
- Includes section breaks (`• • •` or `---`)
- 5-15 minute read time (1,500-4,000 words)

**Required Front Matter:**
```yaml
---
title: "Article Title"
date_posted: [Publication date in RFC 2822 format]
original_url: [Original Medium URL if applicable]
tags: ['tag1', 'tag2', 'tag3']
---
```

**Required Footer:**
```markdown
**Sub-Tags:** #Tag1 #Tag2 #Tag3

---
*Originally published on [Medium](URL) on [Month Day, Year] at [HH:MM:SS GMT]*
```

**Note:** Use `date_posted` (not `date`) in front matter. Use `Sub-Tags:` (not `Tags:`) for the hashtag line at the bottom. Include original Medium URL if the post was originally published there.

### 2. Technical Documents (`*_TechDoc.md`)
**Location:** `MAIN/legacy-core/publications/[topic]/`
**Template:** `MAIN/legacy-core/resources/templates/TECHDOC_TEMPLATE_APA.md`

**Characteristics:**
- Formal academic tone
- APA 7th edition formatting
- Detailed mathematical formulations
- Comprehensive references section
- Tables with bold numbers, italic titles

**Required Sections:**
1. Abstract (with keywords)
2. Introduction
3. [Methods/Framework/Analysis sections]
4. Discussion
5. Limitations
6. Future Work
7. Conclusion
8. References
9. Acknowledgments

---

## Keyword Extraction Workflow

**IMPORTANT:** When adding new publications, extract and add keywords to maintain research monitoring relevance.

### Step 1: Extract Keywords from New Publication

After creating a new publication, extract keywords in these categories:

1. **Primary Keywords** (5-8): Core concepts unique to this publication
2. **Technical Terms** (8-12): Specific technical vocabulary
3. **Biological Terms** (5-8): Neuroscience-specific terminology
4. **Security Terms** (5-8): Cybersecurity-related terms

### Step 2: Update keywords.json

Add keywords to `MAIN/legacy-core/resources/pipeline/scripts/keywords.json`:

```json
{
  "publications": {
    "new-topic": {
      "title": "New Topic Title",
      "primary_keywords": [...],
      "technical_terms": [...],
      "biological_terms": [...],
      "security_terms": [...]
    }
  }
}
```

### Step 3: Update Combined Search Terms

If the new publication introduces new research areas, add relevant terms to `combined_search_terms` in keywords.json.

---

## Publishing Workflow

### Step 1: Content Extraction
When extracting content from a new source:

1. **Identify the source type:**
   - Medium RSS feed
   - Draft document
   - Conversation notes
   - Research synthesis
   - Pipeline incoming folder

2. **Determine publication category:**
   - Which existing topic folder does this belong to?
   - Does it require a new topic folder?

3. **Extract and clean:**
   - Remove conversion resources
   - Fix encoding issues (em-dashes, quotes, etc.)
   - Preserve meaningful formatting

### Step 2: Formatting

**For Blog Posts:**
- Reference: `MAIN/legacy-core/resources/templates/BLOG_TEMPLATE.md`

**For Technical Documents:**
- Reference: `MAIN/legacy-core/resources/templates/TECHDOC_TEMPLATE_APA.md`
- Use bold table numbers: `**Table 1**`
- Use italic table titles: `*Table Title*`
- Include standard acknowledgments

### Step 3: Keyword Extraction

**For every new publication:**

1. Read the complete publication
2. Extract keywords by category
3. Update `MAIN/legacy-core/resources/pipeline/scripts/keywords.json`
4. This ensures the research monitor finds relevant new papers

### Step 4: Quality Checks

Before committing:

1. **Verify file location:**
   - Content → `publications/`
   - Templates → `resources/templates/`
   - Process docs → `resources/processes/`
   - Scripts → `resources/pipeline/scripts/`

2. **Verify file naming:**
   - Blog files: `Blog-[Topic].md`
   - TechDocs: `TechDoc-[Topic].md`

3. **Check formatting consistency:**
   - Tables formatted correctly
   - Headers hierarchy proper
   - No orphaned formatting

4. **Validate references:**
   - APA format for papers
   - Working URLs where applicable

5. **Verify keywords updated:**
   - New publication added to keywords.json
   - Combined search terms updated if needed

### Step 5: Commit and Push

```bash
git add .
git commit -m "Add [Topic] publication

- [Brief description of content]
- [Type: Medium/TechDoc/Both]
- Updated keywords.json

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push
```

---

## Standard Acknowledgments

Include this in all technical documents:

> The author wishes to acknowledge the support of colleagues and mentors in the development of this work. Initial research validation was conducted through LMArena (LMSYS, 2024-2025), enabling cross-model verification of hypotheses and findings to mitigate single-model bias. Deep research synthesis and writing assistance was provided by Claude (Anthropic, 2025). All original ideas, theoretical frameworks, analyses, and conclusions are the author's own. Final revisions, editing, and validation were performed by the author.

---

## Research Monitor Usage

The research monitor script uses keywords from publications to find relevant new research.

### Running the Monitor

```bash
cd MAIN/legacy-core/resources/pipeline/scripts
python research_monitor.py --days 7 --sources all
```

### Options
- `--days N` - Look back N days (default: 7)
- `--sources arxiv,pubmed,biorxiv,semantic_scholar,ieee` - Specific sources or "all"
- `--keywords-file path` - Custom keywords file path
- `--quiet` - Suppress progress output
- `--summary-only` - Print summary without saving files

### Academic Sources
- **arXiv** - cs.CR, q-bio.NC, cs.AI categories
- **PubMed** - Medical/neuroscience literature
- **bioRxiv/medRxiv** - Preprints
- **Semantic Scholar** - Cross-disciplinary
- **IEEE Xplore** - Engineering (requires API key)

---

## Common Tasks

### Adding a New Topic

1. Create folder: `MAIN/legacy-core/publications/[topic-name]/`
2. Add blog post: `Blog-[Topic_Name].md` (include original Medium URL if applicable)
3. Add technical document: `TechDoc-[Topic_Name].md`
4. **Extract keywords and update keywords.json**
5. Update README.md with new links

### Processing Pipeline Incoming Research

1. Review files in `MAIN/legacy-core/resources/pipeline/incoming/`
2. Determine relevance to ONI Framework
3. If relevant: Extract key findings, create summary
4. Move processed file to `MAIN/legacy-core/resources/pipeline/processed/`
5. Update publications if new content warranted

### Updating Existing Content

1. Read current file to understand structure
2. Make edits preserving formatting
3. Update any affected cross-references
4. **Update keywords.json if new terms introduced**
5. Commit with descriptive message

---

## Checklist for New Publications

### Content Quality
- [ ] Content extracted and cleaned
- [ ] Placed in correct folder (content only in publications/)
- [ ] File named correctly (`Blog-*.md` or `TechDoc-*.md`)
- [ ] Front matter/metadata complete (date_posted, original_url if applicable)
- [ ] Footer complete (Sub-Tags, Originally published with datetime and link)
- [ ] Formatting consistent with existing publications
- [ ] Tables numbered with bold numbers, italic titles
- [ ] References in APA format (TechDocs only)
- [ ] Acknowledgments included (TechDocs only)

### Repository Updates
- [ ] **Keywords extracted and added to keywords.json**
- [ ] README.md updated if needed
- [ ] INDEX.md updated with new topics/documents

### Transparency Documentation (REQUIRED)
- [ ] **TRANSPARENCY.md updated** — Document AI contributions for this session
- [ ] **AI corrections documented** — Any overrides/rejections added to Refinement Loop section
- [ ] **Commit includes Co-Authored-By tag** — For AI-assisted work
- [ ] **NEUROETHICS_ALIGNMENT.md updated** — If new framework components affect ethics mapping

---

## Transparency Documentation Workflow

> **CRITICAL:** The ONI Framework maintains Responsible AI standards. Every publishing session involving AI assistance must update transparency documentation.

### When to Update TRANSPARENCY.md

Update `TRANSPARENCY.md` (repository root) whenever:

1. **New publications are added** with significant AI assistance
2. **AI suggestions were rejected or modified** — Document in "Refinement Loop" section
3. **New content domains added** — Update contribution matrix
4. **Methodology changes** — Document new verification approaches

### TRANSPARENCY.md Update Steps

1. **Update "Last Updated" date** in document header
2. **Add to Contribution Matrix** if new domain (e.g., new topic area)
3. **Add to "Documented Corrections"** if you corrected any AI output:
   ```markdown
   #### Example N: [Brief Title]
   - **AI Initial Output**: [What AI suggested]
   - **Human Override/Correction**: [What was changed]
   - **Action Taken**: [Where implemented]
   - **Reasoning**: [Why this matters]
   ```
4. **Update statistics** if correction/rejection rate changed significantly

### NEUROETHICS_ALIGNMENT.md Updates

Update `MAIN/governance/NEUROETHICS_ALIGNMENT.md` when:

- New framework components are added
- Security features are modified
- New ethical considerations are identified

---

*Instructions Version: 5.0*
*Last Updated: 2026-01-22*
*Series: ONI Framework Publications*
