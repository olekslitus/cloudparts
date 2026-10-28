// A small pill naming the open-source foundation a technology belongs to, e.g. "CNCF · Graduated", linking to its page.
import { LandmarkIcon } from 'lucide-react';
import type { Membership } from '@/lib/catalog';
import { href } from '@/lib/nav';
import { cn } from '@/lib/utils';

/** A foundation's name mid-sentence: "part of the Linux Foundation", not "part of The Linux Foundation". */
export const inSentence = (name: string) => name.replace(/^The /, 'the ');

/** A foundation's stages, most mature first and any retired stage (archived, the Attic) last. */
export const matureFirst = <T extends { id: string }>(stages: T[]) =>
  [...stages].reverse().sort((a, b) => Number(/archiv|attic|retir/.test(a.id)) - Number(/archiv|attic|retir/.test(b.id)));

/** "CNCF graduated", "Apache top-level project", "Linux Foundation project". */
export const membershipLabel = (m: Membership) =>
  `${m.foundation.short ?? m.foundation.name}${m.stage ? ` · ${m.stage.name}` : ' project'}`;

export default function FoundationBadge({ membership: m, className }: { membership: Membership; className?: string }) {
  const parent = m.parents[0];
  return (
    <a
      href={href(m.foundation.path)}
      title={[`A project of ${inSentence(m.foundation.name)}${parent ? `, part of ${inSentence(parent.name)}` : ''}`, m.via, m.stage?.summary].filter(Boolean).join('. ')}
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition hover:border-foreground/30 hover:bg-muted', className)}
    >
      <LandmarkIcon className="size-3.5 text-muted-foreground" />{membershipLabel(m)}
    </a>
  );
}
