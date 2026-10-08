// Schemas for everything under /content. Astro uses them to validate the JSON at build
// time and to generate the JSON Schema files that editors use for autocomplete
// (the "$schema" line at the top of each content file).
import { z } from 'astro/zod';

const id = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'Use lowercase letters, digits and dashes');
const text = z.string().trim().min(1);
/** 0..3: picks one of the four packet colours. */
const color = z.number().int().min(0).max(3);

/* ------------------------------------------------------------------ diagram */

const emit = z
  .strictObject({
    every: z.number().positive().optional().describe('Milliseconds between packets.'),
    jitter: z.number().min(0).max(1).optional().describe('Random spread on `every`, as a fraction (0.3 = ±30%).'),
    phases: z
      .array(z.tuple([z.number().positive(), z.number().positive().nullable()]))
      .optional()
      .describe('Repeating traffic pattern: [[durationMs, everyMs], ...]; everyMs null means silence. Overrides `every`.'),
    req: z.boolean().optional().describe('Packets are requests that expect a response to travel back.'),
    color: color.optional(),
    cycle: z.boolean().optional().describe('Rotate through the four colours.'),
    colorByKey: z.number().int().positive().optional().describe('Give each packet a random key 0..n-1 and colour it by key. Used with route "hash".'),
    colorByType: z.record(z.string(), color).optional().describe('Colour packets by their `type`.'),
    type: z.string().optional().describe('Type stamped on every packet (used by gates and "type" routing).'),
    types: z.array(z.string()).optional().describe('Pick a random type per packet.'),
    route: z.enum(['rr', 'fanout', 'hash', 'type']).optional().describe('Routing used for this emitter instead of the node’s own.'),
    to: z.array(id).optional().describe('Send straight to these nodes instead of using `out`.'),
  })
  .describe('Makes this node a source of packets.');

const reader = z.strictObject({
  to: id.describe('Node that receives what this reader consumes.'),
  every: z.number().positive().describe('Milliseconds between reads.'),
  name: text.describe('Label shown next to the reader’s cursor.'),
  batch: z.number().int().positive().optional().describe('Entries read per poll (default 1).'),
});

const nodeFields = z
  .strictObject({
    id: id.describe('Unique within this diagram.'),
    x: z.number().describe('Centre x in diagram units.'),
    y: z.number().describe('Centre y in diagram units.'),
    label: text,
    sub: z.string().optional().describe('Small monospace line under the label.'),
    kind: z
      .enum(['svc', 'pool', 'queue', 'log'])
      .optional()
      .describe('svc: a box (default). pool: autoscaling instances. queue: a bounded buffer. log: an append-only stream with readers.'),
    concept: id.nullable().optional().describe('Id of a concept; clicking the node opens that concept’s page.'),
    tech: id.optional().describe('Id of a technology; clicking the node opens its page. Takes precedence over "concept".'),
    out: z.array(id).optional().describe('Downstream node ids.'),
    mode: z
      .enum(['fwd', 'sink', 'reply', 'cache', 'gate'])
      .optional()
      .describe('What happens on arrival. fwd (default): pass on. sink: absorb. reply: answer requests. cache: hit with probability p, else forward. gate: allow with probability p (or by allowTypes), else deny.'),
    route: z
      .enum(['rr', 'fanout', 'hash', 'type'])
      .optional()
      .describe('How to pick among `out`. rr (default): round robin over healthy targets. fanout: all. hash: by packet key. type: by `rules`.'),
    rules: z.record(z.string(), z.array(id)).optional().describe('For route "type": packet type → target ids.'),
    w: z.number().positive().optional().describe('Override the computed box width.'),
    delay: z.number().nonnegative().optional().describe('Milliseconds before replying.'),
    p: z.number().min(0).max(1).optional().describe('Hit probability (cache) or allow probability (gate).'),
    allowTypes: z.array(z.string()).optional().describe('Gate: packet types that pass.'),
    allowText: z.string().optional(),
    deny: id.optional().describe('Gate: send denied packets here instead of dropping them.'),
    denyText: z.string().optional(),
    quiet: z.boolean().optional().describe('Gate: swallow denied packets without a label.'),
    // pool
    min: z.number().int().nonnegative().optional().describe('Pool: instances kept warm.'),
    max: z.number().int().positive().optional().describe('Pool: instance limit.'),
    work: z.number().positive().optional().describe('Pool: milliseconds per job.'),
    idle: z.number().positive().optional().describe('Pool: idle milliseconds before an instance is removed.'),
    cold: z.number().nonnegative().optional().describe('Pool: extra milliseconds when a new instance starts.'),
    coldText: z.string().optional(),
    scaleText: z.string().optional(),
    // queue
    cap: z.number().int().positive().optional().describe('Queue: capacity.'),
    gap: z.number().positive().optional().describe('Queue: minimum milliseconds between releases.'),
    // log
    cells: z.number().int().positive().optional().describe('Log: visible cells.'),
    retain: z.number().int().positive().optional().describe('Log: entries kept before readers lose them.'),
    readers: z.array(reader).optional().describe('Log: consumers, each with its own offset.'),
    emit: emit.optional(),
  });

