import { useEffect, useState } from 'react';
import { ArrowLeftRightIcon, BoxIcon, LayersIcon, LibraryIcon, NetworkIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';
import type { NavData } from '@/lib/nav';

// Every word must appear somewhere (name, id, summary or a product name); name matches rank first.
function filter(value: string, search: string, keywords: string[] = []) {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  const name = value.toLowerCase();
  const hay = `${name} ${keywords.join(' ')}`.toLowerCase();
  if (!words.every(w => hay.includes(w))) return 0;
  return words.every(w => name.includes(w)) ? 1 : 0.5;
}

export default function Search({ nav, base }: { nav: NavData; base: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(input|textarea|select)$/i.test(e.target.tagName));
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    window.location.href = base + path;
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-8 w-full justify-start gap-2 bg-muted/40 px-2.5 font-normal text-muted-foreground shadow-none sm:w-56 lg:w-44 xl:w-64"
      >
        <SearchIcon />
        <span className="hidden sm:inline">Search…</span>
                <Kbd className="ml-auto hidden sm:inline-flex">⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search Cloud Parts" description="Find a topic, concept, technology or architecture, such as delivery, event loop or Kafka.">
        <Command filter={filter}>
          <CommandInput placeholder="Try observability, event loop, Kafka…" />
          <CommandList className="max-h-[min(60vh,420px)]">
            <CommandEmpty>Nothing matches. Try a topic like delivery, or a product like Kafka.</CommandEmpty>
            <CommandGroup heading="Topics">
              {nav.groups.map(g => (
                <CommandItem
                  key={g.id}
                  value={`${g.name} ${g.code}`}
                  keywords={[g.id, g.blurb, nav.parts.find(x => x.id === g.part)?.name ?? '', 'topic']}
                  onSelect={() => go(`topics/${g.id}/`)}
                >
                  <LibraryIcon className="text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block font-medium">{g.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{g.blurb}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            {nav.groups.map(g => (
              <CommandGroup key={g.id} heading={g.name}>
                {g.concepts.map(p => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${p.code}`}
                    keywords={[p.id, p.summary, p.products]}
                    onSelect={() => go(`concepts/${p.id}/`)}
                    className="items-start"
                  >
                    <span className="mt-0.5 w-12 shrink-0 font-mono text-[11px] text-muted-foreground">{p.code}</span>
                    <span className="min-w-0">
                      <span className="block font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{p.products}</span>
                    </span>
                  </CommandItem>
                ))}
                {g.concepts.flatMap(p => p.kinds.map(k => (
                  <CommandItem
                    key={k.id}
                    value={`${k.name} ${p.name}`}
                    keywords={[k.id, k.summary]}
                    onSelect={() => go(`concepts/${p.id}/${k.id}/`)}
                    className="items-start"
                  >
                    <span className="mt-0.5 flex w-12 shrink-0 text-muted-foreground"><LayersIcon /></span>
                    <span className="min-w-0">
                      <span className="block font-medium">{k.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{p.name} · {k.summary}</span>
                    </span>
                  </CommandItem>
                )))}
                {g.technologies.map(t => (
                  <CommandItem
                    key={t.id}
                    value={t.name}
                    keywords={[t.id, t.summary, t.terms]}
                    onSelect={() => go(`technologies/${t.id}/`)}
                    className="items-start"
                  >
                    <span className="mt-0.5 flex w-12 shrink-0 text-muted-foreground"><BoxIcon /></span>
                    <span className="min-w-0">
                      <span className="block font-medium">{t.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{t.context} · {t.summary}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            <CommandGroup heading="Architectures">
              {nav.architectures.map(a => (
                <CommandItem key={a.id} value={a.name} keywords={[a.id, a.summary, a.terms, 'architecture', 'stack']} onSelect={() => go(`architectures/${a.id}/`)}>
                  <NetworkIcon className="text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block font-medium">{a.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{a.summary}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Comparisons">
              {nav.comparisons.map(m => (
                <CommandItem key={m.id} value={m.title} keywords={['compare', 'vs']} onSelect={() => go(`compare/${m.id}/`)}>
                  <ArrowLeftRightIcon className="text-muted-foreground" />
                  {m.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
