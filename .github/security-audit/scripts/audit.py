#!/usr/bin/env python3
"""
Security Audit Pipeline - Main Audit Script

Scans files for secrets, credentials, PII, and other sensitive data.
Can be run standalone, as a pre-commit hook, or in CI/CD pipelines.

Usage:
    python audit.py [OPTIONS] [FILES...]

Options:
    --staged        Only scan staged files (for pre-commit)
    --all           Scan all tracked files
    --config PATH   Path to patterns config (default: patterns/secrets.json)
    --format FORMAT Output format: text, json, sarif (default: text)
    --severity LVL  Minimum severity: low, medium, high, critical (default: low)
    --fail-on LVL   Fail if findings >= severity: low, medium, high, critical
    --verbose       Show detailed output
    --quiet         Only show findings
"""

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional


@dataclass
class Finding:
    """Represents a security finding."""
    file: str
    line_number: int
    line_content: str
    pattern_name: str
    category: str
    severity: str
    matched_text: str

    def to_dict(self) -> dict:
        return {
            "file": self.file,
            "line_number": self.line_number,
            "line_content": self.line_content[:100] + "..." if len(self.line_content) > 100 else self.line_content,
            "pattern_name": self.pattern_name,
            "category": self.category,
            "severity": self.severity,
            "matched_text": self.redact(self.matched_text)
        }

    @staticmethod
    def redact(text: str, visible_chars: int = 4) -> str:
        """Redact sensitive text, showing only first few characters."""
        if len(text) <= visible_chars:
            return "*" * len(text)
        return text[:visible_chars] + "*" * (len(text) - visible_chars)


@dataclass
class AuditResult:
    """Results of a security audit."""
    findings: list[Finding] = field(default_factory=list)
    files_scanned: int = 0
    files_with_findings: set = field(default_factory=set)
    scan_time: float = 0.0

    @property
    def total_findings(self) -> int:
        return len(self.findings)

    def findings_by_severity(self, severity: str) -> list[Finding]:
        return [f for f in self.findings if f.severity == severity]

    def has_findings_at_or_above(self, min_severity: str) -> bool:
        severity_order = ["low", "medium", "high", "critical"]
        min_idx = severity_order.index(min_severity)
        return any(
            severity_order.index(f.severity) >= min_idx
            for f in self.findings
        )


