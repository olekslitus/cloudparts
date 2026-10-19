import Shell from '@/components/Shell';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';

export const metadata = meta('Not found');

export default function NotFound() {
  return (
    <Shell path="404/" section="not-found">
      <div className="py-20 text-center">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">This part isn’t in the catalog</h1>
        <p className="mt-3 text-muted-foreground">Try the search, or go back to the <a href={href()} className="underline underline-offset-4">system map</a>.</p>
      </div>
    </Shell>
  );
}
