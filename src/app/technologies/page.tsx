import Glyph from '@/components/Glyph';
import Shell from '@/components/Shell';
import SortableTable from '@/components/SortableTable';
import StatusBadge from '@/components/StatusBadge';
import { getCatalog } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href, PROVIDER_TYPES, relationLabel, stageOf } from '@/lib/nav';
import Filters from './Filters';

export const metadata = meta('Technologies', 'Every product in the handbook, from Kafka to DuckLake, in one table you can search, filter and sort.');

const types = [
  { id: 'oss', label: 'Open source' },
  { id: 'cloud', label: 'Cloud services' },
  { id: 'vendor', label: 'Commercial' },
];
const chip = 'rounded-full border px-3 py-1 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground aria-pressed:border-brand/40 aria-pressed:bg-brand-soft aria-pressed:font-medium aria-pressed:text-foreground';
const th = 'px-3 py-2.5 text-left align-bottom font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase';
const sortBtn = 'inline-flex items-center gap-1 uppercase hover:text-foreground';

export default function TechnologiesPage() {
  const c = getCatalog();
  const kindOf = (p: string) => (p === 'oss' ? 'oss' : p === 'vendor' ? 'vendor' : 'cloud');
  const rows = c.technologies.map(t => {
    const cat = c.category(t.category);
    const concept = c.concept(t.concepts[0]);
    const context = t.parent ? relationLabel(t.parent.as, c.tech(t.parent.id).name) : t.kind ? c.kind(t.kind).name : undefined;
    return { t, cat, concept, context, part: cat.part, kind: kindOf(t.provider) };
  });

  return (
    <Shell path="technologies/" section="technologies">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Technologies</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          All {c.technologies.length} products in the handbook in one table. Type to filter, pick an area or a type, or click a column to sort.
          Each one links to its page, and to the concept it’s an example of.
        </p>
        <a href={href('landscape/')} className="mt-3 flex w-fit items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">See them all as logos on one map: the landscape →</a>
        {c.foundations.map(f => (
          <a key={f.id} href={href(f.path)} className="mt-3 flex w-fit items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            {f.type === 'company'
              ? <>{f.projects.length} are made by {f.name}: how they fit together →</>
              : <>{f.projects.length} are projects of {f.name}: what that means →</>}
          </a>
        ))}
      </header>

      <div className="mt-8 grid gap-3" data-filters>
        <input
          type="search"
          data-q
          placeholder="Filter by name, concept or description, e.g. iceberg, rust, queue"
          aria-label="Filter technologies"
          className="h-10 w-full max-w-xl rounded-lg border bg-background px-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand/40"
        />
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Area">
          <span className="mr-1 text-sm text-muted-foreground">Area:</span>
          <button type="button" className={chip} data-part="" aria-pressed="true">All</button>
          {c.parts.map(p => <button key={p.id} type="button" className={chip} data-part={p.id} aria-pressed="false">{p.name}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Type">
          <span className="mr-1 text-sm text-muted-foreground">Type:</span>
          <button type="button" className={chip} data-type="" aria-pressed="true">All</button>
          {types.map(x => <button key={x.id} type="button" className={chip} data-type={x.id} aria-pressed="false">{x.label}</button>)}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite"><span data-count>{rows.length}</span> of {rows.length} technologies</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full border-collapse text-sm" data-sortable>
          <thead>
            <tr className="border-b bg-muted/50">
              {['Technology', 'Concept', 'Type', 'License', 'Checked'].map((col, i) => (
                <th key={col} scope="col" className={th} aria-sort="none">
                  <button type="button" className={sortBtn} data-sort={i}>{col}<span aria-hidden="true" data-arrow></span></button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, concept, context, part, kind }) => (
              <tr
                key={t.id}
                className="border-b align-top last:border-b-0"
                data-part={part}
                data-type={kind}
                data-text={[t.name, t.id, t.summary, concept.name, context ?? '', t.vendor ?? '', t.license ?? ''].join(' ').toLowerCase()}
              >
                <td className="min-w-60 px-3 py-2.5" data-v={t.name.toLowerCase()}>
                  <a href={href(`technologies/${t.id}/`)} className="inline-flex items-center gap-2 font-medium underline-offset-4 hover:text-brand hover:underline"><Glyph tech={t} />{t.name}</a>
                  {stageOf(t) && <span className="ml-1.5 align-middle"><StatusBadge tech={t} /></span>}
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{t.summary}</span>
                </td>
                <td className="min-w-40 px-3 py-2.5" data-v={concept.name}>
                  <a href={href(`concepts/${concept.id}/`)} className="underline-offset-4 hover:text-brand hover:underline">{concept.name}</a>
                  {context && <span className="block text-xs text-muted-foreground">{context}</span>}
                </td>
                <td className="min-w-28 px-3 py-2.5" data-v={PROVIDER_TYPES[t.provider]}>{PROVIDER_TYPES[t.provider]}</td>
                <td className="min-w-36 px-3 py-2.5" data-v={t.license ?? ''}><span className="line-clamp-3" title={t.license}>{t.license ?? '–'}</span></td>
                <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground" data-v={t.checked}>{t.checked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p data-empty hidden className="mt-6 text-muted-foreground">Nothing matches. Try fewer words, or set the area and type back to All.</p>

      <SortableTable />
      <Filters />
    </Shell>
  );
}
