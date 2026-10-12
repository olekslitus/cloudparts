// Logos for technologies and Lucide icons for concepts and topics. Server-only: it pulls in the
// whole Lucide icon set to look icons up by name, which must never reach a client bundle.
//
// A technology's logo is the file public/logos/<id>.svg or .png. Name it <id>.dark.svg when
// the logo is near-black, so it is inverted in dark mode, or <id>.light.svg when it is very pale,
// so it gets a thin outline in light mode. A technology without a logo shows its concept's icon.
import { readdirSync } from 'node:fs';
import { icons, ShapesIcon, type LucideIcon } from 'lucide-react';
import { href } from '@/lib/nav';

export type Logo = { src: string; tone?: 'dark' | 'light' };

// Served as plain files, not imported, so the build never inlines them into every page.
const logos = new Map<string, Logo>(
  readdirSync('public/logos') // the build runs from the project root
    .flatMap(file => {
      const m = file.match(/^([a-z0-9-]+)(?:\.(dark|light))?\.(?:svg|png)$/);
      return m ? [[m[1], { src: href(`logos/${file}`), tone: m[2] as Logo['tone'] }] as const] : [];
    }),
);

export const logoOf = (techId: string): Logo | undefined => logos.get(techId);

/** "inbox" → InboxIcon. Unknown names (the schema rejects them) fall back to a neutral shape. */
export const lucide = (name: string): LucideIcon =>
  (icons as Record<string, LucideIcon>)[name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')] ?? ShapesIcon;
