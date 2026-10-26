---
title: "Securing Your Neural Data Means More Than Installing Secure LSL"
subtitle: "A shared static-key library is only as secure as the config most labs never check."
date_posted: "2026-10-26"
source: "https://eeglab.org/secureLSL/getting-started/quickstart/"
tags: ["#Neurosecurity", "#BCI", "#LSL", "#EEG", "#Neuroauthentication"]
author: "Kevin L. Qi"
fact_checked: true
---

**Note:** Starting with this post, new Qinnovate research notes publish on [Substack](https://qinnovate.substack.com) first. [Subscribe here](https://qinnovate.substack.com/subscribe) to get them as they go out. This site will keep mirroring posts to the research blog, but Medium is retired for new writing.

---

**TL;DR:** Installing Secure LSL does not automatically secure your EEG stream. If your application loads the regular `liblsl` instead of explicitly linking `liblsl-secure`, or your `lsl_api.cfg` doesn't have security enabled, your data streams in cleartext regardless of what you installed. Check the config, the binary your recorder actually loads, and who can read the four file paths Secure LSL checks.

Securing your neural data means more than installing Secure LSL.

I've noticed that many researchers are still unaware that Secure LSL exists and are using a legacy LSL library that's over a decade old.

Following a conversation I had with another user on r/BCI and r/neurosec, I want to share this for anyone currently looking to use BCIs for reading and recording their EEG. This matters more for labs and clinics working with patients, where safeguarding biometric data isn't optional.

Installing Secure LSL does **not** inherently mean your EEG stream is secure, without properly checking the configs, streams, and RBAC (depending on your use case and risk tolerance).

A recorder may continue to load the regular `liblsl` library instead of a Secure LSL-enabled build. Your application has to explicitly load or link against the secure binary (`liblsl-secure`), and your configuration file (`lsl_api.cfg`) has to have security enabled. If an app falls back to standard `liblsl`, you're effectively running without Secure LSL for that connection, and your stream goes out as plain data that anyone on the network can read.

Your brain, and by extension your EEG, is a biological fingerprint. Treat it like one. Think HIPAA. And if it's your own EEG, hardening your own system and configs matters just as much for your own privacy as it does in a lab setting.

This is especially relevant now, as more researchers pivot toward securing authentication beyond passwords and current biometric systems, through neuroauthentication research.

## Where Secure LSL looks for its config

Secure LSL checks a fixed set of local paths for `lsl_api.cfg`, in this order:

1. `$LSLAPICFG` (environment variable, if set)
2. `./lsl_api.cfg` (current working directory)
3. `~/.lsl_api/lsl_api.cfg` (user home directory)
4. `/etc/lsl_api/lsl_api.cfg` (system-wide, Linux/macOS)

Apply least privilege to all four. Whoever can write to any of those paths can disable or weaken your security config without touching the library itself.

Device authentication relies on a long-lived Ed25519 keypair shared across the devices in your lab or setup, distributed through a secure export/import process. Encryption itself uses fresh per-connection session keys, not that long-lived key directly. Either way, your security posture comes down to how well you protect the local host and manage file permissions around that shared device key, not just whether the secure library is installed.

**TL;DR:** to better safeguard your EEG, read the docs: [sccn/secureLSL quickstart](https://eeglab.org/secureLSL/getting-started/quickstart/).

---

Special thanks to the Reddit communities and users who helped raise this point.

Original thread: [r/neurosec](https://www.reddit.com/r/neurosec/s/1tro1uC3rH)

More on neurosecurity: [qinnovate.com](https://qinnovate.com)

---

*Written with AI assistance (Claude). All claims verified by the author. The Secure LSL configuration search order and library-substitution behavior described above were checked against the official quickstart and security-model docs during this session; the "shared static key" framing in the original draft was corrected to reflect Secure LSL's actual long-lived device key plus per-connection ephemeral session keys. Human-originated: the underlying observation, the Reddit conversations that prompted it, and the decision to publish.*
