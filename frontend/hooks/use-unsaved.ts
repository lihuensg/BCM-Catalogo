'use client';
import { useEffect } from 'react';
export function useUnsaved(dirty: boolean) { useEffect(() => { if (!dirty)
    return; const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); }; const click = (e: MouseEvent) => { const anchor = (e.target as Element).closest('a[href]'); if (anchor && anchor.getAttribute('href') !== window.location.pathname && !window.confirm('Tenés cambios sin guardar. ¿Querés salir?')) {
    e.preventDefault();
    e.stopPropagation();
} }; const back = () => { if (!window.confirm('Tenés cambios sin guardar. ¿Querés salir?'))
    history.go(1); }; window.addEventListener('beforeunload', unload); document.addEventListener('click', click, true); window.addEventListener('popstate', back); return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', click, true); window.removeEventListener('popstate', back); }; }, [dirty]); }
