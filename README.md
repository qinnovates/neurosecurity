# Qinnovate

**[qinnovate.com](https://qinnovate.com)** — Open standards for neural security.

---

## Architecture

Built with [Astro](https://astro.build/) 5.x — static site generation with React islands for interactive components.

| Tech | Purpose |
|------|---------|
| Astro 5 | Static site framework (zero JS by default) |
| React + Three.js | Interactive islands (hero particles, hourglass) |
| Tailwind CSS 4 | Design system + custom tokens |
| Content Collections | Blog posts from Markdown |
| GitHub Actions | Build + deploy to GitHub Pages |

## Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Hero, framework overview, latest publications |
| Framework | `/framework/` | QIF Hourglass Model, 7-band architecture, coherence metric |
| Publications | `/publications/` | Research catalog (11 posts, filterable by tag) |
| News & Intel | `/news/` | BCI security intelligence briefs + curated sources |
| Lab | `/lab/` | Coherence calculator, scale-frequency explorer |
| Roadmap | `/roadmap/` | Framework development phases |
| About | `/about/` | Mission, team, contact |
| CTF Archive | `/ctf/` | Original mystery site (preserved) |

## Development

```bash
npm install
npm run dev      # localhost:4321
npm run build    # outputs to dist/
npm run preview  # preview production build
```

## Deployment

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`) which builds the site and deploys to GitHub Pages.

## Repositories

| Repo | Purpose |
|------|---------|
| [qinnovates.github.io](https://github.com/qinnovates/qinnovates.github.io) | Qinnovate main site (this repo) |
| [mindloft](https://github.com/qinnovates/mindloft) | QIF Framework — research, docs, tools |

---

*Open standards for brain-computer interface security.*
