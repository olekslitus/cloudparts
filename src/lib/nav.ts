import type { Relation } from '@/content/schema';
import type { Catalog } from './catalog';

interface NavItem { id: string; name: string; summary: string }

/** Trimmed catalog data passed to client-side islands (search, mobile nav). */
export interface NavData {
  parts: { id: string; name: string }[];
  /** One per topic (category), in reading order. */
  groups: {
    id: string; code: string; name: string; blurb: string; part: string;
    concepts: (NavItem & { code: string; products: string; kinds: NavItem[] })[];
    technologies: (NavItem & {
      conceptId: string;
      /** Where it sits, e.g. "Columnar files" or "Managed Kubernetes"; the concept name otherwise. */
      context: string;
      kind?: string;
      parent?: string;
      as?: Relation;
      terms: string;
      archived: boolean;
    })[];
  }[];
  architectures: (NavItem & { terms: string })[];
  comparisons: { id: string; title: string }[];
}

export const PROVIDER_NAMES = { aws: 'AWS', gcp: 'Google Cloud', azure: 'Azure', oss: 'Open source', vendor: 'Commercial' } as const;
export const PROVIDER_SHORT = { aws: 'AWS', gcp: 'GCP', azure: 'Azure', oss: 'OSS', vendor: 'SaaS' } as const;

/** Headings for a technology's children, grouped by how they relate to it. */
export const RELATION_GROUPS: Record<Relation, string> = {
  managed: 'Managed services',
  distribution: 'Distributions',
  fork: 'Forks',
  local: 'For local development',
  tool: 'Tools',
  extension: 'Built on it',
};

/** e.g. "Managed Kubernetes", "Fork of Terraform". */
export function relationLabel(as: Relation, parent: string): string {
  return {
    managed: `Managed ${parent}`,
    distribution: `${parent} distribution`,
    fork: `Fork of ${parent}`,
    local: `Local ${parent}`,
    tool: `Tool for ${parent}`,
    extension: `Built on ${parent}`,
  }[as];
}

export function navData(c: Catalog): NavData {
  return {
    parts: c.parts.map(p => ({ id: p.id, name: p.name })),
    groups: c.categories.map(cat => ({
      id: cat.id,
      code: cat.code,
      name: cat.name,
      blurb: cat.blurb,
      part: cat.part,
      concepts: c.concepts
        .filter(p => p.category === cat.id)
        .map(p => ({
          id: p.id, code: p.code, name: p.name, summary: p.summary, products: Object.values(p.providers ?? {}).join(', '),
          kinds: p.kinds.map(k => ({ id: k.id, name: k.name, summary: k.summary })),
        })),
      technologies: c.technologies
        .filter(t => t.category === cat.id)
        .map(t => ({
          id: t.id,
          name: t.name,
          summary: t.summary,
          conceptId: t.concepts[0],
          context: t.parent ? relationLabel(t.parent.as, c.tech(t.parent.id).name) : t.kind ? c.kind(t.kind).name : c.concept(t.concepts[0]).name,
          kind: t.kind,
          parent: t.parent?.id,
          as: t.parent?.as,
          archived: !!t.archived,
          // concept and kind names, vendor and deep-dive headings, so "glacier" finds S3 and "lakehouse" finds DuckLake
          terms: [
            ...t.concepts.map(id => c.concept(id).name),
            ...t.kinds.map(id => c.kind(id).name),
            t.parent ? c.tech(t.parent.id).name : '',
            t.vendor ?? '',
            ...t.sections.flatMap(s => [s.title, ...(s.type === 'table' ? s.rows.map(r => r.label) : s.type === 'cards' ? s.items.map(i => i.name) : [])]),
          ].join(' '),
        })),
    })),
    architectures: c.architectures.map(a => ({
      id: a.id,
      name: a.title,
      summary: a.summary,
      terms: a.techs.map(t => c.tech(t).name).join(' '),
    })),
    comparisons: c.comparisons.map(m => ({ id: m.id, title: m.title })),
  };
}

/** Builds a link that respects the site's base path. */
export function href(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return base + path.replace(/^\//, '');
}
