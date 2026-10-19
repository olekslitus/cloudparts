'use client';

// The list/table toggle of every technology listing on the page (TechListing.tsx), remembered across pages.
import { useEffect } from 'react';

let ran = false; // once per page, however many times it's rendered

export default function TechListingScript() {
  useEffect(() => {
    if (ran) return;
    ran = true;
    // List or table view, remembered across pages.
    const KEY = 'tech-view';
    for (const box of document.querySelectorAll<HTMLElement>('[data-listing]')) {
      const buttons = [...box.querySelectorAll<HTMLButtonElement>('[data-view]')];
      const show = (view: string) => {
        for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.view === view));
        for (const pane of box.querySelectorAll<HTMLElement>('[data-pane]')) pane.hidden = pane.dataset.pane !== view;
      };
      let saved: string | null = null;
      try { saved = localStorage.getItem(KEY); } catch {}
      if (saved === 'table' && buttons.length) show('table');
      for (const b of buttons) {
        b.addEventListener('click', () => {
          show(b.dataset.view!);
          try { localStorage.setItem(KEY, b.dataset.view!); } catch {}
        });
      }
    }
  }, []);
  return null;
}
