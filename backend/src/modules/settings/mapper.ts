import type { SiteSettings } from '../../generated/prisma/client.js';
import type { SettingsDto } from '@bcm/shared';
export function settingsDto(r: SiteSettings): SettingsDto { return { id: r.id, siteName: r.siteName, whatsappNumber: r.whatsappNumber, whatsappMessageTemplate: r.whatsappMessageTemplate, instagramUrl: r.instagramUrl, heroTitle: r.heroTitle, heroSubtitle: r.heroSubtitle, defaultSeoTitle: r.defaultSeoTitle, defaultSeoDescription: r.defaultSeoDescription, defaultOgImageUrl: r.defaultOgImageUrl, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }; }
