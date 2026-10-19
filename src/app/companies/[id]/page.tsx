import MakerPage from '@/components/MakerPage';
import { getCatalog } from '@/lib/catalog';
import { meta } from '@/lib/meta';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().foundations.filter(f => f.type === 'company').map(f => ({ id: f.id }));
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const f = getCatalog().foundations.find(x => x.id === id)!;
  return meta(f.name, f.summary);
}

export default async function Company({ params }: Params) {
  const { id } = await params;
  return <MakerPage id={id} />;
}
