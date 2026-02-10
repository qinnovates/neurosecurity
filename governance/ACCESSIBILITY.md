# Accessibility Statement & Requirements

> **Qinnovate** is committed to ensuring digital accessibility for all users, including people with disabilities, neurodivergent individuals, and BCI (brain-computer interface) users.

**Last Updated:** 2026-02-10
**WCAG Version:** 2.2 Level AA (target)
**Scope:** QIF-compliant tools, Astro website (qinnovate.com), and reference implementations

---

## Table of Contents

1. [Compliance Standards](#1-compliance-standards)
2. [Requirements by Disability Type](#2-requirements-by-disability-type)
3. [GitHub Pages Site Requirements](#3-github-pages-site-requirements)
4. [Python Package Compliance (Current)](#4-python-package-compliance-current)
5. [BCI Accessibility Mode](#5-bci-accessibility-mode)
6. [Accessible Landing Site Plan](#6-accessible-landing-site-plan)
7. [Implementation Checklist](#7-implementation-checklist)
8. [Testing Protocol](#8-testing-protocol)
9. [Technical Implementation](#9-technical-implementation)
10. [Feedback](#10-feedback)

---

## 1. Compliance Standards

Qinnovate targets compliance with the following accessibility standards and regulations:

### 1.1 International Standards

| Standard | Version | Level | Scope | Status |
|----------|---------|-------|-------|--------|
| **WCAG** | 2.2 | AA | Web content | Target |
| **EN 301 549** | v3.2.1 (2021) | Harmonized | EU ICT accessibility | Target |
| **WAI-ARIA** | 1.2 | — | Rich internet applications | Target |
| **ATAG** | 2.0 | AA | Authoring tools | Informational |

### 1.2 Regulatory Frameworks

| Regulation | Jurisdiction | Applies To | Relevance |
|------------|-------------|------------|-----------|
| **ADA Title II** | US (public entities) | Government-funded projects | If Qinnovate receives federal/state funding |
| **ADA Title III** | US (public accommodation) | Websites as places of public accommodation | Applies to public-facing GitHub Pages |
| **Section 508** | US (federal) | ICT procured/developed by federal agencies | Required if used in federally funded research |
| **European Accessibility Act (EAA)** | EU | Digital products/services after June 2025 | Applies to EU-accessible web content |
| **AODA** | Ontario, Canada | Organizations with 50+ employees | Informational (if Canadian collaborators) |
| **UK Equality Act 2010** | UK | Public sector websites | Informational |

### 1.3 WCAG 2.2 AA — Full Criteria Map

WCAG 2.2 organizes requirements under four principles: **Perceivable, Operable, Understandable, Robust** (POUR).

#### Perceivable

| Criterion | ID | Requirement | QIF Applicability |
|-----------|----|-------------|-------------------|
| Non-text Content | 1.1.1 | Alt text for all non-decorative images | All pages — diagrams, SVG icons, WebGL canvases |
| Captions (Prerecorded) | 1.2.2 | Captions for video/audio content | Demo videos (if embedded) |
| Audio Description | 1.2.5 | Audio descriptions for video | Demo videos |
| Info and Relationships | 1.3.1 | Semantic HTML conveys structure | All pages — headings, lists, tables, landmarks |
| Meaningful Sequence | 1.3.2 | DOM order matches visual order | All pages |
| Sensory Characteristics | 1.3.3 | Don't rely solely on shape, size, visual position, or sound | Layer colors, threat badges |
| Orientation | 1.3.4 | Content not restricted to single orientation | All pages |
| Identify Input Purpose | 1.3.5 | Autocomplete attributes on form fields | Search, filter inputs |
| Use of Color | 1.4.1 | Color is not the only visual means of conveying info | Domain colors, severity indicators |
| Contrast (Minimum) | 1.4.3 | 4.5:1 for normal text, 3:1 for large text | All text content |
| Resize Text | 1.4.4 | Content usable at 200% zoom | All pages |
| Images of Text | 1.4.5 | Use real text, not images of text | SVG text elements |
| Non-text Contrast | 1.4.11 | 3:1 for UI components and graphics | Buttons, layer indicators, chart elements |
| Text Spacing | 1.4.12 | Content readable with increased spacing | All pages |
| Content on Hover or Focus | 1.4.13 | Dismissible, hoverable, persistent tooltips | Tooltips on visualizations |

#### Operable

| Criterion | ID | Requirement | QIF Applicability |
|-----------|----|-------------|-------------------|
| Keyboard | 2.1.1 | All functionality via keyboard | All interactive viz, menus, controls |
| No Keyboard Trap | 2.1.2 | Users can always Tab away | Modal panels, TTP detail |
| Character Key Shortcuts | 2.1.4 | Can remap or disable single-key shortcuts | Keyboard shortcuts in viz 08, 10 |
| Timing Adjustable | 2.2.1 | Users can extend/disable time limits | Auto-advancing animations |
| Pause, Stop, Hide | 2.2.2 | Users can pause moving content | SVG animations, particle effects |
| Three Flashes | 2.3.1 | No content flashes > 3 times/sec | P300 flash patterns (BCI mode must be exempt) |
| Bypass Blocks | 2.4.1 | Skip links to bypass repeated content | All pages — skip to main content |
| Page Titled | 2.4.2 | Descriptive `<title>` elements | All HTML pages |
| Focus Order | 2.4.3 | Logical Tab order | All interactive elements |
| Link Purpose (In Context) | 2.4.4 | Link text describes destination | Navigation links |
| Multiple Ways | 2.4.5 | Multiple ways to find pages | Index page + direct links |
| Headings and Labels | 2.4.6 | Descriptive headings and labels | All sections |
| Focus Visible | 2.4.7 | Visible focus indicator | All interactive elements |
| Focus Not Obscured (Minimum) | 2.4.11 | Focused element not fully hidden | Sticky headers, overlay panels |
| Focus Appearance | 2.4.13 | Focus indicator meets size/contrast | New in WCAG 2.2 |
| Dragging Movements | 2.5.7 | Single-pointer alternative to dragging | Sliders in visualizations |
| Target Size (Minimum) | 2.5.8 | 24x24px minimum for touch targets | All buttons, links, controls |

#### Understandable

| Criterion | ID | Requirement | QIF Applicability |
|-----------|----|-------------|-------------------|
| Language of Page | 3.1.1 | `lang` attribute on `<html>` | All pages |
| Language of Parts | 3.1.2 | `lang` on foreign language text | Mathematical notation, Latin terms |
| On Focus | 3.2.1 | No context change on focus | All interactive elements |
| On Input | 3.2.2 | No context change on input | Filters, dropdowns |
| Consistent Navigation | 3.2.3 | Same navigation on every page | Header/nav across all viz pages |
| Consistent Identification | 3.2.4 | Same function = same label | Button labels across pages |
| Error Identification | 3.3.1 | Errors described in text | Form validation (if any) |
| Labels or Instructions | 3.3.2 | Labels for user input | Filter controls |
| Redundant Entry | 3.3.7 | Don't re-ask for same info | New in WCAG 2.2 |

#### Robust

| Criterion | ID | Requirement | QIF Applicability |
|-----------|----|-------------|-------------------|
| Parsing | 4.1.1 | Valid HTML | All pages |
| Name, Role, Value | 4.1.2 | ARIA roles and states for custom widgets | Custom controls, SVG interactions |
| Status Messages | 4.1.3 | Status messages announced to AT | Animation state changes, filter results |

---

## 2. Requirements by Disability Type

### 2.1 Visual Disabilities

#### Blindness (Screen Reader Users)

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| All images have descriptive `alt` text | Add alt to SVG, canvas fallback descriptions | High |
| Semantic HTML structure | `<main>`, `<nav>`, `<section>`, `<article>`, `<aside>` | High |
| ARIA landmarks | `role="banner"`, `role="navigation"`, `role="main"`, `role="complementary"` | High |
| ARIA live regions | `aria-live="polite"` for animation state, filter results | High |
| Heading hierarchy | Strict h1 > h2 > h3 nesting, no skipped levels | High |
| Meaningful link text | No "click here" — describe destination | Medium |
| Data tables with headers | `<th scope="col/row">` for all data tables | High |
| SVG accessibility | `<title>`, `<desc>`, `role="img"`, `aria-label` on all SVGs | High |
| WebGL/Canvas fallback | Text-based data table alternative when canvas is primary | High |
| Form labels | `<label for="">` on all inputs | Medium |

#### Low Vision

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| 200% zoom without horizontal scroll | Responsive layout, no fixed widths > viewport | High |
| Text spacing override support | No clipping when letter/word/line spacing increased | Medium |
| High contrast mode support | `prefers-contrast: more` media query | Medium |
| Minimum 14px body text | Already enforced in design system | Done |
| Don't disable pinch-to-zoom | No `maximum-scale=1` in viewport meta | High |
| Color not sole indicator | Always pair color with text labels, icons, or patterns | High |

#### Color Blindness (8% of Males)

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| Don't rely on red/green distinction alone | Add text labels, patterns, or icons alongside color | High |
| Domain identification beyond color | Text labels ("Silicon", "Gateway", "Biology") visible alongside colored dots | High |
| Severity beyond color | Text badge ("CRITICAL", "HIGH") not just red/orange/yellow | High |
| Attack/defense beyond color | Arrow direction, text labels, not just red vs green particles | Medium |
| Colorblind-safe palette option | Provide alternative palette toggle (future) | Low |

### 2.2 Auditory Disabilities

#### Deafness / Hard of Hearing

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| Captions for all video content | Closed captions on demo videos | High (when video embedded) |
| Transcripts for audio content | Text transcripts for any narration | High (when audio added) |
| No audio-only information | All info also conveyed visually/textually | High |
| Visual indicators for audio events | If sound effects used, add visual feedback too | Medium |
| Sign language interpretation | ASL video overlay (future — for key content) | Low |

> **Current status:** The GitHub Pages site has no audio/video content embedded. Requirements apply when video demos or auto-narration features are added.

### 2.3 Motor / Physical Disabilities

#### Limited Dexterity / No Fine Motor Control

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| Full keyboard accessibility | All functions reachable via Tab, Enter, Space, Arrow, Escape | High |
| No keyboard traps | Focus can always escape any component | High |
| Target size minimum 24x24px (WCAG 2.2) | All clickable elements meet minimum | High |
| Target size 44x44px recommended (WCAG 2.5.5 AAA) | Recommended for touch interfaces | Medium |
| No time-dependent actions | Pause/extend any auto-advancing content | High |
| No drag-required interactions | Single-click alternatives for all drag actions | High |
| Single-switch navigation support | Sequential focus navigation works end-to-end | Medium |
| Sip-and-puff compatibility | Works through keyboard interface | Medium |
| Voice control compatibility | Visible labels match accessible names | Medium |

#### Tremor / Involuntary Movement

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| Generous click targets with spacing | 20px minimum gap between interactive elements | Medium |
| Undo/confirm for destructive actions | Confirmation for state-changing actions | Low |
| Debounce rapid inputs | Prevent accidental double-clicks/activations | Medium |

### 2.4 Cognitive & Neurological Disabilities

#### Cognitive Disabilities (Dyslexia, ADHD, TBI, Intellectual)

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| Clear, simple language option | Plain language summaries for technical content | Medium |
| Consistent navigation | Same nav structure across all pages | High |
| Predictable interactions | No unexpected context changes | High |
| Chunked content | Break long content into digestible sections | Medium |
| Progress indicators | Show where user is in multi-step flows | Medium |
| Error prevention and recovery | Clear error messages with suggested actions | Medium |
| Distraction-free mode | Option to hide non-essential UI elements | Low |

#### Seizure / Photosensitive Epilepsy

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| No content flashes > 3 times/sec | Validate all animations | Critical |
| `prefers-reduced-motion` support | Disable/reduce all animations when set | High |
| Warning before flashing content | If unavoidable, warn user before showing | High |
| No large-area sudden brightness changes | Gradual transitions only | High |

#### Vestibular Disorders

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| `prefers-reduced-motion` respect | Disable parallax, auto-play, zoom animations | High |
| No auto-playing animations | User-initiated only, or pausable | High |
| Minimal motion design | Static alternatives for animated content | Medium |

### 2.5 BCI / Assistive Technology Users

#### P300 / EEG-Based Browsers

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| Menu-based navigation (no free scrolling) | Paginated content with grid menus | High |
| Large targets (80x80px minimum in BCI mode) | BCI Mode CSS overrides | High |
| Maximum 9 targets per screen | Grid layout limit when BCI Mode active | High |
| No hover-dependent interactions | All hover actions have click alternatives | High |
| No scroll-dependent content | Pagination replaces infinite scroll | High |
| No keyboard-dependent shortcuts | Menu selection replaces keyboard input | High |
| Minimal screen changes | Reduce reflows and layout shifts | Medium |
| Predictable target positions | Consistent grid positions across screens | Medium |

#### Switch Access Users

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| Linear focus order | Logical Tab sequence through all elements | High |
| Scannable groups | ARIA groups for efficient scanning | Medium |
| Timeout extensions | No time-limited interactions | High |

> See [Section 5: BCI Accessibility Mode](#5-bci-accessibility-mode) for full BCI Mode specification.

---

## 3. GitHub Pages Site Requirements

The GitHub Pages site at `qinnovate.com/` hosts 12+ interactive visualizations, a whitepaper, and documentation. These are self-contained HTML files with inline CSS/JS, WebGL (Three.js), and SVG animations.

### 3.1 Current Gaps

| Page | Gap | WCAG Criterion | Severity |
|------|-----|----------------|----------|
| All pages | No `lang="en"` on `<html>` | 3.1.1 | High |
| All pages | No skip links | 2.4.1 | High |
| All pages | No `<main>` landmark | 1.3.1 | High |
| All pages | Missing `aria-label` on interactive elements | 4.1.2 | High |
| All pages | `<div onclick>` instead of `<button>` | 4.1.2, 2.1.1 | High |
| 08-oni-framework-viz | WebGL canvas has no text fallback | 1.1.1 | High |
| 08-oni-framework-viz | Keyboard shortcuts not documented in UI | 2.1.4 | Medium |
| 10-attack-defense-flow | SVG animation cannot be paused by keyboard alone | 2.2.2 | High |
| 10-attack-defense-flow | Timeline events lack ARIA announcements | 4.1.3 | Medium |
| All visualizations | No `prefers-reduced-motion` support | 2.3.3 | High |
| All visualizations | Focus indicators missing or insufficient | 2.4.7 | High |
| index.html | Cards are not keyboard-focusable | 2.1.1 | High |
| All pages | No consistent page `<title>` format | 2.4.2 | Medium |
| All pages | Viewport meta may restrict zoom | 1.4.4 | Medium |

### 3.2 Page-by-Page Requirements

#### Landing Page (`docs/index.html`)

- [ ] Add `lang="en"` to `<html>`
- [ ] Add skip link to main content
- [ ] Wrap card grid in `<main>` with `role="main"`
- [ ] Make all cards keyboard-focusable (`tabindex="0"` or convert to `<a>`)
- [ ] Add `aria-label` to each card describing the visualization
- [ ] Ensure card hover states also work on focus

#### Visualizations Hub (`docs/visualizations/index.html`)

- [ ] Add `lang="en"`, skip link, `<main>` landmark
- [ ] Convert app-card divs to semantic links or buttons
- [ ] Add `alt` text to SVG preview icons
- [ ] Ensure feature tags are not color-only

#### Interactive Visualizations (01-10)

- [ ] Add `lang="en"`, skip link, `<main>` on every page
- [ ] Replace all `<div onclick>` with `<button>` elements
- [ ] Add `aria-label` to all interactive controls
- [ ] Add `prefers-reduced-motion` media query (disable animations, show static state)
- [ ] Add visible focus indicators (`:focus-visible` outline)
- [ ] Add keyboard trap prevention (Escape closes overlays)
- [ ] Add `aria-live="polite"` for dynamic content updates
- [ ] Provide text alternative for WebGL canvas (08)
- [ ] Provide text alternative for SVG animations (10)
- [ ] Ensure all filter dropdowns are accessible (`<select>` or ARIA listbox)
- [ ] Add page-level keyboard shortcut help (accessible via `?` key)

#### Whitepaper (`docs/whitepaper/index.html`)

- [ ] Add `lang="en"`, skip link, `<main>` landmark
- [ ] Ensure heading hierarchy is correct
- [ ] Add `aria-label` to navigation elements
- [ ] Verify all mathematical content has text alternatives

---

## 4. Python Package Compliance (Current)

QIF-compliant reference implementations currently meet WCAG 2.1 Level AA standards.

### 4.1 Conformance Level

| Criteria | Status | Notes |
|----------|--------|-------|
| **1.4.3 Contrast (Minimum)** | Compliant | All text meets 4.5:1 ratio |
| **1.4.11 Non-text Contrast** | Compliant | UI components meet 3:1 ratio |
| **2.1.1 Keyboard** | Compliant | All functions keyboard accessible |
| **2.1.2 No Keyboard Trap** | Compliant | Focus can always be moved |
| **2.4.1 Bypass Blocks** | Compliant | Skip links implemented |
| **2.4.7 Focus Visible** | Compliant | Focus indicators on all interactive elements |
| **2.3.1 Three Flashes** | Compliant | No flashing content |
| **2.3.3 Animation from Interactions** | Compliant | Respects prefers-reduced-motion |

### 4.2 Color Contrast Ratios

#### QIF Reference UI

All colors tested against primary background `#0f0f1a`:

| Color | Hex | Contrast Ratio | WCAG AA |
|-------|-----|----------------|---------|
| Primary Text | `#e2e8f0` | 13.5:1 | Pass |
| Secondary Text | `#a8b5c7` | 7.2:1 | Pass |
| Muted Text | `#8b9cb3` | 5.5:1 | Pass |
| Success | `#22c997` | 5.2:1 | Pass |
| Warning | `#fbbf24` | 8.5:1 | Pass |
| Error | `#f87171` | 5.1:1 | Pass |

#### TARA Stack

All colors tested against primary background `#0a0a0f`:

| Color | Hex | Contrast Ratio | WCAG AA |
|-------|-----|----------------|---------|
| Primary Text | `#e2e8f0` | 14.5:1 | Pass |
| Secondary Text | `#a8b5c7` | 7.2:1 | Pass |
| Muted Text | `#8b9cb3` | 5.5:1 | Pass |
| Cyan Neon | `#00f5ff` | 8.9:1 | Pass |
| Magenta Neon | `#ff66ff` | 6.2:1 | Pass |
| Green Neon | `#33ff99` | 11.2:1 | Pass |
| Warning | `#ffcc00` | 10.8:1 | Pass |
| Error | `#ff6666` | 5.5:1 | Pass |

### 4.3 Existing Features

**Keyboard Navigation:**
- **Tab**: Move between interactive elements
- **Enter/Space**: Activate buttons and links
- **Arrow Keys**: Navigate within components (sliders, menus)
- **Escape**: Close modals and dropdowns

**Skip Links:** Both UIs include skip links (skip to main content, skip navigation).

**Focus Indicators:** 2px solid outline in brand color, 2px offset, box shadow glow.

**Motion Preferences:** `prefers-reduced-motion` disables/reduces animations, hides scanline effects, minimizes transitions.

**Font Sizes:** Minimum 14px (0.875rem) enforced for body text, small text, and labels.

**Screen Reader Support:** Semantic HTML, ARIA labels, proper heading hierarchy, alt text for images.

### 4.4 Known Limitations

1. **Streamlit Framework**: Some accessibility features are limited by the Streamlit framework
2. **Dynamic Content**: Some dynamically generated charts may have limited screen reader support
3. **Color-Only Information**: Charts use both color and pattern/labels for information

---

## 5. BCI Accessibility Mode

> **Purpose:** Enable P300/EEG-based BCI browser users who cannot scroll, hover, or use keyboard input to navigate the full Qinnovate site.

### 5.1 BCI Mode Specification

When BCI Mode is active:

| Property | Standard Mode | BCI Mode |
|----------|---------------|----------|
| Navigation | Scroll + click | Paginated menus, grid selection |
| Target size | 24px min | 80x80px min |
| Targets per screen | Unlimited | 9 max (3x3 grid) |
| Animations | Enabled | Disabled (static diagrams) |
| Hover interactions | Active | Disabled (click-only) |
| Auto-advance | Optional | Disabled |
| Content density | Full | Chunked into pages |
| WebGL/3D | Live rendering | Static fallback image |

### 5.2 BCI Mode Components

1. **BCI Mode Toggle** — Persistent header element, first focusable item, stored in localStorage
2. **Paginated Menu System** — Replaces scrolling with numbered page navigation
3. **Grid Navigation** — 3x3 grid of large targets per screen
4. **Static Fallbacks** — Pre-rendered images for WebGL (08) and animated SVG (10)
5. **Auto-Narration** — Text-to-speech descriptions of visualization states (replaces manual interaction)

### 5.3 BCI Mode CSS Overrides

```css
/* BCI Mode active */
body.bci-mode * {
    animation: none !important;
    transition: none !important;
}

body.bci-mode .interactive-target {
    min-width: 80px;
    min-height: 80px;
    padding: 16px;
    margin: 10px;
    font-size: 18px;
    border: 3px solid currentColor;
}

body.bci-mode .page-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 600px;
    margin: 0 auto;
}
```

### 5.4 BCI Feedback Modal

A dedicated **BCI Mode toggle** (brain icon, green accent) is positioned above the animation toggle in the bottom-right corner of the landing page. This is separate from the animation toggle — BCI mode does not disable visualizations; it applies BCI-specific accommodations (large targets, no hover, paginated navigation) while keeping content fully visible.

When a user enables BCI-friendly mode via this toggle, a one-time feedback modal is displayed. This modal:

- **Thanks the user** for their interest in accessible/BCI-compatible browsing
- **Invites feedback** — asks how the project can be improved for their needs
- **Links to GitHub Issues** with pre-filled `accessibility` and `bci-feedback` labels
- **Shows only once** — state persisted in `localStorage` (`oni-bci-feedback-shown`)
- **Dismissible** via "Maybe later" button, backdrop click, or Escape key
- **Non-blocking** — clicking the feedback link also marks it as shown

**Rationale:** BCI users and assistive technology users are the people best positioned to tell us what works and what doesn't. Rather than assuming we've built the right experience, this modal opens a direct line of communication with the community we're designing for. It's a small gesture of gratitude and an invitation to collaborate.

**localStorage keys:**

| Key | Values | Purpose |
|-----|--------|---------|
| `oni-bci-mode-enabled` | `'true'` / absent | Persists BCI mode toggle state across sessions |
| `oni-bci-feedback-shown` | `'true'` / absent | Prevents repeat display of feedback modal |

**Implementation:** `docs/index.html` — CSS (`#qif-bci-toggle`, `#qif-bci-feedback-overlay`), HTML (BCI toggle button + feedback dialog), JS (within animation toggle IIFE).

**Note:** The `body.bci-mode` class is applied when the toggle is active. BCI-specific CSS overrides (Section 5.3) hook into this class. The animation toggle (`body.reduced-motion`) and BCI toggle (`body.bci-mode`) are independent — users can enable either or both.

### 5.5 Immersive Whitepaper (V1)

The whitepaper (`docs/whitepaper/index.html`) is the first page to implement the immersive BCI-adaptive experience. It includes three features:

1. **3D Curved Display Effect** — As the user scrolls, sections rotate subtly via CSS 3D transforms (GSAP ScrollTrigger), creating the sensation of reading on a curved display. A vignette overlay darkens viewport edges to reinforce the illusion. Disabled in BCI mode, reduced-motion mode, and on mobile (< 1024px).

2. **AI Voiceover Toggle** — A speaker-icon button (bottom-left, cyan accent) enables section-by-section audio narration. When enabled, audio plays as each section enters the viewport. Missing audio files are handled silently ("audio coming soon"). Audio stubs are in `docs/whitepaper/audio/` — dropping MP3s with the correct filenames activates them automatically. Voiceover is NOT disabled by reduced-motion (audio is not a motion concern).

3. **BCI-Mode Adaptations** — When `body.bci-mode` is active (synced from landing page localStorage), the whitepaper renders with 15% larger text, doubled line height, narrower column, visible section borders, and no 3D effects (vestibular safety). The voiceover toggle is given extra prominence (larger, bordered).

**This is the V1 foundation** for the future BCI device rendering roadmap (see `MAIN/legacy-core/project/future/BCI_DEVICE_RENDERING.md`). Future versions will overlay live BCI device data onto the whitepaper visualizations.

### 5.6 Implementation Timeline

BCI Mode should be implemented **after all visualization pages are finalized** to avoid rework. See [Section 7](#7-implementation-checklist) for phased rollout.

---

## 6. Accessible Landing Site Plan

> **Purpose:** A separate, dedicated accessible version of the Qinnovate site that users with disabilities can land on directly.

### 6.1 Site Architecture

```
qinnovate.com/accessible/
├── index.html          # Accessible landing page
├── layers.html         # 14-layer model (text + static diagrams)
├── threats.html        # Attack taxonomy (searchable table)
├── whitepaper.html     # Whitepaper (simplified layout)
├── visualizations.html # Links to accessible versions of each viz
└── about.html          # About Qinnovate + accessibility statement
```

### 6.2 Design Principles

1. **No JavaScript required** for core content (progressive enhancement only)
2. **Single-column layout** — no multi-panel grids
3. **High contrast default** — white background, black text, or user-selectable theme
4. **Large text default** — 18px minimum body text
5. **No animations** — all content is static
6. **Semantic HTML only** — no custom widgets without ARIA
7. **Table-based data** — attack chains, layer details, TTPs as accessible `<table>` elements
8. **Print-friendly** — CSS print stylesheet included

### 6.3 Landing Page Content

The accessible landing page should provide:

- **Site purpose** — What QIF is, one paragraph
- **Navigation menu** — Large, clearly labeled links to each section
- **Accessibility features** — What accommodations are available
- **BCI Mode toggle** — For P300/EEG browser users
- **Theme selector** — Light/dark/high-contrast
- **Font size controls** — Small/medium/large/extra-large
- **Language** — English (with `lang="en"`)
- **Contact** — How to request additional accommodations

### 6.4 Cross-Linking

The main site should include:
- A visible "Accessible Version" link in the header/footer of every page
- An automatic redirect suggestion when `prefers-reduced-motion` or `prefers-contrast` is detected
- A `<link rel="alternate">` pointing to the accessible version

---

## 7. Implementation Checklist

### Phase 1: Foundation (Do First)

These changes are low-effort and should be applied to all pages immediately:

- [ ] Add `lang="en"` to all `<html>` elements
- [ ] Add `<meta name="viewport" content="width=device-width, initial-scale=1">` (no `maximum-scale`)
- [ ] Add descriptive `<title>` to every page
- [ ] Add `prefers-reduced-motion` media query to all pages
- [ ] Add `prefers-contrast: more` media query (increase borders, reduce transparency)
- [ ] Replace all `<div onclick>` with `<button>` elements
- [ ] Add skip links ("Skip to main content") to all pages
- [ ] Add `<main>` landmark to all pages
- [ ] Add `:focus-visible` styles with visible outline

### Phase 2: Semantic Structure

- [ ] Add ARIA landmarks (`role="banner"`, `role="navigation"`, `role="main"`, `role="complementary"`)
- [ ] Fix heading hierarchy (h1 > h2 > h3, no skipped levels)
- [ ] Add `aria-label` to all interactive elements
- [ ] Add `aria-live="polite"` regions for dynamic content
- [ ] Add `alt` text / `<title>` + `<desc>` to all SVGs
- [ ] Add text fallback for WebGL canvas (08-oni-framework-viz)
- [ ] Convert informational SVGs to `role="img"` with descriptions

### Phase 3: Keyboard & Motor

- [ ] Audit full keyboard navigation path on every page
- [ ] Ensure no keyboard traps (Escape always works)
- [ ] Add keyboard shortcut documentation panel (? key to open)
- [ ] Verify target sizes meet 24x24px minimum (44x44px preferred)
- [ ] Add 20px minimum spacing between interactive targets
- [ ] Ensure all drag interactions have click alternatives

### Phase 4: BCI Mode

- [x] Build BCI Mode toggle component (brain icon, green accent, separate from animation toggle)
- [x] Build BCI feedback modal (thank-you + invite feedback on first enable)
- [ ] Build paginated menu navigation system
- [ ] Create static fallback images for WebGL (08) and SVG animations (10)
- [ ] Implement 80x80px target sizing in BCI mode
- [ ] Limit to 9 targets per screen in BCI mode
- [ ] Add auto-narration mode for interactive visualizations
- [ ] Test with simulated P300 input (sequential focus navigation)

### Phase 5: Accessible Landing Site

- [ ] Create `docs/accessible/` directory
- [ ] Build accessible index.html with no-JS content
- [ ] Port 14-layer model to accessible table format
- [ ] Port attack taxonomy to searchable accessible table
- [ ] Add "Accessible Version" link to all main site pages
- [ ] Add theme selector (light/dark/high-contrast)
- [ ] Add font size controls

### Phase 6: Verification

- [ ] Lighthouse accessibility audit score >= 95 on all pages
- [ ] axe-core scan with 0 critical/serious violations
- [ ] VoiceOver (macOS) end-to-end navigation test
- [ ] NVDA (Windows) end-to-end navigation test
- [ ] Keyboard-only navigation test (no mouse)
- [ ] 200% zoom test (no horizontal scroll, no content loss)
- [ ] `prefers-reduced-motion` simulation test
- [ ] Color contrast analyzer pass on all text
- [ ] WAVE tool scan on all pages

---

## 8. Testing Protocol

### 8.1 Automated Testing

#### Lighthouse

```bash
# Run Lighthouse accessibility audit
npx lighthouse https://qinnovate.com --only-categories=accessibility --output=json
```

Target: >= 95 score on all pages.

#### axe-core

```bash
# Install axe CLI
npm install -g @axe-core/cli

# Scan a page
axe https://qinnovate.com/visualizations/
```

Target: 0 critical and serious violations.

#### Python Package Checker

```bash
# Existing accessibility checker for Python packages
python MAIN/governance/scripts/check_accessibility.py
python MAIN/governance/scripts/check_accessibility.py --verbose
python MAIN/governance/scripts/check_accessibility.py --strict
```

#### GitHub Action

**Workflow:** `.github/workflows/accessibility.yml`

- Triggers after PyPI publish and on manual dispatch
- Checks: color contrast, font sizes, focus indicators, reduced motion, skip links
- Badge: Repository displays accessibility compliance status

### 8.2 Manual Testing

| Test | Tool | Frequency |
|------|------|-----------|
| Screen reader (macOS) | VoiceOver (Cmd+F5) | After each page change |
| Screen reader (Windows) | NVDA (free) | Before each release |
| Keyboard navigation | Tab/Enter/Escape | After each page change |
| Color blindness | Sim Daltonism (macOS app) | After color changes |
| Zoom test | Browser zoom 200% | After layout changes |
| Motion sensitivity | DevTools > Rendering > prefers-reduced-motion | After animation changes |
| Contrast | WebAIM Contrast Checker | After color changes |
| HTML validation | W3C Validator | After structural changes |
| WAVE scan | wave.webaim.org | Monthly |

### 8.3 User Testing

When possible, test with actual assistive technology users:

1. Screen reader users (blind)
2. Switch access users (motor impaired)
3. Voice control users (Dragon NaturallySpeaking)
4. Magnification users (low vision)
5. BCI browser users (if available for testing)

---

## 9. Technical Implementation

### 9.1 Files

| File | Purpose |
|------|---------|
| `oni-framework/oni/ui/styles.py` | QIF Academy styles (WCAG compliant) |
| `tara-nsec-platform/tara_mvp/ui/styles.py` | TARA styles (WCAG compliant) |
| `governance/scripts/check_accessibility.py` | Automated compliance checker |
| `.github/workflows/accessibility.yml` | CI/CD accessibility workflow |
| `docs/accessible/` | Accessible landing site (planned) |

### 9.2 CSS Patterns

```css
/* Skip link for keyboard navigation */
.skip-link {
    position: absolute;
    left: -9999px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
}
.skip-link:focus {
    position: fixed;
    top: 10px;
    left: 10px;
    width: auto;
    height: auto;
    padding: 8px 16px;
    background: #000;
    color: #fff;
    z-index: 10000;
    font-size: 16px;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* Respect user's contrast preferences */
@media (prefers-contrast: more) {
    :root {
        --border-opacity: 1;
        --bg-opacity: 1;
    }
}

/* Focus states for keyboard navigation */
*:focus-visible {
    outline: 3px solid #58a6ff;
    outline-offset: 2px;
}

/* Minimum target size (WCAG 2.5.8) */
button, a, [role="button"], [tabindex="0"] {
    min-width: 24px;
    min-height: 24px;
}
```

### 9.3 Accessibility Checker Features

```python
# Color contrast calculation (WCAG algorithm)
def contrast_ratio(color1, color2) -> float

# Minimum requirements
WCAG_AA_CONTRAST_NORMAL = 4.5  # For regular text
WCAG_AA_CONTRAST_LARGE = 3.0   # For large text (18pt+)
MIN_FONT_SIZE_REM = 0.875      # 14px minimum
```

### 9.4 CI/CD Integration

```yaml
# Trigger configuration
on:
  workflow_run:
    workflows: ["Publish to PyPI"]
    types: [completed]
  workflow_dispatch:
```

---

## 10. Feedback

We welcome feedback on the accessibility of Qinnovate interfaces.

Please report accessibility issues:
- **GitHub Issues:** https://github.com/qinnovates/qinnovate/issues
- **Label:** `accessibility`
- **Include:** Page URL, assistive technology used, description of barrier

For urgent accessibility requests, include "ACCESSIBILITY" in the issue title.

---

## References

- W3C. (2023). *Web Content Accessibility Guidelines (WCAG) 2.2.* https://www.w3.org/TR/WCAG22/
- W3C. (2017). *WAI-ARIA 1.2.* https://www.w3.org/TR/wai-aria-1.2/
- U.S. Access Board. (2017). *Section 508 Standards.* https://www.access-board.gov/ict/
- U.S. Department of Justice. (2024). *ADA Title II Web Accessibility Rule.* 28 CFR Part 35
- European Commission. (2019). *European Accessibility Act (Directive 2019/882).*
- ETSI. (2021). *EN 301 549 v3.2.1: Accessibility requirements for ICT products and services.*
- Government of Ontario. (2005). *Accessibility for Ontarians with Disabilities Act (AODA).*

---

*This accessibility requirements document was created on 2026-02-01.*
*Qinnovate is committed to continuous accessibility improvement.*

---

← Back to [Governance](/governance/) | [NEUROETHICS_ALIGNMENT.md](NEUROETHICS_ALIGNMENT.md) | [TRANSPARENCY.md](TRANSPARENCY.md)
