import type { Banner } from '../../generated/prisma/client.js';
import type { BannerDto } from '@bcm/shared';
export function bannerDto(r: Banner): BannerDto { return { id: r.id, title: r.title, subtitle: r.subtitle, imageUrl: r.imageUrl, mobileImageUrl: r.mobileImageUrl, ctaText: r.ctaText, ctaHref: r.ctaHref, placement: r.placement, active: r.active, sortOrder: r.sortOrder, startsAt: r.startsAt?.toISOString() ?? null, endsAt: r.endsAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }; }
