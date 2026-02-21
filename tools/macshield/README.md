# macshield

> [!CAUTION]
> **ALPHA RELEASE**: This project is in its early stages. **Run at your own risk.** It modifies system-level network and firewall settings. Always ensure you have a backup of your data.

## What macshield Is

macshield is a **basic local security hardening tool** for macOS. It automatically protects your Mac when you connect to public WiFi (cafes, airports, hotels) by doing three things:

1. **Changes your hostname** to a generic device name (e.g., "MacBook Pro") so your real name isn’t broadcast to everyone on the network
2. **Enables macOS stealth mode** to silently drop ICMP pings, ARP probes, and port scans from other devices on the network
3. **Disables NetBIOS** to stop broadcasting your device name on ports 137/138

When you return to a network you’ve marked as trusted (home, office), macshield automatically restores your personal hostname and relaxes these protections so features like AirDrop and Spotify Connect work normally.

This is **basic security hygiene**, not advanced threat protection. It covers the low-hanging fruit that macOS leaves exposed by default on public networks.

## Why This Exists

**Security should not require a subscription.** Reputable VPNs cost $50-100/year. Many people, especially students, families, and anyone on a tight budget, cannot afford that. This aligns with the principle of **cognitive liberty and digital self-determination**: everyone deserves baseline protection for their devices, regardless of income.

The alternative most people reach for, free VPNs, is often worse than no VPN at all:

