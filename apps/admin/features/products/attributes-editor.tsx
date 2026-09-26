'use client';
import type { ProductAttributeInput, ProductAttributeDefinitionDto } from '@bcm/shared';
import { Input, FormField, Switch, Checkbox } from '@/components/ui/fields';
import { RemoteSelect } from '@/components/admin/remote-select';
import { replaceAttribute } from './model';
export function AttributesEditor({ definitions, values, onChange, optionLabels = {} }: {
    definitions: ProductAttributeDefinitionDto[];
    values: ProductAttributeInput[];
    onChange: (values: ProductAttributeInput[]) => void;
    optionLabels?: Record<string, string>;
}) {
    return <div className="form-grid">{definitions.map(({ attributeId, required, definition: d }) => {
            const value = values.find(v => v.attributeId === attributeId);
            const set = (v: ProductAttributeInput | null) => onChange(replaceAttribute(values, attributeId, v));
            const label = d.name + (d.unit ? ' (' + d.unit + ')' : '') + (required ? ' · Requerido al publicar' : '');
            if (d.dataType === 'OPTION')
                return <RemoteSelect key={attributeId} path={'/admin/attributes/' + attributeId + '/options'} label={label} value={value?.dataType === 'OPTION' ? value.optionId : ''} selectedLabel={optionLabels[attributeId]} onChange={id => set(id ? { attributeId, dataType: 'OPTION', optionId: id } : null)}/>;
            if (d.dataType === 'BOOLEAN')
                return <div className="boolean-attribute" key={attributeId}><span className="field-label">{label}</span><Checkbox label="Definir valor" checked={!!value} onChange={e => set(e.target.checked ? { attributeId, dataType: 'BOOLEAN', booleanValue: false } : null)}/><Switch label={value?.dataType === 'BOOLEAN' && value.booleanValue ? 'Sí' : 'No'} disabled={!value} checked={value?.dataType === 'BOOLEAN' && value.booleanValue} onChange={e => set({ attributeId, dataType: 'BOOLEAN', booleanValue: e.target.checked })}/></div>;
            return <FormField key={attributeId} label={label}><Input type={d.dataType === 'NUMBER' ? 'number' : 'text'} step={d.dataType === 'NUMBER' ? '0.000001' : undefined} maxLength={10000} value={value?.dataType === 'TEXT' ? value.textValue : value?.dataType === 'NUMBER' ? value.numberValue : ''} onChange={e => set(e.target.value ? (d.dataType === 'NUMBER' ? { attributeId, dataType: 'NUMBER', numberValue: e.target.value } : { attributeId, dataType: 'TEXT', textValue: e.target.value }) : null)}/></FormField>;
        })}{!definitions.length && <p className="muted">Esta categoría no tiene especificaciones activas.</p>}</div>;
}
