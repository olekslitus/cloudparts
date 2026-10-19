// `bun run preview`: serves the built site in out/ on http://localhost:4321, as a static host would.
import { file } from 'bun';

const root = new URL('../out/', import.meta.url).pathname;
const port = Number(process.env.PORT ?? 4321);

Bun.serve({
  port,
  async fetch(req) {
    const path = decodeURIComponent(new URL(req.url).pathname);
    if (path.includes('..')) return new Response('Bad request', { status: 400 });
    for (const candidate of [path, `${path}/index.html`, `${path}index.html`, `${path}.html`]) {
      const f = file(root + candidate);
      if (!candidate.endsWith('/') && (await f.exists())) return new Response(f);
    }
    if (!path.endsWith('/') && (await file(`${root}${path}/index.html`).exists())) return Response.redirect(`${path}/`, 308);
    return new Response(file(`${root}404.html`), { status: 404, headers: { 'content-type': 'text/html' } });
  },
});
console.log(`Serving out/ at http://localhost:${port}`);
