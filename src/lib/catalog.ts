// Loads and cross-checks the catalog once per build, and adds derived fields
// (category codes like MSG-02, ordering, lookups between concepts, technologies
// and architectures) that pages share.
import { loadContent } from '@/content/load';
import { findProblems } from '@/content/integrity';
import {
  diagram, RELATIONS, type Architecture, type Benchmark, type Category, type Part, type Comparison, type Concept, type Diagram, type Foundation, type Kind, type Resource, type Spec, type Technology, type Workload,
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
  /** Where its page lives: foundations/<id>/ or companies/<id>/. */
  path: string;
  /** Its projects, by name: technologies whose "foundation" is it or a foundation under it, or, for a company, whose "vendor" matches. */
  projects: CatalogTech[];
  /** Foundations that are part of this one, such as the CNCF in the Linux Foundation. */
  children: string[];
}

/** Where a technology sits in a foundation: the foundation, its stage there, and the foundations above it. */
export interface Membership {
  foundation: CatalogFoundation;
  stage?: Foundation['stages'][number];
  joined?: string;
  via?: string;
  parents: CatalogFoundation[];
}
export interface CatalogResource extends Resource {
  id: string;
}
export interface CatalogBenchmark extends Benchmark {
  id: string;
}
export interface CatalogWorkload extends Workload {
  id: string;
  /** Technologies that list it in "goodFor", in catalog order, with their reason. */
  techs: { tech: CatalogTech; why: string }[];
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
  /** By name. */
  workloads: CatalogWorkload[];
  /** Rows of the compare tool, in display order. */
  specs: Spec[];
  edges: Edge[];
  systemMap: Diagram;
  concept: (id: string) => CatalogConcept;
  tech: (id: string) => CatalogTech;
  kind: (id: string) => CatalogKind;
  workload: (id: string) => CatalogWorkload;
  /** Workloads that concern this concept. */
  workloadsFor: (conceptId: string) => CatalogWorkload[];
  /**
   * What to look at instead, best first: replacements for an archived technology, the ones it names in "alternatives",
   * the ones that name it, then its siblings (a child's family, or its concept's group, kind or list), the ones that share
   * the most "goodFor" workloads first.
   */
  alternativesOf: (techId: string) => CatalogTech[];
  /** The concepts directly under this one, in order. */
  subconcepts: (id: string) => CatalogConcept[];
  /** The concepts this one sits under, outermost first. */
  ancestors: (id: string) => CatalogConcept[];
  /** Technologies of this kind: those listed under it first, then ones that also belong to it. */
  techsOfKind: (kindId: string) => CatalogTech[];
  /** Technologies listed under this one, by relation, then name. */
  childrenOf: (techId: string) => CatalogTech[];
  category: (id: string) => Category;
  part: (id: string) => CatalogPart;
  topic: (categoryId: string) => Topic;
  /** The foundation or company page for its "vendor", if there is one. */
  foundationOf: (tech: CatalogTech) => CatalogFoundation | undefined;
  /** The open-source foundation it belongs to, from its "foundation" field. */
  membership: (tech: CatalogTech) => Membership | undefined;
  /** Resources that name this concept, technology or architecture. */
  resourcesAbout: (field: 'concepts' | 'technologies' | 'architectures', id: string) => CatalogResource[];
  /** Benchmarks that compare products of this concept, or include this technology. */
  benchmarksAbout: (field: 'concepts' | 'technologies', id: string) => CatalogBenchmark[];
  /** Technologies that list this concept, primary ones first. */
  techsFor: (conceptId: string) => CatalogTech[];
  /** Technologies used for a concept without being one, e.g. Redis for caching. */
  usedFor: (conceptId: string) => CatalogTech[];
  /** Architectures whose diagram uses this technology. */
  archsWithTech: (techId: string) => CatalogArch[];
  /** Architectures that use this concept directly or through one of its technologies. */
  archsWithConcept: (conceptId: string) => CatalogArch[];
}

let cached: Catalog | undefined;

/** The whole catalog, loaded and checked on first use. Synchronous, so pages render in document order. */
export function getCatalog(): Catalog {
  return (cached ??= load());
}

const uniq = <T>(xs: T[]) => [...new Set(xs)];

