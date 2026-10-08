import type { Diagram } from '@/content/schema';
import type { NodeLink } from '@/lib/sim/engine';
import type { Catalog } from './catalog';
import { href } from './nav';

/**
 * Where each node in a diagram links to: its technology page if it has `tech`,
 * otherwise its concept page. Nodes for the page you're on aren't links.
 */
export function diagramLinks(c: Catalog, d: Diagram, here?: { tech?: string; concept?: string }): Record<string, NodeLink> {
  const out: Record<string, NodeLink> = {};
  for (const n of d.nodes) {
    if (n.tech) {
      if (n.tech !== here?.tech) out[n.id] = { href: href(`technologies/${n.tech}/`), name: c.tech(n.tech).name };
    } else if (n.concept) {
      if (n.concept !== here?.concept) out[n.id] = { href: href(`concepts/${n.concept}/`), name: c.concept(n.concept).name };
    }
  }
  return out;
}

/** Node ids that stand for the page you're on, to highlight them. */
export function diagramHere(d: Diagram, here: { tech?: string; concept?: string }): string[] {
  return d.nodes.filter(n => (here.tech && n.tech === here.tech) || (here.concept && !n.tech && n.concept === here.concept)).map(n => n.id);
}
