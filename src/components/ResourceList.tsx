// Links worth exploring: articles, videos, websites. Each card opens the resource itself.
import Md from '@/components/Md';
import type { Catalog, CatalogResource } from '@/lib/catalog';
import { href } from '@/lib/nav';
import { RESOURCE_KIND } from '@/lib/resources';

interface Props {
  resources: CatalogResource[];
  /** Pass the catalog to show what each resource is about, as links. */
  catalog?: Catalog;
}

const when = (d?: string) => {
  if (!d || d.length === 4) return d;
  return new Date(`${d.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

export default function ResourceList({ resources, catalog: c }: Props) {
  const topics = (r: CatalogResource) => c ? [
    ...r.concepts.map(id => ({ path: `concepts/${id}/`, name: c.concept(id).name })),
    ...r.technologies.map(id => ({ path: `technologies/${id}/`, name: c.tech(id).name })),
    ...r.architectures.map(id => ({ path: `architectures/${id}/`, name: c.architectures.find(a => a.id === id)!.title })),
  ] : [];
  return (
    <div className="grid gap-3">
      {resources.map(r => {
        const { label, Icon } = RESOURCE_KIND[r.kind];
        const about = topics(r);
        return (
          <div key={r.id} className="group relative flex flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition hover:ring-foreground/25" data-kind={r.kind}>
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
              <Icon className="size-3.5" />{label}{r.published && <span>· {when(r.published)}</span>}
            </span>
            <a href={r.url} rel="noopener" className="mt-1.5 font-medium text-pretty after:absolute after:inset-0 after:rounded-xl group-hover:text-brand">{r.title}</a>
            <span className="mt-0.5 text-xs text-muted-foreground">{r.by}</span>
            <span className="mt-2 text-sm leading-snug text-muted-foreground"><Md text={r.summary} /></span>
            {about.length > 0 && (
              <span className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                {about.map(t => <a key={t.path} href={href(t.path)} className="rounded-md bg-muted px-2 py-0.5 text-xs transition hover:bg-brand-soft hover:text-brand">{t.name}</a>)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
