import type { Field } from '../masters/config';
import type { FormValues } from '../masters/form-model';
export const placeholders = ['productName', 'productUrl', 'sku', 'price'] as const;
export const settingsFields: Field[] = [{ key: 'siteName', label: 'Nombre del sitio', required: true, max: 160 }, { key: 'whatsappNumber', label: 'Número de WhatsApp', helper: 'Formato internacional: 7–15 dígitos, sin + ni espacios.' }, { key: 'whatsappMessageTemplate', label: 'Mensaje de WhatsApp', type: 'textarea', max: 2000, helper: placeholders.map(p => '{{' + p + '}}').join(' · ') }, { key: 'instagramUrl', label: 'Instagram', type: 'url', helper: 'URL HTTPS de instagram.com.' }, { key: 'heroTitle', label: 'Título principal', max: 200 }, { key: 'heroSubtitle', label: 'Subtítulo principal', type: 'textarea', max: 500 }, { key: 'defaultSeoTitle', label: 'Título SEO predeterminado', required: true, max: 200 }, { key: 'defaultSeoDescription', label: 'Descripción SEO predeterminada', type: 'textarea', required: true, max: 500 }, { key: 'defaultOgImageUrl', label: 'Imagen OG URL', type: 'url' }];
export const settingsDefaults: FormValues = Object.fromEntries(settingsFields.map(f => [f.key, f.required ? '' : null]));
export function settingsErrors(values: FormValues) { const errors: Record<string, string> = {}; const number = String(values.whatsappNumber ?? '').trim(), template = String(values.whatsappMessageTemplate ?? '').trim(); if (!!number !== !!template)
    errors.whatsappNumber = 'Completá el número y el mensaje juntos, o dejá ambos vacíos.'; if (number && !/^[1-9]\d{6,14}$/.test(number))
    errors.whatsappNumber = 'Usá entre 7 y 15 dígitos sin + ni espacios.'; const tokens = [...template.matchAll(/\{\{([^{}]+)\}\}/g)]; if (tokens.some(m => !placeholders.some(p => p === m[1])) || /[{}]/.test(template.replace(/\{\{[^{}]+\}\}/g, '')))
    errors.whatsappMessageTemplate = 'Usá únicamente los placeholders indicados, sin modificar las llaves.'; if (values.instagramUrl) {
    try {
        const u = new URL(String(values.instagramUrl));
        if (u.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(u.hostname) || u.username || u.password)
            errors.instagramUrl = 'Ingresá una URL HTTPS de Instagram.';
    }
    catch {
        errors.instagramUrl = 'Ingresá una URL válida.';
    }
} return errors; }
