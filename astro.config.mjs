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
    '/threats/': '/TARA/',
    '/niss': '/scoring/',
    '/niss/': '/scoring/',
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
