# Project Manager Agent

> **Purpose:** Ensure all tasks, processes, and documentation are aligned, tracked, and continuously improved across the ONI Framework project.

---

## Quick Reference

| Resource | Location | Purpose |
|----------|----------|---------|
| **This Agent** | `MAIN/legacy-core/resources/agents/PM_AGENT.md` | Project management workflows |
| **prd.json** | `MAIN/legacy-core/project/prd.json` | Task tracking with exit conditions |
| **AGENTS.md** | `/AGENTS.md` | Cross-session learnings |
| **PROCESS_IMPROVEMENTS.md** | `MAIN/legacy-core/project/processes/` | Process improvement log |
| **Editor Agent** | `MAIN/legacy-core/resources/editor/EDITOR_AGENT.md` | Documentation consistency |

---

## PM Agent Responsibilities

### 1. Task Tracking & Alignment
- Maintain `prd.json` with all active tasks
- Ensure each task has clear exit conditions
- Track dependencies between tasks
- Flag blocked or stale tasks

### 2. Process Improvement
- Document process improvements in `PROCESS_IMPROVEMENTS.md`
- Identify automation opportunities
- Track technical debt
- Suggest workflow optimizations

### 3. Documentation Alignment
- Ensure READMEs are current with features
- Verify cross-references are valid
- Check version numbers are synchronized
- Confirm ONI layer references are consistent

### 4. Release Management
- Track version numbers across packages
- Maintain changelogs
- Coordinate documentation updates with releases
- Verify all tests pass before release

### 5. Knowledge Preservation
- Update `AGENTS.md` with learnings
- Document decisions and rationale
- Maintain architectural decision records
- Track future work items

---

## PM Agent Workflow

### When to Run PM Agent

1. **Start of session** - Review current state
2. **After completing features** - Update tracking
3. **Before commits** - Verify alignment
4. **Weekly review** - Process improvement check

### PM Agent Checklist

```
□ Review prd.json for stale tasks
□ Check AGENTS.md for applicable learnings
□ Verify README versions match pyproject.toml
□ Run Editor Agent for doc consistency
□ Update PROCESS_IMPROVEMENTS.md if needed
□ Check for orphaned future work items
□ Verify all links in documentation work
□ Ensure ONI layer references are correct (L1-L7 OSI, L8 Bridge, L9-L14 Neural)
```

---

## Task Management

### prd.json Schema

```json
{
  "project": "ONI Framework",
  "version": "0.3.0",
  "last_updated": "2026-01-22",
  "tasks": [
    {
      "id": "unique-task-id",
      "title": "Short task title",
      "description": "Detailed description",
      "status": "pending|in_progress|complete|blocked",
      "priority": "critical|high|medium|low",
      "category": "feature|bugfix|docs|research|infrastructure",
      "exit_condition": "Machine-verifiable condition",
      "dependencies": ["other-task-ids"],
      "assignee": "human|claude|auto",
      "created": "2026-01-22",
      "completed": null,
      "learnings": null,
      "notes": []
    }
  ],
  "future_work": [
    {
      "id": "future-id",
      "title": "Future work item",
      "description": "What needs to be done",
      "rationale": "Why this matters",
      "feasibility": "practical|theoretical|research-needed",
      "prerequisites": ["what needs to exist first"],
      "estimated_effort": "small|medium|large|unknown"
    }
  ],
  "process_improvements": [
    {
      "id": "improvement-id",
      "observation": "What was observed",
      "improvement": "What to change",
      "status": "proposed|implemented|rejected",
      "impact": "high|medium|low"
    }
  ]
}
```

### Task Status Definitions

| Status | Definition | Action |
|--------|------------|--------|
| `pending` | Not yet started | Can be picked up |
| `in_progress` | Currently being worked on | Only one assignee |
| `complete` | Done and verified | Document learnings |
| `blocked` | Cannot proceed | Document blocker |

### Priority Definitions

| Priority | Definition | SLA |
|----------|------------|-----|
| `critical` | Blocks release or causes errors | Same session |
| `high` | Important for next release | This week |
| `medium` | Should be done | This month |
| `low` | Nice to have | Backlog |

---

## Process Improvement Tracking

### Improvement Categories

1. **Automation** - Manual tasks that could be automated
2. **Documentation** - Gaps or inconsistencies in docs
3. **Workflow** - Inefficient processes
4. **Quality** - Testing or validation gaps
5. **Architecture** - Technical debt or design issues

### Improvement Template

```markdown
## [YYYY-MM-DD] Improvement Title

**Category:** automation|documentation|workflow|quality|architecture
**Impact:** high|medium|low
**Status:** proposed|implemented|rejected

### Observation
What was observed that prompted this improvement?

### Current State
How things work now.

### Proposed Change
What should change.

### Expected Benefit
Why this improvement matters.

### Implementation Notes
How to implement (if applicable).
```

