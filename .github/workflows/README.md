# .github/workflows/ -- CI/CD Pipelines

GitHub Actions workflows for build, deploy, data sync, and validation.

## Table of Contents
- [Deployment](#deployment)
- [Data Sync](#data-sync)
- [Validation](#validation)
- [Content](#content)
- [Maintenance](#maintenance)

## Deployment

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `deploy.yml` | Push to main | Build Astro site and deploy to GitHub Pages |

## Data Sync

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `update-intel.yml` | Schedule (daily) | Fetch BCI intelligence feeds |
| `update-news.yml` | Schedule (daily) | Fetch external news sources |
| `update-registry.yml` | Schedule (daily) | Sync automation registry |

## Validation

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `registrar-sync-check.yml` | Push | Verify TARA registrar consistency across TypeScript, Python, and JSON |
| `timeline-check.yml` | Push | Validate qif-timeline.json stats match actual counts |
| `verify-citations.yml` | Push | Check bibliography entries resolve to real DOIs |
| `security-audit.yml` | Push/Schedule | Run security scans for secrets, credentials, PII |

## Content

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `changelog.yml` | Push | Auto-generate CHANGELOG.md from git log |
| `field-journal-blog.yml` | Manual | Convert field journal entries to blog posts |
| `quarterly-intel-report.yml` | Schedule (quarterly) | Generate quarterly BCI intelligence report |
| `publish-pypi.yml` | Release | Publish qtara Python SDK to PyPI |

## Maintenance

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `dependabot-auto-merge.yml` | Dependabot PR | Auto-merge patch-level dependency updates |
