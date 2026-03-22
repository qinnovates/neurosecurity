# Scaffold Audit: Qinnovate Agentic Architecture vs. Anthropic Official Spec

**Date:** 2026-03-17
**Supervisor:** Quorum Lite (5 agents, 1 round)
**Scope:** `~/.claude/skills/`, `.claude/rules/`, `.claude/agents/`, subdirectory `CLAUDE.md` files

---

## Agent Panel

| # | Role | Verdict Summary |
|---|------|----------------|
| 1 | **Spec Compliance Auditor** | 6 violations found. 3 are real FIX items, 3 are cosmetic. |
| 2 | **Scalability Architect** | Architecture is solid for a solo dev. Two structural improvements would pay off at 20+ skills. |
| 3 | **Prompt Efficiency Expert** | 3 skills exceed the 500-line limit. Description budget is fine. Rules are well-scoped. |
| 4 | **Developer Experience Engineer** | Subdirectory CLAUDE.md pattern is excellent. One discoverability gap in skill naming. |
| 5 | **Devil's Advocate** | Most of this scaffold is already better than 95% of Claude Code setups. Don't over-engineer. |

---

## Findings

### FIX (Spec Violations — Must Correct)

#### F1. Non-standard frontmatter fields in skills
**Files:** `~/.claude/skills/senior-security/SKILL.md`, `~/.claude/skills/tdd-guide/SKILL.md`
**Issue:** Both use `triggers:` in frontmatter. This is NOT an official Claude Code frontmatter field. Claude ignores it entirely.
**Impact:** These trigger lists consume ~100 tokens each at metadata load time and do nothing. The `description` field is what Claude uses for auto-trigger matching.
**Fix:** Remove the `triggers:` block from both files. Move any trigger context into the `description` field if not already covered. The `senior-secops` skill handles this correctly — it puts trigger terms in the body under a "Trigger Terms" heading, which only loads when the skill activates (progressive disclosure Tier 2).
**Effort:** 5 min each.

#### F2. Folder name vs. `name` field mismatches
**Files and mismatches:**
| Folder | `name` field | Issue |
|--------|-------------|-------|
| `data-scientist/` | `senior-data-scientist` | Mismatch |
| `mermaid-diagrams/` | `mermaid-tools` | Mismatch |
| `pdf-creator/` | `pdf` | Mismatch |
| `swarm/` | `quorum` | Mismatch (intentional, but worth noting) |

**Spec says:** "Folder name must match `name` field." The `name` field becomes the `/slash-command`. When these don't match, it creates confusion about what command to type.
**Impact:** `swarm/` → `/quorum` is fine (Kevin knows this). But `data-scientist/` → `/senior-data-scientist` means the folder implies one name while the command is another. Same for `mermaid-diagrams/` → `/mermaid-tools` and `pdf-creator/` → `/pdf`.
**Fix:** Rename folders to match `name` fields:
- `data-scientist/` → `senior-data-scientist/`
- `mermaid-diagrams/` → `mermaid-tools/`
- `pdf-creator/` → `pdf/`
- `swarm/` — leave as-is if you prefer the folder name, or rename to `quorum/`

**Effort:** 5 min (just `mv` commands). Note: if these are installed plugins with `.claude-plugin` directories, renaming may break the plugin link. Check first.

#### F3. Non-standard frontmatter fields in Quorum SKILL.md
**File:** `~/.claude/skills/swarm/SKILL.md`
**Issue:** Uses `version`, `author`, `homepage` — none of these are official Claude Code frontmatter fields.
**Spec fields available:** `name`, `description`, `argument-hint`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `context`, `agent`, `hooks`
**Impact:** Low — Claude silently ignores unknown frontmatter fields. But these fields do consume tokens at metadata load (Tier 1). The info is useful for humans/marketplaces, not for Claude.
**Fix:** Move `version`, `author`, `homepage` to the body text (below the `---` frontmatter close). They'll load at Tier 2 (only when skill activates) instead of Tier 1 (always loaded).
**Effort:** 2 min.

#### F4. Duplicate nested ci-cd skill
**File:** `~/.claude/skills/ci-cd/ci-cd/SKILL.md` (identical copy of `~/.claude/skills/ci-cd/SKILL.md`)
**Issue:** There's a full duplicate ci-cd skill nested inside itself, including its own `.claude-plugin` directory. Both have identical 573-line SKILL.md files. Claude may load both at Tier 1, doubling the metadata cost.
**Impact:** Wastes ~200 tokens at startup (double metadata). Could cause ambiguity in skill resolution.
**Fix:** Delete the inner `~/.claude/skills/ci-cd/ci-cd/` directory entirely.
**Effort:** 1 min.

