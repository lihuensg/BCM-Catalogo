'use client';
import { useState } from 'react';
import type { ApiSuccess, SettingsDto } from '@bcm/shared';
import { useResource } from '@/hooks/use-resource';
import { useUnsaved } from '@/hooks/use-unsaved';
import { request } from '@/services/admin/client';
import { errorMessage, fieldErrors } from '@/services/admin/errors';
import { AsyncState } from '@/components/admin/async-state';
import { PageHeader, Card, Toast } from '@/components/ui/surfaces';
import { Button } from '@/components/ui/button';
import { ResourceFields } from '../masters/resource-fields';
import { editableValues, formPayload } from '../masters/form-model';
import { settingsFields, settingsDefaults, settingsErrors } from './model';
function SettingsForm({ initial }: {
    initial: SettingsDto | null;
}) { const [values, setValues] = useState(() => initial ? editableValues(settingsFields, { ...initial }, settingsDefaults) : { ...settingsDefaults }), [baseline, setBaseline] = useState(() => JSON.stringify(values)), [busy, setBusy] = useState(false), [error, setError] = useState(''), [errors, setErrors] = useState<Record<string, string>>({}), [message, setMessage] = useState(''); useUnsaved(JSON.stringify(values) !== baseline && !busy); return <><Toast message={message}/>{!initial && <p className="notice">Todavía no hay configuración. Completá los datos del negocio para guardarla.</p>}<form onSubmit={async (e) => { e.preventDefault(); if (busy)
    return; const validation = settingsErrors(values); setErrors(validation); if (Object.keys(validation).length)
    return; setBusy(true); setError(''); try {
    await request('/admin/settings', { method: 'PUT', body: formPayload(settingsFields, values) });
    setBaseline(JSON.stringify(values));
    setMessage('Configuración guardada.');
}
catch (e) {
    setError(errorMessage(e));
 setErrors(fieldErrors(e));
}
finally {
    setBusy(false);
} }}><Card><fieldset disabled={busy}><ResourceFields fields={settingsFields} values={values} onChange={setValues} errors={errors} onError={setError}/></fieldset>{error && <p className="notice notice-error" role="alert">{error}</p>}<div className="form-actions actions"><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar configuración'}</Button></div></Card></form></>; }
export function SettingsPage() { const state = useResource<ApiSuccess<SettingsDto | null>>('/admin/settings'); return <><PageHeader title="Configuración" description="Identidad, canales de contacto y textos generales del catálogo."/><AsyncState {...state} retry={state.reload}/>{state.data && !state.loading && <SettingsForm initial={state.data.data}/>}</>; }
