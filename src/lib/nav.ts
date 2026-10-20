import type { Relation, STAGES } from '@/content/schema';
import type { Catalog } from './catalog';

/** Content text without its `code` backticks, for places that show plain text. */
export const plain = (s: string) => s.replace(/`/g, '');

interface NavItem { id: string; name: string; summary: string }

/** Trimmed catalog data passed to client-side islands (search, mobile nav). */
export interface NavData {
  parts: { id: string; name: string }[];
  /** One per topic (category), in reading order. */
  groups: {
    id: string; code: string; name: string; blurb: string; part: string; icon: string;
    concepts: (NavItem & { code: string; products: string; icon: string; kinds: NavItem[] })[];
    technologies: (NavItem & {
      conceptId: string;
      /** Where it sits, e.g. "Columnar files" or "Managed Kubernetes"; the concept name otherwise. */
      context: string;
      kind?: string;
      parent?: string;
      as?: Relation;
      terms: string;
      archived: boolean;
      stage?: Stage;
      logo?: { src: string; tone?: 'dark' | 'light' };
    })[];
  }[];
  architectures: (NavItem & { terms: string })[];
  comparisons: { id: string; title: string }[];
  /** Foundations and companies, whose pages list the technologies they make. */
  makers: { id: string; name: string; summary: string; path: string; company: boolean; terms: string }[];
}

export const PROVIDER_NAMES = { aws: 'AWS', gcp: 'Google Cloud', azure: 'Azure', oss: 'Open source', vendor: 'Commercial' } as const;
export const PROVIDER_SHORT = { aws: 'AWS', gcp: 'GCP', azure: 'Azure', oss: 'OSS', vendor: 'SaaS' } as const;
/** What kind of offering it is, for fact boxes and tables. */
export const PROVIDER_TYPES = {
  aws: 'Managed service on AWS',
  gcp: 'Managed service on Google Cloud',
  azure: 'Managed service on Azure',
  oss: 'Open source',
  vendor: 'Commercial product',
} as const;

export type Stage = (typeof STAGES)[number] | 'archived';
export const STAGE_LABELS: Record<Stage, string> = {
  preview: 'Preview',
  beta: 'Beta',
  experimental: 'Experimental',
  incubating: 'Incubating',
  renamed: 'Renamed',
  dormant: 'Dormant',
  deprecated: 'Deprecated',
  archived: 'Archived',
};
/** Stages that should make a reader think twice, shown in the warning color. */
export const STAGE_WARN = new Set<Stage>(['dormant', 'deprecated', 'archived']);

/** The badge a technology carries, if any: archived wins over a status. */
export function stageOf(t: { archived?: unknown; status?: { stage: Stage } }): Stage | undefined {
  return t.archived ? 'archived' : t.status?.stage;
}

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

/** `logo` finds a technology's logo (see src/lib/glyphs.ts, which is server-only and so passed in). */
export function navData(c: Catalog, logo: (id: string) => NavData['groups'][number]['technologies'][number]['logo'] = () => undefined): NavData {
  return {
    parts: c.parts.map(p => ({ id: p.id, name: p.name })),
    groups: c.categories.map(cat => ({
      id: cat.id,
      code: cat.code,
      name: cat.name,
      blurb: cat.blurb,
      part: cat.part,
      icon: cat.icon,
      concepts: c.concepts
        .filter(p => p.category === cat.id)
        .map(p => ({
          id: p.id, code: p.code, name: p.name, summary: plain(p.summary), icon: p.icon, products: Object.values(p.providers ?? {}).join(', '),
          kinds: p.kinds.map(k => ({ id: k.id, name: k.name, summary: plain(k.summary) })),
        })),
      technologies: c.technologies
        .filter(t => t.category === cat.id)
        .map(t => ({
          id: t.id,
          name: t.name,
          summary: plain(t.summary),
          conceptId: t.concepts[0],
          context: t.parent ? relationLabel(t.parent.as, c.tech(t.parent.id).name) : t.kind ? c.kind(t.kind).name : c.concept(t.concepts[0]).name,
          kind: t.kind,
          parent: t.parent?.id,
          as: t.parent?.as,
          archived: !!t.archived,
          stage: stageOf(t),
          logo: logo(t.id),
          // concept and kind names, vendor and deep-dive headings, so "glacier" finds S3 and "lakehouse" finds DuckLake
          terms: [
            ...t.concepts.map(id => c.concept(id).name),
            ...t.uses.map(id => c.concept(id).name),
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
      summary: plain(a.summary),
      terms: a.techs.map(t => c.tech(t).name).join(' '),
    })),
    comparisons: c.comparisons.map(m => ({ id: m.id, title: m.title })),
    makers: c.foundations.map(f => ({
      id: f.id, name: f.name, summary: plain(f.summary), path: f.path, company: f.type === 'company',
      terms: f.projects.map(t => t.name).join(' '),
    })),
  };
}

/** The GitHub repository, for "Improve this page" links. NEXT_PUBLIC_REPO_URL overrides it, e.g. in a fork. */
export const REPO_URL: string = process.env.NEXT_PUBLIC_REPO_URL || 'https://github.com/olekslitus/cloudparts';

/** Builds a link that respects the site's base path (BASE_PATH, see next.config.ts). */
export function href(path = ''): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/${path.replace(/^\//, '')}`;
}
