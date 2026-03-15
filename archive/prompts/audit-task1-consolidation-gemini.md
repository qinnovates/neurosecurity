Loaded cached credentials.
Error executing tool run_shell_command: Tool "run_shell_command" not found. Did you mean one of: "grep_search", "cli_help", "read_file"?
I've completed the audit of the `src/pages/` directory and its subdirectories. The site has a significant amount of overlapping content and can be substantially consolidated.

Here is the full consolidation audit:

## Current: /about
- **Unique content:** The personal story and motivation of the author, Kevin Qi. Details about his background and the "why" behind the project.
- **Overlaps with:** `index` (project summary), `pitch` (origin story), `framework` (what was built).
- **Audience:** Potential collaborators, journalists, anyone curious about the person behind the project.
- **Recommendation:** **MERGE** into a new, single `/about` page that tells the story of the project and the author.

## Current: /adopt
- **Unique content:** "How to Adopt" steps, "Participation Tiers", and a specific contact form for adoption.
- **Overlaps with:** `index` (hourglass model, stats), `framework` (explanation of QIF), `licensing`.
- **Audience:** Neurotech companies, research institutions, policymakers.
- **Recommendation:** **MERGE**. The "How to Adopt" content should move to the `/framework` page. The contact form should be consolidated into a general site contact method.

## Current: /atlas
- **Unique content:** A core, interactive dashboard (`AtlasDashboard`) showing the unified hourglass and 3D brain visualization.
- **Overlaps with:** Linked from `explore`, represents the `framework`'s hourglass model interactively.
- **Audience:** Researchers, security engineers, students.
- **Recommendation:** **KEEP**. This is a primary, unique tool.

## Current: /explore
- **Unique content:** A hub page with links to all the interactive tools.
- **Overlaps with:** `lab`. Both serve as directories for interactive tools.
- **Audience:** Visitors who want to use the interactive data visualizations.
- **Recommendation:** **MERGE** with `/lab` into a single `/tools` page.

## Current: /explorer
- **Unique content:** A core, interactive graph visualization of threat attack chains (`Threat Explorer`).
- **Overlaps with:** None in terms of functionality. Linked from `explore` and `lab`.
- **Audience:** Security engineers, researchers.
- **Recommendation:** **KEEP**. This is a primary, unique tool.

## Current: /framework
- **Unique content:** Detailed technical explanations of QIF components like the Coherence Metric and Scale-Frequency Invariant.
- **Overlaps with:** `index`, `adopt`, `about`, `pitch` (all mention the framework at a high level).
- **Audience:** Security engineers, researchers, academics.
- **Recommendation:** **KEEP** and make it the central page for all framework-related documentation. It should absorb content from `/adopt`.

## Current: /glossary
- **Unique content:** Definitions of all project-specific terminology.
- **Overlaps with:** Defines terms used across the entire site.
- **Audience:** All visitors.
- **Recommendation:** **KEEP**. Essential for a project with this much jargon.

## Current: /index
- **Unique content:** The main landing page narrative designed to introduce the project to a general audience.
- **Overlaps with:** Summarizes content from almost every other page.
- **Audience:** First-time visitors.
- **Recommendation:** **KEEP**, but streamline its focus to be a better "front door" directing users to other primary pages.

## Current: /lab
- **Unique content:** Inline calculators for the Coherence Metric and Scale-Frequency explorer.
- **Overlaps with:** `explore`. Both are hubs for interactive tools.
- **Audience:** Students, engineers, researchers.
- **Recommendation:** **MERGE** with `/explore` into a single `/tools` page. The calculators can live on this new page or on the `/framework` page.

## Current: /learning
- **Unique content:** An embedded visual reference of historical figures.
- **Overlaps with:** None.
- **Audience:** Primarily the author; a personal study tool.
- **Recommendation:** **DEMOTE TO SECTION**. This is not core to the project's public mission. It can be a link on the `/about` page or in the footer.

## Current: /licensing
- **Unique content:** Specific details about the Apache 2.0 and CC-BY 4.0 licenses.
- **Overlaps with:** Mentioned briefly on `/adopt`.
- **Audience:** Developers, companies, researchers.
- **Recommendation:** **KEEP**. Clear licensing information is critical.

## Current: /pitch
- **Unique content:** A slide deck presentation of the project.
- **Overlaps with:** Summarizes the entire project.
- **Audience:** A specific, private audience (e.g., stakeholders, conference attendees).
- **Recommendation:** **DELETE** from the public website. Can be shared as a PDF link if necessary.

