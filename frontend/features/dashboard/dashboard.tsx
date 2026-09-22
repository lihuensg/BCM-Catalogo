'use client';
import Link from 'next/link';
import type { ApiSuccess, DashboardDto, DashboardProduct } from '@bcm/shared';
import { useResource } from '@/hooks/use-resource';
import { Card, PageHeader, Badge } from '@/components/ui/surfaces';
import { AsyncState } from '@/components/admin/async-state';
export function Dashboard() {
    const state = useResource<ApiSuccess<DashboardDto>>('/admin/dashboard');
    const data = state.data?.data;
    const labels: Record<keyof DashboardDto['counts'], string> = { total: 'Productos', active: 'Activos', outOfStock: 'Sin stock', madeToOrder: 'Por encargo', onSale: 'En oferta', featured: 'Destacados', categories: 'Categorías', brands: 'Marcas' };
    const block = (title: string, rows: DashboardProduct[]) => <Card title={title}><ul className="record-list">{rows.map(row => <li key={row.id}><Link href={'/admin/productos/' + row.id + '/editar'}>{row.name}</Link><Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Activo' : 'Inactivo'}</Badge></li>)}</ul>{!rows.length && <p className="muted">No hay productos en este grupo.</p>}</Card>;
    return <><PageHeader title="Dashboard" description="Una vista clara del estado de tu catálogo." actions={<Link className="button" href="/admin/productos/nuevo">+ Nuevo producto</Link>}/><AsyncState {...state} retry={state.reload}/>{data && <><div className="kpi-grid">{Object.entries(labels).map(([key, label]) => <Card key={key}><span className="muted">{label}</span><strong className="kpi-value">{data.counts[key as keyof typeof labels].toLocaleString('es-AR')}</strong></Card>)}</div><div className="dashboard-grid">{block('Actualizados recientemente', data.recent)}{block('Sin imagen', data.withoutImage)}{block('Sin precio visible', data.withoutVisiblePrice)}{block('Desactivados', data.inactive)}</div><p className="muted">Cada bloque muestra hasta 5 productos. Los indicadores incluyen todo el catálogo.</p></>}</>;
}
