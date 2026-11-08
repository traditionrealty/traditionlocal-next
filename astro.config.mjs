import { defineConfig } from 'astro/config';

// The GitHub Pages workflow sets SITE_URL and BASE_PATH.
// Preview:  https://traditionrealty.github.io/traditionlocal-next
// Live:     https://www.traditionlocal.com
export default defineConfig({
  site: process.env.SITE_URL || 'https://www.traditionlocal.com',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
