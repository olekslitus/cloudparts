import { ArrowRightIcon } from 'lucide-react';
import Shell from '@/components/Shell';
import { getCatalog } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';

export const metadata = meta('Comparisons');

export default function Comparisons() {
  const c = getCatalog();
  return (
    <Shell path="compare/" section="compare">
      <header className="max-w-3xl">
        <div className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">{c.comparisons.length} comparisons</div>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Things that sound alike</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">Each of these pairs or trios of concepts or products gets mixed up in design reviews. Here’s how they actually differ.</p>
      </header>
      <div className="mt-10 grid max-w-[50rem] gap-2 sm:grid-cols-2">
        <a href={href('compare/technologies/')} className="group flex flex-col rounded-xl bg-brand-soft/60 p-5 ring-1 ring-brand/30 transition hover:ring-brand/60">
          <span className="flex items-center justify-between gap-3">
            <span className="text-lg font-semibold">Compare any technologies</span>
            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
          </span>
          <span className="mt-2 text-sm text-muted-foreground">Pick up to four and see their specs, workloads and trade-offs side by side.</span>
        </a>
        <a href={href('workloads/')} className="group flex flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition hover:ring-foreground/25">
          <span className="flex items-center justify-between gap-3">
            <span className="text-lg font-semibold">Find by workload</span>
            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
          </span>
          <span className="mt-2 text-sm text-muted-foreground">{c.workloads.length} workloads, from heavy writes to multi-region transactions, with the technologies built for each.</span>
        </a>
      </div>
      <div className="mt-8 grid max-w-[50rem] gap-2">
        {c.comparisons.map(m => (
          <a key={m.id} href={href(`compare/${m.id}/`)} className="group flex flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition hover:ring-foreground/25">
            <span className="flex items-center justify-between gap-3">
              <span className="text-lg font-semibold">{m.title}</span>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </span>
            <span className="mt-2 flex flex-wrap gap-1.5">
              {m.columns.map(col => <span key={col.id} className="rounded-md bg-muted px-2 py-0.5 text-xs">{col.name}</span>)}
            </span>
            <span className="mt-3 line-clamp-2 text-sm text-muted-foreground">{m.tip}</span>
          </a>
        ))}
      </div>
    </Shell>
  );
}
