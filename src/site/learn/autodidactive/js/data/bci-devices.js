// BCI Device Landscape
// Source: shared/bci-landscape.json (v2.0, 2026-02-21)
// 24 companies, 30+ devices across invasive, semi-invasive, and non-invasive categories

function formatFunding(usd) {
  if (usd === null || usd === undefined) return null;
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(0)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(0)}K`;
  return `$${usd}`;
}

export const BCI_COMPANIES = [
  {
    name: 'Neuralink',
    type: 'invasive',
    status: 'active',
    funding: '$1.3B',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'N1 Chip',
        type: 'invasive',
        channels: 1024,
        fdaStatus: 'IDE',
        targetUse: 'medical',
        firstHuman: '2024-01'
      },
      {
        name: 'Blindsight',
        type: 'invasive',
        channels: 1024,
        fdaStatus: 'breakthrough',
        targetUse: 'medical',
        firstHuman: null
      }
    ]
  },
  {
    name: 'Synchron',
    type: 'semi_invasive',
    status: 'active',
    funding: '$345M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'Stentrode',
        type: 'semi_invasive',
        channels: 16,
        fdaStatus: 'IDE',
        targetUse: 'medical',
        firstHuman: '2022-07'
      }
    ]
  },
  {
    name: 'Blackrock Neurotech',
    type: 'invasive',
    status: 'active',
    funding: '$210M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'NeuroPort / Utah Array',
        type: 'invasive',
        channels: 96,
        fdaStatus: 'IDE',
        targetUse: 'research',
        firstHuman: '2004-06'
      },
      {
        name: 'MoveAgain BCI',
        type: 'invasive',
        channels: 96,
        fdaStatus: 'IDE',
        targetUse: 'medical',
        firstHuman: '2023-01'
      }
    ]
  },
  {
    name: 'Precision Neuroscience',
    type: 'invasive',
    status: 'active',
    funding: '$183M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'Layer 7 Cortical Interface',
        type: 'invasive',
        channels: 1024,
        fdaStatus: 'IDE',
        targetUse: 'medical',
        firstHuman: '2023-01'
      }
    ]
  },
  {
    name: 'Paradromics',
    type: 'invasive',
    status: 'active',
    funding: '$127M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'Connexus Direct Data Interface',
        type: 'invasive',
        channels: 65000,
        fdaStatus: 'none',
        targetUse: 'medical',
        firstHuman: null
      }
    ]
  },
  {
    name: 'BrainGate',
    type: 'invasive',
    status: 'research_only',
    funding: null,
    securityPosture: 'none_published',
    devices: [
      {
        name: 'BrainGate System (Utah Array)',
        type: 'invasive',
        channels: 96,
        fdaStatus: 'IDE',
        targetUse: 'research',
        firstHuman: '2004-06'
      }
    ]
  },
  {
    name: 'Emotiv',
    type: 'noninvasive',
    status: 'active',
    funding: '$12M',
    securityPosture: 'basic_encryption',
    devices: [
      {
        name: 'EPOC X',
        type: 'noninvasive',
        channels: 14,
        fdaStatus: 'exempt',
        targetUse: 'research',
        firstHuman: '2009-01'
      },
      {
        name: 'Insight',
        type: 'noninvasive',
        channels: 5,
        fdaStatus: 'exempt',
        targetUse: 'consumer',
        firstHuman: '2015-01'
      },
      {
        name: 'MN8',
        type: 'noninvasive',
        channels: 2,
        fdaStatus: 'exempt',
        targetUse: 'enterprise',
        firstHuman: '2022-01'
      }
    ]
  },
  {
    name: 'NeuroSky',
    type: 'noninvasive',
    status: 'active',
    funding: '$15M',
    securityPosture: 'minimal_claims',
    devices: [
      {
        name: 'MindWave Mobile 2',
        type: 'noninvasive',
        channels: 1,
        fdaStatus: 'exempt',
        targetUse: 'consumer',
        firstHuman: '2011-01'
      }
    ]
  },
  {
    name: 'InteraXon (Muse)',
    type: 'noninvasive',
    status: 'active',
    funding: '$60M',
    securityPosture: 'basic_encryption',
    devices: [
      {
        name: 'Muse 2',
        type: 'noninvasive',
        channels: 4,
        fdaStatus: 'exempt',
        targetUse: 'consumer',
        firstHuman: '2018-01'
      },
      {
        name: 'Muse S',
        type: 'noninvasive',
        channels: 4,
        fdaStatus: 'exempt',
        targetUse: 'consumer',
        firstHuman: '2020-01'
      }
    ]
  },
  {
    name: 'OpenBCI',
    type: 'noninvasive',
    status: 'active',
    funding: '$2.1M',
    securityPosture: 'open_source',
    devices: [
      {
        name: 'Cyton',
        type: 'noninvasive',
        channels: 8,
        fdaStatus: 'exempt',
        targetUse: 'research',
        firstHuman: '2015-01'
      },
      {
        name: 'Ganglion',
        type: 'noninvasive',
        channels: 4,
        fdaStatus: 'exempt',
        targetUse: 'research',
        firstHuman: '2016-01'
      },
      {
        name: 'Galea',
        type: 'noninvasive',
        channels: 16,
        fdaStatus: 'exempt',
        targetUse: 'research',
        firstHuman: '2023-01'
      }
    ]
  },
  {
    name: 'NextMind',
    type: 'noninvasive',
    status: 'acquired',
    funding: '$5M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'NextMind Dev Kit',
        type: 'noninvasive',
        channels: 8,
        fdaStatus: 'not_applicable',
        targetUse: 'consumer',
        firstHuman: '2020-01'
      }
    ]
  },
  {
    name: 'Kernel',
    type: 'noninvasive',
    status: 'active',
    funding: '$158M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'Flow',
        type: 'noninvasive',
        channels: 52,
        fdaStatus: 'exempt',
        targetUse: 'research',
        firstHuman: '2021-01'
      }
    ]
  },
  {
    name: 'CTRL-Labs',
    type: 'noninvasive',
    status: 'acquired',
    funding: '$67M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'EMG Wristband (Meta Neural Interface)',
        type: 'noninvasive',
        channels: 16,
        fdaStatus: 'not_applicable',
        targetUse: 'consumer',
        firstHuman: '2018-01'
      }
    ]
  },
  {
    name: 'Merge Labs',
    type: 'noninvasive',
    status: 'active',
    funding: '$252M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'Merge BCI Headphones',
        type: 'noninvasive',
        channels: null,
        fdaStatus: 'none',
        targetUse: 'consumer',
        firstHuman: null
      }
    ]
  },
  {
    name: 'AlterEgo (MIT Media Lab)',
    type: 'noninvasive',
    status: 'research_only',
    funding: null,
    securityPosture: 'none_published',
    devices: [
      {
        name: 'AlterEgo Subvocalization Interface',
        type: 'noninvasive',
        channels: 7,
        fdaStatus: 'not_applicable',
        targetUse: 'research',
        firstHuman: '2018-01'
      }
    ]
  },
  {
    name: 'Neurosity',
    type: 'noninvasive',
    status: 'active',
    funding: '$4M',
    securityPosture: 'basic_encryption',
    devices: [
      {
        name: 'Crown',
        type: 'noninvasive',
        channels: 8,
        fdaStatus: 'exempt',
        targetUse: 'consumer',
        firstHuman: '2021-01'
      }
    ]
  },
  {
    name: 'BrainCo',
    type: 'noninvasive',
    status: 'active',
    funding: '$370M',
    securityPosture: 'minimal_claims',
    devices: [
      {
        name: 'Focus 1',
        type: 'noninvasive',
        channels: 3,
        fdaStatus: 'not_applicable',
        targetUse: 'enterprise',
        firstHuman: '2018-01'
      }
    ]
  },
  {
    name: 'Nihon Kohden',
    type: 'noninvasive',
    status: 'active',
    funding: null,
    securityPosture: 'regulatory_compliance',
    devices: [
      {
        name: 'EEG-1200 (Neurofax)',
        type: 'noninvasive',
        channels: 128,
        fdaStatus: 'cleared',
        targetUse: 'medical',
        firstHuman: null
      }
    ]
  },
  {
    name: 'Natus Medical (Integra LifeSciences)',
    type: 'noninvasive',
    status: 'acquired',
    funding: null,
    securityPosture: 'regulatory_compliance',
    devices: [
      {
        name: 'Xltek EEG System',
        type: 'noninvasive',
        channels: 128,
        fdaStatus: 'cleared',
        targetUse: 'medical',
        firstHuman: null
      }
    ]
  },
  {
    name: 'g.tec medical engineering',
    type: 'noninvasive',
    status: 'active',
    funding: null,
    securityPosture: 'none_published',
    devices: [
      {
        name: 'g.USBamp',
        type: 'noninvasive',
        channels: 16,
        fdaStatus: 'cleared',
        targetUse: 'research',
        firstHuman: null
      },
      {
        name: 'g.Nautilus',
        type: 'noninvasive',
        channels: 64,
        fdaStatus: 'cleared',
        targetUse: 'research',
        firstHuman: null
      }
    ]
  },
  {
    name: 'Cognixion',
    type: 'noninvasive',
    status: 'active',
    funding: '$29M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'ONE Headset',
        type: 'noninvasive',
        channels: 6,
        fdaStatus: 'none',
        targetUse: 'medical',
        firstHuman: '2021-01'
      }
    ]
  },
  {
    name: 'Cortera Neurotechnologies',
    type: 'invasive',
    status: 'active',
    funding: null,
    securityPosture: 'none_published',
    devices: [
      {
        name: 'Cortera Surface Array',
        type: 'invasive',
        channels: 256,
        fdaStatus: 'none',
        targetUse: 'research',
        firstHuman: null
      }
    ]
  },
  {
    name: 'MindMaze',
    type: 'noninvasive',
    status: 'public',
    funding: '$330M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'MindMotion Go',
        type: 'noninvasive',
        channels: 8,
        fdaStatus: 'cleared',
        targetUse: 'rehabilitation',
        firstHuman: '2016-01'
      }
    ]
  },
  {
    name: 'INBRAIN Neuroelectronics',
    type: 'invasive',
    status: 'active',
    funding: '$83M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'Graphene Neural Probe',
        type: 'invasive',
        channels: 64,
        fdaStatus: 'pre-clinical',
        targetUse: 'therapeutic',
        firstHuman: null
      }
    ]
  },
  {
    name: 'Neurable',
    type: 'noninvasive',
    status: 'active',
    funding: '$65M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'MW75 Neuro (with Master & Dynamic)',
        type: 'noninvasive',
        channels: 6,
        fdaStatus: 'exempt',
        targetUse: 'consumer',
        firstHuman: '2024-01'
      }
    ]
  },
  {
    name: 'Arctop',
    type: 'noninvasive',
    status: 'active',
    funding: '$16M',
    securityPosture: 'none_published',
    devices: [
      {
        name: 'Arctop Neural Decode SDK',
        type: 'noninvasive',
        channels: 0,
        fdaStatus: 'none',
        targetUse: 'developer',
        firstHuman: null
      }
    ]
  }
];

// Utility: count all devices across companies
export const TOTAL_DEVICES = BCI_COMPANIES.reduce(
  (sum, c) => sum + c.devices.length, 0
);

// Utility: get companies by type
export function getCompaniesByType(type) {
  return BCI_COMPANIES.filter(c => c.type === type);
}

// Utility: get all devices flat
export function getAllDevices() {
  return BCI_COMPANIES.flatMap(c =>
    c.devices.map(d => ({ ...d, company: c.name }))
  );
}

// Utility: get devices by FDA status
export function getDevicesByFdaStatus(status) {
  return getAllDevices().filter(d => d.fdaStatus === status);
}
