'use client';
import { Button } from './button';
export function ErrorState({ reset }: {
    reset: () => void;
}) {
    return <div className="empty-state" role="alert"><h1>No pudimos cargar esta página</h1><p>Intentá nuevamente en unos momentos.</p><Button onClick={reset}>Volver a intentar</Button></div>;
}
