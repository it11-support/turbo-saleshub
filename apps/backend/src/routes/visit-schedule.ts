import { createVisitSchedule, generateScheduleByRules, getScheduleByDate } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/create', createVisitSchedule)
router.get('/', getScheduleByDate);
router.post('/generate', generateScheduleByRules);

export default router;
