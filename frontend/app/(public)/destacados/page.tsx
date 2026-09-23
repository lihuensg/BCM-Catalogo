import type { Metadata } from 'next';
import { CatalogListing } from '@/components/catalog/catalog-listing';

export const metadata: Metadata = {
  title: 'Destacados',
  description: 'Selección de productos destacados del catálogo BCM.',
  alternates: { canonical: '/destacados' }
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogListing pathname="/destacados" params={await searchParams} forced={{ featured: true }} title="Destacados" description="La selección destacada de nuestro catálogo." />;
}
