'use client';
import { useEffect, useRef, useId } from 'react';
import type { ReactNode } from 'react';
import { Button } from './button';
export function Dialog({ open, onClose, title, children, drawer = false }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    drawer?: boolean;
}) { const ref = useRef<HTMLDialogElement>(null), id = useId(); useEffect(() => { const dialog = ref.current; if (open) {
    dialog?.showModal();
}
else
    dialog?.close(); return () => dialog?.close(); }, [open]); return <dialog ref={ref} aria-labelledby={id} className={drawer ? 'dialog drawer' : 'dialog'} onCancel={e => { e.preventDefault(); onClose(); }}><header className="dialog-heading"><h2 id={id}>{title}</h2><Button className="button-secondary" onClick={onClose} aria-label="Cerrar">×</Button></header>{children}</dialog>; }
export function Drawer(props: Omit<Parameters<typeof Dialog>[0], 'drawer'>) { return <Dialog {...props} drawer/>; }
