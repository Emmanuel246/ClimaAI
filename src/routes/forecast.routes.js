import { Router } from 'express';
import { getToday } from '../controllers/forecast.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.get('/today', auth(false), getToday);
export default router;
