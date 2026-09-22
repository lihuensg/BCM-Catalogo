/** Public HTTP envelopes. Domain contracts are introduced with their endpoints. */
export interface ApiSuccess<T> {
    data: T;
    meta: Record<string, unknown>;
}
export interface ApiError {
    error: {
        code: string;
        message: string;
        details: Record<string, unknown>;
    };
}
/** Liveness only; this contract does not assert database readiness. */
export interface HealthStatus {
    status: 'ok';
}
export interface AdminIdentity {
    id: string;
    name: string;
    email: string;
}
export interface PageMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
export interface PageResponse<T> {
    data: T[];
    meta: PageMeta;
}
export interface AdminLoginInput {
    email: string;
    password: string;
}
export interface TimestampDto {
    id: string;
    createdAt: string;
    updatedAt: string;
}
export interface CategoryDto extends TimestampDto {
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    parentId: string | null;
    active: boolean;
    sortOrder: number;
}
export interface BrandDto extends TimestampDto {
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    active: boolean;
}
export type AttributeDataType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'OPTION';
export interface AttributeDto extends TimestampDto {
    name: string;
    slug: string;
    dataType: AttributeDataType;
    unit: string | null;
    active: boolean;
    filterable: boolean;
}
export interface AttributeOptionDto extends TimestampDto {
    attributeId: string;
    label: string;
    value: string;
    sortOrder: number;
}
export interface CategoryAttributeDto extends TimestampDto {
    categoryId: string;
    attributeId: string;
    required: boolean;
    sortOrder: number;
}
export type BannerPlacement = 'HOME_HERO' | 'HOME_SECONDARY' | 'CATALOG_TOP';
export interface BannerDto extends TimestampDto {
    title: string | null;
    subtitle: string | null;
    imageUrl: string;
    mobileImageUrl: string | null;
    ctaText: string | null;
    ctaHref: string | null;
    placement: BannerPlacement;
    active: boolean;
    sortOrder: number;
    startsAt: string | null;
    endsAt: string | null;
}
export interface SettingsDto extends TimestampDto {
    siteName: string;
    whatsappNumber: string | null;
    whatsappMessageTemplate: string | null;
    instagramUrl: string | null;
    heroTitle: string | null;
    heroSubtitle: string | null;
    defaultSeoTitle: string;
    defaultSeoDescription: string;
    defaultOgImageUrl: string | null;
}
export type SaleMode = 'IN_STOCK' | 'MADE_TO_ORDER';
export type Availability = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CHECK_AVAILABILITY' | 'MADE_TO_ORDER';
/** Authenticated admin only: contains internal prices even when showPrice=false. */
export interface ProductAdminDto extends TimestampDto {
    name: string;
    slug: string;
    sku: string | null;
    shortDescription: string;
    categoryId: string;
    brandId: string | null;
    price: string | null;
    compareAtPrice: string | null;
    showPrice: boolean;
    saleMode: SaleMode;
    availability: Availability;
    active: boolean;
    featured: boolean;
    onSale: boolean;
    newArrival: boolean;
    sortOrder: number;
    publishedAt: string | null;
}
export interface ProductAdminDetailDto extends ProductAdminDto {
    fullDescription:string|null;
    seoTitle:string|null;
    seoDescription:string|null;
    primaryImageId:string|null;
    category: CategoryDto;
    brand: BrandDto | null;
    images: {
        id: string;
        url: string;
        altText: string;
        isPrimary: boolean;
        sortOrder: number;
    }[];
    attributeValues: {
        attributeId: string;
        dataType: AttributeDataType;
        textValue: string | null;
        numberValue: string | null;
        booleanValue: boolean | null;
        optionId: string | null;
        definition:Pick<AttributeDto,'id'|'name'|'slug'|'dataType'|'unit'|'active'|'filterable'>;
        option:Pick<AttributeOptionDto,'id'|'label'|'value'>|null;
    }[];
}
export type CategoryCreateInput = Pick<CategoryDto, 'name' | 'slug'> & Partial<Omit<CategoryDto, keyof TimestampDto | 'name' | 'slug'>>;
export type CategoryPatchInput = Partial<CategoryCreateInput>;
export type BrandCreateInput = Pick<BrandDto, 'name' | 'slug'> & Partial<Omit<BrandDto, keyof TimestampDto | 'name' | 'slug'>>;
export type BrandPatchInput = Partial<BrandCreateInput>;
export type AttributeOptionInput = Pick<AttributeOptionDto, 'label' | 'value'> & Partial<Pick<AttributeOptionDto, 'sortOrder'>>;
export type AttributeCreateInput = Pick<AttributeDto, 'name' | 'slug' | 'dataType'> & Partial<Pick<AttributeDto, 'unit' | 'active' | 'filterable'>> & {
    options?: AttributeOptionInput[];
};
export type AttributePatchInput = Partial<Omit<AttributeCreateInput, 'options'>>;
export type CategoryAttributeInput = Pick<CategoryAttributeDto, 'attributeId'> & Partial<Pick<CategoryAttributeDto, 'required' | 'sortOrder'>>;
export type CategoryAttributePatchInput = Partial<Pick<CategoryAttributeDto, 'required' | 'sortOrder'>>;
export type BannerCreateInput = Pick<BannerDto, 'imageUrl' | 'placement'> & Partial<Omit<BannerDto, keyof TimestampDto | 'imageUrl' | 'placement'>>;
export type BannerPatchInput = Partial<BannerCreateInput>;
export type SettingsPutInput = Pick<SettingsDto, 'siteName' | 'defaultSeoTitle' | 'defaultSeoDescription'> & Partial<Omit<SettingsDto, keyof TimestampDto | 'siteName' | 'defaultSeoTitle' | 'defaultSeoDescription'>>;
export interface AdminListQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface ProductImageInput {url:string;altText:string;isPrimary?:boolean;sortOrder?:number}
export interface ProductGalleryImageInput extends ProductImageInput {id?:string}
export type ProductAttributeInput=
 |{attributeId:string;dataType:'TEXT';textValue:string}
 |{attributeId:string;dataType:'NUMBER';numberValue:string}
 |{attributeId:string;dataType:'BOOLEAN';booleanValue:boolean}
 |{attributeId:string;dataType:'OPTION';optionId:string};
