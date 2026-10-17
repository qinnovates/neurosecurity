import { useId, useState, type KeyboardEvent } from 'react';

interface Props {
  /** The field's name. Shown above the field, or given to assistive technology only when `isLabelHidden`. */
  label: string;
  /** In a table the column header is the visible label, so the field carries its own name unseen. */
  isLabelHidden?: boolean;
  value: string;
  /** The longest text the model file accepts for this field. */
  maxLength: number;
  onCommit: (value: string) => void;
}

/**
 * A text field that changes the model when the reader leaves it or presses Enter, not on every
 * key, so the device is not rebuilt mid-word. Empty text is never committed: the model file
 * refuses it. Escape puts the saved text back.
 */
export default function CommittedTextField({ label, isLabelHidden = false, value, maxLength, onCommit }: Props) {
  const messageId = useId();
  const [draft, setDraft] = useState(value);
  const [savedValue, setSavedValue] = useState(value);
  const [isRefused, setRefused] = useState(false);
  // The model changed under the field (another edit, another device): show what is saved.
  if (savedValue !== value) {
    setSavedValue(value);
    setDraft(value);
  }

  const commit = (): void => {
    const text = draft.trim().slice(0, maxLength);
    setRefused(text === '');
    setDraft(text === '' ? value : text);
    if (text !== '' && text !== value) onCommit(text);
  };
  const handleKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') commit();
    if (event.key === 'Escape') { setDraft(value); setRefused(false); }
  };

  const input = (
    <input
      className="lab-input" type="text" value={draft} maxLength={maxLength} aria-label={isLabelHidden ? label : undefined}
      aria-invalid={isRefused} aria-describedby={isRefused ? messageId : undefined}
      onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={handleKey}
    />
  );
  const message = isRefused && <span id={messageId} role="alert" className="lab-label">Needs 1 to {maxLength} characters. The saved text was kept.</span>;

  if (isLabelHidden) return <span className="lab-field">{input}{message}</span>;
  return (
    <label className="lab-field">
      <span className="lab-label">{label}</span>
      {input}
      {message}
    </label>
  );
}
