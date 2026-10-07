import DeviceChip from './DeviceChip';
import ModeNav from './ModeNav';
import type { ModeId } from './mode-registry';

interface Props {
  activeModeId: ModeId;
  onOpenMode: (modeId: ModeId) => void;
}

const SITE_PATH = '/atlas/';

/** The one bar every screen shares: the product, the four modes, and the device in focus. */
export default function TopBar({ activeModeId, onOpenMode }: Props) {
  return (
    <header className="lab-topbar tm-no-print">
      <h1 className="lab-brand">TARA Lab</h1>
      <ModeNav activeModeId={activeModeId} onOpenMode={onOpenMode} placement="top" />
      <DeviceChip />
      <a className="lab-site-link" href={SITE_PATH}>Back to the site</a>
    </header>
  );
}
