import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useFocus } from './FocusContext';
import { PALETTE_KIND_ORDER, listPaletteCommands, searchPaletteCommands, type PaletteCommand, type PaletteCommandKind } from './palette-commands';

/** Rows shown at once. The line under the list says how many more match. */
export const PALETTE_RESULT_LIMIT = 40;

interface Props {
  onRun: (command: PaletteCommand) => void;
  onClose: () => void;
}

function headingFor(kind: PaletteCommandKind, deviceName: string): string {
  if (kind === 'view') return 'Screens';
  return kind === 'part' ? `Parts of ${deviceName}` : 'Techniques';
}

function nextIndex(key: string, current: number, count: number): number | null {
  if (count === 0) return null;
  if (key === 'ArrowDown') return (current + 1) % count;
  if (key === 'ArrowUp') return (current - 1 + count) % count;
  if (key === 'Home') return 0;
  return key === 'End' ? count - 1 : null;
}

/**
 * Jump to any screen, to a technique by name or ID, or to a part of the device in focus.
 * Worked entirely from the keyboard: type to narrow, arrows to move, Enter to go, Escape to close.
 * Rendered only while open; focus is held inside and handed back to where it came from on close.
 */
export default function CommandPalette({ onRun, onClose }: Props) {
  const { engineData, state } = useFocus();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didRunRef = useRef(false);
  const listId = useId();

  const commands = useMemo(() => listPaletteCommands(engineData.techniques, state.model), [engineData.techniques, state.model]);
  const { matches, matchCount } = useMemo(() => searchPaletteCommands(commands, query, PALETTE_RESULT_LIMIT), [commands, query]);
  const activeCommand = matches[activeIndex];

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
    // After a jump the shell moves focus to the new screen; otherwise it goes back to where it was.
    return () => { if (!didRunRef.current) opener?.focus(); };
  }, []);

  useEffect(() => {
    const active = dialogRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (typeof active?.scrollIntoView === 'function') active.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, matches]);

  const run = (command: PaletteCommand): void => {
    didRunRef.current = true;
    onRun(command);
  };

  /** Tab moves between the dialog's own controls and never leaves it. */
  const holdFocus = (event: KeyboardEvent<HTMLDivElement>): void => {
    const focusables = [...(dialogRef.current?.querySelectorAll<HTMLElement>('input, button:not([tabindex="-1"])') ?? [])];
    const position = focusables.indexOf(document.activeElement as HTMLElement);
    const step = event.shiftKey ? -1 : 1;
    event.preventDefault();
    focusables[(position + step + focusables.length) % focusables.length]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    } else if (event.key === 'Tab') {
      holdFocus(event);
    } else if (event.key === 'Enter' && event.target === inputRef.current) {
      event.preventDefault();
      if (activeCommand !== undefined) run(activeCommand);
    } else {
      const moved = nextIndex(event.key, activeIndex, matches.length);
      if (moved === null) return;
      event.preventDefault();
      setActiveIndex(moved);
    }
  };

  return (
    <div className="lab-palette-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="lab-palette" role="dialog" aria-modal="true" aria-label="Go to" onKeyDown={handleKeyDown}>
        <div className="lab-palette-head">
          <label className="lab-visually-hidden" htmlFor={`${listId}-input`}>Go to a screen, a technique or a part of the device</label>
          <input
            ref={inputRef} id={`${listId}-input`} className="lab-palette-input" type="text" role="combobox" autoComplete="off" spellCheck={false}
            placeholder="Go to a screen, a technique or a part" value={query}
            aria-expanded="true" aria-controls={listId} aria-autocomplete="list"
            aria-activedescendant={activeCommand === undefined ? undefined : `${listId}-${activeIndex}`}
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
          />
          <button type="button" className="lab-button" onClick={onClose}>Close</button>
        </div>
        <div className="lab-palette-list" id={listId} role="listbox" aria-label="Destinations">
          {PALETTE_KIND_ORDER.map((kind) => {
            const group = matches.filter((command) => command.kind === kind);
            if (group.length === 0) return null;
            return (
              <div key={kind} role="group" aria-labelledby={`${listId}-${kind}`}>
                <p className="lab-label lab-palette-heading" id={`${listId}-${kind}`}>{headingFor(kind, state.model.name)}</p>
                {group.map((command) => {
                  const index = matches.indexOf(command);
                  return (
                    <div
                      key={command.key} id={`${listId}-${index}`} className="lab-palette-option" role="option" aria-selected={index === activeIndex}
                      onPointerMove={() => setActiveIndex(index)} onClick={() => run(command)}
                    >
                      <span>{command.label}</span>
                      <span className={command.kind === 'technique' ? 'lab-id' : 'lab-soft'}>{command.detail}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="lab-palette-foot lab-soft" role="status">
          {matchCount === 0 && 'No screen, technique or part matches.'}
          {matchCount > matches.length && `Showing ${matches.length} of ${matchCount}. Type to narrow.`}
          {matchCount > 0 && matchCount <= matches.length && `${matchCount} shown.`}
        </p>
      </div>
    </div>
  );
}
