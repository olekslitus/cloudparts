// A small lifecycle badge (Beta, Incubating, Renamed, Dormant, Archived...) shown next to a technology's name.
import type { CatalogTech } from '@/lib/catalog';
import { STAGE_LABELS, STAGE_WARN, stageOf } from '@/lib/nav';
import { cn } from '@/lib/utils';

interface Props {
  tech: CatalogTech;
  /** Larger, for page titles. */
  large?: boolean;
}

export default function StatusBadge({ tech: t, large }: Props) {
  const stage = stageOf(t);
  if (!stage) return null;
  const title = t.archived ? t.archived.reason : t.status?.note;
  return (
    <span
      title={title}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full font-mono font-medium tracking-wide uppercase',
        large ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-px text-[10px]',
        STAGE_WARN.has(stage) ? 'bg-(--warn)/15 text-(--warn)' : 'bg-brand-soft text-brand',
      )}
    >{STAGE_LABELS[stage]}</span>
  );
}
