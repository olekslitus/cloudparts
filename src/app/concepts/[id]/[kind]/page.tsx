import { ArrowLeftRightIcon, PencilIcon } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { FIGURES } from '@/components/figures';
import Md from '@/components/Md';
import ResourceList from '@/components/ResourceList';
import SectionLabel from '@/components/SectionLabel';
import Shell from '@/components/Shell';
import SourceList from '@/components/SourceList';
import TechListing from '@/components/TechListing';
import { getCatalog } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href, REPO_URL } from '@/lib/nav';

type Params = { params: Promise<{ id: string; kind: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().concepts.flatMap(p => p.kinds.map(k => ({ id: p.id, kind: k.id })));
}

export async function generateMetadata({ params }: Params) {
  const c = getCatalog();
  const k = c.kind((await params).kind);
  return meta(`${k.name} · ${c.concept(k.concept).name}`, k.summary);
}

export default async function KindPage({ params }: Params) {
  const { kind } = await params;
  const c = getCatalog();
  const k = c.kind(kind);
  const p = c.concept(k.concept);
  const cat = c.category(p.category);
  const part = c.part(cat.part);
  const techs = c.techsOfKind(k.id);
  const listed = techs.filter(t => t.kind === k.id && !t.parent);
  const also = techs.filter(t => t.kind !== k.id);
  const ids = new Set(techs.map(t => t.id));
  const compares = c.comparisons.filter(m => m.technologies.some(id => ids.has(id)));
  const resources = c.resources.filter(r => r.technologies.some(id => ids.has(id)));
  const repo = REPO_URL;
  const Figure = k.figure && FIGURES[k.figure];

  return (
    <Shell path={`concepts/${p.id}/${k.id}/`} section="kinds" active={k.id}>
      <article className="mx-auto max-w-[50rem]">
        <header>
          <Breadcrumbs items={[{ label: part.name, path: `concepts/#${part.id}` }, { label: cat.name, path: `topics/${cat.id}/` }, ...[...c.ancestors(p.id), p].map(a => ({ label: a.name, path: `concepts/${a.id}/` }))]} />
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{k.name}</h1>
          <p className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground"><Md text={k.summary} /></p>
        </header>

        <section className="mt-10">
          <SectionLabel>How they work</SectionLabel>
          <div className="space-y-4 text-[17px] leading-relaxed">
            {k.body.map((t, i) => <p key={i}><Md text={t} /></p>)}
          </div>
          {Figure && <div className="mt-8"><Figure /></div>}
        </section>

        {listed.length + also.length > 0 && (
          <section className="mt-12">
            <SectionLabel>Technologies</SectionLabel>
            <a href={href(`concepts/${p.id}/`)} className="-mt-1 mb-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">What all {p.name.toLowerCase()} have in common →</a>
            <TechListing catalog={c} concept={p.id} groups={[
              ...(listed.length ? [{ name: also.length ? k.name : undefined, techs: listed }] : []),
              ...(also.length ? [{ name: `Also ${k.name.toLowerCase()}`, techs: also }] : []),
            ]} />
          </section>
        )}

        {compares.length > 0 && (
          <section className="mt-12">
            <SectionLabel>Compared side by side</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {compares.map(m => (
                <a key={m.id} href={href(`compare/${m.id}/`)} className="inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 text-sm font-medium transition hover:border-foreground/30 hover:bg-muted">
                  <ArrowLeftRightIcon className="size-3.5 text-muted-foreground" />{m.title}
                </a>
              ))}
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

        <section className="mt-14 border-t pt-6 text-sm">
          <SectionLabel>Sources</SectionLabel>
          <SourceList sources={k.sources} />
        </section>

        {repo && (
          <p className="mt-8 text-sm text-muted-foreground">
            <a href={`${repo}/edit/main/content/concepts/${p.id}.json`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
              <PencilIcon className="size-3.5" />Improve this page on GitHub
            </a>
          </p>
        )}
      </article>
    </Shell>
  );
}
