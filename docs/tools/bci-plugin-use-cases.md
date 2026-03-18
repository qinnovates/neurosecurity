# Who This Is For

## Neurotech startup shipping a consumer EEG headband

You're building on BrainFlow and BLE. You don't have a dedicated security team. Run `/bci-scan .` on your codebase — it flags unencrypted Bluetooth streams, PII leaking through EDF headers, and transport gaps you didn't know were there. Generate a threat model filtered to your device class. Export it for your FDA premarket cybersecurity submission. What used to take a consultant and three weeks takes you an afternoon.

## Medical device security team assessing an implanted BCI

You already know how to threat model. Now you need the threat catalog. 161 techniques mapped across biological domains — signal injection at the electrode-tissue interface, firmware manipulation, cognitive side-channel attacks. Score each with NISS to prioritize remediation by neural impact, not just CVSS base score. Your existing workflow, extended to a surface area nobody else has mapped.

## Researcher writing a BCI security paper

The threat taxonomy is structured, sourced, and queryable. Look up techniques by domain, severity, or evidence tier. Run the neuromodesty checker on your draft before submission — it catches overclaims that reviewers will flag anyway. Better to find them yourself.

## Security engineer who's never touched neurotechnology

You know CVSS. You know ATT&CK. NISS and TARA are the BCI equivalents — same logic, different layer of the stack. Start with `/bci-scan --demo` to see a threat report in 30 seconds. Run `/bci learn quickstart` for a 5-minute overview. The glossary handles the rest. You're not starting over. You're extending what you already know.

## Student exploring neurosecurity as a career

Install the plugin. Run the demo. Walk through the learning modules. The 161-technique catalog with evidence tiers and therapeutic analogs is a structured introduction to a field that barely has a name yet. Most people will discover neurosecurity in five years. You're here now.

## Pair programming with Claude on a BCI project

The plugin activates automatically when it detects BCI library imports — `pylsl`, `brainflow`, `mne`, `pyedflib`. Claude flags unsafe patterns as you code: unencrypted LSL streams, PII in neural data headers, hardcoded device credentials. No special commands. Security guidance embedded in your workflow, not bolted on after.

## Code review on a BCI pull request

Point Claude at a PR touching BCI code. The passive scanner catches transport security gaps, data storage issues, and missing consent metadata. Generate a `/bci report` to attach to the review — specific TARA technique references, NISS severity scores, and remediation guidance. The reviewer sees exactly what's wrong and why it matters.

## Regulatory prep for FDA submission

Use `/bci threat-model` to generate a structured threat assessment mapped to your device class. The output references IEC 14971 and FDA premarket cybersecurity guidance. Hand the Markdown to your regulatory consultant — they fill in the clinical gaps, you save hours of threat enumeration. The framework does the heavy lifting. The human makes the judgment calls.

## Teaching a neurosecurity course

Assign `/bci learn tara` and `/bci learn niss` as interactive coursework. Students explore 161 real threat techniques — they query, filter, and reason about threats hands-on. Each technique includes evidence tiers, therapeutic analogs, and severity scores. It's not a paper they skim. It's a tool they use.
