# src/components/ -- UI Component Library

React 19 and Astro components for the qinnovate.com site. Organized by feature domain.

## Table of Contents
- [Feature Directories](#feature-directories)
- [Root Components](#root-components)

## Feature Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `atlas/` | 13 | Neural atlas visualization, threat atlas, device explorer, risk matrix, interaction matrix |
| `bci/` | 5 | BCI device timeline, specs cards, limits visualization |
| `brain/` | 2 | Per-band list (`BandViewPanel`) and the link to the atlas explorer; no drawing |
| `case-study/` | 3 | Case study page layouts (attack chain flow, attack surface, policy map) |
| `data-studio/` | 5 | Data Studio: DuckDB-WASM console, Parquet viewer, query builder, table view |
| `hooks/` | 1 | `useQueryState.tsx` -- URL query state management |
| `neurogovernance/` | 1 | Governance timeline visualization |
| `niss/` | 5 | NISS calculator, impact gauge, risk gauge, score display |
| `roadmap/` | 1 | Development roadmap |
| `tara/` | 2 | TARA technique viewer, searchable threat browser |
| `therapeutics/` | 1 | Therapeutic applications overview |
| `whitepaper/` | 10 | Whitepaper section renderer, LaTeX preview, citation list, version selector |
| `__tests__/` | 1 | Component tests |

## Root Components

| Component | Type | Purpose |
|-----------|------|---------|
| `Nav.astro` | Astro | Site navigation |
| `Footer.astro` | Astro | Site footer |
| `Breadcrumbs.astro` | Astro | Breadcrumb navigation |
| `HourglassReveal.tsx` | React | Hourglass scroll animation |
| `FloatingOrbs.tsx` | React | Decorative particle effects |
| `signal-bench/SignalBench.tsx` | React | Homepage hero strip chart: catalogued interference classes on synthetic traces; each event is a button that brackets its layer in an inline region view |
| `ThreatMatrix.tsx` | React | Threat matrix grid view |
| `TaraVisualization.tsx` | React | TARA data visualization |
| `radar/RadarChart.tsx` | React | The shared radar primitive: one polar geometry, one palette, a plotted state and a withheld state |
| `radar/NissVectorRadar.tsx` | React | The six NISS metrics as a shape, drawn only where the registrar has scored |
| `radar/NeurorightsRadar.tsx` | React | The proposed neurorights by technique count, with the registrar's folds printed |
| `ScrollCounter.tsx` | React | Animated scroll counter |
| `BciVisionToggle.tsx` | React | BCI vision mode toggle |
| `DualUseSplit.tsx` | React | Dual-use split view |
| `KinectVision.tsx` | React | Kinect-style depth view |
| `LensToggle.tsx` | React | Lens/theme toggle |
| `WebGLCheck.tsx` | React | WebGL capability detector |
| `TransparencyAudit.astro` | Astro | AI transparency audit display |
| `TrustBar.astro` | Astro | Trust indicators bar |
| `WhitepaperVersionSelector.astro` | Astro | Whitepaper version dropdown |
| `FeedCard.astro` | Astro | News feed card |
| `PublicationCard.astro` | Astro | Publication listing card |
| `ObfuscatedEmail.astro` | Astro | Anti-scrape email display |
| `ThemeToggle.astro` | Astro | Light/dark theme toggle |
| `TechCount.astro` | Astro | Technology count display |
