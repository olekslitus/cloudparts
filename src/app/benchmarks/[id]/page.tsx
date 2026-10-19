import { CodeIcon, ExternalLinkIcon, PencilIcon, ShapesIcon, TriangleAlertIcon } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import Md from '@/components/Md';
import SectionLabel from '@/components/SectionLabel';
import Shell from '@/components/Shell';
import SourceList from '@/components/SourceList';
import TechCard from '@/components/TechCard';
import TechSection from '@/components/TechSection';
import { getCatalog, type CatalogBenchmark } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href, REPO_URL } from '@/lib/nav';
import { cn } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().benchmarks.map(b => ({ id: b.id }));
}

const find = (id: string) => getCatalog().benchmarks.find(x => x.id === id) as CatalogBenchmark;

export async function generateMetadata({ params }: Params) {
  const b = find((await params).id);
  return meta(b.name, b.summary);
}

export default async function Benchmark({ params }: Params) {
  const b = find((await params).id);
  const c = getCatalog();
  const techs = b.technologies.map(id => c.tech(id)).sort((x, y) => x.name.localeCompare(y.name));
  const anchors = b.sections.map(s => s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  const repo = REPO_URL;
  const pill = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs';

  return (
    <Shell path={`benchmarks/${b.id}/`} active={b.id} section="benchmarks" outline={anchors.length ? b.sections.map((s, i) => ({ id: anchors[i], label: s.title })) : undefined}>
      <article>
        <header className="max-w-3xl">
          <Breadcrumbs items={[{ label: 'Benchmarks', path: 'benchmarks/' }, { label: c.category(c.concept(b.concepts[0]).category).name, path: `topics/${c.concept(b.concepts[0]).category}/` }]} />
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{b.name}</h1>
          <p className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground"><Md text={b.summary} /></p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {b.concepts.map(id => (
              <a key={id} href={href(`concepts/${id}/`)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand transition hover:ring-1 hover:ring-brand/40">
                <ShapesIcon className="size-3" />{c.concept(id).name}
              </a>
            ))}
            <span className={pill}><span className="text-muted-foreground">Run by</span> {b.by}</span>
            {b.license && <span className={pill}><span className="text-muted-foreground">License</span> {b.license}</span>}
            <a href={b.website} className={cn(pill, 'transition hover:bg-muted')} rel="noopener">Results <ExternalLinkIcon className="size-3" /></a>
            {b.repo && <a href={b.repo} className={cn(pill, 'transition hover:bg-muted')} rel="noopener"><CodeIcon className="size-3" />Source code <ExternalLinkIcon className="size-3" /></a>}
          </div>
        </header>

        <div className="mt-12 grid max-w-[50rem] gap-10">
          <section>
            <SectionLabel>What it runs</SectionLabel>
            <div className="space-y-4 text-[17px] leading-relaxed">
              {b.intro.map((p, i) => <p key={i}><Md text={p} /></p>)}
            </div>
          </section>
          <section>
            <SectionLabel>Setup</SectionLabel>
            <dl className="divide-y rounded-xl border">
              {b.setup.map((s, i) => (
                <div key={i} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <dd className="text-sm leading-snug"><Md text={s.value} /></dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section className="mt-12 max-w-3xl">
          <SectionLabel>What the numbers don’t tell you</SectionLabel>
          <ul className="space-y-2.5">
            {b.caveats.map((x, i) => (
              <li key={i} className="flex gap-2.5 leading-snug">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-(--warn)/15 text-(--warn)"><TriangleAlertIcon className="size-3.5" /></span>
                <span><Md text={x} /></span>
              </li>
            ))}
          </ul>
        </section>

        {techs.length > 0 && (
          <section className="mt-12">
            <SectionLabel>Systems it covers that have a page here</SectionLabel>
            <div className="grid gap-2">
              {techs.map(t => <TechCard key={t.id} tech={t} />)}
            </div>
          </section>
        )}

        {b.sections.length > 0 && (
          <div className="mt-16 border-t pt-10">
            <SectionLabel>In depth</SectionLabel>
            {b.sections.map((s, i) => <TechSection key={i} section={s} anchor={anchors[i]} catalog={c} />)}
          </div>
        )}

        <section className="mt-14 border-t pt-6 text-sm">
          <SectionLabel>Sources · facts checked {b.checked}</SectionLabel>
          <SourceList sources={b.sources} />
          {repo && (
            <p className="mt-6 text-muted-foreground">
              <a href={`${repo}/edit/main/content/benchmarks/${b.id}.json`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
                <PencilIcon className="size-3.5" />Improve this page on GitHub
              </a>
            </p>
          )}
        </section>
      </article>
    </Shell>
  );
}
