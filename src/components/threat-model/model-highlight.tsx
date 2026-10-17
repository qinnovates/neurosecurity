import { createContext, useContext, type ReactNode } from 'react';
import { useLinkedHighlight, type LinkedHighlight } from '@/components/lab-kit/motion/use-linked-highlight';

const ModelHighlightContext = createContext<LinkedHighlight | null>(null);

/**
 * One lit part or connection shared by the diagram, the part strip, the register and the
 * overview, so pointing at any of them lights the same element everywhere. The key is the
 * element id. It changes colour only; nothing moves.
 */
export function ModelHighlightProvider({ children }: { children: ReactNode }) {
  const highlight = useLinkedHighlight();
  return <ModelHighlightContext.Provider value={highlight}>{children}</ModelHighlightContext.Provider>;
}

const UNLINKED: LinkedHighlight = {
  litKey: null,
  isLit: () => false,
  setLitKey: () => undefined,
  bind: () => ({ onPointerEnter: () => undefined, onPointerLeave: () => undefined, onFocus: () => undefined, onBlur: () => undefined, 'data-lit': false }),
};

/** Outside a provider (a test, the kit page, a report) nothing is linked and nothing lights. */
export function useModelHighlight(): LinkedHighlight {
  return useContext(ModelHighlightContext) ?? UNLINKED;
}
