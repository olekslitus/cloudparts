import { ArrowRightIcon } from 'lucide-react';
import type { Catalog, CatalogArch } from '@/lib/catalog';
import { href } from '@/lib/nav';
import { cn } from '@/lib/utils';
import Md from '@/components/Md';

export default function ArchCard({ arch: a, catalog: c, highlight }: { arch: CatalogArch; catalog: Catalog; highlight?: string }) {
  return (
    <a href={href(`architectures/${a.id}/`)} className="group flex flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition hover:ring-foreground/25">
      <span className="flex items-center justify-between gap-3">
        <span className="font-semibold group-hover:text-brand">{a.title}</span>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
      </span>
      <span className="mt-1 text-sm leading-snug text-muted-foreground"><Md text={a.summary} plain /></span>
      <span className="mt-3 flex flex-wrap gap-1.5">
        {a.techs.map(id => (
          <span key={id} className={cn('rounded-md px-2 py-0.5 text-xs', id === highlight ? 'bg-brand-soft font-medium text-brand' : 'bg-muted')}>{c.tech(id).name}</span>
        ))}
      </span>
    </a>
  );
}
