import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { filterSubjectOptions, type SubjectOption } from '@/lib/atlas-explorer/subject-options';

interface Props {
  /** What is being chosen, in the singular: "technique". */
  noun: string;
  options: readonly SubjectOption[];
  chosenId: string | null;
  onChoose: (subjectId: string) => void;
}

interface OptionProps {
  option: SubjectOption;
  elementId: string;
  isActive: boolean;
  isChosen: boolean;
  onChoose: (subjectId: string) => void;
}

function PickerOption({ option, elementId, isActive, isChosen, onChoose }: OptionProps) {
  return (
    // The list is driven from the text field (arrow keys and Enter); a click is the pointer's way to the same choice.
    <li
      id={elementId} role="option" className="atlas-option" aria-selected={isChosen} data-active={isActive}
      data-technique-kind={option.techniqueKind} onClick={() => onChoose(option.id)}
    >
      <span className="atlas-option-label">{option.label}</span>
      <span className="atlas-option-id">{option.id}</span>
      <span className="atlas-option-detail">{option.detail}</span>
    </li>
  );
}

export type PickerKeyAction = { type: 'choose' } | { type: 'clear' } | { type: 'move'; index: number };

interface PickerKeyContext {
  query: string;
  activeIndex: number;
  matchCount: number;
}

/**
 * What a key does in the picker's text field, or null when the key is left to the field itself.
 * Home and End keep their meaning inside the text while there is text to move through.
 */
export function pickerKeyAction(key: string, { query, activeIndex, matchCount }: PickerKeyContext): PickerKeyAction | null {
  if (key === 'Enter') return matchCount > 0 ? { type: 'choose' } : null;
  if (key === 'Escape') return query === '' ? null : { type: 'clear' };
  if (matchCount === 0 || ((key === 'Home' || key === 'End') && query !== '')) return null;
  const targets: Record<string, number> = { ArrowDown: Math.min(activeIndex + 1, matchCount - 1), ArrowUp: Math.max(activeIndex - 1, 0), Home: 0, End: matchCount - 1 };
  return Object.hasOwn(targets, key) ? { type: 'move', index: targets[key] } : null;
}

/**
 * A filterable list for choosing what a lens is about. One tab stop: type to
 * narrow, arrow keys to move, Enter to choose, Escape to clear the filter.
 * Works the same for five options as for every technique in the catalog.
 */
export default function SubjectPicker({ noun, options, chosenId, onChoose }: Props) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const matches = useMemo(() => filterSubjectOptions(options, query), [options, query]);
  const active = matches[Math.min(activeIndex, matches.length - 1)];
  const optionId = (option: SubjectOption): string => `${baseId}-option-${option.id}`;

  // The list scrolls itself to keep the active option in view. It never scrolls the page: a choice made from elsewhere
  // on the page has its own place to land, and this must not pull the page away from it.
  useEffect(() => {
    const list = listRef.current;
    const option = list?.querySelector<HTMLElement>(`[data-active="true"]`) ?? null;
    if (list === null || list === undefined || option === null) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
  }, [active]);

  const handleKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    const action = pickerKeyAction(event.key, { query, activeIndex: Math.min(activeIndex, matches.length - 1), matchCount: matches.length });
    if (action === null) return;
    event.preventDefault();
    if (action.type === 'choose' && active !== undefined) onChoose(active.id);
    if (action.type === 'clear') setQuery('');
    if (action.type !== 'choose') setActiveIndex(action.type === 'move' ? action.index : 0);
  };

  return (
    <div className="atlas-picker">
      <label className="atlas-label" htmlFor={`${baseId}-input`}>Choose a {noun}</label>
      <input
        id={`${baseId}-input`} className="atlas-input" type="text" role="combobox" autoComplete="off" spellCheck={false}
        aria-expanded="true" aria-controls={`${baseId}-list`} aria-autocomplete="list" aria-describedby={`${baseId}-count`}
        aria-activedescendant={active === undefined ? undefined : optionId(active)}
        placeholder={`Filter ${options.length} by name or id`} value={query} onKeyDown={handleKey}
        onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
      />
      <p className="atlas-picker-count" id={`${baseId}-count`} role="status">
        {matches.length === options.length ? `${options.length} to choose from.` : `${matches.length} of ${options.length} match.`}
        {matches.length === 0 && ' Nothing matches; clear the filter with Escape.'}
      </p>
      <ul ref={listRef} id={`${baseId}-list`} role="listbox" className="atlas-options" aria-label={`${noun} list`}>
        {matches.map((option) => (
          <PickerOption
            key={option.id} option={option} elementId={optionId(option)} isActive={option === active}
            isChosen={option.id === chosenId} onChoose={onChoose}
          />
        ))}
      </ul>
    </div>
  );
}
