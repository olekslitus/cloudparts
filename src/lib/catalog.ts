// Loads and cross-checks the catalog once per build, and adds derived fields
// (category codes like MSG-02, ordering, lookups between concepts, technologies
// and architectures) that pages share.
import { getCollection } from 'astro:content';
import systemMapJson from '../../content/system-map.json';
import { findProblems } from '@/content/integrity';
import {
  diagram, RELATIONS, type Architecture, type Benchmark, type Category, type Part, type Comparison, type Concept, type Diagram, type Foundation, type Kind, type Resource, type Technology,
} from '@/content/schema';

export interface CatalogConcept extends Concept {
  id: string;
  /** e.g. "MSG-02" */
  code: string;
}
export interface CatalogTech extends Technology {
  id: string;
  /** Category of the primary (first) concept. */
  category: string;
  /** Its kind within the primary concept, if that concept has kinds. */
  kind?: string;
}
/** A sub-type of a concept, with its own page at concepts/<concept>/<id>/. */
export interface CatalogKind extends Kind {
  concept: string;
}
export interface CatalogArch extends Architecture {
  id: string;
  /** Technologies in the diagram, in node order, without repeats. */
  techs: string[];
}
/** One column of a comparison table: a concept or a technology. */
export interface ComparisonColumn {
  id: string;
  name: string;
  /** Concept code like "CMP-25", or the technology's primary concept code. */
  code: string;
  href: string;
}
export interface CatalogComparison extends Comparison {
  id: string;
  columns: ComparisonColumn[];
}
export interface CatalogFoundation extends Foundation {
  id: string;
  /** Technologies whose "vendor" is this foundation, by name. */
  projects: CatalogTech[];
}
export interface CatalogResource extends Resource {
  id: string;
}
export interface CatalogBenchmark extends Benchmark {
  id: string;
}
export interface CatalogPart extends Part {
  /** Its topics, in order. */
  categories: Category[];
}
/** Everything on the site about one topic (category). */
export interface Topic {
  category: Category;
  part: CatalogPart;
  concepts: CatalogConcept[];
  /** Technologies whose primary concept is in this topic. */
  technologies: CatalogTech[];
  comparisons: CatalogComparison[];
  architectures: CatalogArch[];
  resources: CatalogResource[];
  benchmarks: CatalogBenchmark[];
}
/** One "worksWith" link: "<from> <how> <to>". */
export interface Edge {
  from: string;
  to: string;
  how: string;
}

export interface Catalog {
  parts: CatalogPart[];
  /** In reading order: by part, then by order within the part. */
  categories: Category[];
  concepts: CatalogConcept[];
  technologies: CatalogTech[];
  architectures: CatalogArch[];
  comparisons: CatalogComparison[];
  foundations: CatalogFoundation[];
  /** Newest first; websites without a date last. */
  resources: CatalogResource[];
  /** By name. */
  benchmarks: CatalogBenchmark[];
  edges: Edge[];
  systemMap: Diagram;
  concept: (id: string) => CatalogConcept;
  tech: (id: string) => CatalogTech;
  kind: (id: string) => CatalogKind;
  /** Technologies of this kind: those listed under it first, then ones that also belong to it. */
  techsOfKind: (kindId: string) => CatalogTech[];
  /** Technologies listed under this one, by relation, then name. */
  childrenOf: (techId: string) => CatalogTech[];
  category: (id: string) => Category;
  part: (id: string) => CatalogPart;
  topic: (categoryId: string) => Topic;
  /** The foundation that hosts this technology, if it has a page. */
  foundationOf: (tech: CatalogTech) => CatalogFoundation | undefined;
  /** Resources that name this concept, technology or architecture. */
  resourcesAbout: (field: 'concepts' | 'technologies' | 'architectures', id: string) => CatalogResource[];
  /** Benchmarks that compare products of this concept, or include this technology. */
  benchmarksAbout: (field: 'concepts' | 'technologies', id: string) => CatalogBenchmark[];
  /** Technologies that list this concept, primary ones first. */
  techsFor: (conceptId: string) => CatalogTech[];
  /** Architectures whose diagram uses this technology. */
  archsWithTech: (techId: string) => CatalogArch[];
  /** Architectures that use this concept directly or through one of its technologies. */
  archsWithConcept: (conceptId: string) => CatalogArch[];
}

