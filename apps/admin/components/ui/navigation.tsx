'use client';
import type { ReactNode } from 'react';
import { Button } from './button';
import { Select } from './fields';
export function IconButton(props: Parameters<typeof Button>[0] & {
    'aria-label': string;
}) { return <Button {...props} className={'icon-button ' + (props.className ?? '')}/>; }
export function Pagination({ page, totalPages, total, onPage }: {
    page: number;
    totalPages: number;
    total: number;
    onPage: (page: number) => void;
}) { return <nav className="pagination" aria-label="Paginación"><span>{total} registros · Página {page} de {Math.max(1, totalPages)}</span><div className="actions"><Button className="button-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button><Button className="button-secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Siguiente</Button></div></nav>; }
export function Tabs({ items, value, onChange }: {
    items: {
        id: string;
        label: string;
    }[];
    value: string;
    onChange: (value: string) => void;
}) { return <div className="tabs" role="tablist" onKeyDown={e => { if (!['ArrowLeft', 'ArrowRight'].includes(e.key))
    return; e.preventDefault(); const index = items.findIndex(item => item.id === value); const next = items[(index + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length]; if (next) {
    onChange(next.id);
    (e.currentTarget.querySelectorAll('button')[(index + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length] as HTMLButtonElement)?.focus();
} }}>{items.map(item => <button key={item.id} type="button" role="tab" aria-selected={value === item.id} tabIndex={value === item.id ? 0 : -1} onClick={() => onChange(item.id)}>{item.label}</button>)}</div>; }
export function Dropdown({ label, children }: {
    label: string;
    children: ReactNode;
}) { return <details className="dropdown"><summary>{label}</summary><div>{children}</div></details>; }
export function PageSize({ value, onChange }: {
    value: number;
    onChange: (value: number) => void;
}) { return <Select aria-label="Registros por página" value={value} onChange={e => onChange(Number(e.target.value))}>{[20, 50, 100].map(n => <option key={n} value={n}>{n} por página</option>)}</Select>; }
