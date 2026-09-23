import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogListing } from '@/components/catalog/catalog-listing';
import { getBrands } from '@/services/public/client';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { slug } = await params;
  const brand = (await getBrands()).find(item => item.slug === slug);
  if (!brand) return { title: 'Marca' };
  return {
    title: brand.name,
    description: brand.description ?? 'Explorá los productos publicados de ' + brand.name + ' en BCM.',
    alternates: { canonical: '/marca/' + slug }
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const brand = (await getBrands()).find(item => item.slug === slug);
  if (!brand) notFound();
  return <CatalogListing pathname={'/marca/' + slug} params={await searchParams} forced={{ brand: slug }} title={brand.name} description={brand.description ?? 'Explorá los productos publicados de esta marca.'} />;
}
