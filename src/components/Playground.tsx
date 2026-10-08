import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckIcon, CopyIcon, ExternalLinkIcon, LinkIcon, PauseIcon, PlayIcon, PlusIcon, PowerIcon, RotateCcwIcon, SearchIcon, Trash2Icon, TriangleAlertIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Diagram } from '@/content/schema';
import {
  CANVAS, checkDesign, decodeDesign, encodeDesign, fromDiagram, nodeFrom, structureKey, toDiagram, complete,
  type DNode, type Design, type PaletteItem,
} from '@/lib/playground/model';
import { Sim } from '@/lib/sim/engine';
import { cn } from '@/lib/utils';

export interface Template { id: string; title: string; diagram: Diagram }

interface Props {
  palette: PaletteItem[];
  templates: Template[];
  base: string;
}

type Box = { x: number; y: number; w: number; h: number; kind: string };
type Sel = { node: string } | { edge: [string, string] } | null;

const STORE = 'playground:design';
const BEHAVIOURS = [
  { value: 'fwd', label: 'Pass through', hint: 'Forwards everything to its outgoing links.' },
  { value: 'reply', label: 'Store and answer', hint: 'Answers requests after a delay; keeps plain data.' },
  { value: 'cache', label: 'Cache', hint: 'Answers some requests at once (hit), forwards the rest (miss).' },
  { value: 'gate', label: 'Gate', hint: 'Lets a share through and rejects the rest, like auth or rate limits.' },
  { value: 'sink', label: 'Absorb', hint: 'Takes everything and sends nothing on.' },
  { value: 'pool', label: 'Instances', hint: 'A pool of instances that scales up under load.' },
  { value: 'queue', label: 'Queue', hint: 'Buffers work and hands it out only when a consumer is free.' },
  { value: 'log', label: 'Stream', hint: 'An append-only log; every consumer reads at its own pace.' },
] as const;
type Behaviour = (typeof BEHAVIOURS)[number]['value'];

const behaviourOf = (n: DNode): Behaviour => (n.kind && n.kind !== 'svc' ? n.kind : n.mode ?? 'fwd') as Behaviour;

function withBehaviour(n: DNode, b: Behaviour): DNode {
  const { kind: _k, mode: _m, ...rest } = n;
  if (b === 'pool' || b === 'queue' || b === 'log') return complete({ ...rest, kind: b });
  return complete({ ...rest, ...(b === 'fwd' ? {} : { mode: b }) });
}

/** Anchor where an edge meets a node box, like the engine draws it. */
function anchor(b: Box, tx: number, ty: number, side?: 'in' | 'out') {
  if (b.kind === 'queue' || b.kind === 'log') return side === 'out' ? { x: b.x + b.w / 2, y: b.y } : { x: b.x - b.w / 2, y: b.y };
  const dx = tx - b.x, dy = ty - b.y;
  const s = Math.min(dx ? (b.w / 2 + 2) / Math.abs(dx) : Infinity, dy ? (b.h / 2 + 2) / Math.abs(dy) : Infinity);
  return { x: b.x + dx * s, y: b.y + dy * s };
}

function percentile(xs: number[], p: number) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
}

