import { createVisitRules, syncVisitRules, visitRules } from '../controllers/index.js';
import { authMiddleware, roleMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/create', roleMiddleware('admin'), createVisitRules);
router.get('/', visitRules);
router.post('/sync', syncVisitRules);

export default router;
