'use client';

// The sidebar and search behaviour shared by every page (Shell.tsx): hiding the sidebar, the drawer on
// narrow screens, remembered folds, opening search from any [data-open-search], and revealing linked sections.
import { useEffect } from 'react';

let ran = false; // once per page, however many times it's rendered

export default function ShellScript() {
  useEffect(() => {
    if (ran) return;
    ran = true;
    // Hides or shows the sidebar on wide screens, remembered across pages.
    const setSidebar = (open: boolean) => {
      if (open) delete document.documentElement.dataset.sidebar; else document.documentElement.dataset.sidebar = 'closed';
      try { localStorage.setItem('sidebar', open ? 'open' : 'closed'); } catch {}
    };
    // On narrow screens the same button closes the drawer instead.
    document.querySelector('[data-sidebar-close]')?.addEventListener('click', () => {
      if (matchMedia('(min-width: 64rem)').matches) setSidebar(false); else drawer(false);
    });
    document.querySelector('[data-sidebar-open]')?.addEventListener('click', () => setSidebar(true));

    // Anything marked data-open-search opens the search dialog, with its value typed in.
    // The dialog loads when the browser is idle, so a very early click waits for it.
    const openSearch = (q: string) => {
      const send = () => document.dispatchEvent(new CustomEvent('open-search', { detail: q }));
      if (document.documentElement.dataset.search === 'ready') return send();
      let tries = 0;
      const wait = setInterval(() => {
        if (document.documentElement.dataset.search === 'ready' || ++tries > 40) {
          clearInterval(wait);
          send();
        }
      }, 50);
    };
    for (const b of document.querySelectorAll<HTMLElement>('[data-open-search]')) {
      b.addEventListener('click', () => openSearch(b.dataset.openSearch ?? ''));
    }

    // Opens and closes the sidebar drawer on narrow screens.
    const drawer = (open: boolean) => {
      if (open) document.documentElement.dataset.drawer = ''; else delete document.documentElement.dataset.drawer;
      document.querySelector('[data-drawer-open]')?.setAttribute('aria-expanded', String(open));
      if (open) document.querySelector<HTMLElement>('[data-sidebar-scroll] [aria-current="page"]')?.scrollIntoView({ block: 'center' });
    };
    document.querySelector('[data-drawer-open]')?.addEventListener('click', () => drawer(true));
    document.querySelector('[data-drawer-backdrop]')?.addEventListener('click', () => drawer(false));
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && 'drawer' in document.documentElement.dataset) drawer(false); });

    // Remembers which items in the sidebar you opened or folded, from page to page. The branch
    // holding the current page always opens.
    const KEY = 'nav-folds';
    const boxes = [...document.querySelectorAll<HTMLDetailsElement>('aside details[data-nav]')];
    let folds: Record<string, boolean> = {};
    try { folds = JSON.parse(sessionStorage.getItem(KEY) ?? '{}'); } catch {}
    const here = document.querySelector('[data-sidebar-scroll] [aria-current="page"]');
    for (const d of boxes) {
      const key = d.dataset.nav!;
      if (key in folds && !d.contains(here) ) d.open = folds[key];
      d.addEventListener('toggle', () => {
        folds[key] = d.open;
        try { sessionStorage.setItem(KEY, JSON.stringify(folds)); } catch {}
      });
    }
    here?.scrollIntoView({ block: 'nearest' });

    // Opens a collapsed section (history, sources) when a link points into it.
    const reveal = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = id && document.getElementById(id);
      if (!el) return;
      const box = el.closest('details') ?? (el instanceof HTMLDetailsElement ? el : null);
      if (box && !box.open) { box.open = true; el.scrollIntoView(); }
    };
    reveal();
    window.addEventListener('hashchange', reveal);
      }, []);
  return null;
}
