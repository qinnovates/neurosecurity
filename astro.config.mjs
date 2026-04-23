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
    '/advisory/': '/governance/',
    '/alliance/': '/governance/',
    '/TARA/': '/atlas/tara/',
    '/neural-atlas/': '/atlas/',
    // Nav/footer refs without pages → governance hub as fallback
    '/glossary/': '/atlas/',
    '/adopt/': '/research/whitepaper/',
    '/governance/ai-ethics/': '/governance/ai-security-ethics/',
    '/scoring/': '/atlas/scoring/',
    '/case-studies/': '/atlas/analysis/',
    '/case-studies/t0079-anc-fingerprint/': '/atlas/analysis/t0079-anc-fingerprint/',
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
    '/explorer/': '/atlas/',
    '/explore/': '/atlas/',
    '/interface-risks/': '/research/landscape/',
    '/interface-risks/landscape/': '/research/landscape/',
    '/interface-risks/explorer/': '/research/bci-explorer/',
    '/interface-risks/dashboard/': '/research/landscape/',
    '/interface-risks/limits/': '/research/physics/',
    '/interface-risks/guardrails/': '/guardrails/',
    '/interface-risks/api/': '/research/api/',
    '/neuroethics/rights/': '/governance/rights/',
    '/neuroethics/foundations/': '/governance/foundations/',
    '/neuroethics/clinical/': '/research/clinical/',
    '/neuroethics/landscape/': '/research/neuroethics-landscape/',
    '/neuroethics/therapeutics/': '/atlas/therapeutics/',
    '/signal-security/hourglass/': '/framework/',
    '/open-research/writing/': '/news/',
    '/open-research/roadmap/': '/news/roadmap/',
    '/open-research/derivation/': '/news/derivation/',
    '/research/whitepaper/whitepaper/': '/research/whitepaper/',
    '/pitch/': 'https://github.com/qinnovates/qinnovate',
    '/learning/': '/about/',
    '/about/milestones/': '/news/roadmap/',

    // 2026-03-10 Nav restructure redirects
    '/licensing/': '/about/',

    // 2026-04-23 consolidation: /learn/*.html → autodidactive labs canonical
    '/learn/calculus-bci-limits.html': '/learn/autodidactive/labs/calculus-bci-limits.html',
    '/learn/calculus-fundamentals.html': '/learn/autodidactive/labs/calculus-fundamentals.html',
    '/learn/calculus-signals.html': '/learn/autodidactive/labs/calculus-signals.html',

    // 2026-04-23 audit: paper rename (neuromodesty check #2 — "predict" → "map to")
    '/research/papers/2026-02-13-the-neural-impact-chain-when-niss-scores-predict-psychiatric-diagnoses/': '/research/papers/2026-02-13-the-neural-impact-chain-when-niss-scores-map-to-psychiatric-risk-categories/',
    // 2026-04-23 audit: historical inbound link referenced /news/... instead of /research/papers/...
    '/news/2026-02-11-tara-first-cve-realtek-audio-jack-retasking/': '/research/papers/2026-02-11-tara-first-cve-realtek-audio-jack-retasking/',
    // Historical uppercase casing on governance docs
    '/governance/REGULATORY_COMPLIANCE/': '/governance/',
    '/governance/UNESCO_ALIGNMENT/': '/governance/',
    '/governance/TRANSPARENCY/': '/governance/transparency/',
    '/governance/foundations/': '/governance/',
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
    build: {
      rollupOptions: {
        external: ['@duckdb/duckdb-wasm'],
      },
    },
    plugins: [tailwindcss()],
  },
});