let cached: Promise<Catalog> | undefined;

export function getCatalog(): Promise<Catalog> {
  return (cached ??= load());
}

const uniq = <T>(xs: T[]) => [...new Set(xs)];

async function load(): Promise<Catalog> {
  const [partEntries, cats, conceptEntries, techEntries, archEntries, cmpEntries, fdnEntries, resEntries, benchEntries] = await Promise.all([
    getCollection('parts'),
    getCollection('categories'),
    getCollection('concepts'),
    getCollection('technologies'),
    getCollection('architectures'),
    getCollection('comparisons'),
    getCollection('foundations'),
    getCollection('resources'),
    getCollection('benchmarks'),
  ]);
  const partList = partEntries.map(p => p.data).sort((a, b) => a.order - b.order);
  const partRank = new Map(partList.map((p, i) => [p.id, i]));
  const categories = cats.map(c => c.data).sort((a, b) => (partRank.get(a.part) ?? 0) - (partRank.get(b.part) ?? 0) || a.order - b.order);
  const parts: CatalogPart[] = partList.map(p => ({ ...p, categories: categories.filter(c => c.part === p.id) }));
  const systemMap = diagram.parse(systemMapJson);

  const problems = findProblems({
    parts: partList, categories, concepts: conceptEntries, technologies: techEntries, architectures: archEntries, comparisons: cmpEntries, foundations: fdnEntries, resources: resEntries, benchmarks: benchEntries, systemMap,
  });
  if (problems.length) {
    throw new Error(`Content has ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`);
  }

  const concepts: CatalogConcept[] = [];
  for (const cat of categories) {
    conceptEntries
      .filter(p => p.data.category === cat.id)
      .sort((a, b) => a.data.order - b.data.order)
      .forEach((p, i) => concepts.push({ ...p.data, id: p.id, code: `${cat.code}-${String(i + 1).padStart(2, '0')}` }));
  }
  const conceptMap = new Map(concepts.map(p => [p.id, p]));
  const conceptRank = new Map(concepts.map((p, i) => [p.id, i]));

  const kinds: CatalogKind[] = concepts.flatMap(p => p.kinds.map(k => ({ ...k, concept: p.id })));
  const kindMap = new Map(kinds.map(k => [k.id, k]));
  const kindRank = new Map(kinds.map((k, i) => [k.id, i]));

  const techList: CatalogTech[] = techEntries.map(t => ({
    ...t.data,
    id: t.id,
    category: conceptMap.get(t.data.concepts[0])!.category,
    kind: t.data.kinds.find(k => kindMap.get(k)?.concept === t.data.concepts[0]),
  }));
  const names = new Map(techList.map(t => [t.id, t.name]));
  // by concept, then kind, then name, with each technology's children right after it
  const technologies = techList.sort((a, b) =>
    conceptRank.get(a.concepts[0])! - conceptRank.get(b.concepts[0])!
    || (kindRank.get(a.kind ?? '') ?? -1) - (kindRank.get(b.kind ?? '') ?? -1)
    || names.get(a.parent?.id ?? a.id)!.localeCompare(names.get(b.parent?.id ?? b.id)!)
    || Number(!!a.parent) - Number(!!b.parent)
    || RELATIONS.indexOf(a.parent?.as ?? 'managed') - RELATIONS.indexOf(b.parent?.as ?? 'managed')
    || a.name.localeCompare(b.name));
  const techMap = new Map(technologies.map(t => [t.id, t]));

  const architectures: CatalogArch[] = archEntries
    .map(a => ({ ...a.data, id: a.id, techs: uniq(a.data.diagram.nodes.flatMap(n => (n.tech ? [n.tech] : []))) }))
    .sort((a, b) => a.order - b.order);

  const comparisons: CatalogComparison[] = cmpEntries
    .map(c => ({
      ...c.data,
      id: c.id,
      columns: c.data.concepts.length
        ? c.data.concepts.map(id => {
            const p = conceptMap.get(id)!;
            return { id, name: p.name, code: p.code, href: `concepts/${id}/` };
          })
        : c.data.technologies.map(id => {
            const t = techMap.get(id)!;
            return { id, name: t.name, code: conceptMap.get(t.concepts[0])!.code, href: `technologies/${id}/` };
          }),
    }))
    .sort((a, b) => a.order - b.order);

  const foundations: CatalogFoundation[] = fdnEntries.map(f => ({
    ...f.data,
    id: f.id,
    projects: technologies.filter(t => t.vendor === f.data.vendor).sort((a, b) => a.name.localeCompare(b.name)),
  }));

  const resources: CatalogResource[] = resEntries
    .map(r => ({ ...r.data, id: r.id }))
    .sort((a, b) => (b.published ?? '').localeCompare(a.published ?? '') || a.title.localeCompare(b.title));

  const benchmarks: CatalogBenchmark[] = benchEntries
    .map(b => ({ ...b.data, id: b.id }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const edges = technologies.flatMap(t => t.worksWith.map(w => ({ from: t.id, to: w.id, how: w.how })));
  const catMap = new Map(categories.map(c => [c.id, c]));
  const partMap = new Map(parts.map(p => [p.id, p]));

  const archConcepts = (a: CatalogArch) =>
    new Set(a.diagram.nodes.flatMap(n => [...(n.concept ? [n.concept] : []), ...(n.tech ? techMap.get(n.tech)!.concepts : [])]));

  const topic = (catId: string): Topic => {
    const inTopic = concepts.filter(p => p.category === catId);
    const ids = new Set(inTopic.map(p => p.id));
    const techs = technologies.filter(t => t.category === catId);
    const techIds = new Set(techs.map(t => t.id));
    return {
      category: catMap.get(catId)!,
      part: partMap.get(catMap.get(catId)!.part)!,
      concepts: inTopic,
      technologies: techs,
      comparisons: comparisons.filter(m => m.concepts.some(id => ids.has(id)) || m.technologies.some(id => techIds.has(id))),
      architectures: architectures.filter(a => [...archConcepts(a)].some(id => ids.has(id))),
      resources: resources.filter(r => r.concepts.some(id => ids.has(id)) || r.technologies.some(id => techIds.has(id))),
      benchmarks: benchmarks.filter(b => b.concepts.some(id => ids.has(id)) || b.technologies.some(id => techIds.has(id))),
    };
  };

  return {
    parts,
    categories,
    concepts,
    technologies,
    architectures,
    comparisons,
    foundations,
    resources,
    benchmarks,
    edges,
    systemMap,
    concept: id => conceptMap.get(id)!,
    tech: id => techMap.get(id)!,
    kind: id => kindMap.get(id)!,
    techsOfKind: id => [
      ...technologies.filter(t => t.kind === id),
      ...technologies.filter(t => t.kind !== id && t.kinds.includes(id)),
    ],
    childrenOf: id => technologies.filter(t => t.parent?.id === id),
    category: id => catMap.get(id)!,
    part: id => partMap.get(id)!,
    topic,
    foundationOf: t => foundations.find(f => f.vendor === t.vendor),
    resourcesAbout: (field, id) => resources.filter(r => r[field].includes(id)),
    benchmarksAbout: (field, id) => benchmarks.filter(b => b[field].includes(id)),
    techsFor: id => [
      ...technologies.filter(t => t.concepts[0] === id),
      ...technologies.filter(t => t.concepts.indexOf(id) > 0),
    ],
    archsWithTech: id => architectures.filter(a => a.techs.includes(id)),
    archsWithConcept: id => architectures.filter(a => archConcepts(a).has(id)),
  };
}
