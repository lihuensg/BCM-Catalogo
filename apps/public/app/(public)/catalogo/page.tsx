import type { Metadata } from 'next';
import { CatalogListing } from '@/components/catalog/catalog-listing';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Explorá el catálogo BCM y filtrá productos por categoría, marca, precio y disponibilidad.',
  alternates: { canonical: '/catalogo' }
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogListing pathname="/catalogo" params={await searchParams} title="Todo el catálogo" description="Explorá productos y filtrá por categoría o marca." />;
}
