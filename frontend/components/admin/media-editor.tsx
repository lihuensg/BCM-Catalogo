'use client';
import Image from 'next/image';
import { useState } from 'react';
import type { ProductGalleryImageInput } from '@bcm/shared';
import { Input, FormField, Checkbox } from '@/components/ui/fields';
import { Button } from '@/components/ui/button';
export function MediaPreview({ url, alt }: {
    url: string | null | undefined;
    alt: string;
}) { const [failed, setFailed] = useState(false); let valid = false; try {
    const parsed = new URL(url ?? '');
    valid = ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password;
}
catch {
    valid = false;
} return <div className="media-preview">{valid && !failed ? <Image src={url!} alt={alt} width={120} height={120} unoptimized referrerPolicy="no-referrer" onError={() => setFailed(true)}/> : <span role="img" aria-label="Sin imagen">▧</span>}</div>; }
export function MediaEditor({ images, onChange }: {
    images: ProductGalleryImageInput[];
    onChange: (images: ProductGalleryImageInput[]) => void;
}) { const patch = (index: number, value: Partial<ProductGalleryImageInput>) => onChange(images.map((image, i) => i === index ? { ...image, ...value } : image)); return <div className="stack"><p className="muted">Agregá hasta 30 imágenes por URL. Al quitar la principal, elegí otra si corresponde.</p>{images.map((image, index) => <div className="media-row" key={image.id ?? index}><MediaPreview key={image.url} url={image.url} alt={image.altText}/><div className="form-grid"><FormField label={'URL de imagen ' + (index + 1)} required><Input type="url" value={image.url} required onChange={e => patch(index, { url: e.target.value })}/></FormField><FormField label={'Texto alternativo ' + (index + 1)} required><Input value={image.altText} maxLength={300} required onChange={e => patch(index, { altText: e.target.value })}/></FormField><FormField label={'Orden de imagen ' + (index + 1)}><Input type="number" min={0} max={2147483647} value={image.sortOrder ?? 0} onChange={e => patch(index, { sortOrder: Number(e.target.value) })}/></FormField><Checkbox label="Imagen principal" checked={image.isPrimary ?? false} onChange={e => onChange(images.map((row, i) => ({ ...row, isPrimary: i === index ? e.target.checked : false })))}/></div><Button className="button-danger" onClick={() => { if (window.confirm('¿Quitar esta imagen de la galería?'))
    onChange(images.filter((_, i) => i !== index)); }}>Quitar</Button></div>)}<Button className="button-secondary" disabled={images.length >= 30} onClick={() => onChange([...images, { url: '', altText: '', sortOrder: images.length, isPrimary: false }])}>+ Agregar imagen</Button></div>; }
