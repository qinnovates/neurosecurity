# Changelog

All notable changes to the ONI Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-01-26

### Added
- **WCAG 2.1 AA Compliance** - Full accessibility compliance for ONI Academy UI
- **Accessibility Checker** (`check_accessibility.py`) - Automated WCAG validation script
- **GitHub Action** (`accessibility.yml`) - CI/CD pipeline for accessibility testing
- **Skip Links** - Keyboard navigation support for screen readers
- **Focus Indicators** - Visible focus states on all interactive elements
- **Reduced Motion Support** - Respects `prefers-reduced-motion` preference

### Changed
- Updated color palette for WCAG AA contrast ratios (4.5:1 minimum)
- Fixed text colors: `#94a3b8` → `#a8b5c7` (7.2:1), `#64748b` → `#8b9cb3` (5.5:1)
- Minimum font size now 0.875rem (14px) for accessibility
- Fixed tagline centering in hero section
- Improved section header subtitle spacing

### Documentation
- Added `ACCESSIBILITY.md` with full compliance documentation
- Added color contrast ratio tables for all UI colors
- Added automated testing instructions

## [0.2.1] - 2026-01-25

### Fixed
- Minor bug fixes and stability improvements

## [0.2.0] - 2026-01-25

### Added
- **Interactive UI** (`oni ui`) - Streamlit-based learning interface for non-technical users
- **CLI tool** (`oni`) - Command-line interface with `ui`, `info`, `demo`, `version` commands
- **ConsentManager** - Patient consent tracking including pediatric-aware consent (Lázaro-Muñoz framework)
- **print_summary()** - Quick overview of all available modules
- **get_version()** - Programmatic version access

### Changed
- Bumped version to 0.2.0 (Beta status)
- Improved package description for PyPI
- Added `Healthcare Industry` to intended audiences
- Added `ui` optional dependency group for Streamlit UI
- Better organized `__init__.py` exports with clear categories

### Documentation
- Added comprehensive docstrings to `__init__.py`
- Added quick start examples in module docstring
- Better explanation of what each module does

## [0.1.0] - 2026-01-15

### Added
- **CoherenceMetric** - Signal trust scoring (Cₛ calculation)
- **NeuralFirewall** - Zero-trust signal filtering at L8
- **ONIStack** - 14-layer reference model navigation
- **ScaleFrequencyInvariant** - f × S ≈ k validation
- **KohnoThreatModel** - CIA threat classification (Kohno 2009)
- **NeurosecurityFirewall** - Combined coherence + threat detection
- **BCIAnonymizer** - Privacy-preserving ERP filtering (Bonaci 2015)
- **PrivacyScoreCalculator** - Information leakage risk scoring

### Research Integration
- Kohno et al. (2009): Neurosecurity threat model
- Chizeck & Bonaci (2014): BCI Anonymizer patent implementation
- Yuste et al. (2017): Neurorights alignment
- Ienca & Andorno (2017): Cognitive liberty principles

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.2.2 | 2026-01-26 | WCAG 2.1 AA compliance, accessibility checker |
| 0.2.1 | 2026-01-25 | Bug fixes |
| 0.2.0 | 2026-01-25 | Interactive UI, CLI, ConsentManager |
| 0.1.0 | 2026-01-15 | Initial release with core modules |
