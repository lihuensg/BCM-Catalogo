import type { Field } from './config';
export type FormValues = Record<string, string | boolean | number | null>;
export function editableValues(fields: Field[], row: Record<string, unknown>, defaults: FormValues) { return Object.fromEntries(fields.map(f => [f.key, typeof row[f.key] === 'string' || typeof row[f.key] === 'boolean' || typeof row[f.key] === 'number' || row[f.key] === null ? row[f.key] : defaults[f.key] ?? null])) as FormValues; }
export function formPayload(fields: Field[], values: FormValues) { return Object.fromEntries(fields.map(f => { let v = values[f.key]; if (typeof v === 'string') {
    v = v.trim();
    if (!v && !f.required)
        v = null;
} return [f.key, v]; })); }
export function masterErrors(values: FormValues) { const errors: Record<string, string> = {}; if (typeof values.slug === 'string' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug))
    errors.slug = 'Usá minúsculas, números y guiones.'; if (('ctaText' in values) && !!values.ctaText !== !!values.ctaHref)
    errors.ctaHref = 'Completá texto y enlace juntos.'; if (values.startsAt && values.endsAt && String(values.startsAt) > String(values.endsAt))
    errors.endsAt = 'El fin no puede ser anterior al inicio.'; return errors; }
export function toLocalDate(value: string) { const date = new Date(value); if (Number.isNaN(date.getTime()))
    return ''; const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16); }
