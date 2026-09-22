export interface Field {
    key: string;
    label: string;
    type?: 'text' | 'textarea' | 'url' | 'number' | 'boolean' | 'select' | 'datetime-local' | 'remote';
    required?: boolean;
    max?: number;
    helper?: string;
    options?: Record<string, string>;
    path?: string;
}
export interface ResourceConfig {
    title: string;
    singular: string;
    path: string;
    fields: Field[];
    defaults: Record<string, string | boolean | number | null>;
    columns: {
        key: string;
        label: string;
    }[];
}
const name: Field = { key: 'name', label: 'Nombre', required: true, max: 160 };
const slug: Field = { key: 'slug', label: 'Slug', required: true, max: 180, helper: 'Minúsculas, números y guiones.' };
const active: Field = { key: 'active', label: 'Activo', type: 'boolean' };
const order: Field = { key: 'sortOrder', label: 'Orden', type: 'number' };
const description: Field = { key: 'description', label: 'Descripción', type: 'textarea', max: 20000 };
export const resources: Record<string, ResourceConfig> = {
    categorias: { title: 'Categorías', singular: 'categoría', path: '/admin/categories', fields: [name, slug, description, { key: 'imageUrl', label: 'Imagen URL', type: 'url' }, { key: 'parentId', label: 'Categoría padre', type: 'remote', path: '/admin/categories', helper: 'Dejá vacío para crear una categoría raíz.' }, order, active], defaults: { name: '', slug: '', description: null, imageUrl: null, parentId: null, sortOrder: 0, active: false }, columns: [{ key: 'name', label: 'Categoría' }, { key: 'slug', label: 'Slug' }, { key: 'parentId', label: 'Jerarquía' }, { key: 'sortOrder', label: 'Orden' }, { key: 'active', label: 'Estado' }] },
    marcas: { title: 'Marcas', singular: 'marca', path: '/admin/brands', fields: [name, slug, description, { key: 'logoUrl', label: 'Logo URL', type: 'url' }, active], defaults: { name: '', slug: '', description: null, logoUrl: null, active: false }, columns: [{ key: 'name', label: 'Marca' }, { key: 'slug', label: 'Slug' }, { key: 'active', label: 'Estado' }] },
    atributos: { title: 'Atributos', singular: 'atributo', path: '/admin/attributes', fields: [name, slug, { key: 'dataType', label: 'Tipo de dato', type: 'select', required: true, options: { TEXT: 'Texto', NUMBER: 'Número', BOOLEAN: 'Sí / No', OPTION: 'Opción' } }, { key: 'unit', label: 'Unidad', max: 40 }, { key: 'filterable', label: 'Filtrable', type: 'boolean' }, active], defaults: { name: '', slug: '', dataType: 'TEXT', unit: null, filterable: false, active: false }, columns: [{ key: 'name', label: 'Definición' }, { key: 'dataType', label: 'Tipo' }, { key: 'unit', label: 'Unidad' }, { key: 'filterable', label: 'Filtrable' }, { key: 'active', label: 'Estado' }] },
    banners: { title: 'Banners', singular: 'banner', path: '/admin/banners', fields: [{ key: 'title', label: 'Título', max: 200 }, { key: 'subtitle', label: 'Subtítulo', type: 'textarea', max: 500 }, { key: 'imageUrl', label: 'Imagen desktop URL', type: 'url', required: true }, { key: 'mobileImageUrl', label: 'Imagen mobile URL', type: 'url' }, { key: 'ctaText', label: 'Texto del botón', max: 100 }, { key: 'ctaHref', label: 'Enlace del botón', helper: 'URL HTTP(S) o ruta que comience con /.' }, { key: 'placement', label: 'Ubicación', type: 'select', required: true, options: { HOME_HERO: 'Principal de inicio', HOME_SECONDARY: 'Secundario de inicio', CATALOG_TOP: 'Encabezado del catálogo' } }, order, { key: 'startsAt', label: 'Fecha de inicio', type: 'datetime-local' }, { key: 'endsAt', label: 'Fecha de fin', type: 'datetime-local' }, active], defaults: { title: null, subtitle: null, imageUrl: '', mobileImageUrl: null, ctaText: null, ctaHref: null, placement: 'HOME_HERO', sortOrder: 0, startsAt: null, endsAt: null, active: false }, columns: [{ key: 'title', label: 'Banner' }, { key: 'placement', label: 'Ubicación' }, { key: 'sortOrder', label: 'Orden' }, { key: 'active', label: 'Estado' }] }
};
export function optionConfig(attributeId: string): ResourceConfig { return { title: 'Opciones', singular: 'opción', path: '/admin/attributes/' + attributeId + '/options', fields: [{ key: 'label', label: 'Nombre visible', required: true, max: 160 }, { key: 'value', label: 'Valor', required: true, max: 160 }, order], defaults: { label: '', value: '', sortOrder: 0 }, columns: [{ key: 'label', label: 'Nombre' }, { key: 'value', label: 'Valor' }, { key: 'sortOrder', label: 'Orden' }] }; }
export function associationConfig(categoryId: string): ResourceConfig { return { title: 'Asociaciones a categoría', singular: 'asociación', path: '/admin/categories/' + categoryId + '/attributes', fields: [{ key: 'attributeId', label: 'Definición de atributo', type: 'remote', path: '/admin/attributes', required: true }, { key: 'required', label: 'Requerido al publicar', type: 'boolean' }, order], defaults: { attributeId: '', required: false, sortOrder: 0 }, columns: [{ key: 'attributeId', label: 'Atributo' }, { key: 'required', label: 'Requerido' }, { key: 'sortOrder', label: 'Orden' }] }; }
