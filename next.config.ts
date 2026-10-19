import type { NextConfig } from 'next';

// A fully static site: `next build` writes every page to out/. Deployed on Vercel at the domain root.
// Set BASE_PATH (e.g. /cloudparts) to host it under a sub-path instead, such as on GitHub Pages.
const basePath = (process.env.BASE_PATH ?? '').replace(/\/$/, '');

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true },
  // page scripts run once per page load; Strict Mode's double renders in dev would trip them
  reactStrictMode: false,
  // don't write an AGENTS.md into the repo on `next dev`
  agentRules: false,
};

export default config;
