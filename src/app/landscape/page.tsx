// Every technology on one map, like the CNCF landscape: area › topic › concept, one logo tile per product.
import Glyph from '@/components/Glyph';
import Shell from '@/components/Shell';
import { getCatalog, type CatalogTech } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href, PROVIDER_NAMES, relationLabel, STAGE_LABELS, stageOf } from '@/lib/nav';
import { cn } from '@/lib/utils';
import LandscapeScript from './LandscapeScript';

const c = getCatalog();
const kindOf = (p: string) => (p === 'oss' ? 'oss' : p === 'vendor' ? 'vendor' : 'cloud');
const types = [
  { id: 'oss', label: 'Open source' },
  { id: 'cloud', label: 'Cloud services' },
  { id: 'vendor', label: 'Commercial' },
];
// area › topic › concept, keeping only the branches that have technologies
const areas = c.parts.map(part => ({
  part,
  topics: part.categories.map(cat => ({
    cat,
    groups: c.concepts
      .filter(p => p.category === cat.id)
      .map(p => ({ concept: p, techs: c.technologies.filter(t => t.concepts[0] === p.id) }))
      .filter(g => g.techs.length),
  })).filter(x => x.groups.length),
})).filter(a => a.topics.length);

// "Kafka · Event streams · Open source", plus where it sits and its badge, for the tooltip
const tip = (t: CatalogTech) => {
  const stage = stageOf(t);
  return [
    t.name,
    t.parent ? relationLabel(t.parent.as, c.tech(t.parent.id).name) : t.kind ? c.kind(t.kind).name : c.concept(t.concepts[0]).name,
    PROVIDER_NAMES[t.provider],
    stage && STAGE_LABELS[stage],
    `since ${since(t)}`,
  ].filter(Boolean).join(' · ') + `\n${t.summary}`;
};
/** The first year in its timeline: when it, or the project it grew out of, began. */
const since = (t: CatalogTech) => Number(t.history.timeline[0].year);
const years = c.technologies.map(since);
const [first, last] = [Math.min(...years), Math.max(...years)];
// for the browser: which technologies each architecture uses
const data = {
  names: Object.fromEntries(c.technologies.map(t => [t.id, t.name])),
  archs: Object.fromEntries(c.architectures.map(a => [a.id, { title: a.title, path: href(`architectures/${a.id}/`), techs: a.techs }])),
};
const text = (t: CatalogTech) =>
  [t.name, t.id, t.summary, t.vendor ?? '', t.license ?? '', ...t.concepts.map(id => c.concept(id).name), ...t.kinds.map(id => c.kind(id).name)].join(' ').toLowerCase();
const chip = 'rounded-full border px-3 py-1 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground aria-pressed:border-brand/40 aria-pressed:bg-brand-soft aria-pressed:font-medium aria-pressed:text-foreground';

export const metadata = meta('Landscape', `All ${c.technologies.length} technologies in the handbook on one map, grouped by area, topic and concept.`);

