interface Props {
  /** The catalog's identifier for the technique, shown as written. */
  techniqueId: string;
  /** Opens the technique wherever the screen shows it: a drawer, the catalog. */
  onOpen: (techniqueId: string) => void;
  /** The technique's name, added to the accessible name when the caller has it. */
  techniqueName?: string;
}

/** A technique ID that opens the technique. Set in monospace because it is an identifier. */
export default function TechniqueLink({ techniqueId, onOpen, techniqueName }: Props) {
  const accessibleName = techniqueName === undefined ? `Open technique ${techniqueId}` : `Open technique ${techniqueId}, ${techniqueName}`;
  return (
    <button type="button" className="lab-link lab-id" aria-label={accessibleName} onClick={() => onOpen(techniqueId)}>
      {techniqueId}
    </button>
  );
}
