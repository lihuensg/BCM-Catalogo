import type { DashboardDto } from '@bcm/shared';
import type { dashboardRepository } from './repository.js';
export function dashboardService(repo: ReturnType<typeof dashboardRepository>) {
    return { async get(): Promise<DashboardDto> {
            const [total, active, outOfStock, madeToOrder, onSale, featured, categories, brands, recent, withoutImage, withoutVisiblePrice, inactive] = await Promise.all([
                repo.count(), repo.count({ active: true }), repo.count({ availability: 'OUT_OF_STOCK' }), repo.count({ saleMode: 'MADE_TO_ORDER' }), repo.count({ onSale: true }), repo.count({ featured: true }), repo.categories(), repo.brands(),
                repo.recent(), repo.recent({ images: { none: {} } }), repo.recent({ OR: [{ showPrice: false }, { price: null }] }), repo.recent({ active: false })
            ]);
            const map = (rows: typeof recent) => rows.map(r => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
            return { counts: { total, active, outOfStock, madeToOrder, onSale, featured, categories, brands }, recent: map(recent), withoutImage: map(withoutImage), withoutVisiblePrice: map(withoutVisiblePrice), inactive: map(inactive) };
        } };
}
