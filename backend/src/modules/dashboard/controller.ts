import type {RequestHandler} from 'express';
import {emptyQuery} from '../../shared/http.js';
import type {dashboardService} from './service.js';
export function dashboardController(service:ReturnType<typeof dashboardService>){const get:RequestHandler=async(req,res)=>{emptyQuery.parse(req.query);res.json({data:await service.get(),meta:{}});};return {get};}
