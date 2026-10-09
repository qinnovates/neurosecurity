import { useRef, type KeyboardEvent } from 'react';

export interface SegmentedOption<Value extends string> {
  value: Value;
  label: string;
}

interface Props<Value extends string> {
  /** Accessible name of the group: "Register scope". */
  label: string;
  options: readonly SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

const STEP_BY_KEY: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Where a key moves the choice from `index`, wrapping at the ends; null when the key is not one of ours. */
function targetIndex(key: string, index: number, optionCount: number): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return optionCount - 1;
  const step = STEP_BY_KEY[key];
  return step === undefined ? null : (index + step + optionCount) % optionCount;
}

/** A quiet one-of-n control. One tab stop; the arrow keys move the choice. It is never filled with the selection colour. */
export default function Segmented<Value extends string>({ label, options, value, onChange }: Props<Value>) {
  const groupRef = useRef<HTMLDivElement>(null);

  const choose = (index: number): void => {
    onChange(options[index].value);
    groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[index]?.focus();
  };
  const handleKey = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const target = targetIndex(event.key, index, options.length);
    if (target === null) return;
    event.preventDefault();
    choose(target);
  };

  return (
    <div className="lab-segmented" role="radiogroup" aria-label={label} ref={groupRef}>
      {options.map((option, index) => (
        <button
          key={option.value} type="button" role="radio" className="lab-segment" aria-checked={option.value === value} tabIndex={option.value === value ? 0 : -1}
          onClick={() => onChange(option.value)} onKeyDown={(event) => handleKey(event, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
