'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { ApiSuccess, ProductAdminDetailDto, ProductPatchInput, SaleMode, Availability } from '@bcm/shared';
import { request } from '@/services/admin/client';
import { ApiFailure, errorMessage, fieldErrors } from '@/services/admin/errors';
import { useUnsaved } from '@/hooks/use-unsaved';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select, FormField, Switch } from '@/components/ui/fields';
import { Card, PageHeader, Toast } from '@/components/ui/surfaces';
import { RemoteSelect } from '@/components/admin/remote-select';
import { AsyncState } from '@/components/admin/async-state';
import { MediaEditor } from '@/components/admin/media-editor';
import { AttributesEditor } from './attributes-editor';
import { useDefinitions } from './use-definitions';
import { blankProduct, productToInput, productErrors, availabilityLabels, saleLabels } from './model';
export function ProductForm({ initial }: {
    initial?: ProductAdminDetailDto;
}) {
    const [input, setInput] = useState<ProductPatchInput>(() => initial ? productToInput(initial) : blankProduct()), [baseline, setBaseline] = useState(() => JSON.stringify(input)), [busy, setBusy] = useState(false), [errors, setErrors] = useState<Record<string, string>>({}), [error, setError] = useState(''), [message, setMessage] = useState(''), [categoryLabel, setCategoryLabel] = useState(initial?.category.name ?? ''), [brandLabel, setBrandLabel] = useState(initial?.brand?.name ?? '');
    const definitions = useDefinitions(input.categoryId ?? '');
    const dirty = JSON.stringify(input) !== baseline;
    useUnsaved(dirty && !busy);
    const patch = (value: Partial<ProductPatchInput>) => setInput(current => ({ ...current, ...value }));
    const text = (key: 'name' | 'slug' | 'sku' | 'shortDescription' | 'fullDescription' | 'seoTitle' | 'seoDescription', label: string, max: number, required = false, multi = false) => { const props = { value: input[key] ?? '', maxLength: max, required, 'aria-invalid': !!errors[key], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => patch({ [key]: required ? e.target.value : e.target.value || null }) }; return <FormField label={label} required={required} error={errors[key]}>{multi ? <Textarea {...props}/> : <Input {...props}/>}</FormField>; };
    async function save(e: React.FormEvent) { e.preventDefault(); if (busy)
        return; const validation = productErrors(input, definitions.data); setErrors(validation); setError(''); setMessage(''); if (Object.keys(validation).length) {
        setError('Revisá los campos indicados antes de guardar.');
        return;
    } setBusy(true); try {
        const result = await request<ApiSuccess<ProductAdminDetailDto>>('/admin/products' + (initial ? '/' + initial.id : ''), { method: initial ? 'PATCH' : 'POST', body: input });
        const next = productToInput(result.data);
        setInput(next);
        setBaseline(JSON.stringify(next));
        setMessage('Producto guardado correctamente.');
        if (!initial)
            window.location.replace('/admin/productos/' + result.data.id + '/editar');
    }
    catch (e) {
        setError(errorMessage(e));
 setErrors(fieldErrors(e));
        if (e instanceof ApiFailure) {
            if (e.code === 'PRODUCT_SLUG_EXISTS')
                setErrors({ slug: e.message });
            if (e.code === 'PRODUCT_SKU_EXISTS')
                setErrors({ sku: e.message });
        }
    }
    finally {
        setBusy(false);
    } }
    const flags = (keys: ('showPrice' | 'onSale' | 'featured' | 'newArrival' | 'active')[], labels: string[]) => keys.map((key, i) => <Switch key={key} label={labels[i]!} checked={input[key] ?? false} onChange={e => patch({ [key]: e.target.checked })}/>);
    return <><PageHeader title={initial ? 'Editar producto' : 'Nuevo producto'} description={initial ? initial.name : 'Completá los datos y guardá un borrador o publicá el producto.'} actions={<Link className="button button-secondary" href="/admin/productos">Volver a productos</Link>}/><Toast message={message}/><form className="form-sections" onSubmit={save}><fieldset disabled={busy}><Card title="Información básica"><div className="form-grid">{text('name', 'Nombre', 200, true)}{text('slug', 'Slug', 220, true)}{text('sku', 'SKU', 100)}<div className="full-width">{text('shortDescription', 'Descripción breve', 500, true, true)}</div><div className="full-width">{text('fullDescription', 'Descripción completa', 100000, false, true)}</div></div></Card><Card title="Categoría y marca" description="Las especificaciones corresponden a la categoría directa del producto."><div className="form-grid"><div><RemoteSelect path="/admin/categories" label="Categoría" value={input.categoryId ?? ''} selectedLabel={categoryLabel} required onChange={(id, label) => { if (id === input.categoryId)
        return; if ((input.attributeValues?.length ?? 0) > 0 && !window.confirm('Al cambiar de categoría se retirarán los valores actuales. Revisá las nuevas especificaciones antes de guardar. ¿Continuar?'))
        return; patch({ categoryId: id, attributeValues: [] }); setCategoryLabel(label); }}/>{errors.categoryId && <small role="alert" className="field-error">{errors.categoryId}</small>}</div><RemoteSelect path="/admin/brands" label="Marca (opcional)" value={input.brandId ?? ''} selectedLabel={brandLabel} onChange={(id, label) => { patch({ brandId: id || null }); setBrandLabel(label); }}/></div></Card><Card title="Precio y comercialización"><div className="form-grid"><div>{flags(['showPrice'], ['Mostrar precio públicamente'])}<p className="muted">{input.showPrice ? 'Si no conocés el importe, dejalo vacío.' : 'El importe se conserva como dato interno y no será visible al público.'}</p></div><FormField label="Precio actual" helper="Usá punto decimal. Dejá vacío si es desconocido." error={errors.price}><Input inputMode="decimal" value={input.price ?? ''} aria-invalid={!!errors.price} onChange={e => patch({ price: e.target.value || null })}/></FormField><div>{flags(['onSale'], ['Producto en oferta'])}<p className="muted">La oferta no modifica el precio ni activa descuentos automáticamente.</p></div><FormField label="Precio anterior" error={errors.compareAtPrice} helper="Debe superar al actual. Desactivar oferta conserva el valor anterior."><Input inputMode="decimal" disabled={!input.onSale} value={input.compareAtPrice ?? ''} onChange={e => patch({ compareAtPrice: e.target.value || null })}/>{input.compareAtPrice && !input.onSale && <Button className="button-quiet" onClick={() => patch({ compareAtPrice: null })}>Quitar precio anterior</Button>}</FormField><FormField label="Forma de comercialización"><Select value={input.saleMode} onChange={e => patch({ saleMode: e.target.value as SaleMode })}>{Object.entries(saleLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></FormField></div></Card><Card title="Disponibilidad"><FormField label="Estado de disponibilidad" error={errors.availability}><Select value={input.availability} onChange={e => patch({ availability: e.target.value as Availability })}>{Object.entries(availabilityLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></FormField></Card><Card title="Imágenes"><MediaEditor images={input.images ?? []} onChange={images => patch({ images })}/></Card><Card title="Especificaciones" description="Los valores requeridos son obligatorios solo para publicar."><AsyncState loading={definitions.loading} error={definitions.error} retry={definitions.reload}/>{!definitions.loading && !definitions.error && <AttributesEditor definitions={definitions.data} values={input.attributeValues ?? []} optionLabels={Object.fromEntries(initial?.attributeValues.filter(v => v.option).map(v => [v.attributeId, v.option!.label]) ?? [])} onChange={attributeValues => patch({ attributeValues })}/>} {errors.attributeValues && <p className="field-error" role="alert">{errors.attributeValues}</p>}</Card><Card title="Merchandising"><div className="form-grid">{flags(['featured', 'newArrival'], ['Destacado', 'Nuevo ingreso'])}<FormField label="Orden manual"><Input type="number" min={0} max={2147483647} value={input.sortOrder} onChange={e => patch({ sortOrder: Number(e.target.value) })}/></FormField></div></Card><Card title="SEO"><div className="form-grid">{text('seoTitle', 'Título SEO', 200)}{text('seoDescription', 'Descripción SEO', 500, false, true)}</div></Card><Card title="Publicación">{flags(['active'], ['Producto activo / publicado'])}<p className="muted">Al publicar se validan categoría, relaciones y especificaciones requeridas. Podés guardar un borrador sin completar todas las especificaciones.</p>{initial?.publishedAt && <small>Primera publicación: {new Date(initial.publishedAt).toLocaleString('es-AR')}</small>}</Card></fieldset>{error && <div role="alert" className="notice notice-error">{error}</div>}<div className="save-bar"><p>{dirty ? 'Tenés cambios sin guardar.' : 'Todos los cambios están guardados.'}</p><div className="actions"><Link className="button button-secondary" href="/admin/productos">Cancelar</Link><Button type="submit" disabled={busy || definitions.loading || !!definitions.error}>{busy ? 'Guardando…' : 'Guardar producto'}</Button></div></div></form></>;
}
