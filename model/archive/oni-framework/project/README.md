# ONI Project Management Hub

> Central dashboard for tracking tasks, milestones, risks, and roadmap.

**Last Updated:** 2026-01-26 | **Sprint:** Q1 2026

---

## Status Dashboard

```
PROGRESS ████████████████░░░░ 81%    RISKS ██░░░░░░░░ 2 Critical
TASKS    22/27 Complete               BLOCKED 0 Tasks
```

| Metric | Value | Status |
|--------|-------|--------|
| Tasks Complete | 22/27 (81%) | On Track |
| In Progress | 0 | Healthy |
| Blocked | 0 | Excellent |
| Critical Risks | 2 | Needs Attention |
| Milestones | M1 Complete, M2 Active | On Track |

---

## Quick Links

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[KANBAN.md](KANBAN.md)** | Visual task board | See work status at a glance |
| **[prd.json](prd.json)** | Machine-readable tasks | Automated tracking, exit conditions |
| **[PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md)** | Strategic planning | Scope, risks, milestones, decisions |
| **[processes/](processes/)** | Workflow documentation | Publishing, process improvements |

---

## Current Sprint (Q1 2026)

### Ready to Start

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| python-code-sync | P1 | Small | Verify layers.py matches corrected ONI model |
| changelog-creation | P2 | Small | Create CHANGELOG.md with semantic versioning |
| moabb-attack-scenarios | P2 | Medium | Create attack scenarios with real EEG data |

### Backlog

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| moabb-coherence-benchmark | P2 | Medium | Benchmark Cs accuracy against MOABB data |
| brainflow-integration | P3 | Medium | Real-time hardware support |

### Recently Completed

| Task | Completed | Impact |
|------|-----------|--------|
| moabb-adapter-implementation | 2026-01-24 | Enables real EEG validation |
| consent-validation-module | 2026-01-24 | Neuroethics integration |
| neurosecurity-implementation | 2026-01-23 | Kohno + BCI Anonymizer |

---

## Milestones

```
2026 Q1              Q2               Q3               Q4              2027
  |                   |                |                |                |
  M1 ✓               M3              M5               M7               M8
  Foundation         Validation       Publication      Industry         Privacy-First
  |                   |                |                |                |
  M2 ◐               M4              M6
  Implementation     Integration      Community
  |
  ▼ We are here
```

| Milestone | Target | Status | Key Deliverables |
|-----------|--------|--------|------------------|
| **M1** Foundation | 2026-01-24 | Complete | Editor Agent, Layer model, Ethics framework |
| **M2** Implementation | 2026-02-15 | In Progress | Python sync, CHANGELOG, MOABB scenarios |
| **M3** Validation | 2026-03-31 | Planned | Cs benchmarks, attack verification |
| **M4** Integration | 2026-04-30 | Planned | BrainFlow, hardware support |
| **M5** Publication | 2026-06-30 | Planned | arXiv preprint, peer review |
| **M6** Community | 2026-08-31 | Planned | Contributors, tutorials |
| **M7** Industry | 2026-12-31 | Planned | Manufacturer guide, FDA alignment |
| **M8** Privacy-First | 2027-Q1 | In Progress | Federated AI, score-only transmission |

---

## Critical Risks

| ID | Risk | Score | Status | Mitigation |
|----|------|-------|--------|------------|
| R-002 | No empirical Cs validation | 16 | Open | MOABB benchmarking in M3 |
| R-003 | Single contributor (bus factor=1) | 20 | Monitoring | Comprehensive docs in AGENTS.md |

See [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md#risk-impact-assessment) for full risk register.

---

## Folder Structure

```
project/
├── README.md                    # THIS FILE - Dashboard & navigation
├── KANBAN.md                    # Visual task board
├── prd.json                     # Machine-readable task tracker
├── PROJECT_MANAGEMENT.md        # Strategic planning document
├── UI_SEPARATION_PLAN.md        # ONI Academy vs TARA UI strategy
├── OBSIDIAN_TASKS_2026-01-25.md # Extracted external tasks
└── processes/
    ├── PUBLISHING_INSTRUCTIONS.md  # Content publishing workflow
    └── PROCESS_IMPROVEMENTS.md     # Process improvement strategy
```

---

## How to Use

### View Status
1. **Quick glance:** Dashboard above shows key metrics
2. **Visual board:** Open [KANBAN.md](KANBAN.md) for task columns
3. **Full details:** Open [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md)

### Update Tasks
1. Move task in [KANBAN.md](KANBAN.md) to new column
2. Update status in [prd.json](prd.json)
3. Add learnings when completing tasks
4. Update metrics in this README

### Add New Tasks
1. Add to [prd.json](prd.json) with unique ID and exit condition
2. Add to [KANBAN.md](KANBAN.md) Backlog section
3. Assign priority (P0-P3) using scoring criteria

### Publishing Content
Follow [processes/PUBLISHING_INSTRUCTIONS.md](processes/PUBLISHING_INSTRUCTIONS.md)

---

## Priority Levels

| Priority | Meaning | SLA |
|----------|---------|-----|
| **P0** | Critical - blocks all work | Immediate |
| **P1** | High - important feature | This sprint |
| **P2** | Medium - incremental improvement | Next sprint |
| **P3** | Low - future enhancement | Backlog |

---

## Related Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| [AGENTS.md](../../AGENTS.md) | Repo root | Ralph Loop learnings |
| [CLAUDE.md](../../CLAUDE.md) | Repo root | AI assistant instructions |
| [INDEX.md](../INDEX.md) | MAIN/legacy-core/ | Central wiki navigation |
| [TRANSPARENCY.md](../governance/TRANSPARENCY.md) | governance/ | Human-AI collaboration audit |

---

*Version: 1.0*
