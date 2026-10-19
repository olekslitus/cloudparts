'use client';

// Shows the term card (TermCard.tsx) for whichever underlined term is hovered, focused or tapped.
import { useEffect } from 'react';

let ran = false; // once per page, however many times it's rendered

export default function TermCardScript() {
  useEffect(() => {
    if (ran) return;
    ran = true;
    const card = document.querySelector<HTMLElement>('[data-term-card]')!;
    const open = card.querySelector<HTMLAnchorElement>('[data-open]')!;
    let current: HTMLAnchorElement | null = null;
    let hideTimer = 0;

    const place = (term: HTMLElement) => {
      // under the word's first line, or above it when there's no room below
      const r = term.getClientRects()[0] ?? term.getBoundingClientRect();
      const w = card.offsetWidth, h = card.offsetHeight;
      const left = Math.min(Math.max(12, r.left), innerWidth - w - 12);
      const top = r.bottom + 8 + h > innerHeight && r.top - 8 - h > 0 ? r.top - 8 - h : r.bottom + 8;
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
    };
    const show = (term: HTMLAnchorElement) => {
      clearTimeout(hideTimer);
      current = term;
      card.querySelector('[data-kind]')!.textContent = term.dataset.termKind ?? '';
      card.querySelector('[data-name]')!.textContent = term.dataset.termName ?? '';
      card.querySelector('[data-tip]')!.textContent = term.dataset.termTip ?? '';
      open.href = term.href;
      card.hidden = false;
      place(term);
    };
    const hide = (now = false) => {
      clearTimeout(hideTimer);
      const go = () => { card.hidden = true; current = null; };
      if (now) go(); else hideTimer = window.setTimeout(go, 150);
    };

    for (const term of document.querySelectorAll<HTMLAnchorElement>('a.term[data-first]')) {
      term.addEventListener('mouseenter', () => show(term));
      term.addEventListener('mouseleave', () => hide());
      term.addEventListener('focus', () => show(term));
      term.addEventListener('blur', e => { if (!card.contains(e.relatedTarget as Node)) hide(); });
      // touch: the first tap explains, the second follows the link
      term.addEventListener('click', e => {
        if (matchMedia('(hover: none)').matches && current !== term) { e.preventDefault(); show(term); }
      });
    }
    card.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    card.addEventListener('mouseleave', () => hide());
    open.addEventListener('blur', () => hide());
    window.addEventListener('keydown', e => { if (e.key === 'Escape') hide(true); });
    window.addEventListener('scroll', () => hide(true), { passive: true });
    document.addEventListener('click', e => {
      if (!card.hidden && !card.contains(e.target as Node) && !(e.target as Element).closest?.('a.term[data-first]')) hide(true);
    });
  }, []);
  return null;
}
