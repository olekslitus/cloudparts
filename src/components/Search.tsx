import { useEffect, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';
import { STAGE_LABELS, type NavData } from '@/lib/nav';
import { cn } from '@/lib/utils';

type Logo = NonNullable<NavData['groups'][number]['technologies'][number]['logo']>;
interface Entry {
  key: string;
  type: 'Topic' | 'Concept' | 'Kind' | 'Technology' | 'Architecture' | 'Comparison';
  name: string;
  /** Shown under the name. */
  sub: string;
  path: string;
  /** A Lucide icon name from the page's sprite (IconSprite.astro); a logo replaces it. */
  icon: string;
  logo?: Logo;
  /** Other names people type for it: ids, product names, the concept it belongs to. */
  aliases: string;
  /** Everything else that may match: summaries, vendors, section titles. */
  text: string;
  archived?: boolean;
}

// A small lead for the broader page: a topic or concept before the products and kinds under it.
const TYPE_BONUS: Record<Entry['type'], number> = { Topic: 6, Concept: 6, Technology: 3, Kind: 1, Architecture: 0, Comparison: 0 };
const STOP = new Set(['a', 'an', 'and', 'or', 'of', 'for', 'the', 'on', 'in', 'to', 'vs']);
// "Apache Kafka" is "Kafka" to most people, "AWS Lambda" is "Lambda".
const VENDOR = /^(apache|amazon|aws|google cloud|google|azure|microsoft|cloudflare|hashicorp|alibaba cloud|eclipse|oracle|red hat) /;
const words = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9+#]+/g, ' ').trim().split(' ').filter(Boolean);
/** "formats" and "format", "queues" and "queue" count as the same word. */
const stem = (w: string) => (w.length > 3 ? w.replace(/(es|s)$/, '') : w);
const hit = (f: string, w: string) => f.startsWith(w) || stem(f) === stem(w);
/** Every query word starts some word of the field (or is the same word, plural or not). */
const covers = (field: string[], q: string[]) => q.every(w => field.some(f => hit(f, w)));
const same = (a: string[], b: string[]) => a.length === b.length && a.every((w, i) => stem(w) === stem(b[i]));

function score(e: Entry, q: string[]): number {
  const name = words(e.name);
  const core = words(e.name.toLowerCase().replace(VENDOR, ''));
  let s = 0;
  if (same(name, q) || same(core, q)) s = 100;
  else if (covers(name, q)) {
    // the more of the name the query accounts for, the better: "postgres" is PostgreSQL before PGO
    const meaningful = name.filter(w => !STOP.has(w));
    // and a whole word ("streams") counts for more than the start of one ("Streamling")
    const credit = meaningful.reduce((n, f) => n + (q.some(w => stem(f) === stem(w)) ? 1 : q.some(w => f.startsWith(w)) ? 0.5 : 0), 0);
    s = 60 + 20 * (credit / Math.max(1, meaningful.length));
  }
  else if (covers([...name, ...words(e.aliases)], q)) s = 40;
  else if (covers([...name, ...words(e.aliases), ...words(e.text)], q)) s = 15;
  if (!s) return 0;
  return s + TYPE_BONUS[e.type] - (e.archived ? 5 : 0);
}

function entries(nav: NavData): Entry[] {
  const concepts = new Map(nav.groups.flatMap(g => g.concepts.map(p => [p.id, p] as const)));
  return [
    ...nav.groups.map((g): Entry => ({
      key: `topic:${g.id}`, type: 'Topic', name: g.name, sub: g.blurb, path: `topics/${g.id}/`, icon: g.icon,
      aliases: `${g.id} ${nav.parts.find(x => x.id === g.part)?.name ?? ''}`, text: g.blurb,
    })),
    ...nav.groups.flatMap(g => g.concepts.flatMap((p): Entry[] => [
      {
        key: `concept:${p.id}`, type: 'Concept', name: p.name, sub: `${g.name} · ${p.summary}`, path: `concepts/${p.id}/`, icon: p.icon,
        aliases: `${p.id} ${p.products}`, text: p.summary,
      },
      ...p.kinds.map((k): Entry => ({
        key: `kind:${k.id}`, type: 'Kind', name: k.name, sub: `${p.name} · ${k.summary}`, path: `concepts/${p.id}/${k.id}/`, icon: 'folder',
        aliases: `${k.id} ${p.name}`, text: k.summary,
      })),
    ])),
    ...nav.groups.flatMap(g => g.technologies.map((t): Entry => ({
      key: `tech:${t.id}`, type: 'Technology', name: t.name, path: `technologies/${t.id}/`,
      sub: `${t.stage ? `${STAGE_LABELS[t.stage]} · ` : ''}${t.context} · ${t.summary}`,
      icon: concepts.get(t.conceptId)?.icon ?? 'box', logo: t.logo,
      aliases: `${t.id} ${t.context}`, text: `${t.summary} ${t.terms}`, archived: t.archived,
    }))),
    ...nav.architectures.map((a): Entry => ({
      key: `arch:${a.id}`, type: 'Architecture', name: a.name, sub: a.summary, path: `architectures/${a.id}/`, icon: 'network',
      aliases: `${a.id} architecture stack`, text: `${a.summary} ${a.terms}`,
    })),
    ...nav.comparisons.map((m): Entry => ({
      key: `compare:${m.id}`, type: 'Comparison', name: m.title, sub: '', path: `compare/${m.id}/`, icon: 'arrow-left-right',
      aliases: `${m.id} compare vs versus`, text: '',
    })),
  ];
}

/** Best matches first, across every kind of page. */
function search(all: Entry[], query: string): Entry[] {
  // "kafka vs redpanda" looks for Kafka and Redpanda; "vs" alone still finds the comparisons
  const typed = words(query);
  const q = typed.some(w => !STOP.has(w)) ? typed.filter(w => !STOP.has(w)) : typed;
  return all
    .map(e => ({ e, s: score(e, q) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.e.name.length - b.e.name.length)
    .slice(0, 40)
    .map(x => x.e);
}

function Glyph({ e }: { e: Entry }) {
  return e.logo
    ? <img src={e.logo.src} alt="" className={cn('size-4 shrink-0 object-contain', e.logo.tone && `logo-${e.logo.tone}`)} />
    : <svg className="size-4 shrink-0 text-muted-foreground" aria-hidden="true"><use href={`#i-${e.icon}`} /></svg>;
}

/** The search button and dialog. Render it once per page: it also listens for ⌘K and "open-search" events. */
export default function Search({ nav, base }: { nav: NavData; base: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(input|textarea|select)$/i.test(e.target.tagName));
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    // Other parts of the page (the home page's search box and example chips) open search with an optional query.
    const onOpen = (e: Event) => {
      setQuery(typeof (e as CustomEvent).detail === 'string' ? (e as CustomEvent<string>).detail : '');
      setOpen(true);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('open-search', onOpen);
    document.documentElement.dataset.search = 'ready';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('open-search', onOpen);
    };
  }, []);

  const go = (path: string) => {
    setOpen(false);
    window.location.href = base + path;
  };
  const all = useMemo(() => entries(nav), [nav]);
  // a plain function, not a component, so items keep their identity between keystrokes
  const item = (e: Entry, label?: string) => (
    <CommandItem key={e.key} value={e.key} onSelect={() => go(e.path)} className="items-start gap-3">
      <span className="mt-0.5 flex"><Glyph e={e} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn('font-medium', e.archived && 'text-muted-foreground')}>{e.name}</span>
          {label && <span className="shrink-0 text-[11px] text-muted-foreground">{label}</span>}
        </span>
        {e.sub && <span className="block truncate text-xs text-muted-foreground">{e.sub}</span>}
      </span>
    </CommandItem>
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-8 w-full justify-start gap-2 bg-muted/40 px-2.5 font-normal text-muted-foreground shadow-none"
      >
        <SearchIcon />
        <span>Search…</span>
        <Kbd className="ml-auto">⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search Cloud Parts" description="Find a topic, concept, technology or architecture, such as delivery, event loop or Kafka.">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Try observability, event loop, Kafka…" value={query} onValueChange={setQuery} />
          <CommandList className="max-h-[min(60vh,420px)]">
            <CommandEmpty>Nothing matches. Try a topic like delivery, or a product like Kafka.</CommandEmpty>
            {query.trim() ? (
              <CommandGroup>
                {search(all, query).map(e => item(e, e.type))}
              </CommandGroup>
            ) : (
              <>
                <CommandGroup heading="Topics">{all.filter(e => e.type === 'Topic').map(e => item(e))}</CommandGroup>
                <CommandGroup heading="Architectures">{all.filter(e => e.type === 'Architecture').map(e => item(e))}</CommandGroup>
                <CommandGroup heading="Comparisons">{all.filter(e => e.type === 'Comparison').map(e => item(e))}</CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
