'use client';

// Makes every table[data-sortable] on the page sortable: each heading is a button with a data-sort column
// index, and each cell carries its sort value in data-v.
import { useEffect } from 'react';

let ran = false; // once per page, however many times it's rendered

export default function SortableTable() {
  useEffect(() => {
    if (ran) return;
    ran = true;
    // Click a column heading to sort by it; click again to reverse.
    for (const table of document.querySelectorAll<HTMLTableElement>('table[data-sortable]')) {
      const body = table.tBodies[0];
      let col = -1;
      let dir = 1;
      for (const btn of table.querySelectorAll<HTMLButtonElement>('[data-sort]')) {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.sort);
          dir = i === col ? -dir : 1;
          col = i;
          const rows = [...body.rows].sort((a, b) => dir * (a.cells[i].dataset.v ?? '').localeCompare(b.cells[i].dataset.v ?? ''));
          body.append(...rows);
          for (const th of table.tHead!.rows[0].cells) {
            const on = th.contains(btn);
            th.setAttribute('aria-sort', on ? (dir > 0 ? 'ascending' : 'descending') : 'none');
            th.querySelector('[data-arrow]')!.textContent = on ? (dir > 0 ? ' ↑' : ' ↓') : '';
          }
        });
      }
    }
  }, []);
  return null;
}
