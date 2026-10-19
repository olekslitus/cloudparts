// The sources behind a page, collapsed by default, with the date the facts were checked.
import { ChevronRightIcon } from 'lucide-react';
import SourceList from '@/components/SourceList';

interface Props {
  sources: { label: string; url: string; archive?: string }[];
  checked?: string;
}

export default function Sources({ sources, checked }: Props) {
  const when = checked && new Date(`${checked}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return (
    <details id="sources" className="group/s mt-6 scroll-mt-20 rounded-xl ring-1 ring-foreground/10">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3.5 select-none hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open/s:rotate-90" />
        <span className="font-semibold">Sources</span>
        <span className="ml-auto text-sm text-muted-foreground">{sources.length}{when && ` · facts checked ${when}`}</span>
      </summary>
      <div className="border-t px-4 pt-4 pb-5 text-sm sm:px-6">
        <SourceList sources={sources} />
      </div>
    </details>
  );
}
