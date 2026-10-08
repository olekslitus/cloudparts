import { ChevronRightIcon, MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { NavData } from '@/lib/nav';
import { cn } from '@/lib/utils';

type Tech = NavData['groups'][number]['technologies'][number];

interface Props {
  nav: NavData;
  base: string;
  active?: string;
  /** What kind of page `active` is. */
  page?: 'topic' | 'concept' | 'kind' | 'tech';
  /** The part and concept holding the current page; they start open. */
  activePart?: string;
  activeConcept?: string;
  /** Which tree to show under the section links. */
  section: 'handbook' | 'architectures';
  links: { label: string; path: string; on: boolean }[];
  /** Smaller sections, listed after the main ones. */
  more: { label: string; path: string; on: boolean }[];
}

const itemClass = (on: boolean) => cn('flex min-w-0 flex-1 items-baseline gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted', on && 'bg-brand-soft font-medium');
const heading = 'flex justify-between px-2 pb-1 font-mono text-[11px] tracking-wider text-muted-foreground uppercase';
const subhead = 'mt-1 flex justify-between rounded-md px-2 py-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase hover:bg-muted hover:text-foreground';
const partSummary = 'flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold select-none hover:bg-muted [&::-webkit-details-marker]:hidden';
const rowSummary = 'flex cursor-pointer list-none items-center rounded-md select-none [&::-webkit-details-marker]:hidden';
const Chevron = ({ group }: { group: string }) => (
  <span className="flex w-[18px] shrink-0 justify-center" aria-hidden="true">
    <ChevronRightIcon className={cn('size-3.5 text-muted-foreground transition-transform', group)} />
  </span>
);

/** Technologies, with children (EKS under Kubernetes) folded under their parent. */
function Techs({ techs, base, active }: { techs: Tech[]; base: string; active?: string }) {
  const link = (t: Tech) => (
    <a href={`${base}technologies/${t.id}/`} aria-current={t.id === active ? 'page' : undefined} className={itemClass(t.id === active)}>
      <span className="truncate">{t.name}</span>
      {t.archived && <span className="ml-auto font-mono text-[10px] text-(--warn) uppercase">Archived</span>}
    </a>
  );
  return techs.filter(t => !t.parent || !techs.some(x => x.id === t.parent)).map(t => {
    const kids = techs.filter(x => x.parent === t.id);
    if (!kids.length) return <div key={t.id} className="flex pl-[18px]">{link(t)}</div>;
    return (
      <details key={t.id} open={t.id === active || kids.some(k => k.id === active)} className="group/t">
        <summary className={rowSummary}><Chevron group="group-open/t:rotate-90" />{link(t)}</summary>
        <div className="mb-1 ml-[9px] border-l pl-1">
          {kids.map(k => <div key={k.id} className="flex">{link(k)}</div>)}
        </div>
      </details>
    );
  });
}

export default function MobileNav({ nav, base, active, page, activePart, activeConcept, section, links, more }: Props) {
  const handbook = section === 'handbook';
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Cloud Parts</SheetTitle>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <nav className="px-3 pt-2 pb-8">
            {links.map(l => (
              <a key={l.path} href={base + l.path} aria-current={l.on ? 'page' : undefined} className={cn('block rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted', l.on && 'text-brand')}>
                {l.label}
              </a>
            ))}
            <div className="mt-1 flex flex-wrap gap-x-1 border-t pt-1">
              {more.map(l => (
                <a key={l.path} href={base + l.path} aria-current={l.on ? 'page' : undefined} className={cn('rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground', l.on && 'text-brand')}>
                  {l.label}
                </a>
              ))}
            </div>
            {handbook && nav.parts.map(part => (
              <details key={part.id} open={part.id === activePart} className="group/part mt-3">
                <summary className={partSummary}>
                  <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open/part:rotate-90" />
                  {part.name}
                </summary>
                {nav.groups.filter(g => g.part === part.id).map(g => {
                  const on = page === 'topic' && g.id === active;
                  return (
                    <div key={g.id} className="mt-2 ml-[15px] border-l pl-1">
                      <a href={`${base}topics/${g.id}/`} aria-current={on ? 'page' : undefined} className={cn(heading, 'ml-[18px] rounded-md py-1 hover:bg-muted hover:text-foreground', on && 'bg-brand-soft text-foreground')}>
                        <span>{g.name}</span><span>{g.code}</span>
                      </a>
                      {g.concepts.map(p => {
                        const techs = g.technologies.filter(t => t.conceptId === p.id);
                        const here = page === 'concept' && p.id === active;
                        const link = (
                          <a href={`${base}concepts/${p.id}/`} aria-current={here ? 'page' : undefined} className={itemClass(here)}>
                            <span className="w-12 shrink-0 font-mono text-[11px] text-muted-foreground">{p.code}</span>
                            <span className="min-w-0 flex-1">{p.name}</span>
                            {techs.length > 0 && <span className="font-mono text-[10px] text-muted-foreground">{techs.length}</span>}
                          </a>
                        );
                        if (!techs.length) return <div key={p.id} className="flex pl-[18px]">{link}</div>;
                        return (
                          <details key={p.id} open={p.id === activeConcept} className="group/c">
                            <summary className={rowSummary}><Chevron group="group-open/c:rotate-90" />{link}</summary>
                            <div className="mb-2 ml-[9px] border-l pl-1">
                              {p.kinds.length
                                ? p.kinds.map(k => (
                                    <div key={k.id}>
                                      <a href={`${base}concepts/${p.id}/${k.id}/`} aria-current={page === 'kind' && k.id === active ? 'page' : undefined} className={cn(subhead, 'ml-[18px]', page === 'kind' && k.id === active && 'bg-brand-soft text-foreground')}>
                                        {k.name}
                                      </a>
                                      <Techs techs={techs.filter(t => t.kind === k.id)} base={base} active={page === 'tech' ? active : undefined} />
                                    </div>
                                  ))
                                : <Techs techs={techs} base={base} active={page === 'tech' ? active : undefined} />}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  );
                })}
              </details>
            ))}
            {section === 'architectures' && (
              <div className="mt-4">
                <div className={heading}><span>Architectures</span></div>
                {nav.architectures.map(a => (
                  <a key={a.id} href={`${base}architectures/${a.id}/`} aria-current={a.id === active ? 'page' : undefined} className={itemClass(a.id === active)}>
                    {a.name}
                  </a>
                ))}
              </div>
            )}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
