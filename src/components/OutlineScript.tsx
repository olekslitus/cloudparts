'use client';

// Highlights the section being read in the page outline (Outline.tsx).
import { useEffect } from 'react';

let ran = false; // once per page, however many times it's rendered

export default function OutlineScript() {
  useEffect(() => {
    if (ran) return;
    ran = true;
    // Marks the section you're reading: the last one whose top has scrolled past the header.
    const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-outline]')];
    if (links.length) {
      const targets = links.map(a => document.getElementById(a.dataset.outline!)).filter((x): x is HTMLElement => !!x);
      const mark = () => {
        let current = targets[0]?.id;
        for (const t of targets) if (t.getBoundingClientRect().top < 120) current = t.id;
        for (const a of links) {
          const on = a.dataset.outline === current;
          a.classList.toggle('text-foreground', on);
          a.classList.toggle('font-medium', on);
          if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        }
        for (const d of document.querySelectorAll<HTMLElement>('[data-dash]')) {
          const on = d.dataset.dash === current;
          d.classList.toggle('bg-foreground/70', on);
          d.classList.toggle('w-5', on);
          d.classList.toggle('bg-foreground/20', !on);
        }
      };
      mark();
      window.addEventListener('scroll', mark, { passive: true });
    }
  }, []);
  return null;
}
