// Benchmark cards. Each card opens the benchmark's page here, which explains how to read its results.
import { GaugeIcon } from 'lucide-react';
import Md from '@/components/Md';
import type { Catalog, CatalogBenchmark } from '@/lib/catalog';
import { href } from '@/lib/nav';

interface Props {
  benchmarks: CatalogBenchmark[];
  catalog: Catalog;
  /** On a technology page: names that technology on the card. */
  tech?: string;
}

export default function BenchmarkList({ benchmarks, catalog: c, tech }: Props) {
  return (
    <div className="grid gap-3">
      {benchmarks.map(b => (
        <a key={b.id} href={href(`benchmarks/${b.id}/`)} className="group flex flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition hover:ring-foreground/25">
          <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            <GaugeIcon className="size-3.5" />Benchmark · {b.by}
          </span>
          <span className="mt-1.5 font-medium group-hover:text-brand">{b.name}</span>
          <span className="mt-2 text-sm leading-snug text-muted-foreground"><Md text={b.summary} /></span>
          <span className="mt-3 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            {tech ? `Includes ${c.tech(tech).name}` : `${b.technologies.length} systems in this catalog`} · {b.caveats.length} caveats to read first
          </span>
        </a>
      ))}
    </div>
  );
}
