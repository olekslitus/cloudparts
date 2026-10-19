import { CheckIcon, PencilIcon, RepeatIcon, TriangleAlertIcon } from 'lucide-react';
import ArchCard from '@/components/ArchCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import LiveModel from '@/components/LiveModel';
import Md from '@/components/Md';
import ResourceList from '@/components/ResourceList';
import SectionLabel from '@/components/SectionLabel';
import Shell from '@/components/Shell';
import SourceList from '@/components/SourceList';
import TechCard from '@/components/TechCard';
import { getCatalog, type CatalogArch } from '@/lib/catalog';
import { diagramLinks } from '@/lib/links';
import { meta } from '@/lib/meta';
import { href, REPO_URL } from '@/lib/nav';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().architectures.map(a => ({ id: a.id }));
}

const find = (id: string) => getCatalog().architectures.find(x => x.id === id) as CatalogArch;

export async function generateMetadata({ params }: Params) {
  const a = find((await params).id);
  return meta(a.title, a.summary);
}

export default async function Architecture({ params }: Params) {
  const a = find((await params).id);
  const c = getCatalog();
  const nodes = new Map(a.diagram.nodes.map(n => [n.id, n]));
  // generic boxes (a concept but no specific product), e.g. "Load balancer"
  const generic = [...new Set(a.diagram.nodes.filter(n => !n.tech && n.concept).map(n => n.concept!))];
  const others = c.architectures
    .filter(x => x.id !== a.id)
    .map(x => ({ x, shared: x.techs.filter(t => a.techs.includes(t)).length }))
    .filter(o => o.shared > 0)
    .sort((p, q) => q.shared - p.shared)
    .slice(0, 4)
    .map(o => o.x);
  const resources = c.resourcesAbout('architectures', a.id);
  const repo = REPO_URL;
  const chip = 'inline-flex items-center rounded-md border bg-background px-2 py-0.5 text-xs font-medium transition hover:border-foreground/30 hover:bg-muted';

  return (
    <Shell path={`architectures/${a.id}/`} active={a.id} section="architectures">
      <article>
        <header className="max-w-3xl">
          <Breadcrumbs items={[{ label: 'Architectures', path: 'architectures/' }]} />
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{a.title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground"><Md text={a.summary} /></p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-medium text-brand">Fits: {a.fits}</span>
            <span className="rounded-full border px-2.5 py-0.5 text-muted-foreground">{a.techs.length} technologies</span>
          </div>
        </header>

        <div className="mt-8">
          <LiveModel diagram={a.diagram} links={diagramLinks(c, a.diagram)} warmup={7000}>
            <a href={href(`playground/?a=${a.id}`)} className="hidden h-7 items-center rounded-md border px-2.5 text-[13px] font-medium transition hover:bg-muted sm:inline-flex">Open in playground</a>
          </LiveModel>
          <p className="mt-2 text-sm text-muted-foreground">Click any box to open its page. <a href={href(`playground/?a=${a.id}`)} className="underline underline-offset-4 hover:text-foreground">Open it in the playground</a> to rewire it, change the traffic or take parts down.</p>
        </div>

        <p className="mt-10 max-w-3xl text-[17px] leading-relaxed"><Md text={a.intro} /></p>

        <section className="mt-12">
          <SectionLabel>How it flows</SectionLabel>
          <ol className="relative space-y-6 border-l pl-8">
            {a.steps.map((s, i) => (
              <li key={i} className="relative">
                <span className="absolute top-0 -left-[45px] inline-flex size-7 items-center justify-center rounded-full border bg-background font-mono text-xs font-semibold">{i + 1}</span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 max-w-3xl leading-relaxed text-foreground/90"><Md text={s.text} /></p>
                {s.nodes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.nodes.map(id => {
                      const n = nodes.get(id)!;
                      return n.tech
                        ? <a key={id} href={href(`technologies/${n.tech}/`)} className={chip}>{c.tech(n.tech).name}</a>
                        : n.concept
                          ? <a key={id} href={href(`concepts/${n.concept}/`)} className={chip}>{n.label}</a>
                          : <span key={id} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">{n.label}</span>;
                    })}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-12 grid gap-10">
          <section>
            <SectionLabel>Why this shape works</SectionLabel>
            <ul className="space-y-2.5">
              {a.good.map((u, i) => (
                <li key={i} className="flex gap-2.5 leading-snug">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-(--ok)/15 text-(--ok)"><CheckIcon className="size-3.5" /></span>
                  <span><Md text={u} /></span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <SectionLabel>Where it strains</SectionLabel>
            <ul className="space-y-2.5">
              {a.watch.map((u, i) => (
                <li key={i} className="flex gap-2.5 leading-snug">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-(--warn)/15 text-(--warn)"><TriangleAlertIcon className="size-3" /></span>
                  <span><Md text={u} /></span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {a.swaps.length > 0 && (
          <section className="mt-12">
            <SectionLabel>Common swaps</SectionLabel>
            <ul className="grid gap-2">
              {a.swaps.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                  <RepeatIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="leading-snug"><Md text={s.text} /></p>
                    {s.techs.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.techs.map(id => <a key={id} href={href(`technologies/${id}/`)} className={chip}>{c.tech(id).name}</a>)}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12">
          <SectionLabel>Built from</SectionLabel>
          <div className="grid gap-2">
            {a.techs.map(id => {
              const t = c.tech(id);
              return <TechCard key={id} tech={t} note={c.concept(t.concepts[0]).name} />;
            })}
            {generic.map(id => {
              const p = c.concept(id);
              return (
                <a key={id} href={href(`concepts/${id}/`)} className="group flex flex-col rounded-xl border border-dashed p-4 transition hover:border-foreground/30">
                  <span className="font-medium group-hover:text-brand">{p.name}</span>
                  <span className="mt-1 text-xs font-medium text-muted-foreground">Any product will do</span>
                  <span className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">{p.summary}</span>
                </a>
              );
            })}
          </div>
        </section>

        {others.length > 0 && (
          <section className="mt-12">
            <SectionLabel>Architectures with parts in common</SectionLabel>
            <div className="grid gap-2">
              {others.map(x => <ArchCard key={x.id} arch={x} catalog={c} />)}
            </div>
          </section>
        )}

        {resources.length > 0 && (
          <section className="mt-12">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <SectionLabel className="mb-0">Worth exploring</SectionLabel>
              <a href={href('resources/')} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">All resources →</a>
            </div>
            <ResourceList resources={resources} />
          </section>
        )}

        {a.sources && (
          <section className="mt-14 border-t pt-6 text-sm">
            <SectionLabel>Sources</SectionLabel>
            <SourceList sources={a.sources} />
          </section>
        )}

        {repo && (
          <p className="mt-10 text-sm text-muted-foreground">
            <a href={`${repo}/edit/main/content/architectures/${a.id}.json`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
              <PencilIcon className="size-3.5" />Improve this page on GitHub
            </a>
          </p>
        )}
      </article>
    </Shell>
  );
}
