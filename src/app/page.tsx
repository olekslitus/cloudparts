import { ArrowLeftRightIcon, ArrowRightIcon, BoxIcon, NetworkIcon, SearchIcon, ShapesIcon, SquareMousePointerIcon } from 'lucide-react';
import ArchCard from '@/components/ArchCard';
import Glyph from '@/components/Glyph';
import LiveModel from '@/components/LiveModel';
import Shell from '@/components/Shell';
import { getCatalog } from '@/lib/catalog';
import { diagramLinks } from '@/lib/links';
import { href } from '@/lib/nav';

export default function Home() {
  const c = getCatalog();
  // example searches under the search box: an idea, a product and a comparison
  const examples = ['message queue', 'Kafka', 'lakehouse', 'Postgres', 'Kubernetes', 'event loop'];
  const pick = (ids: string[], get: (id: string) => { name: string } | undefined) => ids.filter(id => get(id)).slice(0, 3);
  const conceptExamples = pick(['queue', 'lakehouse', 'event-loop', 'cache'], id => c.concepts.find(p => p.id === id));
  const techExamples = pick(['kafka', 'postgresql', 'duckdb', 'kubernetes'], id => c.technologies.find(t => t.id === id));
  const ways = [
    {
      icon: ShapesIcon, path: 'concepts/', title: 'Learn a concept',
      text: `What a queue, a lakehouse or an event loop is, how it works, and when to reach for it. ${c.concepts.length} concepts, each with a live model.`,
      links: conceptExamples.map(id => ({ path: `concepts/${id}/`, label: c.concept(id).name })),
    },
    {
      icon: BoxIcon, path: 'technologies/', title: 'Look up a technology',
      text: `What a product is, why teams pick it, what to watch out for, and what it works with. ${c.technologies.length} technologies, every fact sourced.`,
      links: techExamples.map(id => ({ path: `technologies/${id}/`, label: c.tech(id).name })),
    },
    {
      icon: ArrowLeftRightIcon, path: 'compare/', title: 'Choose between options',
      text: `Ideas and products that are easy to mix up, side by side, with a rule of thumb. Every concept page also compares its technologies in a table.`,
      links: c.comparisons.slice(0, 3).map(m => ({ path: `compare/${m.id}/`, label: m.title })),
    },
  ];
  // Keep old deep links from the single-file version working (#queue, #vs-messaging, #mixups).
  const redirect = `const concepts = ${JSON.stringify(c.concepts.map(p => p.id))}, base = ${JSON.stringify(href())};
    const h = decodeURIComponent(location.hash.slice(1));
    if (concepts.includes(h)) location.replace(base + 'concepts/' + h + '/');
    else if (h === 'mixups') location.replace(base + 'compare/');
    else if (h.startsWith('vs-')) location.replace(base + 'compare/' + h.slice(3) + '/');`;

  return (
    <Shell path="" section="home">

      <section className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">How modern software is written, shipped and kept running</h1>
        <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
          A handbook for software engineers: the ideas, the products that implement them, and real stacks that put them together.
        </p>

        <button
          type="button"
          data-open-search=""
          className="mt-8 flex h-14 w-full items-center gap-3 rounded-xl border bg-card px-4 text-left text-lg text-muted-foreground shadow-sm ring-brand/30 transition hover:border-foreground/25 focus-visible:ring-4 focus-visible:outline-none"
        >
          <SearchIcon className="size-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">Search concepts, technologies and comparisons</span>
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-xs sm:inline">⌘K</kbd>
        </button>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
          <span className="mr-1 text-muted-foreground">Try:</span>
          {examples.map(q => (
            <button key={q} type="button" data-open-search={q} className="rounded-full border px-2.5 py-0.5 text-muted-foreground transition hover:border-foreground/30 hover:text-foreground">{q}</button>
          ))}
        </div>
      </section>

      <ol className="mt-12 grid max-w-[50rem] gap-3">
        {ways.map(w => (
          <li key={w.path} className="rounded-xl bg-card ring-1 ring-foreground/10 transition hover:ring-foreground/25">
            <a href={href(w.path)} className="group flex gap-4 px-5 pt-4 pb-2">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><w.icon className="size-4.5" /></span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-lg font-semibold group-hover:text-brand">{w.title}<ArrowRightIcon className="size-4 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" /></span>
                <span className="mt-0.5 block leading-snug text-muted-foreground">{w.text}</span>
              </span>
            </a>
            <span className="flex flex-wrap gap-1.5 pr-5 pb-4 pl-[4.75rem]">
              {w.links.map(l => <a key={l.path} href={href(l.path)} className="rounded-md bg-muted px-2 py-0.5 text-sm transition hover:bg-brand-soft hover:text-brand">{l.label}</a>)}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-4 max-w-[50rem] text-muted-foreground">
        Or watch <a href={href('architectures/')} className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:text-brand hover:underline"><NetworkIcon className="size-4" />{c.architectures.length} real stacks</a> run live,
        or design your own in the <a href={href('playground/')} className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:text-brand hover:underline"><SquareMousePointerIcon className="size-4" />playground</a>.
      </p>

      <section className="mt-16" aria-labelledby="map">
        <h2 id="map" className="text-2xl font-semibold tracking-tight">The whole system, at concept level</h2>
        <p className="mt-1 mb-4 text-muted-foreground">Click any box to learn the concept.</p>
        <LiveModel diagram={c.systemMap} links={diagramLinks(c, c.systemMap)} warmup={7000} />
      </section>

      <section className="mt-16 max-w-[50rem]" aria-labelledby="areas">
        <h2 id="areas" className="text-2xl font-semibold tracking-tight">Browse by area</h2>
        <ul className="mt-4 divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          {c.parts.map(part => (
            <li key={part.id} className="px-4 py-3.5">
              <a href={href(`concepts/#${part.id}`)} className="inline-flex items-center gap-2 font-semibold underline-offset-4 hover:text-brand hover:underline"><Glyph icon={part.icon} />{part.name}</a>
              <span className="block text-sm text-muted-foreground">{part.blurb}</span>
              <span className="mt-2 flex flex-wrap gap-1.5">
                {part.categories.map(cat => (
                  <a key={cat.id} href={href(`topics/${cat.id}/`)} className="rounded-md border px-2 py-0.5 text-sm transition hover:border-foreground/30 hover:bg-muted">
                    {cat.name} <span className="text-xs text-muted-foreground">{c.concepts.filter(p => p.category === cat.id).length}</span>
                  </a>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {c.architectures.length > 0 && (
        <section className="mt-16 max-w-[50rem]" aria-labelledby="stacks">
          <h2 id="stacks" className="text-2xl font-semibold tracking-tight">Real stacks</h2>
          <p className="mt-1 mb-4 text-muted-foreground">Products wired together, running live, explained step by step.</p>
          <div className="grid gap-2">
            {c.architectures.slice(0, 3).map(a => <ArchCard key={a.id} arch={a} catalog={c} />)}
          </div>
          <a href={href('architectures/')} className="mt-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">All {c.architectures.length} architectures →</a>
        </section>
      )}

      <section className="mt-16 max-w-[50rem]" aria-labelledby="confused">
        <h2 id="confused" className="text-2xl font-semibold tracking-tight">Commonly confused</h2>
        <ul className="mt-4 divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          {c.comparisons.slice(0, 6).map(m => (
            <li key={m.id}>
              <a href={href(`compare/${m.id}/`)} className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/60">
                <span className="min-w-0">
                  <span className="block font-medium group-hover:text-brand">{m.title}</span>
                  <span className="block truncate text-sm text-muted-foreground">{m.columns.map(col => col.name).join(' · ')}</span>
                </span>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </a>
            </li>
          ))}
        </ul>
        <a href={href('compare/')} className="mt-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">All {c.comparisons.length} comparisons →</a>
      </section>

      <script dangerouslySetInnerHTML={{ __html: redirect }} />
    </Shell>
  );
}
