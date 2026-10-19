'use client';

// One level of the sidebar tree. Every item looks the same: a chevron when it has children, a logo
// or icon, and its name. Items with children are <details>, so they fold without JavaScript; the
// chevron is the toggle and the name is a link. ShellScript.tsx remembers what was folded.
// A client component only so the page carries the tree as compact data (SideNode, built in Shell.tsx)
// rather than as a description of every element; the markup is rendered on the server all the same.
import { ChevronRightIcon } from 'lucide-react';
import type { Logo } from '@/lib/glyphs';
import { cn } from '@/lib/utils';

/** A sidebar item, with its picture already resolved: a logo, or else a Lucide icon from the page's sprite. */
export interface SideNode {
  key: string;
  label: string;
  href: string;
  logo?: Logo;
  icon?: string;
  current?: boolean;
  open?: boolean;
  tag?: { text: string; warn: boolean };
  muted?: boolean;
  children: SideNode[];
}

export default function NavTree({ nodes, depth = 0 }: { nodes: SideNode[]; depth?: number }) {
  const pad = { paddingLeft: `${depth * 14 + 4}px` };
  const row = (n: SideNode) => cn(
    'flex h-8 items-center gap-1 rounded-md pr-2 text-sm transition-colors hover:bg-muted lg:h-7',
    n.current ? 'bg-foreground/10 font-medium text-foreground' : 'text-foreground/85',
  );
  return (
    <ul>
      {nodes.map(n => {
        const link = (
          <a href={n.href} aria-current={n.current ? 'page' : undefined} className="flex h-full min-w-0 flex-1 items-center gap-2">
            {n.logo ? (
              <img src={n.logo.src} alt="" loading="lazy" decoding="async" className={cn('size-4 shrink-0 object-contain', n.logo.tone && `logo-${n.logo.tone}`)} />
            ) : n.icon && (
              <svg className="size-4 shrink-0 text-muted-foreground" aria-hidden="true"><use href={`#i-${n.icon}`} /></svg>
            )}
            <span className={cn('truncate', n.muted && 'text-muted-foreground')}>{n.label}</span>
            {n.tag && <span className={cn('ml-auto shrink-0 text-[11px]', n.tag.warn ? 'text-(--warn)' : 'text-brand')}>{n.tag.text}</span>}
          </a>
        );
        return (
          <li key={n.key}>
            {n.children.length ? (
              <details data-nav={n.key} open={n.open || undefined}>
                <summary className={cn(row(n), 'cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden')} style={pad}>
                  <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground" aria-hidden="true">
                    <ChevronRightIcon className="size-3.5 transition-transform" data-chev />
                  </span>
                  {link}
                </summary>
                <NavTree nodes={n.children} depth={depth + 1} />
              </details>
            ) : (
              <div className={row(n)} style={pad}>
                <span className="size-4 shrink-0" aria-hidden="true"></span>
                {link}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
