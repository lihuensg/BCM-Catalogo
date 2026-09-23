import 'server-only';
import type { ApiSuccess, BannerPlacement, PageResponse, PublicBannerDto, PublicBrandDto, PublicCategoryDto, PublicHomeDto, PublicProductDetailDto, PublicProductListDto, PublicProductListQuery, PublicSettingsDto } from '@bcm/shared';
const baseUrl=process.env.API_BASE_URL?.replace(/\/$/,''); const revalidate=300;
export class PublicNotFoundError extends Error {}
async function data<T>(path:string,tags:string[]):Promise<T>{if(!baseUrl)throw new Error('PUBLIC_API_UNAVAILABLE');const r=await fetch(baseUrl+path,{headers:{Accept:'application/json'},next:{revalidate,tags}});if(r.status===404)throw new PublicNotFoundError();if(!r.ok)throw new Error('PUBLIC_API_UNAVAILABLE');return (await r.json() as ApiSuccess<T>).data;}
function qs(q:PublicProductListQuery){const p=new URLSearchParams();for(const [k,v] of Object.entries(q))if(v!==undefined&&v!==null&&v!=='')p.set(k,String(v));return p.toString()?'?'+p.toString():'';}
export async function getHome(){try{return await data<PublicHomeDto>('/public/home',['public-home']);}catch{return null;}}
export async function getSettings(){try{return await data<PublicSettingsDto|null>('/public/settings',['public-settings']);}catch{return null;}}
export async function getCategories(){try{return await data<PublicCategoryDto[]>('/public/categories',['public-categories']);}catch{return [];}}
export async function getBrands(){try{return await data<PublicBrandDto[]>('/public/brands',['public-brands']);}catch{return [];}}
export async function getBanners(placement:BannerPlacement){try{return await data<PublicBannerDto[]>('/public/banners?placement='+encodeURIComponent(placement),['public-banners',placement==='HOME_HERO'||placement==='HOME_SECONDARY'?'public-home':'public-products']);}catch{return [];}}
export async function getProducts(q:PublicProductListQuery):Promise<PageResponse<PublicProductListDto>|null>{try{if(!baseUrl)return null;const r=await fetch(baseUrl+'/public/products'+qs(q),{headers:{Accept:'application/json'},next:{revalidate,tags:['public-products']}});return r.ok?await r.json() as PageResponse<PublicProductListDto>:null;}catch{return null;}}
export async function getProduct(slug:string){return data<{product:PublicProductDetailDto;related:PublicProductListDto[]}>('/public/products/'+encodeURIComponent(slug),['public-products','public-product-'+slug]);}
