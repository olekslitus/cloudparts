// Every Lucide icon the site picks by name (concepts, topics, areas, site sections), drawn once per
// page as <symbol id="i-<name>">. Glyph.tsx and the search dialog then reference one with
// <svg><use href="#i-<name>" /></svg>, so neither repeats the paths nor ships the icon set to the browser.
import { getCatalog } from '@/lib/catalog';
import { lucide } from '@/lib/glyphs';
import { SITE_ICONS } from '@/lib/navtree';

export default function IconSprite() {
  const c = getCatalog();
  const names = [...new Set([...c.parts.map(p => p.icon), ...c.categories.map(x => x.icon), ...c.concepts.map(p => p.icon), ...c.workloads.map(w => w.icon), ...SITE_ICONS])];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      {names.map(name => {
        const Icon = lucide(name);
        return <symbol key={name} id={`i-${name}`} viewBox="0 0 24 24"><Icon /></symbol>;
      })}
    </svg>
  );
}
