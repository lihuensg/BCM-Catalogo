import type { Metadata } from 'next';
import { CatalogListing } from '@/components/catalog/catalog-listing';

export const metadata: Metadata = {
  title: 'Buscar productos',
  description: 'Buscá productos dentro del catálogo BCM.',
  robots: { index: false, follow: true }
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const raw = params.search;
  const term = Array.isArray(raw) ? raw[0] : raw;
  return <CatalogListing pathname="/buscar" params={params} title={term ? 'Resultados para “' + term + '”' : 'Buscar productos'} description="Buscá por nombre, marca o categoría." />;
}
