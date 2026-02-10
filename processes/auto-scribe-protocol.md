# Auto-Scribe Protocol: Derivation Log System

Every architectural insight, equation discovery, or conceptual breakthrough in Qinnovate's research gets captured in real-time using the Auto-Scribe protocol. This document explains how the system works, how to use it, and how to contribute.

---

## Why This Exists

Research breakthroughs happen mid-conversation. They happen when you're debugging, when you're arguing about architecture, when two unrelated ideas collide. If you don't capture them immediately, the reasoning chain is lost. Papers can document conclusions. Derivation logs document *how you got there*.

The Auto-Scribe protocol ensures that no insight is lost, every decision is traceable, and any researcher can follow the same chain of reasoning to reach the same conclusions.

---

## How It Works

### Trigger Conditions

An entry is created whenever ANY of the following occur during a research session:

| Trigger | Example |
|---------|---------|
| New architectural insight | "The game engine and neural renderer need separate security models" |
| Equation derivation or modification | "Decoherence gate should be ungated for tunneling" |
| Conceptual breakthrough | "TARA attack vectors map 1:1 to therapeutic parameters" |
| Framework decision | "Dual-pipeline: Bevy for performance, Scribe for safety" |
| Cross-domain connection | "Synesthesia research informs visual cortex rendering vocabulary" |
| Correction to previous entry | "Framing changed from self-study to cohort research" |
| External discovery that affects the framework | "CVSS-BCI extension registered by MITRE" |

### What Gets Captured

Every entry follows lab-notebook format. This is non-negotiable. The goal is **reproducible reasoning** — anyone reading the log should be able to follow the same chain and reach the same conclusions.

```markdown
### Entry [LOG-ID]: [Title]
**Date:** YYYY-MM-DD HH:MM UTC
**Context:** [What was being discussed when the insight emerged]
**AI Systems:** [Which AI models were involved and their roles]
**Human Decision:** [What the human decided, distinct from what AI suggested]

**Discovery:**
[Full description of the insight, written for both specialists and generalists]

**Implications for [Framework]:**
[How this changes or extends the framework]

**Status:** [Hypothesis | Validated | Integrated | Superseded]
**Dependencies:** [Links to other entries this builds on]
```

### Entry ID Format

Each derivation log uses its own prefix:

| Log | Prefix | Example |
|-----|--------|---------|
| QIF Derivation Log | `D-` | `D-001`, `D-002` |
| Runemate Derivation Log | `R-` | `R-001`, `R-002` |
| New topic logs | `[LETTER]-` | Choose a unique prefix |

---

## Derivation Logs

### Active Logs

| Log | Location | Scope |
|-----|----------|-------|
| **QIF Derivation Log** | `qif-framework/QIF-DERIVATION-LOG.md` (standards) / `drafts/ai-working/QIF-DERIVATION-LOG.md` (source of truth) | Core QIF equations, layer architecture, coherence metrics, quantum indeterminacy |
| **Runemate Derivation Log** | `qif-framework/RUNEMATE.md` (standards) / `drafts/ai-working/RUNEMATE.md` (source of truth) | Rendering pipeline, Staves notation, visual cortex architecture, BCI display |

### When to Create a New Log

Create a new derivation log when insights emerge that don't fit existing logs. Examples:
- A new protocol specification (e.g., NSP extensions)
- A new research domain (e.g., synesthesia mapping)
- A new tool or language design (e.g., NSL compiler)

**Naming convention:** `[TOPIC]-DERIVATION-LOG.md` or embedded as a section within the relevant spec document (as Runemate does).

### Source of Truth

Each log exists in two locations:

1. **Source of truth:** `qinnovates/mindloft/drafts/ai-working/` — full detail, verbose reasoning, all context
2. **Standards copy:** `qinnovates/qinnovate/qif-framework/` — same entries, may be condensed for public consumption

**Propagation order:** Always write to the source of truth first, then sync to the standards copy.

---

## How to Use This (For Contributors)

### If You're Using Claude Code

The auto-scribe is built into the Claude Code workflow via MEMORY.md instructions. During any research session:

