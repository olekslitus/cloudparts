import '@/styles/global.css';
import { href } from '@/lib/nav';
import { meta } from '@/lib/meta';

export const metadata = { ...meta(), icons: { icon: { url: href('favicon.svg'), type: 'image/svg+xml' } } };
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// The theme, accent and sidebar choice, set on <html> before first paint so nothing flashes.
const prefs = `try {
  const t = localStorage.getItem('theme');
  if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
  const a = localStorage.getItem('accent');
  if (a === 'blue' || a === 'purple' || a === 'yellow') document.documentElement.classList.add('accent-' + a);
  if (localStorage.getItem('sidebar') === 'closed') document.documentElement.dataset.sidebar = 'closed';
} catch {}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefs }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
