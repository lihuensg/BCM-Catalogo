'use client';
import { useEffect, useState, useCallback } from 'react';
import { request } from '@/services/admin/client';
export function useResource<T>(path: string | null) {
    const [state, setState] = useState<{
        key: string;
        data?: T;
        error?: unknown;
    }>({ key: '' });
    const [revision, setRevision] = useState(0);
    const key = path + '#' + revision;
    useEffect(() => { const abort = new AbortController(); if (!path)
        return; request<T>(path, { signal: abort.signal }).then(data => { if (!abort.signal.aborted)
        setState({ key, data }); }).catch(error => { if (!abort.signal.aborted)
        setState({ key, error }); }); return () => abort.abort(); }, [path, key]);
    const reload = useCallback(() => setRevision(n => n + 1), []);
    return { data:state.key===key?state.data:undefined,error:state.key===key?state.error:undefined, loading: !!path && state.key !== key, reload };
}
