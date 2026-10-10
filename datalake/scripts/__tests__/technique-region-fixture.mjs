/** A three-technique registrar small enough to reason about by eye. Shared by the technique-region script tests. */
export const TEMPLATED_PATHWAY = 'N7 (PFC/M1) → executive function; N6 (hippocampus/amygdala) → emotion regulation';

export const FIXTURE_REGISTRAR = Object.freeze({
  techniques: [
    {
      id: 'QIF-T9001',
      attack: 'Fixture stimulation',
      band_ids: ['N7', 'N6'],
      notes: 'Targets the prefrontal cortex. Does not reach the pons.',
      sources: ['Fixture et al. 2020 (Hippocampus)'],
      tara: { mechanism: 'Stimulation of Prefrontal-Cortex circuits', dsm5: { pathway: TEMPLATED_PATHWAY } },
    },
    {
      id: 'QIF-T9002',
      attack: 'Fixture eavesdropping',
      band_ids: ['S1', 'N6'],
      notes: 'Passive capture of emissions. RF only.',
      tara: { mechanism: 'Capture of emissions', dsm5: { pathway: TEMPLATED_PATHWAY } },
    },
    { id: 'QIF-T9003', attack: 'Fixture firmware attack', band_ids: ['S1'], notes: 'Reflashes the pons controller.', tara: { mechanism: 'Firmware' } },
  ],
});

export const FIXTURE_CURATION = Object.freeze({
  techniques: {
    'QIF-T9001': {
      links: [{ term: 'prefrontal cortex', field: '/notes', quote: 'Targets the prefrontal cortex', role: 'action_target' }],
      skipped: [
        { field: '/notes', text: 'pons', category: 'negation' },
        { field: '/sources/0', text: 'Hippocampus', category: 'citation' },
      ],
    },
    'QIF-T9002': { band_level: 'no_structure_named' },
  },
});
