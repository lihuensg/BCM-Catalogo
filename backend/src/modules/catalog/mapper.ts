import type {
    PublicBannerDto,
    PublicBrandDto,
    PublicCategoryDto,
    PublicProductDetailDto,
    PublicProductListDto,
    PublicSettingsDto
} from '@bcm/shared';
import type { Banner, SiteSettings } from '../../generated/prisma/client.js';
import type { PublicProductDetailRow, PublicProductRow } from './repository.js';

export function publicProductDto(row: PublicProductRow): PublicProductListDto {
    const visiblePrice = row.showPrice;
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        shortDescription: row.shortDescription,
        category: row.category,
        brand: row.brand,
        price: visiblePrice ? row.price?.toFixed(2) ?? null : null,
        compareAtPrice: visiblePrice ? row.compareAtPrice?.toFixed(2) ?? null : null,
        showPrice: row.showPrice,
        saleMode: row.saleMode,
        availability: row.availability,
        featured: row.featured,
        onSale: row.onSale,
        newArrival: row.newArrival,
        publishedAt: row.publishedAt!.toISOString(),
        thumbnail: row.images[0] ?? null
    };
}

function attributeValue(row: PublicProductDetailRow['attributeValues'][number]): string {
    switch (row.dataType) {
        case 'TEXT': return row.textValue ?? '';
        case 'NUMBER': return row.numberValue?.toString() ?? '';
        case 'BOOLEAN': return row.booleanValue === true ? 'Sí' : row.booleanValue === false ? 'No' : '';
        case 'OPTION': return row.option?.label ?? '';
    }
}

export function publicProductDetailDto(row: PublicProductDetailRow): PublicProductDetailDto {
    const base = publicProductDto(row);
    return {
        ...base,
        sku: row.sku,
        fullDescription: row.fullDescription,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        images: row.images,
        attributes: row.attributeValues.map(value => ({
            id: value.attribute.id,
            name: value.attribute.name,
            slug: value.attribute.slug,
            dataType: value.attribute.dataType,
            unit: value.attribute.unit,
            value: attributeValue(value)
        })).filter(attribute => attribute.value !== '')
    };
}

export function publicCategoryDto(row: {
    id: string; name: string; slug: string; description: string | null; imageUrl: string | null; parentId: string | null; sortOrder: number;
    _count: { products: number };
}): PublicCategoryDto {
    return { id: row.id, name: row.name, slug: row.slug, description: row.description, imageUrl: row.imageUrl, parentId: row.parentId, sortOrder: row.sortOrder, productCount: row._count.products };
}

export function publicBrandDto(row: {
    id: string; name: string; slug: string; description: string | null; logoUrl: string | null;
    _count: { products: number };
}): PublicBrandDto {
    return { id: row.id, name: row.name, slug: row.slug, description: row.description, logoUrl: row.logoUrl, productCount: row._count.products };
}

export function publicBannerDto(row: Banner): PublicBannerDto {
    return { id: row.id, title: row.title, subtitle: row.subtitle, imageUrl: row.imageUrl, mobileImageUrl: row.mobileImageUrl, ctaText: row.ctaText, ctaHref: row.ctaHref, placement: row.placement, sortOrder: row.sortOrder };
}

export function publicSettingsDto(row: SiteSettings): PublicSettingsDto {
    return {
        siteName: row.siteName,
        whatsappNumber: row.whatsappNumber,
        whatsappMessageTemplate: row.whatsappMessageTemplate,
        instagramUrl: row.instagramUrl,
        heroTitle: row.heroTitle,
        heroSubtitle: row.heroSubtitle,
        defaultSeoTitle: row.defaultSeoTitle,
        defaultSeoDescription: row.defaultSeoDescription,
        defaultOgImageUrl: row.defaultOgImageUrl
    };
}
