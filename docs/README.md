# docs/

Static assets for the qinnovate.com website (GitHub Pages).

This directory is Astro's `publicDir` — files here are copied as-is to the build output root. Use it for assets that don't need processing:

- `CNAME` — Custom domain config
- `robots.txt` — Search engine directives
- `fonts/` — Web fonts
- `images/` — Static images
- `brands.json` — Brand configuration
- `lab/` — Standalone HTML experiments

The site is built and deployed via GitHub Actions (`.github/workflows/deploy.yml`). Astro compiles `src/` pages and copies `docs/` assets into `dist/`, which is then uploaded to GitHub Pages.
