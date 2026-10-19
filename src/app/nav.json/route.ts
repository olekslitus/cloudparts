// What the search dialog searches (src/components/Search.tsx), written once as /nav.json at build time
// instead of into every page.
import { getCatalog } from '@/lib/catalog';
import { logoOf } from '@/lib/glyphs';
import { navData } from '@/lib/nav';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(navData(getCatalog(), logoOf));
}
