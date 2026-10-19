'use client';

import { useEffect, useRef, useState } from 'react';
import { MonitorIcon, MoonIcon, PaletteIcon, SunIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// The theme menu: light, dark or the system's choice, and an accent color, after Oxide's themes.
// The initial classes are set by an inline script in the layout, before first paint, from the same
// localStorage keys. There can be more than one menu on a page (sidebar and phone bar), so each one
// follows a "themechange" event.
type Mode = 'light' | 'dark' | 'auto';
export const ACCENTS = [
  { id: 'green', label: 'Green', swatch: 'var(--green-800)' },
  { id: 'blue', label: 'Blue', swatch: 'var(--blue-800)' },
  { id: 'purple', label: 'Purple', swatch: 'var(--purple-800)' },
  { id: 'yellow', label: 'Yellow', swatch: 'var(--yellow-800)' },
] as const;
type Accent = (typeof ACCENTS)[number]['id'];

const MODES: { id: Mode; label: string; Icon: typeof SunIcon }[] = [
  { id: 'light', label: 'Light', Icon: SunIcon },
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
  { id: 'auto', label: 'Auto', Icon: MonitorIcon },
];

function read(): { mode: Mode; accent: Accent } {
  let mode: Mode = 'auto', accent: Accent = 'green';
  try {
    const t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') mode = t;
    const a = localStorage.getItem('accent');
    if (ACCENTS.some(x => x.id === a)) accent = a as Accent;
  } catch {}
  return { mode, accent };
}

function apply(mode: Mode, accent: Accent) {
  const root = document.documentElement;
  const dark = mode === 'dark' || (mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', dark);
  ACCENTS.forEach(a => root.classList.toggle(`accent-${a.id}`, a.id === accent && a.id !== 'green'));
}

export default function ThemeToggle({ up = false }: { up?: boolean }) {
  const [state, setState] = useState<{ mode: Mode; accent: Accent }>({ mode: 'auto', accent: 'green' });
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setState(read());
    sync();
    document.addEventListener('themechange', sync);
    // In auto mode, follow the system when it switches
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const follow = () => { const s = read(); if (s.mode === 'auto') apply(s.mode, s.accent); };
    mq.addEventListener('change', follow);
    return () => { document.removeEventListener('themechange', sync); mq.removeEventListener('change', follow); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [open]);

  const set = (next: Partial<{ mode: Mode; accent: Accent }>) => {
    const s = { ...state, ...next };
    try {
      if (s.mode === 'auto') localStorage.removeItem('theme'); else localStorage.setItem('theme', s.mode);
      localStorage.setItem('accent', s.accent);
    } catch {}
    apply(s.mode, s.accent);
    setState(s);
    document.dispatchEvent(new Event('themechange'));
  };

  const label = 'mb-1.5 font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase';
  return (
    <div ref={box} className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(o => !o)} aria-label="Theme" aria-expanded={open} title="Theme">
        <PaletteIcon />
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="Theme"
          className={cn('absolute z-50 w-56 rounded-md border bg-popover p-3 text-popover-foreground shadow-lg', up ? 'bottom-full left-0 mb-2' : 'top-full right-0 mt-2')}
        >
          <p className={label}>Mode</p>
          <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Mode">
            {MODES.map(({ id, label: name, Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={state.mode === id}
                onClick={() => set({ mode: id })}
                className="flex flex-col items-center gap-1 rounded-sm border px-1 py-1.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase transition hover:text-foreground aria-checked:border-foreground/40 aria-checked:bg-foreground/10 aria-checked:text-foreground"
              >
                <Icon className="size-3.5" />{name}
              </button>
            ))}
          </div>
          <p className={cn(label, 'mt-3')}>Accent</p>
          <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Accent">
            {ACCENTS.map(a => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={state.accent === a.id}
                aria-label={a.label}
                title={a.label}
                onClick={() => set({ accent: a.id })}
                className="flex h-8 items-center justify-center rounded-sm border transition hover:border-foreground/40 aria-checked:border-foreground"
              >
                <span className="size-3.5" style={{ background: a.swatch }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
