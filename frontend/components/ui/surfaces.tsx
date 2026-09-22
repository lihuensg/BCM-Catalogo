import Link from 'next/link';
import type { ReactNode } from 'react';
export function Badge({ children, tone = 'neutral' }: {
    children: ReactNode;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) { return <span className={'badge badge-' + tone}>{children}</span>; }
export function Card({ children, title, description }: {
    children: ReactNode;
    title?: string | undefined;
    description?: string | undefined;
}) { return <section className="card">{title && <header className="section-heading"><h2>{title}</h2>{description && <p>{description}</p>}</header>}{children}</section>; }
export function PageHeader({ title, description, actions }: {
    title: string;
    description?: string | undefined;
    actions?: ReactNode;
}) { return <header className="page-heading"><div><p className="eyebrow">ADMINISTRACIÓN BCM</p><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="actions">{actions}</div>}</header>; }
export function Breadcrumb({ items }: {
    items: {
        label: string;
        href?: string | undefined;
    }[];
}) { return <nav aria-label="Ruta de navegación"><ol className="breadcrumb">{items.map((item, i) => <li key={i}>{item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}</ol></nav>; }
export function Skeleton() { return <div role="status" className="loading-state"><div className="skeleton"/><span>Cargando datos…</span></div>; }
export function Toast({ message }: {
    message: string;
}) { return message ? <div className="toast" role="status">{message}</div> : null; }
