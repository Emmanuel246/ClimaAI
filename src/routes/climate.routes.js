import { Router } from 'express';
import { getCurrent, getLatest } from '../controllers/climate.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.get('/current', auth(false), getCurrent);
router.get('/latest', auth(false), getLatest);
export default router;
