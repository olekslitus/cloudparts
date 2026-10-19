// How one technology connects to others, as sentences that read left to right:
// "DuckDB reads and writes DuckLake", "DuckLake keeps its catalog in PostgreSQL".
// What it uses comes first, then what uses it.
import { ArrowRightIcon } from 'lucide-react';
import type { Catalog, CatalogTech } from '@/lib/catalog';
import { href } from '@/lib/nav';

const row = 'group flex flex-wrap items-baseline gap-x-1.5 rounded-lg px-3 py-2 text-[15px] transition-colors hover:bg-muted/60';

export default function TechGraph({ tech: t, catalog: c }: { tech: CatalogTech; catalog: Catalog }) {
  const uses = c.edges.filter(e => e.from === t.id).map(e => ({ other: c.tech(e.to), how: e.how }));
  const usedBy = c.edges.filter(e => e.to === t.id).map(e => ({ other: c.tech(e.from), how: e.how }));
  const groups = [
    { title: `What ${t.name} uses`, rows: uses, out: true },
    { title: `What uses ${t.name}`, rows: usedBy, out: false },
  ].filter(g => g.rows.length);
  return (
    <div className="grid gap-6">
      {groups.map(g => (
        <div key={g.title}>
          <h3 className="mb-1.5 text-sm font-medium">{g.title}</h3>
          <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            {g.rows.map((r, i) => (
              <li key={i}>
                <a href={href(`technologies/${r.other.id}/`)} className={row}>
                  {g.out
                    ? <><span>{t.name}</span><span className="text-muted-foreground">{r.how}</span><span className="font-medium group-hover:text-brand">{r.other.name}</span></>
                    : <><span className="font-medium group-hover:text-brand">{r.other.name}</span><span className="text-muted-foreground">{r.how}</span><span>{t.name}</span></>}
                  <span className="ml-auto hidden font-mono text-[10px] tracking-wide text-muted-foreground uppercase sm:inline">{c.concept(r.other.concepts[0]).name}</span>
                  <ArrowRightIcon className="size-3.5 self-center text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
