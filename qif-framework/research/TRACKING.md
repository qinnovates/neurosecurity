---
title: "Research Tracking"
status: "active"
updated: "2026-02-18"
---

# Research Tracking

Open items, outreach, and follow-ups. Check this file when resuming work.

## Active Research Threads

### SSVEP Frequency Hijack (QIF-T0103)
- **Status:** Blog posted, technique documented, NIC mapped
- **Needs:** Depth-of-penetration model validation (fMRI study design), browser extension PoC for G2 luminance monitoring
- **File:** `techniques/QIF-T0103-ssvep-frequency-hijack.md`

### SAIL Lab Collaboration
- **Status:** Research intelligence complete. BCI paper (arXiv:2211.10033) directly relevant.
- **Contact:** Vahid Behzadan, sail-lab.org, newhaven.edu
- **Opportunity:** VSF-Med framework (MIT license) adaptable to "VSF-BCI" scoring. Working memory attack conceptually aligned with QIF information capacity model.
- **Action needed:** Draft outreach email. Natural basis: we cite their BCI paper + sensory-channel work in blog and TARA. Propose: (1) cite exchange, (2) potential VSF-BCI collaboration, (3) QIF as threat taxonomy for their BCI attack research.
- **BLOCKED until:** Kevin decides timing and tone for outreach

### Ferrocene Compiler Qualification
- **Status:** Exploration phase. Research doc created, renders dynamically on /runemate.
- **Needs:** Build minimal Scribe prototype with Ferrocene toolchain, assess qualification doc workflow
- **File:** `ferrocene-exploration.md`

### Security Guardrails Integration
- **Status:** Document complete (`qif-sec-guardrails.md`). Now linked from /security and /framework pages.
- **Needs:** Publish as standalone white paper on Zenodo? Add to qif-framework/README.md table.

## Outreach Queue

| Target | Basis | Status | Blocked Until |
|--------|-------|--------|---------------|
| SAIL Lab (Behzadan) | BCI paper, TARA citation | Draft needed | Kevin decides timing |
| Yingying Chen | LSL CVE related | Draft ready | LSL Stage 3 (report delivered) |
| Anna Wexler (UPenn) | Berman Institute seminar 2026-03-23 | Not started | ~2026-03-16 (registration check) |

## Scaling Concerns (Kevin's Note, 2026-02-18)

"I need to come back with a better way to scale as this is not efficient for just myself to learn, discover, post, blog, research, and test exploits."

Ideas to revisit:
- Automated pipeline: derivation log entry → technique doc → blog draft → website update
- Per-technique folders with standardized templates (started: `techniques/`)
- Research content collection renders docs on website automatically (implemented for Ferrocene)
- Consider: GitHub Projects board? Issue-based tracking? TARA technique as issue template?
- Consider: recruit contributors for specific technique deep-dives via GitHub Discussions
