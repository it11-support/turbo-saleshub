import { defaultLimiter } from '@/utils/limiter.js';
import { createVisitSchedule, generateScheduleByRules, getScheduleByDate } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/create', defaultLimiter, createVisitSchedule)
router.get('/', getScheduleByDate);
router.post('/generate', defaultLimiter, generateScheduleByRules);

export default router;
