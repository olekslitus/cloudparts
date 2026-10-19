// "Where it came from": the story, the design choices and why, and a timeline. Collapsed until opened.
import type { z } from 'zod';
import { ChevronRightIcon } from 'lucide-react';
import Md from '@/components/Md';
import SourceList from '@/components/SourceList';
import type { history } from '@/content/schema';

export default function History({ history: h }: { history: z.output<typeof history> }) {
  const first = h.timeline[0]?.year;
  const last = h.timeline.at(-1)?.year;
  return (
    <details id="history" className="group/h mt-12 scroll-mt-20 rounded-xl ring-1 ring-foreground/10">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3.5 select-none hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open/h:rotate-90" />
        <span className="font-semibold">Where it came from</span>
        {first && <span className="ml-auto font-mono text-xs text-muted-foreground">{first === last ? first : `${first}–${last}`}</span>}
      </summary>
      <div className="border-t px-4 pt-5 pb-6 sm:px-6">
        <div className="max-w-3xl space-y-4 text-[17px] leading-relaxed">
          {h.story.map((p, i) => <p key={i}><Md text={p} /></p>)}
        </div>

        <h3 className="mt-8 mb-3 text-sm font-semibold">Why it’s built this way</h3>
        <dl className="grid max-w-3xl gap-3">
          {h.choices.map((c, i) => (
            <div key={i} className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
              <dt className="leading-snug font-medium"><Md text={c.choice} /></dt>
              <dd className="mt-1 text-[15px] leading-relaxed text-muted-foreground"><Md text={c.why} /></dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-8 mb-3 text-sm font-semibold">Timeline</h3>
        <ol className="relative ml-[3px] max-w-3xl border-l pl-0">
          {h.timeline.map((e, i) => (
            <li key={i} className="relative pb-5 pl-6 last:pb-0">
              <span className="absolute top-[7px] -left-[5px] size-[9px] rounded-full bg-brand ring-4 ring-background" aria-hidden="true"></span>
              <span className="font-mono text-xs font-semibold tracking-wider text-brand">{e.year}</span>
              <p className="mt-0.5 leading-snug"><Md text={e.text} /></p>
            </li>
          ))}
        </ol>
        <SourceList sources={h.sources} className="mt-6 border-t pt-4 text-sm" />
      </div>
    </details>
  );
}
