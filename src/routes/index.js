import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import climateRoutes from './climate.routes.js';
import forecastRoutes from './forecast.routes.js';
import symptomRoutes from './symptom.routes.js';
import coachRoutes from './coach.routes.js';
import gamificationRoutes from './gamification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/climate', climateRoutes);
router.use('/forecast', forecastRoutes);
router.use('/symptoms', symptomRoutes);
router.use('/coach', coachRoutes);
router.use('/game', gamificationRoutes);

export default router;
