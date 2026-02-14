---
description: Create a Pull Request with security and integrity checks.
---
1. Review the `CLAUDE.md` file for project-specific guidelines.
    - view_file `CLAUDE.md`
2. Run the build to ensure the code compiles correctly.
    - `npm run build`
3. Run type checks to catch TypeScript errors.
    - `npm run type-check`
4. **SECURITY CHECK**: Remind the user to review the diff for any secrets or PII.
    - ask "Have you reviewed `git diff` to ensuring no secrets (API keys, tokens) or PII are being committed?"
5. If the user confirms, create the Pull Request.
    - `gh pr create` (Antigravity will ask for details)
