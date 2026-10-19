// Reads and parses every content file, the way the build sees them: { id, data } per file, ids from
// file names (or, for parts and categories, from each item). Throws on the first file that doesn't parse;
// `bun run validate` reports every problem at once instead.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { z } from 'zod';
import { architecture, benchmark, category, comparison, concept, foundation, part, resource, technology } from './schema';

const root = join(process.cwd(), 'content'); // the build runs from the project root

function parse<T extends z.ZodType>(file: string, schema: T): z.output<T> {
  const res = schema.safeParse(JSON.parse(readFileSync(join(root, file), 'utf8')));
  if (!res.success) {
    const issues = res.error.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
    throw new Error(`content/${file}: ${issues}`);
  }
  return res.data;
}

function collection<T extends z.ZodType>(dir: string, schema: T) {
  return readdirSync(join(root, dir))
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => ({ id: f.replace(/\.json$/, ''), data: parse(`${dir}/${f}`, schema) }));
}

export function loadContent() {
  return {
    parts: parse('parts.json', part.array()),
    categories: parse('categories.json', category.array()),
    concepts: collection('concepts', concept),
    technologies: collection('technologies', technology),
    architectures: collection('architectures', architecture),
    comparisons: collection('comparisons', comparison),
    foundations: collection('foundations', foundation),
    resources: collection('resources', resource),
    benchmarks: collection('benchmarks', benchmark),
    systemMap: JSON.parse(readFileSync(join(root, 'system-map.json'), 'utf8')) as unknown,
  };
}
