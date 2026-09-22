'use client';
import { useState } from 'react';
import { request } from '@/services/admin/client';
import { ApiFailure, errorMessage, fieldErrors } from '@/services/admin/errors';
import { useUnsaved } from '@/hooks/use-unsaved';
import { Button } from '@/components/ui/button';
import type { ResourceConfig } from './config';
import { ResourceFields } from './resource-fields';
import { editableValues, formPayload, masterErrors } from './form-model';
export function ResourceForm({ config, row, onSaved, onCancel }: {
    config: ResourceConfig;
    row?: Record<string, unknown> | undefined;
    onSaved: () => void;
    onCancel: () => void;
}) {
    const [values, setValues] = useState(() => row ? editableValues(config.fields, row, config.defaults) : { ...config.defaults }), [baseline] = useState(() => JSON.stringify(values)), [busy, setBusy] = useState(false), [error, setError] = useState(''), [errors, setErrors] = useState<Record<string, string>>({});
    const dirty = JSON.stringify(values) !== baseline;
    useUnsaved(dirty && !busy);
    const association = config.path.endsWith('/attributes') && config.path.includes('/categories/');
    const id = String(row?.[association ? 'attributeId' : 'id'] ?? '');
    return <form onSubmit={async (e) => { e.preventDefault(); if (busy)
        return; const validation = masterErrors(values); setErrors(validation); if (Object.keys(validation).length)
        return; setBusy(true); setError(''); const payload = formPayload(config.fields, values); if (row && association)
        delete payload.attributeId; try {
        await request(config.path + (row ? '/' + id : ''), { method: row ? 'PATCH' : 'POST', body: payload });
        onSaved();
    }
    catch (e) {
        setError(errorMessage(e));
 setErrors(fieldErrors(e));
        if (e instanceof ApiFailure && e.code.endsWith('SLUG_EXISTS'))
            setErrors({ slug: e.message });
    }
    finally {
        setBusy(false);
    } }}><fieldset disabled={busy}><ResourceFields fields={config.fields} values={values} onChange={setValues} errors={errors} id={id || undefined} editing={!!row} onError={setError}/>{values.dataType === 'OPTION' && !row && <p className="notice">Guardá la definición inactiva, agregá sus opciones y después activala.</p>}{error && <p role="alert" className="notice notice-error">{error}</p>}<div className="actions form-actions"><Button className="button-secondary" disabled={busy} onClick={() => { if (!dirty || window.confirm('¿Descartar los cambios sin guardar?'))
        onCancel(); }}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button></div></fieldset></form>;
}
