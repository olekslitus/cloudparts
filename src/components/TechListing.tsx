// A concept's technologies, as grouped rows or as one sortable table to compare them side by side.
import { membershipLabel } from '@/components/FoundationBadge';
import Glyph from '@/components/Glyph';
import SortableTable from '@/components/SortableTable';
import StatusBadge from '@/components/StatusBadge';
import TechCard from '@/components/TechCard';
import TechListingScript from '@/components/TechListingScript';
import type { Catalog, CatalogTech } from '@/lib/catalog';
import { href, PROVIDER_TYPES, stageOf } from '@/lib/nav';

interface Props {
  catalog: Catalog;
  /** The concept the page is about; technologies mainly about another concept say so. */
  concept: string;
  groups: { name?: string; summary?: string; path?: string; techs: CatalogTech[] }[];
}

const th = 'px-3 py-2.5 text-left align-bottom font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase';
const sortBtn = 'inline-flex items-center gap-1 uppercase hover:text-foreground';

export default function TechListing({ catalog: c, concept, groups }: Props) {
  const all = groups.flatMap(g => g.techs.map(t => ({ t, group: g.name })));
  const named = groups.some(g => g.name);
  // "Mainly <concept>" on rows filed under another concept, unless the group heading already says so
  const also = (t: CatalogTech, group?: string) => (t.concepts[0] !== concept && c.concept(t.concepts[0]).name !== group ? c.concept(t.concepts[0]).name : undefined);
  const columns = ['Technology', ...(named ? ['Group'] : []), 'Type', 'Made by', 'License', 'Checked'];

  return (
    <div data-listing>
      {all.length > 3 && (
        <div className="mb-4 inline-flex rounded-lg border p-0.5 text-sm" role="group" aria-label="View">
          <button type="button" data-view="list" aria-pressed="true" className="rounded-md px-3 py-1 aria-pressed:bg-muted aria-pressed:font-medium">List</button>
          <button type="button" data-view="table" aria-pressed="false" className="rounded-md px-3 py-1 aria-pressed:bg-muted aria-pressed:font-medium">Compare in a table</button>
        </div>
      )}

      <div data-pane="list" className="grid gap-8">
        {groups.map((g, i) => (
          <div key={g.name ?? i}>
            {g.name && (
              <div className="mb-3">
                <h3 className="font-semibold">{g.path ? <a href={href(g.path)} className="underline-offset-4 hover:text-brand hover:underline">{g.name} →</a> : g.name}</h3>
                {g.summary && <p className="mt-0.5 text-sm text-muted-foreground">{g.summary}</p>}
              </div>
            )}
            <div className="grid gap-2">
              {g.techs.map(t => <TechCard key={t.id} tech={t} family={c.childrenOf(t.id)} also={also(t, g.name)} />)}
            </div>
          </div>
        ))}
      </div>

      <div data-pane="table" hidden className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full border-collapse text-sm" data-sortable>
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col, i) => (
                <th key={col} scope="col" className={th} aria-sort="none">
                  <button type="button" className={sortBtn} data-sort={i}>{col}<span aria-hidden="true" data-arrow></span></button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {all.map(({ t, group }, i) => {
              const stage = stageOf(t);
              return (
                <tr key={`${t.id}-${i}`} className="border-b align-top last:border-b-0">
                  <td className="min-w-36 px-3 py-2.5" data-v={t.name.toLowerCase()} title={t.summary}>
                    <a href={href(`technologies/${t.id}/`)} className="inline-flex items-center gap-2 font-medium underline-offset-4 hover:text-brand hover:underline"><Glyph tech={t} />{t.name}</a>
                    {stage && <span className="ml-1.5 align-middle"><StatusBadge tech={t} /></span>}
                  </td>
                  {named && <td className="min-w-32 px-3 py-2.5 text-muted-foreground" data-v={group ?? ''}>{group ?? 'Other'}</td>}
                  <td className="min-w-28 px-3 py-2.5" data-v={PROVIDER_TYPES[t.provider]}>{PROVIDER_TYPES[t.provider]}</td>
                  <td className="min-w-28 px-3 py-2.5" data-v={t.vendor ?? ''}>
                    {t.vendor ?? '–'}
                    {c.membership(t) && <a href={href(c.membership(t)!.foundation.path)} className="mt-0.5 block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{membershipLabel(c.membership(t)!)}</a>}
                  </td>
                  <td className="min-w-36 px-3 py-2.5" data-v={t.license ?? ''}><span className="line-clamp-3" title={t.license}>{t.license ?? '–'}</span></td>
                  <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground" data-v={t.checked}>{t.checked}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TechListingScript />
      <SortableTable />
    </div>
  );
}
