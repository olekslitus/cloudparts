// Every dated event in the handbook on one page, oldest first: the timelines of all technologies,
// concepts, foundations and companies, grouped by decade and year.
import Shell from '@/components/Shell';
import { getCatalog, type CatalogTech } from '@/lib/catalog';
import { logoOf } from '@/lib/glyphs';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';
import Events, { type Decade } from './Events';
import TimelineScript from './TimelineScript';

interface Event {
  year: number;
  text: string;
  /** Whose timeline it's from. */
  name: string;
  path: string;
  kind: 'tech' | 'concept' | 'maker';
  /** The area of the handbook it belongs to; foundations and companies have none. */
  part?: string;
  tech?: CatalogTech;
  icon?: string;
  /** The first entry in its timeline: when it, or what it grew out of, began. */
  first: boolean;
}

const c = getCatalog();
const events: Event[] = [
  ...c.technologies.flatMap(t => t.history.timeline.map((e, i): Event => ({
    year: Number(e.year), text: e.text, name: t.name, path: `technologies/${t.id}/`, kind: 'tech', part: c.category(t.category).part, tech: t, first: i === 0,
  }))),
  ...c.concepts.flatMap(p => p.history.timeline.map((e, i): Event => ({
    year: Number(e.year), text: e.text, name: p.name, path: `concepts/${p.id}/`, kind: 'concept', part: c.category(p.category).part, icon: p.icon, first: i === 0,
  }))),
  ...c.foundations.flatMap(f => f.history.timeline.map((e, i): Event => ({
    year: Number(e.year), text: e.text, name: f.name, path: f.path, kind: 'maker', icon: f.type === 'company' ? 'building-2' : 'landmark', first: i === 0,
  }))),
].sort((a, b) => a.year - b.year || Number(b.first) - Number(a.first) || a.name.localeCompare(b.name));

// decade › year › events
const decades = [...new Set(events.map(e => Math.floor(e.year / 10) * 10))].map(decade => ({
  decade,
  years: [...new Set(events.filter(e => Math.floor(e.year / 10) * 10 === decade).map(e => e.year))].map(year => ({
    year,
    events: events.filter(e => e.year === year),
  })),
}));
// the same, as the compact rows Events renders: links resolved, a logo or else an icon, empty fields left out
const rows: Decade[] = decades.map(d => ({
  decade: d.decade,
  years: d.years.map(y => ({
    year: y.year,
    events: y.events.map(e => {
      const logo = e.tech && logoOf(e.tech.id);
      return {
        name: e.name, href: href(e.path), text: e.text, kind: e.kind,
        ...(e.part && { part: e.part }),
        ...(logo ? { logo } : { icon: e.icon ?? (e.tech && c.concept(e.tech.concepts[0]).icon) }),
        ...(e.first && { first: true }),
      };
    }),
  })),
}));
const kinds = [
  { id: 'tech', label: 'Technologies' },
  { id: 'concept', label: 'Concepts' },
  { id: 'maker', label: 'Foundations & companies' },
];
const chip = 'rounded-full border px-3 py-1 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground aria-pressed:border-brand/40 aria-pressed:bg-brand-soft aria-pressed:font-medium aria-pressed:text-foreground';

export const metadata = meta('Timeline', `${events.length} dated events from the handbook, from ${events[0].year} to ${events.at(-1)!.year}: when each technology and idea appeared, and what changed since.`);

export default function Timeline() {
  return (
    <Shell path="timeline/" section="timeline">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Timeline</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Every dated event in the handbook, from {events[0].year} to {events.at(-1)!.year}: when each technology and idea appeared, and what changed since.
          These are the timelines from each page’s history, {events.length} events in all. The <a href={href('landscape/')} className="underline underline-offset-4 hover:text-foreground">landscape</a> can play the same years on the map.
        </p>
      </header>

      <div className="mt-8 grid gap-3" data-filters>
        <input
          type="search"
          data-q
          placeholder="Filter by name or event, e.g. kafka, open-sourced, apache"
          aria-label="Filter events"
          className="h-10 w-full max-w-xl rounded-lg border bg-background px-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand/40"
        />
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Area">
          <span className="mr-1 text-sm text-muted-foreground">Area:</span>
          <button type="button" className={chip} data-part="" aria-pressed="true">All</button>
          {c.parts.map(p => <button key={p.id} type="button" className={chip} data-part={p.id} aria-pressed="false">{p.name}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Kind">
          <span className="mr-1 text-sm text-muted-foreground">Show:</span>
          <button type="button" className={chip} data-kind="" aria-pressed="true">All</button>
          {kinds.map(k => <button key={k.id} type="button" className={chip} data-kind={k.id} aria-pressed="false">{k.label}</button>)}
          <label className="ml-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" data-first className="size-4 accent-[var(--brand)]" />
            First appearances only
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <p aria-live="polite"><span data-count>{events.length}</span> of {events.length} events</p>
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Decades">
            {decades.map(d => <a key={d.decade} href={`#d${d.decade}`} data-decade-link={d.decade} className="font-mono tabular-nums underline-offset-4 hover:text-foreground hover:underline">{d.decade}s</a>)}
          </nav>
        </div>
      </div>

      <Events decades={rows} />
      <p data-empty hidden className="mt-6 text-muted-foreground">Nothing matches. Try fewer words, or set the filters back to All.</p>
      <TimelineScript />
    </Shell>
  );
}
