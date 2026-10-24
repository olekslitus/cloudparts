// Writes a JSON Schema per content collection to .schemas/, which each content file names in its
// "$schema" line, so editors give autocomplete and inline errors. Run by `bun run dev` and `bun run check`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { architecture, benchmark, category, comparison, concept, foundation, part, resource, spec, technology, workload } from '../src/content/schema';

const collections: Record<string, z.ZodType> = {
  parts: part.array(),
  categories: category.array(),
  concepts: concept,
  technologies: technology,
  architectures: architecture,
  comparisons: comparison,
  foundations: foundation,
  resources: resource,
  benchmarks: benchmark,
  workloads: workload,
  specs: spec.array(),
};

const dir = new URL('../.schemas/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [name, schema] of Object.entries(collections)) {
  // the shape a file is written in, before defaults and transforms apply
  const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' });
  writeFileSync(new URL(`${name}.schema.json`, dir), JSON.stringify(json, null, 2));
}
