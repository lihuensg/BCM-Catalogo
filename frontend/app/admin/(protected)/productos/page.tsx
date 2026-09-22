import { Suspense } from 'react';
import { ProductList } from '@/features/products/product-list';
import { Skeleton } from '@/components/ui/surfaces';
export default function Page() { return <Suspense fallback={<Skeleton />}><ProductList /></Suspense>; }