export const diagramNode = nodeFields
  .superRefine((n, ctx) => {
    const need = (field: keyof typeof n, kind: string) => {
      if (n[field] === undefined) ctx.addIssue({ code: 'custom', path: [field], message: `A "${kind}" node needs "${field}"` });
    };
    if (n.kind === 'queue') need('cap', 'queue');
    if (n.kind === 'log') { need('cells', 'log'); need('readers', 'log'); }
    if ((n.mode === 'cache' || (n.mode === 'gate' && !n.allowTypes)) && n.p === undefined) need('p', n.mode);
  });

const zone = z.strictObject({
  x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive(),
  label: text,
});

const outage = z
  .strictObject({
    node: id,
    at: z.number().nonnegative().describe('First outage, ms after start.'),
    every: z.number().positive().describe('Repeat interval in ms.'),
    dur: z.number().positive().describe('Outage length in ms.'),
    text: text.describe('Label shown when it goes down.'),
    back: text.describe('Label shown when it recovers.'),
  })
  .describe('A scripted outage: the node stops accepting packets for a while.');

export const diagram = z
  .strictObject({
    caption: text.describe('One or two sentences under the model: what the viewer is watching.'),
    w: z.number().positive().optional().describe('Diagram width (default 760).'),
    h: z.number().positive().optional().describe('Diagram height (default 260).'),
    wide: z.boolean().optional().describe('Needs more room on small screens.'),
    zones: z.array(zone).optional().describe('Dashed background areas with a label.'),
    nodes: z.array(diagramNode).min(1),
    events: z.array(outage).optional(),
  })
  .superRefine((d, ctx) => {
    const ids = new Set<string>();
    d.nodes.forEach((n, i) => {
      if (ids.has(n.id)) ctx.addIssue({ code: 'custom', path: ['nodes', i, 'id'], message: `Duplicate node id "${n.id}"` });
      ids.add(n.id);
    });
    const check = (target: string, path: (string | number)[]) => {
      if (!ids.has(target)) ctx.addIssue({ code: 'custom', path, message: `No node with id "${target}" in this diagram` });
    };
    d.nodes.forEach((n, i) => {
      n.out?.forEach((t, j) => check(t, ['nodes', i, 'out', j]));
      n.emit?.to?.forEach((t, j) => check(t, ['nodes', i, 'emit', 'to', j]));
      n.readers?.forEach((r, j) => check(r.to, ['nodes', i, 'readers', j, 'to']));
      if (n.deny) check(n.deny, ['nodes', i, 'deny']);
      Object.entries(n.rules ?? {}).forEach(([k, ts]) => ts.forEach((t, j) => check(t, ['nodes', i, 'rules', k, j])));
    });
    d.events?.forEach((e, i) => check(e.node, ['events', i, 'node']));
  });

/* ------------------------------------------------------------- collections */

export const LANGS = ['bash', 'c', 'clojure', 'cpp', 'csharp', 'dockerfile', 'elixir', 'erlang', 'fsharp', 'go', 'haskell', 'hcl', 'http', 'java', 'js', 'json', 'nginx', 'python', 'racket', 'rust', 'scala', 'sql', 'text', 'ts', 'yaml', 'zig'] as const;

const source = z
  .union([z.string(), z.array(z.string())])
  .describe('The code, as one string or one string per line.')
  .transform(s => (Array.isArray(s) ? s.join('\n') : s));

export const part = z.strictObject({
  id,
  name: text,
  blurb: text,
  order: z.number(),
});

