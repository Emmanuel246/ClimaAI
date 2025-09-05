import { Router } from 'express';
import { messageCoach } from '../controllers/coach.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.post('/message', auth(), messageCoach);
export default router;
