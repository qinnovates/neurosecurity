interface Props {
  currentName: string;
  /** How many risks the user has given a status or note. */
  decisionCount: number;
  replacementLabel: string;
  onReplace: () => void;
  onKeep: () => void;
}

/** Asks before a device with recorded work is replaced. Keeping is the default action. */
export default function ReplaceDeviceConfirm({ currentName, decisionCount, replacementLabel, onReplace, onKeep }: Props) {
  const lossDescription = decisionCount > 0
    ? `its answers and ${decisionCount} recorded decision${decisionCount === 1 ? '' : 's'}`
    : 'the answers you changed';
  return (
    <div className="tm-notice" role="alertdialog" aria-label={`Replace ${currentName}?`}>
      <p>
        Replace <strong>{currentName}</strong> with {replacementLabel}? You will lose {lossDescription}.
        Use "Save model file" first if you want to keep them.
      </p>
      <div className="tm-actions" style={{ marginTop: '0.5rem' }}>
        <button type="button" className="tm-button tm-button--primary" autoFocus onClick={onKeep}>Keep {currentName}</button>
        <button type="button" className="tm-button" onClick={onReplace}>Replace it</button>
      </div>
    </div>
  );
}
