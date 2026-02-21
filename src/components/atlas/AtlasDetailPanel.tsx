/**
 * AtlasDetailPanel — 5-tab detail panel for the Atlas Dashboard.
 * Shows contextual data for the selected hourglass band.
 *
 * Tabs: Overview | Devices | Controls | DSM | Security
 */

import type { AtlasBand, AtlasDevice, AtlasNeuroright, AtlasDsmCluster } from '../../lib/atlas-data';
import type { DetailTab } from './AtlasContext';

interface Props {
  band: AtlasBand;
  devices: AtlasDevice[];
  neurorights: AtlasNeuroright[];
  dsmClusters: AtlasDsmCluster[];
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  threatDetail: {
    total: number;
    categories: Record<string, number>;
    bySeverity: Record<string, number>;
    avgNiss: number;
  };
}

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'devices', label: 'Devices' },
  { id: 'controls', label: 'Controls' },
  { id: 'dsm', label: 'DSM-5' },
  { id: 'security', label: 'Security' },
];

const CATEGORY_LABELS: Record<string, string> = {
  SI: 'Signal Injection', SE: 'Signal Eavesdrop', DM: 'Data Manipulation',
  DS: 'Denial of Service', PE: 'Privilege Escalation', CI: 'Cognitive Integrity',
  PS: 'Physical Safety', EX: 'Data Exfiltration',
};

export default function AtlasDetailPanel({
  band, devices, neurorights, dsmClusters, activeTab, onTabChange, threatDetail,
}: Props) {
  const bandDevices = devices.filter(d => d.bands.includes(band.id));
  const bandNeurorights = neurorights.filter(nr => nr.bands.includes(band.id));
  const bandDsmClusters = dsmClusters.filter(c => c.bands.includes(band.id));

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
    >
      {/* Tab bar */}
      <div
        className="flex border-b overflow-x-auto"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors relative"
            style={{
              color: activeTab === tab.id ? band.color : 'var(--color-text-faint)',
              background: activeTab === tab.id ? `${band.color}08` : 'transparent',
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: band.color }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 min-h-[200px]">
        {activeTab === 'overview' && <OverviewTab band={band} />}
        {activeTab === 'devices' && <DevicesTab devices={bandDevices} band={band} />}
        {activeTab === 'controls' && <ControlsTab band={band} neurorights={bandNeurorights} />}
        {activeTab === 'dsm' && <DsmTab clusters={bandDsmClusters} band={band} />}
        {activeTab === 'security' && <SecurityTab band={band} threatDetail={threatDetail} />}
      </div>
    </div>
  );
}

// ═══ Tab: Overview ═══

