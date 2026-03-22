# ONI Framework vs TARA UI Separation Plan

## Executive Summary

**Problem**: Two overlapping UIs with unclear distinction
- `oni-framework` (794 lines) - Educational focus but basic
- `TARA` (3119 lines) - Operational focus but mixed with educational content

**Solution**: Clear separation with distinct purposes, audiences, and design languages

---

## Current State Analysis

### oni-framework UI
| Aspect | Current State | Issues |
|--------|--------------|--------|
| Purpose | Learning/education | Too basic, static content |
| Pages | 9 pages | No interactive visualizations |
| Styling | Basic Streamlit | Not sophisticated |
| Interactivity | Simple sliders | No real simulations |
| Integration | None | Doesn't use existing HTML visualizations |

### TARA UI
| Aspect | Current State | Issues |
|--------|--------------|--------|
| Purpose | Security operations | Mixed with educational content |
| Pages | 12+ pages | Overlaps with oni-framework |
| Styling | Dark theme | Inconsistent |
| Interactivity | Good | Pew-pew visualization exists |
| Integration | Embeds HTML viz | Should be TARA-only features |

### Interactive Visualizations (7 HTML files)
Currently embedded in TARA but should be:
- **For oni-framework**: Coherence Playground, Layer Explorer, Scale-Frequency
- **For TARA**: Attack Matrix, Killchain Visualizer, NSAM Checkpoint

---

## Strategic Vision

### oni-framework: "ONI Academy"
> **Learn the science of neural security**

**Audience**:
- Researchers new to BCI security
- Students studying neurotechnology
- Policy makers understanding threats
- Developers learning the framework

**Core Experience**:
- Progressive learning path (beginner → expert)
- Interactive concept visualizations
- Hands-on code playgrounds
- Research paper integration
- Glossary and reference materials

**Design Language**:
- Clean, minimal, white/light theme
- Academic yet approachable
- Lots of whitespace
- Animated diagrams
- Progress indicators

**Pages**:
1. **Welcome** - Mission, learning path selector
2. **Foundations** - What is a BCI? Why security?
3. **The 14 Layers** - Interactive layer explorer (embed HTML)
4. **Signal Trust** - Coherence metric playground (embed HTML)
5. **The Firewall** - Interactive firewall simulator
6. **Privacy** - Privacy score calculator, ERP explorer
7. **Threats** - Threat taxonomy with examples
8. **Scale & Time** - Scale-frequency navigator (embed HTML)
9. **Research** - Paper summaries, citations, further reading
10. **Code Lab** - Interactive code examples with live execution
11. **Glossary** - Searchable term definitions
12. **Certification** - Quiz/assessment (future)

---

### TARA: "Neural Security Operations Center"
> **Defend brain-computer interfaces**

**Audience**:
- Security engineers testing BCIs
- Red teams simulating attacks
- SOC analysts monitoring neural systems
- BCI developers validating security

**Core Experience**:
- Real-time monitoring dashboards
- Attack simulation and testing
- Threat detection and response
- Live EEG data analysis
- Security reporting

**Design Language**:
- Dark, futuristic, cyberpunk aesthetic
- Neon accents (cyan, magenta, green)
- Data-dense dashboards
- Real-time animations
- Terminal/console aesthetic

**Pages**:
1. **Mission Control** - Overview dashboard, system status
2. **Brain Monitor** - 3D brain topology, electrode status
3. **Firewall Console** - L8-L14 pipeline, real-time filtering
4. **NSAM** - Signal assurance monitoring, anomaly detection
5. **Threat Intel** - Kohno rules, active threats, incidents
6. **Attack Lab** - Attack simulator, scenario builder
7. **Kill Chain Viz** - Attack path visualization (embed HTML)
8. **Data Hub** - MOABB integration, EEG analysis
9. **OpenBCI** - Hardware adapter, live streaming
10. **Reports** - Export security assessments
11. **Settings** - Thresholds, rules, configuration

---

## Design Specifications

### oni-framework Design System

```css
/* Color Palette */
--oni-bg: #ffffff;
--oni-surface: #f8fafc;
--oni-border: #e2e8f0;
--oni-text: #1e293b;
--oni-text-muted: #64748b;
--oni-primary: #3b82f6;      /* Blue */
--oni-secondary: #8b5cf6;    /* Purple */
--oni-accent: #06b6d4;       /* Cyan */
--oni-success: #10b981;      /* Green */
--oni-warning: #f59e0b;      /* Amber */
--oni-error: #ef4444;        /* Red */

/* Typography */
--font-display: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Effects */
--gradient-primary: linear-gradient(135deg, #3b82f6, #8b5cf6);
--shadow-card: 0 4px 6px -1px rgb(0 0 0 / 0.1);
```

### TARA Design System

