'use client';
import { useEffect, useState } from 'react';
import type { PageResponse, ProductAttributeDefinitionDto } from '@bcm/shared';
import { request } from '@/services/admin/client';
export function useDefinitions(categoryId: string) {
    const [state, setState] = useState<{
        categoryId: string;
        revision: number;
        data: ProductAttributeDefinitionDto[];
        loading: boolean;
        error?: unknown;
    }>({ categoryId: '', revision: 0, data: [], loading: false });
    const [revision, setRevision] = useState(0);
    useEffect(() => { const abort = new AbortController(); if (!categoryId)
        return; async function load() { let page = 1; const data: ProductAttributeDefinitionDto[] = []; while (true) {
        const r = await request<PageResponse<ProductAttributeDefinitionDto>>('/admin/categories/' + categoryId + '/product-attributes?pageSize=100&page=' + page, { signal: abort.signal });
        data.push(...r.data);
        if (page >= r.meta.totalPages)
            break;
        page++;
    } if (!abort.signal.aborted)
        setState({ categoryId, revision, data, loading: false }); } load().catch(error => { if (!abort.signal.aborted)
        setState({ categoryId, revision, data: [], loading: false, error }); }); return () => abort.abort(); }, [categoryId, revision]);
    return { ...state, data: categoryId && state.categoryId === categoryId ? state.data : [], error: state.categoryId === categoryId ? state.error : undefined, loading: !!categoryId && (state.categoryId !== categoryId || state.revision !== revision), reload: () => setRevision(n => n + 1) };
}
