import { defaultLimiter } from '@/utils/limiter.js';
import { createVisitRules, syncVisitRules, visitRules } from '../controllers/index.js';
import { authMiddleware, roleMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/create', roleMiddleware('admin'), defaultLimiter, createVisitRules);
router.get('/', visitRules);
router.post('/sync', defaultLimiter, syncVisitRules);

export default router;
