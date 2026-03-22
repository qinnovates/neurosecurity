# site/ -- Built Output + Static Assets (Served at Site Root)

## Structure
- `data/` -- Prebuild-copied JSON from datalake (KQL source)
- `images/` -- Site images (OG images, screenshots, archives)
- `charts/` -- Business and data visualizations
- `models/` -- 3D molecular models (`.glb`, `.pdb`, `.swc`)
- `learn/` -- Interactive learning pages (calculus, autodidactive curriculum)
- `brain-capture.html` -- Standalone brain capture page
- `robots.txt` -- Search engine crawl rules

## Conventions
- Static files here are served as-is at the site root, not processed by Astro
- Access pattern: `src/site/images/foo.png` serves at `/images/foo.png`
- Prefer `src/` for assets that need Astro processing (optimization, hashing)
- Keep file sizes reasonable -- large assets slow down git clone
- 3D models in `models/` are used by the Neural Atlas viewer
- Do not edit built output directly -- it is overwritten by `npm run build`