#### F5. yara-authoring has README.md (spec says no README in skill folder)
**File:** `~/.claude/skills/yara-authoring/README.md`
**Issue:** Spec explicitly says "No README.md inside skill folder." The SKILL.md at `yara-authoring/skills/yara-rule-authoring/SKILL.md` is also deeply nested (3 levels), which may not auto-discover correctly.
**Impact:** Minor — the README wastes space and could confuse tooling.
**Fix:** Delete the README.md. Consider flattening the nesting: move `yara-authoring/skills/yara-rule-authoring/` up to `~/.claude/skills/yara-rule-authoring/`.
**Effort:** 5 min.

---

### UPGRADE (Improvements Worth Making)

#### U1. Quorum SKILL.md exceeds 500-line limit (1490 lines)
**File:** `~/.claude/skills/swarm/SKILL.md`
**Spec says:** "Keep SKILL.md under 500 lines."
**Current:** 1490 lines — nearly 3x the limit.
**Impact:** When Quorum activates, all 1490 lines load into context (Tier 2). This is ~6000 tokens consumed before the actual question is processed.
**Fix:** Extract reference material into `references/` directory:
- Move the "Research + Validation Workflow" examples → `references/workflows.md`
- Move the "Design Principles" marketing copy → `references/philosophy.md`
- Move the full flag/parameter docs → `references/flags.md`
- Keep the SKILL.md to: frontmatter + core algorithm + quick start + essential behavior rules
- Use `!cat references/workflows.md` dynamic injection only when needed
**Target:** Under 300 lines in SKILL.md. Everything else loads on demand.
**Effort:** 30 min.

#### U2. ci-cd and senior-secops skills exceed 500 lines
**Files:** `~/.claude/skills/ci-cd/SKILL.md` (573 lines), `~/.claude/skills/senior-secops/SKILL.md` (505 lines)
**Impact:** Both are just over the limit. Less urgent than Quorum but still loading unnecessary reference material at activation.
**Fix:** Move the reference tables, checklists, and tool docs into `references/` subdirectories. Both skills already have some reference structure — just need to offload more.
**Effort:** 15 min each.

#### U3. Add `allowed-tools` to skills that need them
**Files:** `senior-security`, `senior-secops`, `tdd-guide`, `code-reviewer`, `ci-cd`, `data-scientist`
**Issue:** These skills reference running scripts (`python scripts/security_scanner.py`, etc.) but don't declare `allowed-tools` in frontmatter. Without `allowed-tools`, Claude must ask permission for every tool use during skill execution.
**Impact:** Interrupts workflow with permission prompts. Kevin has to approve each `Bash` call manually.
**Fix:** Add `allowed-tools` to each skill's frontmatter with the minimum necessary permissions:
```yaml
allowed-tools:
  - Bash(python3 scripts/*)
  - Read
  - Glob
  - Grep
```
Scope Bash to the specific scripts, not bare `Bash`.
**Effort:** 2 min per skill, 12 min total.

#### U4. Add more agents for common workflows
**File:** `.claude/agents/data-pipeline.md` (only agent)
**Issue:** Only one agent definition exists. The `context: fork` + agent pattern is underutilized.
**Candidates for new agents:**
- `research-explorer.md` — Read-only research agent with `agent: Explore` for citation verification and paper discovery. Scoped to `datalake/research-registry.json`, `qif-framework/QIF-RESEARCH-SOURCES.md`, and web search.
- `ci-validator.md` — Runs `npm run build && npm run health && npm run type-check`. Pre-push check.
- `security-reviewer.md` — Scans staged changes for secrets, injection patterns. Pre-push check.
**Impact:** These are referenced in `skill-hardening.md` rules ("spawn ci-validator and security-reviewer before push") but don't exist as agent definitions.
**Fix:** Create the agent files in `.claude/agents/`.
**Effort:** 10 min per agent, 30 min total.