function load(): Catalog {
  const {
    parts: partEntries, categories: cats, concepts: conceptEntries, technologies: techEntries, architectures: archEntries,
    comparisons: cmpEntries, foundations: fdnEntries, resources: resEntries, benchmarks: benchEntries, workloads: wlEntries, specs, systemMap: systemMapJson,
  } = loadContent();
  const partList = [...partEntries].sort((a, b) => a.order - b.order);
  const partRank = new Map(partList.map((p, i) => [p.id, i]));
  const categories = [...cats].sort((a, b) => (partRank.get(a.part) ?? 0) - (partRank.get(b.part) ?? 0) || a.order - b.order);
  const parts: CatalogPart[] = partList.map(p => ({ ...p, categories: categories.filter(c => c.part === p.id) }));
  const systemMap = diagram.parse(systemMapJson);

  const problems = findProblems({
    parts: partList, categories, concepts: conceptEntries, technologies: techEntries, architectures: archEntries, comparisons: cmpEntries, foundations: fdnEntries, resources: resEntries, benchmarks: benchEntries, workloads: wlEntries, specs, systemMap,
  });
  if (problems.length) {
    throw new Error(`Content has ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`);
  }

  // in reading order, like a book: each concept is followed by the ones that sit under it
  const concepts: CatalogConcept[] = [];
  for (const cat of categories) {
    const inCat = conceptEntries.filter(p => p.data.category === cat.id).sort((a, b) => a.data.order - b.data.order);
    const add = (parent?: string) => inCat.filter(p => p.data.parent === parent).forEach(p => {
      concepts.push({ ...p.data, id: p.id, code: '' });
      add(p.id);
    });
    add();
    concepts.filter(p => p.category === cat.id).forEach((p, i) => (p.code = `${cat.code}-${String(i + 1).padStart(2, '0')}`));
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

  // a foundation's projects include those of the foundations under it (the CNCF's are the Linux Foundation's too)
  const under = (id: string): string[] => [id, ...fdnEntries.filter(f => f.data.parent === id).flatMap(f => under(f.id))];
  const foundations: CatalogFoundation[] = fdnEntries.map(f => {
    const ids = new Set(under(f.id));
    return {
      ...f.data,
      id: f.id,
      path: `${f.data.type === 'company' ? 'companies' : 'foundations'}/${f.id}/`,
      projects: technologies
        .filter(t => (t.foundation ? ids.has(t.foundation.id) : f.data.type === 'company' && t.vendor === f.data.vendor))
        .sort((a, b) => a.name.localeCompare(b.name)),
      children: fdnEntries.filter(x => x.data.parent === f.id).map(x => x.id),
    };
  });
  const fdnMap = new Map(foundations.map(f => [f.id, f]));
  const membership = (t: CatalogTech): Membership | undefined => {
    if (!t.foundation) return undefined;
    const foundation = fdnMap.get(t.foundation.id)!;
    const parents: CatalogFoundation[] = [];
    for (let p = foundation.parent; p; p = fdnMap.get(p)?.parent) parents.push(fdnMap.get(p)!);
    return { foundation, stage: foundation.stages.find(s => s.id === t.foundation!.stage), joined: t.foundation.joined, via: t.foundation.via, parents };
  };

  const resources: CatalogResource[] = resEntries
    .map(r => ({ ...r.data, id: r.id }))
    .sort((a, b) => (b.published ?? '').localeCompare(a.published ?? '') || a.title.localeCompare(b.title));

  const benchmarks: CatalogBenchmark[] = benchEntries
    .map(b => ({ ...b.data, id: b.id }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const workloads: CatalogWorkload[] = wlEntries
    .map(w => ({
      ...w.data,
      id: w.id,
      techs: technologies.flatMap(t => t.goodFor.filter(g => g.id === w.id).map(g => ({ tech: t, why: g.why }))),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const workloadMap = new Map(workloads.map(w => [w.id, w]));

  const alternativesOf = (id: string): CatalogTech[] => {
    const t = techMap.get(id)!;
    const primary = conceptMap.get(t.concepts[0])!;
    const group = primary.groups.find(g => g.technologies.includes(t.id));
    const grouped = (group?.technologies ?? []).filter(x => x !== t.id).map(x => techMap.get(x)!).filter(x => !x.parent);
    const parent = t.parent && techMap.get(t.parent.id);
    // siblings for a child (same relation first); otherwise other top-level technologies of the same concept and
    // kind, narrowed to the concept's group when it sorts them by role (an embedded database next to embedded ones)
    const peers = parent
      ? technologies.filter(x => x.parent?.id === parent.id && x.id !== t.id).sort((a, b) => Number(a.parent!.as !== t.parent!.as) - Number(b.parent!.as !== t.parent!.as))
      : (grouped.length ? grouped : technologies.filter(x => x.concepts[0] === t.concepts[0] && x.kind === t.kind && !x.parent && x.id !== t.id));
    const mine = new Set(t.goodFor.map(g => g.id));
    const shared = (x: CatalogTech) => x.goodFor.filter(g => mine.has(g.id)).length;
    const ranked = parent || !mine.size ? peers : [...peers].sort((a, b) => shared(b) - shared(a));
    const named = [
      ...(t.archived?.alternatives ?? []),
      ...t.alternatives,
      ...(parent ? [] : technologies.filter(x => x.alternatives.includes(t.id) && !x.archived).map(x => x.id)),
    ].map(x => techMap.get(x)!);
    return uniq([...named, ...ranked]).filter(x => x.id !== t.id);
  };

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
    workloads,
    specs,
    edges,
    systemMap,
    concept: id => conceptMap.get(id)!,
    tech: id => techMap.get(id)!,
    kind: id => kindMap.get(id)!,
    workload: id => workloadMap.get(id)!,
    workloadsFor: id => workloads.filter(w => w.concepts.includes(id)),
    alternativesOf,
    subconcepts: id => concepts.filter(p => p.parent === id),
    ancestors: id => {
      const up: CatalogConcept[] = [];
      for (let p = conceptMap.get(id)!; p.parent; p = conceptMap.get(p.parent)!) up.unshift(conceptMap.get(p.parent)!);
      return up;
    },
    techsOfKind: id => [
      ...technologies.filter(t => t.kind === id),
      ...technologies.filter(t => t.kind !== id && t.kinds.includes(id)),
    ],
    childrenOf: id => technologies.filter(t => t.parent?.id === id),
    category: id => catMap.get(id)!,
    part: id => partMap.get(id)!,
    topic,
    foundationOf: t => foundations.find(f => f.vendor === t.vendor),
    membership,
    resourcesAbout: (field, id) => resources.filter(r => r[field].includes(id)),
    benchmarksAbout: (field, id) => benchmarks.filter(b => b[field].includes(id)),
    usedFor: id => technologies.filter(t => t.uses.includes(id)),
    techsFor: id => [
      ...technologies.filter(t => t.concepts[0] === id),
      ...technologies.filter(t => t.concepts.indexOf(id) > 0),
    ],
    archsWithTech: id => architectures.filter(a => a.techs.includes(id)),
    archsWithConcept: id => architectures.filter(a => archConcepts(a).has(id)),
  };
}
