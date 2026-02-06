import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://qinnovate.com',
  integrations: [
    react(),
    sitemap(),
    pagefind(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
