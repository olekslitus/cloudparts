'use client';

import { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

/* A scaled-down table: 128 pages of 4 rows, one reading every 2.8 minutes over a day. */
const PAGES = 128;
const PER_PAGE = 4;
const ROWS = PAGES * PER_PAGE;
const DAY = 24 * 60;
const TAIL = 112; // first page of the "not yet summarized" tail

const ORDERS = [
  { value: 'ordered', label: 'Time order' },
  { value: 'late', label: 'Late rows' },
  { value: 'shuffled', label: 'Shuffled' },
] as const;
type Order = (typeof ORDERS)[number]['value'];
const PPR = ['4', '8', '16'] as const;

/** Small seeded generator, so the server and the browser draw the same table. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Timestamps (minutes since midnight) in physical row order. */
function table(order: Order): number[] {
  const v = Array.from({ length: ROWS }, (_, i) => Math.floor((i * DAY) / ROWS));
  const r = rng(7);
  if (order === 'late') {
    // a few rows arrive hours after the time they record, like a sensor that reconnects
    for (let i = 0; i < ROWS; i++) if (r() < 0.03) v[i] = Math.max(0, v[i] - 180 - Math.floor(r() * 540));
  } else if (order === 'shuffled') {
    for (let i = ROWS - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [v[i], v[j]] = [v[j], v[i]];
    }
  }
  return v;
}

/** Like pg_stats.correlation: how closely physical order follows value order, from -1 to 1. */
function correlation(v: number[]) {
  const rank = new Array<number>(v.length);
  v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).forEach(([, i], r) => { rank[i] = r; });
  const n = v.length, m = (n - 1) / 2;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (i - m) * (rank[i] - m); sxx += (i - m) ** 2; }
  return sxy / sxx;
}

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/* SVG layout */
const W = 760, TOP = 24, BODY = 256, H = TOP + BODY + 26;
const PX = 64, PW = 196;            // page cells
const IX = 290, IW = W - IX - 12;   // index bars on a time axis
const tx = (min: number) => IX + (min / DAY) * IW;

