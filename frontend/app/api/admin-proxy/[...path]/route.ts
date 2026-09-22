import {permittedProxyPath,permittedMutation,boundedBody} from '@/services/admin/proxy-policy';
import type { NextRequest } from 'next/server';
import { apiBase } from '@/services/admin/server';
const failure = (status: number, code: string) => Response.json({ error: { code, message: 'Solicitud no disponible', details: {} } }, { status, headers: { 'Cache-Control': 'no-store' } });
async function proxy(request: NextRequest, context: {
    params: Promise<{
        path: string[];
    }>;
}) {
    const { path } = await context.params;
    if (!permittedProxyPath(path)) return failure(404,'NOT_FOUND');
    const mutation = !['GET', 'HEAD'].includes(request.method);
    if (mutation && !permittedMutation(request.headers.get('origin'),request.nextUrl.origin,request.headers.get('X-BCM-Admin'))) return failure(403,'CSRF_REJECTED');
    let body:string|undefined;try{body=mutation?await boundedBody(request):undefined;}catch{return failure(413,'PAYLOAD_TOO_LARGE');}
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const cookie = request.headers.get('cookie');
    if (cookie)
        headers.set('cookie', cookie);
    if (mutation) {
        headers.set('X-BCM-Admin', '1');
        headers.set('Origin', request.nextUrl.origin);
    }
    try {
        const upstream = await fetch(apiBase() + '/' + path.join('/') + request.nextUrl.search, { method: request.method, headers, ...(body !== undefined ? { body } : {}), cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(20000) });
        const output = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': 'application/json' });
        for (const cookie of upstream.headers.getSetCookie())
            output.append('Set-Cookie', cookie);
        const retry = upstream.headers.get('retry-after');
        if (retry)
            output.set('Retry-After', retry);
        return new Response(upstream.status === 204 ? null : await upstream.text(), { status: upstream.status, headers: output });
    }
    catch {
        return failure(502, 'NETWORK_ERROR');
    }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