export const category = z.strictObject({
  id,
  code: z.string().regex(/^[A-Z]{3}$/, 'Three capital letters, e.g. "CMP"'),
  name: text,
  blurb: text,
  part: id.describe('Id from content/parts.json: the part of the handbook this topic sits in.'),
  order: z.number().describe('Position within its part.'),
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const sources = z
  .array(z.strictObject({
    label: text,
    url: z.url().describe('The original page: the most direct source for the facts, e.g. the docs page or announcement itself.'),
    archive: z
      .url()
      .regex(/^https:\/\/web\.archive\.org\/web\/\d{14}\//, 'A Wayback Machine snapshot: https://web.archive.org/web/<14-digit timestamp>/<url>')
      .optional()
      .describe('A Wayback Machine copy. Add one when the original is gone, blocked or no longer says what we cite; the page then links to it.'),
  }))
  .min(1)
  .describe('Direct sources for the facts: docs pages, announcements, papers, specs. Each fact on the page should be backed by one.');

export const history = z
  .strictObject({
    story: z.array(text).min(1).max(4).describe('Two or three paragraphs: the problem people had, who built this and why, and what it changed.'),
    choices: z
      .array(z.strictObject({
        choice: text.describe('A design decision, e.g. "An append-only log instead of a queue".'),
        why: text.describe('What problem or constraint led to it.'),
      }))
      .min(1)
      .max(5)
      .describe('Two to four early design decisions and the reasons for them.'),
    timeline: z
      .array(z.strictObject({ year: z.string().regex(/^\d{4}$/, 'A four-digit year'), text }))
      .min(2)
      .max(8)
      .describe('Key dates, oldest first.'),
    sources: sources.describe('Where the history comes from: papers, announcements, founders’ posts.'),
  })
  .describe('Where it came from and why it looks the way it does.');

const section = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('text'),
    title: text,
    body: z.array(text).min(1).describe('Paragraphs.'),
  }),
  z.strictObject({
    type: z.literal('table'),
    title: text,
    intro: text.optional(),
    corner: z.string().optional().describe('Heading above the row labels.'),
    columns: z.array(text).min(1).describe('Column headings, not counting the row-label column.'),
    rows: z.array(z.strictObject({ label: text, values: z.array(z.string()).describe('One cell per column.') })).min(1),
    notes: z.array(text).optional().describe('Footnotes shown under the table.'),
  }),
  z.strictObject({
    type: z.literal('cards'),
    title: text,
    intro: text.optional(),
    items: z.array(z.strictObject({ name: text, tag: z.string().optional().describe('Short label, e.g. "after 30 days".'), text })).min(1),
  }),
  z.strictObject({
    type: z.literal('model'),
    title: text,
    intro: text.optional(),
    diagram,
  }),
  z.strictObject({
    type: z.literal('code'),
    title: text,
    intro: text.optional(),
    lang: z.enum(LANGS),
    source,
  }),
]);

/** A sub-type of a concept, such as columnar files within file formats. Each gets its own page. */
export const kind = z.strictObject({
  id: id.describe('Unique across all concepts. The page lives at /concepts/<concept>/<kind>/.'),
  name: text.describe('e.g. "Columnar files".'),
  summary: text.describe('One line shown in lists and under the title.'),
  body: z.array(text).min(1).max(3).describe('What sets this kind apart from the others, and when to pick it, in one to three paragraphs.'),
  sources,
});

export const concept = z.strictObject({
  $schema: z.string().optional(),
  name: text.describe('Display name, e.g. "Message queues".'),
  category: id.describe('Id from content/categories.json.'),
  order: z.number().describe('Position within the category. Codes like MSG-02 follow this order.'),
  summary: text.describe('One line shown in lists and under the title.'),
  howItWorks: text,
  analogy: text.describe('An everyday comparison.'),
  useWhen: z.array(text).min(1),
  avoidWhen: z.array(text).min(1),
  example: text.describe('A short, concrete scenario.'),
  providers: z.strictObject({
    aws: text,
    gcp: text,
    azure: text,
    oss: text.describe('Open-source and other options.'),
  }).optional().describe('What each cloud and open source calls it. Leave out for ideas no provider sells, such as a coding style or a team practice.'),
  snippet: z.strictObject({
    lang: z.enum(LANGS),
    source,
  }).optional().describe('Leave out when no short piece of code shows the idea.'),
  related: z.array(id).describe('Ids of concepts people often confuse with this one.'),
  diagram: diagram.optional().describe('The live model. Leave out when moving packets can’t show the idea.'),
  sections: z.array(section).default([]).describe('Optional deep-dive sections shown after the example.'),
  kinds: z
    .array(kind)
    .default([])
    .describe('Sub-types, in reading order, each with its own page. Every technology that lists this concept then names one in its "kinds".'),
  history,
  sources,
});

// Row lengths, and that exactly one of concepts or technologies is set, are checked in integrity.ts: Astro's JSON Schema generator can't extend
// an object schema that has a top-level refinement.
export const comparison = z.strictObject({
  $schema: z.string().optional(),
  title: text,
  order: z.number(),
  concepts: z.array(id).max(4).default([]).describe('Concept ids, one per column. Use this or "technologies".'),
  technologies: z.array(id).max(4).default([]).describe('Technology ids, one per column, to compare products instead of concepts.'),
  rows: z
    .array(z.strictObject({ label: text, values: z.array(text).describe('One cell per column, in the same order as "concepts" or "technologies".') }))
    .min(1),
  tip: text.describe('Rule of thumb shown under the table.'),
  sources,
});