export default function BrinModel() {
  const [order, setOrder] = useState<Order>('ordered');
  const [ppr, setPpr] = useState<(typeof PPR)[number]>('8');
  const [tail, setTail] = useState(false);
  const [q, setQ] = useState<[number, number]>([360, 480]);

  const values = useMemo(() => table(order), [order]);
  const corr = useMemo(() => correlation(values), [values]);

  const per = Number(ppr);
  const n = PAGES / per;
  const hit = (x: number) => x >= q[0] && x < q[1];
  const ranges = Array.from({ length: n }, (_, r) => {
    const first = r * per;
    const pages = Array.from({ length: per }, (_, k) => values.slice((first + k) * PER_PAGE, (first + k + 1) * PER_PAGE));
    const all = pages.flat();
    const min = Math.min(...all), max = Math.max(...all);
    const summarized = !(tail && first >= TAIL);
    const read = !summarized || (max >= q[0] && min < q[1]);
    return { r, first, pages, min, max, summarized, read };
  });

  const read = ranges.filter(x => x.read);
  const pagesRead = read.length * per;
  const rowsRead = pagesRead * PER_PAGE;
  const returned = read.reduce((s, x) => s + x.pages.flat().filter(hit).length, 0);
  const rowH = BODY / n;
  const cellW = PW / per;

  return (
    <figure className="overflow-hidden rounded-md border bg-card text-card-foreground">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-3 py-2">
        <span className="font-mono text-[11px] font-medium tracking-widest text-brand uppercase">Block-range model</span>
        <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={order} onValueChange={v => v && setOrder(v as Order)} aria-label="Row order">
          {ORDERS.map(o => <ToggleGroupItem key={o.value} value={o.value} className="px-2.5 text-xs">{o.label}</ToggleGroupItem>)}
        </ToggleGroup>
        <span className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground uppercase">Pages per range</span>
          <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={ppr} onValueChange={v => v && setPpr(v as typeof ppr)} aria-label="Pages per range">
            {PPR.map(p => <ToggleGroupItem key={p} value={p} className="font-mono text-xs">{p}</ToggleGroupItem>)}
          </ToggleGroup>
        </span>
        <span className="flex items-center gap-2">
          <Switch id="brin-tail" checked={tail} onCheckedChange={setTail} />
          <Label htmlFor="brin-tail" className="text-xs font-normal">New rows not yet summarized</Label>
        </span>
      </div>

      <div className="bench overflow-x-auto">
        <div className="min-w-[640px] md:min-w-0">
          <svg viewBox={`0 0 ${W} ${H}`} className="dia" role="img" aria-label={`A BRIN index over ${PAGES} pages in ${n} ranges. The query reads ${read.length} ranges, ${pagesRead} pages.`}>
            <defs>
              <pattern id="brin-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: 'var(--warn)', strokeWidth: 2 }} />
              </pattern>
            </defs>
            <text x={PX} y={14} style={{ fontSize: 10, fill: 'var(--edge)' }}>TABLE PAGES</text>
            <text x={IX} y={14} style={{ fontSize: 10, fill: 'var(--edge)' }}>BRIN INDEX: ONE MIN–MAX PER RANGE</text>

            {Array.from({ length: 9 }, (_, i) => i * 180).map(m => (
              <g key={m}>
                <line x1={tx(m)} x2={tx(m)} y1={TOP} y2={TOP + BODY} style={{ stroke: 'var(--grid)', strokeWidth: 1 }} />
                <text x={tx(m)} y={TOP + BODY + 16} textAnchor={m === 0 ? 'start' : m === DAY ? 'end' : 'middle'} style={{ fontSize: 10, fill: 'var(--edge)' }}>{hhmm(m)}</text>
              </g>
            ))}
            <rect x={tx(q[0])} y={TOP} width={Math.max(1, tx(q[1]) - tx(q[0]))} height={BODY} style={{ fill: 'var(--p1)', opacity: 0.14 }} />
            {q.map((m, i) => <line key={i} x1={tx(m)} x2={tx(m)} y1={TOP} y2={TOP + BODY} style={{ stroke: 'var(--p1)', strokeWidth: 1.2, strokeDasharray: '3 3' }} />)}

            {ranges.map(x => {
              const y = TOP + x.r * rowH;
              const bh = Math.min(10, rowH * 0.5);
              const by = y + (rowH - bh) / 2;
              return (
                <g key={x.r}>
                  <title>
                    {`Range ${x.r}, pages ${x.first}–${x.first + per - 1}: ${x.summarized ? `${hhmm(x.min)} to ${hhmm(x.max)}` : 'not summarized yet'}. ${x.read ? 'Read, every row rechecked.' : 'Skipped.'}`}
                  </title>
                  {x.read && <rect x={0} y={y} width={W} height={rowH} style={{ fill: 'var(--brand-soft)', opacity: 0.35 }} />}
                  {rowH >= 14 && (
                    <text x={PX - 8} y={y + rowH / 2 + 3.5} textAnchor="end" style={{ fontSize: 10, fill: x.read ? 'var(--foreground)' : 'var(--edge)' }}>
                      {x.first}–{x.first + per - 1}
                    </text>
                  )}
                  {x.pages.map((rows, k) => {
                    const match = x.read && rows.some(hit);
                    return (
                      <rect
                        key={k}
                        x={PX + k * cellW + 1} y={y + 1.5} width={cellW - 2} height={rowH - 3}
                        style={x.read
                          ? { fill: match ? 'var(--p1)' : 'var(--edge)', opacity: match ? 1 : 0.45 }
                          : { fill: 'none', stroke: 'var(--grid)', strokeWidth: 1 }}
                      />
                    );
                  })}
                  {x.summarized
                    ? <rect x={tx(x.min)} y={by} width={Math.max(2, tx(x.max) - tx(x.min))} height={bh} style={{ fill: x.read ? 'var(--box)' : 'var(--edge)', opacity: x.read ? 1 : 0.4 }} />
                    : <rect x={IX} y={by} width={IW} height={bh} style={{ fill: 'url(#brin-hatch)', stroke: 'var(--warn)', strokeWidth: 1 }} />}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="space-y-3 border-t px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <code className="shrink-0 font-mono text-[13px]">WHERE ts &gt;= &apos;{hhmm(q[0])}&apos; AND ts &lt; &apos;{hhmm(q[1])}&apos;</code>
          <Slider
            className="min-w-48 flex-1"
            min={0} max={DAY} step={15} minStepsBetweenThumbs={1}
            value={q} onValueChange={v => setQ([v[0], v[1]])}
            aria-label="Query time window"
          />
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[12px] sm:grid-cols-4">
          <Stat label="Ranges read" value={`${read.length} of ${n}`} />
          <Stat label="Pages read" value={`${pagesRead} of ${PAGES} (${Math.round((pagesRead / PAGES) * 100)}%)`} />
          <Stat label="Rows kept / thrown away" value={`${returned} / ${rowsRead - returned}`} />
          <Stat label="Correlation" value={corr.toFixed(2)} />
        </dl>
        <Legend />
      </div>

      <figcaption className="border-t px-4 py-3 text-[15px] leading-relaxed text-muted-foreground">
        <span className="mr-2 font-mono text-[11px] font-medium tracking-widest text-foreground uppercase">What you’re watching</span>
        A table of {ROWS} readings, one every few minutes over a day, on {PAGES} pages; real tables have far more pages, and PostgreSQL’s default range is 128 of them. Each row of the figure is one block range: its pages on the left and the one minimum–maximum the index keeps for it on the right. The query reads every range whose bar touches the shaded window and rechecks each row in it. Late rows stretch a range’s bar back in time, shuffling stretches every bar across the day, and a range that isn’t summarized yet is always read.
      </figcaption>
    </figure>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] tracking-widest text-muted-foreground uppercase">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Legend() {
  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground uppercase">
      <span className="inline-flex items-center gap-1.5">
        <svg width="12" height="12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" style={{ fill: 'var(--p1)' }} /></svg>
        page with matching rows
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="12" height="12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" style={{ fill: 'var(--edge)', opacity: 0.45 }} /></svg>
        read, nothing matched
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="12" height="12" aria-hidden="true"><rect x="1.5" y="1.5" width="9" height="9" style={{ fill: 'none', stroke: 'var(--edge)' }} /></svg>
        skipped
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="22" height="12" aria-hidden="true"><rect x="1" y="3" width="20" height="6" style={{ fill: 'var(--box)' }} /></svg>
        range summary
      </span>
    </span>
  );
}
