import { ArrowLeftRightIcon, ArrowRightIcon } from 'lucide-react';
import ArchCard from '@/components/ArchCard';
import BenchmarkList from '@/components/BenchmarkList';
import Breadcrumbs from '@/components/Breadcrumbs';
import Glyph from '@/components/Glyph';
import ResourceList from '@/components/ResourceList';
import SectionLabel from '@/components/SectionLabel';
import Shell from '@/components/Shell';
import { getCatalog } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href, PROVIDER_SHORT, STAGE_LABELS, STAGE_WARN, stageOf } from '@/lib/nav';
import { cn } from '@/lib/utils';
import Md from '@/components/Md';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().categories.map(cat => ({ id: cat.id }));
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const cat = getCatalog().category(id);
  return meta(cat.name, `${cat.blurb} Concepts, technologies, comparisons and real stacks about ${cat.name.toLowerCase()}.`);
}

export default async function Topic({ params }: Params) {
  const { id } = await params;
  const c = getCatalog();
  const t = c.topic(id);
  const { category: cat, part } = t;
  const counts = [
    [t.concepts.length, 'concept'],
    [t.technologies.length, 'technology'],
    [t.comparisons.length, 'comparison'],
    [t.architectures.length, 'real stack'],
  ] as const;
  const plural = (n: number, word: string) => `${n} ${n === 1 ? word : word === 'technology' ? 'technologies' : `${word}s`}`;

  return (
    <Shell path={`topics/${cat.id}/`} active={cat.id} section="topics">
      <header className="max-w-3xl">
        <Breadcrumbs items={[{ label: 'Concepts', path: 'concepts/' }, { label: part.name, path: `concepts/#${part.id}` }]} />
        <Glyph icon={cat.icon} className="mb-4 block size-11" />
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{cat.name}</h1>
        <p className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground">{cat.blurb}</p>
        <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">{counts.filter(([n]) => n > 0).map(([n, w]) => plural(n, w)).join(' · ')}</p>
      </header>

      <section className="mt-10" aria-labelledby="concepts">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <SectionLabel className="mb-0"><span id="concepts">Concepts</span></SectionLabel>
          <a href={href(`concepts/${t.concepts[0].id}/`)} className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Start with {t.concepts[0].name}<ArrowRightIcon className="size-3.5" /></a>
        </div>
        <ol className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          {t.concepts.map(p => {
            const n = c.techsFor(p.id).length + c.usedFor(p.id).length;
            return (
              <li key={p.id}>
                <a href={href(`concepts/${p.id}/`)} className="group flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60" style={p.parent ? { paddingLeft: `${16 + 28 * c.ancestors(p.id).length}px` } : undefined}>
                  <Glyph icon={p.icon} className="mt-0.5 size-5" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium group-hover:text-brand">{p.name}</span>
                      {n > 0 && <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{plural(n, 'technology')}</span>}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted-foreground"><Md text={p.summary} plain /></span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>

      {t.technologies.length > 0 && (
        <section className="mt-12" aria-labelledby="technologies">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <SectionLabel className="mb-0"><span id="technologies">Technologies</span></SectionLabel>
            <span className="text-sm text-muted-foreground">Grouped by the concept each one mainly implements</span>
          </div>
          <div className="grid gap-5">
            {t.concepts.map(p => ({ p, techs: [...t.technologies.filter(x => x.concepts[0] === p.id && !x.parent), ...c.usedFor(p.id)] })).filter(g => g.techs.length).map(({ p, techs }) => (
              <div key={p.id}>
                <a href={href(`concepts/${p.id}/`)} className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-brand"><Glyph icon={p.icon} className="size-4" />{p.name}</a>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {techs.map(x => (
                    <li key={x.id}>
                      <a href={href(`technologies/${x.id}/`)} title={x.summary} className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-0.5 text-sm transition hover:border-foreground/30 hover:bg-muted">
                        <Glyph tech={x} className="size-3.5" />
                        <span className={cn(x.archived && 'text-muted-foreground line-through decoration-muted-foreground/50')}>{x.name}</span>
                        <span className={cn('font-mono text-[9px] uppercase', stageOf(x) ? (STAGE_WARN.has(stageOf(x)!) ? 'text-(--warn)' : 'text-brand') : 'text-muted-foreground')}>{stageOf(x) ? STAGE_LABELS[stageOf(x)!] : PROVIDER_SHORT[x.provider]}</span>
                        {c.childrenOf(x.id).length > 0 && <span className="font-mono text-[9px] text-brand">+{c.childrenOf(x.id).length}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {t.comparisons.length > 0 && (
        <section className="mt-12" aria-labelledby="compare">
          <SectionLabel><span id="compare">Commonly confused</span></SectionLabel>
          <div className="grid gap-2">
            {t.comparisons.map(m => (
              <a key={m.id} href={href(`compare/${m.id}/`)} className="group flex min-w-0 items-center justify-between gap-3 rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/10 transition hover:ring-foreground/25">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-medium"><ArrowLeftRightIcon className="size-3.5 shrink-0 text-muted-foreground" />{m.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{m.columns.map(col => col.name).join(' · ')}</span>
                </span>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </a>
            ))}
          </div>
        </section>
      )}

      {t.architectures.length > 0 && (
        <section className="mt-12" aria-labelledby="stacks">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <SectionLabel className="mb-0"><span id="stacks">See it in a real stack</span></SectionLabel>
            <span className="text-sm text-muted-foreground">Architectures that use {cat.name.toLowerCase()} concepts</span>
          </div>
          <div className="grid gap-2">
            {t.architectures.map(a => <ArchCard key={a.id} arch={a} catalog={c} />)}
          </div>
        </section>
      )}

      {t.resources.length > 0 && (
        <section className="mt-12">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <SectionLabel className="mb-0">Worth exploring</SectionLabel>
            <a href={href('resources/')} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">All resources →</a>
          </div>
          <ResourceList resources={t.resources} />
        </section>
      )}

      {t.benchmarks.length > 0 && (
        <section className="mt-12">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <SectionLabel className="mb-0">Benchmarks</SectionLabel>
            <a href={href('benchmarks/')} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">How to read a benchmark →</a>
          </div>
          <BenchmarkList benchmarks={t.benchmarks} catalog={c} />
        </section>
      )}
    </Shell>
  );
}
