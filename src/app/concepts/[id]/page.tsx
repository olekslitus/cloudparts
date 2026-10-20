import { ArrowLeftRightIcon, CheckIcon, PencilIcon, XIcon } from 'lucide-react';
import ArchCard from '@/components/ArchCard';
import BenchmarkList from '@/components/BenchmarkList';
import Breadcrumbs from '@/components/Breadcrumbs';
import Code from '@/components/Code';
import CopyCode from '@/components/CopyCode';
import Glyph from '@/components/Glyph';
import History from '@/components/History';
import LiveModel from '@/components/LiveModel';
import Md from '@/components/Md';
import ResourceList from '@/components/ResourceList';
import SectionLabel from '@/components/SectionLabel';
import Shell from '@/components/Shell';
import Sources from '@/components/Sources';
import TechListing from '@/components/TechListing';
import TechSection from '@/components/TechSection';
import { getCatalog } from '@/lib/catalog';
import { diagramLinks } from '@/lib/links';
import { meta } from '@/lib/meta';
import { href, REPO_URL } from '@/lib/nav';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().concepts.map(p => ({ id: p.id }));
}

export async function generateMetadata({ params }: Params) {
  const p = getCatalog().concept((await params).id);
  return meta(p.name, p.summary);
}

export default async function ConceptPage({ params }: Params) {
  const { id } = await params;
  const c = getCatalog();
  const p = c.concept(id);
  const cat = c.category(p.category);
  const part = c.part(cat.part);
  const above = c.ancestors(p.id);
  const below = c.subconcepts(p.id);
  const compares = c.comparisons.filter(m => m.concepts.includes(p.id));
  const techs = c.techsFor(p.id);
  const archs = c.archsWithConcept(p.id);
  const resources = c.resourcesAbout('concepts', p.id);
  const benchmarks = c.benchmarksAbout('concepts', p.id);
  const repo = REPO_URL;
  const providers = p.providers && [
    ['AWS', p.providers.aws],
    ['Google Cloud', p.providers.gcp],
    ['Azure', p.providers.azure],
    ['Open source & others', p.providers.oss],
  ];
  const anchors = p.sections.map(s => s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  const top = techs.filter(t => !t.parent);
  // kinds group the technologies with a page each; otherwise the concept's own groups, then everything else
  const grouped = new Set(p.groups.flatMap(g => g.technologies));
  const groups = p.kinds.length
    ? p.kinds.map(k => ({ name: k.name, summary: k.summary, path: `concepts/${p.id}/${k.id}/`, techs: c.techsOfKind(k.id).filter(t => !t.parent) }))
    : p.groups.length
      ? [
          ...p.groups.map(g => ({ name: g.name, summary: g.summary, techs: g.technologies.map(id => c.tech(id)) })),
          ...(top.some(t => !grouped.has(t.id)) ? [{ name: 'Other', techs: top.filter(t => !grouped.has(t.id)) }] : []),
        ]
      : [{ techs: top }];
  // products of other kinds that are used for this one (Redis for caching), grouped by what they are
  const users = c.usedFor(p.id);
  const usedGroups = [...new Set(users.map(t => t.concepts[0]))].map(id => ({
    name: c.concept(id).name, path: `concepts/${id}/`, techs: users.filter(t => t.concepts[0] === id),
  }));
  const techCount = top.length;
  const usedTitle = `${techCount ? 'Also used' : 'Used'} for ${p.name.toLowerCase()}`;
  const outline = [
    { id: 'how', label: 'How it works' },
    { id: 'when', label: 'Reach for it when' },
    { id: 'avoid', label: 'Think twice when' },
    { id: 'example', label: 'A real example' },
    ...(below.length ? [{ id: 'more', label: `More on ${p.name.toLowerCase()}` }] : []),
    ...(techCount ? [{ id: 'technologies', label: p.kinds.length ? `Kinds of ${p.name.toLowerCase()}` : 'Technologies' }] : []),
    ...(users.length ? [{ id: 'used-for', label: usedTitle }] : []),
    ...(providers ? [{ id: 'providers', label: 'What each provider calls it' }] : []),
    ...p.sections.map((s, i) => ({ id: anchors[i], label: s.title })),
    ...(archs.length ? [{ id: 'stack', label: 'In a real stack' }] : []),
    ...(p.snippet ? [{ id: 'code', label: 'In code' }] : []),
    ...(resources.length ? [{ id: 'resources', label: 'Worth exploring' }] : []),
    ...(benchmarks.length ? [{ id: 'benchmarks', label: 'Benchmarks' }] : []),
    { id: 'confused', label: 'Often confused with' },
    ...(p.history ? [{ id: 'history', label: 'Where it came from' }] : []),
    { id: 'sources', label: 'Sources' },
  ];

  return (
    <Shell path={`concepts/${p.id}/`} section="concepts" active={p.id} outline={outline}>
      <article className="mx-auto max-w-[50rem]">
        <header>
          <Breadcrumbs items={[{ label: part.name, path: `concepts/#${part.id}` }, { label: cat.name, path: `topics/${cat.id}/` }, ...above.map(a => ({ label: a.name, path: `concepts/${a.id}/` }))]} />
          <Glyph icon={p.icon} className="mb-4 block size-11" />
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{p.name}</h1>
          <p className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground"><Md text={p.summary} /></p>
          {techCount + users.length > 0 && <a href={techCount ? '#technologies' : '#used-for'} className="mt-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{techCount + users.length} {techCount + users.length === 1 ? 'technology' : 'technologies'} on this page ↓</a>}
        </header>

        {p.diagram && (
          <div className="mt-8">
            <LiveModel diagram={p.diagram} links={diagramLinks(c, p.diagram, { concept: p.id })} />
          </div>
        )}

        <section id="how" className="mt-12 scroll-mt-20">
          <SectionLabel>How it works</SectionLabel>
          <p className="text-[17px] leading-relaxed"><Md text={p.howItWorks} /></p>
          <div className="mt-6 rounded-xl border-l-4 border-(--p2) bg-muted/50 px-4 py-3.5">
            <span className="mb-1.5 block font-mono text-[11px] font-medium tracking-widest text-(--p2) uppercase">Think of it as</span>
            <p className="leading-relaxed text-foreground/90 italic"><Md text={p.analogy} /></p>
          </div>
        </section>

        <section id="when" className="mt-10 scroll-mt-20">
          <SectionLabel>Reach for it when</SectionLabel>
          <ul className="space-y-2.5">
            {p.useWhen.map((u, i) => (
              <li key={i} className="flex gap-2.5 leading-snug">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-(--ok)/15 text-(--ok)"><CheckIcon className="size-3.5" /></span>
                <span><Md text={u} /></span>
              </li>
            ))}
          </ul>
        </section>

        <section id="avoid" className="mt-10 scroll-mt-20">
          <SectionLabel>Think twice when</SectionLabel>
          <ul className="space-y-2.5">
            {p.avoidWhen.map((u, i) => (
              <li key={i} className="flex gap-2.5 leading-snug">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-(--bad)/15 text-(--bad)"><XIcon className="size-3.5" /></span>
                <span><Md text={u} /></span>
              </li>
            ))}
          </ul>
        </section>

        <section id="example" className="mt-12 scroll-mt-20 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <SectionLabel>A real example</SectionLabel>
          <p className="text-[17px] leading-relaxed"><Md text={p.example} /></p>
        </section>

        {below.length > 0 && (
          <section id="more" className="mt-14 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">More on {p.name.toLowerCase()}</h2>
            <p className="mt-1 mb-5 text-muted-foreground">Narrower ideas that build on this one.</p>
            <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              {below.map(x => (
                <li key={x.id}>
                  <a href={href(`concepts/${x.id}/`)} className="group flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60">
                    <Glyph icon={x.icon} className="mt-0.5 size-5" />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium group-hover:text-brand">{x.name}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-muted-foreground"><Md text={x.summary} plain /></span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {techCount > 0 && (
          <section id="technologies" className="mt-14 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">{p.kinds.length ? `Kinds of ${p.name.toLowerCase()}` : 'Technologies'}</h2>
            <p className="mt-1 mb-5 text-muted-foreground">Specific products, and what each does differently.</p>
            <TechListing catalog={c} concept={p.id} groups={groups} />
          </section>
        )}

        {users.length > 0 && (
          <section id="used-for" className="mt-14 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">{usedTitle}</h2>
            <p className="mt-1 mb-5 text-muted-foreground">{techCount ? 'Products of other kinds that are often used this way' : `${p.name} is something products do, not a kind of product. These are often used for it`}, grouped by what they are.</p>
            <TechListing catalog={c} concept={p.id} groups={usedGroups} />
          </section>
        )}

        {providers && (
          <section id="providers" className="mt-14 scroll-mt-20">
            <SectionLabel>What each provider calls it</SectionLabel>
            <dl className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              {providers.map(([label, value]) => (
                <div key={label} className="grid gap-0.5 px-4 py-2.5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-[15px]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {p.sections.length > 0 && (
          <div className="mt-4">
            {p.sections.map((s, i) => <TechSection key={anchors[i]} section={s} anchor={anchors[i]} catalog={c} />)}
          </div>
        )}

        {archs.length > 0 && (
          <section id="stack" className="mt-14 scroll-mt-20">
            <SectionLabel>See it in a real stack</SectionLabel>
            <p className="-mt-1 mb-3 text-sm text-muted-foreground">Architectures that use {p.name.toLowerCase()}</p>
            <div className="grid gap-2">
              {archs.map(a => <ArchCard key={a.id} arch={a} catalog={c} />)}
            </div>
          </section>
        )}

        {p.snippet && (
          <section id="code" className="mt-12 scroll-mt-20" data-codebox>
            <div className="mb-3 flex items-center justify-between gap-2">
              <SectionLabel className="mb-0">In code · {p.snippet.lang}</SectionLabel>
              <button type="button" data-copy className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs font-medium transition hover:bg-muted">Copy</button>
            </div>
            <div className="overflow-hidden rounded-xl bg-muted/50 ring-1 ring-foreground/10 [&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-relaxed">
              <Code code={p.snippet.source} lang={p.snippet.lang} />
            </div>
          </section>
        )}

        {resources.length > 0 && (
          <section id="resources" className="mt-12 scroll-mt-20">
            <SectionLabel>Worth exploring</SectionLabel>
            <ResourceList resources={resources} />
            <a href={href('resources/')} className="mt-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">All resources →</a>
          </section>
        )}

        {benchmarks.length > 0 && (
          <section id="benchmarks" className="mt-12 scroll-mt-20">
            <SectionLabel>Benchmarks</SectionLabel>
            <BenchmarkList benchmarks={benchmarks} catalog={c} />
            <a href={href('benchmarks/')} className="mt-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">How to read a benchmark →</a>
          </section>
        )}

        <section id="confused" className="mt-12 scroll-mt-20 border-t pt-6">
          <SectionLabel>Often confused with</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {p.related.map(id => (
              <a key={id} href={href(`concepts/${id}/`)} className="inline-flex items-center rounded-lg border bg-background px-3 py-1.5 text-sm font-medium transition hover:border-foreground/30 hover:bg-muted">{c.concept(id).name}</a>
            ))}
            {compares.map(m => (
              <a key={m.id} href={href(`compare/${m.id}/`)} className="inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 text-sm font-medium transition hover:border-foreground/30 hover:bg-muted">
                <ArrowLeftRightIcon className="size-3.5 text-muted-foreground" />{m.title}
              </a>
            ))}
          </div>
        </section>

        {p.history && <History history={p.history} />}

        <Sources sources={p.sources} />

        {repo && (
          <p className="mt-8 text-sm text-muted-foreground">
            <a href={`${repo}/edit/main/content/concepts/${p.id}.json`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
              <PencilIcon className="size-3.5" />Improve this page on GitHub
            </a>
          </p>
        )}
      </article>
      <CopyCode />
    </Shell>
  );
}
