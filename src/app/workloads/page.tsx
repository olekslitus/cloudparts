import { ArrowRightIcon } from 'lucide-react';
import Shell from '@/components/Shell';
import { getCatalog } from '@/lib/catalog';
import { lucide } from '@/lib/glyphs';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';

export const metadata = meta('Workloads', 'What a system has to be good at, from heavy writes to multi-region transactions, and which technologies handle each one well.');

export default function Workloads() {
  const c = getCatalog();
  // a workload sits under the category of its first concept
  const groups = c.categories
    .map(cat => ({ ...cat, workloads: c.workloads.filter(w => c.concept(w.concepts[0]).category === cat.id) }))
    .filter(g => g.workloads.length);

  return (
    <Shell path="workloads/" section="workloads">
      <header className="max-w-3xl">
        <div className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">{c.workloads.length} workloads</div>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Good for what?</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Products in one concept rarely compete on everything. Each workload here says what it asks of a system and lists the technologies built to handle it, with the reason. Pick one, then <a href={href('compare/technologies/')} className="underline underline-offset-4 hover:text-foreground">compare the candidates side by side</a>.
        </p>
      </header>
      {groups.map(g => (
        <section key={g.id} id={g.id} className="mt-12 scroll-mt-20">
          <div className="mb-4 flex items-baseline gap-2 border-b pb-2">
            <h2 className="text-2xl font-semibold tracking-tight">{g.name}</h2>
          </div>
          <div className="grid max-w-[50rem] gap-2">
            {g.workloads.map(w => {
              const Icon = lucide(w.icon);
              return (
                <a key={w.id} href={href(`workloads/${w.id}/`)} className="group flex gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition hover:ring-foreground/25">
                  <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                  <span className="grid flex-1 gap-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{w.name}</span>
                      <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted-foreground">{w.techs.length}<ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5 group-hover:text-foreground" /></span>
                    </span>
                    <span className="text-sm text-muted-foreground">{w.summary}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </Shell>
  );
}
