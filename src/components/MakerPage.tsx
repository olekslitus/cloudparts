import { ExternalLinkIcon, LandmarkIcon, PencilIcon } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { inSentence, matureFirst } from '@/components/FoundationBadge';
import Glyph from '@/components/Glyph';
import History from '@/components/History';
import Md from '@/components/Md';
import SectionLabel from '@/components/SectionLabel';
import Shell from '@/components/Shell';
import SourceList from '@/components/SourceList';
import TechCard from '@/components/TechCard';
import TechSection from '@/components/TechSection';
import { getCatalog, type CatalogFoundation } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href, REPO_URL } from '@/lib/nav';
import { cn } from '@/lib/utils';

// The page for a foundation (/foundations/<id>/) or a company (/companies/<id>/): its text, then
// its projects (technologies whose "foundation" is it or one under it) or its products (whose "vendor" matches).
const maker = (id: string) => getCatalog().foundations.find(x => x.id === id) as CatalogFoundation;

/** The page's title and description, for its route's generateMetadata. */
export function makerMetadata(id: string) {
  const f = maker(id);
  return meta(f.name, f.summary);
}

export default function MakerPage({ id }: { id: string }) {
  const c = getCatalog();
  const f = maker(id);
  const company = f.type === 'company';
  // A company's products by topic, in handbook order. A foundation's projects by stage, most mature first; one
  // without stages (the Linux Foundation) by the foundation under it that hosts them, or by how they're hosted.
  const byTopic = (techs: typeof f.projects) => c.categories
    .map(cat => ({ cat, techs: techs.filter(t => c.concept(t.concepts[0]).category === cat.id) }))
    .filter(g => g.techs.length > 0);
  type Group = { key: string; title?: string; summary?: string; path?: string; techs: typeof f.projects; compact?: boolean };
  const children = f.children.map(id => c.foundations.find(x => x.id === id)!).sort((a, b) => b.projects.length - a.projects.length);
  const direct = f.projects.filter(t => t.foundation?.id === f.id);
  const groups: Group[] = company
    ? byTopic(f.projects).map(g => ({ key: g.cat.id, title: g.cat.name, techs: g.techs }))
    : f.stages.length
      ? matureFirst(f.stages)
        .map(st => ({ key: st.id, title: st.name, summary: st.summary, techs: f.projects.filter(t => t.foundation?.stage === st.id) }))
        .filter(g => g.techs.length)
      : [
          // a foundation under this one has its own page, so its projects are just named here
          ...children.map(x => ({ key: x.id, title: x.name, summary: x.summary, path: x.path, techs: x.projects, compact: true })),
          { key: 'direct', title: children.length ? `Hosted by ${inSentence(f.name)} itself` : undefined, techs: direct },
        ].filter(g => g.techs.length);
  const parent = f.parent ? c.foundations.find(x => x.id === f.parent) : undefined;
  const anchors = f.sections.map(s => s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  const repo = REPO_URL;
  const pill = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs';

  return (
    <Shell path={f.path} section="technologies" outline={anchors.length ? f.sections.map((s, i) => ({ id: anchors[i], label: s.title })) : undefined}>
      <article>
        <header className="max-w-3xl">
          <Breadcrumbs items={[{ label: 'All technologies', path: 'technologies/' }, { label: company ? 'Companies' : 'Foundations' }]} />
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{f.name}</h1>
          <p className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground"><Md text={f.summary} /></p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className={pill}>{f.projects.length} {company ? 'products' : 'projects'} in this catalog</span>
            {parent && <a href={href(parent.path)} className={cn(pill, 'transition hover:bg-muted')}><LandmarkIcon className="size-3" />Part of {inSentence(parent.name)}</a>}
            {children.length > 2
              ? <a href={`#fdn-${children[0].id}`} className={cn(pill, 'transition hover:bg-muted')}><LandmarkIcon className="size-3" />Includes {children.length} foundations</a>
              : children.map(x => <a key={x.id} href={href(x.path)} className={cn(pill, 'transition hover:bg-muted')}><LandmarkIcon className="size-3" />Includes {x.short ?? x.name} ({x.projects.length})</a>)}
            {matureFirst(f.stages).map(st => {
              const n = f.projects.filter(t => t.foundation?.stage === st.id).length;
              return n > 0 && <a key={st.id} href={`#stage-${st.id}`} title={st.summary} className={cn(pill, 'transition hover:bg-muted')}>{n} {st.name.toLowerCase()}</a>;
            })}
            <a href={f.website} className={cn(pill, 'transition hover:bg-muted')} rel="noopener">Website <ExternalLinkIcon className="size-3" /></a>
          </div>
        </header>

        <section className="mt-10 max-w-3xl">
          <SectionLabel>What it is</SectionLabel>
          <div className="space-y-4 text-[17px] leading-relaxed">
            {f.intro.map((p, i) => <p key={i}><Md text={p} /></p>)}
          </div>
        </section>

        <section className="mt-12">
          <SectionLabel>{company ? 'Its products' : 'Its projects'} in this catalog</SectionLabel>
          {groups.map(g => (
            <div key={g.key} id={f.stages.length ? `stage-${g.key}` : g.path ? `fdn-${g.key}` : undefined} className="mt-8 scroll-mt-20 first-of-type:mt-0">
              {g.title && (
                <h3 className="mb-2 font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {g.path ? <a href={href(g.path)} className="underline-offset-4 hover:text-foreground hover:underline">{g.title} →</a> : g.title}
                  <span className="ml-2 normal-case">{g.techs.length}</span>
                </h3>
              )}
              {g.summary && !company && <p className="-mt-1 mb-3 max-w-3xl text-sm text-muted-foreground"><Md text={g.summary} /></p>}
              {g.compact ? (
                <ul className="flex flex-wrap gap-1.5">
                  {g.techs.map(t => (
                    <li key={t.id}>
                      <a href={href(`technologies/${t.id}/`)} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-sm transition hover:border-foreground/30">
                        <Glyph tech={t} className="size-4" />{t.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid gap-2">
                  {g.techs.map(t => <TechCard key={t.id} tech={t} note={company ? undefined : t.foundation?.via} />)}
                </div>
              )}
            </div>
          ))}
        </section>

        {f.sections.length > 0 && (
          <div className="mt-16 border-t pt-10">
            <SectionLabel>In depth</SectionLabel>
            {f.sections.map((s, i) => <TechSection key={anchors[i]} section={s} anchor={anchors[i]} catalog={c} />)}
          </div>
        )}

        <History history={f.history} />

        <section className="mt-14 border-t pt-6 text-sm">
          <SectionLabel>Sources · facts checked {f.checked}</SectionLabel>
          <SourceList sources={f.sources} />
          {repo && (
            <p className="mt-6 text-muted-foreground">
              <a href={`${repo}/edit/main/content/foundations/${f.id}.json`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
                <PencilIcon className="size-3.5" />Improve this page on GitHub
              </a>
            </p>
          )}
        </section>
      </article>
    </Shell>
  );
}