export default function Playground({ palette, templates, base }: Props) {
  const [design, setDesign] = useState<Design>({ nodes: [] });
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState<Sel>(null);
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState('1');
  const [query, setQuery] = useState('');
  const [link, setLink] = useState<'idle' | 'copied'>('idle');
  const [json, setJson] = useState<'idle' | 'copied'>('idle');
  const [template, setTemplate] = useState('');
  const [stats, setStats] = useState({ handled: 0, dropped: 0, p50: null as number | null, p95: null as number | null });
  const [connect, setConnectState] = useState<{ from: string; x: number; y: number } | null>(null);
  // handlers read the ref, so a fast gesture doesn't see stale state between renders
  const connectRef = useRef(connect);
  const setConnect = (c: typeof connect) => { connectRef.current = c; setConnectState(c); };
  const [hover, setHover] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const host = useRef<HTMLDivElement>(null);
  const overlay = useRef<SVGSVGElement>(null);
  const sim = useRef<Sim | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const designRef = useRef(design);
  designRef.current = design;

  const byId = useMemo(() => new Map(design.nodes.map(n => [n.id, n])), [design]);
  const itemByTech = useMemo(() => new Map(palette.filter(p => p.tech).map(p => [p.tech!, p])), [palette]);

  /* ---------- load: ?a=<architecture>, #d=<shared design>, saved design, or the first template ---------- */
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(location.search);
      const a = params.get('a');
      const shared = location.hash.startsWith('#d=') ? await decodeDesign(location.hash.slice(3)) : null;
      let d: Design | null = null;
      if (a) {
        const t = templates.find(x => x.id === a);
        if (t) { d = fromDiagram(t.diagram); setTemplate(t.id); }
      }
      if (!d && shared) d = shared;
      if (!d) {
        try { const saved = localStorage.getItem(STORE); if (saved) d = JSON.parse(saved) as Design; } catch { /* storage unavailable */ }
      }
      if (!d && templates[0]) { d = fromDiagram(templates[0].diagram); setTemplate(templates[0].id); }
      setDesign(d ?? { nodes: [] });
      setReady(true);
    })();
  }, [templates]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORE, JSON.stringify(design)); } catch { /* storage unavailable */ }
  }, [design, ready]);

  /* ---------- simulation: rebuilt when the structure changes, not when nodes move ---------- */
  const key = useMemo(() => structureKey(design), [design]);
  useEffect(() => {
    if (!ready || !host.current) return;
    const d = designRef.current;
    const s = new Sim(host.current, toDiagram(d), { label: 'Your design' });
    s.speed = parseFloat(speed);
    s.running = running;
    d.nodes.forEach(n => { if (n.down) s.setDown(n.id, true); });
    sim.current = s;
    setBoxes(Object.fromEntries(d.nodes.map(n => [n.id, s.box(n.id)!])));
    return () => s.destroy();
    // speed and running are applied directly in their handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, nonce]);

  useEffect(() => {
    let last = { done: 0, dropped: 0, t: 0 };
    const iv = setInterval(() => {
      const s = sim.current;
      if (!s) return;
      const dt = (s.t - last.t) / 1000;
      if (dt <= 0) return;
      setStats({
        handled: (s.stats.done - last.done) / dt,
        dropped: (s.stats.dropped - last.dropped) / dt,
        p50: percentile(s.stats.latencies, 50),
        p95: percentile(s.stats.latencies, 95),
      });
      last = { done: s.stats.done, dropped: s.stats.dropped, t: s.t };
    }, 1000);
    return () => clearInterval(iv);
  }, [key, nonce]);

  /* ---------- editing ---------- */
  const update = useCallback((id: string, f: (n: DNode) => DNode) => {
    setDesign(d => ({ nodes: d.nodes.map(n => (n.id === id ? f(n) : n)) }));
  }, []);

  const newId = (label: string) => {
    const stem = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'node';
    let id = stem, i = 2;
    while (designRef.current.nodes.some(n => n.id === id)) id = `${stem}-${i++}`;
    return id;
  };

  const addItem = (item: PaletteItem, at?: { x: number; y: number }) => {
    const count = designRef.current.nodes.length;
    const pos = at ?? { x: 160 + ((count * 180) % 900), y: 110 + ((Math.floor(count / 5) * 120) % 520) };
    const n = nodeFrom(item, newId(item.name), Math.round(pos.x), Math.round(pos.y));
    setDesign(d => ({ nodes: [...d.nodes, n] }));
    setSel({ node: n.id });
  };

  const removeSelected = useCallback(() => {
    setSel(s => {
      if (!s) return s;
      if ('node' in s) {
        setDesign(d => ({ nodes: d.nodes.filter(n => n.id !== s.node).map(n => ({ ...n, out: n.out.filter(t => t !== s.node) })) }));
      } else {
        const [a, b] = s.edge;
        setDesign(d => ({ nodes: d.nodes.map(n => (n.id === a ? { ...n, out: n.out.filter(t => t !== b) } : n)) }));
      }
      return null;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(input|textarea|select)$/i.test(e.target.tagName);
      if (typing) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected(); }
      if (e.key === 'Escape') { setSel(null); setConnect(null); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [removeSelected]);

  /* ---------- canvas pointer handling ---------- */
  const toCanvas = (e: { clientX: number; clientY: number }) => {
    const svg = overlay.current!;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: Math.max(20, Math.min(CANVAS.w - 20, pt.x)), y: Math.max(20, Math.min(CANVAS.h - 20, pt.y)) };
  };
  const nodeAt = (p: { x: number; y: number }) =>
    [...designRef.current.nodes].reverse().find(n => {
      const b = boxes[n.id];
      return b && Math.abs(p.x - n.x) <= b.w / 2 + 4 && Math.abs(p.y - n.y) <= b.h / 2 + 4;
    });

  const onNodeDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    overlay.current!.setPointerCapture(e.pointerId);
    const p = toCanvas(e);
    const n = designRef.current.nodes.find(x => x.id === id)!;
    drag.current = { id, dx: p.x - n.x, dy: p.y - n.y, moved: false };
    setSel({ node: id });
  };
  const onHandleDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    overlay.current!.setPointerCapture(e.pointerId);
    setConnect({ from: id, ...toCanvas(e) });
  };
  const onMove = (e: React.PointerEvent) => {
    const p = toCanvas(e);
    const c = connectRef.current;
    if (c) { setConnect({ ...c, ...p }); setHover(nodeAt(p)?.id ?? null); return; }
    const dr = drag.current;
    if (!dr) return;
    dr.moved = true;
    const x = Math.round(p.x - dr.dx), y = Math.round(p.y - dr.dy);
    sim.current?.moveNode(dr.id, x, y);
    setDesign(d => ({ nodes: d.nodes.map(n => (n.id === dr.id ? { ...n, x, y } : n)) }));
    setBoxes(bs => ({ ...bs, [dr.id]: { ...bs[dr.id], x, y } }));
  };
  const onUp = (e: React.PointerEvent) => {
    const c = connectRef.current;
    if (c) {
      const target = nodeAt(toCanvas(e));
      if (target && target.id !== c.from) {
        const from = c.from;
        setDesign(d => ({ nodes: d.nodes.map(n => (n.id === from && !n.out.includes(target.id) ? { ...n, out: [...n.out, target.id] } : n)) }));
        setSel({ edge: [from, target.id] });
      }
      setConnect(null);
      setHover(null);
    }
    drag.current = null;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const key = e.dataTransfer.getData('text/plain');
    const item = palette.find(p => p.key === key);
    if (item) addItem(item, toCanvas(e));
  };

  /* ---------- toolbar actions ---------- */
  const loadTemplate = (id: string) => {
    setTemplate(id);
    if (id === 'blank') { setDesign({ nodes: [] }); setSel(null); return; }
    const t = templates.find(x => x.id === id);
    if (t) { setDesign(fromDiagram(t.diagram)); setSel(null); }
  };
  const share = async () => {
    const code = await encodeDesign(design);
    const url = `${location.origin}${location.pathname}#d=${code}`;
    history.replaceState(null, '', `#d=${code}`);
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard blocked; the URL is in the address bar */ }
    setLink('copied');
    setTimeout(() => setLink('idle'), 1800);
  };
  const copyJson = async () => {
    const d = toDiagram(design, 'Describe what the viewer is watching.');
    try { await navigator.clipboard.writeText(JSON.stringify(d, null, 2)); } catch { /* clipboard blocked */ }
    setJson('copied');
    setTimeout(() => setJson('idle'), 1800);
  };
  const toggleRun = () => {
    const s = sim.current;
    if (!s) return;
    s.running = !s.running;
    setRunning(s.running);
  };
  const changeSpeed = (v: string) => {
    if (!v) return;
    setSpeed(v);
    if (sim.current) sim.current.speed = parseFloat(v);
  };
  const restart = () => setNonce(x => x + 1);

  const notes = useMemo(() => checkDesign(design), [design]);
  const selected = sel && 'node' in sel ? byId.get(sel.node) : undefined;
  const selEdge = sel && 'edge' in sel ? sel.edge : undefined;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (p: PaletteItem) => !q || `${p.name} ${p.sub} ${p.terms}`.toLowerCase().includes(q);
    const out = new Map<string, PaletteItem[]>();
    for (const p of palette) if (match(p)) out.set(p.group, [...(out.get(p.group) ?? []), p]);
    return [...out];
  }, [palette, query]);

  return (
    <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_300px]">
      {/* palette */}
      <aside className="order-2 flex max-h-[360px] flex-col rounded-xl xl:order-none bg-card ring-1 ring-foreground/10 xl:sticky xl:top-20 xl:max-h-[calc(100vh-7rem)]" aria-label="Parts you can add">
        <div className="border-b p-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find Kafka, cache…" className="h-8 pl-8" aria-label="Filter parts" />
          </div>
          <p className="mt-2 px-1 text-xs text-muted-foreground">Drag onto the canvas, or click to add.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {groups.map(([group, items]) => (
            <div key={group} className="mb-3">
              <div className="px-1 pb-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{group}</div>
              {items.map(p => (
                <button
                  key={p.key}
                  type="button"
                  draggable
                  onDragStart={e => { e.dataTransfer.setData('text/plain', p.key); e.dataTransfer.effectAllowed = 'copy'; }}
                  onClick={() => addItem(p)}
                  className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">{p.sub}</span>
                  </span>
                  <PlusIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          ))}
          {!groups.length && <p className="p-2 text-sm text-muted-foreground">Nothing matches.</p>}
        </div>
      </aside>

      {/* canvas */}
      <div className="order-1 min-w-0 xl:order-none">
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
            <Select value={template} onValueChange={loadTemplate}>
              <SelectTrigger size="sm" className="w-64 max-w-full" aria-label="Start from">
                <SelectValue placeholder="Start from…" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="blank">Blank canvas</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Architectures</SelectLabel>
                  {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={toggleRun} className="w-[5.5rem]" aria-pressed={!running}>
              {running ? <PauseIcon /> : <PlayIcon />}{running ? 'Pause' : 'Run'}
            </Button>
            <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={speed} onValueChange={changeSpeed} aria-label="Speed">
              {['0.5', '1', '2', '4'].map(s => (
                <ToggleGroupItem key={s} value={s} className="font-mono text-xs" aria-label={`${s}× speed`}>{s === '0.5' ? '½×' : `${s}×`}</ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button variant="ghost" size="sm" onClick={restart} title="Restart the simulation"><RotateCcwIcon />Restart</Button>
            <div className="ml-auto flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={copyJson} title="Copy as diagram JSON, ready for a content file">
                {json === 'copied' ? <CheckIcon /> : <CopyIcon />}JSON
              </Button>
              <Button size="sm" onClick={share}>{link === 'copied' ? <CheckIcon /> : <LinkIcon />}{link === 'copied' ? 'Link copied' : 'Share'}</Button>
            </div>
          </div>

          <div className="bench overflow-x-auto" onDragOver={e => e.preventDefault()} onDrop={onDrop}>
            <div className="relative min-w-[880px]" style={{ aspectRatio: `${CANVAS.w} / ${CANVAS.h}` }}>
              <div ref={host} className="absolute inset-0 [&_svg]:h-full" />
              <svg
                ref={overlay}
                viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`}
                className="absolute inset-0 h-full w-full touch-none select-none"
                onPointerDown={() => setSel(null)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                role="application"
                aria-label="Design canvas"
              >
                {/* edge hit areas and selection */}
                {design.nodes.flatMap(n => n.out.map(t => {
                  const a = boxes[n.id], b = boxes[t];
                  if (!a || !b) return null;
                  const p1 = anchor(a, b.x, b.y, 'out'), p2 = anchor(b, p1.x, p1.y, 'in');
                  const on = selEdge && selEdge[0] === n.id && selEdge[1] === t;
                  return (
                    <g key={`${n.id}>${t}`}>
                      {on && <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--brand)" strokeWidth={3} />}
                      <line
                        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                        stroke="transparent" strokeWidth={14} className="cursor-pointer"
                        onPointerDown={e => { e.stopPropagation(); setSel({ edge: [n.id, t] }); }}
                      />
                    </g>
                  );
                }))}
                {/* nodes */}
                {design.nodes.map(n => {
                  const b = boxes[n.id];
                  if (!b) return null;
                  const on = selected?.id === n.id;
                  const target = connect && hover === n.id && connect.from !== n.id;
                  return (
                    <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                      <rect
                        x={-b.w / 2 - 5} y={-b.h / 2 - 5} width={b.w + 10} height={b.h + 10} rx={9}
                        fill="transparent"
                        stroke={on || target ? 'var(--brand)' : 'transparent'}
                        strokeWidth={2} strokeDasharray={target ? '5 4' : undefined}
                        className="cursor-grab active:cursor-grabbing"
                        onPointerDown={e => onNodeDown(e, n.id)}
                      />
                      <g className="cursor-crosshair" onPointerDown={e => onHandleDown(e, n.id)}>
                        <circle cx={b.w / 2 + 5} cy={0} r={11} fill="transparent" />
                        <circle cx={b.w / 2 + 5} cy={0} r={5} fill="var(--card)" stroke="var(--brand)" strokeWidth={1.6} opacity={on ? 1 : 0.55} />
                      </g>
                    </g>
                  );
                })}
                {connect && boxes[connect.from] && (
                  <line
                    x1={boxes[connect.from].x + boxes[connect.from].w / 2 + 5} y1={boxes[connect.from].y}
                    x2={connect.x} y2={connect.y}
                    stroke="var(--brand)" strokeWidth={1.8} strokeDasharray="6 4" pointerEvents="none"
                  />
                )}
                {ready && !design.nodes.length && (
                  <text x={CANVAS.w / 2} y={CANVAS.h / 2} textAnchor="middle" className="fill-muted-foreground text-[15px]">
                    Drag a source like Users onto the canvas, then add the parts it talks to.
                  </text>
                )}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t text-sm sm:grid-cols-4">
            <Stat label="Handled" value={`${stats.handled.toFixed(1)}/s`} />
            <Stat label="Dropped" value={`${stats.dropped.toFixed(1)}/s`} bad={stats.dropped > 0.05} />
            <Stat label="Median round trip" value={stats.p50 === null ? '–' : `${stats.p50} ms`} />
            <Stat label="95th percentile" value={stats.p95 === null ? '–' : `${stats.p95} ms`} />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Drag boxes to move them. Drag from the round handle on a box’s right edge to another box to connect them. Select a box or link and press Delete to remove it.
          Times are simulated, not real benchmarks.
        </p>
      </div>

      {/* inspector */}
      <aside className="order-3 space-y-4 xl:order-none xl:sticky xl:top-20 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto" aria-label="Selected part">
        {selected ? (
          <NodeInspector
            key={selected.id}
            node={selected}
            base={base}
            item={selected.tech ? itemByTech.get(selected.tech) : undefined}
            names={byId}
            onChange={f => update(selected.id, f)}
            onDown={down => { update(selected.id, n => ({ ...n, down })); sim.current?.setDown(selected.id, down); }}
            onDelete={removeSelected}
          />
        ) : selEdge ? (
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Link</div>
            <p className="mt-1 font-medium">{byId.get(selEdge[0])?.label} → {byId.get(selEdge[1])?.label}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={removeSelected}><Trash2Icon />Remove link</Button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Select a box to change how it behaves: traffic, capacity, cache hit rate, or take it down to see what breaks.
          </div>
        )}

        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Design check</div>
          {notes.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {notes.map(n => (
                <li key={n} className="flex gap-2 leading-snug">
                  <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0 text-(--warn)" />{n}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-sm"><CheckIcon className="size-4 text-(--ok)" />Everything is connected.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="border-r px-4 py-2.5 last:border-r-0">
      <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{label}</div>
      <div className={cn('font-mono text-base font-semibold tabular-nums', bad && 'text-(--bad)')}>{value}</div>
    </div>
  );
}

interface InspectorProps {
  node: DNode;
  base: string;
  item?: PaletteItem;
  names: Map<string, DNode>;
  onChange: (f: (n: DNode) => DNode) => void;
  onDown: (down: boolean) => void;
  onDelete: () => void;
}

function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        {value && <span className="font-mono text-xs text-muted-foreground tabular-nums">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function NumberSlider({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <Field label={label} value={`${value}${unit}`}>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={v => onChange(v[0])} aria-label={label} />
    </Field>
  );
}

function NodeInspector({ node: n, base, item, names, onChange, onDown, onDelete }: InspectorProps) {
  const b = behaviourOf(n);
  const set = (patch: Partial<DNode>) => onChange(x => ({ ...x, ...patch }));
  const emit = n.emit;
  const rate = emit?.every ? Math.round((1000 / emit.every) * 10) / 10 : 2;
  const bursty = !!emit?.phases;
  const setTraffic = (on: boolean) => set({ emit: on ? { every: 500, jitter: 0.3, req: true } : undefined });
  const page = n.tech ? `technologies/${n.tech}/` : n.concept ? `concepts/${n.concept}/` : null;

  return (
    <div className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div>
        <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{item ? item.sub : 'Box'}</div>
        <div className="mt-0.5 flex items-start justify-between gap-2">
          <span className="text-lg font-semibold">{n.label}</span>
          {page && (
            <a href={base + page} target="_blank" rel="noopener" className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Learn <ExternalLinkIcon className="size-3" />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Name"><Input value={n.label} onChange={e => set({ label: e.target.value || ' ' })} className="h-8" /></Field>
        <Field label="Second line"><Input value={n.sub ?? ''} onChange={e => set({ sub: e.target.value || undefined })} className="h-8" /></Field>
      </div>

      <Field label="Behaves as">
        <Select value={b} onValueChange={v => onChange(x => withBehaviour(x, v as Behaviour))}>
          <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {BEHAVIOURS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{BEHAVIOURS.find(o => o.value === b)?.hint}</p>
      </Field>

      {b === 'reply' && <NumberSlider label="Response time" value={n.delay ?? 100} min={0} max={1500} step={10} unit=" ms" onChange={v => set({ delay: v })} />}
      {b === 'cache' && <NumberSlider label="Hit rate" value={Math.round((n.p ?? 0.8) * 100)} min={0} max={100} unit="%" onChange={v => set({ p: v / 100 })} />}
      {b === 'gate' && <NumberSlider label="Allowed" value={Math.round((n.p ?? 0.8) * 100)} min={0} max={100} unit="%" onChange={v => set({ p: v / 100 })} />}
      {b === 'pool' && (
        <>
          <NumberSlider label="Always-on instances" value={n.min ?? 0} min={0} max={n.max ?? 4} onChange={v => set({ min: v })} />
          <NumberSlider label="Maximum instances" value={n.max ?? 4} min={1} max={12} onChange={v => set({ max: v, min: Math.min(n.min ?? 0, v) })} />
          <NumberSlider label="Time per job" value={n.work ?? 500} min={50} max={3000} step={50} unit=" ms" onChange={v => set({ work: v })} />
          <NumberSlider label="Cold start" value={n.cold ?? 0} min={0} max={3000} step={25} unit=" ms" onChange={v => set({ cold: v })} />
        </>
      )}
      {b === 'queue' && (
        <>
          <NumberSlider label="Capacity" value={n.cap ?? 6} min={1} max={14} onChange={v => set({ cap: v })} />
          <NumberSlider label="Gap between releases" value={n.gap ?? 150} min={0} max={1500} step={25} unit=" ms" onChange={v => set({ gap: v })} />
        </>
      )}
      {b === 'log' && (
        <>
          <NumberSlider label="Visible entries" value={n.cells ?? 10} min={4} max={16} onChange={v => set({ cells: v })} />
          <NumberSlider label="Each consumer reads every" value={n.readEvery ?? 600} min={100} max={3000} step={50} unit=" ms" onChange={v => set({ readEvery: v, reads: undefined })} />
        </>
      )}
      {n.out.length > 1 && b !== 'log' && (
        <Field label="Sends to">
          <Select value={n.route ?? 'rr'} onValueChange={v => set({ route: v as DNode['route'] })}>
            <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rr">One at a time (round robin)</SelectItem>
              <SelectItem value="fanout">All of them (fan out)</SelectItem>
              <SelectItem value="hash">One, picked by key</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{n.out.map(id => names.get(id)?.label).join(', ')}</p>
        </Field>
      )}

      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="traffic" className="text-sm">Generates traffic</Label>
          <Switch id="traffic" checked={!!emit} onCheckedChange={setTraffic} />
        </div>
        {emit && (
          <>
            {!bursty && <NumberSlider label="Rate" value={rate} min={0.2} max={12} step={0.2} unit="/s" onChange={v => set({ emit: { ...emit, every: Math.round(1000 / v) } })} />}
            <Field label="Pattern">
              <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={bursty ? 'burst' : 'steady'} className="w-full"
                onValueChange={v => v && set({ emit: v === 'burst'
                  ? { ...emit, phases: [[3000, 900], [2500, 110], [3000, 900]] }
                  : { ...emit, phases: undefined, every: emit.every ?? 500 } })}>
                <ToggleGroupItem value="steady" className="flex-1 text-xs">Steady</ToggleGroupItem>
                <ToggleGroupItem value="burst" className="flex-1 text-xs">Bursts</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="req" className="text-sm font-normal">Requests wait for an answer</Label>
              <Switch id="req" checked={!!emit.req} onCheckedChange={v => set({ emit: { ...emit, req: v } })} />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button variant={n.down ? 'default' : 'outline'} size="sm" onClick={() => onDown(!n.down)}>
          <PowerIcon />{n.down ? 'Bring back up' : 'Take down'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-(--bad)"><Trash2Icon />Delete</Button>
      </div>
    </div>
  );
}
