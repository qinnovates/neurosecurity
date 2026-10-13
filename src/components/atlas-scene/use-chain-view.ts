import { useCallback, useEffect, useMemo, useState } from 'react';
import { ATLAS_CHAINS_PATH, type AtlasChain, type AtlasChains } from '@/lib/atlas-explorer/chain-file';
import { INITIAL_PLAYBACK, STEP_DWELL_MS, playbackReducer, type Playback, type PlaybackAction } from '@/lib/atlas-explorer/chain-playback';
import { buildChainFrame, buildChainSteps, type ChainFrame, type ChainStepView } from '@/lib/atlas-explorer/chain-steps';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { loadAtlasChains, type Loaded } from './explorer-data';
import { useLoaded } from './use-loaded';

export interface ChainView {
  /** The threat models, fetched only after the visitor asks for them. */
  chains: Loaded<AtlasChains>;
  ask: () => void;
  retry: () => void;
  chain: AtlasChain | null;
  steps: ChainStepView[];
  playback: Playback;
  /** Every step is shown at once, numbered: the visitor's device asks for less motion. */
  isWhole: boolean;
  /** What the picture and the rail show, or null while no threat model is chosen. */
  frame: ChainFrame | null;
  choose: (chainId: string | null) => void;
  act: (action: PlaybackAction) => void;
}

/**
 * The threat-model steps the visitor is looking at. Nothing is fetched until
 * they ask. While playing, one timer moves to the next step and stops at the
 * last; under reduced motion there is no timer and every step is shown at once.
 */
export function useChainView(model: ExplorerModel, prefersLessMotion: boolean): ChainView {
  const [isAsked, setAsked] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const [playback, setPlayback] = useState<Playback>(INITIAL_PLAYBACK);
  const load = useCallback((signal: AbortSignal) => loadAtlasChains(model, signal), [model]);
  const { state: chains, retry } = useLoaded(load, isAsked, ATLAS_CHAINS_PATH);

  const chain = chains.status === 'ready' ? chains.data.chains.find((candidate) => candidate.chain_id === chainId) ?? null : null;
  const steps = useMemo(() => (chain === null ? [] : buildChainSteps(model, chain)), [model, chain]);
  const frame = useMemo(() => (chain === null ? null : buildChainFrame(chain, steps, playback.position, prefersLessMotion)), [chain, steps, playback.position, prefersLessMotion]);
  const act = useCallback((action: PlaybackAction) => setPlayback((current) => playbackReducer(current, action, steps.length)), [steps.length]);

  useEffect(() => {
    if (!playback.isPlaying || prefersLessMotion) return undefined;
    const timer = setTimeout(() => act({ type: 'tick' }), STEP_DWELL_MS);
    return () => clearTimeout(timer);
  }, [playback, prefersLessMotion, act]);

  const choose = useCallback((nextChainId: string | null) => {
    setChainId(nextChainId);
    setPlayback(INITIAL_PLAYBACK);
  }, []);
  return { chains, ask: () => setAsked(true), retry, chain, steps, playback, isWhole: prefersLessMotion, frame, choose, act };
}
