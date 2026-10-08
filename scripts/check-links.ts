// Checks every link in /content: `bun run links`, or `bun run links content/technologies/kafka.json ...`.
// Fails on a dead link (404, 410, DNS errors and the like) unless the source has a Wayback Machine `archive` copy.
// Sites that block scripts (403, 429) are reported but don't fail: open those in a browser.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const BLOCKED = new Set([401, 403, 406, 429, 999]);

interface Link { file: string; url: string; archived: boolean }

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith('.json') ? [join(dir, e.name)] : [],
  );
}

function collect(file: string): Link[] {
  const out: Link[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    for (const key of ['url', 'website', 'repo', 'archive']) {
      if (typeof o[key] === 'string') out.push({ file, url: o[key] as string, archived: key === 'url' && typeof o.archive === 'string' });
    }
    Object.values(o).forEach(walk);
  };
  walk(JSON.parse(readFileSync(file, 'utf8')));
  return out;
}

async function status(url: string): Promise<number | string> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(25_000),
        headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'accept-language': 'en' },
      });
      await res.body?.cancel();
      // the Wayback Machine rate-limits bursts; back off and retry
      if (res.status === 429 && url.startsWith('https://web.archive.org/') && attempt < 3) {
        await new Promise(r => setTimeout(r, 5_000 * (attempt + 1)));
        continue;
      }
      return res.status;
    } catch (err) {
      if (attempt < 1) continue;
      return (err as Error).name === 'TimeoutError' ? 'timeout' : (err as Error).message;
    }
  }
}

const args = process.argv.slice(2);
const targets = args.length ? args.map(a => join(process.cwd(), a)) : files(join(root, 'content'));
const links = targets.flatMap(collect);
const unique = [...new Set(links.map(l => l.url))];
const results = new Map<string, number | string>();

let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < unique.length) {
    const url = unique[next++];
    results.set(url, await status(url));
  }
}));

const dead: string[] = [];
const blocked: string[] = [];
const rescued: string[] = [];
for (const l of links) {
  const s = results.get(l.url)!;
  const line = `${relative(root, l.file)}: ${s} ${l.url}`;
  if (typeof s === 'number' && s < 400) continue;
  // the Wayback Machine is often slow or busy; that says nothing about the snapshot
  const busyArchive = l.url.startsWith('https://web.archive.org/') && (typeof s === 'string' || s >= 500);
  if ((typeof s === 'number' && BLOCKED.has(s)) || busyArchive) blocked.push(line);
  else if (l.archived) rescued.push(line);
  else dead.push(line);
}

const show = (title: string, lines: string[]) => lines.length && console.log(`\n${title} (${lines.length}):\n${lines.map(l => `  - ${l}`).join('\n')}`);
show('Blocked for scripts or busy, check in a browser', blocked);
show('Gone, but an archived copy is linked', rescued);
show('Dead links: replace them or add an `archive` copy', dead);
console.log(`\n${unique.length} links checked in ${targets.length} file(s): ${dead.length} dead, ${blocked.length} blocked, ${rescued.length} archived.`);
process.exit(dead.length ? 1 : 0);
