import { useEffect, useState } from 'react';
import type { SceneTheme } from '@/lib/atlas-explorer/scene-shapes';

/**
 * Which surface the canvas is drawn on.
 *
 * The CSS panels follow the theme on their own; the canvas does not, because its
 * colours come from authored palettes rather than from custom properties. Without
 * this the scene stayed on the light palette in both themes, which inverted the
 * NISS lens: the darkest swatch, `critical`, sat nearest a dark background and the
 * lightest, `none`, became the loudest thing on screen.
 *
 * `data-theme` on the document element is the explicit choice the theme toggle
 * writes; the media query is the fallback before anyone has chosen. Both are
 * watched, since either can change while the page is open.
 */
const THEME_ATTRIBUTE = 'data-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function readSceneTheme(): SceneTheme {
  if (typeof document === 'undefined') return 'light';
  const chosen = document.documentElement.getAttribute(THEME_ATTRIBUTE);
  if (chosen === 'dark' || chosen === 'light') return chosen;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function useSceneTheme(): SceneTheme {
  // Server-rendered and first client paint both start light, then correct on mount.
  // The canvas is gated behind an explicit action, so there is no flash to chase here.
  const [theme, setTheme] = useState<SceneTheme>('light');

  useEffect(() => {
    const sync = (): void => setTheme(readSceneTheme());
    sync();

    const attributeObserver = new MutationObserver(sync);
    attributeObserver.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });

    const media = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;
    media?.addEventListener('change', sync);

    return () => {
      attributeObserver.disconnect();
      media?.removeEventListener('change', sync);
    };
  }, []);

  return theme;
}
