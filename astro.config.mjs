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
  publicDir: 'src/site',
  redirects: {
    // Legacy short routes
    '/threats/': '/atlas/tara/',
    '/niss/': '/atlas/scoring/',
    '/advisory/': '/alliance/',
    '/TARA/': '/atlas/tara/',
    '/neural-atlas/': '/atlas/',
    '/scoring/': '/atlas/scoring/',
    '/case-studies/': '/atlas/analysis/',
    '/case-studies/t0079-anc-fingerprint/': '/atlas/analysis/t0079-anc-fingerprint/',
    '/whitepaper/': '/research/whitepaper/',
    '/lab/derivation-log/': '/news/derivation/',

    // Pre-2026-03-06 routes (before consolidation)
    '/neurogovernance/': '/governance/rights/',
    '/landscape/': '/research/neuroethics-landscape/',
    '/psychiatric/': '/atlas/clinical/',
    '/therapeutics/': '/atlas/clinical/#therapeutics',
    '/bci/': '/research/landscape/',

    // 2026-03-06 Consolidation redirects
    '/threat-models/tara/': '/atlas/tara/',
    '/threat-models/scoring/': '/atlas/scoring/',
    '/threat-models/analysis/': '/atlas/analysis/',
    '/explorer/': '/atlas/',
    '/explore/': '/atlas/',
    '/interface-risks/': '/research/landscape/',
    '/interface-risks/landscape/': '/research/landscape/',
    '/interface-risks/explorer/': '/research/bci-explorer/',
    '/interface-risks/dashboard/': '/research/landscape/',
    '/interface-risks/limits/': '/research/landscape/#physics',
    '/interface-risks/guardrails/': '/guardrails/',
    '/interface-risks/api/': '/research/api/',
    '/neuroethics/rights/': '/governance/rights/',
    '/neuroethics/foundations/': '/governance/foundations/',
    '/neuroethics/clinical/': '/atlas/clinical/',
    '/neuroethics/landscape/': '/research/neuroethics-landscape/',
    '/neuroethics/therapeutics/': '/atlas/clinical/#therapeutics',
    '/signal-security/hourglass/': '/framework/',
    '/open-research/writing/': '/news/',
    '/open-research/roadmap/': '/news/roadmap/',
    '/open-research/derivation/': '/news/derivation/',
    '/research/whitepaper/whitepaper/': '/research/whitepaper/',
    '/pitch/': 'https://github.com/qinnovates/neurosecurity',
    '/learning/': '/about/',
    '/about/milestones/': '/news/roadmap/',

    // 2026-03-10 Nav restructure redirects
    '/licensing/': '/about/',

    // 2026-08-13 TARA-led IA restructure — dead stub/orphan page cleanup
    '/threat-models/': '/atlas/tara/',
    '/atlas/therapeutics/': '/atlas/clinical/#therapeutics',
    '/tools/overview/': '/guardrails/',
    '/tools/nsp/': '/guardrails/nsp/',
    '/tools/runemate/': '/guardrails/runemate/',
    '/research/clinical/': '/atlas/clinical/',
    '/research/physics/': '/research/landscape/#physics',
    '/security/': '/framework/',
    '/development/': '/guardrails/',
  },
  integrations: [
    react(),
    sitemap({
      serialize(item) {
        // Add lastmod to all sitemap entries using build time as default
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
    pagefind(),
  ],
  vite: {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, './datalake'),
      },
    },
    plugins: [tailwindcss()],
  },
});
