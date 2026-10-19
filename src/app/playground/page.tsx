import PlaygroundClient from '@/app/playground/PlaygroundClient';
import type { Template } from '@/components/Playground';
import Shell from '@/components/Shell';
import { CONCEPT_PLAY } from '@/content/play';
import { getCatalog } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';
import { BASICS, type PaletteItem } from '@/lib/playground/model';

export const metadata = meta('Playground', 'Drag technologies onto a canvas, connect them and run traffic through your own architecture.');

export default function PlaygroundPage() {
  const c = getCatalog();
  // Only parts of a running system belong on the canvas, not practices such as code review or sprints.
  const runs = (concept: string) => !!c.concept(concept).providers;

  const palette: PaletteItem[] = [
    ...BASICS,
    ...c.categories.flatMap(cat => [
      ...c.technologies
        .filter(t => t.category === cat.id && runs(t.concepts[0]))
        .map(t => {
          const concept = c.concept(t.concepts[0]);
          return {
            key: `tech:${t.id}`,
            name: t.name,
            sub: concept.name,
            group: cat.name,
            tech: t.id,
            play: { ...CONCEPT_PLAY[t.concepts[0]], ...t.play },
            terms: [...t.concepts.map(id => c.concept(id).name), t.vendor ?? ''].join(' '),
          };
        }),
      ...c.concepts
        .filter(p => p.category === cat.id && runs(p.id))
        .map(p => ({
          key: `concept:${p.id}`,
          name: p.name,
          sub: 'any product',
          group: `${cat.name} · generic`,
          concept: p.id,
          play: CONCEPT_PLAY[p.id] ?? {},
          terms: p.providers?.oss ?? '',
        })),
    ]),
  ];
  const templates: Template[] = c.architectures.map(a => ({ id: a.id, title: a.title, diagram: a.diagram }));

  return (
    <Shell path="playground/" section="playground">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Playground</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Arrange and connect technologies, then watch traffic flow. Add a cache and watch latency drop, take a database down, or send a burst at a queue.
            </p>
          </div>
          <a href={href('architectures/')} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Browse architectures →</a>
        </header>
        <PlaygroundClient palette={palette} templates={templates} base={href()} />
      </div>
    </Shell>
  );
}
