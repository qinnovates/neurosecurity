# .github/ -- CI/CD Infrastructure + Security Audit

## Structure
- `workflows/` -- GitHub Actions (see below)
- `security-audit/` -- Security scanning (hooks, patterns, install script)
- `scripts/` -- CI helper scripts (`validate-manifest.py`)
- `CODEOWNERS` -- Code ownership rules
- `dependabot.yml` -- Dependency update config
- `WORKFLOWS.md` -- Workflow documentation

## Workflows (14 total)
- Deploy: `deploy.yml` (GitHub Pages on push to main)
- Validation: `security-audit.yml`, `verify-citations.yml`, `registrar-sync-check.yml`, `timeline-check.yml`
- Auto-generation: `changelog.yml`, `field-journal-blog.yml`, `quarterly-intel-report.yml`
- Data feeds: `update-news.yml`, `update-intel.yml`, `update-registry.yml`
- Maintenance: `dependabot-auto-merge.yml`, `publish-pypi.yml`

## Conventions
- Workflows are the primary deployment mechanism -- all deploys go through Actions
- Security audit must pass before deployment
- Never commit secrets to workflow files -- use GitHub Secrets
