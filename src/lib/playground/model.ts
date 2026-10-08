// The playground's design format, and conversion to and from the diagram format the
// simulation engine and content files use. In a design every connection is an `out`
// link, including a stream's consumers, which the engine calls `readers`.
import type { Diagram, DiagramNode, Play } from '@/content/schema';

export const CANVAS = { w: 1200, h: 640 };

export type DNode = Omit<DiagramNode, 'readers'> & {
  out: string[];
  /** Stream nodes: milliseconds between reads, for every consumer. */
  readEvery?: number;
  /** Stream nodes: per-consumer read settings from a template; they win over `readEvery`. */
  reads?: Record<string, { every: number; batch?: number }>;
  /** Taken down by the user. */
  down?: boolean;
};

export interface Design {
  nodes: DNode[];
}

/** Something you can drop on the canvas. */
export interface PaletteItem {
  key: string;
  name: string;
  /** Second line under the name, e.g. the concept. */
  sub: string;
  group: string;
  tech?: string;
  concept?: string;
  play: Play;
  /** Search words: concept names, vendor. */
  terms: string;
}

/** Traffic sources and plain boxes that aren't a specific product. */
export const BASICS: PaletteItem[] = [
  { key: 'src:users', name: 'Users', sub: 'browsers & apps', group: 'Sources', terms: 'clients requests web mobile', play: { emit: { req: true, every: 450, jitter: 0.4 } } },
  { key: 'src:devices', name: 'Devices', sub: 'sensors · events', group: 'Sources', terms: 'iot telemetry events', play: { emit: { every: 300, jitter: 0.3, cycle: true } } },
  { key: 'src:burst', name: 'Flash sale', sub: 'bursty requests', group: 'Sources', terms: 'spike burst traffic', play: { emit: { req: true, jitter: 0.3, phases: [[3000, 900], [2500, 110], [3000, 900]] } } },
  { key: 'src:cron', name: 'Nightly job', sub: 'scheduled batch', group: 'Sources', terms: 'cron schedule batch', play: { emit: { jitter: 0.2, phases: [[1600, 180], [5000, null]] } } },
  { key: 'gen:service', name: 'Service', sub: 'your code', group: 'Sources', terms: 'app backend api', play: {} },
  { key: 'gen:worker', name: 'Workers', sub: 'fixed pool', group: 'Sources', terms: 'consumer worker', play: { kind: 'pool', min: 2, max: 2, work: 600 } },
];

/** Fills in the fields a node kind or mode needs, so any preset makes a valid node. */
export function complete(n: DNode): DNode {
  const m: DNode = { ...n };
  if (m.kind === 'pool') m.max ??= 4;
  if (m.kind === 'queue') m.cap ??= 6;
  if (m.kind === 'log') { m.cells ??= 10; m.readEvery ??= 600; }
  if (m.mode === 'cache' || (m.mode === 'gate' && !m.allowTypes)) m.p ??= 0.8;
  return m;
}

export function nodeFrom(item: PaletteItem, id: string, x: number, y: number): DNode {
  const { sub, ...play } = item.play;
  return complete({
    id, x, y,
    label: item.name,
    sub: sub ?? item.sub,
    ...(item.tech ? { tech: item.tech } : {}),
    ...(item.concept ? { concept: item.concept } : {}),
    ...structuredClone(play),
    out: [],
  });
}

/** The engine's format: stream consumers become `readers`. */
export function toDiagram(d: Design, caption = 'Playground design'): Diagram {
  const byId = new Map(d.nodes.map(n => [n.id, n]));
  return {
    caption,
    w: CANVAS.w,
    h: CANVAS.h,
    nodes: d.nodes.map(n => {
      const { readEvery, reads, down, ...rest } = n;
      const out = n.out.filter(t => byId.has(t));
      if (n.kind === 'log') {
        return {
          ...rest,
          out: [],
          readers: out.map(t => ({
            to: t,
            every: reads?.[t]?.every ?? readEvery ?? 600,
            ...(reads?.[t]?.batch ? { batch: reads[t].batch } : {}),
            name: byId.get(t)!.label,
          })),
        };
      }
      return { ...rest, out };
    }),
  };
}

