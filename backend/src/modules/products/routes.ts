import { Router } from 'express';
import { productController } from './controller.js';
export function productRouter(...args: Parameters<typeof productController>) {
    const c = productController(...args), r = Router();
    r.get('/', c.list);
    r.get('/:id', c.get);
    r.post('/', c.create);
    r.patch('/:id', c.update);
    r.delete('/:id', c.deactivate);
    return r;
}
