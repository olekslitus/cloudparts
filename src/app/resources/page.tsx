import KindFilter from '@/app/resources/KindFilter';
import ResourceList from '@/components/ResourceList';
import Shell from '@/components/Shell';
import { getCatalog, type CatalogResource } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { RESOURCE_KIND } from '@/lib/resources';

export const metadata = meta('Resources', 'Articles, talks and websites worth your time, each tied to the concepts and technologies it explains.');

const chip = 'rounded-full border px-3 py-1 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground aria-pressed:border-foreground/40 aria-pressed:bg-muted aria-pressed:text-foreground';

export default function Resources() {
  const c = getCatalog();
  // a resource sits under the category of the first concept, technology or architecture it names
  const categoryOf = (r: CatalogResource) =>
    r.concepts.length ? c.concept(r.concepts[0]).category
    : r.technologies.length ? c.tech(r.technologies[0]).category
    : undefined;
  const groups = [
    { id: 'big-picture', code: 'ALL', name: 'The big picture', resources: c.resources.filter(r => !categoryOf(r) && !r.architectures.length) },
    ...c.categories.map(cat => ({ id: cat.id, code: cat.code, name: cat.name, resources: c.resources.filter(r => categoryOf(r) === cat.id) })),
    { id: 'architectures', code: 'ARC', name: 'Architectures', resources: c.resources.filter(r => !categoryOf(r) && r.architectures.length) },
  ].filter(g => g.resources.length);
  const kinds = (Object.keys(RESOURCE_KIND) as CatalogResource['kind'][])
    .map(k => ({ k, n: c.resources.filter(r => r.kind === k).length }))
    .filter(x => x.n);

  return (
    <Shell path="resources/" section="resources">
      <header className="max-w-3xl">
        <div className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">{c.resources.length} resources</div>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Worth exploring</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Articles, talks and websites that go deeper than this catalog. Each one also appears on the pages of the concepts and technologies it covers.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Show only">
        <button type="button" data-kind-filter="" aria-pressed="true" className={chip}>All</button>
        {kinds.map(({ k, n }) => <button key={k} type="button" data-kind-filter={k} aria-pressed="false" className={chip}>{RESOURCE_KIND[k].plural} <span className="font-mono text-xs">{n}</span></button>)}
      </div>

      {groups.map(g => (
        <section key={g.id} id={g.id} className="mt-12 scroll-mt-20" data-group>
          <div className="mb-4 flex items-baseline gap-2 border-b pb-2">
            <h2 className="text-2xl font-semibold tracking-tight">{g.name}</h2>
          </div>
          <ResourceList resources={g.resources} catalog={c} />
        </section>
      ))}
      <KindFilter />
    </Shell>
  );
}
