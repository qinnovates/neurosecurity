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
    '/threats/': '/threat-models/tara/',
    '/niss/': '/threat-models/scoring/',
    '/advisory/': '/alliance/',

    // 2026-03-05 Restructuring
    '/neurogovernance/': '/neuroethics/rights/',
    '/landscape/': '/neuroethics/landscape/',
    '/psychiatric/': '/neuroethics/clinical/',
    '/therapeutics/': '/neuroethics/therapeutics/',
    '/TARA/': '/threat-models/tara/',
    '/scoring/': '/threat-models/scoring/',
    '/case-studies/': '/threat-models/analysis/',
    '/security/': '/signal-security/hourglass/',
    '/bci/': '/interface-risks/',
    '/whitepaper/': '/research/whitepaper/',
    '/news/': '/open-research/writing/',
    '/lab/derivation-log/': '/open-research/derivation/',
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