/* ------------------------------------------------------------ technologies */

const checked = date
  .describe('When the facts were last checked against the sources.');

export const PROVIDERS = ['aws', 'gcp', 'azure', 'oss', 'vendor'] as const;

/** How a technology relates to the one it's listed under. */
export const RELATIONS = ['managed', 'distribution', 'fork', 'local', 'tool', 'extension'] as const;

/** Simulation settings a technology brings into the playground. Missing fields fall back to its concept’s defaults. */
export const play = nodeFields.pick({
  kind: true, mode: true, route: true, sub: true,
  allowText: true, denyText: true, delay: true, p: true, min: true, max: true, work: true, idle: true, cold: true, coldText: true,
  cap: true, gap: true, cells: true, retain: true, emit: true,
}).partial().describe('How this technology behaves in the playground. Usually unnecessary: the concept supplies sensible defaults.');

export const technology = z.strictObject({
  $schema: z.string().optional(),
  name: text.describe('Product name, e.g. "Apache Kafka".'),
  concepts: z.array(id).min(1).describe('Concepts this is an example of. The first one decides where it’s listed.'),
  kinds: z
    .array(id)
    .default([])
    .describe('Kinds (sub-types) of its concepts that it belongs to, e.g. "columnar-files". Required for each of its concepts that has kinds.'),
  parent: z
    .strictObject({
      id: id.describe('The technology to list this one under. It must share this one’s first concept.'),
      as: z.enum(RELATIONS).describe('managed: a cloud service that runs it for you. distribution: a packaged, supported version. fork: a project split off from it. local: a way to run it on a laptop or in CI. tool: installs or manages it. extension: built on top of it.'),
    })
    .optional()
    .describe('Lists this under another technology instead of beside it, e.g. EKS under Kubernetes.'),
  provider: z.enum(PROVIDERS).describe('aws, gcp or azure for a cloud provider’s own service; oss for open source; vendor for a commercial product from someone else.'),
  vendor: text.optional().describe('Who makes it, e.g. "Apache Software Foundation" or "Snowflake Inc.".'),
  license: text.optional().describe('e.g. "Apache 2.0", "MIT" or "Proprietary".'),
  website: z.url(),
  archived: z
    .strictObject({
      since: date.describe('When it stopped being maintained or distributed.'),
      reason: text.describe('One or two sentences: what happened and what it means for users.'),
      alternatives: z.array(id).min(1).describe('Ids of maintained technologies to move to, best fit first.'),
    })
    .optional()
    .describe('Set when the project is no longer maintained or can no longer be installed the usual way.'),
  repo: z.url().optional().describe('Source code repository, e.g. "https://github.com/apache/kafka". Leave out for closed-source services.'),
  summary: text.describe('One line shown in lists and under the title.'),
  intro: z.array(text).min(1).describe('What it is and how it works, in one to three paragraphs.'),
  strengths: z.array(text).min(1).describe('Two to four reasons people pick it.'),
  limits: z.array(text).min(1).describe('Two to four trade-offs or gotchas.'),
  worksWith: z
    .array(z.strictObject({
      id: id.describe('Another technology’s id.'),
      how: text.max(44, 'Keep it under 45 characters: it labels an arrow').describe('Reads as "<this> <how> <other>", e.g. "keeps its catalog in".'),
    }))
    .default([])
    .describe('Technologies this one uses or plugs into. The other page shows the link too, so list each pair once.'),
  snippet: z.strictObject({ lang: z.enum(LANGS), title: text.optional(), source }).optional(),
  play: play.optional(),
  sections: z.array(section).default([]).describe('Optional deep-dive sections shown below the overview.'),
  history,
  sources,
  checked,
});

/* ------------------------------------------------------------- foundations */

export const foundation = z.strictObject({
  $schema: z.string().optional(),
  name: text.describe('e.g. "The Apache Software Foundation".'),
  vendor: text.describe('The exact "vendor" value its projects use on their pages. They’re listed here automatically and link back.'),
  website: z.url(),
  summary: text.describe('One line shown under the title.'),
  intro: z.array(text).min(1).describe('What it is and how it works, in one to three paragraphs.'),
  sections: z.array(section).default([]).describe('Deep-dive sections shown below the projects.'),
  history,
  sources,
  checked,
});

