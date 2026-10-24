import { ArrowLeftRightIcon, ShapesIcon } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import Md from '@/components/Md';
import SectionLabel from '@/components/SectionLabel';
import Shell from '@/components/Shell';
import SourceList from '@/components/SourceList';
import TechCard from '@/components/TechCard';
import { getCatalog, type CatalogWorkload } from '@/lib/catalog';
import { lucide } from '@/lib/glyphs';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().workloads.map(w => ({ id: w.id }));
}

const find = (id: string) => getCatalog().workloads.find(x => x.id === id) as CatalogWorkload;

export async function generateMetadata({ params }: Params) {
  const w = find((await params).id);
  return meta(w.name, w.summary);
}

export default async function WorkloadPage({ params }: Params) {
  const w = find((await params).id);
  const c = getCatalog();
  const Icon = lucide(w.icon);
  // by the concept each technology is listed under, in reading order
  const groups = c.concepts
    .map(p => ({ concept: p, items: w.techs.filter(x => x.tech.concepts[0] === p.id) }))
    .filter(g => g.items.length);
  const live = w.techs.filter(x => !x.tech.archived).map(x => x.tech.id);

  return (
    <Shell path={`workloads/${w.id}/`} active={w.id} section="workloads">
      <article>
        <header className="max-w-3xl">
          <Breadcrumbs items={[{ label: 'Workloads', path: 'workloads/' }]} />
          <Icon className="mb-4 block size-10 text-brand" aria-hidden />
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{w.name}</h1>
          <p className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground"><Md text={w.summary} /></p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {w.concepts.map(id => (
              <a key={id} href={href(`concepts/${id}/`)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand transition hover:ring-1 hover:ring-brand/40">
                <ShapesIcon className="size-3" />{c.concept(id).name}
              </a>
            ))}
          </div>
        </header>

        <section className="mt-10 max-w-3xl">
          <SectionLabel>What it asks of a system</SectionLabel>
          <div className="space-y-4 text-[17px] leading-relaxed">
            {w.body.map((p, i) => <p key={i}><Md text={p} /></p>)}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <SectionLabel className="mb-0">Good at it · {w.techs.length}</SectionLabel>
            {live.length > 1 && (
              <a href={`${href('compare/technologies/')}?ids=${live.slice(0, 4).join(',')}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                <ArrowLeftRightIcon className="size-3.5" />Compare side by side
              </a>
            )}
          </div>
          {groups.length === 0 && <p className="text-muted-foreground">No technology lists this workload yet.</p>}
          <div className="grid gap-8">
            {groups.map(g => (
              <div key={g.concept.id}>
                <h2 className="mb-2 text-sm font-medium"><a href={href(`concepts/${g.concept.id}/`)} className="hover:text-brand">{g.concept.name}</a></h2>
                <div className="grid gap-2">
                  {g.items.map(x => <TechCard key={x.tech.id} tech={x.tech} note={x.why} />)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t pt-6 text-sm">
          <SectionLabel>Sources</SectionLabel>
          <SourceList sources={w.sources} />
          <p className="mt-4 text-muted-foreground">Why each technology is listed comes from the sources on its own page.</p>
        </section>
      </article>
    </Shell>
  );
}
