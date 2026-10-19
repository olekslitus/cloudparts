'use client';

// Wires up every "Copy" button inside a [data-codebox] on the page.
import { useEffect } from 'react';

let ran = false; // once per page, however many times it's rendered

export default function CopyCode() {
  useEffect(() => {
    if (ran) return;
    ran = true;
    // Wires up every "Copy" button inside a [data-codebox] on the page.
    document.querySelectorAll<HTMLElement>('[data-codebox]').forEach(box => {
      const btn = box.querySelector<HTMLButtonElement>('[data-copy]')!;
      const pre = box.querySelector('pre')!;
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText);
          btn.textContent = 'Copied';
        } catch {
          const r = document.createRange();
          r.selectNodeContents(pre);
          getSelection()?.removeAllRanges();
          getSelection()?.addRange(r);
          btn.textContent = 'Selected: press ⌘C';
        }
        setTimeout(() => (btn.textContent = 'Copy'), 1600);
      });
    });
  }, []);
  return null;
}
