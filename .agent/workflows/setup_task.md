---
description: Start a new development task securely.
---
1. Read the project configuration to understand improved context.
    - view_file `CLAUDE.md`
    - view_file `SECURITY.md`
2. **SYNC CONTEXT**: Run the agent sync script to ensure `CLAUDE.md` is up to date.
    - `npm run sync`
    - view_file `CLAUDE.md` (Read the fresh context)
3. Run a security audit to ensure the base state is secure.
    - `npm audit`
3. Check for uncommitted changes to ensure a clean starting point.
    - `git status --porcelain`
4. If there are uncommitted changes or security vulnerabilities, STOP and ask the user how to proceed.
