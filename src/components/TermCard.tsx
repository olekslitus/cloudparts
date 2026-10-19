// The card that explains an underlined term (see Md.tsx): its kind, name and one-line summary, and
// a button that opens its page in a new tab. One card per page, filled in for whichever term is hovered
// or focused. On touch screens the first tap shows the card and a second tap follows the link.
import { ExternalLinkIcon } from 'lucide-react';
import TermCardScript from '@/components/TermCardScript';

export default function TermCard() {
  return (
    <>
      <div data-term-card role="tooltip" hidden className="fixed z-50 w-[min(320px,calc(100vw-24px))] rounded-xl bg-popover p-3.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p data-kind className="text-[11px] tracking-wide text-muted-foreground uppercase"></p>
            <p data-name className="mt-0.5 font-medium leading-snug"></p>
          </div>
          <a data-open target="_blank" rel="noopener" className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Open in a new tab" title="Open in a new tab">
            <ExternalLinkIcon className="size-4" />
          </a>
        </div>
        <p data-tip className="mt-1.5 text-sm leading-snug text-muted-foreground"></p>
      </div>
      <TermCardScript />
    </>
  );
}
