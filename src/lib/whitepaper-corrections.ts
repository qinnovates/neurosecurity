/**
 * Regulatory corrections to the QIF whitepaper, kept in one place so the current
 * page and the correction banner on archived versions cannot drift apart.
 *
 * Section 524B of the FD&C Act (21 U.S.C. 360n-2) applies to devices that meet its
 * "cyber device" definition (sponsor software, ability to connect to the internet,
 * characteristics that could be vulnerable to cybersecurity threats), so not every
 * BCI is a cyber device, and nothing in the statute names a threat catalog.
 */

/** What TARA is and is not with respect to FDA submissions. */
export const TARA_FDA_STATUS =
  'BCIs that meet the section 524B cyber device definition need cybersecurity documentation in marketing submissions. TARA is a proposed research catalog that may help when drafting threat models. It does not satisfy any FDA requirement.';

/** Banner shown on archived whitepaper versions that carried the retracted claims. */
export const WHITEPAPER_524B_CORRECTION = {
  heading: 'Correction (October 2026)',
  retracted:
    'This archived version says that every BCI is a cyber device, that TARA provides the threat catalog section 524B submissions require, that section 524B requires five categories of documentation, and that section 524B mandates a neural threat catalog and impact scoring. Those statements were incorrect.',
  preserved: 'The original text below is preserved unchanged as a historical record.',
} as const;
