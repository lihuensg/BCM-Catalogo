'use client';
import type { ApiSuccess, CategoryDto } from '@bcm/shared';
import { Input, Textarea, Select, FormField, Switch } from '@/components/ui/fields';
import { RemoteSelect } from '@/components/admin/remote-select';
import { MediaPreview } from '@/components/admin/media-editor';
import { request } from '@/services/admin/client';
import type { Field } from './config';
import { toLocalDate } from './form-model';
import type { FormValues } from './form-model';
export function ResourceFields({ fields, values, onChange, errors, id, editing = false, onError }: {
    fields: Field[];
    values: FormValues;
    onChange: (value: FormValues) => void;
    errors: Record<string, string>;
    id?: string | undefined;
    editing?: boolean | undefined;
    onError: (message: string) => void;
}) {
    const patch = (key: string, value: string | boolean | number | null) => onChange({ ...values, [key]: value });
    async function parentAllowed(parentId: string) { let next: string | null = parentId; const seen = new Set<string>(); while (next) {
        if (next === id || seen.has(next)) {
            onError('No podés elegir la propia categoría ni un descendiente como padre.');
            return false;
        }
        seen.add(next);
        next = (await request<ApiSuccess<CategoryDto>>('/admin/categories/' + next)).data.parentId;
    } return true; }
    return <div className="form-grid">{fields.map(field => {
            const value = values[field.key];
            if (field.type === 'boolean')
                return <Switch key={field.key} label={field.label} checked={value === true} onChange={e => patch(field.key, e.target.checked)}/>;
            if (field.type === 'remote')
                return <div key={field.key}><RemoteSelect path={field.path!} label={field.label} required={field.required} value={typeof value === 'string' ? value : ''} disabled={editing && field.key === 'attributeId'} exclude={field.key === 'parentId' && id ? [id] : []} onChange={async (selected) => { try {
                    if (field.key === 'parentId' && selected && id && !await parentAllowed(selected))
                        return;
                    patch(field.key, selected || null);
                }
                catch {
                    onError('No pudimos verificar la jerarquía. Intentá nuevamente.');
                } }}/>{field.helper && <small>{field.helper}</small>}</div>;
            const props = { required: field.required, maxLength: field.max, 'aria-invalid': !!errors[field.key] };
            let control;
            if (field.type === 'select')
                control = <Select {...props} value={String(value ?? '')} onChange={e => patch(field.key, e.target.value)}>{Object.entries(field.options ?? {}).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</Select>;
            else if (field.type === 'textarea')
                control = <Textarea {...props} value={String(value ?? '')} onChange={e => patch(field.key, e.target.value || null)}/>;
            else
                control = <Input {...props} type={field.type ?? 'text'} min={field.type === 'number' ? 0 : undefined} max={field.type === 'number' ? 2147483647 : undefined} value={field.type === 'datetime-local' && value ? toLocalDate(String(value)) : String(value ?? '')} onChange={e => patch(field.key, field.type === 'number' ? Number(e.target.value) : field.type === 'datetime-local' ? (e.target.value ? new Date(e.target.value).toISOString() : null) : e.target.value)}/>;
            return <div key={field.key} className={field.type === 'textarea' ? 'full-width' : undefined}><FormField label={field.label} required={field.required} helper={field.helper} error={errors[field.key]}>{control}</FormField>{['imageUrl', 'mobileImageUrl', 'logoUrl', 'defaultOgImageUrl'].includes(field.key) && value && <MediaPreview key={String(value)} url={String(value)} alt={String(values.name ?? values.title ?? 'Vista previa')}/>}</div>;
        })}</div>;
}
