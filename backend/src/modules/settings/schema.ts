import { z } from 'zod';
import { httpUrlSchema, nameSchema, optionalText } from '../../shared/model-validation.js';
const allowedPlaceholders = new Set(['productName', 'productUrl', 'sku', 'price']);
export const whatsappTemplateSchema = z.string().trim().min(1).max(2000).refine((value) => {
    const placeholders = [...value.matchAll(/\{\{([^{}]+)\}\}/g)];
    return placeholders.every((match) => allowedPlaceholders.has(match[1] ?? '')) &&
        !/[{}]/.test(value.replace(/\{\{[^{}]+\}\}/g, ''));
}, 'Unsupported or malformed WhatsApp placeholder');
export const siteSettingsSchema = z.strictObject({
    siteName: nameSchema,
    whatsappNumber: z.string().regex(/^[1-9]\d{6,14}$/).nullable().default(null),
    whatsappMessageTemplate: whatsappTemplateSchema.nullable().default(null),
    instagramUrl: httpUrlSchema.refine((value) => {
        const url = URL.parse(value);
        return url !== null && url.protocol === 'https:' && ['instagram.com', 'www.instagram.com'].includes(url.hostname);
    }, 'Expected an HTTPS Instagram URL').nullable().default(null),
    heroTitle: optionalText(200), heroSubtitle: optionalText(500),
    defaultSeoTitle: z.string().trim().min(1).max(200),
    defaultSeoDescription: z.string().trim().min(1).max(500),
    defaultOgImageUrl: httpUrlSchema.nullable().default(null)
}).refine((settings) => (settings.whatsappNumber === null) === (settings.whatsappMessageTemplate === null), {
    path: ['whatsappNumber'], message: 'Configure WhatsApp number and template together'
});
