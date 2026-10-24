// What the compare tool (src/components/CompareTool.tsx) compares, written once as /compare.json at build time.
import { getCatalog } from '@/lib/catalog';
import { compareData } from '@/lib/compare';
import { logoOf } from '@/lib/glyphs';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(compareData(getCatalog(), logoOf));
}
