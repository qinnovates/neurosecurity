"""Classify what evidence each CONFIRMED technique actually rests on.

The registry does not define its status values, and whitepaper v9 Section 21.2
records that as an open item: "It does not define them, and none of them means
that an attack has been carried out on a person with a device."

So this does not grade the entries against a definition that does not exist.
It records, per technique, what kind of source the entry is standing on. That
is objective, and it is the input a written definition needs.

Evidence kinds:
  demonstrated_attack  a published attack demonstration against a real system
  mechanism            established physiology or biophysics; no attack shown
  analysis             position, survey or recommendations paper; no demonstration
  regulatory           a law, standard or roadmap; not evidence of an attack
  correlational        observational or journalistic work on population effects
"""

import json
from collections import Counter
from pathlib import Path

# Assigned by reading each entry's cited sources. The note says what the
# citations actually show, in the citations' own terms.
EVIDENCE = {
    "QIF-T0001": ("analysis", "Kohno 2009 is the foundational neurosecurity position paper; Bonaci 2015 demonstrates P300 probing, not signal injection into a device"),
    "QIF-T0003": ("analysis", "Kohno 2009 and Landau 2020 are analysis; Schroder 2025 is a risk analysis with recommendations"),
    "QIF-T0012": ("mechanism", "Frey 1962 and Lin 1978 establish the microwave auditory effect; neither targets a neural interface"),
    "QIF-T0042": ("analysis", "Bonaci 2015 and Schroder 2025; no BLE/RF side-channel demonstration against a BCI is cited"),
    "QIF-T0043": ("analysis", "Schroder 2025 alone, a risk analysis; no firmware backdoor demonstrated"),
    "QIF-T0044": ("analysis", "Schroder 2025 alone"),
    "QIF-T0045": ("regulatory", "Gidney 2025 is a quantum factoring resource estimate; harvest-now-decrypt-later is a threat model, not a demonstration"),
    "QIF-T0049": ("analysis", "Schroder 2025 alone"),
    "QIF-T0051": ("regulatory", "Landau 2020 analysis plus GDPR Article 9, which is a legal instrument rather than evidence"),
    "QIF-T0053": ("analysis", "Landau 2020 alone"),
    "QIF-T0057": ("analysis", "Schroder 2025 alone"),
    "QIF-T0065": ("correlational", "Haidt & Twenge, Bail 2018, Gonzalez and WSJ reporting on social media and mental health; population-level correlation, not an induced-psychosis demonstration"),
    "QIF-T0072": ("demonstrated_attack", "Guri 2017 SPEAKE(a)R and Guri 2018 MOSQUITO demonstrate speaker-to-microphone inversion on real hardware"),
    "QIF-T0082": ("demonstrated_attack", "Mavroudis 2017 PoPETS and Arp 2017 IEEE EuroS&P demonstrate ultrasonic cross-device tracking"),
    "QIF-T0083": ("demonstrated_attack", "Zhuang 2009, Compagno 2017 and Harrison & Matyunin 2023 demonstrate acoustic keystroke recovery"),
    "QIF-T0087": ("demonstrated_attack", "Cai & Chen 2011, Owusu 2012 and Miluzzo 2012 demonstrate accelerometer keystroke inference"),
    "QIF-T0088": ("demonstrated_attack", "Muaaz & Mayrhofer 2017 and Ngo 2014 demonstrate IMU gait identification"),
    "QIF-T0136": ("mechanism", "photobiomodulation efficacy studies; therapeutic provenance"),
    "QIF-T0140": ("mechanism", "Cayce 2011 and Pan 2023 establish infrared neural stimulation as a research and clinical method"),
    "QIF-T0142": ("mechanism", "Kujirai 1993 is the standard SICI paired-pulse neurophysiology protocol"),
    "QIF-T0143": ("mechanism", "Valls-Sole 1992 and McDonnell 2006 establish LICI as a measurement protocol"),
    "QIF-T0144": ("mechanism", "Huang 2005 and Stagg 2009 establish cTBS and its GABAergic effect"),
    "QIF-T0145": ("mechanism", "Stagg 2009 MRS measurement of tDCS-induced GABA change"),
    "QIF-T0149": ("mechanism", "Bowles 2022 and Nichols 2011 on VNS cholinergic signalling"),
    "QIF-T0154": ("mechanism", "Dorr & Debonnel 2006 on the VNS serotonin pathway"),
    "QIF-T0156": ("mechanism", "Wu 2017 and Zhao 2019 on electroacupuncture and raphe serotonin"),
    "QIF-T0157": ("mechanism", "Young 2013 and van Donkelaar 2011 on acute tryptophan depletion as a research method"),
}


def main() -> None:
    registry = json.loads(Path("datalake/qtara-registrar.json").read_text())
    confirmed = [t for t in registry["techniques"] if t["status"] == "CONFIRMED"]

    ids = {t["id"] for t in confirmed}
    missing, extra = ids - set(EVIDENCE), set(EVIDENCE) - ids
    if missing or extra:
        raise SystemExit(f"audit is out of date. unclassified: {sorted(missing)}; no longer CONFIRMED: {sorted(extra)}")

    counts = Counter(EVIDENCE[t["id"]][0] for t in confirmed)
    print(f"{len(confirmed)} CONFIRMED techniques\n")
    for kind, count in counts.most_common():
        print(f"  {kind:<20} {count:>3}  ({count / len(confirmed):.0%})")

    print("\n| ID | Technique | Evidence rests on | What the citations show |")
    print("|---|---|---|---|")
    for t in sorted(confirmed, key=lambda x: (EVIDENCE[x["id"]][0], x["id"])):
        kind, note = EVIDENCE[t["id"]]
        name = (t.get("technique") or t.get("attack", ""))[:58]
        print(f"| {t['id']} | {name} | `{kind}` | {note} |")


if __name__ == "__main__":
    main()
