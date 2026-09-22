import { Router } from 'express';
import { crudRoutes } from '../../shared/crud-controller.js';
import { attributeController } from './controller.js';
export function attributeRoutes(...args: Parameters<typeof attributeController>) {
    const c = attributeController(...args), router = Router();
    router.get('/categories/:categoryId/product-attributes',c.productDefinitions);
    router.get('/attributes/:attributeId/options', c.options);
    router.post('/attributes/:attributeId/options', c.optionCreate);
    router.get('/attributes/:attributeId/options/:id', c.optionGet);
    router.patch('/attributes/:attributeId/options/:id', c.optionUpdate);
    router.delete('/attributes/:attributeId/options/:id', c.optionRemove);
    router.get('/categories/:categoryId/attributes', c.associations);
    router.post('/categories/:categoryId/attributes', c.associationCreate);
    router.get('/categories/:categoryId/attributes/:attributeId', c.associationGet);
    router.patch('/categories/:categoryId/attributes/:attributeId', c.associationUpdate);
    router.delete('/categories/:categoryId/attributes/:attributeId', c.associationRemove);
    router.use('/attributes', crudRoutes(c));
    return router;
}
