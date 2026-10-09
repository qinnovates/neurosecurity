/** A four-region atlas small enough to reason about by eye. Shared by the datalake script tests. */
export const FIXTURE_ATLAS = Object.freeze({
  qif_bands: [
    { id: 'N7', name: 'Neocortex' },
    { id: 'N6', name: 'Limbic System' },
    { id: 'N2', name: 'Brainstem' },
  ],
  brain_regions: [
    { id: 'pfc', name: 'Prefrontal Cortex', qif_band: 'N7' },
    { id: 'bla', name: 'Basolateral Amygdala', qif_band: 'N6' },
    { id: 'hippocampus', name: 'Hippocampus', qif_band: 'N6' },
    { id: 'pons', name: 'Pons', qif_band: 'N2' },
  ],
  region_aliases: {
    _note: 'Fixture aliases.',
    prefrontal_cortex: 'pfc',
    basolateral_amygdala: 'bla',
    amygdala: 'bla',
    locus_coeruleus: 'pons',
  },
  region_alias_relations: {
    whole_to_part: ['amygdala'],
    part_to_whole: ['locus_coeruleus'],
  },
});
