// What the side-by-side compare tool (src/components/CompareTool.tsx) needs about every technology, written
// once as /compare.json at build time, like /nav.json for search.
import type { Spec } from '@/content/schema';
import type { Catalog } from './catalog';
import type { Logo } from './glyphs';
import { PROVIDER_TYPES, relationLabel, STAGE_LABELS, stageOf } from './nav';

export interface CompareTech {
  id: string;
  name: string;
  logo?: Logo;
  /** Where it sits, e.g. "Distributed SQL" or "Managed Kubernetes". */
  context: string;
  summary: string;
  vendor?: string;
  offered: string;
  license?: string;
  /** e.g. "Archived: …" or "Beta: …"; undefined when it's a stable, maintained product. */
  status?: string;
  /** Year of the first entry in its history timeline. */
  since?: string;
  strengths: string[];
  limits: string[];
  goodFor: { id: string; why: string }[];
  specs: Record<string, string>;
  /** Its closest alternatives, best first: what the tool suggests adding next. */
  alternatives: string[];
}

export interface CompareData {
  specs: Spec[];
  workloads: { id: string; name: string }[];
  techs: CompareTech[];
}

export function compareData(c: Catalog, logo: (id: string) => Logo | undefined): CompareData {
  return {
    specs: c.specs,
    workloads: c.workloads.map(w => ({ id: w.id, name: w.name })),
    techs: c.technologies.map(t => {
      const stage = stageOf(t);
      return {
        id: t.id,
        name: t.name,
        logo: logo(t.id),
        context: t.parent ? relationLabel(t.parent.as, c.tech(t.parent.id).name) : t.kind ? c.kind(t.kind).name : c.concept(t.concepts[0]).name,
        summary: t.summary,
        vendor: t.vendor,
        offered: PROVIDER_TYPES[t.provider],
        license: t.license,
        status: stage && `${STAGE_LABELS[stage]}: ${t.archived ? t.archived.reason : t.status!.note}`,
        since: t.history?.timeline[0]?.year,
        strengths: t.strengths,
        limits: t.limits,
        goodFor: t.goodFor,
        specs: t.specs,
        alternatives: c.alternativesOf(t.id).filter(x => !x.archived).slice(0, 6).map(x => x.id),
      };
    }),
  };
}
