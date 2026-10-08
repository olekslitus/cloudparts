// A small SVG simulation engine. It reads a diagram spec (see src/content/schema.ts),
// draws nodes and edges, and animates packets moving between them.
//
// Node kinds: svc (box), pool (autoscaling instances), queue (bounded buffer),
// log (append-only stream with per-reader offsets).
// Modes: fwd, sink, reply, cache, gate. Routing: rr, fanout, hash, type.
import type { Diagram, DiagramNode } from '@/content/schema';

const NS = 'http://www.w3.org/2000/svg';
const COL = ['var(--p1)', 'var(--p2)', 'var(--p3)', 'var(--p4)'];
const SPEED = 0.2; // px per ms at 1x
let uid = 0;

type Attrs = Record<string, string | number>;
function sv<K extends keyof SVGElementTagNameMap>(tag: K, attrs?: Attrs | null, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
const tw = (s: string | undefined, px: number, mono?: boolean) => (s ? s.length * px * (mono ? 0.6 : 0.57) : 0);
const rnd = (n: number) => Math.floor(Math.random() * n);

interface Geom { x1: number; y1: number; x2: number; y2: number; len: number }
interface Pkt { color: string; req: boolean; type?: string; key?: number; path: string[]; born: number }
interface Packet extends Pkt {
  reply: boolean; from: string; to: string; t0: number; dur: number; g: Geom;
  el?: SVGCircleElement;
}
interface Slot { busy: boolean; last: number; cold?: boolean; p?: Packet | null; coldEnd?: number; end?: number }
interface Reader {
  to: string; every: number; name: string; batch?: number;
  cursor: number; next?: number; tri?: SVGPathElement; lab?: SVGTextElement; y?: number;
}
type Emit = NonNullable<DiagramNode['emit']> & { next?: number; ci?: number };

/** Runtime node: the spec plus simulation state and SVG handles. */
type SimNode = Omit<DiagramNode, 'kind' | 'out' | 'readers' | 'emit' | 'w'> & {
  kind: NonNullable<DiagramNode['kind']>;
  out: string[];
  w: number; h: number;
  rr: number; flash: { text: string; cls: string; t: number } | null; pulseUntil: number;
  disabled: boolean; inflight: number;
  emit?: Emit;
  readers?: Reader[];
  slots?: Slot[]; backlog?: Packet[];
  buf?: Packet[]; nextRel?: number;
  entries?: { off: number; color: string }[]; len?: number;
  g?: SVGGElement; flashEl?: SVGTextElement; flashY?: number;
  slotEls?: SVGElement[]; cellEls?: SVGRectElement[]; cellTx?: SVGTextElement[]; blEl?: SVGTextElement;
};
type Outage = NonNullable<Diagram['events']>[number] & { next: number };

export interface NodeLink { href: string; name: string }

export interface SimOptions {
  /** Node id → page it opens. Nodes without an entry aren't links. */
  links?: Record<string, NodeLink>;
  /** Called when a linked node is activated. */
  onNav?: (href: string) => void;
  /** Node ids to mark as "you are here". */
  highlight?: string[];
  label?: string;
}

/** Running totals, for the playground’s readout. Times are simulated milliseconds. */
export interface SimStats {
  /** Packets emitted by sources. */
  sent: number;
  /** Requests answered back at their source, plus data absorbed by a store or sink. */
  done: number;
  /** Packets lost: full queues, nodes that are down, denied by a gate, or going nowhere. */
  dropped: number;
  /** Round-trip times of recent answered requests. */
  latencies: number[];
}

/** Packets that pass through more nodes than this are dropped, so loops in a design can't run away. */
const MAX_HOPS = 24;

export class Sim {
  spec: Diagram;
  t = 0;
  speed = 1;
  running: boolean;
  visible = true;
  dead = false;
  svg!: SVGSVGElement;
  stats: SimStats = { sent: 0, done: 0, dropped: 0, latencies: [] };

  private opts: SimOptions;
  private W: number;
  private H: number;
  private packets: Packet[] = [];
  private timers: { at: number; fn: () => void }[] = [];
  private dies: { x: number; y: number; color: string; t0: number }[] = [];
  private dieEls: SVGCircleElement[] = [];
  private N: Record<string, SimNode> = {};
  private E: Record<string, Geom> = {};
  private events: Outage[];
  private lines: Record<string, SVGLineElement> = {};
  private gP!: SVGGElement;
  private gF!: SVGGElement;
  private io: IntersectionObserver;

  constructor(host: Element, spec: Diagram, opts: SimOptions) {
    this.spec = spec;
    this.opts = opts;
    this.running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.W = spec.w || 760;
    this.H = spec.h || 260;
    spec.nodes.forEach(n => { this.N[n.id] = this.initNode(structuredClone(n)); });
    this.events = (spec.events || []).map(e => ({ ...e, next: e.at }));
    this.build(host);
    this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; }, { rootMargin: '80px' });
    this.io.observe(this.svg);
    SIMS.add(this);
    startLoop();
  }

  private initNode(spec: DiagramNode): SimNode {
    const n = spec as unknown as SimNode;
    n.kind = spec.kind || 'svc';
    n.out = spec.out || [];
    n.rr = 0; n.flash = null; n.pulseUntil = -1; n.disabled = false; n.inflight = 0;
    if (n.kind === 'svc') {
      n.w = spec.w || Math.max(tw(n.label, 13) + 28, tw(n.sub, 9.5, true) + 24, 96);
      n.h = n.sub ? 46 : 36;
    } else if (n.kind === 'pool') {
      n.max = n.max || 4;
      n.w = spec.w || Math.max(tw(n.label, 13) + 28, tw(n.sub, 9.5, true) + 24, n.max * 15 + 22, 96);
      n.h = 64;
      n.slots = []; n.backlog = [];
      for (let i = 0; i < (n.min || 0); i++) n.slots.push({ busy: false, last: 0 });
    } else if (n.kind === 'queue') {
      n.w = n.cap! * 18 + 14; n.h = 34; n.buf = []; n.nextRel = 0;
    } else if (n.kind === 'log') {
      n.w = n.cells! * 22 + 12; n.h = 34; n.entries = []; n.len = 0;
      n.readers!.forEach(r => { r.cursor = 0; r.next = undefined; });
    }
    if (n.emit) n.emit.next = undefined;
    return n;
  }

  /* ---------- geometry ---------- */
  private anchor(n: SimNode, tx: number, ty: number, side?: 'in' | 'out') {
    if (n.kind === 'queue' || n.kind === 'log') {
      return side === 'out' ? { x: n.x + n.w / 2, y: n.y } : { x: n.x - n.w / 2, y: n.y };
    }
    const dx = tx - n.x, dy = ty - n.y;
    const hw = n.w / 2 + 2, hh = n.h / 2 + 2;
    const s = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    return { x: n.x + dx * s, y: n.y + dy * s };
  }
  private edgeGeom(aId: string, bId: string): Geom {
    const A = this.N[aId], B = this.N[bId];
    const pa0 = (A.kind === 'queue' || A.kind === 'log') ? this.anchor(A, 0, 0, 'out') : null;
    const pb0 = (B.kind === 'queue' || B.kind === 'log') ? this.anchor(B, 0, 0, 'in') : null;
    const pa = pa0 || this.anchor(A, (pb0 || B).x, (pb0 || B).y);
    const pb = pb0 || this.anchor(B, pa.x, pa.y);
    return { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, len: Math.hypot(pb.x - pa.x, pb.y - pa.y) };
  }
  private geom(a: string, b: string): Geom | null {
    const g = this.E[a + '>' + b];
    if (g) return g;
    const r = this.E[b + '>' + a];
    if (r) return { x1: r.x2, y1: r.y2, x2: r.x1, y2: r.y1, len: r.len };
    return null;
  }

  /* ---------- build SVG ---------- */
  private build(host: Element) {
    const id = 'ar' + (++uid);
    const svg = this.svg = sv('svg', { viewBox: `0 0 ${this.W} ${this.H}`, class: 'dia' + (this.spec.wide ? ' wide' : ''), role: 'img' });
    if (this.opts.label) svg.setAttribute('aria-label', this.opts.label);
    host.appendChild(svg);
    const defs = sv('defs', null, svg);
    const m = sv('marker', { id, viewBox: '0 0 8 8', refX: '7.5', refY: '4', markerWidth: '7', markerHeight: '7', orient: 'auto' }, defs);
    sv('path', { d: 'M0,0.6 L8,4 L0,7.4 z', class: 'arrow' }, m);
    const gZ = sv('g', null, svg), gE = sv('g', null, svg), gN = sv('g', null, svg);
    this.gP = sv('g', null, svg); this.gF = sv('g', null, svg);

    (this.spec.zones || []).forEach(z => {
      sv('rect', { x: z.x, y: z.y, width: z.w, height: z.h, rx: 6, class: 'zone' }, gZ);
      sv('text', { x: z.x + 10, y: z.y + 16, class: 'zlabel' }, gZ).textContent = z.label.toUpperCase();
    });

    const pairs: [string, string][] = [];
    const add = (a: string, b: string) => {
      if (!this.E[a + '>' + b] && !this.E[b + '>' + a] && this.N[a] && this.N[b]) {
        this.E[a + '>' + b] = this.edgeGeom(a, b); pairs.push([a, b]);
      }
    };
    Object.values(this.N).forEach(n => {
      n.out.forEach(t => add(n.id, t));
      if (n.rules) Object.values(n.rules).flat().forEach(t => add(n.id, t));
      if (n.deny) add(n.id, n.deny);
      if (n.emit && n.emit.to) n.emit.to.forEach(t => add(n.id, t));
      if (n.readers) n.readers.forEach(r => add(n.id, r.to));
    });
    pairs.forEach(([a, b]) => {
      const g = this.E[a + '>' + b];
      this.lines[a + '>' + b] = sv('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, class: 'edge', 'marker-end': `url(#${id})` }, gE);
    });

    Object.values(this.N).forEach(n => this.buildNode(n, gN));
  }

  private buildNode(n: SimNode, parent: SVGGElement) {
    const g = n.g = sv('g', { class: 'node', transform: `translate(${n.x},${n.y})`, 'data-id': n.id }, parent);
    if (this.opts.highlight?.includes(n.id)) g.classList.add('current');
    sv('rect', { x: -n.w / 2, y: -n.h / 2, width: n.w, height: n.h, rx: (n.kind === 'queue' || n.kind === 'log') ? 3 : 6, class: 'nbox' }, g);
    const above = (n.kind === 'queue' || n.kind === 'log');
    if (above) {
      sv('text', { x: 0, y: -n.h / 2 - 21, 'text-anchor': 'middle', class: 'nlabel' }, g).textContent = n.label;
      if (n.sub) sv('text', { x: 0, y: -n.h / 2 - 8, 'text-anchor': 'middle', class: 'nsub' }, g).textContent = n.sub;
    } else if (n.kind === 'pool') {
      sv('text', { x: 0, y: -n.h / 2 + 18, 'text-anchor': 'middle', class: 'nlabel' }, g).textContent = n.label;
      if (n.sub) sv('text', { x: 0, y: -n.h / 2 + 31, 'text-anchor': 'middle', class: 'nsub' }, g).textContent = n.sub;
    } else {
      sv('text', { x: 0, y: n.sub ? -3 : 4.5, 'text-anchor': 'middle', class: 'nlabel' }, g).textContent = n.label;
      if (n.sub) sv('text', { x: 0, y: 12.5, 'text-anchor': 'middle', class: 'nsub' }, g).textContent = n.sub;
    }
    if (n.emit && !n.emit.to) sv('circle', { cx: -n.w / 2 + 8, cy: -n.h / 2 + 8, r: 2.6, class: 'srcdot' }, g);

    if (n.kind === 'queue') {
      n.slotEls = [];
      for (let i = 0; i < n.cap!; i++) n.slotEls.push(sv('circle', { cx: n.w / 2 - 16 - i * 18, cy: 0, r: 6.5, class: 'slot-empty' }, g));
    }
    if (n.kind === 'log') {
      n.cellEls = []; n.cellTx = [];
      for (let i = 0; i < n.cells!; i++) {
        const x = -n.w / 2 + 6 + i * 22;
        n.cellEls.push(sv('rect', { x, y: -11, width: 19, height: 22, rx: 2, class: 'cell empty' }, g));
        n.cellTx.push(sv('text', { x: x + 9.5, y: 3.2, 'text-anchor': 'middle', class: 'celltxt' }, g));
      }
      n.readers!.forEach((r, ri) => {
        const y = n.h / 2 + 13 + ri * 15;
        r.tri = sv('path', { d: 'M0,-5 L4.5,2.5 L-4.5,2.5 z', class: 'cursor', transform: `translate(0,${y})` }, g);
        r.lab = sv('text', { x: -n.w / 2 - 7, y: y + 3, 'text-anchor': 'end', class: 'rlabel' }, g);
        r.y = y;
      });
    }
    if (n.kind === 'pool') {
      n.slotEls = [];
      const total = n.max! * 15 - 4;
      for (let i = 0; i < n.max!; i++) n.slotEls.push(sv('rect', { x: -total / 2 + i * 15, y: n.h / 2 - 19, width: 11, height: 11, rx: 2, class: 'ps-none' }, g));
      n.blEl = sv('text', { x: 0, y: n.h / 2 + 13, 'text-anchor': 'middle', class: 'backlog' }, g);
    }
    const fy = above ? -n.h / 2 - 36 : -n.h / 2 - 8;
    n.flashEl = sv('text', { x: 0, y: fy, 'text-anchor': 'middle', class: 'flash', opacity: 0 }, g);
    n.flashY = fy;

    const link = this.opts.links?.[n.id];
    if (link && this.opts.onNav) {
      const label = 'Open ' + link.name;
      const nav = this.opts.onNav;
      g.classList.add('linkable');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'link');
      g.setAttribute('aria-label', label);
      sv('title', null, g).textContent = label;
      const go = () => nav(link.href);
      g.addEventListener('click', go);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    }
  }

  /* ---------- behaviour ---------- */
  private later(ms: number, fn: () => void) { this.timers.push({ at: this.t + ms, fn }); }
  private pulse(n: SimNode) { n.pulseUntil = this.t + 260; }
  private flash(n: SimNode, text: string, cls: string) { n.flash = { text, cls, t: this.t }; }
  private die(n: SimNode, p: Packet) {
    const g = p.g;
    this.stats.dropped++;
    this.dies.push({ x: g ? g.x2 : n.x, y: g ? g.y2 : n.y, color: p.color, t0: this.t });
  }
  private absorbed(p: Packet) { if (!p.req) this.stats.done++; }

  private route(n: SimNode, p: Pkt, mode?: string): string[] {
    const outs = n.out;
    switch (mode || n.route || 'rr') {
      case 'fanout': return outs.slice();
      case 'hash': return outs.length ? [outs[(p.key || 0) % outs.length]] : [];
      case 'type': return (n.rules && p.type && n.rules[p.type]) || [];
      default: {
        const live = outs.filter(id => !this.N[id].disabled);
        if (!live.length) return [];
        return [live[(n.rr++) % live.length]];
      }
    }
  }

  private send(from: string, to: string, pkt: Pkt, reply?: boolean) {
    const g = this.geom(from, to);
    if (!g) return;
    if (!reply && (pkt.path?.length || 0) >= MAX_HOPS) { this.die(this.N[from], { ...pkt, g } as Packet); return; }
    const p: Packet = {
      color: pkt.color, req: pkt.req, type: pkt.type, key: pkt.key, reply: !!reply, born: pkt.born,
      from, to, t0: this.t, dur: Math.max(320, g.len / SPEED), g,
      path: reply ? pkt.path : [...(pkt.path || []), from],
    };
    const T = this.N[to];
    if (T.kind === 'pool' && !reply) T.inflight++;
    this.packets.push(p);
  }

  private reply(n: SimNode, p: Packet) {
    if (!p.path.length) {
      // back at the source: the request is done
      this.pulse(n);
      this.stats.done++;
      this.stats.latencies.push(this.t - p.born);
      if (this.stats.latencies.length > 200) this.stats.latencies.shift();
      return;
    }
    const to = p.path[p.path.length - 1];
    this.send(n.id, to, { ...p, path: p.path.slice(0, -1) }, true);
  }

  private emitFrom(n: SimNode) {
    const e = n.emit!;
    const type = e.types ? e.types[rnd(e.types.length)] : e.type;
    let key: number | undefined, color: string;
    if (e.colorByKey) { key = rnd(e.colorByKey); color = COL[key % 4]; }
    else if (e.colorByType) color = COL[e.colorByType[type!]];
    else if (e.cycle) { e.ci = ((e.ci || 0) + 1) % 4; color = COL[e.ci]; }
    else color = COL[e.color || 0];
    const pkt: Pkt = { color, req: !!e.req, type, key, path: [], born: this.t };
    const targets = e.to ? e.to : this.route(n, pkt, e.route);
    this.stats.sent++;
    if (!targets.length) { this.stats.dropped++; return; }
    targets.forEach(t => this.send(n.id, t, pkt));
  }

  private arrive(p: Packet) {
    const n = this.N[p.to];
    if (n.kind === 'pool' && !p.reply) n.inflight = Math.max(0, n.inflight - 1);
    if (n.disabled) { this.flash(n, 'missed', 'bad'); this.die(n, p); return; }
    if (p.reply) { this.reply(n, p); return; }
    if (n.kind === 'queue') {
      if (n.buf!.length >= n.cap!) { this.flash(n, 'full: dropped', 'bad'); this.die(n, p); }
      else n.buf!.push(p);
      return;
    }
    if (n.kind === 'log') {
      if (p.req) this.later(30, () => this.reply(n, p));
      n.entries!.push({ off: n.len!++, color: p.color });
      if (n.entries!.length > 80) n.entries!.splice(0, n.entries!.length - 80);
      this.pulse(n);
      return;
    }
    if (n.kind === 'pool') { this.poolAccept(n, p); return; }
    this.handle(n, p);
  }

  private handle(n: SimNode, p: Packet) {
    const mode = n.mode || 'fwd';
    if (mode === 'sink') {
      this.pulse(n);
      if (p.req) this.later(n.delay || 40, () => this.reply(n, p));
      else this.absorbed(p);
      return;
    }
    if (mode === 'reply') {
      this.pulse(n);
      if (p.req) this.later(n.delay || 100, () => this.reply(n, p));
      else this.absorbed(p);
      return;
    }
    if (mode === 'cache' && p.req) {
      if (Math.random() < n.p!) { this.flash(n, 'HIT', 'ok'); this.pulse(n); this.later(40, () => this.reply(n, p)); }
      else { this.flash(n, 'MISS', 'warn'); this.forward(n, p); }
      return;
    }
    if (mode === 'gate') {
      const ok = n.allowTypes ? n.allowTypes.includes(p.type!) : Math.random() < n.p!;
      if (!ok) {
        if (n.quiet) { this.pulse(n); return; }
        this.flash(n, n.denyText || 'denied', 'bad');
        if (n.deny) this.send(n.id, n.deny, p);
        else this.die(n, p);
        return;
      }
      if (n.allowText) this.flash(n, n.allowText, n.quiet ? 'bad' : 'ok');
    }
    this.forward(n, p);
  }

  private forward(n: SimNode, p: Packet) {
    const targets = this.route(n, p);
    if (!targets.length) {
      this.pulse(n);
      if (p.req) this.later(n.delay || 60, () => this.reply(n, p));
      else this.absorbed(p);
      return;
    }
    this.pulse(n);
    targets.forEach(t => this.send(n.id, t, p));
  }

  private poolAccept(n: SimNode, p: Packet) {
    const free = n.slots!.find(s => !s.busy);
    if (free) this.startJob(n, free, p, false);
    else if (n.slots!.length < n.max!) { const s = { busy: false, last: this.t }; n.slots!.push(s); this.startJob(n, s, p, true); }
    else n.backlog!.push(p);
  }
  private startJob(n: SimNode, s: Slot, p: Packet, cold: boolean) {
    const coldMs = cold ? (n.cold || 0) : 0;
    s.busy = true; s.cold = cold && coldMs > 0; s.p = p;
    s.coldEnd = this.t + coldMs; s.end = this.t + (n.work || 500) + coldMs;
    if (s.cold) this.flash(n, n.coldText || 'cold start', 'warn');
  }

  private step(dt: number) {
    const t = this.t += dt;
    if (this.timers.length) {
      const due = this.timers.filter(x => x.at <= t);
      if (due.length) { this.timers = this.timers.filter(x => x.at > t); due.forEach(x => x.fn()); }
    }
    this.events.forEach(ev => {
      if (t >= ev.next) {
        const n = this.N[ev.node];
        n.disabled = true; this.flash(n, ev.text, 'bad');
        this.later(ev.dur, () => { n.disabled = false; this.flash(n, ev.back, 'ok'); });
        ev.next += ev.every;
      }
    });
    for (const n of Object.values(this.N)) {
      // emitters
      const e = n.emit;
      if (e) {
        let every: number | null | undefined = e.every;
        if (e.phases) {
          const total = e.phases.reduce((a, ph) => a + ph[0], 0);
          let pos = t % total;
          for (const ph of e.phases) { if (pos < ph[0]) { every = ph[1]; break; } pos -= ph[0]; }
        }
        if (e.next === undefined) e.next = t + Math.random() * (every || 800);
        if (t >= e.next) {
          if (every) { this.emitFrom(n); e.next = t + every * (1 + (Math.random() * 2 - 1) * (e.jitter || 0)); }
          else e.next = t + 200;
        }
      }
      // queue release: only to a consumer with free capacity
      if (n.kind === 'queue' && n.buf!.length && t >= n.nextRel!) {
        const ready = n.out.filter(id => {
          const c = this.N[id];
          if (c.disabled) return false;
          if (c.kind === 'pool') return c.slots!.filter(s => s.busy).length + c.inflight + c.backlog!.length < c.max!;
          return true;
        });
        if (ready.length) {
          const id = ready[(n.rr++) % ready.length];
          const p = n.buf!.shift()!;
          this.send(n.id, id, p);
          n.nextRel = t + (n.gap || 150);
        }
      }
      // log readers
      if (n.kind === 'log') {
        n.readers!.forEach(r => {
          if (r.next === undefined) r.next = t + Math.random() * r.every;
          if (t >= r.next) {
            r.next = t + r.every;
            const oldest = n.len! - (n.retain || 40);
            if (r.cursor < oldest) { r.cursor = oldest; this.flash(n, 'expired: past retention', 'warn'); }
            const k = Math.min(n.len! - r.cursor, r.batch || 1);
            for (let i = 0; i < k; i++) {
              const ent = n.entries!.find(x => x.off === r.cursor + i);
              const color = ent ? ent.color : COL[0];
              this.later(i * 120, () => this.send(n.id, r.to, { color, req: false, path: [], born: this.t }));
            }
            r.cursor += k;
          }
        });
      }
      // pools
      if (n.kind === 'pool') {
        n.slots!.forEach(s => {
          if (s.busy && s.cold && t >= s.coldEnd!) s.cold = false;
          if (s.busy && t >= s.end!) {
            s.busy = false; s.cold = false; s.last = t;
            const p = s.p!; s.p = null;
            this.handle(n, p);
            if (n.backlog!.length) this.startJob(n, s, n.backlog!.shift()!, false);
          }
        });
        if (n.slots!.length > (n.min || 0)) {
          const i = n.slots!.findIndex(s => !s.busy && t - s.last > (n.idle || 3000));
          if (i >= 0) { n.slots!.splice(i, 1); if (n.scaleText) this.flash(n, n.scaleText, 'info'); }
        }
      }
    }
    // packets
    const still: Packet[] = [];
    for (const p of this.packets) {
      if (t - p.t0 >= p.dur) { if (p.el) p.el.remove(); this.arrive(p); }
      else still.push(p);
    }
    // arrive() may push new packets onto this.packets; keep those too
    const added = this.packets.filter(p => t - p.t0 < p.dur && !still.includes(p));
    this.packets = still.concat(added);
    this.dies = this.dies.filter(d => t - d.t0 < 500);
  }

  advance(ms: number) {
    let left = ms;
    while (left > 0) { const d = Math.min(24, left); this.step(d); left -= d; }
  }

  render() {
    const t = this.t;
    for (const p of this.packets) {
      if (!p.el) {
        p.el = sv('circle', { r: 5.5, class: 'pk' }, this.gP);
        if (p.reply) { p.el.style.fill = 'var(--bench)'; p.el.style.stroke = p.color; p.el.setAttribute('r', '4.8'); }
        else { p.el.style.fill = p.color; p.el.style.stroke = 'var(--bench)'; }
      }
      let k = (t - p.t0) / p.dur; k = k < 0 ? 0 : k > 1 ? 1 : k;
      k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      p.el.setAttribute('cx', (p.g.x1 + (p.g.x2 - p.g.x1) * k).toFixed(1));
      p.el.setAttribute('cy', (p.g.y1 + (p.g.y2 - p.g.y1) * k).toFixed(1));
    }
    // dying packets
    this.dieEls.forEach(e => e.remove());
    this.dieEls = this.dies.map(d => {
      const a = (t - d.t0) / 500;
      const c = sv('circle', { cx: d.x, cy: d.y, r: (5.5 + a * 9).toFixed(1), fill: 'none', 'stroke-width': 2, opacity: (1 - a).toFixed(2) }, this.gF);
      c.style.stroke = 'var(--bad)';
      return c;
    });
    for (const n of Object.values(this.N)) {
      n.g!.classList.toggle('pulse', t < n.pulseUntil);
      n.g!.classList.toggle('off', n.disabled);
      if (n.flash) {
        const age = (t - n.flash.t) / 1300;
        if (age >= 1) { n.flash = null; n.flashEl!.setAttribute('opacity', '0'); }
        else {
          n.flashEl!.textContent = n.flash.text;
          n.flashEl!.setAttribute('class', 'flash ' + n.flash.cls);
          n.flashEl!.setAttribute('opacity', (1 - Math.pow(age, 3)).toFixed(2));
          n.flashEl!.setAttribute('y', (n.flashY! - age * 5).toFixed(1));
        }
      }
      if (n.kind === 'queue') {
        n.slotEls!.forEach((c, i) => {
          const p = n.buf![i];
          if (p) { c.setAttribute('class', ''); c.style.fill = p.color; c.style.stroke = 'none'; }
          else { c.setAttribute('class', 'slot-empty'); c.style.fill = ''; c.style.stroke = ''; }
        });
      }
      if (n.kind === 'log') {
        const start = Math.max(0, n.len! - (n.cells! - 1));
        for (let i = 0; i < n.cells!; i++) {
          const off = start + i;
          const ent = off < n.len! ? n.entries!.find(x => x.off === off) : null;
          const r = n.cellEls![i];
          if (ent) { r.setAttribute('class', 'cell'); r.style.fill = ent.color; n.cellTx![i].textContent = String(off); }
          else { r.setAttribute('class', 'cell empty'); r.style.fill = ''; n.cellTx![i].textContent = ''; }
        }
        n.readers!.forEach(r => {
          let idx = r.cursor - start; if (idx < 0) idx = 0;
          const x = -n.w / 2 + 6 + idx * 22 + 9.5;
          r.tri!.setAttribute('transform', `translate(${x},${r.y})`);
          const lag = n.len! - r.cursor;
          r.lab!.textContent = '';
          r.lab!.appendChild(document.createTextNode(r.name));
          if (lag > 1) { const ts = sv('tspan', { class: 'rlag' }, r.lab); ts.textContent = ` · ${lag} behind`; }
        });
      }
      if (n.kind === 'pool') {
        n.slotEls!.forEach((el, i) => {
          const s = n.slots![i];
          el.setAttribute('class', !s ? 'ps-none' : s.cold ? 'ps-cold' : s.busy ? 'ps-busy' : 'ps-idle');
        });
        n.blEl!.textContent = n.backlog!.length ? `+${n.backlog!.length} waiting` : '';
      }
    }
  }

  /* ---------- playground hooks ---------- */
  /** Centre and size of a node, in diagram units. */
  box(id: string) {
    const n = this.N[id];
    return n ? { x: n.x, y: n.y, w: n.w, h: n.h, kind: n.kind } : null;
  }
  /** Moves a node and the edges attached to it. Packets already in flight finish their old path. */
  moveNode(id: string, x: number, y: number) {
    const n = this.N[id];
    if (!n) return;
    n.x = x; n.y = y;
    n.g!.setAttribute('transform', `translate(${x},${y})`);
    for (const key of Object.keys(this.E)) {
      const [a, b] = key.split('>');
      if (a !== id && b !== id) continue;
      const g = this.E[key] = this.edgeGeom(a, b);
      const l = this.lines[key];
      if (l) { l.setAttribute('x1', String(g.x1)); l.setAttribute('y1', String(g.y1)); l.setAttribute('x2', String(g.x2)); l.setAttribute('y2', String(g.y2)); }
    }
  }
  /** Takes a node down (it drops everything sent to it) or brings it back. */
  setDown(id: string, down: boolean) {
    const n = this.N[id];
    if (!n || n.disabled === down) return;
    n.disabled = down;
    this.flash(n, down ? 'down' : 'back up', down ? 'bad' : 'ok');
  }
  isDown(id: string) { return !!this.N[id]?.disabled; }

  destroy() {
    this.dead = true;
    this.io.disconnect();
    this.svg.remove();
    SIMS.delete(this);
  }
}

/* ---------- one animation loop for every model on the page ---------- */
const SIMS = new Set<Sim>();
let looping = false;
let lastFrame = 0;

function startLoop() {
  if (looping) return;
  looping = true;
  lastFrame = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(60, now - lastFrame); lastFrame = now;
    if (!document.hidden) {
      for (const s of SIMS) {
        if (s.running && s.visible) { s.advance(dt * s.speed); s.render(); }
      }
    }
    if (SIMS.size) requestAnimationFrame(frame);
    else looping = false;
  };
  requestAnimationFrame(frame);
}
