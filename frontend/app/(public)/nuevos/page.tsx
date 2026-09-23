import type { Metadata } from 'next';
import { CatalogListing } from '@/components/catalog/catalog-listing';

export const metadata: Metadata = {
  title: 'Nuevos ingresos',
  description: 'Conocé los productos recientemente incorporados al catálogo BCM.',
  alternates: { canonical: '/nuevos' }
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogListing pathname="/nuevos" params={await searchParams} forced={{ newArrival: true }} title="Nuevos ingresos" description="Lo más nuevo que se incorporó al catálogo BCM." />;
}
