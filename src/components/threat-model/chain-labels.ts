import type { ChainRole, EdgeBasis } from '@/lib/threat-model/chain-types';

/** Why one step follows the last, in words. Three of the four are structural and say so. */
export const EDGE_BASIS_LABELS: Record<EdgeBasis, string> = {
  'documented-relation': 'the catalog cross-references these two techniques',
  'shared-element': 'both act on the same part of the device (structural only)',
  'connected-elements': 'they act on directly connected parts (structural only)',
  'reachable-elements': 'the parts are joined only through others with no step (structural only, weakest)',
};

export const CHAIN_ROLE_LABELS: Record<ChainRole, string> = {
  reconnaissance: 'Reconnaissance',
  initial_access: 'Initial access',
  pivot: 'Pivot',
  objective: 'Objective',
  persistence: 'Persistence',
  exfiltration: 'Exfiltration',
};
