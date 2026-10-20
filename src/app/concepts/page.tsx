import Glyph from '@/components/Glyph';
import Shell from '@/components/Shell';
import { getCatalog } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';
import Md from '@/components/Md';

export const metadata = meta('Concepts', 'The ideas behind modern software and the products that implement them, in five areas: build, infrastructure, data, ship and run, and teams.');

export default function ConceptsPage() {
  const c = getCatalog();
  return (
    <Shell path="concepts/" section="concepts">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Concepts</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Start from an idea, then go deeper to the products. Learn what a queue or a table format does once, and every product that implements it makes sense. {c.concepts.length} concepts in {c.parts.length} areas.
        </p>
        <a href={href('technologies/')} className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Looking for a product? Search all {c.technologies.length} technologies →</a>
      </header>

      <div className="max-w-[50rem]">
        {c.parts.map(part => (
          <section key={part.id} id={part.id} className="mt-14 scroll-mt-20" aria-labelledby={`${part.id}-h`}>
            <div className="border-b pb-2">
              <h2 id={`${part.id}-h`} className="text-2xl font-semibold tracking-tight">{part.name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{part.blurb}</p>
            </div>
            {part.categories.map(cat => (
              <section key={cat.id} className="mt-6">
                <a href={href(`topics/${cat.id}/`)} className="group inline-block">
                  <h3 className="flex items-center gap-2 font-semibold group-hover:text-brand"><Glyph icon={cat.icon} className="size-4" />{cat.name} <span className="text-sm font-normal text-muted-foreground opacity-0 transition group-hover:opacity-100">topic page →</span></h3>
                  <span className="block text-sm text-muted-foreground">{cat.blurb}</span>
                </a>
                <ul className="mt-2 divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                  {c.concepts.filter(p => p.category === cat.id).map(p => {
                    const k = c.techsFor(p.id).filter(t => !t.parent).length + c.usedFor(p.id).length;
                    return (
                      <li key={p.id}>
                        <a href={href(`concepts/${p.id}/`)} className="group flex gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60" style={p.parent ? { paddingLeft: `${16 + 28 * c.ancestors(p.id).length}px` } : undefined}>
                          <Glyph icon={p.icon} className="mt-0.5 size-5" />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="font-medium group-hover:text-brand">{p.name}</span>
                              {k > 0 && <span className="shrink-0 text-xs text-muted-foreground">{k} {k === 1 ? 'technology' : 'technologies'}</span>}
                            </span>
                            <span className="block text-sm leading-snug text-muted-foreground"><Md text={p.summary} plain /></span>
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </section>
        ))}
      </div>
    </Shell>
  );
}
