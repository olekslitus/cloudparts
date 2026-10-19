'use client';

// The "Show only" chips on the resources page: hides cards of other kinds, and sections left empty.
import { useEffect } from 'react';

let ran = false; // once per page, however many times it's rendered

export default function KindFilter() {
  useEffect(() => {
    if (ran) return;
    ran = true;
    const buttons = document.querySelectorAll<HTMLButtonElement>('[data-kind-filter]');
    buttons.forEach(b => b.addEventListener('click', () => {
      const kind = b.dataset.kindFilter;
      buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      document.querySelectorAll<HTMLElement>('[data-kind]').forEach(card => { card.hidden = !!kind && card.dataset.kind !== kind; });
      document.querySelectorAll<HTMLElement>('[data-group]').forEach(s => { s.hidden = !s.querySelector('[data-kind]:not([hidden])'); });
    }));
  }, []);
  return null;
}