```css
/* Color Palette */
--tara-bg: #0a0a0f;
--tara-surface: #12121a;
--tara-surface-2: #1a1a24;
--tara-border: #2a2a3a;
--tara-text: #e2e8f0;
--tara-text-muted: #64748b;
--tara-primary: #00f0ff;     /* Cyan neon */
--tara-secondary: #ff00ff;   /* Magenta neon */
--tara-accent: #00ff88;      /* Green neon */
--tara-warning: #ffaa00;     /* Orange */
--tara-error: #ff4444;       /* Red */
--tara-safe: #00ff88;        /* Green */

/* Typography */
--font-display: 'Orbitron', sans-serif;
--font-mono: 'Fira Code', monospace;

/* Effects */
--glow-cyan: 0 0 20px rgba(0, 240, 255, 0.5);
--glow-magenta: 0 0 20px rgba(255, 0, 255, 0.5);
--scanline: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
```

---

## Implementation Plan

### Phase 1: oni-framework Redesign (Priority: HIGH)

1. **Create new design system** (`ui/styles.py`)
   - Light theme CSS
   - Component styles
   - Animation classes

2. **Restructure pages** (`ui/pages/`)
   - Split into modular page files
   - Add learning path logic
   - Progressive disclosure

3. **Integrate HTML visualizations**
   - Embed Coherence Playground
   - Embed Layer Explorer
   - Embed Scale-Frequency Navigator

4. **Add interactive elements**
   - Live code execution cells
   - Interactive diagrams
   - Quiz components

5. **Add knowledge resources**
   - Research paper summaries
   - Glossary database
   - Citation manager

### Phase 2: TARA Refinement (Priority: MEDIUM)

1. **Remove educational overlap**
   - Remove "What is ONI" content
   - Focus on operational features
   - Link to oni-framework for learning

2. **Apply cyberpunk design**
   - Dark theme overhaul
   - Neon accents
   - Scanline effects
   - Terminal aesthetics

3. **Enhance attack simulator**
   - Better pew-pew animation
   - More attack scenarios
   - Report generation

4. **OpenBCI integration**
   - Live hardware connection
   - Real-time monitoring
   - Hardware status indicators

### Phase 3: Shared Components (Priority: LOW)

1. **Component library**
   - Shared visualization components
   - Common data models
   - Utility functions

2. **Cross-linking**
   - TARA links to oni-framework for learning
   - oni-framework mentions TARA for operations

---

## File Structure

### oni-framework (new structure)
```
oni/ui/
├── app.py              # Main entry, routing
├── styles.py           # CSS and design tokens
├── components/
│   ├── __init__.py
│   ├── card.py         # Info cards
│   ├── code_editor.py  # Live code execution
│   ├── diagram.py      # Animated diagrams
│   ├── progress.py     # Learning progress
│   └── quiz.py         # Assessment components
├── pages/
│   ├── __init__.py
│   ├── welcome.py
│   ├── foundations.py
│   ├── layers.py
│   ├── coherence.py
│   ├── firewall.py
│   ├── privacy.py
│   ├── threats.py
│   ├── scale_freq.py
│   ├── research.py
│   ├── code_lab.py
│   └── glossary.py
├── data/
│   ├── glossary.json   # Term definitions
│   ├── papers.json     # Research summaries
│   └── learning_paths.json
└── assets/
    └── visualizations/ # Embedded HTML files
```

### TARA (refined structure)
```
tara_mvp/ui/
├── app.py              # Main entry, routing
├── styles.py           # Dark theme CSS
├── components/
│   ├── status_indicator.py
│   ├── metric_card.py
│   ├── terminal.py
│   ├── attack_viz.py
│   └── brain_3d.py
├── pages/
│   ├── mission_control.py
│   ├── brain_monitor.py
│   ├── firewall_console.py
│   ├── nsam.py
│   ├── threat_intel.py
│   ├── attack_lab.py
│   ├── data_hub.py
│   ├── openbci.py
│   └── settings.py
└── assets/
    └── visualizations/
```

---

## Success Metrics

| Metric | oni-framework Target | TARA Target |
|--------|---------------------|-------------|
| Clear purpose | "I'm here to learn" | "I'm here to secure" |
| Design distinction | Light, academic | Dark, operational |
| User confusion | None | None |
| Feature overlap | Minimal (concepts vs tools) | Minimal |
| Interactive elements | High (learning) | High (operations) |

---

## Next Steps

1. [ ] Create oni-framework design system
2. [ ] Build modular page structure
3. [ ] Embed interactive HTML visualizations
4. [ ] Add glossary and research resources
5. [ ] Refactor TARA to remove educational content
6. [ ] Apply cyberpunk design to TARA
7. [ ] Test both UIs for clear distinction
8. [ ] Update documentation

---

*Created: 2026-01-26*
*Author: Claude Opus 4.5*
