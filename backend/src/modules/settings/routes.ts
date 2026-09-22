import { Router } from 'express';
import { settingsController } from './controller.js';
export function settingsRouter(...args: Parameters<typeof settingsController>) { const c = settingsController(...args), r = Router(); r.get('/', c.get); r.put('/', c.put); return r; }
