import { useRef } from 'react';
import { useSlideMarker } from '@/components/lab-kit/motion/use-slide-marker';
import { WORKBENCH_MODES, type ModeId } from './mode-registry';

interface Props {
  activeModeId: ModeId;
  onOpenMode: (modeId: ModeId) => void;
  /** In the top bar on a wide screen; along the bottom edge on a narrow one. Only one is shown at a time. */
  placement: 'top' | 'bottom';
}

const CURRENT_MODE_SELECTOR = '.lab-mode[aria-current="page"]';

/** The four modes. Each button carries the question its mode answers as its tooltip. One line marks the current mode and slides to the mode chosen. */
export default function ModeNav({ activeModeId, onOpenMode, placement }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const line = useSlideMarker(navRef, CURRENT_MODE_SELECTOR, `${activeModeId}/${placement}`);
  return (
    <nav className={`lab-modes lab-modes--${placement}`} aria-label="TARA Lab modes" ref={navRef} data-line={line !== null}>
      {line !== null && <span className="lab-tab-line" aria-hidden="true" style={{ width: line.width, transform: `translateX(${line.left}px)` }} />}
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
