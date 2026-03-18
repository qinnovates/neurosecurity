# tools/ -- Security Tools

## Structure
- `macshield/` -- macOS security hardening tool
- `neurowall/` -- Neural firewall implementation (zero-trust at I0 boundary)
- `neurosim/` -- Neural simulation environment

## Conventions
- All tools follow defensive framing only (see AI-instructions.md Principle 5)
- Exploit code / PoC stays in `qinnovates/private/` (local only), never in public repos
- Security tools must fail to known-safe state on error