1. **Work normally.** Discuss architecture, derive equations, explore ideas.
2. **When a breakthrough happens,** Claude spawns a background agent to write the entry. You don't need to pause or ask for it.
3. **The agent writes the entry** in lab-notebook format to the appropriate derivation log.
4. **You keep working.** The scribe runs in the background and never interrupts the conversation.

If the auto-scribe misses something, say: *"Scribe that to [log name]"* and it will be captured.

### If You're Contributing Without Claude Code

Follow these steps manually:

1. **Identify the moment.** You've just had an insight, made a decision, or discovered a connection.
2. **Open the relevant derivation log** (see Active Logs table above).
3. **Add a new entry** at the end of the log using the template below.
4. **Never edit or delete previous entries.** The log only grows. If a previous entry is wrong, add a new correction entry that references the original.
5. **Commit with a descriptive message:** `docs: add [LOG-ID] [brief title] to [log name]`

### Entry Template

Copy this template for new entries:

```markdown
### Entry [PREFIX]-[NUMBER]: [Descriptive Title]
**Date:** [YYYY-MM-DD HH:MM UTC]
**Context:** [What were you working on when this came up?]
**AI Systems:** [List any AI tools used — Claude, Gemini, GPT, etc. Write "None" if purely human insight]
**Human Decision:** [What did the human researcher decide? This is distinct from AI suggestions.]

**Discovery:**

[Describe the insight in full. Write for two audiences: (1) a domain expert who needs technical precision, and (2) a newcomer who needs to understand why this matters. Use analogies where helpful. Be verbose — this is a lab notebook, not a tweet.]

**Implications for [Framework/Spec Name]:**

- [Bullet 1: How does this change the architecture?]
- [Bullet 2: What new capabilities does this enable?]
- [Bullet 3: What constraints does this introduce?]

**Status:** Hypothesis | Validated | Integrated | Superseded
**Dependencies:** [Entry IDs this builds on, e.g., "Builds on R-003, R-004"]
```

### Status Definitions

| Status | Meaning |
|--------|---------|
| **Hypothesis** | Proposed but not yet tested or validated |
| **Validated** | Confirmed through analysis, peer review, or empirical testing |
| **Integrated** | Incorporated into the framework specification |
| **Superseded** | Replaced by a later entry (link to replacement) |

---

## Rules

1. **The log only grows.** Never delete or edit past entries. Corrections get new entries pointing back to originals.
2. **Record AI involvement.** Every entry documents which AI systems contributed and what the human decided independently. This is an AI transparency requirement.
3. **Verbose over concise.** Lab-notebook style. Flowing reasoning. Someone reading Entry R-003 should understand *why* TARA became a safety specification, not just *that* it did.
4. **Propagation order matters.** Source of truth (drafts) first, then standards copy (qinnovate repo), then any dependent documents (whitepapers, blog posts).
5. **Cross-reference liberally.** If Entry R-004 builds on R-003, say so. If a QIF derivation log entry connects to a Runemate entry, link it. The web of connections IS the research.
6. **Timestamp everything.** UTC preferred. The chronological order matters for understanding how ideas evolved.

---

## Integration with VERA

The Auto-Scribe protocol feeds directly into the VERA Engine's **Research** pillar:

```
Insight emerges in conversation
    |
    v
Auto-Scribe captures it (this protocol)
    |
    v
Entry added to Derivation Log
    |
    v
VERA Validation: Is this testable? → Lab POC
    |
    v
VERA Ethics: Does this raise ethical questions? → Ethics review
    |
    v
VERA Authority: Should this become part of the standard? → Standards update
```

The derivation log is the bridge between informal discovery and formal standardization. Every entry in QIF-TRUTH.md, every section of the whitepaper, every governance policy should trace back to a derivation log entry.

---

## Related Resources

- [VERA Engine (Qinnovate Lifecycle)](./qinnovate-lifecycle.md)
- [QIF Framework](../qif-framework/)
- [Runemate Specification](../qif-framework/RUNEMATE.md)
- [Governance Standards](../governance/)

---

*Last Updated: 2026-02-10*
