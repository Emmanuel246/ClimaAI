import { Router } from 'express';
import { completeChallenge, getRewards } from '../controllers/gamification.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.post('/complete', auth(), completeChallenge);
router.get('/rewards', auth(), getRewards);
export default router;
