'use client';
import type { ApiSuccess, ProductAdminDetailDto } from '@bcm/shared';
import { useResource } from '@/hooks/use-resource';
import { AsyncState } from '@/components/admin/async-state';
import { ProductForm } from './product-form';
export function ProductEdit({ id }: {
    id: string;
}) { const state = useResource<ApiSuccess<ProductAdminDetailDto>>('/admin/products/' + id); return <><AsyncState {...state} retry={state.reload}/>{state.data && !state.loading && <ProductForm key={state.data.data.id} initial={state.data.data}/>}</>; }
