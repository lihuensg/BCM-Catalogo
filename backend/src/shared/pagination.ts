import { z } from 'zod';
export const queryBoolean = z.enum(['true', 'false']).transform(value => value === 'true').optional();
export function listSchema<const T extends readonly [
    string,
    ...string[]
]>(sorts: T, defaultSort: T[number]) {
    return z.strictObject({
        page: z.coerce.number().int().min(1).max(100000).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().trim().max(160).optional(),
        sort: z.enum(sorts).default(defaultSort),
        order: z.enum(['asc', 'desc']).default('asc')
    });
}
export interface PageQuery {
    page: number;
    pageSize: number;
    sort: string;
    order: 'asc' | 'desc';
    search?: string | undefined;
}
export function pageArgs(query: PageQuery) {
    return { skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ [query.sort]: query.order }, { id: query.order }] };
}
export function pageResult<T>(data: T[], total: number, query: PageQuery) {
    return { data, meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
}
