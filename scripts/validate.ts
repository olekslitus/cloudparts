// Fast content check for contributors: `bun run validate`.
// Runs the same schemas and cross-file checks as the build, without building the site.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { z } from 'astro/zod';
import { findProblems } from '../src/content/integrity';
import { architecture, benchmark, category, comparison, concept, diagram, foundation, part, resource, technology } from '../src/content/schema';

const root = fileURLToPath(new URL('../content', import.meta.url));
const problems: string[] = [];

function load<T extends z.ZodType>(file: string, schema: T): z.output<T> | undefined {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(root, file), 'utf8'));
  } catch (err) {
    problems.push(`content/${file}: ${(err as Error).message}`);
    return;
  }
  const res = schema.safeParse(raw);
  if (res.success) return res.data;
  for (const issue of res.error.issues) {
    const path = issue.path.length ? issue.path.join('.') : '(root)';
    problems.push(`content/${file}: ${path}: ${issue.message}`);
  }
}

function collection<T extends z.ZodType>(sub: string, schema: T) {
  return readdirSync(join(root, sub))
    .filter(f => f.endsWith('.json'))
    .sort()
    .flatMap(f => {
      const data = load(`${sub}/${f}`, schema);
      return data ? [{ id: f.replace(/\.json$/, ''), data }] : [];
    });
}

const parts = load('parts.json', part.array()) ?? [];
const categories = load('categories.json', category.array()) ?? [];
const concepts = collection('concepts', concept);
const technologies = collection('technologies', technology);
const architectures = collection('architectures', architecture);
const comparisons = collection('comparisons', comparison);
const foundations = collection('foundations', foundation);
const resources = collection('resources', resource);
const benchmarks = collection('benchmarks', benchmark);
const systemMap = load('system-map.json', diagram);

if (!problems.length && systemMap) {
  problems.push(...findProblems({ parts, categories, concepts, technologies, architectures, comparisons, foundations, resources, benchmarks, systemMap }));
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `✓ ${concepts.length} concepts, ${technologies.length} technologies, ${architectures.length} architectures, ` +
  `${comparisons.length} comparisons, ${foundations.length} foundations, ${resources.length} resources, ${benchmarks.length} benchmarks, ${parts.length} parts, ${categories.length} categories look good`,
);
