/**
 * BCI Directory Data Adapter — build-time pipeline for the BCI Directory page.
 *
 * Flattens bci-landscape.json into card-friendly structures for company
 * and device directory views. Pure data processing, no React.
 *
 * Source: shared/bci-landscape.json (imported in kql-tables.ts as landscapeRaw)
 */

import landscapeRaw from '@shared/bci-landscape.json';
const landscape = landscapeRaw as any;

// ═══ Types ═══

export interface BciDeviceCard {
  /** Device fields */
  device_name: string;
  device_type: 'invasive' | 'semi_invasive' | 'non_invasive';
  channels: number;
  electrode_type: string;
  fda_status: string;
  units_deployed: string;
  first_human: string;
  price_usd: number | null;
  target_use: string;
  cves_known: string[];

  /** Parent company fields */
  company_name: string;
  company_type: string;
  company_status: string;
  company_category: string;
  company_headquarters: string;
  company_founded: string;
  funding_total_usd: number | null;
  security_posture: string;
  security_notes: string;
}

export interface BciCompanyDeviceSummary {
  name: string;
  type: string;
  channels: number;
  fda_status: string;
  target_use: string;
}

export interface BciCompanyCard {
  name: string;
  type: string;
  founded: string;
  headquarters: string;
  status: string;
  category: string;
  funding_total_usd: number | null;
  valuation_usd: number | null;
  employees_approx: number | null;
  security_posture: string;
  security_notes: string;

  /** Computed from devices */
  device_count: number;
  total_channels: number;
  top_fda_status: string;
  devices: BciCompanyDeviceSummary[];
}

export interface BciDirectoryStats {
  totalCompanies: number;
  totalDevices: number;
  byType: Record<string, number>;
  byFdaStatus: Record<string, number>;
  byTargetUse: Record<string, number>;
  bySecurityPosture: Record<string, number>;
  byCompanyCategory: Record<string, number>;
  totalFundingUsd: number;
}

// ═══ Constants ═══

export const DEVICE_TYPE_COLORS: Record<string, string> = {
  invasive: '#ef4444',       // red-500
  semi_invasive: '#f59e0b',  // amber-500
  non_invasive: '#22c55e',   // green-500
};

export const FDA_STATUS_COLORS: Record<string, string> = {
  approved: '#22c55e',              // green-500
  de_novo: '#22c55e',              // green-500
  cleared: '#22c55e',              // green-500
  IDE: '#3b82f6',                  // blue-500
  breakthrough_device: '#8b5cf6',  // violet-500
  breakthrough: '#8b5cf6',        // violet-500
  exempt: '#6b7280',              // gray-500
  none: '#9ca3af',                // gray-400
  not_required: '#9ca3af',        // gray-400
};

export const SECURITY_POSTURE_ICONS: Record<string, string> = {
  published: 'shield-check',
  partial: 'shield-half',
  none_published: 'shield-off',
};

// ═══ Helpers ═══

