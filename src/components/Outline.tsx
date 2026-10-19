// The page outline, Notion-style: a column of short dashes at the right edge of wide screens.
// Hover or tab into it to see the section names; the dash of the section you're reading is darker.
import OutlineScript from '@/components/OutlineScript';

export default function Outline({ items }: { items: { id: string; label: string }[] }) {
  if (items.length <= 2) return null;
  return (
    <nav aria-label="On this page" className="group/outline fixed top-1/2 right-3 z-30 hidden -translate-y-1/2 xl:block">
      <ul className="flex flex-col items-end gap-2.5 px-1 py-2" aria-hidden="true">
        {items.map(i => <li key={i.id}><span data-dash={i.id} className="block h-[2px] w-3.5 rounded-full bg-foreground/20 transition-all"></span></li>)}
      </ul>
      <ul className="pointer-events-none absolute top-1/2 right-0 max-h-[75vh] w-64 -translate-y-1/2 overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground opacity-0 shadow-lg transition-opacity group-focus-within/outline:pointer-events-auto group-focus-within/outline:opacity-100 group-hover/outline:pointer-events-auto group-hover/outline:opacity-100">
        {items.map(i => (
          <li key={i.id}><a href={`#${i.id}`} data-outline={i.id} className="block rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{i.label}</a></li>
        ))}
      </ul>
      <OutlineScript />
    </nav>
  );
}