## Current: /about/milestones
- **Unique content:** A redirect.
- **Overlaps with:** Redirects to `/open-research/roadmap/`.
- **Audience:** N/A.
- **Recommendation:** **DELETE**. The redirect is a sign of prior consolidation.

## Current: /governance and /neuroethics/*
- **Unique content:** These sections contain dozens of pages covering neurorights, clinical impact, policy landscapes, and the philosophical foundations of the project. There is massive overlap between `/governance/index`, `/neuroethics/landscape`, `/neuroethics/rights`, `/neuroethics/clinical`, and `/neuroethics/therapeutics`. They all discuss the same core concepts (neurorights, clinical risks, dual-use) from slightly different angles.
- **Overlaps with:** Each other, extensively. Also with `/threat-models/analysis/global-neural-data-governance`.
- **Audience:** Ethicists, policymakers, clinicians, researchers.
- **Recommendation:** **MERGE** into a single, comprehensive `/neuroethics` section with a clear landing page. This section should have sub-pages for:
    -   `/neuroethics/rights`: Detailing the core neurorights.
    -   `/neuroethics/clinical-impact`: Combining the `clinical` and `therapeutics` content.
    -   `/neuroethics/governance`: Consolidating the policy and landscape analyses.

## Current: /interface-risks/* and /threat-models/* and /signal-security/*
- **Unique content:** These directories are a sprawling collection of threat models, security analyses, and interactive dashboards.
    -   `interface-risks/dashboard`, `interface-risks/explorer`, `interface-risks/landscape`: All are different views of BCI device data and risks.
    -   `threat-models/scoring`, `threat-models/tara`: Explain NISS and the TARA threat atlas.
    -   `signal-security/hourglass`: Explains the core QIF model.
- **Overlaps with:** `framework`, `atlas`, `explorer`. The content is highly fragmented. `/threat-models/tara/[id]` is the template for individual threat pages and should be kept.
- **Audience:** Security researchers, engineers.
- **Recommendation:** **MERGE** and **RESTRUCTURE**.
    -   Create a single `/threat-atlas` page that serves as the entry point for the TARA atlas, replacing the fragmented explorers. This page would host the main TARA visualization and link to individual threat pages.
    -   Create a `/scoring` page that explains NISS, absorbing `/threat-models/scoring`.
    -   Merge the content from `interface-risks` into the `/framework`, `/threat-atlas`, and `/tools` pages where appropriate. The BCI device data should be part of the `/threat-atlas`.

## Current: /open-research/* and /research/*
- **Unique content:** These pages document the research process, roadmap, and validation efforts.
- **Overlaps with:** The content is related but distinct enough to warrant its own section. `research/papers` and `research/whitepaper` are mostly redirects or empty.
- **Audience:** Collaborators, researchers, anyone interested in the project's methodology.
- **Recommendation:** **MERGE** into a single `/research` section.
    -   `/research/roadmap`: The project roadmap.
    -   `/research/validation`: The validation page.
    -   `/research/publications`: A new page to consolidate links to the whitepaper, blog posts, and any academic papers, replacing the scattered `derivation` and `writing` pages.

## Current: /tools/*
- **Unique content:** Explanations of the NSP protocol and Runemate compiler.
- **Overlaps with:** The `/tools/overview` page is a mix of Neurowall, NSP, and Runemate, which creates confusion.
- **Audience:** Developers, engineers.
- **Recommendation:** **RESTRUCTURE**. Create a `/tools` landing page that links to dedicated pages for each tool:
    -   `/tools/neurowall`
    -   `/tools/nsp`
    -   `/tools/runemate`

---

## Proposed Site Map

This consolidated site map reduces the page count by over 50% while creating a much clearer, audience-centric navigation structure.

```
/
├── about
├── research
│   ├── roadmap
│   ├── validation
│   └── publications
├── framework
├── threat-atlas
│   └── [threat_id]
├── scoring
├── neuroethics
│   ├── rights
│   ├── clinical-impact
│   └── governance
├── tools
│   ├── neurowall
│   ├── nsp
│   └── runemate
├── atlas (Interactive 3D Brain)
├── explorer (Interactive Threat Graph)
├── glossary
├── licensing
└── blog
    └── [slug]
```

This structure provides clear entry points for different audiences:
*   **General Visitors:** `index`, `about`, `blog`
*   **Researchers/Academics:** `research`, `neuroethics`, `glossary`
*   **Engineers/Developers:** `framework`, `threat-atlas`, `scoring`, `tools`, `licensing`
*   **Interactive Tool Users:** `atlas`, `explorer`
