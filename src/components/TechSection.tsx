import Code from '@/components/Code';
import LiveModel from '@/components/LiveModel';
import Md from '@/components/Md';
import type { Catalog } from '@/lib/catalog';
import type { TechSection as Section } from '@/content/schema';
import { diagramLinks } from '@/lib/links';

export default function TechSection({ section: s, anchor, catalog }: { section: Section; anchor: string; catalog: Catalog }) {
  return (
    <section id={anchor} className="mt-14 scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight">
        <a href={`#${anchor}`} className="group">{s.title}<span className="ml-2 text-muted-foreground opacity-0 transition group-hover:opacity-100">#</span></a>
      </h2>
      {'intro' in s && s.intro && <p className="mt-2 max-w-3xl leading-relaxed text-muted-foreground"><Md text={s.intro} /></p>}

      {s.type === 'text' && (
        <div className="mt-4 max-w-3xl space-y-4 text-[17px] leading-relaxed">
          {s.body.map((para, i) => <p key={i}><Md text={para} /></p>)}
        </div>
      )}

      {s.type === 'table' && (
        <div className="mt-5">
          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="sticky left-0 z-10 min-w-40 bg-muted px-4 py-3 align-bottom font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{s.corner}</th>
                  {s.columns.map((col, i) => <th key={i} scope="col" className="min-w-28 px-4 py-3 align-bottom font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <th scope="row" className="sticky left-0 z-10 bg-card px-4 py-3 align-top font-semibold">{r.label}</th>
                    {r.values.map((v, j) => <td key={j} className="px-4 py-3 align-top leading-snug"><Md text={v} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {s.notes && (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {s.notes.map((n, i) => <li key={i}><Md text={n} /></li>)}
            </ul>
          )}
        </div>
      )}

      {s.type === 'cards' && (
        <div className="mt-5 grid gap-2">
          {s.items.map((item, i) => (
            <div key={i} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="font-semibold">{item.name}</h3>
                {item.tag && <span className="rounded-full bg-brand-soft px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-brand uppercase">{item.tag}</span>}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground"><Md text={item.text} /></p>
            </div>
          ))}
        </div>
      )}

      {s.type === 'model' && (
        <div className="mt-5">
          <LiveModel diagram={s.diagram} links={diagramLinks(catalog, s.diagram)} />
        </div>
      )}

      {s.type === 'code' && (
        <div className="mt-5" data-codebox>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">{s.lang}</span>
            <button type="button" data-copy className="inline-flex h-7 items-center rounded-md border bg-background px-2.5 text-xs font-medium transition hover:bg-muted">Copy</button>
          </div>
          <div className="overflow-hidden rounded-xl bg-muted/50 ring-1 ring-foreground/10 [&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-relaxed">
            <Code code={s.source} lang={s.lang} />
          </div>
        </div>
      )}
    </section>
  );
}
