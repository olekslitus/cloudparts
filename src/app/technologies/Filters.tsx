'use client';

// Filters the table by text, area and type, and keeps the filters in the URL so a filtered view can be shared.
import { useEffect } from 'react';

let ran = false; // once per page, however many times it's rendered

export default function Filters() {
  useEffect(() => {
    if (ran) return;
    ran = true;
    const box = document.querySelector<HTMLElement>('[data-filters]')!;
    const input = box.querySelector<HTMLInputElement>('[data-q]')!;
    const rows = [...document.querySelectorAll<HTMLTableRowElement>('tbody tr[data-text]')];
    const count = box.querySelector('[data-count]')!;
    const empty = document.querySelector<HTMLElement>('[data-empty]')!;
    const state = { q: '', part: '', type: '' };

    const press = (attr: 'part' | 'type') => {
      for (const b of box.querySelectorAll<HTMLButtonElement>(`button[data-${attr}]`)) {
        b.setAttribute('aria-pressed', String(b.dataset[attr] === state[attr]));
      }
    };
    const apply = () => {
      const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      let n = 0;
      for (const r of rows) {
        const show = (!state.part || r.dataset.part === state.part)
          && (!state.type || r.dataset.type === state.type)
          && words.every(w => r.dataset.text!.includes(w));
        r.hidden = !show;
        if (show) n++;
      }
      count.textContent = String(n);
      empty.hidden = n > 0;
      press('part');
      press('type');
      const url = new URL(location.href);
      for (const k of ['q', 'part', 'type'] as const) {
        if (state[k]) url.searchParams.set(k, state[k]); else url.searchParams.delete(k);
      }
      history.replaceState(null, '', url);
    };

    const params = new URLSearchParams(location.search);
    state.q = params.get('q') ?? '';
    state.part = params.get('part') ?? '';
    state.type = params.get('type') ?? '';
    input.value = state.q;
    input.addEventListener('input', () => { state.q = input.value; apply(); });
    for (const attr of ['part', 'type'] as const) {
      for (const b of box.querySelectorAll<HTMLButtonElement>(`button[data-${attr}]`)) {
        b.addEventListener('click', () => { state[attr] = b.dataset[attr]!; apply(); });
      }
    }
    apply();
  }, []);
  return null;
}
