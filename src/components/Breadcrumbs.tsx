// Where this page sits in the handbook: area / topic / concept.
import { ChevronRightIcon } from 'lucide-react';
import { href } from '@/lib/nav';

export default function Breadcrumbs({ items }: { items: { label: string; path?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1.5 font-mono text-xs tracking-wider text-muted-foreground uppercase">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRightIcon className="size-3 opacity-60" aria-hidden="true" />}
            {item.path ? <a href={href(item.path)} className="hover:text-foreground">{item.label}</a> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
