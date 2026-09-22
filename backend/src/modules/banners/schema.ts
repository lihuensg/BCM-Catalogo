import { z } from 'zod';
import { BannerPlacement } from '../../generated/prisma/enums.js';
import { httpUrlSchema, optionalText, sortOrderSchema } from '../../shared/model-validation.js';
const ctaUrlSchema = z.union([
    httpUrlSchema,
    z.string().regex(/^\/(?!\/)[^\\\s]*$/).refine((value) => Array.from(value).every((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127))
]);
export const bannerFields = z.strictObject({
    title: optionalText(200), subtitle: optionalText(500),
    imageUrl: httpUrlSchema, mobileImageUrl: httpUrlSchema.nullable().default(null),
    ctaText: optionalText(100), ctaHref: ctaUrlSchema.nullable().default(null),
    placement: z.enum(BannerPlacement), active: z.boolean().default(false), sortOrder: sortOrderSchema,
    startsAt: z.date().nullable().default(null), endsAt: z.date().nullable().default(null)
});
export const bannerSchema = bannerFields.superRefine((banner, context) => {
    if (banner.startsAt && banner.endsAt && banner.endsAt < banner.startsAt) {
        context.addIssue({ code: 'custom', path: ['endsAt'], message: 'End must not precede start' });
    }
    if ((banner.ctaText === null) !== (banner.ctaHref === null)) {
        context.addIssue({ code: 'custom', path: ['ctaHref'], message: 'CTA text and URL must be configured together' });
    }
});
