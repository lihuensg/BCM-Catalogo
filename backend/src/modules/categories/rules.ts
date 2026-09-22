import { DomainError } from '../../shared/domain-error.js';
export function validateCategoryParent(id: string, parentId: string | null, tree: readonly {
    id: string;
    parentId: string | null;
}[]) {
    const parents = new Map(tree.map((node) => [node.id, node.parentId]));
    const seen = new Set([id]);
    let cursor = parentId;
    while (cursor !== null) {
        if (seen.has(cursor))
            throw new DomainError('CATEGORY_CYCLE', 'Category hierarchy cannot contain cycles');
        if (!parents.has(cursor))
            throw new DomainError('CATEGORY_NOT_FOUND', 'Parent category does not exist');
        seen.add(cursor);
        cursor = parents.get(cursor) ?? null;
    }
}
