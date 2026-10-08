import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { architecture, benchmark, category, comparison, concept, foundation, part, resource, technology } from './content/schema';

const dir = (base: string) => glob({ pattern: '*.json', base: `content/${base}` });

export const collections = {
  parts: defineCollection({ loader: file('content/parts.json'), schema: part }),
  categories: defineCollection({ loader: file('content/categories.json'), schema: category }),
  concepts: defineCollection({ loader: dir('concepts'), schema: concept }),
  technologies: defineCollection({ loader: dir('technologies'), schema: technology }),
  architectures: defineCollection({ loader: dir('architectures'), schema: architecture }),
  comparisons: defineCollection({ loader: dir('comparisons'), schema: comparison }),
  foundations: defineCollection({ loader: dir('foundations'), schema: foundation }),
  resources: defineCollection({ loader: dir('resources'), schema: resource }),
  benchmarks: defineCollection({ loader: dir('benchmarks'), schema: benchmark }),
};
