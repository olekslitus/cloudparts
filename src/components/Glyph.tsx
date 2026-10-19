// The small picture in front of a name: a technology's logo, or else the Lucide icon of its concept
// (or of the concept or topic itself), drawn from the page's icon sprite (IconSprite.tsx).
// Decorative, so screen readers skip it.
import type { CatalogTech } from '@/lib/catalog';
import { getCatalog } from '@/lib/catalog';
import { logoOf } from '@/lib/glyphs';
import { cn } from '@/lib/utils';

interface Props {
  tech?: CatalogTech;
  /** A Lucide icon name, used when there is no technology logo. */
  icon?: string;
  className?: string;
}

export default function Glyph({ tech, icon, className: size = 'size-4' }: Props) {
  const logo = tech && logoOf(tech.id);
  const name = icon ?? (tech && getCatalog().concept(tech.concepts[0]).icon);
  if (logo) {
    return <img src={logo.src} alt="" loading="lazy" decoding="async" className={cn(size, 'shrink-0 object-contain', logo.tone && `logo-${logo.tone}`)} />;
  }
  return name ? <svg className={cn(size, 'shrink-0 text-muted-foreground')} aria-hidden="true"><use href={`#i-${name}`} /></svg> : null;
}
