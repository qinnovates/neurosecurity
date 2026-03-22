---
paths:
  - "src/pages/research/whiteresearch/paper/**"
  - "src/components/WhitepaperVersionSelector.astro"
---

# Whitepaper Version Archival Protocol

When a new whitepaper version ships, the previous version MUST be archived before publishing the new one. This is mandatory -- no version is ever lost.

## Steps (every version bump):
1. **Copy current `index.astro`** to a versioned file: `src/pages/research/whitepaper/v{OLD_VERSION}.astro`
   - Example: when shipping v8.0, copy the current v7.1 index to `v7-1.astro` (already done)
   - Preserve the ENTIRE page -- all content, components, styles. No truncation
2. **Update `WhitepaperVersionSelector.astro`** (`src/components/WhitepaperVersionSelector.astro`):
   - Add the new version as `current: true` at the top of the versions array
   - Set the old version to `current: false` with its archive href (`/research/whitepaper/v{VERSION}/`)
   - Every version ever published must remain in the selector list -- never remove entries
3. **Update `index.astro`** with the new version content
4. **Verify all archive links work** after build (every `/research/whitepaper/v*/` URL must return 200)
5. **Static HTML archives** (v2, v3, v5) live in `docs/research/whitepaper/` and are copied to dist at build time

## Version selector rules:
- All versions listed in chronological order (newest first)
- Current version shows "CURRENT" badge
- Archive versions show "ARCHIVE" badge
- No external links (all archives are on-site)
- Working drafts are labeled as such in the note field
