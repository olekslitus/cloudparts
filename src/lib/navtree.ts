// The sidebar as one tree: every section of the site, each item shaped the same way. Concepts holds the
// handbook as a book (area › topic › concept › the concepts and kinds under it); Technologies holds every
// product once, by what it is (topic › type › kind › product › managed versions).
import type { Catalog, CatalogConcept, CatalogTech } from '@/lib/catalog';
import { href, STAGE_LABELS, STAGE_WARN, stageOf } from '@/lib/nav';

export interface NavNode {
  /** Stable id used to remember whether the item is open, e.g. "concept:queue". */
  key: string;
  label: string;
  href: string;
  tech?: CatalogTech;
  icon?: string;
  current?: boolean;
  /** Opens on first visit; the branch holding the current page always opens. */
  open?: boolean;
  /** A short label after the name, e.g. "Beta". */
  tag?: { text: string; warn: boolean };
  muted?: boolean;
  children: NavNode[];
}

/** Which page is showing, so its item is highlighted and its branch starts open. */
export interface Where {
  section: string;
  /** What kind of page `active` is. */
  page?: 'topic' | 'concept' | 'kind' | 'tech' | 'compare' | 'architecture' | 'benchmark' | 'workload';
  active?: string;
}

/** Icons the site uses outside the content: sections, kinds, comparisons, architectures, benchmarks. */
export const SITE_ICONS = ['house', 'shapes', 'box', 'arrow-left-right', 'network', 'square-mouse-pointer', 'bookmark', 'gauge', 'folder', 'building-2', 'landmark', 'layout-grid', 'timeline', 'target'];

export function navTree(c: Catalog, { section, page, active }: Where): NavNode[] {
  const on = (kind: Where['page'], id: string) => page === kind && active === id;
  /** Opens a node when anything under it is the current page. */
  const branch = (n: Omit<NavNode, 'open'> & { open?: boolean }): NavNode => ({
    ...n,
    open: n.open || n.current || n.children.some(k => k.current || k.open),
  });

  const techs = (list: CatalogTech[]): NavNode[] =>
    list
      .filter(t => !t.parent || !list.some(x => x.id === t.parent!.id))
      .map(t => {
        const stage = stageOf(t);
        return branch({
          key: `tech:${t.id}`,
          label: t.name,
          href: href(`technologies/${t.id}/`),
          tech: t,
          current: on('tech', t.id),
          muted: !!t.archived,
          tag: stage && { text: STAGE_LABELS[stage], warn: STAGE_WARN.has(stage) },
          children: techs(list.filter(x => x.parent?.id === t.id)),
        });
      });

  // Concepts read like a book: area › topic › concept › the concepts and kinds under it. No products here.
  const concept = (p: CatalogConcept): NavNode => branch({
    key: `concept:${p.id}`,
    label: p.name,
    href: href(`concepts/${p.id}/`),
    icon: p.icon,
    current: on('concept', p.id),
    children: [
      ...p.kinds.map(k => ({
        key: `kind:${p.id}:${k.id}`, label: k.name, href: href(`concepts/${p.id}/${k.id}/`), icon: 'folder', current: on('kind', k.id), children: [],
      })),
      ...c.subconcepts(p.id).map(concept),
    ],
  });

  const handbook = c.parts.map(part => branch({
    key: `part:${part.id}`,
    label: part.name,
    href: href(`concepts/#${part.id}`),
    icon: part.icon,
    children: part.categories.map(cat => branch({
      key: `topic:${cat.id}`,
      label: cat.name,
      href: href(`topics/${cat.id}/`),
      icon: cat.icon,
      current: on('topic', cat.id),
      children: c.concepts.filter(p => p.category === cat.id && !p.parent).map(concept),
    })),
  }));

  // Every product once, under what it is: topic › type (the concept it's an example of) › kind › product.
  // The topic, type and kind rows only lead to their pages, which the Concepts tree highlights.
  const catalog = c.categories.map(cat => branch({
    key: `techs:${cat.id}`,
    label: cat.name,
    href: href(`topics/${cat.id}/#technologies`),
    icon: cat.icon,
    children: c.concepts.filter(p => p.category === cat.id).flatMap(p => {
      const mine = c.technologies.filter(t => t.concepts[0] === p.id);
      if (!mine.length) return [];
      const kinds = p.kinds.filter(k => mine.some(t => t.kind === k.id));
      return [branch({
        key: `type:${p.id}`,
        label: p.name,
        href: href(`concepts/${p.id}/#technologies`),
        icon: p.icon,
        children: kinds.length
          ? kinds.map(k => branch({
              key: `type:${p.id}:${k.id}`, label: k.name, href: href(`concepts/${p.id}/${k.id}/`), icon: 'folder', children: techs(mine.filter(t => t.kind === k.id)),
            }))
          : techs(mine),
      })];
    }),
  })).filter(n => n.children.length);

  const leaf = (key: string, label: string, path: string, icon: string, current = false): NavNode =>
    ({ key, label, href: href(path), icon, current, children: [] });

  return [
    leaf('home', 'Home', '', 'house', section === 'home'),
    leaf('landscape', 'Landscape', 'landscape/', 'layout-grid', section === 'landscape'),
    leaf('timeline', 'Timeline', 'timeline/', 'timeline', section === 'timeline'),
    branch({ ...leaf('concepts', 'Concepts', 'concepts/', 'shapes', section === 'concepts' && !active), open: true, children: handbook }),
    branch({ ...leaf('technologies', 'Technologies', 'technologies/', 'box', section === 'technologies' && !active), children: catalog }),
    branch({
      ...leaf('compare', 'Compare', 'compare/', 'arrow-left-right', section === 'compare' && !active),
      children: [
        leaf('compare:technologies', 'Side by side', 'compare/technologies/', 'arrow-left-right', on('compare', 'technologies')),
        ...c.comparisons.map(m => leaf(`compare:${m.id}`, m.title, `compare/${m.id}/`, 'arrow-left-right', on('compare', m.id))),
      ],
    }),
    branch({
      ...leaf('workloads', 'Workloads', 'workloads/', 'target', section === 'workloads' && !active),
      children: c.workloads.map(w => leaf(`workload:${w.id}`, w.name, `workloads/${w.id}/`, w.icon, on('workload', w.id))),
    }),
    branch({
      ...leaf('architectures', 'Architectures', 'architectures/', 'network', section === 'architectures' && !active),
      children: c.architectures.map(a => leaf(`arch:${a.id}`, a.title, `architectures/${a.id}/`, 'network', on('architecture', a.id))),
    }),
    leaf('playground', 'Playground', 'playground/', 'square-mouse-pointer', section === 'playground'),
    leaf('resources', 'Resources', 'resources/', 'bookmark', section === 'resources'),
    branch({
      ...leaf('benchmarks', 'Benchmarks', 'benchmarks/', 'gauge', section === 'benchmarks' && !active),
      children: c.benchmarks.map(b => leaf(`bench:${b.id}`, b.name, `benchmarks/${b.id}/`, 'gauge', on('benchmark', b.id))),
    }),
  ];
}
