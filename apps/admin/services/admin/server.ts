import 'server-only';
import { cookies } from 'next/headers';
import type { AdminIdentity, ApiSuccess } from '@bcm/shared';
export function apiBase() { const value = process.env.API_BASE_URL; if (!value)
    throw new Error('API_BASE_URL no está configurada'); return value.replace(/\/$/, ''); }
export async function currentAdmin(): Promise<AdminIdentity | null> {
    const jar = await cookies();
    const value = jar.get('__Host-bcm_session') ?? jar.get('bcm_session');
    if (!value)
        return null;
    const response = await fetch(apiBase() + '/auth/me', { headers: { Cookie: value.name + '=' + value.value }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (response.status === 401)
        return null;
    if (!response.ok)
        throw new Error('No se pudo verificar la sesión');
    return ((await response.json()) as ApiSuccess<AdminIdentity>).data;
}
