# Vendored browser libraries

Served from this origin so no page loads script, style, or fonts from a third-party CDN.
Each file is copied unmodified from the package installed through package-lock.json.

| Directory | Package | Version | Files |
|---|---|---|---|
| katex/ | katex | 0.19.1 | katex.min.css, katex.min.js, contrib/auto-render.min.js, fonts/*.woff2 |
| three/ | three | 0.186.1 | build/three.module.js, build/three.core.js, examples/jsm/controls/OrbitControls.js |

To update: bump the dependency, run npm ci, and copy the same files again.
