// A list of sources. A source with an archived copy links to the copy, with the original alongside.
import { ArchiveIcon, ExternalLinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  sources: { label: string; url: string; archive?: string }[];
  className?: string;
}

const link = 'inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline';

export default function SourceList({ sources, className }: Props) {
  return (
    <ul className={cn('space-y-1.5', className)}>
      {sources.map((s, i) => (
        <li key={i}>
          {s.archive ? (
            <>
              <a href={s.archive} rel="noopener" className={link}>{s.label}<ArchiveIcon className="size-3 shrink-0" /></a>
              <span className="text-xs text-muted-foreground"> · archived copy, <a href={s.url} rel="noopener" className="underline-offset-4 hover:text-foreground hover:underline">original</a></span>
            </>
          ) : (
            <a href={s.url} rel="noopener" className={link}>{s.label}<ExternalLinkIcon className="size-3 shrink-0" /></a>
          )}
        </li>
      ))}
    </ul>
  );
}
