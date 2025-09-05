import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.get('/profile', auth(), getProfile);
router.patch('/profile', auth(), updateProfile);
export default router;
