import BenchmarkList from '@/components/BenchmarkList';
import SectionLabel from '@/components/SectionLabel';
import Shell from '@/components/Shell';
import { getCatalog } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';

export const metadata = meta('Benchmarks', 'Public database benchmarks: what each one runs, which systems it covers, and how to read its numbers.');

const rules = [
  ['Who runs it?', 'A benchmark kept by one of the vendors in it tends to measure what that vendor is good at. Check who wrote the queries and who submits results.'],
  ['Does the workload look like yours?', 'One wide table without joins, a fixed query mix, or data that fits in memory can rank systems very differently from your own tables and traffic.'],
  ['Same hardware and versions?', 'Compare results on the same machine type. Old versions linger in results long after a system has changed.'],
  ['How much tuning?', 'Hand-tuned settings, pre-computed rollups and warm caches can each move a result by an order of magnitude.'],
];

export default function Benchmarks() {
  const c = getCatalog();
  // a benchmark sits under the category of its first concept
  const groups = c.categories
    .map(cat => ({ ...cat, benchmarks: c.benchmarks.filter(b => c.concept(b.concepts[0]).category === cat.id) }))
    .filter(g => g.benchmarks.length);

  return (
    <Shell path="benchmarks/" section="benchmarks">
      <header className="max-w-3xl">
        <div className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">{c.benchmarks.length} benchmarks</div>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Benchmarks</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Public benchmarks that compare the products of one concept. Each page explains what the benchmark runs, which systems in this catalog it covers, and what its numbers leave out. Benchmarks also appear on the pages of the concepts and technologies they cover.
        </p>
      </header>

      <section className="mt-10">
        <SectionLabel>Before you trust a result</SectionLabel>
        <div className="grid max-w-[50rem] gap-2">
          {rules.map(([q, a]) => (
            <div key={q} className="rounded-xl border p-4">
              <p className="font-medium">{q}</p>
              <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {groups.map(g => (
        <section key={g.id} id={g.id} className="mt-12 scroll-mt-20">
          <div className="mb-4 flex items-baseline gap-2 border-b pb-2">
            <h2 className="text-2xl font-semibold tracking-tight">{g.name}</h2>
          </div>
          <BenchmarkList benchmarks={g.benchmarks} catalog={c} />
        </section>
      ))}

      <p className="mt-12 text-sm text-muted-foreground">
        Looking for articles and talks instead? See <a href={href('resources/')} className="underline underline-offset-4 hover:text-foreground">Resources</a>.
      </p>
    </Shell>
  );
}
