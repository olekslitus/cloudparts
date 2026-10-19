import { ExternalLinkIcon, PencilIcon } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import History from '@/components/History';
import Md from '@/components/Md';
import SectionLabel from '@/components/SectionLabel';
import Shell from '@/components/Shell';
import SourceList from '@/components/SourceList';
import TechCard from '@/components/TechCard';
import TechSection from '@/components/TechSection';
import { getCatalog, type CatalogFoundation } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { REPO_URL } from '@/lib/nav';
import { cn } from '@/lib/utils';

// The page for a foundation (/foundations/<id>/) or a company (/companies/<id>/): its text, then
// every technology whose "vendor" matches.
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
  // Its technologies grouped by topic, in handbook order.
  const groups = c.categories
    .map(cat => ({ cat, techs: f.projects.filter(t => c.concept(t.concepts[0]).category === cat.id) }))
    .filter(g => g.techs.length > 0);
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
            <div key={g.cat.id} className="mt-6 first-of-type:mt-0">
              <h3 className="mb-2 font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{g.cat.name}</h3>
              <div className="grid gap-2">
                {g.techs.map(t => <TechCard key={t.id} tech={t} />)}
              </div>
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