---

## Documentation Alignment Checks

### Version Synchronization

Files that must have matching versions:
- `MAIN/legacy-core/tara-nsec-platform/pyproject.toml` → `version`
- `MAIN/legacy-core/tara-nsec-platform/tara/__init__.py` → `__version__`
- `MAIN/legacy-core/tara-nsec-platform/README.md` → Changelog header
- `MAIN/legacy-core/oni-framework/pyproject.toml` → `version`
- `MAIN/legacy-core/oni-framework/oni/__init__.py` → `__version__`

### ONI Layer Consistency

**CRITICAL:** All documentation must use the corrected ONI layer model:

```
OSI Stack (L1-L7): Classical Networking
  L1: Physical       - Electrical/optical signaling
  L2: Data Link      - Framing, MAC addressing
  L3: Network        - Routing, packet forwarding
  L4: Transport      - End-to-end delivery
  L5: Session        - Connection management
  L6: Presentation   - Encoding, encryption
  L7: Application    - User-facing services

ONI Extension (L8-L14): Neural & Cognitive Systems
  L8: Neural Gateway - BCI boundary, FIREWALL (Bridge)
  L9: Signal Processing - Neural filtering, digitization
  L10: Neural Protocol - Neural data formatting
  L11: Cognitive Transport - Reliable neural delivery
  L12: Cognitive Session - BCI connection management
  L13: Semantic Layer - Intent interpretation
  L14: Identity Layer - Ethics, continuity, self-model
```

### Cross-Reference Validation

Check these files reference each other correctly:
- Main `README.md` → `MAIN/legacy-core/INDEX.md`
- `MAIN/legacy-core/INDEX.md` → All topic READMEs
- Topic READMEs → Parent `INDEX.md`
- TARA docs → ONI Framework docs
- Code docstrings → README examples

---

## Release Checklist

### Pre-Release

```
□ All tests pass
□ Version numbers synchronized
□ Changelog updated
□ README reflects current features
□ prd.json tasks for this release complete
□ AGENTS.md updated with learnings
□ Editor Agent run with no errors
□ PM Agent checklist complete
```

### Post-Release

```
□ Git tag created
□ PyPI published (if applicable)
□ Announcement prepared
□ Future work items reviewed
□ Process improvements documented
□ prd.json updated with next tasks
```

---

## Metrics to Track

### Documentation Health
- Last README update date
- Number of broken links
- Version sync status
- ONI layer consistency

### Task Health
- Tasks completed this week
- Tasks blocked > 7 days
- Average task age
- Future work items pending

### Process Health
- Improvements implemented this month
- Automation coverage
- Test coverage (when applicable)

---

## Integration with Other Agents

### Editor Agent
- PM Agent ensures Editor Agent runs before commits
- Editor Agent reports issues to PM for tracking
- PM tracks documentation fixes as tasks

### Research Agent (Future)
- PM tracks research tasks
- Research findings become future work items
- PM ensures research is documented

### Claude Sessions
- PM Agent checklist at session start
- Update prd.json during session
- Update AGENTS.md at session end

---

## PM Agent Commands

When invoking PM Agent, use these commands:

```
PM: status        - Show current task status
PM: review        - Run full PM checklist
PM: add-task      - Add new task to prd.json
PM: complete-task - Mark task complete with learnings
PM: block-task    - Mark task as blocked
PM: improve       - Document process improvement
PM: align         - Check documentation alignment
PM: release       - Run release checklist
```

---

## Example PM Review Output

```markdown
## PM Agent Review - 2026-01-22

### Task Status
- Active: 3
- Blocked: 1 (waiting for external API)
- Completed this session: 2

### Documentation Alignment
✓ Version numbers synchronized (0.3.0)
✓ ONI layer references correct
⚠ INDEX.md needs update for new NSAM section
✗ TARA README missing new Neural Simulator docs

### Process Improvements
- [NEW] Automate version sync check in pre-commit hook
- [DONE] Added PM Agent for task tracking

### Recommendations
1. Update INDEX.md with NSAM section
2. Add Neural Simulator to TARA README
3. Consider CI/CD for automated checks
```

---

## Notes on Agent File Placement

**Recommendation:** Keep agent files in `MAIN/legacy-core/resources/agents/` rather than a hidden `.agents` folder because:

1. GitHub renders markdown in `resources/` making it browsable
2. Hidden folders may be missed by contributors
3. Consistent with existing `resources/editor/` structure
4. `CLAUDE.md` must stay at root for auto-discovery

**File locations:**
- `prd.json` → `MAIN/legacy-core/project/prd.json` (project management)
- `AGENTS.md` → root (cross-session learnings, needs root for auto-discovery)
- `.gitignore` → `.github/.gitignore` (keeps root clean)

---

*Version: 1.0*
*Created: 2026-01-22*
*For: Project Management and Task Tracking*
