import DeviceChip from './DeviceChip';
import ModeNav from './ModeNav';
import type { ModeId } from './mode-registry';
import type { Route } from './route';

interface Props {
  activeModeId: ModeId;
  onOpenMode: (modeId: ModeId) => void;
  onNavigate: (route: Route) => void;
  onPrintReport: () => void;
  onOpenPalette: () => void;
  /** On a narrow screen the modes sit along the bottom edge instead, and the site link moves to the standing statements. */
  isNarrow: boolean;
}

const SITE_PATH = '/atlas/';

/** "⌘K" on Apple keyboards, "Ctrl K" elsewhere. Both chords open the palette on every platform. */
function describeShortcut(): string {
  return /mac|iphone|ipad/i.test(navigator.platform) ? '⌘K' : 'Ctrl K';
}

/** The one bar every screen shares: the product, the four modes, the way to anywhere, and the device in focus. */
export default function TopBar({ activeModeId, onOpenMode, onNavigate, onPrintReport, onOpenPalette, isNarrow }: Props) {
  return (
    <header className="lab-topbar">
      <h1 className="lab-brand">TARA Lab</h1>
      {!isNarrow && <ModeNav activeModeId={activeModeId} onOpenMode={onOpenMode} placement="top" />}
      <button type="button" className="lab-goto" aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K" onClick={onOpenPalette}>
        <span>Go to</span>
        {!isNarrow && <kbd className="lab-goto-keys">{describeShortcut()}</kbd>}
      </button>
      <DeviceChip onNavigate={onNavigate} onPrintReport={onPrintReport} />
      {!isNarrow && <a className="lab-site-link" href={SITE_PATH}>Back to the site</a>}
    </header>
  );
}
