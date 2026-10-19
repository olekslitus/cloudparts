import { ArchiveIcon, ArrowLeftRightIcon, CheckIcon, CodeIcon, ExternalLinkIcon, PencilIcon, XIcon } from 'lucide-react';
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
import StatusBadge from '@/components/StatusBadge';
import TechCard from '@/components/TechCard';
import TechGraph from '@/components/TechGraph';
import TechSection from '@/components/TechSection';
import { getCatalog } from '@/lib/catalog';
import { diagramHere, diagramLinks } from '@/lib/links';
import { meta } from '@/lib/meta';
import { href, PROVIDER_TYPES, RELATION_GROUPS, relationLabel, REPO_URL, STAGE_LABELS } from '@/lib/nav';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().technologies.map(t => ({ id: t.id }));
}

export async function generateMetadata({ params }: Params) {
  const t = getCatalog().tech((await params).id);
  return meta(t.name, t.summary);
}

export default async function TechnologyPage({ params }: Params) {
  const { id } = await params;
  const c = getCatalog();
  const t = c.tech(id);
  const cat = c.category(t.category);
  const primary = c.concept(t.concepts[0]);
  const kind = t.kind ? c.kind(t.kind) : undefined;
  const parent = t.parent ? c.tech(t.parent.id) : undefined;
  const children = c.childrenOf(t.id);
  const family = [...new Set(children.map(x => x.parent!.as))].map(as => ({ as, techs: children.filter(x => x.parent!.as === as) }));
  const archs = c.archsWithTech(t.id);
  const featured = archs[0];
  // an archived technology lists its recommended replacements first
  const recommended = (t.archived?.alternatives ?? []).map(id => c.tech(id));
  // siblings for a child (same relation first); otherwise other top-level technologies of the same concept and
  // kind, narrowed to the concept's group when it sorts them by role (an embedded database next to embedded ones)
  const group = primary.groups.find(g => g.technologies.includes(t.id));
  const grouped = (group?.technologies ?? []).filter(id => id !== t.id).map(id => c.tech(id)).filter(x => !x.parent);
  const peers = parent
    ? c.childrenOf(parent.id).filter(x => x.id !== t.id).sort((a, b) => Number(a.parent!.as !== t.parent!.as) - Number(b.parent!.as !== t.parent!.as))
    : grouped.length
      ? grouped
      : c.technologies.filter(x => x.concepts[0] === t.concepts[0] && x.kind === t.kind && !x.parent && x.id !== t.id);
  const alternatives = [...recommended, ...peers.filter(x => !recommended.includes(x))];
  const commonPath = kind ? `concepts/${primary.id}/${kind.id}/` : `concepts/${primary.id}/`;
  const commonName = (kind ?? primary).name.toLowerCase();
  const longDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const since = t.archived && longDate(t.archived.since);
  const foundation = c.foundationOf(t);
  const resources = c.resourcesAbout('technologies', t.id);
  const benchmarks = c.benchmarksAbout('technologies', t.id);
  const compares = c.comparisons.filter(m => m.technologies.includes(t.id));
  const linked = c.edges.some(e => e.from === t.id || e.to === t.id);
  const anchors = t.sections.map(s => s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  const repo = REPO_URL;
  const pill = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition hover:bg-muted';
  const outline = [
    { id: 'overview', label: 'What it is' },
    { id: 'pick', label: 'Why teams pick it' },
    { id: 'watch', label: 'Watch out for' },
    ...(family.length ? [{ id: 'family', label: `The ${t.name} family` }] : []),
    ...(alternatives.length ? [{ id: 'alternatives', label: t.archived ? 'Alternatives' : parent ? `More of the ${parent.name} family` : 'Alternatives' }] : []),
    ...(linked ? [{ id: 'fits', label: 'How it fits' }] : []),
    ...(t.snippet ? [{ id: 'code', label: 'In code' }] : []),
    ...t.sections.map((s, i) => ({ id: anchors[i], label: s.title })),
    { id: 'stack', label: 'In a real stack' },
    ...(compares.length ? [{ id: 'compared', label: 'Compared side by side' }] : []),
    ...(resources.length ? [{ id: 'resources', label: 'Worth exploring' }] : []),
    ...(benchmarks.length ? [{ id: 'benchmarks', label: 'Benchmarks' }] : []),
    ...(t.history ? [{ id: 'history', label: 'Where it came from' }] : []),
    { id: 'sources', label: 'Sources' },
  ];
  const factRow = 'grid gap-0.5 px-4 py-2.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4';
  const factLabel = 'text-sm text-muted-foreground';

  return (
    <Shell path={`technologies/${t.id}/`} section="technologies" active={t.id} outline={outline}>
      <article className="mx-auto max-w-[50rem]">
        <header>
          <Breadcrumbs items={[
            { label: 'Technologies', path: 'technologies/' },
            { label: cat.name, path: `topics/${cat.id}/#technologies` },
            { label: primary.name, path: `concepts/${primary.id}/` },
            ...(kind ? [{ label: kind.name, path: `concepts/${primary.id}/${kind.id}/` }] : []),
            ...(parent ? [{ label: parent.name, path: `technologies/${parent.id}/` }] : []),
          ]} />
          <Glyph tech={t} className="mb-4 block size-12" />
          <h1 className="flex flex-wrap items-center gap-x-3 gap-y-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{t.name}<StatusBadge tech={t} large /></h1>
          <p className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground"><Md text={t.summary} /></p>
        </header>

        <dl className="mt-6 divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10" aria-label="Key facts">
          <div className={factRow}>
            <dt className={factLabel}>What it is</dt>
            <dd className="flex flex-wrap gap-x-1 text-[15px]">
              {t.concepts.map((id, i) => <span key={id}><a href={href(`concepts/${id}/`)} className="font-medium text-brand underline-offset-4 hover:underline">{c.concept(id).name}</a>{kind && i === 0 && <span className="text-muted-foreground"> ({kind.name.toLowerCase()})</span>}{i < t.concepts.length - 1 && ','}</span>)}
            </dd>
          </div>
          {t.uses.length > 0 && (
            <div className={factRow}>
              <dt className={factLabel}>Used for</dt>
              <dd className="flex flex-wrap gap-x-1 text-[15px]">
                {t.uses.map((id, i) => <span key={id}><a href={href(`concepts/${id}/`)} className="font-medium text-brand underline-offset-4 hover:underline">{c.concept(id).name}</a>{i < t.uses.length - 1 && ','}</span>)}
              </dd>
            </div>
          )}
          {parent && (
            <div className={factRow}>
              <dt className={factLabel}>Part of</dt>
              <dd className="text-[15px]"><a href={href(`technologies/${parent.id}/`)} className="font-medium underline-offset-4 hover:underline">{relationLabel(t.parent!.as, parent.name)}</a></dd>
            </div>
          )}
          <div className={factRow}>
            <dt className={factLabel}>Type</dt>
            <dd className="text-[15px]">{PROVIDER_TYPES[t.provider]}</dd>
          </div>
          {t.vendor && (
            <div className={factRow}>
              <dt className={factLabel}>Made by</dt>
              <dd className="text-[15px]">{foundation
                ? <a href={href(foundation.path)} className="underline decoration-dotted underline-offset-4 hover:text-brand" title={foundation.type === 'company' ? `How ${foundation.name}’s products fit together` : `What it means to be a project of ${foundation.name}`}>{t.vendor}</a>
                : t.vendor}</dd>
            </div>
          )}
          {t.license && (
            <div className={factRow}>
              <dt className={factLabel}>License</dt>
              <dd className="text-[15px] leading-snug"><Md text={t.license} plain /></dd>
            </div>
          )}
          {t.status && (
            <div className={factRow}>
              <dt className={factLabel}>Status</dt>
              <dd className="text-[15px] leading-snug"><span className="font-medium">{STAGE_LABELS[t.status.stage]}</span>{t.status.since && !t.status.note.includes(t.status.since.slice(0, 4)) && <span className="text-muted-foreground"> since {longDate(t.status.since)}</span>}. <Md text={t.status.note} /></dd>
            </div>
          )}
          {t.archived && (
            <div className={factRow}>
              <dt className={factLabel}>Status</dt>
              <dd className="text-[15px]"><span className="font-medium text-(--warn)">Archived</span> since {since}</dd>
            </div>
          )}
          <div className={factRow}>
            <dt className={factLabel}>Facts checked</dt>
            <dd className="text-[15px]"><a href="#sources" className="underline-offset-4 hover:underline">{longDate(t.checked)}</a></dd>
          </div>
          <div className="flex flex-wrap gap-2 px-4 py-3">
            <a href={t.website} className={pill} rel="noopener">Website <ExternalLinkIcon className="size-3.5" /></a>
            {t.repo && <a href={t.repo} className={pill} rel="noopener"><CodeIcon className="size-3.5" />Source code{t.archived && ' (archived)'} <ExternalLinkIcon className="size-3.5" /></a>}
          </div>
        </dl>

        {t.archived && (
          <aside className="mt-8 rounded-xl border-l-4 border-(--warn) bg-(--warn)/10 px-4 py-3.5" aria-label="Archived">
            <p className="flex items-center gap-2 font-semibold text-(--warn)"><ArchiveIcon className="size-4" />Archived since {since}</p>
            <p className="mt-1.5 leading-relaxed"><Md text={t.archived.reason} /></p>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Maintained alternatives:</span>
              {recommended.map(a => (
                <a key={a.id} href={href(`technologies/${a.id}/`)} className="rounded-full border bg-background px-2.5 py-0.5 font-medium transition hover:border-foreground/30 hover:bg-muted">{a.name}</a>
              ))}
            </p>
          </aside>
        )}

        <section id="overview" className="mt-12 scroll-mt-20">
          <SectionLabel>What it is</SectionLabel>
          <div className="space-y-4 text-[17px] leading-relaxed">
            {t.intro.map((p, i) => <p key={i}><Md text={p} /></p>)}
          </div>
        </section>

        <section id="pick" className="mt-10 scroll-mt-20">
          <SectionLabel>Why teams pick it</SectionLabel>
          <ul className="space-y-2.5">
            {t.strengths.map((u, i) => (
              <li key={i} className="flex gap-2.5 leading-snug">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-(--ok)/15 text-(--ok)"><CheckIcon className="size-3.5" /></span>
                <span><Md text={u} /></span>
              </li>
            ))}
          </ul>
        </section>

        <section id="watch" className="mt-10 scroll-mt-20">
          <SectionLabel>Watch out for</SectionLabel>
          <ul className="space-y-2.5">
            {t.limits.map((u, i) => (
              <li key={i} className="flex gap-2.5 leading-snug">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-(--bad)/15 text-(--bad)"><XIcon className="size-3.5" /></span>
                <span><Md text={u} /></span>
              </li>
            ))}
          </ul>
        </section>

        {family.length > 0 && (
          <section id="family" className="mt-12 scroll-mt-20">
            <SectionLabel>The {t.name} family</SectionLabel>
            <p className="-mt-1 mb-4 text-sm text-muted-foreground">{children.length} technologies built from or on {t.name}</p>
            <div className="grid gap-6">
              {family.map(g => (
                <div key={g.as}>
                  <h3 className="mb-2 text-sm font-medium">{RELATION_GROUPS[g.as]}</h3>
                  <div className="grid gap-2">
                    {g.techs.map(x => <TechCard key={x.id} tech={x} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {alternatives.length > 0 && (
          <section id="alternatives" className="mt-12 scroll-mt-20">
            <SectionLabel>{t.archived ? 'Alternatives, recommended first' : parent ? `More of the ${parent.name} family` : 'Alternatives'}</SectionLabel>
            <a href={href(commonPath)} className="-mt-1 mb-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">What all {commonName} have in common →</a>
            <div className="grid gap-2">
              {alternatives.map(a => <TechCard key={a.id} tech={a} family={c.childrenOf(a.id)} note={parent && a.parent ? RELATION_GROUPS[a.parent.as] : undefined} />)}
            </div>
          </section>
        )}

        {linked && (
          <section id="fits" className="mt-12 scroll-mt-20">
            <SectionLabel>How it fits with other technologies</SectionLabel>
            <TechGraph tech={t} catalog={c} />
          </section>
        )}

        {t.snippet && (
          <section id="code" className="mt-12 scroll-mt-20" data-codebox>
            <div className="mb-3 flex items-center justify-between gap-2">
              <SectionLabel className="mb-0">{t.snippet.title ?? 'In code'} · {t.snippet.lang}</SectionLabel>
              <button type="button" data-copy className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs font-medium transition hover:bg-muted">Copy</button>
            </div>
            <div className="overflow-hidden rounded-xl bg-muted/50 ring-1 ring-foreground/10 [&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-relaxed">
              <Code code={t.snippet.source} lang={t.snippet.lang} />
            </div>
          </section>
        )}

        {t.sections.length > 0 && (
          <div className="mt-16 border-t pt-4">
            {t.sections.map((s, i) => <TechSection key={anchors[i]} section={s} anchor={anchors[i]} catalog={c} />)}
          </div>
        )}

        <section id="stack" className="mt-14 scroll-mt-20">
          <SectionLabel>See it in a real stack</SectionLabel>
          {featured ? (
            <>
              <a href={href(`architectures/${featured.id}/`)} className="-mt-1 mb-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{featured.title} →</a>
              <LiveModel diagram={featured.diagram} links={diagramLinks(c, featured.diagram, { tech: t.id })} highlight={diagramHere(featured.diagram, { tech: t.id })}>
                <a href={href(`playground/?a=${featured.id}`)} className="hidden h-7 items-center rounded-md border px-2.5 text-[13px] font-medium transition hover:bg-muted sm:inline-flex">Open in playground</a>
              </LiveModel>
              {archs.length > 1 && (
                <div className="mt-4 grid gap-2">
                  {archs.slice(1).map(a => <ArchCard key={a.id} arch={a} catalog={c} highlight={t.id} />)}
                </div>
              )}
            </>
          ) : (
            <a href={href('playground/')} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-5 py-4 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground">
              <span>No architecture uses {t.name} yet. Drop it into the playground and wire it up yourself.</span>
              <span className="shrink-0 font-medium">Open playground →</span>
            </a>
          )}
        </section>

        {compares.length > 0 && (
          <section id="compared" className="mt-12 scroll-mt-20">
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
          <section id="resources" className="mt-12 scroll-mt-20">
            <SectionLabel>Worth exploring</SectionLabel>
            <ResourceList resources={resources} />
            <a href={href('resources/')} className="mt-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">All resources →</a>
          </section>
        )}

        {benchmarks.length > 0 && (
          <section id="benchmarks" className="mt-12 scroll-mt-20">
            <SectionLabel>Benchmarks</SectionLabel>
            <BenchmarkList benchmarks={benchmarks} catalog={c} tech={t.id} />
            <a href={href('benchmarks/')} className="mt-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">How to read a benchmark →</a>
          </section>
        )}

        {t.history && <History history={t.history} />}

        <Sources sources={t.sources} checked={t.checked} />

        {repo && (
          <p className="mt-6 text-sm text-muted-foreground">
            <a href={`${repo}/edit/main/content/technologies/${t.id}.json`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
              <PencilIcon className="size-3.5" />Improve this page on GitHub
            </a>
          </p>
        )}
      </article>
      <CopyCode />
    </Shell>
  );
}
