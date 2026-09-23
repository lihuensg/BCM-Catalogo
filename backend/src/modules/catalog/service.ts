import type { PrismaClient } from '../../generated/prisma/client.js';
import { DomainError } from '../../shared/domain-error.js';
import { pageResult } from '../../shared/pagination.js';
import { catalogRepository } from './repository.js';
import { publicProductsQuery } from './schema.js';
import { publicBannerDto, publicBrandDto, publicCategoryDto, publicProductDetailDto, publicProductDto, publicSettingsDto } from './mapper.js';

export function catalogService(db: PrismaClient) {
    const repo = catalogRepository(db);
    return {
        async list(input: unknown) {
            const query = publicProductsQuery.parse(input);
            const result = await repo.listProducts(query);
            return pageResult(result.data.map(publicProductDto), result.total, query);
        },
        async product(slug: string) {
            const row = await repo.productBySlug(slug);
            if (!row) throw new DomainError('PRODUCT_NOT_FOUND', 'Producto no encontrado');
            const related = await repo.relatedProducts(row.category.id, row.id);
            return { product: publicProductDetailDto(row), related: related.map(publicProductDto) };
        },
        async categories() {
            return (await repo.categories()).map(publicCategoryDto);
        },
        async brands() {
            return (await repo.brands()).map(publicBrandDto);
        },
        async settings() {
            const row = await repo.settings();
            return row ? publicSettingsDto(row) : null;
        },
        async banners(placement: 'HOME_HERO' | 'HOME_SECONDARY' | 'CATALOG_TOP') {
            return (await repo.banners(placement, new Date())).map(publicBannerDto);
        },
        async home() {
            const now = new Date();
            const [settings, hero, secondary, categories, brands, featured, offers, newArrivals] = await Promise.all([
                repo.settings(),
                repo.banners('HOME_HERO', now),
                repo.banners('HOME_SECONDARY', now),
                repo.categories(8),
                repo.brands(12),
                repo.homeProducts('featured'),
                repo.homeProducts('onSale'),
                repo.homeProducts('newArrival')
            ]);
            return {
                settings: settings ? publicSettingsDto(settings) : null,
                heroBanners: hero.map(publicBannerDto),
                secondaryBanners: secondary.map(publicBannerDto),
                categories: categories.map(publicCategoryDto),
                brands: brands.map(publicBrandDto),
                featured: featured.map(publicProductDto),
                offers: offers.map(publicProductDto),
                newArrivals: newArrivals.map(publicProductDto)
            };
        }
    };
}
