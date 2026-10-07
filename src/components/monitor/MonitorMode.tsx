import type { ModeProps } from '@/components/workbench/mode-registry';
import '@/components/threat-model/threat-model.css';

/** Served from this site, so the frame loads nothing from another origin. */
const MONITOR_APP_PATH = '/brain-siem/';

/**
 * The Monitor mode: the signal dashboard, a separate app shown in its own frame.
 * It plays back recorded samples. Nothing about the device in focus is passed to it.
 */
export default function MonitorMode(_props: ModeProps) {
  return (
    <div className="tm-root">
      <p className="tm-notice">
        Sample data. This view replays stored EEG recordings to show what monitoring a neural signal looks like.
        It is not connected to any device, and its alerts are demonstrations, not detections.
      </p>
      <iframe
        className="workbench-frame" src={MONITOR_APP_PATH} title="Signal monitor demonstration playing sample recordings"
        loading="lazy" referrerPolicy="no-referrer"
      />
      <p className="tm-muted tm-small">
        The monitor is a separate application. It currently opens with all of its modules; trimming it to signal, spectrum, alerts, and the 3D view is pending.
      </p>
    </div>
  );
}
