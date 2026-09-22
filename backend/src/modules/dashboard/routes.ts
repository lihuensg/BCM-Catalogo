import {Router} from 'express';
import {dashboardController} from './controller.js';
export function dashboardRouter(...args:Parameters<typeof dashboardController>){const router=Router();router.get('/',dashboardController(...args).get);return router;}