/** Loads a content diagram (an architecture) into a design, spread out and centred on the canvas. */
export function fromDiagram(diagram: Diagram): Design {
  const w = diagram.w ?? 760, h = diagram.h ?? 260;
  // spread positions (not box sizes) so the design fills more of the larger canvas
  const k = Math.min(1.35, (CANVAS.w - 100) / w, (CANVAS.h - 80) / h);
  const dx = (CANVAS.w - w * k) / 2, dy = (CANVAS.h - h * k) / 2;
  return {
    nodes: diagram.nodes.map(n => {
      const { readers, ...rest } = structuredClone(n);
      const out = [...(rest.out ?? []), ...(readers ?? []).map(r => r.to)];
      return complete({
        ...rest, x: Math.round(n.x * k + dx), y: Math.round(n.y * k + dy), out,
        ...(readers?.length ? {
          readEvery: readers[0].every,
          reads: Object.fromEntries(readers.map(r => [r.to, { every: r.every, batch: r.batch }])),
        } : {}),
      });
    }),
  };
}

/** A key that changes when anything except node positions changes, so dragging doesn't restart the simulation. */
export function structureKey(d: Design): string {
  return JSON.stringify(d.nodes.map(({ x, y, down, ...rest }) => rest));
}

/** Problems worth pointing out in a design. */
export function checkDesign(d: Design): string[] {
  const notes: string[] = [];
  const byId = new Map(d.nodes.map(n => [n.id, n]));
  const sources = d.nodes.filter(n => n.emit);
  if (!d.nodes.length) return notes;
  if (!sources.length) notes.push('Nothing generates traffic yet. Add a source such as Users or Devices, or turn on traffic for a node.');

  // reachability from sources
  const seen = new Set<string>();
  const stack = sources.map(s => s.id);
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    byId.get(id)?.out.forEach(t => stack.push(t));
  }
  if (sources.length) {
    for (const n of d.nodes) if (!seen.has(n.id)) notes.push(`${n.label} never receives anything. Connect something to it.`);
  }
  for (const n of d.nodes) {
    if ((n.kind === 'queue' || n.kind === 'log') && !n.out.length) {
      notes.push(`Nothing reads from ${n.label}. ${n.kind === 'queue' ? 'It will fill up and start dropping messages.' : 'Events pile up unread.'}`);
    }
    if (n.mode === 'sink' && n.out.length) notes.push(`${n.label} absorbs everything it gets, so its outgoing links never carry traffic.`);
  }

  // loops
  const state = new Map<string, 1 | 2>();
  let loop: string[] | null = null;
  const visit = (id: string, path: string[]) => {
    if (loop) return;
    state.set(id, 1);
    for (const t of byId.get(id)?.out ?? []) {
      if (state.get(t) === 1) { loop = [...path.slice(path.indexOf(t)), t]; return; }
      if (!state.has(t)) visit(t, [...path, t]);
    }
    state.set(id, 2);
  };
  for (const n of d.nodes) if (!state.has(n.id)) visit(n.id, [n.id]);
  if (loop) notes.push(`Loop: ${(loop as string[]).map(id => byId.get(id)?.label).join(' → ')}. Packets that go round more than ${24} hops are dropped.`);

  const down = d.nodes.filter(n => n.down);
  if (down.length) notes.push(`${down.map(n => n.label).join(', ')} ${down.length === 1 ? 'is' : 'are'} down. Anything sent there is lost.`);
  return notes;
}

/* ---------- sharing: design ⇄ URL-safe string ---------- */

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0));

export async function encodeDesign(d: Design): Promise<string> {
  const json = JSON.stringify({ v: 1, nodes: d.nodes.map(n => ({ ...n, x: Math.round(n.x), y: Math.round(n.y) })) });
  return b64(await pipe(new TextEncoder().encode(json), new CompressionStream('deflate-raw')));
}

export async function decodeDesign(s: string): Promise<Design | null> {
  try {
    const json = new TextDecoder().decode(await pipe(unb64(s), new DecompressionStream('deflate-raw')));
    const raw = JSON.parse(json) as { nodes?: DNode[] };
    if (!Array.isArray(raw.nodes)) return null;
    return { nodes: raw.nodes.filter(n => n && typeof n.id === 'string').map(n => complete({ ...n, out: Array.isArray(n.out) ? n.out : [] })) };
  } catch {
    return null;
  }
}
