import { useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Diagram } from '@/content/schema';
import { Sim, type NodeLink } from '@/lib/sim/engine';
import { cn } from '@/lib/utils';

interface Props {
  diagram: Diagram;
  /** Node id → page it opens (see src/lib/links.ts). */
  links?: Record<string, NodeLink>;
  /** Node ids that stand for the page you're on. */
  highlight?: string[];
  /** Milliseconds to fast-forward before the first frame, so the model starts busy. */
  warmup?: number;
  /** Extra controls shown at the right of the toolbar, e.g. "Open in playground". */
  children?: React.ReactNode;
}

const SPEEDS = ['0.5', '1', '2'] as const;

export default function LiveModel({ diagram, links, highlight, warmup = 5200, children }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const sim = useRef<Sim | null>(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState('1');

  useEffect(() => {
    const s = new Sim(host.current!, diagram, {
      links,
      highlight,
      label: diagram.caption,
      onNav: href => { window.location.href = href; },
    });
    s.advance(warmup);
    s.render();
    sim.current = s;
    setRunning(s.running);
    return () => s.destroy();
  }, [diagram, links, highlight, warmup]);

  const toggle = () => {
    const s = sim.current;
    if (!s) return;
    s.running = !s.running;
    setRunning(s.running);
  };
  const changeSpeed = (v: string) => {
    const s = sim.current;
    if (!v || !s) return;
    setSpeed(v);
    s.speed = parseFloat(v);
    if (!s.running) { s.running = true; setRunning(true); }
  };

  const W = diagram.w || 760;
  const H = diagram.h || 260;

  return (
    <figure className="overflow-hidden rounded-md border bg-card text-card-foreground">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-3 py-2">
        <span className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-widest uppercase">
          <span className="relative flex size-2">
            {running && <span className="absolute inline-flex size-full animate-ping bg-brand opacity-60" />}
            <span className={cn('relative inline-flex size-2', running ? 'bg-brand' : 'bg-muted-foreground/40')} />
          </span>
          <span className={running ? 'text-brand' : undefined}>Live model</span>
        </span>
        <Legend />
        <div className="ml-auto flex items-center gap-2">
          {children}
          <Button variant="outline" size="sm" onClick={toggle} aria-pressed={!running} className="w-[5.5rem]">
            {running ? <PauseIcon /> : <PlayIcon />}
            {running ? 'Pause' : 'Play'}
          </Button>
          <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={speed} onValueChange={changeSpeed} aria-label="Speed">
            {SPEEDS.map(s => (
              <ToggleGroupItem key={s} value={s} aria-label={`${s}× speed`} className="font-mono text-xs">
                {s === '0.5' ? '½×' : `${s}×`}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      <div className="bench overflow-x-auto">
        <div
          ref={host}
          className={cn(diagram.wide ? 'min-w-[780px] md:min-w-0' : 'min-w-[640px] md:min-w-0')}
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>
      <figcaption className="border-t px-4 py-3 text-[15px] leading-relaxed text-muted-foreground">
        <span className="mr-2 font-mono text-[11px] font-medium tracking-widest text-foreground uppercase">What you’re watching</span>
        {diagram.caption}
      </figcaption>
    </figure>
  );
}

function Legend() {
  return (
    <span className="hidden flex-wrap gap-4 font-mono text-[11px] text-muted-foreground uppercase sm:flex">
      <span className="inline-flex items-center gap-1.5">
        <svg width="12" height="12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" style={{ fill: 'var(--p1)' }} /></svg>
        data or request
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="12" height="12" aria-hidden="true"><rect x="2" y="2" width="8" height="8" style={{ fill: 'none', stroke: 'var(--p1)', strokeWidth: 1.6 }} /></svg>
        response
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="22" height="12" aria-hidden="true">
          <rect x="1" y="1" width="9" height="9" style={{ fill: 'var(--box)' }} />
          <rect x="12.5" y="1.5" width="8" height="8" style={{ fill: 'none', stroke: 'var(--box)' }} />
        </svg>
        busy / idle instance
      </span>
    </span>
  );
}
