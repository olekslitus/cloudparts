'use client';

import { useEffect } from 'react';

let ran = false; // once per page, however many times it's rendered

export default function TimelineScript() {
  useEffect(() => {
    if (ran) return;
    ran = true;
    // Filters the events by text, area, kind and first appearances, hides years and decades left empty,
    // and keeps the filters in the URL so a filtered view can be shared.
    const box = document.querySelector<HTMLElement>('[data-filters]')!;
    const input = box.querySelector<HTMLInputElement>('[data-q]')!;
    const firsts = box.querySelector<HTMLInputElement>('[data-first]')!;
    const events = [...document.querySelectorAll<HTMLElement>('[data-event]')];
    const text = new Map(events.map(e => [e, e.textContent!.toLowerCase()]));
    const count = box.querySelector('[data-count]')!;
    const empty = document.querySelector<HTMLElement>('[data-empty]')!;
    const state = { q: '', part: '', kind: '', first: false };

    const press = (attr: 'part' | 'kind') => {
      for (const b of box.querySelectorAll<HTMLButtonElement>(`button[data-${attr}]`)) {
        b.setAttribute('aria-pressed', String(b.dataset[attr] === state[attr]));
      }
    };
    const apply = () => {
      const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      let n = 0;
      for (const e of events) {
        const show = (!state.part || e.dataset.part === state.part)
          && (!state.kind || e.dataset.kind === state.kind)
          && (!state.first || 'first' in e.dataset)
          && words.every(w => text.get(e)!.includes(w));
        e.hidden = !show;
        if (show) n++;
      }
      for (const sel of ['[data-year]', '[data-decade]']) {
        for (const el of document.querySelectorAll<HTMLElement>(sel)) el.hidden = !el.querySelector('[data-event]:not([hidden])');
      }
      // dim the jump links of decades with nothing left in them
      for (const a of box.querySelectorAll<HTMLElement>('[data-decade-link]')) {
        a.classList.toggle('opacity-40', !!document.getElementById(`d${a.dataset.decadeLink}`)?.hidden);
      }
      count.textContent = String(n);
      empty.hidden = n > 0;
      press('part');
      press('kind');
      firsts.checked = state.first;
      const url = new URL(location.href);
      for (const k of ['q', 'part', 'kind'] as const) {
        if (state[k]) url.searchParams.set(k, state[k]); else url.searchParams.delete(k);
      }
      if (state.first) url.searchParams.set('first', '1'); else url.searchParams.delete('first');
      history.replaceState(null, '', url);
    };

    const params = new URLSearchParams(location.search);
    state.q = params.get('q') ?? '';
    state.part = params.get('part') ?? '';
    state.kind = params.get('kind') ?? '';
    state.first = params.get('first') === '1';
    input.value = state.q;
    input.addEventListener('input', () => { state.q = input.value; apply(); });
    firsts.addEventListener('change', () => { state.first = firsts.checked; apply(); });
    for (const attr of ['part', 'kind'] as const) {
      for (const b of box.querySelectorAll<HTMLButtonElement>(`button[data-${attr}]`)) {
        b.addEventListener('click', () => { state[attr] = b.dataset[attr]!; apply(); });
      }
    }
    apply();
  }, []);
  return null;
}
