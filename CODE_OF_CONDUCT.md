# Code of Conduct

## Preamble

The brain is the seat of identity. Before it is a research subject, before it is an attack surface, before it is an engineering problem — it is a person. Every standard published by this organization, every threat model, every equation exists because someone's cognitive autonomy deserves protection.

This Code of Conduct reflects that reality. We build security standards for the most intimate technology humanity has ever created. The way we treat each other in this community must be worthy of the thing we are trying to protect.

## Equal Standing

Every person who engages with this project — whether contributing code, opening an issue, asking a question, or reading the documentation — holds equal standing in this community.

We do not discriminate on the basis of age, body size, disability, ethnicity, sex characteristics, gender identity or expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, sexual identity or orientation, neurodivergence, cognitive ability, or any other dimension of human difference.

Neurotechnology will not affect all people equally. Historically marginalized communities face disproportionate risk from surveillance technologies, from unequal access to protective standards, and from exclusion in the design process. We recognize this. Equal standing in our community means actively working to ensure that the standards we develop serve everyone — not just those with the resources to participate in their creation.

## Principles

### Cognitive Liberty

Every individual possesses the right to mental self-determination. This principle governs both our framework and our community: no contributor should feel coerced in their participation, pressured to adopt a position, or penalized for independent thought. In our research, we do not develop, promote, or endorse tools designed to override cognitive autonomy without informed consent.

### Mental Privacy

Neural data is not ordinary data. It is the substrate of thought itself. We treat it as a special category requiring the highest protection — and we extend the same principle to our contributors. Private information, whether physical, electronic, or neural, is never disclosed without explicit permission. We do not build toward surveillance of mental states.

### Mental Integrity

The right to protection from unauthorized alteration of neural function is foundational. In our community, this translates to intellectual honesty: we do not misrepresent findings, manipulate data, or present unverified hypotheses as established fact. Research into attack vectors is conducted solely for defensive purposes, documented transparently, and subject to responsible disclosure.

### Psychological Continuity

The right to maintain one's personal identity — memory, personality, sense of self — deserves protection in both technology and community. We create space for contributors to grow and change their views without being defined by past positions. We do not develop capabilities intended to alter identity without clinical justification and informed consent.

### Cognitive Authenticity

The right to know which thoughts are genuinely one's own. Our coherence metrics exist to protect this right. In community, it means proper attribution, honest disclosure of AI assistance, and never claiming another's work or ideas as your own.

These five principles are recognized in international neuroethics scholarship (Ienca & Andorno, 2017; Yuste et al., 2017) and codified in the [UNESCO Recommendation on the Ethics of Neurotechnology (2025)](governance/UNESCO_ALIGNMENT.md). They are not aspirational for this project. They are operational.

## Conduct

### What We Expect

- Treat every contributor as an intellectual equal, regardless of their background or credentials
- Engage with ideas on their merits — critique arguments, not people
- Cite sources and acknowledge uncertainty honestly
- Welcome newcomers and help them orient to the project
- Respect cognitive diversity — different minds approach problems differently, and that makes the work stronger
- Maintain the boundary between security research and harmful application

### What We Will Not Tolerate

- Harassment, intimidation, or discrimination of any kind
- Sexualized language, imagery, or unwelcome advances
- Personal attacks, insults, or deliberately inflammatory commentary
- Disclosure of private information without explicit consent
- Weaponization of framework knowledge — using QIF threat models, attack surface documentation, or security research to target real BCI users or systems
- Misrepresentation of research — presenting hypotheses as validated findings, fabricating results, or omitting uncertainty from claims

## Dual-Use Responsibility

This framework documents how brain-computer interfaces can be attacked. That knowledge exists so they can be defended. Every contributor shares responsibility for maintaining this boundary.

When contributing threat research or attack analysis:

1. Document the defense alongside the threat. A vulnerability without a mitigation path is incomplete work.
2. Follow responsible disclosure for real devices. Report vulnerabilities to manufacturers before public discussion. See [SECURITY.md](SECURITY.md).
3. Label confidence levels honestly. Use the project's uncertainty tags — Verified, Inferred, Unverified, Hypothesis — so readers know what is established and what is not.
4. Consider who benefits. If a contribution disproportionately advantages attackers over defenders, it needs revision or discussion with maintainers before merging.

## AI Transparency

This project uses artificial intelligence in research and development. The same standards of honesty we apply to human contributions apply to AI-assisted work:

- Disclose AI involvement using `Co-Authored-By` tags in commits
- Never present AI-generated content as independently verified without human validation
- Document the human-AI decision boundary in significant contributions via the project's [Transparency](governance/TRANSPARENCY.md) audit trail
- Apply the same verification rigor to AI-generated claims as to any other source

## Enforcement

Report violations to the maintainer via [GitHub Security Advisories](https://github.com/qinnovates/qinnovate/security/advisories/new) or the contact methods in [ABOUT.md](ABOUT.md). All reports will be investigated promptly, fairly, and confidentially.

Maintainers may remove, edit, or reject contributions that violate this Code, and may temporarily or permanently restrict participation by individuals who engage in harmful conduct. For contributions touching neuroethics-sensitive areas, maintainers will consult the project's [governance documents](governance/) before making decisions.

## Scope

This Code applies in all project spaces — issues, pull requests, discussions, documentation, and any public context where an individual represents the project. We encourage anyone who forks or builds upon the QIF framework to adopt equivalent ethical commitments.

## Attribution

Adapted from the [Contributor Covenant v1.4](https://www.contributor-covenant.org/version/1/4/code-of-conduct.html), with neuroethics principles grounded in:

- Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5.
- Yuste, R., Goering, S., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159-163.
- UNESCO. (2025). *Recommendation on the Ethics of Neurotechnology*.
- Lázaro-Muñoz, G., et al. (2020). Researcher Perspectives on Ethical Considerations in Adaptive Deep Brain Stimulation Trials. *Frontiers in Human Neuroscience*, 14, 578695.

---

*Version 1.0 — Last Updated: 2026-02-10*
