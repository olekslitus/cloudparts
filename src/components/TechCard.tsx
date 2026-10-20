// One technology as a full-width row: name, badge and type on top, its summary underneath.
import Glyph from '@/components/Glyph';
import StatusBadge from '@/components/StatusBadge';
import type { CatalogTech } from '@/lib/catalog';
import { href, PROVIDER_NAMES } from '@/lib/nav';
import Md from '@/components/Md';

interface Props {
  tech: CatalogTech;
  /** Shown as "Mainly <also>" when the row appears under a secondary concept. */
  also?: string;
  /** A short phrase shown above the summary, e.g. a "worksWith" relationship. */
  note?: string;
  /** Technologies listed under this one, named at the bottom of the row. */
  family?: CatalogTech[];
}

export default function TechCard({ tech: t, also, note, family = [] }: Props) {
  return (
    <a href={href(`technologies/${t.id}/`)} className="group flex flex-col rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 transition hover:ring-foreground/25">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Glyph tech={t} className="size-5" />
        <span className="font-medium group-hover:text-brand">{t.name}</span>
        <StatusBadge tech={t} />
        <span className="ml-auto shrink-0 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">{PROVIDER_NAMES[t.provider]}</span>
      </span>
      {note && <span className="mt-1 text-xs font-medium text-brand">{note}</span>}
      <span className="mt-1 text-sm leading-snug text-muted-foreground"><Md text={t.summary} plain /></span>
      {family.length > 0 && (
        <span className="mt-2 text-xs text-muted-foreground"><span className="font-medium text-foreground/80">+{family.length}</span> {family.slice(0, 4).map(x => x.name).join(', ')}{family.length > 4 && '…'}</span>
      )}
      {also && <span className="mt-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Mainly {also}</span>}
    </a>
  );
}