/** publishedAt is read-only: assigned on first activation and retained on deactivation. */
export type ProductCreateInput=Pick<ProductAdminDto,'name'|'slug'|'shortDescription'|'categoryId'>
 &Partial<Omit<ProductAdminDto,keyof TimestampDto|'name'|'slug'|'shortDescription'|'categoryId'|'publishedAt'>>
 &{fullDescription?:string|null;seoTitle?:string|null;seoDescription?:string|null;images?:ProductImageInput[];attributeValues?:ProductAttributeInput[]};
/** Supplied arrays replace their whole collection; omitted arrays are preserved. */
export type ProductPatchInput=Partial<Omit<ProductCreateInput,'images'>>&{images?:ProductGalleryImageInput[]};
export interface ProductListQuery extends Omit<AdminListQuery,'sort'> {
 sort?:'name'|'slug'|'createdAt'|'updatedAt'|'publishedAt'|'price'|'sortOrder';
 categoryId?:string;brandId?:string;active?:boolean;availability?:Availability;saleMode?:SaleMode;
 featured?:boolean;onSale?:boolean;newArrival?:boolean;showPrice?:boolean;
}

export interface ProductAdminListDto extends ProductAdminDto {
 categoryName:string; brandName:string|null; thumbnail:{url:string;altText:string}|null;
}
export interface DashboardProduct {id:string;name:string;slug:string;active:boolean;updatedAt:string}
export interface DashboardDto {
 counts:{total:number;active:number;outOfStock:number;madeToOrder:number;onSale:number;featured:number;categories:number;brands:number};
 recent:DashboardProduct[];withoutImage:DashboardProduct[];withoutVisiblePrice:DashboardProduct[];inactive:DashboardProduct[];
}
export interface ProductAttributeDefinitionDto extends CategoryAttributeDto {definition:AttributeDto}
