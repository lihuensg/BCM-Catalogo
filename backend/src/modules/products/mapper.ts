import type {ProductAdminListDto} from '@bcm/shared';
import type {ProductTableRow} from './repository.js';
import type { ProductListRow } from './repository.js';
import type { ProductAdminDto, ProductAdminDetailDto } from '@bcm/shared';
import type { productRepository } from './repository.js';
import { categoryDto } from '../categories/mapper.js';
import { brandDto } from '../brands/mapper.js';
export function productAdminDto(r: ProductListRow): ProductAdminDto {
    return {
        id: r.id, name: r.name, slug: r.slug, sku: r.sku, shortDescription: r.shortDescription, categoryId: r.categoryId, brandId: r.brandId,
        price: r.price?.toFixed(2) ?? null, compareAtPrice: r.compareAtPrice?.toFixed(2) ?? null, showPrice: r.showPrice, saleMode: r.saleMode, availability: r.availability,
        active: r.active, featured: r.featured, onSale: r.onSale, newArrival: r.newArrival, sortOrder: r.sortOrder, publishedAt: r.publishedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString()
    };
}
export function productAdminDetailDto(r: NonNullable<Awaited<ReturnType<ReturnType<typeof productRepository>['find']>>>): ProductAdminDetailDto {
    return {
        ...productAdminDto(r), fullDescription: r.fullDescription, seoTitle: r.seoTitle, seoDescription: r.seoDescription, primaryImageId: r.images.find(image => image.isPrimary)?.id ?? null, category: categoryDto(r.category), brand: r.brand ? brandDto(r.brand) : null,
        images: r.images.map(i => ({ id: i.id, url: i.url, altText: i.altText, isPrimary: i.isPrimary, sortOrder: i.sortOrder })),
        attributeValues: r.attributeValues.map(v => ({ attributeId: v.attributeId, dataType: v.dataType, textValue: v.textValue, numberValue: v.numberValue?.toString() ?? null, booleanValue: v.booleanValue, optionId: v.optionId, definition: { id: v.attribute.id, name: v.attribute.name, slug: v.attribute.slug, dataType: v.attribute.dataType, unit: v.attribute.unit, active: v.attribute.active, filterable: v.attribute.filterable }, option: v.option ? { id: v.option.id, label: v.option.label, value: v.option.value } : null }))
    };
}

export function productAdminListDto(row:ProductTableRow):ProductAdminListDto {return {...productAdminDto(row),categoryName:row.category.name,brandName:row.brand?.name??null,thumbnail:row.images[0]??null};}
