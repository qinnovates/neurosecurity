# Qinnovate Project Guide
## Commands
- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Updates**: `npm run fetch-news`
- **Type Check**: `npm run type-check`
- **Sync Context**: `npm run sync` (Refreshes this file)

## Multi-Agent Protocol (Shared Memory)
- **Source of Truth:** The `_memory/` directory is the SHARED synchronization point for all agents (Claude, Antigravity, etc.).
- **Read/Write:** Agents MUST check `_memory/daily/<date>.md` and `_memory/antigravity_context.md` before starting work.
- **Protocol:**
  1. Read latest daily log.
  2. Read active context files.
  3. Append updates to daily log.
  4. Respect file locks if noted.
- **Location:** If `_memory` is a symlink (e.g., to Google Drive), treat it transparently as the local `_memory/` path.
- **SECURITY:** NEVER store API keys, credentials, or PII in memory logs. Redact sensitive data before writing.


## Project Structure
- `src/`: Astro website source
  - `pages/`: Routes
    - `api/`: Data endpoints (e.g. tara.json)
    - `TARA/[id].astro`: Dynamic Threat Pages
  - `components/`: React/Astro components
  - `layouts/`: Page layouts
  - `lib/`: Utility functions and constants
- `qif-framework/`: QIF security specification docs
- `governance/`: Policy and ethics documents
- `shared/`: Shared data (Source of Truth)
- `public/`: Static assets

## Tech Stack
- Framework: Astro 5.x
- UI: React 19, TailwindCSS 4
- Language: TypeScript

## Guidelines
- Use Semantic HTML.
- Follow Tailwind v4 conventions.
- Update `shared/` JSON files for data changes, which are copied to `docs/data` during build.
- Documentation is a primary product; keep markdown clean and standard.

## Cross-AI Validation Protocol
After ANY cross-AI validation session (Gemini review, multi-model cycle, independent peer review),
append a row to `governance/TRANSPARENCY.md` > Cross-AI Validation Sessions table BEFORE ending
the session. Format: `| Date | Topic | AI Systems | Human Decision | Derivation Log Ref |`
This applies to all agents (Claude, Antigravity, etc.) working in this repo.

## Standards & Governance (Scale)
- **QIF (Security)**: All architectural changes must align with the 11-band hourglass model.
- **TARA (Threats)**: New techniques must be scored with NISS (Neural Impact Scoring System).
- **Governance**: Refer to `governance/` for ethics, consent, and regulatory compliance.
- **Scale**: This is a standards body. Changes affect the industry. Verification is critical.

