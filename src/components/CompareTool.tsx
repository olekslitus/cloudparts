'use client';

// The side-by-side compare tool at /compare/technologies/: up to four technologies as columns, with rows
// for the basics, the workloads each is good for, their specs, and why teams pick or avoid them. The
// choice lives in the URL (?ids=a,b,c), so a comparison can be linked to. Its data is compare.json
// (src/app/compare.json/route.ts), fetched once on load.
import { Fragment, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { CheckIcon, MinusIcon, PlusIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Switch } from '@/components/ui/switch';
import type { CompareData, CompareTech } from '@/lib/compare';
import { cn } from '@/lib/utils';

const MAX = 4;

/** `code` spans in content text, the only markup the content uses. */
const text = (s: string) => s.split(/`([^`]+)`/).map((x, i) => (i % 2 ? <code key={i}>{x}</code> : x));

function Logo({ t, size = 'size-6' }: { t: CompareTech; size?: string }) {
  return t.logo
    ? <img src={t.logo.src} alt="" className={cn(size, 'shrink-0 object-contain', t.logo.tone && `logo-${t.logo.tone}`)} />
    : <span className={cn(size, 'inline-flex shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground')}>{t.name[0]}</span>;
}

interface Row {
  key: string;
  label: string;
  help?: string;
  /** One cell per column; undefined renders as a dash. */
  cells: (ReactNode | undefined)[];
  /** What "only differences" compares. */
  same: (string | undefined)[];
}

const list = (items: string[], tone: 'ok' | 'bad') => (
  <ul className="grid gap-1.5">
    {items.map((x, i) => (
      <li key={i} className="flex gap-2 leading-snug">
        <span className={cn('mt-[0.45em] size-1.5 shrink-0 rounded-full', tone === 'ok' ? 'bg-(--ok)' : 'bg-(--bad)')} aria-hidden />
        <span>{text(x)}</span>
      </li>
    ))}
  </ul>
);

export default function CompareTool({ base, starters }: { base: string; starters: { label: string; ids: string[] }[] }) {
  const [data, setData] = useState<CompareData>();
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [adding, setAdding] = useState(false);
  const [diffOnly, setDiffOnly] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('ids');
    setIds(q ? q.split(',').filter(Boolean).slice(0, MAX) : []);
    setReady(true);
    fetch(`${base}compare.json`).then(r => r.json()).then(setData, () => {});
  }, [base]);

  // keep the URL in step, so the comparison can be shared
  useEffect(() => {
    if (!ready) return;
    const url = ids.length ? `?ids=${ids.join(',')}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [ids, ready]);

  const byId = useMemo(() => new Map((data?.techs ?? []).map(t => [t.id, t])), [data]);
  const cols = ids.map(id => byId.get(id)).filter((t): t is CompareTech => !!t);
  const add = (id: string) => {
    setIds(xs => (xs.includes(id) || xs.length >= MAX ? xs : [...xs, id]));
    setAdding(false);
  };
  const remove = (id: string) => setIds(xs => xs.filter(x => x !== id));
  // the first column's closest alternatives, then the others', that aren't in the table yet
  const suggested = [...new Set(cols.flatMap(t => t.alternatives))].filter(id => !ids.includes(id) && byId.has(id)).slice(0, 6);

  const sections = useMemo(() => {
    if (!data || !cols.length) return [];
    const workloads = data.workloads.filter(w => cols.some(t => t.goodFor.some(g => g.id === w.id)));
    const specs = data.specs.filter(s => cols.some(t => t.specs[s.id]));
    const groups = [...new Set(specs.map(s => s.group))];
    const basics: Row[] = [
      { key: 'context', label: 'What it is', cells: cols.map(t => t.context), same: cols.map(t => t.context) },
      { key: 'summary', label: 'In one line', cells: cols.map(t => text(t.summary)), same: cols.map(t => t.summary) },
      { key: 'vendor', label: 'Made by', cells: cols.map(t => t.vendor), same: cols.map(t => t.vendor) },
      { key: 'offered', label: 'Offered as', cells: cols.map(t => t.offered), same: cols.map(t => t.offered) },
      { key: 'license', label: 'License', cells: cols.map(t => t.license), same: cols.map(t => t.license) },
      { key: 'since', label: 'First released', cells: cols.map(t => t.since), same: cols.map(t => t.since) },
      { key: 'status', label: 'Status', cells: cols.map(t => t.status ?? 'Maintained'), same: cols.map(t => t.status ?? '') },
    ];
    const good: Row[] = workloads.map(w => {
      const hits = cols.map(t => t.goodFor.find(g => g.id === w.id));
      return {
        key: `w:${w.id}`,
        label: w.name,
        cells: hits.map(h => h && (
          <span className="flex gap-2">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-(--ok)" aria-label="Good for it" />
            <span className="leading-snug">{text(h.why)}</span>
          </span>
        )),
        same: hits.map(h => (h ? 'yes' : undefined)),
      };
    });
    return [
      { title: 'The basics', rows: basics },
      ...(good.length ? [{ title: 'Good for', rows: good, href: 'workloads/' }] : []),
      ...groups.map(g => ({
        title: g,
        rows: specs.filter(s => s.group === g).map((s): Row => ({
          key: `s:${s.id}`, label: s.label, help: s.help, cells: cols.map(t => t.specs[s.id] && text(t.specs[s.id])), same: cols.map(t => t.specs[s.id]),
        })),
      })),
      {
        title: 'Trade-offs',
        rows: [
          { key: 'pick', label: 'Why teams pick it', cells: cols.map(t => list(t.strengths, 'ok')), same: cols.map(t => t.strengths.join()) },
          { key: 'watch', label: 'Watch out for', cells: cols.map(t => list(t.limits, 'bad')), same: cols.map(t => t.limits.join()) },
        ] as Row[],
      },
    ]
      .map(s => ({ ...s, rows: diffOnly && cols.length > 1 ? s.rows.filter(r => new Set(r.same).size > 1) : s.rows }))
      .filter(s => s.rows.length);
  }, [data, cols, diffOnly]);

  const picker = (
    <CommandDialog open={adding} onOpenChange={setAdding} title="Add a technology" description="Search for a technology to add as a column">
      <CommandInput placeholder="Add a technology…" />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>
        {suggested.length > 0 && (
          <CommandGroup heading="Closest alternatives">
            {suggested.map(id => { const t = byId.get(id)!; return item(t, () => add(id), `suggested ${t.name}`); })}
          </CommandGroup>
        )}
        <CommandGroup heading="All technologies">
          {(data?.techs ?? []).filter(t => !ids.includes(t.id)).map(t => item(t, () => add(t.id), t.name))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );

  if (!ready) return null;
  if (!data && ids.length) return <p className="mt-8 text-sm text-muted-foreground">Loading…</p>;

  if (!cols.length) {
    return (
      <div className="mt-8 grid max-w-[50rem] gap-6">
        <div>
          <Button onClick={() => setAdding(true)} disabled={!data}><PlusIcon />Add a technology</Button>
        </div>
        {starters.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Or start from one of these:</p>
            <div className="flex flex-wrap gap-2">
              {starters.map(s => (
                <button key={s.label} type="button" onClick={() => setIds(s.ids.slice(0, MAX))} className="rounded-full border px-3 py-1 text-sm transition hover:bg-muted">{s.label}</button>
              ))}
            </div>
          </div>
        )}
        {picker}
      </div>
    );
  }

  // narrower on phones, where the table scrolls sideways under a sticky first column
  const width = { '--cols': cols.length, '--add': cols.length < MAX ? '8rem' : '0rem' } as CSSProperties;
  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={diffOnly} onCheckedChange={setDiffOnly} disabled={cols.length < 2} />
          Only show differences
        </label>
        {suggested.length > 0 && cols.length < MAX && (
          <span className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Add:</span>
            {suggested.slice(0, 4).map(id => {
              const t = byId.get(id)!;
              return (
                <button key={id} type="button" onClick={() => add(id)} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 transition hover:bg-muted">
                  <Logo t={t} size="size-3.5" />{t.name}
                </button>
              );
            })}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[calc(7rem+var(--cols)*13rem+var(--add))] border-collapse text-left sm:min-w-[calc(11rem+var(--cols)*15rem+var(--add))]" style={width}>
          <thead>
            <tr className="border-b">
              <th scope="col" className="sticky left-0 z-10 w-28 bg-card px-3 py-3 sm:w-44 sm:px-4"><span className="sr-only">Compared on</span></th>
              {cols.map(t => (
                <th key={t.id} scope="col" className="px-4 py-3 align-top font-normal">
                  <div className="flex items-start gap-2">
                    <a href={`${base}technologies/${t.id}/`} className="group flex min-w-0 flex-1 items-center gap-2">
                      <Logo t={t} />
                      <span className="font-semibold leading-tight group-hover:text-brand">{t.name}</span>
                    </a>
                    <button type="button" onClick={() => remove(t.id)} className="-mr-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label={`Remove ${t.name}`}>
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              {cols.length < MAX && (
                <th scope="col" className="w-36 px-4 py-3 align-top">
                  <Button variant="outline" size="sm" onClick={() => setAdding(true)} disabled={!data}><PlusIcon />Add</Button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sections.map(s => (
              <Fragment key={s.title}>
                <tr className="border-b bg-muted/50">
                  <th colSpan={cols.length + 2} scope="colgroup" className="px-4 py-2 font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    <span className="sticky left-4">{'href' in s && s.href ? <a href={`${base}${s.href}`} className="hover:text-foreground">{s.title}</a> : s.title}</span>
                  </th>
                </tr>
                {s.rows.map(r => (
                  <tr key={r.key} className="border-b last:border-b-0">
                    <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-3 align-top text-sm font-medium sm:px-4" title={r.help}>{r.label}</th>
                    {r.cells.map((cell, i) => (
                      <td key={i} className="px-4 py-3 align-top text-[15px] leading-snug">
                        {cell ?? <MinusIcon className="size-4 text-muted-foreground/60" aria-label="None listed" />}
                      </td>
                    ))}
                    {cols.length < MAX && <td />}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {picker}
    </div>
  );
}

// a plain function, not a component, so items keep their identity between keystrokes
function item(t: CompareTech, onSelect: () => void, value: string) {
  return (
    <CommandItem key={value} value={value} keywords={[t.context, t.vendor ?? '']} onSelect={onSelect} className="gap-3">
      <Logo t={t} size="size-4" />
      <span className="min-w-0 flex-1">
        <span className="font-medium">{t.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{t.context}</span>
      </span>
    </CommandItem>
  );
}
