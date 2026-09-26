'use client';
import { useState, useSyncExternalStore } from 'react';
import { BrandLogo } from '@/components/shared/brand-logo';
import { Input, FormField } from '@/components/ui/fields';
import { Button } from '@/components/ui/button';
import { request } from '@/services/admin/client';
import { errorMessage } from '@/services/admin/errors';
export function LoginForm() { const [busy, setBusy] = useState(false), [error, setError] = useState(''); const hydrated=useSyncExternalStore(()=>()=>{},()=>true,()=>false); return <main className="login-page" id="contenido"><section className="login-card"><BrandLogo /><p className="eyebrow">ADMINISTRACIÓN</p><h1>Bienvenido a BCM</h1><p>Ingresá para gestionar tu catálogo.</p><form method="post" onSubmit={async (e) => { e.preventDefault(); if (busy)
    return; const form = e.currentTarget; setBusy(true); setError(''); const data = new FormData(form); try {
    await request('/auth/login', { method: 'POST', body: { email: data.get('email'), password: data.get('password') } });
    form.reset();
    window.location.replace('/');
}
catch (e) {
    setError(errorMessage(e));
    setBusy(false);
} }}><fieldset disabled={busy||!hydrated}><FormField label="Email" required><Input name="email" type="email" autoComplete="username" required maxLength={254}/></FormField><FormField label="Contraseña" required><Input name="password" type="password" autoComplete="current-password" required maxLength={256}/></FormField>{error && <div role="alert" className="notice notice-error">{error}</div>}<Button type="submit" disabled={busy||!hydrated}>{!hydrated?'Preparando acceso…':busy ? 'Ingresando…' : 'Ingresar al panel'}</Button></fieldset></form><small>Acceso exclusivo para administración.</small></section></main>; }
