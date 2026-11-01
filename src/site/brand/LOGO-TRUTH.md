# Qinnovate logo: source of truth

Approved 2026-11-01. This file and `src/site/brands.json` (`logo` and `theme.colors.logo_*`) are the record. If they disagree with a mockup, the mockup is wrong.

## Mark

- Open ring with a tapered tail and a blue dot at the tail end. Geometry on a 100-unit grid, centre (50, 50).
- Ring radius 35, stroke 11, gap 40° centred on 45° (lower right).
- Tail tapers from 11 to about 5.2 units, 12 units long, leaving the ring at 45°.
- Dot radius 10.8 (reduced 10% from 12 on 2026-11-01), sitting at the tail end (83.23, 83.23). A 1.5-unit knockout separates the dot from the ring.
- Source: `src/site/brand/qinnovate-mark.svg` (dark ground version).

## Colour

| Role | Dark ground (default) | Light ground |
|---|---|---|
| Ring | `#F5F6F8` | `#10121A` |
| Dot | `#0EA5E9` (approved) | `#2563EB` (proposed, pending approval) |
| Wordmark | `#F5F6F8` | `#10121A` |
| i-dot | same as wordmark | same as wordmark |

Contrast on the dark ground: ring 18.16:1, i-dot 18.34:1, dot 7.08:1. All pass 3:1 for graphics.

Light ground: `#0EA5E9` on `#F5F6F8` is about 2.3:1, below 3:1. That is why the light dot is `#2563EB`. Owner approval needed.

## Wordmark

- Word: "innovate", set in Space Grotesk, weight 588, letter-spacing -0.02em.
- The dot on the i is a separate element in the text colour. The dotless ı is used so the dot can be placed on purpose.
- The mark replaces the letter Q. The wordmark never includes a Q.

## Accessibility

- The logo link has an accessible name: "Qinnovate home".
- The mark SVG is decorative inside the link (`aria-hidden` on the component).

## Open items

- Confirm the light-ground dot (`#2563EB`).
- Measure the i-dot against the real Space Grotesk file.
- Favicon, OG image and the 16px proof are not done yet.
