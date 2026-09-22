import { z } from 'zod';
import { editable } from '../../shared/http.js';
import { idSchema } from '../../shared/model-validation.js';
import { productFields, productImageSchema } from './schema.js';
export const galleryImageSchema = productImageSchema.extend({ id: idSchema.optional() });
export const patchSchema = editable(productFields.extend({ images: z.array(galleryImageSchema).max(30) }));
export type ProductPatch = z.output<typeof patchSchema>;
export type GalleryImage = z.output<typeof galleryImageSchema>;