- A UC Berkeley/CSIRO study of ~300 free VPN apps found **84% leaked user traffic**, **38% contained malware**, and **18% used no encryption at all** ([ICSI Berkeley, 2016](https://www.icir.org/vern/papers/vpn-apps-imc16.pdf))
- **80% of free VPNs have tracking libraries** that sell user data to third parties ([BitLaunch analysis](https://bitlaunch.io/blog/are-free-vpns-safe/))
- Hola VPN was caught reselling user bandwidth as commercial exit nodes through Luminati (now Bright Data), confirmed by its own founder ([Fortune, 2015](https://fortune.com/2015/05/29/hola-luminati-vpn/))
- SuperVPN leaked **360 million user records** including emails, original IPs, and browsing history ([TechRadar, 2023](https://www.techradar.com/pro/vpn/is-your-vpn-collecting-your-data))

More importantly, **even a good VPN does not protect against the attacks macshield blocks.** VPN encryption operates at Layer 3 and above. The following threats happen at Layer 2 (the local network), below the VPN tunnel:

- **ARP spoofing** (man-in-the-middle on the local subnet)
- **mDNS hostname discovery** (your real name broadcast via Bonjour)
- **NetBIOS enumeration** (device name advertised on ports 137/138)
- **ICMP ping sweeps and port scans** (network reconnaissance)

A VPN encrypts your traffic after it leaves your machine. macshield hardens the machine itself. They solve different problems.

### Who macshield Is For

macshield is for **individuals, students, and independent researchers** who are curious about BCI research and want baseline device hardening but may not have the financial means for a reputable paid VPN. It covers the Layer 2 protections that even a VPN cannot provide.

### Who macshield Is NOT For

If you are a **researcher, clinician, or engineer working with PII, neural recordings, or sensitive data** in an enterprise or institutional setting, you must use your organization’s corporate VPN, managed devices, and enterprise security policies. macshield is not a substitute for enterprise security infrastructure. Adhere to your corporate device and security policies at all times.

**Qinnovates is not liable for any security compromises resulting from the use of macshield in lieu of proper enterprise or institutional security controls.**

### What macshield Is NOT

- **Not a VPN replacement.** macshield does not encrypt your internet traffic. For full traffic encryption, use a reputable paid VPN (Mullvad, ProtonVPN, etc.).
- **Not advanced security.** This is baseline hardening. It stops passive reconnaissance and casual snooping, not targeted attacks or nation-state adversaries.
- **Not a silver bullet.** It’s one layer in a defense-in-depth approach. Combine it with macOS Private WiFi Address (MAC randomization), HTTPS, and a VPN if your threat model requires it.

### Zero Telemetry

All data stays on your device. macshield makes zero network calls. No analytics, no update checks, no phoning home. Trusted network fingerprints are stored as HMAC hashes in your macOS Keychain (encrypted at rest). Logs go to `/tmp/` and are cleared on every reboot. Nothing is written to disk permanently.

### A Note on Jurisdictional Privacy (14-Eyes)
When choosing a VPN, users often overlook the jurisdiction in which the provider operates. The **5, 9, and 14-Eyes** agreements are intelligence-sharing alliances between countries (including the US, UK, Canada, Australia, and many EU nations). If a VPN provider is based in one of these countries, they can be legally compelled to log or hand over user data, often under "gag orders."

macshield sidesteps this entirely by keeping everything local. No provider, no jurisdiction, no data to compel. It’s a "trust minimal" approach to public computing.

## What Changes on Your Machine

| | Untrusted Network | Trusted Network |
|---|---|---|
| **Firewall stealth mode** | ON (silently drops ICMP pings, ARP probes, port scans) | OFF (AirDrop, Spotify Connect work normally) |
| **Hostname** | Generic model name (e.g., "MacBook-Pro") | Your personal hostname restored from Keychain |
| **NetBIOS** | Disabled (ports 137/138 closed, no name broadcast) | Re-enabled |

Transitions happen automatically when you switch WiFi networks. No manual intervention needed after initial setup.

## Quick Start

```bash
git clone https://github.com/qinnovates/macshield.git
cd macshield
chmod +x macshield.sh install.sh uninstall.sh
./install.sh
```

The installer walks through every step with explicit yes/no consent. Nothing is installed silently.

After installation:

```bash
macshield trust            # Add current WiFi to trusted list
macshield --check          # See current status
```

## How It Works

```
WiFi network changes
        |
        v
LaunchAgent fires (WatchPaths on system WiFi config)
        |
        v
macshield --trigger
        |
        v
Read current SSID
        |
        v
Compute HMAC-SHA256(hardware_uuid, ssid)
        |
        v
Check Keychain for matching hash
        |
    +---+---+
    |       |
  match   no match
    |       |
    v       v
  RELAX   HARDEN
```

### Trusted Network Storage

When you run `macshield trust`, the tool computes `HMAC-SHA256(IOPlatformUUID, current_ssid)` and stores the hash in macOS Keychain under service `com.macshield.trusted`.

On network change, the tool computes the same HMAC for the current SSID and checks Keychain for a match.

**Why HMAC instead of plaintext?**
- If your Keychain is extracted, attacker sees hex hashes, not SSID names
- The hardware UUID salt makes hashes machine-bound (can't be precomputed)
- macOS already stores SSIDs in plaintext in system plists, so macshield adds zero new exposure

**Why not BSSID?**
- BSSIDs can be mapped to GPS coordinates via WiGLE, which is worse for location privacy

## Commands

```
macshield --check          Show current status (no changes made)
macshield --status         Alias for --check
macshield trust            Add current WiFi as trusted
macshield untrust          Remove current WiFi from trusted
macshield harden           Manually apply hardened settings
macshield relax            Manually relax protections
macshield relax --for 2h   Temporarily relax (auto-hardens after duration)
macshield --install        Run installer
macshield --uninstall      Run uninstaller
macshield --version        Print version
macshield --help           Print help
```

## Verbose Output

Every action is printed with explanation. Example on untrusted network:

```
[macshield] Network change detected
[macshield] Current network: [connected]
[macshield] Computing network fingerprint...
[macshield] Checking trusted networks in Keychain...
[macshield] Result: UNTRUSTED network
[macshield]
[macshield] Applying protections:
[macshield]   [1/3] Enabling stealth mode (blocks ICMP pings and port scans)
[macshield]         Running: sudo socketfilterfw --setstealthmode on
[macshield]         Done.
[macshield]   [2/3] Setting hostname to generic "MacBook Pro" (hides identity on local network)
[macshield]         Running: sudo scutil --set ComputerName "MacBook Pro"
[macshield]         Running: sudo scutil --set LocalHostName "MacBook-Pro"
[macshield]         Running: sudo scutil --set HostName "MacBook-Pro"
[macshield]         Done.
[macshield]   [3/3] Disabling NetBIOS (closes ports 137/138, stops name broadcast)
[macshield]         Running: sudo launchctl bootout system/com.apple.netbiosd
[macshield]         Done.
[macshield]
[macshield] All protections active. Your Mac is hardened.
```

## Cloudflare DNS (Optional)

The installer offers to configure Cloudflare DNS (1.1.1.1 / 1.0.0.1) on all network interfaces. This encrypts your DNS queries so network operators can't see which domains you look up.

**What it does:** Sets DNS servers to Cloudflare's 1.1.1.1 and 1.0.0.1.

**What it does NOT do:** This is not a VPN. DNS encryption prevents snooping on domain lookups, but your ISP or network operator can still see the IP addresses you connect to. For full traffic encryption, use a proper VPN (Mullvad, ProtonVPN, etc.).

To verify after installation:
```bash
networksetup -getdnsservers Wi-Fi
```

To revert to automatic DNS:
```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

## macshield Does Not Replace a VPN

macshield hardens your machine at the local network level (Layer 2). A VPN encrypts your internet traffic (Layer 3+). They protect against different things and work best together.

**macshield covers:** hostname broadcasting, stealth mode (ICMP/ARP/port scan blocking), NetBIOS enumeration. These happen on the local network, below the VPN tunnel. A VPN cannot block them.

**A VPN covers:** traffic encryption, IP address masking, protection from ISP snooping, bypassing geo-restrictions. macshield does none of this.

If you can afford a reputable VPN, use one alongside macshield. If you can't, macshield still gives you meaningful protection against the most common public WiFi threats (passive reconnaissance, hostname leaks, network scanning).

### Choosing a VPN Provider

Not all VPNs are equal. Jurisdiction matters because intelligence-sharing agreements (5/9/14-Eyes) can compel providers to log or hand over user data. A provider outside these alliances, with independent no-log audits, offers the strongest legal privacy guarantees.

| Provider | Jurisdiction | 14-Eyes | No-Log Audits | Free Tier | Notes |
|---|---|---|---|---|---|
| **NordVPN** | Panama | Outside | 6 audits (latest Dec 2025, Deloitte, ISAE 3000) | No | Merged with Surfshark under Cyberspace BV (Netherlands holding company). VPN operations remain under Panama jurisdiction. |
| **ProtonVPN** | Switzerland | Outside | Yes (Securitum) | Yes (limited) | Strong constitutional privacy protections. Free tier is legitimate but restricted to 3 countries. |
| **Mullvad** | Sweden | Inside (14-Eyes) | Yes (Assured AB) | No | Swedish law does not compel VPN logging. Police served a warrant in 2023 and left empty-handed. Account-free, pay with cash or crypto. |
| **Cloudflare WARP** | USA | Inside (5-Eyes) | Privacy audited (not full no-log) | Yes (free) | WireGuard-based. Not a traditional VPN (optimizes routing, not full tunnel by default). Free and easy to set up. |

**Avoid free VPNs from unknown providers.** A UC Berkeley study found 84% leak traffic and 38% contain malware. If cost is the barrier, ProtonVPN's free tier or Cloudflare WARP are reputable no-cost options.

### Setting Up a VPN on macOS

Most reputable VPN providers offer a macOS app that handles everything. For manual setup:

**Using a provider's app (easiest):**
1. Download the app from the provider's website (not the App Store, which restricts VPN capabilities)
2. Sign in and connect. Most apps auto-select the fastest server.
3. Enable the kill switch (disconnects internet if VPN drops) in the app's settings.

**Manual OpenVPN setup (advanced):**
1. Install Tunnelblick (free, open-source OpenVPN client for macOS):
   ```bash
   brew install --cask tunnelblick
   ```
2. Download your provider's `.ovpn` config files from their website
3. Double-click the `.ovpn` file to import it into Tunnelblick
4. Connect from the Tunnelblick menu bar icon

**Manual WireGuard setup (advanced):**
1. Install the WireGuard macOS app from the [App Store](https://apps.apple.com/us/app/wireguard/id1451685025) or:
   ```bash
   brew install --cask wireguard-tools
   ```
2. Download your provider's WireGuard config file
3. Import the config in the WireGuard app
4. Activate the tunnel

**Verifying your VPN is working:**
- Check your public IP: `curl -s ifconfig.me` (should show the VPN server's IP, not yours)
- Check for DNS leaks: visit [dnsleaktest.com](https://dnsleaktest.com) and run the extended test
- Check for WebRTC leaks: visit [browserleaks.com/webrtc](https://browserleaks.com/webrtc)

### Recommended Stack for Public WiFi

For the strongest free setup on public WiFi, combine:

1. **macshield** (Layer 2 hardening, free, open-source)
2. **macOS Private WiFi Address** (MAC randomization, built into macOS, Settings > Wi-Fi > network details)
3. **Cloudflare WARP** or **ProtonVPN free tier** (traffic encryption, free)

This covers hostname hiding, stealth mode, MAC randomization, and encrypted traffic at zero cost.

## Sudoers Fragment

macshield needs passwordless sudo for its LaunchAgent (which runs non-interactively). The installer creates `/etc/sudoers.d/macshield` with exactly these commands:

```
Cmnd_Alias MACSHIELD_CMDS = \
    /usr/libexec/ApplicationFirewall/socketfilterfw --setstealthmode on, \
    /usr/libexec/ApplicationFirewall/socketfilterfw --setstealthmode off, \
    /usr/sbin/scutil --set ComputerName *, \
    /usr/sbin/scutil --set LocalHostName *, \
    /usr/sbin/scutil --set HostName *, \
    /bin/launchctl bootout system/com.apple.netbiosd, \
    /bin/launchctl enable system/com.apple.netbiosd, \
    /bin/launchctl kickstart system/com.apple.netbiosd

%admin ALL=(root) NOPASSWD: MACSHIELD_CMDS
```

The file is validated with `visudo -c` before installation. It grants access to 8 specific commands only.

## Network Change Detection

macshield uses a LaunchAgent with `WatchPaths` on:
- `/Library/Preferences/SystemConfiguration/com.apple.airport.preferences.plist`
- `/Library/Preferences/SystemConfiguration/preferences.plist`

These files change whenever WiFi connects, disconnects, or switches networks. The LaunchAgent fires `macshield --trigger`, which reads the current SSID and applies the appropriate profile.

- `RunAtLoad: true` ensures protections apply on login
- `ThrottleInterval: 5` prevents rapid re-triggering
- An atomic lock directory (`mkdir`) prevents concurrent execution
- A 2-second settle delay ensures the network state is final before reading SSID
- State tracking in `/tmp/macshield.state` avoids redundant sudo calls

## Threat Model

macshield provides **basic security hardening**. It is effective against casual and opportunistic threats on public networks, not advanced persistent threats.

**Protects against:**
- Passive attackers on local WiFi who scan for hostnames (targeted attacks start with reconnaissance)
- Network operators logging your device name
- Drive-by port scanning and ping sweeps on untrusted networks
- NetBIOS name enumeration
- The Layer 2 exposure that VPNs do not cover

**Does NOT protect against:**
- Traffic content analysis (use a VPN)
- MAC address tracking (use macOS's built-in Private WiFi Address)
- Root-level compromise of your Mac
- Physical access attacks
- Nation-state adversaries
- Active man-in-the-middle attacks (use a VPN + HTTPS)

## Security Model

- **Pure bash + Rust.** The main script is auditable bash. The only compiled component is `pq-signer`, a small Rust binary for post-quantum signatures (source included, auditable).
- **No network calls.** macshield never phones home, checks for updates, or sends telemetry.
- **No config files.** Trusted networks stored as signed hashes in a root-only directory.
- **Keychain encryption.** Personal hostname protected by Secure Enclave (Apple Silicon) or FileVault (Intel).
- **Ephemeral logs.** Stdout logs go to `/tmp/` (cleared on reboot). Logs never contain SSIDs.
- **Minimal sudo.** Only 8 specific commands, validated by `visudo -c`.
- **Post-quantum signatures.** Trust store integrity verified with ML-DSA (see below).

## Post-Quantum Cryptography

macshield uses **NIST-standardized post-quantum cryptography** to protect its trust store from tampering.

### Why Post-Quantum?

When you mark a network as trusted, macshield stores a fingerprint (HMAC-SHA256 of the SSID + BSSID). If an attacker or malicious app modifies that trust store, macshield could be tricked into relaxing protections on an untrusted network. Standard HMAC alone can't detect this kind of tampering.

macshield signs every trust store entry with **ML-DSA (CRYSTALS-Dilithium)**, a lattice-based digital signature algorithm standardized by NIST in FIPS 204 (August 2024). ML-DSA is resistant to attacks from both classical and quantum computers.

### How It Works

```
macshield trust
      |
      v
Compute HMAC-SHA256(SSID + BSSID)
      |
      v
Sign the hash with ML-DSA private key (pq-signer)
      |
      v
Store: { hash, signature } in /Library/Application Support/macshield/trust.db
      |
      v
On network change: verify signature before trusting
```

1. **Key generation:** On first run, `pq-signer keygen` creates an ML-DSA-65 (Dilithium3) keypair. The private key is stored in a root-only directory (`/Library/Application Support/macshield/keys/`).
2. **Signing:** When you run `macshield trust`, the network fingerprint is signed with your private key. The signature is stored alongside the hash.
3. **Verification:** On every network change, macshield verifies the signature before trusting a network. If the signature is invalid (trust store was tampered with), the network is treated as untrusted.

### The pq-signer Binary

`pq-signer` is a small Rust CLI tool located in `pq-signer/`. It wraps the `pqcrypto-dilithium` crate (CRYSTALS-Dilithium reference implementation).

```
pq-signer keygen                          # Generate ML-DSA keypair
pq-signer sign --key <SK> --data <DATA>   # Sign data
pq-signer verify --key <PK> --data <DATA> --sig <SIG>  # Verify signature
```

To build from source:
```bash
cd pq-signer
cargo build --release
# Binary at target/release/pq-signer
```

### Why This Matters

Most local security tools use HMAC or SHA-256 hashes for integrity. These are sufficient against classical attacks but provide no protection against:
- A compromised process with write access to the trust store
- Future quantum computers that could forge HMAC keys

ML-DSA signatures ensure that only the holder of the private key (root on your machine) can add or modify trusted networks. Even if the trust database file is readable, it cannot be forged without the private key.

**macshield is one of the first consumer security tools to use NIST post-quantum cryptography for local trust verification.**

## Comparison

| Feature | macshield | Little Snitch | Intego NetBarrier | LuLu | ALBATOR |
|---|---|---|---|---|---|
| Network-aware auto-switching | Yes | Yes | Yes | No | No |
| Open source | Yes | No | No | Yes | Yes |
| Hostname randomization | Yes | No | No | No | Some |
| Stealth mode toggle | Yes | Yes | Yes | No | Yes |
| NetBIOS control | Yes | No | No | No | No |
| Post-quantum trust signatures | Yes (ML-DSA) | No | No | No | No |
| Zero config files on disk | Yes | No | No | No | No |
| Price | Free | $49 | $50/yr | Free | Free |
| Pure bash / auditable | Yes | No | No | No | Partial |

## Uninstall

```bash
macshield --uninstall
# or
./uninstall.sh
```

Removes: binary, sudoers fragment, LaunchAgent, Keychain entries, state files. Your hostname and firewall settings remain as currently set.

## Requirements

- macOS 12+ (Monterey or later)
- Admin account (for sudoers installation)
- FileVault recommended (encrypts Keychain at rest)

## License

Apache 2.0. See [LICENSE](LICENSE).

## Contributing

Issues and pull requests welcome at [github.com/qinnovates/macshield](https://github.com/qinnovates/macshield).
