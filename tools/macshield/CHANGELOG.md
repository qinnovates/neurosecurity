# Changelog

## [0.1.0-alpha] - 2026-02-20

Initial alpha release.

### Added
- Network-aware auto-hardening via LaunchAgent (WatchPaths on WiFi config changes)
- Stealth mode toggle (ICMP + port scan blocking)
- Hostname randomization (generic model name on untrusted networks, personal hostname restored on trusted)
- NetBIOS daemon control (disable on untrusted, enable on trusted)
- Trusted network storage as HMAC-SHA256 hashes in macOS Keychain (zero plaintext SSIDs on disk)
- Machine-bound salt using IOPlatformUUID
- Optional Cloudflare DNS (1.1.1.1) configuration during install
- Timed relax mode (`macshield relax --for 2h`)
- Interactive installer with explicit consent at every step
- Clean uninstaller
- Sudoers fragment with minimal command surface (8 commands)
- State tracking to avoid redundant sudo calls
- Lock file to prevent concurrent execution
- **SSID + BSSID Fingerprinting**: Hardened network identification to prevent Evil Twin attacks.
- **Block All Mode**: Strictest firewall settings for public spaces.
- **Neuroethics & Identity Mission**: Documentary reframing of identity as a private human asset.
- **Consolidation**: Moved into the `qinnovate` monorepo as part of the `tools/` initiative.
