import Breadcrumbs from '@/components/Breadcrumbs';
import CompareTool from '@/components/CompareTool';
import Shell from '@/components/Shell';
import { getCatalog } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';

export const metadata = meta('Compare technologies side by side', 'Pick up to four technologies and compare what they are, what they are good for, their specs and their trade-offs.');

export default function CompareTechnologies() {
  const c = getCatalog();
  // the written comparisons of products, then the leaders of the busiest workloads
  const starters = [
    ...c.comparisons.filter(m => m.technologies.length).map(m => ({ label: m.columns.map(x => x.name).join(' vs '), ids: m.technologies })),
    ...[...c.workloads]
      .sort((a, b) => b.techs.length - a.techs.length)
      .slice(0, 4)
      .map(w => ({ label: w.name, ids: w.techs.filter(x => !x.tech.archived).slice(0, 3).map(x => x.tech.id) }))
      .filter(s => s.ids.length > 1),
  ];
  return (
    <Shell path="compare/technologies/" section="compare" active="technologies">
      <Breadcrumbs items={[{ label: 'Comparisons', path: 'compare/' }]} />
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Side by side</h1>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">
        Pick up to four technologies, from any concept, and compare them row by row: what they are, the <a href={href('workloads/')} className="underline underline-offset-4 hover:text-foreground">workloads</a> they handle well, their specs, and their trade-offs. The link in the address bar reopens the same comparison.
      </p>
      <CompareTool base={href()} starters={starters} />
    </Shell>
  );
}
