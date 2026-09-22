import type { CookieOptions, Request } from 'express';
export function sessionCookie(production: boolean, ttlSeconds: number) {
    return {
        name: production ? '__Host-bcm_session' : 'bcm_session',
        options: { httpOnly: true, secure: production, sameSite: 'lax', path: '/', maxAge: ttlSeconds * 1000 } satisfies CookieOptions
    };
}
export function readSessionCookie(request: Request, name: string): string | undefined {
    const values = (request.headers.cookie ?? '').split(';').map(part => part.trim()).filter(part => part.startsWith(name + '='));
    if (values.length !== 1)
        return undefined;
    const value = values[0]?.slice(name.length + 1);
    return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : undefined;
}