#### U5. Use `model: sonnet` on lightweight skills
**Files:** `kevin-voice`, `ai-disclosure-compliance`, `content-research-writer`, `mermaid-diagrams`
**Issue:** These skills don't need Opus-level reasoning. Voice matching, disclosure checklists, and diagram extraction are pattern-following tasks.
**Impact:** Using Sonnet for these saves cost and speeds execution with no quality loss.
**Fix:** Add `model: sonnet` to frontmatter of skills that are primarily template/checklist-based.
**Effort:** 1 min per skill.

#### U6. Use dynamic context injection (`!command`) for data-dependent skills
**Applicable to:** Any skill that references project state (technique counts, file lists, data schemas)
**Pattern:** Instead of hardcoding counts or file paths in SKILL.md, use:
```markdown
Current technique count: `!wc -l datalake/qtara-registrar.json | awk '{print $1}'`
```
**Impact:** Skills always see current state, not stale hardcoded values.
**Effort:** 5 min per skill that needs it.

---

### SKIP (Not Worth the Effort)

#### S1. Moving global rules from `PROJECTS/.claude/rules/` to project-level
**Current:** 6 global rules at the parent directory level, 8 project-specific rules in `qinnovate/.claude/rules/`.
**Analysis:** This split is correct. The global rules (epistemic integrity, secure coding, memory protocol, prompt engineering, research agent protocol, skill hardening) apply across all repos. Moving them into each project would create duplication.
**Verdict:** Keep the current two-tier structure. It's the intended design.

#### S2. Adding `context: fork` to every skill
**Analysis:** Fork context is useful for long-running or research-heavy skills where isolation prevents context pollution. But for quick-invoke skills like `kevin-voice`, `mermaid-tools`, or `pdf`, forking adds overhead (new subagent spawn) for a task that takes 10 seconds.
**Verdict:** Only add `context: fork` to skills that are genuinely long-running or need isolation: `quorum` (already implicit), `data-scientist`, `research-explorer`.

#### S3. Migrating to AgentSkills.io spec format
**Analysis:** The AgentSkills.io spec adds `license`, `compatibility`, `metadata` fields. These are useful for marketplace distribution but add no value for personal skills. Kevin's skills that are already published (Quorum) can add these fields. The rest don't benefit.
**Verdict:** Only add AgentSkills.io fields to skills intended for marketplace/sharing.

#### S4. Adding path-scoped glob patterns to global rules
**Analysis:** The global rules files don't have `paths:` frontmatter. This means they load for ALL sessions. But these rules (secure coding, epistemic integrity) SHOULD apply everywhere. Path-scoping them would be wrong.
**Verdict:** Correct as-is. Only project rules need path scoping (and they have it, e.g., `propagation.md` scopes to `datalake/**`).

#### S5. Restructuring subdirectory CLAUDE.md files
**Current:** 7 subdirectory CLAUDE.md files (src, datalake, qif-framework, paper, tools, scripts, governance). All are under 30 lines. Each covers structure, conventions, key files, and build commands.
**Analysis:** These are textbook perfect. They follow progressive disclosure — the root CLAUDE.md gives the map, each subdirectory CLAUDE.md gives the detail. Total token cost: ~1200 tokens for all 7, loaded only when working in that directory.
**Verdict:** Don't touch these. They're a model for how subdirectory docs should work.

---

## Prioritized Action List

| Priority | ID | Action | Effort | Impact |
|----------|-----|--------|--------|--------|
| **P0** | F4 | Delete duplicate `ci-cd/ci-cd/` directory | 1 min | Eliminates ambiguity + wasted tokens |
| **P0** | F1 | Remove `triggers:` from `senior-security` and `tdd-guide` frontmatter | 5 min | Spec compliance, cleaner metadata |
| **P0** | F3 | Move `version`/`author`/`homepage` from Quorum frontmatter to body | 2 min | Spec compliance, saves Tier 1 tokens |
| **P1** | U1 | Refactor Quorum SKILL.md from 1490 → <300 lines, extract to references/ | 30 min | Saves ~4000 tokens per invocation |
| **P1** | U3 | Add `allowed-tools` to 6 skills that run scripts | 12 min | Eliminates permission interrupts |
| **P1** | U4 | Create `ci-validator` and `security-reviewer` agent definitions | 20 min | Enables pre-push validation workflow |
| **P2** | F2 | Rename mismatched skill folders (3 skills) | 5 min | Consistency, discoverability |
| **P2** | U2 | Trim ci-cd and senior-secops SKILL.md under 500 lines | 30 min | Moderate token savings |
| **P2** | F5 | Clean up yara-authoring nesting and README | 5 min | Spec compliance |
| **P3** | U5 | Add `model: sonnet` to lightweight skills | 4 min | Cost savings |
| **P3** | U6 | Add dynamic context injection where applicable | 15 min | Freshness of data references |

