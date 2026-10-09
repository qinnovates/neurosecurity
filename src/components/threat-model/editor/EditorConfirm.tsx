interface Props {
  /** The question, also the accessible name: "Remove Charger?" */
  question: string;
  /** What goes and what stays, computed from the model. */
  detail: string;
  confirmLabel: string;
  keepLabel: string;
  onConfirm: () => void;
  onKeep: () => void;
}

/** Asks before an edit that removes something. Keeping is the first and focused action. */
export default function EditorConfirm({ question, detail, confirmLabel, keepLabel, onConfirm, onKeep }: Props) {
  return (
    <div className="lab-notice lab-editor-confirm" role="alertdialog" aria-label={question}>
      <p><strong>{question}</strong> {detail}</p>
      <div className="lab-editor-actions">
        <button type="button" className="lab-button lab-button--primary" autoFocus onClick={onKeep}>{keepLabel}</button>
        <button type="button" className="lab-button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  );
}
