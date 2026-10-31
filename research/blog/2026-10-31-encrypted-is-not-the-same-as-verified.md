---
title: "Encrypted Is Not the Same as Verified"
subtitle: "Secure LSL protects the wire. It doesn't say which device sent the data, or whether the file changed after capture."
date_posted: "2026-10-31"
status: "published"
sources:
  - "https://eeglab.org/secureLSL/getting-started/quickstart/"
  - "https://eeglab.org/secureLSL/getting-started/configuration/"
  - "https://eeglab.org/secureLSL/security/how-it-works/"
  - "https://eeglab.org/secureLSL/security/security-model/"
  - "https://github.com/sccn/liblsl/issues/262"
tags: ["#Neurosecurity", "#BCI", "#LSL", "#EEG", "#Provenance"]
author: "Qinnovate"
fact_checked: true
---

**TL;DR:** Secure LSL encrypts and authenticates each stream when the secure build is actually loaded. It does not cover recorded files, and it does not say which authorized device sent a given packet. A signing layer at the device would close both gaps. That layer is a proposal, not a shipped feature.

The previous post covered the config traps: the library fallback, the config search path, and who can edit it. This one covers what the stream still can't tell you.

## What Secure LSL protects

Each packet is encrypted with ChaCha20-Poly1305 under a session key negotiated fresh for each connection. Each packet carries an increasing nonce, and the receiver rejects any packet that isn't newer than the last. The docs say the design targets eavesdropping, tampering, replay, and unauthorized devices.

## What it doesn't cover

The security model is direct about three gaps:

- **Recorded files are out of scope.** XDF data at rest is listed as out of scope, with disk encryption as the suggested control.
- **Stream names are not protected.** They stay visible so devices can discover each other.
- **Physical access, endpoint compromise, and denial of service are out of scope.**

The first gap matters most for research. Encryption on the wire protects a recording in transit. It does not show that the file is unchanged after capture.

## The shared key problem

All authorized devices share one Ed25519 keypair. A valid signature shows that some authorized device sent the data, not which one. In a lab with several amplifiers, any device holding the shared key can produce traffic that looks like it came from any other.

## What I'd propose

Keep a separate key on each device, held in hardware, and sign at the source. Verify before analysis.

| Layer | What is signed | Where the key lives | What it would show |
|---|---|---|---|
| Stream chunks | Each amplifier's own data | Secure element on the amplifier | Which device produced the data |
| Stored file | Merkle root over one-second blocks, plus channel map, sample rate, reference, impedances, and firmware hash | Hardware key on the capture host | The file is unchanged since capture |
| Session | Start time from a trusted source, plus device attestation | The device | When and on which hardware it was recorded |

This is a proposal. I haven't built or validated it, and the Secure LSL docs don't describe anything like it.

## Limits

A valid signature doesn't prove the signal is physiological. A compromised device can sign fabricated data, so plausibility checks still have to run on top. A signature also verifies nothing unless the verification key is pinned. A key fetched from the same host as the data proves nothing.

## Context

The maintainers have said base liblsl was built for closed lab networks, and Secure LSL is their answer for wider deployments. That is a fair position, and the stream protections are worth using. The remaining gaps are at the device and at the file, and the protocol does not reach either one.

Setup and config checks are in the [previous post](./2026-10-26-securing-your-neural-data-takes-more-than-installing-securelsl.md).

---
*Written with AI assistance (Claude). Claims checked against the Secure LSL docs. The signing proposal is unvalidated. Cited URLs resolved at publication.*
