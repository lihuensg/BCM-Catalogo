import { ApiFailure } from './errors';
export async function request<T>(path: string, options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
} = {}): Promise<T> {
    let response: Response;
    try {
        response = await fetch('/api/admin-proxy' + path, { method: options.method ?? 'GET', credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-BCM-Admin': '1' }, ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}), signal: options.signal ?? AbortSignal.timeout(20000) });
    }
    catch (error) {
        if (options.signal?.aborted)
            throw error;
        throw new ApiFailure('NETWORK_ERROR');
    }
    if (!response.ok) {
        let payload;
        try {
            payload = await response.json();
        }
        catch {
            payload = {};
        }
        const failure = new ApiFailure(payload.error?.code ?? 'INTERNAL_ERROR', response.status, payload.error?.details ?? {});
        if (response.status === 401 && path != '/auth/login' && typeof window !== 'undefined') {
            window.dispatchEvent(new Event('bcm:session-expired'));
            window.location.replace('/login');
        }
        throw failure;
    }
    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
export function queryString(query: Record<string, string | number | boolean | undefined>) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(query))
    if (value !== undefined && value !== '')
        params.set(key, String(value)); return params.toString(); }
