'use client';
import { useState } from 'react';
import type { PageResponse } from '@bcm/shared';
import { useResource } from '@/hooks/use-resource';
import { request } from '@/services/admin/client';
import { errorMessage } from '@/services/admin/errors';
import { Card, PageHeader, Badge, Toast } from '@/components/ui/surfaces';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/fields';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/navigation';
import { Dialog } from '@/components/ui/dialog';
import { AsyncState } from '@/components/admin/async-state';
import type { ResourceConfig } from './config';
import { ResourceForm } from './resource-form';
export function ResourceManager({ config, onExtra, compact = false }: {
    config: ResourceConfig;
    onExtra?: ((row: Record<string, unknown>) => void) | undefined;
    compact?: boolean;
}) {
    const [search, setSearch] = useState(''), [page, setPage] = useState(1), [editing, setEditing] = useState<Record<string, unknown> | null | undefined>(undefined), [removing, setRemoving] = useState<Record<string, unknown> | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
    const state = useResource<PageResponse<Record<string, unknown>>>(config.path + '?' + new URLSearchParams({ page: String(page), pageSize: '20', search }));
    const association = config.path.includes('/categories/') && config.path.endsWith('/attributes');
    function value(row: Record<string, unknown>, key: string) { const v = row[key]; if (key === 'attributeId')
        return String((row.definition as {
            name?: string;
        } | undefined)?.name ?? 'Atributo no disponible'); if (key === 'parentId')
        return v ? '↳ Subcategoría' : 'Categoría raíz'; if (typeof v === 'boolean')
        return <Badge tone={v ? 'success' : 'neutral'}>{key === 'active' ? (v ? 'Activo' : 'Inactivo') : (v ? 'Sí' : 'No')}</Badge>; const field = config.fields.find(f => f.key === key); return String(field?.options?.[String(v)] ?? v ?? '—'); }
    const actions = <Button onClick={() => setEditing(null)}>+ Crear {config.singular}</Button>;
    return <><PageHeader title={config.title} description={compact ? undefined : 'Gestioná los datos y su disponibilidad en el catálogo.'} actions={actions}/><Toast message={message}/><Card><div className="list-toolbar"><SearchInput aria-label={'Buscar ' + config.title.toLowerCase()} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/></div><AsyncState {...state} retry={state.reload}/>{state.data && !state.loading && <>{state.data.data.length ? <DataTable rows={state.data.data} rowKey={r => String(r.id)} caption={config.title} columns={[...config.columns.map(c => ({ label: c.label, render: (r: Record<string, unknown>) => value(r, c.key) })), { label: 'Acciones', render: r => <div className="actions"><Button className="button-quiet" onClick={() => setEditing(r)}>Editar</Button>{onExtra && r.dataType === 'OPTION' && <Button className="button-quiet" onClick={() => onExtra(r)}>Opciones</Button>}<Button className="button-danger" onClick={() => { setRemoving(r); setError(''); }}>Eliminar</Button></div> }]}/> : <div className="admin-empty"><h2>No hay registros</h2><p>Creá un registro o cambiá la búsqueda.</p></div>}<Pagination {...state.data.meta} onPage={setPage}/></>}</Card><Dialog open={editing !== undefined} title={(editing ? 'Editar ' : 'Crear ') + config.singular} onClose={() => { if (window.confirm('¿Cerrar el formulario? Se perderán los cambios sin guardar.'))
        setEditing(undefined); }}>{editing !== undefined && <ResourceForm key={String(editing?.id ?? 'new')} config={config} row={editing ?? undefined} onCancel={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); setMessage('Cambios guardados.'); state.reload(); }}/>}</Dialog><Dialog open={!!removing} title={'Eliminar ' + config.singular} onClose={() => { if (!busy)
        setRemoving(null); }}><p>¿Eliminar este registro? Si tiene referencias, el servidor impedirá el borrado.</p>{error && <p className="notice notice-error" role="alert">{error}</p>}<div className="actions"><Button className="button-secondary" disabled={busy} onClick={() => setRemoving(null)}>Cancelar</Button><Button className="button-danger" disabled={busy} onClick={async () => { if (!removing)
        return; setBusy(true); try {
        await request(config.path + '/' + String(removing[association ? 'attributeId' : 'id']), { method: 'DELETE' });
        setRemoving(null);
        setMessage('Registro eliminado.');
        state.reload();
    }
    catch (e) {
        setError(errorMessage(e));
    }
    finally {
        setBusy(false);
    } }}>{busy ? 'Eliminando…' : 'Eliminar'}</Button></div></Dialog></>;
}
