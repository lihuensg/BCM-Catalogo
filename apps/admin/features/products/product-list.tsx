'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { PageResponse, ProductAdminListDto } from '@bcm/shared';
import { useResource } from '@/hooks/use-resource';
import { request } from '@/services/admin/client';
import { errorMessage } from '@/services/admin/errors';
import { PageHeader, Card, Badge, Toast } from '@/components/ui/surfaces';
import { Button } from '@/components/ui/button';
import { SearchInput, Select, FormField } from '@/components/ui/fields';
import { DataTable } from '@/components/ui/data-table';
import { Pagination, PageSize, Dropdown } from '@/components/ui/navigation';
import { Dialog } from '@/components/ui/dialog';
import { AsyncState } from '@/components/admin/async-state';
import { RemoteSelect } from '@/components/admin/remote-select';
import { MediaPreview } from '@/components/admin/media-editor';
import { availabilityLabels, saleLabels, priceLabel, productQuery } from './model';
export function ProductList() {
    const router = useRouter(), params = useSearchParams(), query = productQuery(new URLSearchParams(params.toString()));
    const state = useResource<PageResponse<ProductAdminListDto>>('/admin/products?' + query);
    const [target, setTarget] = useState<ProductAdminListDto | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
    const change = (key: string, value: string) => { const next = new URLSearchParams(query); if (value)
        next.set(key, value);
    else
        next.delete(key); if (key !== 'page')
        next.set('page', '1'); router.replace('/productos?' + next, { scroll: false }); };
    const select = (key: string, label: string, options: Record<string, string>) => <FormField label={label}><Select value={query.get(key) ?? ''} onChange={e => change(key, e.target.value)}><option value="">Todos</option>{Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></FormField>;
    return <><PageHeader title="Productos" description="Organizá, editá y publicá tu catálogo." actions={<Link className="button" href="/productos/nuevo">+ Nuevo producto</Link>}/><Toast message={message}/><Card><div className="list-toolbar"><SearchInput aria-label="Buscar productos" defaultValue={query.get('search') ?? ''} onKeyDown={e => { if (e.key === 'Enter')
        change('search', e.currentTarget.value); }} onBlur={e => { if (e.currentTarget.value !== (query.get('search') ?? ''))
        change('search', e.currentTarget.value); }} placeholder="Buscar por nombre, SKU o slug…"/><Dropdown label="Filtros"><div className="filter-grid"><RemoteSelect path="/admin/categories" label="Categoría" value={query.get('categoryId') ?? ''} onChange={id => change('categoryId', id)}/><RemoteSelect path="/admin/brands" label="Marca" value={query.get('brandId') ?? ''} onChange={id => change('brandId', id)}/>{select('active', 'Estado', { true: 'Activo', false: 'Inactivo' })}{select('availability', 'Disponibilidad', availabilityLabels)}{select('saleMode', 'Comercialización', saleLabels)}{[['onSale', 'Oferta'], ['featured', 'Destacado'], ['newArrival', 'Nuevo ingreso'], ['showPrice', 'Precio visible']].map(([key, label]) => <div key={key}>{select(key!, label!, { true: 'Sí', false: 'No' })}</div>)}</div><Button className="button-quiet" onClick={() => router.replace('/productos')}>Limpiar filtros</Button></Dropdown></div><div className="sort-toolbar">{select('sort', 'Ordenar por', { name: 'Nombre', createdAt: 'Creación', updatedAt: 'Actualización', publishedAt: 'Publicación', price: 'Precio', sortOrder: 'Orden manual' })}{select('order', 'Dirección', { asc: 'Ascendente', desc: 'Descendente' })}<PageSize value={Number(query.get('pageSize') ?? 20)} onChange={value => change('pageSize', String(value))}/></div><AsyncState {...state} retry={state.reload}/>{state.data && !state.loading && <>{state.data.data.length ? <DataTable caption="Listado de productos" rows={state.data.data} rowKey={r => r.id} columns={[
                    { label: 'Producto', render: r => <div className="product-cell"><MediaPreview url={r.thumbnail?.url} alt={r.thumbnail?.altText ?? r.name}/><div><Link className="text-link" href={'/productos/' + r.id + '/editar'}>{r.name}</Link><small>{r.sku ?? 'Sin SKU'}</small></div></div> },
                    { label: 'Categoría / marca', render: r => <div className="stacked-cell"><span>{r.categoryName}</span><small>{r.brandName ?? 'Sin marca'}</small></div> }, { label: 'Precio', render: r => <span className="amount admin-price">{priceLabel(r.price, r.showPrice)}</span> }, { label: 'Disponibilidad', render: r => <span className="admin-availability">{availabilityLabels[r.availability]}</span> },
                    { label: 'Etiquetas', render: r => <div className="badges">{r.featured && <Badge>Destacado</Badge>}{r.onSale && <Badge tone="warning">Oferta</Badge>}{r.newArrival && <Badge>Nuevo</Badge>}</div> }, { label: 'Estado', render: r => <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Activo' : 'Inactivo'}</Badge> }, { label: 'Actualizado', render: r => new Date(r.updatedAt).toLocaleDateString('es-AR') }, { label: 'Acciones', render: r => <div className="actions"><Link className="text-link" href={'/productos/' + r.id + '/editar'}>Editar</Link><Button className="button-quiet" disabled={!r.active} onClick={() => { setTarget(r); setError(''); }}>Desactivar</Button></div> }
                ]}/> : <div className="admin-empty"><h2>No encontramos productos</h2><p>Probá otros filtros o creá el primer producto.</p></div>}<Pagination {...state.data.meta} onPage={value => change('page', String(value))}/></>}</Card><Dialog open={!!target} title="Desactivar producto" onClose={() => { if (!busy)
        setTarget(null); }}><p>¿Desactivar {target?.name}? Se conservarán sus datos y podrás volver a publicarlo.</p>{error && <p role="alert" className="notice notice-error">{error}</p>}<div className="actions"><Button className="button-secondary" disabled={busy} onClick={() => setTarget(null)}>Cancelar</Button><Button disabled={busy} onClick={async () => { if (!target || busy)
        return; setBusy(true); try {
        await request('/admin/products/' + target.id, { method: 'DELETE' });
        setTarget(null);
        setMessage('Producto desactivado.');
        state.reload();
    }
    catch (e) {
        setError(errorMessage(e));
    }
    finally {
        setBusy(false);
    } }}>{busy ? 'Guardando…' : 'Desactivar'}</Button></div></Dialog></>;
}
