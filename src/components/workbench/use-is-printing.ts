import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

const PRINT_QUERY = 'print';

/**
 * True while the browser is laying the page out for paper. The change is applied at once
 * (not on React's next turn), because the browser reads the page for printing as soon as
 * the event returns. Where the browser reports nothing, this stays false and the print
 * stylesheet alone decides what is on paper.
 */
export function useIsPrinting(): boolean {
  const [isPrinting, setPrinting] = useState(false);

  useEffect(() => {
    const apply = (next: boolean): void => flushSync(() => setPrinting(next));
    const start = (): void => apply(true);
    const end = (): void => apply(false);
    window.addEventListener('beforeprint', start);
    window.addEventListener('afterprint', end);
    const list = typeof window.matchMedia === 'function' ? window.matchMedia(PRINT_QUERY) : null;
    const follow = (event: MediaQueryListEvent): void => apply(event.matches);
    list?.addEventListener('change', follow);
    return () => {
      window.removeEventListener('beforeprint', start);
      window.removeEventListener('afterprint', end);
      list?.removeEventListener('change', follow);
    };
  }, []);

  return isPrinting;
}
