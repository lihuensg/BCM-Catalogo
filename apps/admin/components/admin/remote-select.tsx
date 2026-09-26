'use client';
import { useState, useId } from 'react';
import type { PageResponse } from '@bcm/shared';
import { useResource } from '@/hooks/use-resource';
import { SearchInput, Select } from '@/components/ui/fields';
import { Button } from '@/components/ui/button';
import { AsyncState } from './async-state';
interface Option {
    id: string;
    name?: string | undefined;
    label?: string | undefined;
    active?: boolean | undefined;
    parentId?: string | null;
}
export function RemoteSelect({ path, label, value, onChange, selectedLabel, required, disabled, exclude = [] }: {
    path: string;
    label: string;
    value: string;
    onChange: (id: string, label: string) => void;
    selectedLabel?: string | undefined;
    required?: boolean | undefined;
    disabled?: boolean | undefined;
    exclude?: string[];
}) {
    const [search, setSearch] = useState(''), [page, setPage] = useState(1);
    const id = useId();
    const state = useResource<PageResponse<Option>>(path + (path.includes('?') ? '&' : '?') + new URLSearchParams({ search, page: String(page), pageSize: '20' }));
    const rows = state.data?.data ?? [];
    return <div className="remote-select"><div className="field-label"><label htmlFor={id}>{label}</label>{required && <span aria-hidden="true"> *</span>}</div><SearchInput aria-label={'Buscar ' + label.toLowerCase()} value={search} disabled={disabled} onChange={e => { setSearch(e.target.value); setPage(1); }}/><Select id={id} value={value} required={required} disabled={disabled} onChange={e => { const item = rows.find(r => r.id === e.target.value); onChange(e.target.value, item?.name ?? item?.label ?? ''); }}><option value="">Seleccionar…</option>{value && !rows.some(r => r.id === value) && <option value={value}>{selectedLabel || 'Selección actual'}</option>}{rows.map(row => <option key={row.id} value={row.id} disabled={exclude.includes(row.id)}>{row.name ?? row.label}{row.active === false ? ' (inactivo)' : ''}</option>)}</Select><AsyncState error={state.error} retry={state.reload}/>{state.loading && <small role="status">Cargando opciones…</small>}<div className="actions"><Button className="button-quiet" disabled={disabled || page <= 1 || state.loading} onClick={() => setPage(n => n - 1)}>Anterior</Button><small>Página {page} de {Math.max(1, state.data?.meta.totalPages ?? 1)}</small><Button className="button-quiet" disabled={disabled || state.loading || page >= (state.data?.meta.totalPages ?? 1)} onClick={() => setPage(n => n + 1)}>Más opciones</Button></div></div>;
}