export default function Landscape() {
  return (
    <Shell path="landscape/" section="landscape">
      <div className="mx-auto max-w-[110rem]">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Landscape</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            All {c.technologies.length} technologies on one map, grouped by area, topic and the concept each one is an example of.
            Open-source products have a border <span className="inline-block size-2.5 rounded-[3px] border border-foreground/40 bg-card align-middle" aria-hidden="true"></span>.
            Hover a logo for what it is, or click it for its page. Pick an architecture to see its stack, or drag through the years to watch the map fill in
            (the <a href={href('timeline/')} className="underline underline-offset-4 hover:text-foreground">timeline</a> says what happened each year).
            The <a href={href('technologies/')} className="underline underline-offset-4 hover:text-foreground">technologies table</a> has the same products with licenses and dates.
          </p>
        </header>

        <div className="mt-8 grid gap-3" data-filters>
          <input
            type="search"
            data-q
            placeholder="Filter by name, concept or description, e.g. rust, iceberg, queue"
            aria-label="Filter technologies"
            className="h-10 w-full max-w-xl rounded-lg border bg-background px-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand/40"
          />
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Type">
            <span className="mr-1 text-sm text-muted-foreground">Type:</span>
            <button type="button" className={chip} data-type="" aria-pressed="true">All</button>
            {types.map(x => (
              <button key={x.id} type="button" className={cn(chip, 'inline-flex items-center gap-1.5')} data-type={x.id} aria-pressed="false">
                {x.id === 'oss' && <span className="inline-block size-2.5 rounded-[3px] border border-foreground/40 bg-card align-middle" aria-hidden="true"></span>}{x.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Stack:
              <select data-arch className="h-8 rounded-md border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                <option value="">None</option>
                {c.architectures.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button type="button" data-play className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-foreground hover:border-foreground/30" aria-label="Play the years"><span aria-hidden="true">▶</span></button>
              <label htmlFor="landscape-year">Year:</label>
              <input id="landscape-year" type="range" data-year min={first} max={last} defaultValue={last} step="1" className="w-48 accent-[var(--brand)] sm:w-72" />
              <span className="font-mono text-foreground tabular-nums" data-year-label>{last}</span>
              <span data-year-count className="hidden sm:inline"></span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <p aria-live="polite"><span data-count>{c.technologies.length}</span> of {c.technologies.length} technologies</p>
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Areas">
              {areas.map(a => <a key={a.part.id} href={`#${a.part.id}`} className="underline-offset-4 hover:text-foreground hover:underline">{a.part.name}</a>)}
            </nav>
          </div>
        </div>

        <div className="mt-8 grid gap-12" data-map>
          {areas.map(({ part, topics }) => (
            <section key={part.id} id={part.id} className="scroll-mt-20" data-area>
              <h2 className="flex items-center gap-2 border-b pb-2 text-xl font-semibold tracking-tight">
                <Glyph icon={part.icon} className="size-5" />{part.name}
                <span className="ml-1 text-sm font-normal text-muted-foreground">{part.blurb}</span>
              </h2>
              <div className="mt-4 flex flex-wrap gap-4">
                {topics.map(({ cat, groups }) => (
                  <section key={cat.id} className="max-w-full flex-auto rounded-xl bg-card p-3 ring-1 ring-foreground/10" data-topic>
                    <h3 className="mb-2 px-1">
                      <a href={href(`topics/${cat.id}/`)} className="inline-flex items-center gap-2 font-semibold underline-offset-4 hover:text-brand hover:underline">
                        <Glyph icon={cat.icon} />{cat.name}
                      </a>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {groups.map(({ concept, techs }) => (
                        <div key={concept.id} className="flex-auto rounded-lg bg-muted/50 p-2 ring-1 ring-foreground/5" data-group>
                          <a href={href(`concepts/${concept.id}/#technologies`)} className="block truncate px-1 font-mono text-[10px] tracking-wide text-muted-foreground uppercase underline-offset-4 hover:text-foreground hover:underline">
                            {concept.name}
                          </a>
                          <ul className="mt-1.5 flex flex-wrap gap-1">
                            {techs.map(t => (
                              <li key={t.id} data-tile data-id={t.id} data-since={since(t)} data-type={kindOf(t.provider)} data-text={text(t)}>
                                <a
                                  href={href(`technologies/${t.id}/`)}
                                  title={tip(t)}
                                  className={cn(
                                    'flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center gap-1 rounded-md border bg-card px-1 text-center transition hover:shadow-sm focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none',
                                    // open source has a border; the rest only show one on hover
                                    t.provider === 'oss' ? 'border-foreground/25 hover:border-foreground/50' : 'border-transparent hover:border-foreground/20',
                                    t.archived && 'opacity-50',
                                  )}
                                >
                                  <Glyph tech={t} className="size-7" />
                                  <span className="line-clamp-2 text-[10px] leading-tight text-foreground/80">{t.name}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p data-empty hidden className="mt-6 text-muted-foreground">Nothing matches. Try fewer words, or set the type back to All.</p>
      </div>
      <div data-caption hidden aria-live="polite" className="fixed bottom-4 left-1/2 z-30 w-max max-w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl bg-popover px-4 py-2 text-pretty text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"></div>
      <script type="application/json" data-landscape dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
          <LandscapeScript />
    </Shell>
  );
}
