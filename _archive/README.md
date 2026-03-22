# Archive — How to Browse This Project's History

This folder contains references and guides for viewing the full evolution of this repository over time. Every decision, revision, correction, and deleted line is preserved in git.

---

## Quick Reference

### Browse the repo at any point in time

Go to [Commits](https://github.com/qinnovates/qinnovate/commits/main), click any commit, then **Browse files** to see the entire repo as it existed at that moment.

Direct URL pattern:
```
https://github.com/qinnovates/qinnovate/tree/<COMMIT_SHA>
```

### Get a permanent link to any file

Press **`Y`** on any file page in GitHub. The URL converts from a branch reference (which moves) to a commit SHA permalink (which never changes).

- Link to a specific line: append `#L42`
- Link to a line range: append `#L10-L20`
- View raw markdown (not rendered): append `?plain=1`

### Compare any two points in history

```
https://github.com/qinnovates/qinnovate/compare/<REF_1>...<REF_2>
```

Replace `<REF_1>` and `<REF_2>` with any combination of tags, branches, or commit SHAs. GitHub renders a full diff.

Examples:
```
# Compare two weekly snapshots
https://github.com/qinnovates/qinnovate/compare/site-W07-2026-02-16...site-W08-2026-02-23

# Compare a tag to current main
https://github.com/qinnovates/qinnovate/compare/site-archive-2026-03-05...main
```

### Download the repo at any tag

```
https://github.com/qinnovates/qinnovate/archive/refs/tags/<TAG_NAME>.zip
https://github.com/qinnovates/qinnovate/archive/refs/tags/<TAG_NAME>.tar.gz
```

Or clone and checkout locally:
```bash
git clone https://github.com/qinnovates/qinnovate.git
cd qinnovate
git checkout <TAG_NAME>
npm ci && npm run dev
```

---

## Visual History Tools

### githistory.xyz — Animated File Diffs

Replace `github.com` with `github.githistory.xyz` in any file URL to see an animated diff of every commit that touched that file.

```
https://github.githistory.xyz/qinnovates/qinnovate/blob/main/qif-framework/QIF-DERIVATION-LOG.md
https://github.githistory.xyz/qinnovates/qinnovate/blob/main/README.md
https://github.githistory.xyz/qinnovates/qinnovate/blob/main/shared/qtara-registrar.json
```

Available as browser extensions for [Chrome](https://chrome.google.com/webstore/detail/git-history-browser-exten/laghnmifffncfonaigccdgphgmdjbgmf) and [Firefox](https://addons.mozilla.org/firefox/addon/github-history/).

Open source: [pomber/git-history](https://github.com/pomber/git-history)

---

## Permanent Archive

### Software Heritage

This repository is permanently archived by [Software Heritage](https://www.softwareheritage.org/), a non-profit that preserves all public source code with ISO-standard identifiers (SWHID, ISO/IEC 18670).

**Browse the archive:**
```
https://archive.softwareheritage.org/browse/origin/https://github.com/qinnovates/qinnovate/
```

If this repository ever disappears from GitHub — deletion, account suspension, force push — the Software Heritage archive persists independently. Every commit, directory, and file receives a unique SWHID that can be cited in academic papers and will resolve permanently.

To trigger an immediate archive snapshot: [save.softwareheritage.org](https://save.softwareheritage.org/)

---

## Weekly Snapshots (Tagged Releases)

The project maintains weekly git tags for point-in-time browsing:

| Week | Date | Tag | Browse |
|------|------|-----|--------|
| W10 | Mar 5 | `site-archive-2026-03-05` | [Browse](https://github.com/qinnovates/qinnovate/tree/site-archive-2026-03-05) |
| W09 | Mar 2 | `site-W09-2026-03-02` | [Browse](https://github.com/qinnovates/qinnovate/tree/site-W09-2026-03-02) |
| W08 | Feb 23 | `site-W08-2026-02-23` | [Browse](https://github.com/qinnovates/qinnovate/tree/site-W08-2026-02-23) |
| W07 | Feb 16 | `site-W07-2026-02-16` | [Browse](https://github.com/qinnovates/qinnovate/tree/site-W07-2026-02-16) |
| W06 | Feb 9 | `site-W06-2026-02-09` | [Browse](https://github.com/qinnovates/qinnovate/tree/site-W06-2026-02-09) |
| W05 | Feb 2 | `site-W05-2026-02-02` | [Browse](https://github.com/qinnovates/qinnovate/tree/site-W05-2026-02-02) |

Full list: [All tags](https://github.com/qinnovates/qinnovate/tags)

---

## The Security Perspective — Same Tools, Different Intent

The same git history tools that enable transparency are the same tools security researchers use offensively. This is not a coincidence. It is the central insight of this entire project.

### Offensive use (bug bounty / secrets scanning)

Security researchers scan git history to find leaked credentials in commits that developers thought they deleted. Force-pushing a commit does not destroy it — the old SHA remains accessible via GitHub's API and is captured permanently by [GH Archive](https://www.gharchive.org/).

| Tool | What it does | Link |
|------|-------------|------|
| **TruffleHog** | Scans git history for 800+ secret types, validates credentials against live APIs | [trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog) |
| **Gitleaks** | Fast git history scanner with regex-based secret detection | [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) |
| **git-secrets** | Pre-commit hook that blocks known secret patterns before they enter history | [awslabs/git-secrets](https://github.com/awslabs/git-secrets) |
| **GitHub Secret Scanning** | Built into GitHub, free for public repos. Blocks pushes containing known token formats | [GitHub Docs](https://docs.github.com/en/code-security/secret-scanning) |
| **Force Push Scanner** | Finds "dangling commits" from force pushes via GH Archive + BigQuery | [trufflesecurity/force-push-scanner](https://github.com/trufflesecurity/force-push-scanner) |

In 2025, Truffle Security's Sharon Brizinov scanned all force-pushed "dangling commits" across GitHub using GH Archive and TruffleHog. The result: active AWS credentials, GitHub PATs, and database credentials at scale — approximately $25,000 in bug bounty payouts from commits developers believed were gone.

### Defensive use (what we do here)

We publish full history because transparency is the foundation of trust in security research. Every claim in this repo can be traced to the commit where it was introduced, the source that informed it, and the [derivation log entry](../qif-framework/QIF-DERIVATION-LOG.md) where the decision was made. If something was wrong, you can see when it was corrected and why.

### The connection to TARA

This dual-use pattern — same mechanism, different intent — runs through the entire project. TARA documents 109 BCI techniques where the attack mechanism and the therapeutic mechanism are physically identical. Signal injection is how you compromise a neural interface. It is also how you treat Parkinson's disease. The tool does not determine the use. The boundary is always **consent, oversight, and intent**.

Git history is the same. The mechanism that exposes secrets also enables accountability. The difference is whether you're using it to breach trust or to build it.

---

## Key Documents to Track

These are the files whose evolution tells the story of this project:

| File | What it captures |
|------|-----------------|
| [`qif-framework/QIF-DERIVATION-LOG.md`](../qif-framework/QIF-DERIVATION-LOG.md) | 113 entries of research decisions, hypotheses, and corrections |
| [`qif-framework/QIF-FIELD-JOURNAL.md`](../qif-framework/QIF-FIELD-JOURNAL.md) | First-person research observations |
| [`qif-framework/QIF-RESEARCH-SOURCES.md`](../qif-framework/QIF-RESEARCH-SOURCES.md) | 340+ verified sources — watch for additions and corrections |
| [`governance/TRANSPARENCY.md`](../governance/TRANSPARENCY.md) | Cross-AI validation sessions, audit trail |
| [`VALIDATION.md`](../VALIDATION.md) | What has been tested, what has not |
| [`shared/qtara-registrar.json`](../shared/qtara-registrar.json) | TARA technique registry — the core dataset |
| [`CHANGELOG.md`](../CHANGELOG.md) | Auto-generated from commit history |

Use githistory.xyz on any of these to see their evolution over time.
