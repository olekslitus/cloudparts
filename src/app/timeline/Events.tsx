'use client';

// The timeline itself: decades › years › events. A client component only so the page carries the
// ~3,500 events as compact rows instead of a description of every element; it renders on the server.
import type { Logo } from '@/lib/glyphs';
import { cn } from '@/lib/utils';

export interface Row {
  name: string;
  href: string;
  text: string;
  kind: 'tech' | 'concept' | 'maker';
  part?: string;
  logo?: Logo;
  icon?: string;
  first?: boolean;
}
export interface Decade { decade: number; years: { year: number; events: Row[] }[] }

/** `backticks` as inline code, as Md.tsx does. */
const code = (text: string) => text.split(/`([^`]+)`/).map((s, i) => (i % 2 ? <code key={i}>{s}</code> : s));

export default function Events({ decades }: { decades: Decade[] }) {
  return (
    <div className="mt-10 grid gap-12">
      {decades.map(({ decade, years }) => (
        <section key={decade} id={`d${decade}`} className="scroll-mt-20" data-decade>
          <h2 className="border-b pb-2 font-mono text-2xl font-semibold tracking-tight tabular-nums">{decade}s</h2>
          <div className="mt-2">
            {years.map(({ year, events }) => (
              <section key={year} className="grid gap-x-6 border-b border-dashed py-3 last:border-b-0 sm:grid-cols-[4.5rem_1fr]" data-year>
                <h3 className="font-mono text-lg font-semibold text-foreground/80 tabular-nums sm:sticky sm:top-4 sm:self-start lg:top-6">{year}</h3>
                <ul className="mt-1 grid gap-1.5 sm:mt-0.5">
                  {events.map(e => (
                    <li key={`${e.href}-${e.text}`} className="flex items-start gap-2.5 text-[15px] leading-snug" data-event data-part={e.part ?? ''} data-kind={e.kind} data-first={e.first ? '' : undefined}>
                      <span className="mt-0.5 flex">
                        {e.logo ? (
                          <img src={e.logo.src} alt="" loading="lazy" decoding="async" className={cn('size-4 shrink-0 object-contain', e.logo.tone && `logo-${e.logo.tone}`)} />
                        ) : e.icon && (
                          <svg className="size-4 shrink-0 text-muted-foreground" aria-hidden="true"><use href={`#i-${e.icon}`} /></svg>
                        )}
                      </span>
                      <span className="min-w-0">
                        <a href={e.href} className="font-medium underline-offset-4 hover:text-brand hover:underline">{e.name}</a>
                        {e.first && <span className="ml-1.5 rounded-full bg-brand-soft px-1.5 py-px align-middle font-mono text-[10px] font-medium tracking-wide text-brand uppercase">First</span>}
                        <span className="md text-muted-foreground"> · {code(e.text)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
