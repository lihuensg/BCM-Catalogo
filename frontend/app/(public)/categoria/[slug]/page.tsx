import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogListing } from '@/components/catalog/catalog-listing';
import { getCategories } from '@/services/public/client';

export async function generateStaticParams() {
  return (await getCategories()).filter(category => category.productCount > 0).map(category => ({ slug: category.slug }));
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategories()).find(item => item.slug === slug);
  if (!category) return { title: 'Categoría' };
  return {
    title: category.name,
    description: category.description ?? 'Explorá los productos publicados de ' + category.name + ' en BCM.',
    alternates: { canonical: '/categoria/' + slug }
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = (await getCategories()).find(item => item.slug === slug);
  if (!category) notFound();
  return <CatalogListing pathname={'/categoria/' + slug} params={await searchParams} forced={{ category: slug }} title={category.name} description={category.description ?? 'Explorá los productos disponibles en esta categoría.'} />;
}