function OverviewTab({ band }: { band: AtlasBand }) {
  return (
    <div className="space-y-4">
      <div>
        <h3
          className="text-sm font-semibold mb-1"
          style={{ color: band.color, fontFamily: 'var(--font-heading)' }}
        >
          {band.id} {band.name}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {band.description}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Zone" value={band.zone} color={band.color} />
        <StatCard label="Determinacy" value={band.determinacy} color={band.color} />
        <StatCard label="QI Range" value={`${band.qiRange[0]} - ${band.qiRange[1]}`} color={band.color} />
        <StatCard label="Severity" value={band.severity.split('(')[0].trim()} color={band.color} />
      </div>

      {/* Brain regions */}
      {band.brainRegions.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
            Brain Regions ({band.brainRegions.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {band.brainRegions.map(region => (
              <div
                key={region.id}
                className="px-3 py-2 rounded-lg border text-xs"
                style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono font-semibold" style={{ color: band.color }}>
                    {region.abbreviation}
                  </span>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {region.name}
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
                  {region.function}
                </p>
                <div className="flex gap-3 mt-1">
                  {region.latencyMs && (
                    <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                      Latency: {region.latencyMs}ms
                    </span>
                  )}
                  {region.oscillationBands.length > 0 && (
                    <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                      {region.oscillationBands.length} oscillation bands
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ Tab: Devices ═══

function DevicesTab({ devices, band }: { devices: AtlasDevice[]; band: AtlasBand }) {
  if (devices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          No BCI devices mapped to {band.id} ({band.name})
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-faint)' }}>
        {devices.length} devices targeting {band.id}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {devices.map((device, i) => (
          <div
            key={i}
            className="px-3 py-2.5 rounded-lg border text-xs"
            style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {device.name}
              </span>
              {device.fdaStatus && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: device.fdaStatus === 'cleared' || device.fdaStatus === 'approved'
                      ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                    color: device.fdaStatus === 'cleared' || device.fdaStatus === 'approved'
                      ? '#10b981' : '#94a3b8',
                  }}
                >
                  {device.fdaStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
                {device.manufacturer}
              </span>
              {device.directionality && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    background: device.directionality.includes('bidirectional')
                      ? 'rgba(139, 92, 246, 0.12)' : device.directionality.includes('write') || device.directionality.includes('stimulation')
                      ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                    color: device.directionality.includes('bidirectional')
                      ? '#8b5cf6' : device.directionality.includes('write') || device.directionality.includes('stimulation')
                      ? '#f59e0b' : '#3b82f6',
                  }}
                >
                  {device.directionality.includes('bidirectional') ? 'R/W' : device.directionality.includes('write') || device.directionality.includes('stimulation') ? 'Write' : 'Read'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {device.channels != null && (
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {device.channels} ch
                </span>
              )}
              {device.samplingHz != null && typeof device.samplingHz === 'number' && (
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {device.samplingHz >= 1000 ? `${(device.samplingHz / 1000).toFixed(0)}k` : device.samplingHz} Hz
                </span>
              )}
              {device.wireless && device.wireless !== 'undefined' && (
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {device.wireless}
                </span>
              )}
              {device.power && !device.power.includes('null') && (
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {device.power}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ Tab: Controls (Ethics + Security Controls) ═══

function ControlsTab({ band, neurorights }: { band: AtlasBand; neurorights: AtlasNeuroright[] }) {
  return (
    <div className="space-y-4">
      {/* Neurorights */}
      {neurorights.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
            Neurorights Protecting This Band ({neurorights.length})
          </h4>
          <div className="space-y-2">
            {neurorights.map(nr => (
              <div
                key={nr.id}
                className="px-3 py-2 rounded-lg border"
                style={{ background: `${nr.color}06`, borderColor: `${nr.color}20` }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: nr.color }}
                  />
                  <span className="text-xs font-medium" style={{ color: nr.color }}>
                    {nr.name}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--color-text-faint)' }}>
                    {nr.id}
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {nr.shortDef}
                </p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{ color: 'var(--color-text-faint)', borderColor: 'var(--color-border)' }}>
                    {nr.source}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                    {nr.threatCount} threats
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security controls */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
          Security Controls
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <ControlList title="Detection" items={band.securityControls.detection} color="#3b82f6" />
          <ControlList title="Prevention" items={band.securityControls.prevention} color="#10b981" />
          <ControlList title="Response" items={band.securityControls.response} color="#f59e0b" />
        </div>
      </div>
    </div>
  );
}

function ControlList({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div
      className="px-3 py-2 rounded-lg border"
      style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
    >
      <h5 className="text-[10px] font-semibold uppercase mb-1.5" style={{ color }}>
        {title}
      </h5>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
              <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: color, opacity: 0.5 }} />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>None defined</p>
      )}
    </div>
  );
}

// ═══ Tab: DSM-5 ═══

function DsmTab({ clusters, band }: { clusters: AtlasDsmCluster[]; band: AtlasBand }) {
  if (clusters.length === 0 && band.dsmConditions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          No DSM-5-TR diagnostic mappings for {band.id} ({band.name})
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
        {band.dsmConditions.length} diagnostic codes mapped to {band.id}
      </p>
      {clusters.map(cluster => (
        <div
          key={cluster.id}
          className="px-3 py-2.5 rounded-lg border"
          style={{ background: `${cluster.color}06`, borderColor: `${cluster.color}20` }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2 h-2 rounded-sm"
              style={{ background: cluster.color }}
            />
            <span className="text-xs font-semibold" style={{ color: cluster.color }}>
              {cluster.label}
            </span>
          </div>
          <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {cluster.description}
          </p>
          {cluster.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {cluster.conditions
                .filter(c => c.bands.includes(band.id))
                .map(c => (
                  <span
                    key={c.code}
                    className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{
                      background: `${cluster.color}10`,
                      borderColor: `${cluster.color}25`,
                      color: cluster.color,
                    }}
                  >
                    {c.code} {c.name}
                  </span>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══ Tab: Security ═══

function SecurityTab({
  band,
  threatDetail,
}: {
  band: AtlasBand;
  threatDetail: Props['threatDetail'];
}) {
  const sevColors: Record<string, string> = {
    critical: '#ef4444', high: '#f59e0b', medium: '#eab308', low: '#94a3b8',
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Threats" value={String(threatDetail.total)} color={band.color} />
        <StatCard label="Avg NISS" value={String(threatDetail.avgNiss)} color={band.color} />
        <StatCard label="Critical" value={String(threatDetail.bySeverity.critical ?? 0)} color="#ef4444" />
        <StatCard label="High" value={String(threatDetail.bySeverity.high ?? 0)} color="#f59e0b" />
      </div>

      {/* Category breakdown */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
          Threat Categories
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {Object.entries(threatDetail.categories).map(([cat, count]) => (
            <div
              key={cat}
              className="flex items-center justify-between px-2 py-1.5 rounded text-[11px]"
              style={{ background: 'var(--color-bg-primary)' }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
              <span className="font-mono font-semibold" style={{ color: band.color }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top threats */}
      {band.topThreats.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
            Top Threats by NISS
          </h4>
          <div className="space-y-1">
            {band.topThreats.map(t => (
              <a
                key={t.id}
                href={`/TARA/${t.id}/`}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors text-xs"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: sevColors[t.severity] ?? '#94a3b8' }}
                />
                <span className="flex-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {t.name}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                  {t.id}
                </span>
                <span className="font-mono text-[10px] font-semibold" style={{ color: band.color }}>
                  {t.niss}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ Shared ═══

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="px-3 py-2 rounded-lg border"
      style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
    >
      <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color, fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
    </div>
  );
}
