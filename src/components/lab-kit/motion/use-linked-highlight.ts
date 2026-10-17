import { useCallback, useMemo, useState } from 'react';

interface LinkedHandlers {
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  'data-lit': boolean;
}

export interface LinkedHighlight {
  /** The key under the pointer or holding focus in any linked view, or null. */
  litKey: string | null;
  isLit: (key: string) => boolean;
  setLitKey: (key: string | null) => void;
  /** Spread on an element that stands for `key`: it lights its partners and is lit by them. */
  bind: (key: string) => LinkedHandlers;
}

/**
 * One hovered-or-focused key shared by two or more views, so pointing at a part lights its
 * rows and pointing at a row lights its part. Call it once in the parent of the views and
 * pass the result to each. It changes colour only; nothing moves.
 */
export function useLinkedHighlight(): LinkedHighlight {
  const [litKey, setLitKey] = useState<string | null>(null);
  const isLit = useCallback((key: string): boolean => litKey === key, [litKey]);
  const bind = useCallback((key: string): LinkedHandlers => {
    const light = (): void => setLitKey(key);
    const dim = (): void => setLitKey((current) => (current === key ? null : current));
    return { onPointerEnter: light, onPointerLeave: dim, onFocus: light, onBlur: dim, 'data-lit': litKey === key };
  }, [litKey]);
  return useMemo(() => ({ litKey, isLit, setLitKey, bind }), [litKey, isLit, bind]);
}
