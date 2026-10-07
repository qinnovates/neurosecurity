import { WORKBENCH_MODES, type ModeId } from './mode-registry';

interface Props {
  activeModeId: ModeId;
  onOpenMode: (modeId: ModeId) => void;
  /** In the top bar on a wide screen; along the bottom edge on a narrow one. Only one is shown at a time. */
  placement: 'top' | 'bottom';
}

/** The four modes. Each button carries the question its mode answers as its tooltip. */
export default function ModeNav({ activeModeId, onOpenMode, placement }: Props) {
  return (
    <nav className={`lab-modes lab-modes--${placement}`} aria-label="TARA Lab modes">
      {WORKBENCH_MODES.map((mode) => (
        <button
          key={mode.id} type="button" className="lab-mode" title={mode.question}
          aria-current={mode.id === activeModeId ? 'page' : undefined} onClick={() => onOpenMode(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </nav>
  );
}
