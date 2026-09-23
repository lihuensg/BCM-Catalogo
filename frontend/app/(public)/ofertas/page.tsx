import type { Metadata } from 'next';
import { CatalogListing } from '@/components/catalog/catalog-listing';

export const metadata: Metadata = {
  title: 'Ofertas',
  description: 'Productos publicados actualmente como oferta en el catálogo BCM.',
  alternates: { canonical: '/ofertas' }
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogListing pathname="/ofertas" params={await searchParams} forced={{ onSale: true }} title="Ofertas" description="Productos publicados actualmente como oferta por BCM." />;
}
