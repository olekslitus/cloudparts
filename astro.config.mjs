// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// SITE and BASE_PATH are set by the GitHub Pages workflow, so the same build works
// on a project page (https://user.github.io/cloudparts/) or a custom domain (base "/").
export default defineConfig({
  site: process.env.SITE,
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
