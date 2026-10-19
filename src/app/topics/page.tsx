// The handbook's table of contents lives at /concepts/.
import { href } from '@/lib/nav';

export const metadata = { title: `Redirecting to: ${href('concepts/')}`, robots: { index: false } };

export default function Topics() {
  return (
    <>
      <meta httpEquiv="refresh" content={`2;url=${href('concepts/')}`} />
      <a href={href('concepts/')}>Redirecting from <code>{href('topics/')}</code> to <code>{href('concepts/')}</code></a>
    </>
  );
}
