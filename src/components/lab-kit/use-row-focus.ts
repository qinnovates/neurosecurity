import { useCallback, useState, type KeyboardEvent, type RefObject } from 'react';

const ROW_SELECTOR = '[data-reflow-key]';

export interface RowFocus {
  /** The row that takes the single tab stop: the last one focused if still shown, otherwise the first. */
  tabStopKey: string | undefined;
  rememberFocus: (key: string) => void;
  /** Moves focus to the row with this key. Returns false when no such row is shown. */
  focusRow: (key: string) => boolean;
  /** Arrow keys, Home and End move focus between rows. Returns true when the key was used. */
  moveFocus: (event: KeyboardEvent<HTMLElement>, index: number) => boolean;
}

/** One tab stop for a list of rows, with the arrow keys moving between them. Rows carry `data-reflow-key`. */
export function useRowFocus(containerRef: RefObject<HTMLElement | null>, keys: readonly string[]): RowFocus {
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const tabStopKey = focusedKey !== null && keys.includes(focusedKey) ? focusedKey : keys[0];

  const rowElements = useCallback(
    (): HTMLElement[] => Array.from(containerRef.current?.querySelectorAll<HTMLElement>(ROW_SELECTOR) ?? []),
    [containerRef],
  );
  const focusRow = useCallback((key: string): boolean => {
    const row = rowElements().find((element) => element.getAttribute('data-reflow-key') === key);
    row?.focus();
    return row !== undefined;
  }, [rowElements]);
  const moveFocus = useCallback((event: KeyboardEvent<HTMLElement>, index: number): boolean => {
    const rows = rowElements();
    const targets: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: rows.length - 1 };
    const target = targets[event.key];
    if (target === undefined || target < 0 || target >= rows.length) return false;
    event.preventDefault();
    rows[target].focus();
    return true;
  }, [rowElements]);

  return { tabStopKey, rememberFocus: setFocusedKey, focusRow, moveFocus };
}