/* --------------------------------------------------------------- resources */

export const RESOURCE_KINDS = ['article', 'video', 'slides', 'paper', 'book', 'podcast', 'course', 'website'] as const;

export const resource = z.strictObject({
  $schema: z.string().optional(),
  title: text.describe('The title the page itself uses, e.g. "Making Postgres Queues Scale".'),
  url: z.url(),
  kind: z.enum(RESOURCE_KINDS).describe('article (blog posts too), video (recorded talks too), slides (a talk’s slide deck), paper, book, podcast, course, or website for a site you explore rather than read once.'),
  by: text.describe('Who made it: author and publisher, e.g. "Qian Li and Peter Kraft, DBOS".'),
  published: z
    .string()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Use YYYY, YYYY-MM or YYYY-MM-DD')
    .optional()
    .describe('Leave out for websites that keep changing.'),
  summary: text.describe('Why it’s worth the time, in one or two sentences: what you’ll learn, and any bias (e.g. a vendor pitching its own product).'),
  concepts: z.array(id).default([]).describe('Concepts it’s about. It’s listed on their pages under “Worth exploring”.'),
  technologies: z.array(id).default([]).describe('Technologies it’s about.'),
  architectures: z.array(id).default([]).describe('Architectures it’s about.'),
  added: date.describe('When it was added to the catalog.'),
});

/* -------------------------------------------------------------- benchmarks */

export const benchmark = z.strictObject({
  $schema: z.string().optional(),
  name: text.describe('e.g. "ClickBench".'),
  by: text.describe('Who maintains it, e.g. "ClickHouse Inc.".'),
  website: z.url().describe('Where the results are published.'),
  repo: z.url().optional().describe('Queries, loaders and raw results, if public.'),
  license: text.optional().describe('Licence of the benchmark code, e.g. "Apache 2.0".'),
  summary: text.describe('One line: what it measures.'),
  intro: z.array(text).min(1).max(3).describe('What it runs and how a result is produced, in one to three paragraphs.'),
  setup: z
    .array(z.strictObject({ label: text, value: text }))
    .min(2)
    .describe('Short facts shown as a list, e.g. Dataset, Queries, Metric, Hardware, Who submits results.'),
  caveats: z.array(text).min(1).describe('What the numbers don’t tell you: who runs it, tuning, how far the workload is from yours.'),
  concepts: z.array(id).min(1).describe('Concepts whose products it compares. It’s listed on their pages under “Benchmarks”.'),
  technologies: z.array(id).default([]).describe('Systems in its results that have pages here. It’s listed on their pages too.'),
  sections: z.array(section).default([]).describe('Optional deep-dive sections, e.g. how to read the results.'),
  sources,
  checked,
});

/* ----------------------------------------------------------- architectures */

export const architecture = z.strictObject({
  $schema: z.string().optional(),
  title: text.describe('e.g. "Small lakehouse on DuckLake".'),
  order: z.number(),
  summary: text.describe('One line shown in lists and under the title.'),
  intro: text.describe('What this stack is for and who it suits.'),
  fits: text.describe('The scale or team it suits, e.g. "One team, up to a few TB".'),
  diagram: diagram.describe('Nodes with a "tech" link to technology pages; "concept" links to concept pages.'),
  steps: z
    .array(z.strictObject({
      title: text,
      text,
      nodes: z.array(id).default([]).describe('Diagram node ids this step is about.'),
    }))
    .min(2)
    .describe('How data or requests move through the stack, in order.'),
  good: z.array(text).min(1).describe('Why this shape works.'),
  watch: z.array(text).min(1).describe('Where it strains, and what to watch for.'),
  swaps: z
    .array(z.strictObject({ text, techs: z.array(id).default([]).describe('Technologies the swap mentions.') }))
    .default([])
    .describe('Common variations: what to swap in, and when.'),
  sources: sources.optional().describe('Sources for facts not already backed on the linked technology pages.'),
});

export type Diagram = z.output<typeof diagram>;
export type DiagramNode = z.output<typeof diagramNode>;
export type Concept = z.output<typeof concept>;
export type Kind = z.output<typeof kind>;
export type Relation = (typeof RELATIONS)[number];
export type Part = z.output<typeof part>;
export type Category = z.output<typeof category>;
export type Comparison = z.output<typeof comparison>;
export type Technology = z.output<typeof technology>;
export type TechSection = Technology['sections'][number];
export type Play = z.output<typeof play>;
export type Architecture = z.output<typeof architecture>;
export type Foundation = z.output<typeof foundation>;
export type Resource = z.output<typeof resource>;
export type Benchmark = z.output<typeof benchmark>;