class SecurityAuditor:
    """Main security audit engine."""

    SEVERITY_ORDER = ["low", "medium", "high", "critical"]
    SEVERITY_COLORS = {
        "critical": "\033[91m",  # Red
        "high": "\033[93m",      # Yellow
        "medium": "\033[94m",    # Blue
        "low": "\033[90m",       # Gray
    }
    RESET_COLOR = "\033[0m"

    # Maximum file size to scan (1 MB). Larger files are likely generated
    # artifacts (e.g. self-contained HTML) where secrets won't appear.
    MAX_FILE_SIZE = 1_000_000

    # Maximum line length to scan. Lines longer than this are skipped since
    # regex matching on multi-megabyte lines can hang due to backtracking.
    MAX_LINE_LENGTH = 10_000

    def __init__(self, config_path: Optional[str] = None, min_severity: str = "low"):
        self.config = self._load_config(config_path)
        self.min_severity = min_severity
        self.compiled_patterns = self._compile_patterns()

    def _load_config(self, config_path: Optional[str]) -> dict:
        """Load patterns configuration."""
        if config_path is None:
            # Default to patterns/secrets.json relative to script
            script_dir = Path(__file__).parent.parent
            config_path = script_dir / "patterns" / "secrets.json"

        config_path = Path(config_path)
        if not config_path.exists():
            print(f"Warning: Config file not found: {config_path}", file=sys.stderr)
            return {"patterns": {}, "file_patterns": {}, "allowlist": {}}

        with open(config_path) as f:
            return json.load(f)

    def _compile_patterns(self) -> dict:
        """Pre-compile regex patterns for performance."""
        compiled = {}
        for category, patterns in self.config.get("patterns", {}).items():
            compiled[category] = []
            for p in patterns:
                try:
                    compiled[category].append({
                        "name": p["name"],
                        "regex": re.compile(p["pattern"]),
                        "severity": p.get("severity", "medium"),
                        "context_required": p.get("context_required", False)
                    })
                except re.error as e:
                    print(f"Warning: Invalid regex for {p['name']}: {e}", file=sys.stderr)
        return compiled

    def _is_allowlisted(self, file_path: str, match_text: str) -> bool:
        """Check if a file or match is allowlisted."""
        allowlist = self.config.get("allowlist", {})

        # Check file allowlist
        for pattern in allowlist.get("files", []):
            if "*" in pattern:
                # Simple glob matching
                regex = pattern.replace(".", r"\.").replace("*", ".*")
                if re.match(regex, file_path):
                    return True
            elif file_path.endswith(pattern) or file_path == pattern:
                return True

        # Check pattern allowlist
        for allowed in allowlist.get("patterns", []):
            if allowed.lower() in match_text.lower():
                return True

        return False

    def _is_sensitive_file(self, file_path: str) -> bool:
        """Check if file matches sensitive file patterns."""
        sensitive = self.config.get("file_patterns", {}).get("sensitive_files", [])
        file_name = os.path.basename(file_path)

        for pattern in sensitive:
            if "*" in pattern:
                regex = pattern.replace(".", r"\.").replace("*", ".*")
                if re.match(regex, file_name):
                    return True
            elif file_name == pattern:
                return True

        return False

    def _should_skip_file(self, file_path: str) -> bool:
        """Check if file should be skipped entirely."""
        # Skip binary files
        binary_extensions = {
            '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar',
            '.gz', '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.db',
            '.sqlite', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4',
            '.avi', '.mov', '.webm', '.pyc', '.pyo', '.class', '.o', '.a'
        }
        ext = os.path.splitext(file_path)[1].lower()
        if ext in binary_extensions:
            return True

        # Skip node_modules, .git, etc.
        # Note: 'security-audit' excluded to prevent false positives from pattern definitions
        skip_dirs = {'node_modules', '.git', '__pycache__', '.venv', 'venv', 'dist', 'build', 'security-audit'}
        parts = Path(file_path).parts
        if any(d in skip_dirs for d in parts):
            return True

        # Skip files larger than MAX_FILE_SIZE (likely generated artifacts)
        try:
            if os.path.getsize(file_path) > self.MAX_FILE_SIZE:
                return True
        except OSError:
            pass

        return False

    def scan_file(self, file_path: str) -> list[Finding]:
        """Scan a single file for security issues."""
        findings = []

        if self._should_skip_file(file_path):
            return findings

        # Check for sensitive file patterns
        if self._is_sensitive_file(file_path):
            findings.append(Finding(
                file=file_path,
                line_number=0,
                line_content="[Sensitive file type]",
                pattern_name="Sensitive File",
                category="file_patterns",
                severity="high",
                matched_text=os.path.basename(file_path)
            ))

        # Try to read file content
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
        except (IOError, OSError) as e:
            return findings

        # Scan each line
        for line_num, line in enumerate(lines, 1):
            # Skip extremely long lines — regex backtracking on multi-MB
            # minified/generated lines can hang the process.
            if len(line) > self.MAX_LINE_LENGTH:
                continue

            for category, patterns in self.compiled_patterns.items():
                for p in patterns:
                    # Check severity threshold
                    if self.SEVERITY_ORDER.index(p["severity"]) < self.SEVERITY_ORDER.index(self.min_severity):
                        continue

                    matches = p["regex"].finditer(line)
                    for match in matches:
                        matched_text = match.group(0)

                        # Skip if allowlisted
                        if self._is_allowlisted(file_path, matched_text):
                            continue

                        findings.append(Finding(
                            file=file_path,
                            line_number=line_num,
                            line_content=line.strip(),
                            pattern_name=p["name"],
                            category=category,
                            severity=p["severity"],
                            matched_text=matched_text
                        ))

        return findings

    def scan_files(self, files: list[str]) -> AuditResult:
        """Scan multiple files."""
        import time
        start_time = time.time()

        result = AuditResult()

        for file_path in files:
            if not os.path.isfile(file_path):
                continue

            result.files_scanned += 1
            findings = self.scan_file(file_path)

            if findings:
                result.findings.extend(findings)
                result.files_with_findings.add(file_path)

        result.scan_time = time.time() - start_time
        return result

    def format_output(self, result: AuditResult, format_type: str = "text", verbose: bool = False) -> str:
        """Format audit results."""
        if format_type == "json":
            return self._format_json(result)
        elif format_type == "sarif":
            return self._format_sarif(result)
        else:
            return self._format_text(result, verbose)

    def _format_text(self, result: AuditResult, verbose: bool = False) -> str:
        """Format results as human-readable text."""
        lines = []

        # Header
        lines.append("\n" + "=" * 60)
        lines.append("  SECURITY AUDIT REPORT")
        lines.append("=" * 60)
        lines.append(f"  Scanned: {result.files_scanned} files")
        lines.append(f"  Time: {result.scan_time:.2f}s")
        lines.append(f"  Findings: {result.total_findings}")
        lines.append("")

        if not result.findings:
            lines.append("  No security issues found.")
            lines.append("=" * 60 + "\n")
            return "\n".join(lines)

        # Summary by severity
        lines.append("  SUMMARY BY SEVERITY")
        lines.append("  " + "-" * 40)
        for severity in reversed(self.SEVERITY_ORDER):
            count = len(result.findings_by_severity(severity))
            if count > 0:
                color = self.SEVERITY_COLORS.get(severity, "")
                lines.append(f"  {color}{severity.upper():10}{self.RESET_COLOR}: {count}")
        lines.append("")

        # Detailed findings
        lines.append("  FINDINGS")
        lines.append("  " + "-" * 40)

        # Group by file
        findings_by_file = {}
        for f in result.findings:
            if f.file not in findings_by_file:
                findings_by_file[f.file] = []
            findings_by_file[f.file].append(f)

        for file_path, findings in findings_by_file.items():
            lines.append(f"\n  {file_path}")
            for f in findings:
                color = self.SEVERITY_COLORS.get(f.severity, "")
                lines.append(f"    {color}[{f.severity.upper()}]{self.RESET_COLOR} Line {f.line_number}: {f.pattern_name}")
                if verbose:
                    lines.append(f"      Category: {f.category}")
                    lines.append(f"      Match: {Finding.redact(f.matched_text)}")

        lines.append("\n" + "=" * 60 + "\n")
        return "\n".join(lines)

    def _format_json(self, result: AuditResult) -> str:
        """Format results as JSON."""
        output = {
            "summary": {
                "files_scanned": result.files_scanned,
                "total_findings": result.total_findings,
                "scan_time": result.scan_time,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "by_severity": {
                    severity: len(result.findings_by_severity(severity))
                    for severity in self.SEVERITY_ORDER
                }
            },
            "findings": [f.to_dict() for f in result.findings]
        }
        return json.dumps(output, indent=2)

    def _format_sarif(self, result: AuditResult) -> str:
        """Format results as SARIF (for GitHub Advanced Security)."""
        sarif = {
            "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
            "version": "2.1.0",
            "runs": [{
                "tool": {
                    "driver": {
                        "name": "Security Audit Pipeline",
                        "version": "1.0.0",
                        "informationUri": "https://github.com/qinnovates/qinnovate/security-audit-pipeline",
                        "rules": []
                    }
                },
                "results": []
            }]
        }

        # Build rules and results
        rules_seen = set()
        for f in result.findings:
            rule_id = f"{f.category}/{f.pattern_name}".replace(" ", "_").lower()

            if rule_id not in rules_seen:
                sarif["runs"][0]["tool"]["driver"]["rules"].append({
                    "id": rule_id,
                    "name": f.pattern_name,
                    "shortDescription": {"text": f.pattern_name},
                    "defaultConfiguration": {
                        "level": "error" if f.severity in ["critical", "high"] else "warning"
                    }
                })
                rules_seen.add(rule_id)

            sarif["runs"][0]["results"].append({
                "ruleId": rule_id,
                "level": "error" if f.severity in ["critical", "high"] else "warning",
                "message": {"text": f"Potential {f.pattern_name} detected"},
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": {"uri": f.file},
                        "region": {"startLine": f.line_number}
                    }
                }]
            })

        return json.dumps(sarif, indent=2)


