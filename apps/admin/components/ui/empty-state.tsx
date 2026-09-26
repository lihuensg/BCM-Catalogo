export function EmptyState({ title, children }: {
    title: string;
    children: React.ReactNode;
}) {
    return <div className="empty-state"><span className="status-dot" aria-hidden="true"/><h1>{title}</h1><p>{children}</p></div>;
}