/** Format USD amounts for display: "$1.3B", "$150M", "$2.5M", "Undisclosed" */
export function formatFunding(usd: number | null): string {
  if (usd === null || usd === undefined) return 'Undisclosed';
  if (usd >= 1_000_000_000) {
    const b = usd / 1_000_000_000;
    return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`;
  }
  if (usd >= 1_000_000) {
    const m = usd / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (usd >= 1_000) {
    const k = usd / 1_000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `$${usd}`;
}

/** Rank FDA statuses to pick the "top" one for a company */
const FDA_RANK: Record<string, number> = {
  approved: 6,
  de_novo: 5,
  cleared: 5,
  breakthrough_device: 4,
  breakthrough: 4,
  IDE: 3,
  exempt: 2,
  not_required: 1,
  none: 0,
};

function rankFdaStatus(status: string | null): number {
  if (!status) return -1;
  return FDA_RANK[status] ?? 0;
}

// ═══ Data Accessors ═══

/**
 * Returns a flat list of devices, each enriched with parent company info.
 * One entry per device — companies with multiple devices produce multiple cards.
 */
export function getBciDirectoryDevices(): BciDeviceCard[] {
  const companies: any[] = landscape.companies ?? [];
  const devices: BciDeviceCard[] = [];

  for (const company of companies) {
    const companyDevices: any[] = company.devices ?? [];
    for (const device of companyDevices) {
      devices.push({
        device_name: device.name,
        device_type: device.type ?? company.type,
        channels: typeof device.channels === 'number' ? device.channels : 0,
        electrode_type: device.electrode_type ?? '',
        fda_status: device.fda_status ?? '',
        units_deployed: device.units_deployed ?? '',
        first_human: device.first_human ?? '',
        price_usd: device.price_usd ?? null,
        target_use: device.target_use ?? '',
        cves_known: device.cves_known ?? [],

        company_name: company.name,
        company_type: company.type,
        company_status: company.status ?? 'unknown',
        company_category: company.company_category ?? '',
        company_headquarters: company.headquarters ?? '',
        company_founded: company.founded ?? '',
        funding_total_usd: company.funding_total_usd ?? null,
        security_posture: company.security_posture ?? 'none_published',
        security_notes: company.security_notes ?? '',
      });
    }
  }

  return devices;
}

/**
 * Returns a list of companies with computed device aggregates.
 * Each company includes device_count, total_channels, and top_fda_status.
 */
export function getBciDirectoryCompanies(): BciCompanyCard[] {
  const companies: any[] = landscape.companies ?? [];

  return companies.map((c: any) => {
    const devices: any[] = c.devices ?? [];
    const channelSum = devices.reduce(
      (sum: number, d: any) => sum + (typeof d.channels === 'number' ? d.channels : 0),
      0
    );

    // Pick the highest-ranked FDA status across all devices
    let topFda = '';
    let topRank = -1;
    for (const d of devices) {
      const rank = rankFdaStatus(d.fda_status);
      if (rank > topRank) {
        topRank = rank;
        topFda = d.fda_status ?? '';
      }
    }


    return {
      name: c.name,
      type: c.type,
      founded: c.founded ?? '',
      headquarters: c.headquarters ?? '',
      status: c.status ?? 'unknown',
      category: c.company_category ?? '',
      funding_total_usd: c.funding_total_usd ?? null,
      valuation_usd: c.valuation_usd ?? null,
      employees_approx: c.employees_approx ?? null,
      security_posture: c.security_posture ?? 'none_published',
      security_notes: c.security_notes ?? '',
      device_count: devices.length,
      total_channels: channelSum,
      top_fda_status: topFda,
      devices: devices.map((d: any) => ({
        name: d.name,
        type: d.type ?? c.type,
        channels: typeof d.channels === 'number' ? d.channels : 0,
        fda_status: d.fda_status ?? '',
        target_use: d.target_use ?? '',
      })),
    };
  });
}

/**
 * Returns aggregate statistics across the entire BCI landscape.
 */
export function getBciDirectoryStats(): BciDirectoryStats {
  const companies: any[] = landscape.companies ?? [];
  const byType: Record<string, number> = {};
  const byFda: Record<string, number> = {};
  const byTargetUse: Record<string, number> = {};
  const bySecurityPosture: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let totalDevices = 0;
  let totalFunding = 0;

  for (const company of companies) {
    // Company-level aggregates
    const posture = company.security_posture ?? 'none_published';
    bySecurityPosture[posture] = (bySecurityPosture[posture] ?? 0) + 1;

    const category = company.company_category ?? 'unknown';
    byCategory[category] = (byCategory[category] ?? 0) + 1;

    if (typeof company.funding_total_usd === 'number') {
      totalFunding += company.funding_total_usd;
    }

    // Device-level aggregates
    const devices: any[] = company.devices ?? [];
    totalDevices += devices.length;

    for (const device of devices) {
      const type = device.type ?? company.type ?? 'unknown';
      byType[type] = (byType[type] ?? 0) + 1;

      const fda = device.fda_status ?? 'none';
      byFda[fda] = (byFda[fda] ?? 0) + 1;

      const use = device.target_use ?? 'unknown';
      byTargetUse[use] = (byTargetUse[use] ?? 0) + 1;
    }
  }

  return {
    totalCompanies: companies.length,
    totalDevices: totalDevices,
    byType: byType,
    byFdaStatus: byFda,
    byTargetUse: byTargetUse,
    bySecurityPosture: bySecurityPosture,
    byCompanyCategory: byCategory,
    totalFundingUsd: totalFunding,
  };
}
