import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: 'https://qinnovate.com',
  publicDir: 'docs',
  redirects: {
    // Legacy short routes
    '/threats/': '/atlas/tara/',
    '/niss/': '/atlas/scoring/',
    '/advisory/': '/alliance/',
    '/TARA/': '/atlas/tara/',
    '/scoring/': '/atlas/scoring/',
    '/case-studies/': '/atlas/analysis/',
    '/whitepaper/': '/research/whitepaper/',
    '/lab/derivation-log/': '/news/derivation/',

    // Pre-2026-03-06 routes (before consolidation)
    '/neurogovernance/': '/governance/rights/',
    '/landscape/': '/research/neuroethics-landscape/',
    '/psychiatric/': '/research/clinical/',
    '/therapeutics/': '/atlas/therapeutics/',
    '/bci/': '/research/landscape/',

    // 2026-03-06 Consolidation redirects
    '/threat-models/tara/': '/atlas/tara/',
    '/threat-models/scoring/': '/atlas/scoring/',
    '/threat-models/analysis/': '/atlas/analysis/',
    '/explorer/': '/atlas/explorer/',
    '/explore/': '/atlas/',
    '/interface-risks/': '/research/landscape/',
    '/interface-risks/landscape/': '/research/landscape/',
    '/interface-risks/explorer/': '/research/bci-explorer/',
    '/interface-risks/dashboard/': '/research/bci-dashboard/',
    '/interface-risks/limits/': '/research/bci-limits/',
    '/interface-risks/guardrails/': '/security/',
    '/interface-risks/api/': '/research/api/',
    '/neuroethics/rights/': '/governance/rights/',
    '/neuroethics/foundations/': '/governance/foundations/',
    '/neuroethics/clinical/': '/research/clinical/',
    '/neuroethics/landscape/': '/research/neuroethics-landscape/',
    '/neuroethics/therapeutics/': '/atlas/therapeutics/',
    '/signal-security/hourglass/': '/security/',
    '/open-research/writing/': '/news/',
    '/open-research/roadmap/': '/news/roadmap/',
    '/open-research/derivation/': '/news/derivation/',
    '/research/whitepaper/whitepaper/': '/research/whitepaper/',
    '/pitch/': 'https://github.com/qinnovates/qinnovate',
    '/learning/': '/about/',
    '/about/milestones/': '/news/roadmap/',
  },
  integrations: [
    react(),
    sitemap(),
    pagefind(),
  ],
  vite: {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, './shared'),
      },
    },
    plugins: [tailwindcss()],
  },
});
