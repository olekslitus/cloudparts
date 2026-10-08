// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Deployed on Vercel at the domain root. Set SITE and BASE_PATH to host it elsewhere,
// e.g. under a sub-path like https://user.github.io/cloudparts/.
export default defineConfig({
  site: process.env.SITE || 'https://cloudparts.vercel.app',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
