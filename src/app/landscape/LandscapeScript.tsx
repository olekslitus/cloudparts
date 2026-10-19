'use client';

import { useEffect } from 'react';

let ran = false; // once per page, however many times it's rendered

export default function LandscapeScript() {
  useEffect(() => {
    if (ran) return;
    ran = true;
      // Filters the tiles by text and type, hides groups left empty, and keeps the filters in the URL.
      // On top of that: a picked architecture lights up its stack, and the year slider fades out what
      // didn't exist yet.
      const box = document.querySelector<HTMLElement>('[data-filters]')!;
      const map = document.querySelector<HTMLElement>('[data-map]')!;
      const input = box.querySelector<HTMLInputElement>('[data-q]')!;
      const archSelect = box.querySelector<HTMLSelectElement>('[data-arch]')!;
      const slider = box.querySelector<HTMLInputElement>('[data-year]')!;
      const play = box.querySelector<HTMLButtonElement>('[data-play]')!;
      const caption = document.querySelector<HTMLElement>('[data-caption]')!;
      const tiles = [...document.querySelectorAll<HTMLElement>('[data-tile]')];
      const count = box.querySelector('[data-count]')!;
      const empty = document.querySelector<HTMLElement>('[data-empty]')!;
      const data: {
        names: Record<string, string>;
        archs: Record<string, { title: string; path: string; techs: string[] }>;
      } = JSON.parse(document.querySelector('[data-landscape]')!.textContent!);
      const last = Number(slider.max);
      const state = { q: '', type: '', arch: '', year: last };
      let started = '';

      const esc = (s: string) => s.replace(/[&<>"]/g, ch => `&#${ch.charCodeAt(0)};`);
      /** "Trino, Spark and 4 more", as buttons that jump to each tile. */
      const names = (ids: string[], max: number) => {
        const shown = ids.slice(0, max).map(id =>
          `<button type="button" data-jump="${id}" class="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">${esc(data.names[id])}</button>`);
        const rest = ids.length - shown.length;
        return rest > 0 ? `${shown.join(', ')} and ${rest} more` : shown.length > 1 ? `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}` : shown[0];
      };
      const tileOf = (id: string) => tiles.find(t => t.dataset.id === id);

      // what's lit and what the caption says: the picked architecture, or else the year
      const highlight = () => {
        let lit: Set<string> | null = null;
        let says = '';
        if (state.arch) {
          const a = data.archs[state.arch];
          lit = new Set(a.techs);
          says = `<b class="font-medium">${esc(a.title)}</b> uses ${names(a.techs, 12)} · <a href="${a.path}" class="text-brand underline-offset-4 hover:underline">See it run →</a>`;
        }
        if (!says && started) says = `<b class="font-mono font-medium">${state.year}</b> · ${started}`;
        if (lit) map.dataset.dim = ''; else delete map.dataset.dim;
        for (const t of tiles) {
          t.toggleAttribute('data-lit', !!lit?.has(t.dataset.id!));
        }
        caption.innerHTML = says;
        caption.hidden = !says;
      };

      const apply = () => {
        const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
        let n = 0;
        let existed = 0;
        for (const t of tiles) {
          const show = (!state.type || t.dataset.type === state.type) && words.every(w => t.dataset.text!.includes(w));
          const future = Number(t.dataset.since) > state.year;
          t.hidden = !show;
          t.toggleAttribute('data-future', future);
          if (show) n++;
          if (show && !future) existed++;
        }
        for (const sel of ['[data-group]', '[data-topic]', '[data-area]']) {
          for (const el of document.querySelectorAll<HTMLElement>(sel)) el.hidden = !el.querySelector('[data-tile]:not([hidden])');
        }
        count.textContent = String(n);
        empty.hidden = n > 0;
        for (const b of box.querySelectorAll<HTMLButtonElement>('button[data-type]')) {
          b.setAttribute('aria-pressed', String(b.dataset.type === state.type));
        }
        archSelect.value = state.arch;
        slider.value = String(state.year);
        box.querySelector('[data-year-label]')!.textContent = String(state.year);
        started = state.year < last ? `${existed} of ${n} had started` : '';
        box.querySelector('[data-year-count]')!.textContent = started && `· ${started}`;
        highlight();
        const url = new URL(location.href);
        for (const k of ['q', 'type', 'arch'] as const) {
          if (state[k]) url.searchParams.set(k, state[k]); else url.searchParams.delete(k);
        }
        if (state.year < last) url.searchParams.set('year', String(state.year)); else url.searchParams.delete('year');
        history.replaceState(null, '', url);
      };

      const params = new URLSearchParams(location.search);
      state.q = params.get('q') ?? '';
      state.type = params.get('type') ?? '';
      state.arch = data.archs[params.get('arch') ?? ''] ? params.get('arch')! : '';
      const year = Number(params.get('year'));
      if (year >= Number(slider.min) && year < last) state.year = year;
      input.value = state.q;
      input.addEventListener('input', () => { state.q = input.value; apply(); });
      for (const b of box.querySelectorAll<HTMLButtonElement>('button[data-type]')) {
        b.addEventListener('click', () => { state.type = b.dataset.type!; apply(); });
      }
      archSelect.addEventListener('change', () => {
        state.arch = archSelect.value;
        apply();
        if (state.arch) tileOf(data.archs[state.arch].techs[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      caption.addEventListener('click', e => {
        const id = (e.target as HTMLElement).closest<HTMLElement>('[data-jump]')?.dataset.jump;
        if (id) tileOf(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      // the year slider, and a button that plays it from the first year to now, lingering on years when something new appeared
      const born = new Set(tiles.map(t => Number(t.dataset.since)));
      let timer: ReturnType<typeof setTimeout> | undefined;
      const stop = () => {
        clearTimeout(timer);
        timer = undefined;
        play.innerHTML = '<span aria-hidden="true">▶</span>';
        play.setAttribute('aria-label', 'Play the years');
      };
      const step = () => {
        state.year++;
        apply();
        if (state.year >= last) return stop();
        timer = setTimeout(step, born.has(state.year + 1) ? 300 : 60);
      };
      slider.addEventListener('input', () => { stop(); state.year = Number(slider.value); apply(); });
      play.addEventListener('click', () => {
        if (timer) return stop();
        if (state.year >= last) state.year = Number(slider.min);
        play.innerHTML = '<span aria-hidden="true">❚❚</span>';
        play.setAttribute('aria-label', 'Pause');
        apply();
        timer = setTimeout(step, 300);
      });
      apply();
  }, []);
  return null;
}
