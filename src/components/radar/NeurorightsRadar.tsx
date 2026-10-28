/**
 * The proposed neurorights as a shape, drawn through the shared `RadarChart`.
 *
 * Four axes, because the ethics file defines four rights. The registrar tags
 * techniques with six codes and states that two of them fold in, so the fold is
 * printed on the chart: each axis carries how many techniques reach it only
 * through a folded code, and the statements sit underneath. A reader can see
 * that the four-axis shape is a choice someone made rather than the whole of
 * what the data says.
 *
 * The shape is a count of techniques, not a severity and not a measurement of
 * anybody: the chart draws in ink, with no severity tone, and says what its
 * scale is.
 */

import type { NeurorightsFold } from '@/lib/neurorights-fold';
import RadarChart, { type PlottedRadarAxis } from './RadarChart';
import { MINIMUM_AXES, shareOf } from './radar-geometry';
import { COUNT_TONE } from './radar-patterns';

interface Props {
  fold: NeurorightsFold;
  size?: number;
}

/** Ienca & Andorno (2017) proposed the rights; the registrar maps catalogued techniques onto them. */
const SOURCE_NOTE = 'Proposed rights (Ienca & Andorno, 2017), mapped onto catalogued techniques for threat modelling. An axis counts techniques, not people, and no axis is a measurement of anyone.';

function axesFor(fold: NeurorightsFold): PlottedRadarAxis[] {
  return fold.rights.map((right) => ({
    key: right.code,
    shortLabel: right.code,
    name: right.name,
    valueLabel: `${right.total} of ${fold.recordedTechniqueCount}`,
    note: right.reachedOnlyByFold === 0 ? undefined : `+${right.reachedOnlyByFold} via ${right.foldedIn.map((folded) => folded.code).join(', ')}`,
    share: shareOf(right.total, fold.recordedTechniqueCount),
  }));
}

export default function NeurorightsRadar({ fold, size }: Props) {
  const axisWords = fold.rights.map((right) => `${right.code} ${right.name}`).join(', ');
  const scaleNote = `Counts of distinct techniques, out of the ${fold.recordedTechniqueCount} of ${fold.techniqueCount} catalogued techniques that carry a neurorights record. The full axis is all ${fold.recordedTechniqueCount}.`;
  const caption = (
    <>
      {scaleNote} {fold.foldStatements.join(' ')} A technique tagged both a right and a code folded into it is counted once. {SOURCE_NOTE}
    </>
  );

  if (fold.rights.length < MINIMUM_AXES) {
    return (
      <p className="radar-note">
        The glossary defines {fold.rights.length} rights that stand on their own, which is too few to draw as a shape: {axisWords}. {fold.foldStatements.join(' ')}
      </p>
    );
  }

  if (fold.recordedTechniqueCount === 0) {
    return (
      <RadarChart
        title="Proposed neurorights by technique count"
        body={{
          kind: 'withheld',
          word: 'No records',
          reason: `None of the ${fold.techniqueCount} catalogued techniques carries a neurorights record, so there is nothing to count. The axes are the rights the ethics file defines, and none of them is zero.`,
          axes: fold.rights.map((right) => ({ key: right.code, shortLabel: right.code, name: right.name, valueLabel: '' })),
        }}
        size={size}
        caption={SOURCE_NOTE}
      />
    );
  }

  return (
    <RadarChart
      title="Proposed neurorights by technique count"
      body={{ kind: 'plotted', fill: COUNT_TONE, axes: axesFor(fold) }}
      size={size}
      caption={caption}
    />
  );
}
