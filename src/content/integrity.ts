// Checks that span files: every id one file points at must exist in another.
// Used by the build (src/lib/catalog.ts) and by `bun run validate`.
import type { Architecture, Benchmark, Category, Part, Comparison, Concept, Diagram, Foundation, Resource, Technology } from './schema';

type Entries<T> = { id: string; data: T }[];

export interface CatalogInput {
  parts: Part[];
  categories: Category[];
  concepts: Entries<Concept>;
  technologies: Entries<Technology>;
  architectures: Entries<Architecture>;
  comparisons: Entries<Comparison>;
  foundations: Entries<Foundation>;
  resources: Entries<Resource>;
  benchmarks: Entries<Benchmark>;
  systemMap: Diagram;
}

export function findProblems({ parts, categories, concepts, technologies, architectures, comparisons, foundations, resources, benchmarks, systemMap }: CatalogInput): string[] {
  const problems: string[] = [];
  const catIds = new Set(categories.map(c => c.id));
  const partIds = new Set(parts.map(p => p.id));
  for (const c of categories) {
    if (!partIds.has(c.part)) problems.push(`content/categories.json: "${c.id}" has unknown part "${c.part}" (known: ${[...partIds].join(', ')})`);
  }
  for (const p of parts) {
    if (!categories.some(c => c.part === p.id)) problems.push(`content/parts.json: part "${p.id}" has no categories`);
  }
  const conceptIds = new Set(concepts.map(p => p.id));
  const techIds = new Set(technologies.map(t => t.id));

  const links = (where: string, d: Diagram) =>
    d.nodes.forEach(n => {
      if (n.concept && !conceptIds.has(n.concept)) problems.push(`${where}: node "${n.id}" links to unknown concept "${n.concept}"`);
      if (n.tech && !techIds.has(n.tech)) problems.push(`${where}: node "${n.id}" links to unknown technology "${n.tech}"`);
    });

  // diagrams in "model" sections must link to real pages, and table rows need one value per column
  const tables = (where: string, sections: Technology['sections']) =>
    sections.forEach((s, i) => {
      if (s.type === 'model') links(`${where} sections.${i}`, s.diagram);
      if (s.type === 'table') {
        s.rows.forEach((r, j) => {
          if (r.values.length !== s.columns.length) {
            problems.push(`${where}: sections.${i}.rows.${j} ("${r.label}") has ${r.values.length} values, expected ${s.columns.length} (one per column)`);
          }
        });
      }
    });

  const seenOrder = new Map<string, string>();
  /** kind id → the concept it belongs to */
  const kindOwner = new Map<string, string>();
  for (const { id, data } of concepts) {
    const where = `content/concepts/${id}.json`;
    if (!catIds.has(data.category)) {
      problems.push(`${where}: unknown category "${data.category}" (known: ${[...catIds].join(', ')})`);
    }
    const key = `${data.category}:${data.order}`;
    if (seenOrder.has(key)) {
      problems.push(`${where}: order ${data.order} is already used by "${seenOrder.get(key)}" in ${data.category}`);
    }
    seenOrder.set(key, id);
    for (const r of data.related) {
      if (r === id) problems.push(`${where}: "related" lists the concept itself`);
      else if (!conceptIds.has(r)) problems.push(`${where}: "related" has unknown concept "${r}"`);
    }
    if (data.diagram) links(where, data.diagram);
    tables(where, data.sections);
    for (const k of data.kinds) {
      if (kindOwner.has(k.id) && kindOwner.get(k.id) !== id) problems.push(`${where}: kind "${k.id}" is already used by "${kindOwner.get(k.id)}"`);
      else if (kindOwner.has(k.id)) problems.push(`${where}: kind "${k.id}" is listed twice`);
      kindOwner.set(k.id, id);
    }
  }

  for (const { id, data } of technologies) {
    const where = `content/technologies/${id}.json`;
    for (const c of data.concepts) {
      if (!conceptIds.has(c)) problems.push(`${where}: "concepts" has unknown concept "${c}"`);
    }
    const seen = new Set<string>();
    for (const w of data.worksWith) {
      if (w.id === id) problems.push(`${where}: "worksWith" lists the technology itself`);
      else if (!techIds.has(w.id)) problems.push(`${where}: "worksWith" has unknown technology "${w.id}"`);
      if (seen.has(w.id)) problems.push(`${where}: "worksWith" lists "${w.id}" twice`);
      seen.add(w.id);
    }
    for (const a of data.archived?.alternatives ?? []) {
      if (a === id) problems.push(`${where}: "archived.alternatives" lists the technology itself`);
      else if (!techIds.has(a)) problems.push(`${where}: "archived.alternatives" has unknown technology "${a}"`);
      else if (technologies.find(t => t.id === a)?.data.archived) problems.push(`${where}: "archived.alternatives" points at "${a}", which is archived too`);
    }
    tables(where, data.sections);

    // kinds: each belongs to one of its concepts, at most one per concept, and one is required for every listed concept that has any
    const kindConcepts = data.kinds.map(k => kindOwner.get(k));
    data.kinds.forEach((k, i) => {
      if (!kindOwner.has(k)) problems.push(`${where}: "kinds" has unknown kind "${k}"`);
      else if (!data.concepts.includes(kindOwner.get(k)!)) problems.push(`${where}: kind "${k}" belongs to "${kindOwner.get(k)}", which isn’t in "concepts"`);
      else if (kindConcepts.indexOf(kindOwner.get(k)) !== i) problems.push(`${where}: "kinds" names two kinds of "${kindOwner.get(k)}"; pick one`);
    });
    for (const cid of data.concepts) {
      const own = concepts.find(p => p.id === cid)?.data.kinds ?? [];
      if (own.length && !kindConcepts.includes(cid)) problems.push(`${where}: "${cid}" has kinds, so "kinds" needs one of: ${own.map(k => k.id).join(', ')}`);
    }

    if (data.parent) {
      const parent = technologies.find(t => t.id === data.parent!.id)?.data;
      const primaryKind = (d: Technology) => d.kinds.find(k => kindOwner.get(k) === d.concepts[0]);
      if (data.parent.id === id) problems.push(`${where}: "parent" is the technology itself`);
      else if (!parent) problems.push(`${where}: "parent" has unknown technology "${data.parent.id}"`);
      else if (parent.parent) problems.push(`${where}: "parent" points at "${data.parent.id}", which has a parent itself; list it under "${parent.parent.id}"`);
      else if (parent.concepts[0] !== data.concepts[0]) problems.push(`${where}: "parent" points at "${data.parent.id}", whose first concept is "${parent.concepts[0]}", not "${data.concepts[0]}"`);
      else if (primaryKind(parent) !== primaryKind(data)) problems.push(`${where}: "parent" points at "${data.parent.id}", which is a different kind`);
    }
  }

  const pairs = new Set(technologies.flatMap(({ id, data }) => data.worksWith.map(w => `${id}>${w.id}`)));
  for (const { id, data } of technologies) {
    for (const w of data.worksWith) {
      if (id < w.id && pairs.has(`${w.id}>${id}`)) {
        problems.push(`content/technologies/${id}.json: "${id}" and "${w.id}" list each other in "worksWith"; keep it on the side that uses the other`);
      }
    }
  }

  for (const { id, data } of architectures) {
    const where = `content/architectures/${id}.json`;
    links(where, data.diagram);
    const nodeIds = new Set(data.diagram.nodes.map(n => n.id));
    data.steps.forEach((s, i) => s.nodes.forEach(n => {
      if (!nodeIds.has(n)) problems.push(`${where}: steps.${i} mentions node "${n}", which isn’t in the diagram`);
    }));
    data.swaps.forEach((s, i) => s.techs.forEach(t => {
      if (!techIds.has(t)) problems.push(`${where}: swaps.${i} has unknown technology "${t}"`);
    }));
  }

  for (const { id, data } of comparisons) {
    const where = `content/comparisons/${id}.json`;
    if ((data.concepts.length > 0) === (data.technologies.length > 0)) {
      problems.push(`${where}: set either "concepts" or "technologies", not both`);
    }
    const columns = data.concepts.length ? data.concepts : data.technologies;
    if (columns.length < 2) problems.push(`${where}: compare at least two ${data.concepts.length ? 'concepts' : 'technologies'}`);
    for (const p of data.concepts) {
      if (!conceptIds.has(p)) problems.push(`${where}: unknown concept "${p}"`);
    }
    for (const t of data.technologies) {
      if (!techIds.has(t)) problems.push(`${where}: unknown technology "${t}"`);
    }
    data.rows.forEach((r, i) => {
      if (r.values.length !== columns.length) {
        problems.push(`${where}: rows.${i} ("${r.label}") has ${r.values.length} values, expected ${columns.length} (one per column)`);
      }
    });
  }

  for (const { id, data } of foundations) {
    const where = `content/foundations/${id}.json`;
    if (!technologies.some(t => t.data.vendor === data.vendor)) {
      problems.push(`${where}: no technology has "vendor": "${data.vendor}", so the page would list no projects`);
    }
    tables(where, data.sections);
  }

  const archIds = new Set(architectures.map(a => a.id));
  const seenUrl = new Map<string, string>();
  for (const { id, data } of resources) {
    const where = `content/resources/${id}.json`;
    data.concepts.forEach(c => { if (!conceptIds.has(c)) problems.push(`${where}: "concepts" has unknown concept "${c}"`); });
    data.technologies.forEach(t => { if (!techIds.has(t)) problems.push(`${where}: "technologies" has unknown technology "${t}"`); });
    data.architectures.forEach(a => { if (!archIds.has(a)) problems.push(`${where}: "architectures" has unknown architecture "${a}"`); });
    const url = data.url.replace(/\/$/, '');
    if (seenUrl.has(url)) problems.push(`${where}: same url as content/resources/${seenUrl.get(url)}.json`);
    seenUrl.set(url, id);
  }

  for (const { id, data } of benchmarks) {
    const where = `content/benchmarks/${id}.json`;
    data.concepts.forEach(c => { if (!conceptIds.has(c)) problems.push(`${where}: "concepts" has unknown concept "${c}"`); });
    data.technologies.forEach(t => { if (!techIds.has(t)) problems.push(`${where}: "technologies" has unknown technology "${t}"`); });
    tables(where, data.sections);
  }

  links('content/system-map.json', systemMap);
  return problems;
}