def get_staged_files() -> list[str]:
    """Get list of staged files from git."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
            capture_output=True,
            text=True,
            check=True
        )
        return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
    except subprocess.CalledProcessError:
        return []


def get_all_tracked_files() -> list[str]:
    """Get list of all tracked files from git."""
    try:
        result = subprocess.run(
            ["git", "ls-files"],
            capture_output=True,
            text=True,
            check=True
        )
        return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
    except subprocess.CalledProcessError:
        return []


def main():
    parser = argparse.ArgumentParser(
        description="Security Audit Pipeline - Scan for secrets, credentials, and PII"
    )
    parser.add_argument("files", nargs="*", help="Files to scan")
    parser.add_argument("--staged", action="store_true", help="Scan staged files only")
    parser.add_argument("--all", action="store_true", help="Scan all tracked files")
    parser.add_argument("--config", help="Path to patterns config file")
    parser.add_argument("--format", choices=["text", "json", "sarif"], default="text", help="Output format")
    parser.add_argument("--severity", choices=["low", "medium", "high", "critical"], default="low", help="Minimum severity to report")
    parser.add_argument("--fail-on", choices=["low", "medium", "high", "critical"], help="Fail if findings >= severity")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--quiet", "-q", action="store_true", help="Quiet mode")

    args = parser.parse_args()

    # Determine files to scan
    if args.staged:
        files = get_staged_files()
    elif args.all:
        files = get_all_tracked_files()
    elif args.files:
        files = args.files
    else:
        # Default: scan staged files if in git repo, otherwise current directory
        files = get_staged_files()
        if not files:
            files = [str(p) for p in Path(".").rglob("*") if p.is_file()]

    if not files:
        if not args.quiet:
            print("No files to scan.")
        sys.exit(0)

    # Run audit
    auditor = SecurityAuditor(config_path=args.config, min_severity=args.severity)
    result = auditor.scan_files(files)

    # Output results
    output = auditor.format_output(result, format_type=args.format, verbose=args.verbose)
    print(output)

    # Determine exit code
    if args.fail_on:
        if result.has_findings_at_or_above(args.fail_on):
            sys.exit(1)
    elif result.total_findings > 0:
        # Default: fail on any high or critical finding
        if result.has_findings_at_or_above("high"):
            sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
