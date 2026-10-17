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
    <div className="lab-notice model-confirm" role="alertdialog" aria-label={`Replace ${currentName}?`}>
      <p>
        Replace <strong>{currentName}</strong> with {replacementLabel}? You will lose {lossDescription}.
        Use "Save file" in the device menu first if you want to keep them.
      </p>
      <div className="model-confirm-actions">
        <button type="button" className="lab-button lab-button--primary" autoFocus onClick={onKeep}>Keep {currentName}</button>
        <button type="button" className="lab-button" onClick={onReplace}>Replace it</button>
      </div>
    </div>
  );
}
