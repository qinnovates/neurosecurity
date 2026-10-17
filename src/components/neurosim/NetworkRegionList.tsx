import AtlasExplorerLink from '../brain/AtlasExplorerLink';

interface NetworkRegion {
  id: string;
  name: string;
  function: string;
}

interface RegionNetwork {
  id: string;
  name: string;
  regions: string[];
  color: string;
}

interface NetworkRegionListProps {
  regions: NetworkRegion[];
  networks: RegionNetwork[];
  /** The network picked in the controls below; null shows every region. */
  activeNetworkId: string | null;
  hoveredRegionId: string | null;
  onHoverRegion: (regionId: string | null) => void;
  onSelectRegion: (regionId: string) => void;
}

/**
 * NeuroSIM's network level as a list: the simulation's brain regions and the networks
 * each belongs to. It takes the place of the hand-placed spheres on the old brain model.
 * It draws nothing; the brain itself is on the atlas explorer page.
 */
export default function NetworkRegionList({ regions, networks, activeNetworkId, hoveredRegionId, onHoverRegion, onSelectRegion }: NetworkRegionListProps) {
  const activeNetwork = networks.find((network) => network.id === activeNetworkId) ?? null;
  const shownRegions = activeNetwork === null ? regions : regions.filter((region) => activeNetwork.regions.includes(region.id));

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0 m-0">
        {shownRegions.map((region) => {
          const regionNetworks = networks.filter((network) => network.regions.includes(region.id));
          return (
            <li key={region.id}>
              <button
                type="button" onClick={() => onSelectRegion(region.id)}
                onPointerEnter={() => onHoverRegion(region.id)} onPointerLeave={() => onHoverRegion(null)}
                onFocus={() => onHoverRegion(region.id)} onBlur={() => onHoverRegion(null)}
                className="w-full rounded-lg px-3 py-2 text-left transition-colors"
                style={{
                  background: 'var(--color-bg-primary)',
                  border: `1px solid ${hoveredRegionId === region.id ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                }}
              >
                <span className="block text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{region.name}</span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{region.function}</span>
                {regionNetworks.length > 0 && (
                  <span className="block text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                    {regionNetworks.map((network) => network.name).join(', ')}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
        A list of the simulation&rsquo;s regions, not a drawing; select one to open its cortical layers.{' '}
        <AtlasExplorerLink className="underline">See the brain itself in the TARA Brain Atlas</AtlasExplorerLink>.
      </p>
    </div>
  );
}
