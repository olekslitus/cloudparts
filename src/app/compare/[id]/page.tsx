import Breadcrumbs from '@/components/Breadcrumbs';
import Md from '@/components/Md';
import SectionLabel from '@/components/SectionLabel';
import Shell from '@/components/Shell';
import SourceList from '@/components/SourceList';
import { getCatalog, type CatalogComparison } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().comparisons.map(m => ({ id: m.id }));
}

const find = (id: string) => getCatalog().comparisons.find(x => x.id === id) as CatalogComparison;

export async function generateMetadata({ params }: Params) {
  const m = find((await params).id);
  return meta(m.title, m.tip);
}

export default async function Comparison({ params }: Params) {
  const m = find((await params).id);
  return (
    <Shell path={`compare/${m.id}/`} active={m.id} section="compare">
      <Breadcrumbs items={[{ label: 'Comparisons', path: 'compare/' }]} />
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{m.title}</h1>

      <div className="mt-8 overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b bg-muted/50">
              <th scope="col" className="w-44 px-4 py-3"><span className="sr-only">Dimension</span></th>
              {m.columns.map(col => (
                <th key={col.id} scope="col" className="px-4 py-3 align-bottom">
                  <a href={href(col.href)} className="group block">
                    <span className="font-semibold group-hover:text-brand">{col.name}</span>
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.rows.map((r, i) => (
              <tr key={i} className="border-b last:border-b-0">
                <th scope="row" className="px-4 py-3 align-top font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{r.label}</th>
                {r.values.map((v, j) => <td key={j} className="px-4 py-3 align-top text-[15px] leading-snug"><Md text={v} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 rounded-xl border-l-4 border-brand bg-brand-soft/60 px-5 py-4">
        <SectionLabel className="mb-1.5 text-brand">Rule of thumb</SectionLabel>
        <p className="max-w-3xl text-[17px] leading-relaxed"><Md text={m.tip} /></p>
      </section>

      <section className="mt-14 border-t pt-6 text-sm">
        <SectionLabel>Sources</SectionLabel>
        <SourceList sources={m.sources} />
      </section>
    </Shell>
  );
}