---

## Architecture Assessment

### What's Already Strong

1. **Two-tier rules architecture (global + project)** — Correct separation. Global rules load everywhere, project rules load contextually. This is the intended pattern.

2. **Path-scoped project rules** — The `propagation.md` rule with `paths:` frontmatter scoping to `datalake/**` is exactly right. Only loads when working in relevant directories.

3. **Subdirectory CLAUDE.md pattern** — 7 files, all under 30 lines, each covering structure + conventions + key files. Progressive disclosure done perfectly. Token cost is minimal.

4. **Root CLAUDE.md as project map** — 106 lines with commands, structure, tech stack, protocols index, commit conventions. Serves as the single entry point. Good.

5. **Agent definition for data-pipeline** — Uses `model: sonnet` (cost-efficient), scoped tools, clear responsibilities. This is the template for future agents.

6. **Change Propagation Matrix** — The `propagation.md` rule is genuinely useful. It maps cascading file dependencies explicitly. Most projects rely on tribal knowledge for this.

7. **Health check validation** — `npm run health` validates sync across 12 relationships. This is infrastructure that pays for itself.

### Scalability Ceiling

The current scaffold works well for ~15 skills and ~15 rules. Here's where it would strain:

- **At 30+ skills:** Tier 1 metadata load becomes significant (~3000 tokens just for skill descriptions). The solution is `user-invocable: false` on skills that should only be auto-triggered, never manually invoked. This hides them from the `/` menu and reduces cognitive load.

- **At 20+ rules:** Rules files are always loaded for their path scope. If rules proliferate, consider consolidating related rules (e.g., merge `citation-integrity.md`, `ai-disclosure.md`, and `whitepaper-archival.md` into a single `publication-standards.md` with section headers).

- **At 5+ agents:** The current single-agent model works. At scale, consider a `_agents/` naming convention and shared context patterns (agents that read from `_memory/` for cross-agent coordination).

### Token Budget Analysis

**Per-session baseline cost (always loaded):**
| Component | Tokens (est.) |
|-----------|--------------|
| Root CLAUDE.md | ~500 |
| Global rules (6 files) | ~2500 |
| Project rules (8 files, path-scoped, avg 2-3 active) | ~600 |
| Skill metadata (13 skills, Tier 1) | ~1300 |
| MEMORY.md | ~3000 |
| **Total baseline** | **~7900** |

**Per-activation cost (when a skill fires):**
| Skill | Lines | Tokens (est.) |
|-------|-------|--------------|
| Quorum | 1490 | ~6000 |
| ci-cd | 573 | ~2300 |
| senior-secops | 505 | ~2000 |
| senior-security | 435 | ~1700 |
| pdf | 314 | ~1300 |
| data-scientist | 226 | ~900 |
| Others (avg) | ~140 | ~560 |

The Quorum skill alone costs more tokens than the entire baseline context. Refactoring it (U1) is the single highest-impact optimization.

---

## Specific File Changes

### F1: Remove `triggers:` from senior-security
```yaml
# ~/.claude/skills/senior-security/SKILL.md
# REMOVE lines 4-15 (the triggers: block)
# The description field already covers trigger matching
```

### F1: Remove `triggers:` from tdd-guide
```yaml
# ~/.claude/skills/tdd-guide/SKILL.md
# REMOVE lines 4-13 (the triggers: block)
```

### F3: Move non-standard fields from Quorum frontmatter
```yaml
# ~/.claude/skills/swarm/SKILL.md
# REMOVE from frontmatter:
#   version: 4.1.0
#   author: Kevin Qi (qinnovate.com)
#   homepage: https://qinnovate.com
# ADD to body (after ---):
# **Version:** 4.1.0 | **Author:** Kevin Qi (qinnovate.com) | [qinnovate.com](https://qinnovate.com)
```

### F4: Delete duplicate ci-cd
```bash
rm -rf ~/.claude/skills/ci-cd/ci-cd/
```

### U3: Example allowed-tools addition (senior-security)
```yaml
---
name: senior-security
description: Security engineering toolkit...
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(python3 scripts/*)
---
```

---

*Generated by Quorum Lite — 5 agents, 1 round, 2026-03-17*
