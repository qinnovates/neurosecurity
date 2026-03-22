---
paths:
  - "research/paper/**"
  - "research/blog/**"
---

# AI Disclosure & Publication Compliance

AI tools cannot be authors. Every paper, preprint, and public post must include disclosure. Use `/ai-disclosure-compliance` skill for full checklist and venue-specific requirements.

**Key venue policies (Feb 2026):**

| Venue | Key Requirement |
|-------|-----------------|
| arXiv | Name tools, author responsibility statement, CS review/survey ban (Oct 2025) |
| ACM (WOOT, CCS) | State proportion of AI text, cannot post to ResearchGate/Academia.edu |
| IEEE (Graz BCI) | Name system, identify sections, describe level |
| USENIX/WOOT | No fully AI-generated sections, HotCRP written attestation |
| Science/AAAS | Near-ban on AI text, full prompts required |
| ICLR/ICML (2026) | Desk rejection for undisclosed AI, reviewer cross-enforcement |

**Full policy details:** `~/.claude/skills/ai-disclosure-compliance/references/venue-policies.md`

## Pre-Publication Checklist
1. AI tools NOT listed as authors
2. Disclosure section exists (Section 9.7 in preprint)
3. Tools named with versions
4. Sections identified, level described, proportion stated
5. Human-originated contributions explicitly stated
6. Author responsibility statement included
7. Transparency log URL provided (`governance/TRANSPARENCY.md`)
8. Citation fabrication history disclosed (v1.0 had 3 fabricated)

## Blog Posts
Footer: "Written with AI assistance (Claude). All claims verified by the author."
